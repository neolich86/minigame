// 스포츠 승부 예측 — 운영 예측 작업(predict) 테스트: 가짜 DB 로 생성·잠금·채점·레이팅 흐름 확인
// 실행: npx tsx scripts/test-predict.mts
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { runPredict } from "../src/lib/forecast/predict";
import { FakeDb } from "./fake-db";

let s = 11;
const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const pois = (l: number) => {
  let k = 0, p = 1;
  const L = Math.exp(-l);
  do { k++; p *= rnd(); } while (p > L);
  return k - 1;
};

const DAY = 86400_000;
const NOW = Date.UTC(2026, 9, 6, 12, 0);
const teams = Array.from({ length: 20 }, (_, i) => ({ id: 100 + i, name: `Team ${i}`, short_name: `T${i}`, tla: `T${String(i).padStart(2, "0")}`, str: (10 - i) * 0.04 }));
const matches: Record<string, unknown>[] = [];
let id = 1;
// 2시즌 + 이번 시즌 일부 (주 1라운드, 10경기씩)
for (let w = 0; w < 110; w++) {
  const date = NOW - (110 - w) * 7 * DAY;
  const season = new Date(date).getUTCMonth() >= 6 ? new Date(date).getUTCFullYear() : new Date(date).getUTCFullYear() - 1;
  const sh = teams.slice().sort(() => rnd() - 0.5);
  for (let k = 0; k < 20; k += 2) {
    const h = sh[k], a = sh[k + 1];
    const hg = pois(Math.exp(0.3 + 0.2 + h.str - a.str)), ag = pois(Math.exp(0.3 + a.str - h.str));
    matches.push({ id: id++, competition: "PL", season, utc_date: new Date(date).toISOString(), status: "FINISHED", home_id: h.id, away_id: a.id, home_score_90: hg, away_score_90: ag });
  }
}
// 이미 킥오프한 경기 (잠겨야 함) — 미리 예측이 있었다고 가정
matches.push({ id: 9001, competition: "PL", season: 2026, utc_date: new Date(NOW - 2 * 3600_000).toISOString(), status: "IN_PLAY", home_id: 100, away_id: 119, home_score_90: null, away_score_90: null });
// 앞으로의 경기
for (let k = 0; k < 6; k++)
  matches.push({ id: 9100 + k, competition: "PL", season: 2026, utc_date: new Date(NOW + (k + 1) * DAY).toISOString(), status: "TIMED", home_id: 100 + k, away_id: 110 + k, home_score_90: null, away_score_90: null });
// 연기 경기, 범위 밖 경기
matches.push({ id: 9200, competition: "PL", season: 2026, utc_date: new Date(NOW + DAY).toISOString(), status: "POSTPONED", home_id: 101, away_id: 102, home_score_90: null, away_score_90: null });
matches.push({ id: 9201, competition: "PL", season: 2026, utc_date: new Date(NOW + 20 * DAY).toISOString(), status: "TIMED", home_id: 101, away_id: 102, home_score_90: null, away_score_90: null });

const fake = new FakeDb(
  {
    fc_matches: matches,
    fc_teams: teams.map((t) => ({ id: t.id, name: t.name, short_name: t.short_name, tla: t.tla })),
    fc_predictions: [{ match_id: 9001, model_version: "v1.0", p_home: 0.6, p_draw: 0.25, p_away: 0.15, locked_at: null, result: null }],
    fc_ratings: [],
  },
  { fc_predictions: ["match_id"], fc_ratings: ["team_id", "date"], fc_matches: ["id"] },
);
const db = fake as unknown as SupabaseClient;
// 테스트에서 읽는 행 모양 (값 타입은 느슨하게)
type P = {
  id: number; match_id: number; status: string; home_score_90: number | null; away_score_90: number | null;
  p_home: number; p_draw: number; p_away: number; top_scores: unknown[]; factors: Record<string, number>;
  locked_at: string | null; result: string | null; hit: boolean | null; brier: number; logloss: number;
};

const r1 = await runPredict(db, NOW);
console.log("1차:", r1);
const preds = fake.tables.fc_predictions as unknown as P[];
assert.equal(r1.predicted, 6, "앞으로 8일 안의 열린 경기 6개만 예측");
assert.ok(!preds.find((p) => p.match_id === 9200), "연기 경기는 예측 안 함");
assert.ok(!preds.find((p) => p.match_id === 9201), "8일 밖 경기는 예측 안 함");
for (const p of preds.filter((x) => x.match_id >= 9100)) {
  assert.ok(Math.abs(p.p_home + p.p_draw + p.p_away - 1) < 1e-6);
  assert.equal(p.top_scores.length, 5);
  assert.ok(p.factors.eloH && p.factors.attH, "근거 수치 기록");
}
// 강팀(100) 홈 vs 약팀(110) → 홈승 확률이 가장 높아야
const strong = preds.find((p) => p.match_id === 9100)!;
assert.ok(strong.p_home > strong.p_away, `강팀 홈승 ${strong.p_home} > ${strong.p_away}`);
assert.equal(r1.locked, 1, "킥오프한 경기 잠금");
assert.ok(preds.find((p) => p.match_id === 9001)!.locked_at);
assert.ok(r1.history > 100 && r1.ratings === 20, "레이팅 과거 기록 + 오늘 스냅샷");

// 잠긴 경기가 끝나고, 하루 뒤 다시 실행 → 채점, 잠긴 예측은 바뀌지 않음
const m = (fake.tables.fc_matches as unknown as P[]).find((x) => x.id === 9001)!;
Object.assign(m, { status: "FINISHED", home_score_90: 2, away_score_90: 0 });
const r2 = await runPredict(db, NOW + DAY);
console.log("2차:", r2);
const p9001 = preds.find((p) => p.match_id === 9001)!;
assert.equal(p9001.p_home, 0.6, "잠긴 예측 확률 유지");
assert.equal(p9001.result, "H");
assert.equal(p9001.hit, true);
assert.ok(p9001.brier > 0 && p9001.logloss > 0);
assert.equal(r2.graded, 1);
assert.equal(r2.history, 0, "기록이 충분하면 과거 기록은 다시 안 씀");
// 하루가 지나 9100 은 킥오프 시각이 지났다 → 잠김, 새로 예측 안 함
assert.ok(preds.find((p) => p.match_id === 9100)!.locked_at);
console.log("\npredict 테스트 통과");
