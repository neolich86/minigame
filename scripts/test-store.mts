// 스포츠 승부 예측 — 경기 저장 테스트: 등록 안 된 대회(예: BSA) 경기는 건너뛴다
// 실행: npx tsx scripts/test-store.mts
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { saveMatches } from "../src/lib/forecast/store";
import type { FdMatch } from "../src/lib/forecast/fd";
import { FakeDb } from "./fake-db";

const mk = (id: number, code: string, h: number, a: number): FdMatch => ({
  id, utcDate: "2026-10-06T19:00:00Z", status: "FINISHED", matchday: 1, stage: "REGULAR_SEASON", group: null, lastUpdated: null,
  competition: { id: 1, code, name: code }, season: { id: 1, startDate: "2026-08-01", endDate: "2027-05-30", currentMatchday: 1 },
  homeTeam: { id: h, name: `T${h}` }, awayTeam: { id: a, name: `T${a}` },
  score: { winner: "HOME_TEAM", duration: "REGULAR", fullTime: { home: 1, away: 0 } },
});
const fake = new FakeDb({ fc_competitions: [{ code: "PL" }, { code: "CL" }], fc_teams: [], fc_matches: [] }, { fc_teams: ["id"], fc_matches: ["id"], fc_competitions: ["code"] });
const skipped: Record<string, number> = {};
const rows = await saveMatches(fake as unknown as SupabaseClient, [mk(1, "PL", 10, 11), mk(2, "BSA", 20, 21), mk(3, "BSA", 22, 23), mk(4, "CL", 10, 30)], undefined, skipped);
assert.equal(rows, 2);
assert.deepEqual(skipped, { BSA: 2 });
assert.deepEqual(fake.tables.fc_matches.map((m) => m.id).sort(), [1, 4]);
assert.ok(!fake.tables.fc_teams.some((t) => t.id === 20), "건너뛴 대회의 팀도 저장 안 함");
assert.equal(await saveMatches(fake as unknown as SupabaseClient, [mk(5, "BSA", 20, 21)]), 0, "전부 건너뛰면 0");
console.log("store 테스트 통과");
