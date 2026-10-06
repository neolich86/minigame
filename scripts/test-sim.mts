// 스포츠 승부 예측 — 리그 시뮬레이션 테스트
// 실행: npx tsx scripts/test-sim.mts
import assert from "node:assert/strict";
import { SCORE_SIDE, scoreMatrix } from "../src/lib/forecast/model";
import { simulateLeague, type SimFixture, type SimTeam } from "../src/lib/forecast/sim";

// 1) 남은 경기가 없으면 현재 순위 그대로 (확률 1/0)
{
  const teams: SimTeam[] = [{ id: 1, pts: 30, gd: 10, gf: 20, played: 10 }, { id: 2, pts: 20, gd: 0, gf: 10, played: 10 }, { id: 3, pts: 10, gd: -10, gf: 5, played: 10 }];
  const r = simulateLeague(teams, [], { top: 1, topKind: "ucl", bottom: 1 }, 500);
  assert.equal(r.teams[0].id, 1);
  assert.equal(r.teams[0].pTitle, 1);
  assert.equal(r.teams.find((t) => t.id === 3)!.pBottom, 1);
  assert.equal(r.teams[1].expPts, 20);
}
// 2) 대칭: 같은 승점·같은 전력이면 우승 확률이 비슷하고, 합은 1
{
  const n = 6;
  const teams: SimTeam[] = Array.from({ length: n }, (_, i) => ({ id: i + 1, pts: 10, gd: 0, gf: 10, played: 5 }));
  const fx: SimFixture[] = [];
  for (let h = 1; h <= n; h++) for (let a = 1; a <= n; a++) if (h !== a) fx.push({ home: h, away: a, mat: scoreMatrix(1.3, 1.3, -0.1) });
  const r = simulateLeague(teams, fx, { top: 2, topKind: "ucl", bottom: 1 }, 6000);
  const sum = r.teams.reduce((s, t) => s + t.pTitle, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9);
  for (const t of r.teams) assert.ok(Math.abs(t.pTitle - 1 / n) < 0.03, `pTitle ${t.pTitle}`);
  for (const t of r.teams) assert.ok(Math.abs(t.pos.reduce((a, b) => a + b, 0) - 1) < 1e-9);
  // 기대 승점: 10경기 × 무승부 확률 고려한 평균 ≈ 10 + 10 × (3·pW + pD)
  assert.ok(r.teams.every((t) => t.expPts > 20 && t.expPts < 26));
}
// 3) 강팀이 앞서면 우승 확률이 높다
{
  const teams: SimTeam[] = [{ id: 1, pts: 25, gd: 15, gf: 25, played: 10 }, { id: 2, pts: 22, gd: 8, gf: 18, played: 10 }, { id: 3, pts: 10, gd: -10, gf: 8, played: 10 }, { id: 4, pts: 8, gd: -13, gf: 6, played: 10 }];
  const strong = scoreMatrix(2.0, 0.8, -0.1), even = scoreMatrix(1.3, 1.1, -0.1);
  const fx: SimFixture[] = [];
  for (let k = 0; k < 2; k++) for (const [h, a] of [[1, 3], [1, 4], [2, 3], [2, 4], [1, 2], [3, 4]]) fx.push({ home: h, away: a, mat: h <= 2 && a >= 3 ? strong : even });
  const r = simulateLeague(teams, fx, { top: 2, topKind: "ucl", bottom: 1 }, 5000);
  const t1 = r.teams.find((t) => t.id === 1)!, t2 = r.teams.find((t) => t.id === 2)!;
  assert.ok(t1.pTitle > t2.pTitle && t1.pTitle > 0.5, `${t1.pTitle} ${t2.pTitle}`);
  assert.ok(r.teams.find((t) => t.id === 4)!.pBottom > 0.5);
}
// 4) 속도: 20팀 · 남은 300경기 · 1만 회
{
  const teams: SimTeam[] = Array.from({ length: 20 }, (_, i) => ({ id: i, pts: 20 - i, gd: 0, gf: 10, played: 7 }));
  const fx: SimFixture[] = [];
  for (let k = 0; fx.length < 300; k++) for (let h = 0; h < 20 && fx.length < 300; h++) fx.push({ home: h, away: (h + 1 + (k % 19)) % 20, mat: scoreMatrix(1.4 + (h % 3) * 0.1, 1.1, -0.1) });
  const t0 = Date.now();
  const r = simulateLeague(teams, fx, { top: 4, topKind: "ucl", bottom: 3 }, 10000);
  const ms = Date.now() - t0;
  console.log(`20팀·300경기·1만 회: ${ms}ms (SCORE_SIDE=${SCORE_SIDE})`);
  assert.equal(r.remaining, 300);
  assert.ok(ms < 8000);
}
console.log("sim 테스트 통과");
