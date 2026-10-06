// 킥오프 예측 M1 — football-data 클라이언트·행 변환 테스트 (네트워크 없이 가짜 fetch 사용)
// 실행: npx tsx scripts/test-forecast.mts
import assert from "node:assert/strict";
import { FdClient, FdError, kstDate, score90, scoreFinal, teamsFrom, toMatchRow, type FdMatch } from "../src/lib/forecast/fd";

let passed = 0;
const t = async (name: string, fn: () => void | Promise<void>) => {
  await fn();
  passed++;
  console.log("✓", name);
};

const base = (over: Partial<FdMatch> = {}): FdMatch => ({
  id: 1,
  utcDate: "2026-10-04T14:00:00Z",
  status: "FINISHED",
  matchday: 7,
  stage: "REGULAR_SEASON",
  group: null,
  lastUpdated: "2026-10-04T16:00:00Z",
  competition: { id: 2021, code: "PL", name: "Premier League" },
  season: { id: 2400, startDate: "2026-08-15", endDate: "2027-05-23", currentMatchday: 7 },
  homeTeam: { id: 57, name: "Arsenal FC", shortName: "Arsenal", tla: "ARS", crest: "https://x/57.png" },
  awayTeam: { id: 61, name: "Chelsea FC", shortName: "Chelsea", tla: "CHE", crest: "https://x/61.png" },
  score: { winner: "HOME_TEAM", duration: "REGULAR", fullTime: { home: 2, away: 1 } },
  ...over,
});

await t("정규 시간 경기 변환", () => {
  const r = toMatchRow(base());
  assert.equal(r.competition, "PL");
  assert.equal(r.season, 2026);
  assert.deepEqual([r.home_score, r.away_score, r.home_score_90, r.away_score_90], [2, 1, 2, 1]);
  assert.equal(r.home_id, 57);
});

await t("연장 경기는 90분 스코어를 따로 저장", () => {
  const m = base({
    score: {
      winner: "AWAY_TEAM",
      duration: "EXTRA_TIME",
      fullTime: { home: 1, away: 2 },
      regularTime: { home: 1, away: 1 },
      extraTime: { home: 0, away: 1 },
    },
  });
  assert.deepEqual(score90(m), { home: 1, away: 1 });
  const r = toMatchRow(m);
  assert.deepEqual([r.home_score, r.away_score, r.home_score_90, r.away_score_90], [1, 2, 1, 1]);
});

await t("승부차기 경기는 최종 스코어에서 승부차기 점수를 뺀다", () => {
  const m = base({
    score: {
      winner: "HOME_TEAM",
      duration: "PENALTY_SHOOTOUT",
      fullTime: { home: 6, away: 5 },
      regularTime: { home: 1, away: 1 },
      extraTime: { home: 0, away: 0 },
      penalties: { home: 5, away: 4 },
    },
  });
  assert.deepEqual(scoreFinal(m), { home: 1, away: 1 });
  assert.deepEqual(score90(m), { home: 1, away: 1 });
});

await t("예정 경기는 스코어가 비어 있다", () => {
  const r = toMatchRow(base({ status: "TIMED", score: { winner: null, duration: "REGULAR", fullTime: { home: null, away: null } } }));
  assert.equal(r.home_score, null);
  assert.equal(r.home_score_90, null);
});

await t("팀 목록 중복 제거 + 미정 팀(id null) 제외", () => {
  const tbd = base({ id: 2, homeTeam: { id: 0, name: null }, awayTeam: { id: 57, name: "Arsenal FC" } });
  const teams = teamsFrom([base(), base({ id: 3 }), tbd]);
  assert.deepEqual(teams.map((x) => x.id).sort(), [57, 61]);
});

await t("KST 날짜 계산 (UTC 16시 = KST 다음날 01시)", () => {
  const now = Date.parse("2026-10-06T16:00:00Z");
  assert.equal(kstDate(0, now), "2026-10-07");
  assert.equal(kstDate(-2, now), "2026-10-05");
});

await t("클라이언트: 토큰 헤더·쿼리·남은 호출 수", async () => {
  const calls: { url: string; token: string | null }[] = [];
  const fake = (async (url: string, init?: RequestInit) => {
    calls.push({ url, token: new Headers(init?.headers).get("x-auth-token") });
    return new Response(JSON.stringify({ matches: [base()] }), { status: 200, headers: { "x-requests-available-minute": "8" } });
  }) as typeof fetch;
  const c = new FdClient("TOKEN", fake, 0);
  const r = await c.competitionMatches("PL", 2024);
  assert.equal(r.matches.length, 1);
  assert.equal(calls[0].url, "https://api.football-data.org/v4/competitions/PL/matches?season=2024");
  assert.equal(calls[0].token, "TOKEN");
  assert.equal(c.remaining, 8);
  await c.matchesBetween("2026-10-04", "2026-10-13");
  assert.equal(calls[1].url, "https://api.football-data.org/v4/matches?dateFrom=2026-10-04&dateTo=2026-10-13");
});

await t("클라이언트: 403 은 FdError(status, message)", async () => {
  const fake = (async () =>
    new Response(JSON.stringify({ message: "The resource you are looking for is restricted." }), { status: 403 })) as unknown as typeof fetch;
  const c = new FdClient("T", fake, 0);
  await assert.rejects(c.competitionMatches("PL", 2015), (e: unknown) => e instanceof FdError && e.status === 403 && /restricted/.test(e.message));
});

await t("클라이언트: 호출 간격 유지", async () => {
  const times: number[] = [];
  const fake = (async () => {
    times.push(Date.now());
    return new Response("{\"matches\":[]}", { status: 200 });
  }) as unknown as typeof fetch;
  const c = new FdClient("T", fake, 120);
  await c.matchesBetween("a", "b");
  await c.matchesBetween("a", "b");
  assert.ok(times[1] - times[0] >= 115, `gap ${times[1] - times[0]}ms`);
});

console.log(`\n${passed}개 통과`);
