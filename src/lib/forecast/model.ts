// 스포츠 승부 예측 — 예측 모델 v1 (순수 함수, DB·네트워크 없음)
// 백테스트(scripts/backtest.mts)와 운영 예측 생성이 같은 코드를 쓴다.
//
// 구성
//  A. 포아송 득점 모델: 리그별로 팀 공격력·수비력·홈 어드밴티지를 시간 감쇠 가중 최대우도로 추정
//  B. Elo: 모든 대회를 하나의 척도로. 챔스처럼 리그가 다른 팀끼리 붙을 때 기준이 된다
//  두 모델 모두 "스코어 확률표"를 만들고(Dixon-Coles 보정), 표를 섞어서 승/무/패·TOP 스코어를 낸다.

export interface MatchLite {
  id: number;
  comp: string;
  season: number;
  date: number; // epoch ms
  home: number;
  away: number;
  hg: number | null; // 90분 득점 (예정 경기는 null)
  ag: number | null;
}

export interface Params {
  /** 포아송: 시간 감쇠 반감기(일) */
  halfLife: number;
  /** 포아송: 팀 계수를 평균(1.0) 쪽으로 당기는 가상 경기 수 */
  prior: number;
  /** Dixon-Coles 저득점 보정 */
  rho: number;
  /** Elo */
  eloK: number;
  eloHome: number;
  /** Elo 차이 → 득점 배수: λ 배율 = 10^(diff / (2·eloGoal)) */
  eloGoal: number;
  /** 시즌이 바뀔 때 Elo 를 리그 기준값 쪽으로 당기는 비율 */
  eloRegress: number;
  /** 리그 경기에서 포아송 표의 비중 (나머지는 Elo 표). 같은 리그끼리가 아니면 0 */
  wPois: number;
  /** 포아송 비중을 다 주기 전 필요한 팀별 최근(가중) 경기 수 */
  minGames: number;
}

/** 운영 예측에 기록하는 모델 버전 — 파라미터를 바꾸면 올린다 */
export const MODEL_VERSION = "v1.0";

/**
 * 실제 데이터 백테스트로 고른 값 (2026-10-06, forecast-backtest run 37458205500)
 * 2023/24 워밍업 · 2024/25 튜닝 · 2025/26~ 홀드아웃 3,597경기:
 *   로그손실 1.074 → 0.998, 브라이어 0.650 → 0.596, 적중률 43.3% → 50.6% (기준선 → 모델)
 */
export const DEFAULT_PARAMS: Params = {
  halfLife: 365,
  prior: 3,
  rho: -0.1,
  eloK: 10,
  eloHome: 40,
  eloGoal: 350,
  eloRegress: 0.2,
  wPois: 0.7,
  minGames: 10,
};

/** 리그 첫 등장 팀의 Elo 시작값 (리그 수준 차이). 챔스 맞대결로 점점 보정된다 */
export const LEAGUE_ELO: Record<string, number> = {
  PL: 1620, PD: 1600, BL1: 1580, SA: 1580, FL1: 1550, PPL: 1520, DED: 1500, ELC: 1460, CLI: 1450,
};
const DEFAULT_ELO = 1500;
export const LEAGUES = new Set(["PL", "PD", "BL1", "SA", "FL1", "PPL", "DED", "ELC"]);

const DAY = 86400_000;
const MAXG = 10;

/* ───────────── 스코어 확률표 ───────────── */

const LOG_FACT = (() => {
  const a = [0];
  for (let i = 1; i <= MAXG + 1; i++) a.push(a[i - 1] + Math.log(i));
  return a;
})();

function poissonVec(l: number): number[] {
  const out: number[] = [];
  const ll = Math.log(Math.max(l, 1e-9));
  for (let k = 0; k <= MAXG; k++) out.push(Math.exp(k * ll - l - LOG_FACT[k]));
  return out;
}

function tau(h: number, a: number, lh: number, la: number, rho: number): number {
  if (h === 0 && a === 0) return 1 - lh * la * rho;
  if (h === 0 && a === 1) return 1 + lh * rho;
  if (h === 1 && a === 0) return 1 + la * rho;
  if (h === 1 && a === 1) return 1 - rho;
  return 1;
}

/** (MAXG+1)² 표, 합 1로 정규화 */
export function scoreMatrix(lh: number, la: number, rho: number): Float64Array {
  const ph = poissonVec(lh);
  const pa = poissonVec(la);
  const m = new Float64Array((MAXG + 1) * (MAXG + 1));
  let s = 0;
  for (let h = 0; h <= MAXG; h++)
    for (let a = 0; a <= MAXG; a++) {
      const v = Math.max(0, ph[h] * pa[a] * tau(h, a, lh, la, rho));
      m[h * (MAXG + 1) + a] = v;
      s += v;
    }
  for (let i = 0; i < m.length; i++) m[i] /= s;
  return m;
}

export function mixMatrices(a: Float64Array, b: Float64Array, wa: number): Float64Array {
  const m = new Float64Array(a.length);
  for (let i = 0; i < a.length; i++) m[i] = wa * a[i] + (1 - wa) * b[i];
  return m;
}

export interface Forecast {
  pH: number;
  pD: number;
  pA: number;
  expH: number;
  expA: number;
  top: { h: number; a: number; p: number }[];
}

export function summarize(m: Float64Array, topN = 5): Forecast {
  let pH = 0, pD = 0, pA = 0, eH = 0, eA = 0;
  const cells: { h: number; a: number; p: number }[] = [];
  for (let h = 0; h <= MAXG; h++)
    for (let a = 0; a <= MAXG; a++) {
      const p = m[h * (MAXG + 1) + a];
      if (h > a) pH += p;
      else if (h === a) pD += p;
      else pA += p;
      eH += h * p;
      eA += a * p;
      cells.push({ h, a, p });
    }
  cells.sort((x, y) => y.p - x.p);
  return { pH, pD, pA, expH: eH, expA: eA, top: cells.slice(0, topN) };
}

/* ───────────── A. 포아송 (리그별) ───────────── */

export interface PoissonFit {
  mu: number; // 원정팀 기준 평균 득점
  home: number; // 홈 배수
  att: Map<number, number>;
  def: Map<number, number>; // 실점 배수 (클수록 수비가 약함)
  games: Map<number, number>; // 팀별 가중 경기 수
}

/**
 * 가중 포아송 최대우도 (교대 갱신). λ_home = mu·home·att_h·def_a, λ_away = mu·att_a·def_h
 * prior: 팀 계수마다 "평균 상대와 평균 결과" 가상 경기 prior 개를 더해 1.0 쪽으로 당긴다.
 */
export function fitPoisson(matches: MatchLite[], asOf: number, halfLife: number, prior: number, iters = 40): PoissonFit | null {
  const rows: { h: number; a: number; hg: number; ag: number; w: number }[] = [];
  const lam = Math.LN2 / (halfLife * DAY);
  for (const m of matches) {
    if (m.date >= asOf || m.hg === null || m.ag === null) continue;
    const w = Math.exp(-lam * (asOf - m.date));
    if (w < 0.01) continue;
    rows.push({ h: m.home, a: m.away, hg: m.hg, ag: m.ag, w });
  }
  if (rows.length < 30) return null;

  const att = new Map<number, number>();
  const def = new Map<number, number>();
  const games = new Map<number, number>();
  for (const r of rows) {
    for (const t of [r.h, r.a]) {
      att.set(t, 1);
      def.set(t, 1);
      games.set(t, (games.get(t) ?? 0) + r.w);
    }
  }
  let W = 0, HG = 0, AG = 0;
  for (const r of rows) {
    W += r.w;
    HG += r.w * r.hg;
    AG += r.w * r.ag;
  }
  let mu = AG / W;
  let home = HG / Math.max(AG, 1e-9);
  const avgGoal = (HG + AG) / (2 * W); // 가상 경기에서 쓰는 평균 득점

  for (let it = 0; it < iters; it++) {
    // 공격력
    const num = new Map<number, number>(), den = new Map<number, number>();
    for (const r of rows) {
      num.set(r.h, (num.get(r.h) ?? 0) + r.w * r.hg);
      den.set(r.h, (den.get(r.h) ?? 0) + r.w * mu * home * def.get(r.a)!);
      num.set(r.a, (num.get(r.a) ?? 0) + r.w * r.ag);
      den.set(r.a, (den.get(r.a) ?? 0) + r.w * mu * def.get(r.h)!);
    }
    for (const t of att.keys()) att.set(t, (num.get(t)! + prior * avgGoal) / (den.get(t)! + prior * avgGoal));
    // 수비 (실점 배수)
    num.clear();
    den.clear();
    for (const r of rows) {
      num.set(r.a, (num.get(r.a) ?? 0) + r.w * r.hg);
      den.set(r.a, (den.get(r.a) ?? 0) + r.w * mu * home * att.get(r.h)!);
      num.set(r.h, (num.get(r.h) ?? 0) + r.w * r.ag);
      den.set(r.h, (den.get(r.h) ?? 0) + r.w * mu * att.get(r.a)!);
    }
    for (const t of def.keys()) def.set(t, (num.get(t)! + prior * avgGoal) / (den.get(t)! + prior * avgGoal));
    // 기하평균 1로 정규화 (mu 로 흡수)
    let la = 0, ld = 0;
    for (const v of att.values()) la += Math.log(v);
    for (const v of def.values()) ld += Math.log(v);
    const ga = Math.exp(la / att.size), gd = Math.exp(ld / def.size);
    for (const [t, v] of att) att.set(t, v / ga);
    for (const [t, v] of def) def.set(t, v / gd);
    // mu, home
    let eH = 0, eA = 0;
    for (const r of rows) {
      eH += r.w * att.get(r.h)! * def.get(r.a)!;
      eA += r.w * att.get(r.a)! * def.get(r.h)!;
    }
    mu = AG / eA;
    home = HG / (mu * eH);
  }
  return { mu, home, att, def, games };
}

export function poissonLambdas(f: PoissonFit, h: number, a: number): [number, number] | null {
  const ah = f.att.get(h), aa = f.att.get(a), dh = f.def.get(h), da = f.def.get(a);
  if (ah === undefined || aa === undefined || dh === undefined || da === undefined) return null;
  return [f.mu * f.home * ah * da, f.mu * aa * dh];
}

/* ───────────── B. Elo (전 대회 공통) ───────────── */

export class Elo {
  r = new Map<number, number>();
  league = new Map<number, string>(); // 팀이 마지막으로 뛴 리그
  lastSeason = new Map<number, number>();
  /** 대회별 평균 득점 (홈/원정) — Elo 를 득점으로 바꿀 때 기준 */
  goals = new Map<string, { h: number; a: number; n: number }>();

  constructor(private p: Params) {}

  private base(comp: string) {
    return LEAGUE_ELO[comp] ?? DEFAULT_ELO;
  }

  rating(team: number, comp: string, season: number): number {
    let r = this.r.get(team);
    if (r === undefined) {
      // 처음 보는 팀: 리그 경기면 그 리그 기준값 − 30 (승격팀은 대체로 약함), 컵이면 기본값
      r = LEAGUES.has(comp) ? this.base(comp) - 30 : DEFAULT_ELO;
      this.r.set(team, r);
      this.lastSeason.set(team, season);
    }
    const last = this.lastSeason.get(team)!;
    if (season > last) {
      const lg = this.league.get(team);
      if (lg) r = r - (r - this.base(lg)) * this.p.eloRegress;
      this.r.set(team, r);
      this.lastSeason.set(team, season);
    }
    return r;
  }

  avgGoals(comp: string): { h: number; a: number } {
    const g = this.goals.get(comp);
    if (!g || g.n < 30) return { h: 1.5, a: 1.2 };
    return { h: g.h, a: g.a };
  }

  lambdas(m: MatchLite): [number, number] {
    const rh = this.rating(m.home, m.comp, m.season);
    const ra = this.rating(m.away, m.comp, m.season);
    const g = this.avgGoals(m.comp);
    const f = Math.pow(10, (rh - ra) / (2 * this.p.eloGoal));
    return [g.h * f, g.a / f];
  }

  update(m: MatchLite) {
    if (m.hg === null || m.ag === null) return;
    const rh = this.rating(m.home, m.comp, m.season);
    const ra = this.rating(m.away, m.comp, m.season);
    const e = 1 / (1 + Math.pow(10, -(rh + this.p.eloHome - ra) / 400));
    const s = m.hg > m.ag ? 1 : m.hg === m.ag ? 0.5 : 0;
    const gd = Math.abs(m.hg - m.ag);
    const mult = gd <= 1 ? 1 : gd === 2 ? 1.5 : (11 + gd) / 8;
    const d = this.p.eloK * mult * (s - e);
    this.r.set(m.home, rh + d);
    this.r.set(m.away, ra - d);
    if (LEAGUES.has(m.comp)) {
      this.league.set(m.home, m.comp);
      this.league.set(m.away, m.comp);
    }
    // 대회 평균 득점: 지수 이동 평균 (약 2시즌 기억)
    const g = this.goals.get(m.comp) ?? { h: 1.5, a: 1.2, n: 0 };
    const k = Math.max(1 / (g.n + 1), 1 / 600);
    g.h += (m.hg - g.h) * k;
    g.a += (m.ag - g.a) * k;
    g.n++;
    this.goals.set(m.comp, g);
  }
}

/* ───────────── 합치기 ───────────── */

export interface Predictor {
  elo: Elo;
  fits: Map<string, PoissonFit | null>;
  p: Params;
}

/** 한 경기의 스코어 확률표와 포아송 비중 (시뮬레이션에서도 쓴다) */
export function matchMatrix(pr: Predictor, m: MatchLite): { mat: Float64Array; wPois: number; lamE: [number, number]; lamP: [number, number] | null } {
  const lamE = pr.elo.lambdas(m);
  const mE = scoreMatrix(lamE[0], lamE[1], pr.p.rho);
  let lamP: [number, number] | null = null;
  let w = 0;
  const fit = pr.fits.get(m.comp);
  if (fit && LEAGUES.has(m.comp)) {
    lamP = poissonLambdas(fit, m.home, m.away);
    if (lamP) {
      const n = Math.min(fit.games.get(m.home) ?? 0, fit.games.get(m.away) ?? 0);
      w = pr.p.wPois * Math.min(1, n / pr.p.minGames);
    }
  }
  const mat = lamP && w > 0 ? mixMatrices(scoreMatrix(lamP[0], lamP[1], pr.p.rho), mE, w) : mE;
  return { mat, wPois: w, lamE, lamP };
}

/** 한 경기 예측. fits 는 그 시점 이전 데이터로 맞춘 리그별 포아송 */
export function predict(pr: Predictor, m: MatchLite): Forecast & { wPois: number; lamE: [number, number]; lamP: [number, number] | null } {
  const { mat, wPois, lamE, lamP } = matchMatrix(pr, m);
  return { ...summarize(mat), wPois, lamE, lamP };
}

export const SCORE_SIDE = MAXG + 1;

/* ───────────── 채점 ───────────── */

export function outcome(m: MatchLite): 0 | 1 | 2 {
  return m.hg! > m.ag! ? 0 : m.hg === m.ag ? 1 : 2;
}

export function score(p: [number, number, number], o: 0 | 1 | 2) {
  const eps = 1e-12;
  const logloss = -Math.log(Math.max(p[o], eps));
  let brier = 0;
  for (let i = 0; i < 3; i++) brier += (p[i] - (i === o ? 1 : 0)) ** 2;
  const best = p.indexOf(Math.max(...p));
  return { logloss, brier, hit: best === o };
}
