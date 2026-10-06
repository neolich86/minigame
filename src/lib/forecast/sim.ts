// 스포츠 승부 예측 — 리그 최종 순위 몬테카를로 시뮬레이션 (순수 함수)
// 현재 승점·득실에서 출발해 남은 경기를 스코어 확률표대로 N번 굴린다.
import { SCORE_SIDE } from "./model";

/** 리그별 구간 (규정이 시즌마다 바뀌므로 "상위 N / 하위 N" 으로만 표기한다) */
export const ZONES: Record<string, { top: number; topKind: "ucl" | "promo"; bottom: number }> = {
  PL: { top: 4, topKind: "ucl", bottom: 3 },
  PD: { top: 4, topKind: "ucl", bottom: 3 },
  BL1: { top: 4, topKind: "ucl", bottom: 2 },
  SA: { top: 4, topKind: "ucl", bottom: 3 },
  FL1: { top: 3, topKind: "ucl", bottom: 2 },
  PPL: { top: 2, topKind: "ucl", bottom: 2 },
  DED: { top: 2, topKind: "ucl", bottom: 2 },
  ELC: { top: 2, topKind: "promo", bottom: 3 },
};

export interface SimTeam {
  id: number;
  pts: number;
  gd: number;
  gf: number;
  played: number;
}
export interface SimFixture {
  home: number;
  away: number;
  /** 스코어 확률표 (SCORE_SIDE²) */
  mat: Float64Array;
}
export interface SimRow {
  id: number;
  pts: number;
  played: number;
  expPts: number;
  avgPos: number;
  pTitle: number;
  pTop: number;
  pBottom: number;
  /** 순위별 확률 (1위부터) */
  pos: number[];
}
export interface SimResult {
  sims: number;
  remaining: number;
  zones: { top: number; topKind: "ucl" | "promo"; bottom: number };
  teams: SimRow[];
}

export function simulateLeague(teams: SimTeam[], fixtures: SimFixture[], zone: SimResult["zones"], sims = 10000, seed = 1): SimResult {
  let s = seed >>> 0 || 1;
  const rnd = () => {
    // xorshift32
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
  const n = teams.length;
  const idx = new Map(teams.map((t, i) => [t.id, i]));
  const fx = fixtures.filter((f) => idx.has(f.home) && idx.has(f.away));
  // 누적 확률표 (이진 탐색으로 스코어 뽑기)
  const cum = fx.map((f) => {
    const c = new Float64Array(f.mat.length);
    let acc = 0;
    for (let i = 0; i < f.mat.length; i++) c[i] = acc += f.mat[i];
    return c;
  });
  const hi = fx.map((f) => idx.get(f.home)!);
  const ai = fx.map((f) => idx.get(f.away)!);

  const pts = new Float64Array(n), gd = new Float64Array(n), gf = new Float64Array(n);
  const posCount = Array.from({ length: n }, () => new Float64Array(n));
  const ptsSum = new Float64Array(n);
  const order = Array.from({ length: n }, (_, i) => i);
  const tieKey = new Float64Array(n);

  for (let k = 0; k < sims; k++) {
    for (let i = 0; i < n; i++) {
      pts[i] = teams[i].pts;
      gd[i] = teams[i].gd;
      gf[i] = teams[i].gf;
      tieKey[i] = rnd(); // 승점·득실·득점까지 같으면 무작위
    }
    for (let j = 0; j < fx.length; j++) {
      const c = cum[j];
      const r = rnd() * c[c.length - 1];
      let lo = 0, up = c.length - 1;
      while (lo < up) {
        const mid = (lo + up) >> 1;
        if (c[mid] < r) lo = mid + 1;
        else up = mid;
      }
      const hg = Math.floor(lo / SCORE_SIDE), ag = lo % SCORE_SIDE;
      const h = hi[j], a = ai[j];
      gf[h] += hg; gf[a] += ag;
      gd[h] += hg - ag; gd[a] += ag - hg;
      if (hg > ag) pts[h] += 3;
      else if (hg < ag) pts[a] += 3;
      else { pts[h]++; pts[a]++; }
    }
    order.sort((x, y) => pts[y] - pts[x] || gd[y] - gd[x] || gf[y] - gf[x] || tieKey[y] - tieKey[x]);
    for (let p = 0; p < n; p++) posCount[order[p]][p]++;
    for (let i = 0; i < n; i++) ptsSum[i] += pts[i];
  }

  const rows: SimRow[] = teams.map((t, i) => {
    const pos = Array.from(posCount[i], (c) => c / sims);
    let avg = 0, top = 0, bottom = 0;
    pos.forEach((p, k) => {
      avg += p * (k + 1);
      if (k < zone.top) top += p;
      if (k >= n - zone.bottom) bottom += p;
    });
    return { id: t.id, pts: t.pts, played: t.played, expPts: ptsSum[i] / sims, avgPos: avg, pTitle: pos[0], pTop: top, pBottom: bottom, pos };
  });
  rows.sort((a, b) => a.avgPos - b.avgPos);
  return { sims, remaining: fx.length, zones: zone, teams: rows };
}
