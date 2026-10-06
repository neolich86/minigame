// 킥오프 예측 — 백테스트 엔진 (순수 함수)
// 과거 경기를 날짜순으로 재생하면서, 매 경기를 "그날 이전 데이터만으로" 예측하고 채점한다.
import { Elo, fitPoisson, outcome, predict, score, type MatchLite, type Params, type PoissonFit } from "./model";

const DAY = 86400_000;
const WEEK = 7 * DAY;

export interface Agg {
  n: number;
  logloss: number;
  brier: number;
  hits: number;
  predDraw: number; // 예측 무승부 확률 합
  draws: number; // 실제 무승부 수
}

const emptyAgg = (): Agg => ({ n: 0, logloss: 0, brier: 0, hits: 0, predDraw: 0, draws: 0 });

function add(a: Agg, p: [number, number, number], o: 0 | 1 | 2) {
  const s = score(p, o);
  a.n++;
  a.logloss += s.logloss;
  a.brier += s.brier;
  if (s.hit) a.hits++;
  a.predDraw += p[1];
  if (o === 1) a.draws++;
}

export interface AggOut {
  n: number;
  logloss: number;
  brier: number;
  acc: number;
  predDraw: number;
  draw: number;
}
export const finish = (a: Agg): AggOut => ({
  n: a.n,
  logloss: a.n ? a.logloss / a.n : NaN,
  brier: a.n ? a.brier / a.n : NaN,
  acc: a.n ? a.hits / a.n : NaN,
  predDraw: a.n ? a.predDraw / a.n : NaN,
  draw: a.n ? a.draws / a.n : NaN,
});

export interface BacktestResult {
  model: AggOut;
  base: AggOut; // 대회별 누적 결과 비율
  byComp: Record<string, { model: AggOut; base: AggOut }>;
  /** 보정: 예측 확률 구간별 실제 발생 비율 (홈승·무·원정승 확률 전부 모음) */
  calib: { lo: number; hi: number; n: number; pred: number; real: number }[];
}

export type FitCache = Map<string, PoissonFit | null>;

/**
 * matches: 끝난 경기만, 아무 순서. evalSeason: 채점할 시즌인지 (아니면 워밍업으로만 쓴다)
 * fitCache: 같은 반감기·prior 끼리는 포아송 적합 결과를 재사용 (그리드 탐색 속도용)
 */
export function runBacktest(
  all: MatchLite[],
  p: Params,
  evalSeason: (season: number) => boolean,
  fitCache: FitCache = new Map(),
): BacktestResult {
  const ms = all.filter((m) => m.hg !== null && m.ag !== null).sort((a, b) => a.date - b.date || a.id - b.id);
  const byLeague = new Map<string, MatchLite[]>();
  for (const m of ms) {
    const arr = byLeague.get(m.comp) ?? [];
    arr.push(m);
    byLeague.set(m.comp, arr);
  }

  const elo = new Elo(p);
  const fits = new Map<string, PoissonFit | null>();
  const fitWeek = new Map<string, number>();
  const baseCnt = new Map<string, [number, number, number]>();

  const total = emptyAgg(), totalBase = emptyAgg();
  const comp: Record<string, { model: Agg; base: Agg }> = {};
  const bins = Array.from({ length: 10 }, () => ({ n: 0, pred: 0, real: 0 }));

  let i = 0;
  while (i < ms.length) {
    const day = Math.floor(ms[i].date / DAY);
    let j = i;
    while (j < ms.length && Math.floor(ms[j].date / DAY) === day) j++;
    const group = ms.slice(i, j);

    // 리그 포아송: 주 단위로 다시 맞춤 (그 주 시작 이전 경기만 사용)
    const week = Math.floor(ms[i].date / WEEK) * WEEK;
    for (const c of new Set(group.map((m) => m.comp))) {
      if (fitWeek.get(c) === week) continue;
      const key = `${c}|${week}|${p.halfLife}|${p.prior}`;
      let f = fitCache.get(key);
      if (f === undefined) {
        f = fitPoisson(byLeague.get(c)!, week, p.halfLife, p.prior);
        fitCache.set(key, f);
      }
      fits.set(c, f);
      fitWeek.set(c, week);
    }

    for (const m of group) {
      if (!evalSeason(m.season)) continue;
      const o = outcome(m);
      const f = predict({ elo, fits, p }, m);
      const pv: [number, number, number] = [f.pH, f.pD, f.pA];
      const bc = baseCnt.get(m.comp) ?? [45, 27, 28];
      const bs = bc[0] + bc[1] + bc[2];
      const pb: [number, number, number] = [bc[0] / bs, bc[1] / bs, bc[2] / bs];
      add(total, pv, o);
      add(totalBase, pb, o);
      const cc = (comp[m.comp] ??= { model: emptyAgg(), base: emptyAgg() });
      add(cc.model, pv, o);
      add(cc.base, pb, o);
      for (let k = 0; k < 3; k++) {
        const b = Math.min(9, Math.floor(pv[k] * 10));
        bins[b].n++;
        bins[b].pred += pv[k];
        if (k === o) bins[b].real++;
      }
    }
    for (const m of group) {
      elo.update(m);
      const bc = baseCnt.get(m.comp) ?? [45, 27, 28];
      bc[outcome(m)]++;
      baseCnt.set(m.comp, bc);
    }
    i = j;
  }

  const byComp: BacktestResult["byComp"] = {};
  for (const [c, v] of Object.entries(comp)) byComp[c] = { model: finish(v.model), base: finish(v.base) };
  return {
    model: finish(total),
    base: finish(totalBase),
    byComp,
    calib: bins.map((b, k) => ({ lo: k / 10, hi: (k + 1) / 10, n: b.n, pred: b.n ? b.pred / b.n : 0, real: b.n ? b.real / b.n : 0 })),
  };
}
