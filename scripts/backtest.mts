// 킥오프 예측 — 백테스트 + 파라미터 탐색
//
// 실제 데이터:   npx tsx scripts/backtest.mts data.json [--out result.md] [--params best.json]
//   data.json = /api/forecast/export 응답 ({ columns, rows })
// 합성 데이터:   npx tsx scripts/backtest.mts --synthetic   (모델이 진짜 강도를 찾아내는지 확인용)
//
// 방식: 2023/24(첫 시즌)는 워밍업, 그다음 시즌으로 파라미터를 고르고(튜닝),
//       그 뒤 시즌은 고른 값 그대로 채점만 한다(홀드아웃) — 과적합된 숫자를 화면에 약속하지 않기 위해.
import fs from "node:fs";
import { DEFAULT_PARAMS, type MatchLite, type Params } from "../src/lib/forecast/model";
import { runBacktest, type AggOut, type BacktestResult, type FitCache } from "../src/lib/forecast/backtest";

const args = process.argv.slice(2);
const flag = (n: string) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};

/* ───────────── 데이터 ───────────── */

function loadExport(path: string): MatchLite[] {
  const j = JSON.parse(fs.readFileSync(path, "utf8")) as { columns: string[]; rows: (string | number)[][] };
  const c = Object.fromEntries(j.columns.map((k, i) => [k, i]));
  return j.rows.map((r) => ({
    id: Number(r[c.id]),
    comp: String(r[c.comp]),
    season: Number(r[c.season]),
    date: Number(r[c.date]),
    home: Number(r[c.home]),
    away: Number(r[c.away]),
    hg: Number(r[c.hg]),
    ag: Number(r[c.ag]),
  }));
}

/** 합성 리그: 진짜 공격·수비력을 정해 두고 경기를 만든다. 챔스는 리그 상위 팀끼리 */
function synthetic(seed = 7): MatchLite[] {
  let s = seed;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
  const pois = (l: number) => {
    let k = 0, p = 1;
    const L = Math.exp(-l);
    do { k++; p *= rnd(); } while (p > L);
    return k - 1;
  };
  const leagues: [string, number, number][] = [["PL", 20, 0.25], ["PD", 20, 0.2], ["BL1", 18, 0.15], ["SA", 20, 0.15], ["FL1", 18, 0.05], ["PPL", 18, -0.1], ["DED", 18, -0.15], ["ELC", 24, -0.25]];
  const teams: { id: number; lg: string; att: number; def: number }[] = [];
  let id = 1;
  for (const [lg, n, lvl] of leagues)
    for (let i = 0; i < n; i++) teams.push({ id: id++, lg, att: lvl / 2 + 0.25 * gauss(), def: -lvl / 2 + 0.2 * gauss() });
  const out: MatchLite[] = [];
  let mid = 1;
  const play = (comp: string, season: number, date: number, h: (typeof teams)[0], a: (typeof teams)[0], homeAdv = 0.25) => {
    const lh = Math.exp(0.1 + homeAdv + h.att + a.def), la = Math.exp(0.1 + a.att + h.def);
    out.push({ id: mid++, comp, season, date, home: h.id, away: a.id, hg: pois(lh), ag: pois(la) });
  };
  for (let season = 2023; season <= 2025; season++) {
    const start = Date.UTC(season, 7, 10);
    for (const t of teams) { t.att += 0.07 * gauss(); t.def += 0.06 * gauss(); } // 시즌 사이 전력 변화
    for (const [lg] of leagues) {
      const ts = teams.filter((t) => t.lg === lg);
      const n = ts.length;
      // 원형 일정 (n-1 라운드 × 2)
      const order = ts.slice();
      for (let leg = 0; leg < 2; leg++)
        for (let r = 0; r < n - 1; r++) {
          const date = start + (leg * (n - 1) + r) * 7 * 86400_000 + (lg.length % 3) * 86400_000;
          for (let k = 0; k < n / 2; k++) {
            const x = order[k], y = order[n - 1 - k];
            if ((r + leg) % 2) play(lg, season, date, x, y); else play(lg, season, date, y, x);
          }
          order.splice(1, 0, order.pop()!);
        }
    }
    // 챔스: 리그별 상위(공격-수비) 4팀, 무작위 대진 8주
    const strong = leagues.flatMap(([lg]) => teams.filter((t) => t.lg === lg).sort((a, b) => b.att - b.def - (a.att - a.def)).slice(0, lg === "ELC" ? 0 : 4));
    for (let w = 0; w < 8; w++) {
      const sh = strong.slice().sort(() => rnd() - 0.5);
      for (let k = 0; k + 1 < sh.length; k += 2) play("CL", season, start + (w * 4 + 5) * 7 * 86400_000 + 2 * 86400_000, sh[k], sh[k + 1]);
    }
  }
  return out;
}

/* ───────────── 탐색 ───────────── */

const synth = args.includes("--synthetic");
const file = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--out" && args[args.indexOf(a) - 1] !== "--params");
const all = synth ? synthetic() : file ? loadExport(file) : (() => { throw new Error("데이터 파일 경로 또는 --synthetic"); })();

const seasons = [...new Set(all.map((m) => m.season))].sort();
if (seasons.length < 3) console.warn(`시즌이 ${seasons.length}개뿐 — 워밍업/튜닝/홀드아웃을 나누기 어렵다`);
const warm = seasons[0];
const tune = seasons[1] ?? seasons[0];
const hold = seasons.slice(2);
const isTune = (s: number) => s === tune;
const isHold = (s: number) => hold.includes(s);
const isEval = (s: number) => s > warm;

const cache: FitCache = new Map();
const t0 = Date.now();
let runs = 0;
const run = (p: Params, ev: (s: number) => boolean): BacktestResult => {
  runs++;
  return runBacktest(all, p, ev, cache);
};

type Row = { p: Params; r: BacktestResult };
function grid(base: Params, space: Partial<Record<keyof Params, number[]>>): Row[] {
  const keys = Object.keys(space) as (keyof Params)[];
  const rows: Row[] = [];
  const rec = (i: number, p: Params) => {
    if (i === keys.length) return void rows.push({ p, r: run(p, isTune) });
    for (const v of space[keys[i]]!) rec(i + 1, { ...p, [keys[i]]: v });
  };
  rec(0, base);
  return rows.sort((a, b) => a.r.model.logloss - b.r.model.logloss);
}

// 1) Elo 단독
const s1 = grid({ ...DEFAULT_PARAMS, wPois: 0 }, {
  eloK: [6, 10, 15, 20, 25, 30, 40],
  eloHome: [40, 70],
  eloGoal: [350, 450, 550, 700],
  eloRegress: [0, 0.2, 0.4],
});
const bestElo = s1[0].p;
// 2) 포아송 단독 (Elo 는 데이터 부족 팀 대체용)
const s2 = grid({ ...bestElo, wPois: 1, minGames: 1 }, {
  halfLife: [90, 150, 240, 365, 540],
  prior: [1, 3, 6, 10, 16],
  rho: [-0.12, -0.06, 0],
});
const bestPois = s2[0].p;
// 3) 섞기 + 무승부 보정
const s3 = grid({ ...bestPois }, {
  wPois: [0, 0.3, 0.5, 0.7, 0.85, 1],
  minGames: [3, 6, 10],
  rho: [-0.15, -0.1, -0.06, -0.03, 0],
});
const best = s3[0].p;

// 최종: 튜닝 시즌 / 홀드아웃 시즌 / 전체(워밍업 제외)
const fin = {
  tune: run(best, isTune),
  hold: hold.length ? run(best, isHold) : null,
  all: run(best, isEval),
  eloAll: run({ ...bestElo, wPois: 0 }, isEval),
  poisAll: run({ ...bestPois }, isEval),
};
const secs = ((Date.now() - t0) / 1000).toFixed(1);

/* ───────────── 출력 ───────────── */

const f3 = (x: number) => (Number.isFinite(x) ? x.toFixed(4) : "-");
const pc = (x: number) => (Number.isFinite(x) ? (x * 100).toFixed(1) + "%" : "-");
const line = (name: string, a: AggOut) => `| ${name} | ${a.n} | ${f3(a.logloss)} | ${f3(a.brier)} | ${pc(a.acc)} | ${pc(a.predDraw)} / ${pc(a.draw)} |`;
const head = "| 모델 | 경기 | 로그 손실 ↓ | 브라이어 ↓ | 적중률 | 무승부 예측/실제 |\n|---|---:|---:|---:|---:|---:|";
const pstr = (p: Params, keys: (keyof Params)[]) => keys.map((k) => `${k}=${p[k]}`).join(" ");

const md: string[] = [];
md.push(`## 킥오프 예측 백테스트 ${synth ? "(합성 데이터)" : ""}`);
md.push(`경기 ${all.length}개 · 시즌 ${seasons.join(", ")} · 워밍업 ${warm} · 튜닝 ${tune} · 홀드아웃 ${hold.join(", ") || "없음"} · 실행 ${runs}회 ${secs}초`);
md.push("", "### 전체 (워밍업 제외)", head,
  line("기준선: 대회별 누적 비율", fin.all.base),
  line("Elo 단독", fin.eloAll.model),
  line("포아송 단독", fin.poisAll.model),
  line("**합친 모델 (최종)**", fin.all.model));
if (fin.hold) md.push("", `### 홀드아웃 시즌 ${hold.join(", ")} — 튜닝에 안 쓴 시즌`, head, line("기준선", fin.hold.base), line("**최종 모델**", fin.hold.model));
md.push("", `### 튜닝 시즌 ${tune}`, head, line("기준선", fin.tune.base), line("최종 모델", fin.tune.model));

md.push("", "### 대회별 (워밍업 제외)", "| 대회 | 경기 | 모델 로그손실 | 기준선 | 모델 적중률 | 기준선 적중률 |", "|---|---:|---:|---:|---:|---:|");
for (const [c, v] of Object.entries(fin.all.byComp).sort())
  md.push(`| ${c} | ${v.model.n} | ${f3(v.model.logloss)} | ${f3(v.base.logloss)} | ${pc(v.model.acc)} | ${pc(v.base.acc)} |`);

md.push("", "### 보정 (예측 확률 구간 → 실제 발생 비율)", "| 구간 | 개수 | 평균 예측 | 실제 |", "|---|---:|---:|---:|");
for (const b of fin.all.calib) if (b.n) md.push(`| ${pc(b.lo)}–${pc(b.hi)} | ${b.n} | ${pc(b.pred)} | ${pc(b.real)} |`);

md.push("", "### 고른 파라미터", "```json", JSON.stringify(best, null, 2), "```");
md.push("", "### 탐색 상위 5 (튜닝 시즌 로그 손실)");
for (const [name, rows, keys] of [
  ["Elo", s1, ["eloK", "eloHome", "eloGoal", "eloRegress"]],
  ["포아송", s2, ["halfLife", "prior", "rho"]],
  ["섞기", s3, ["wPois", "minGames", "rho"]],
] as const) {
  md.push(`- **${name}**`);
  for (const r of rows.slice(0, 5)) md.push(`  - ${f3(r.r.model.logloss)} · ${pstr(r.p, keys as unknown as (keyof Params)[])}`);
}
const text = md.join("\n");
console.log(text);
const out = flag("--out");
if (out) fs.writeFileSync(out, text + "\n");
const pout = flag("--params");
if (pout) fs.writeFileSync(pout, JSON.stringify(best, null, 2) + "\n");
