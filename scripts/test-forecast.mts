// 스포츠 승부 예측 M1 — football-data 클라이언트·행 변환 테스트 (네트워크 없이 가짜 fetch 사용)
// 실행: npx tsx scripts/test-forecast.mts
import assert from "node:assert/strict";
import { fitPoisson, poissonLambdas, scoreMatrix, summarize, type MatchLite } from "../src/lib/forecast/model";
import { cleanName, decodePicks, encodePicks, modelPick, outcomeOf, picksUrl } from "../src/lib/forecast/picks";
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

await t("스코어 확률표: 합 1, 무승부 보정(rho<0)이 0:0·1:1을 올림", () => {
  const a = scoreMatrix(1.4, 1.1, 0), b = scoreMatrix(1.4, 1.1, -0.1);
  const sa = a.reduce((x, y) => x + y, 0);
  assert.ok(Math.abs(sa - 1) < 1e-9);
  assert.ok(b[0] > a[0] && b[12] > a[12]);
  const f = summarize(a);
  assert.ok(Math.abs(f.pH + f.pD + f.pA - 1) < 1e-9);
  assert.ok(Math.abs(f.expH - 1.4) < 0.01 && f.top.length === 5);
});

await t("포아송 적합: 강팀·약팀 구분, 홈 어드밴티지 추정", () => {
  // 팀 1이 강하고 팀 4가 약한 리그를 결정적으로 만든다 (기대값 그대로의 득점)
  const strength: Record<number, number> = { 1: 0.5, 2: 0.1, 3: -0.1, 4: -0.5 };
  const ms: MatchLite[] = [];
  let id = 1;
  const now = Date.UTC(2026, 0, 1);
  for (let r = 0; r < 20; r++)
    for (const h of [1, 2, 3, 4])
      for (const a of [1, 2, 3, 4]) {
        if (h === a) continue;
        const lh = Math.exp(0.3 + 0.2 + strength[h] - strength[a]), la = Math.exp(0.3 + strength[a] - strength[h]);
        ms.push({ id: id++, comp: "PL", season: 2025, date: now - (r + 1) * 86400_000 * 7, home: h, away: a, hg: Math.round(lh * 10) / 10, ag: Math.round(la * 10) / 10 });
      }
  const f = fitPoisson(ms, now, 365, 0.5)!;
  assert.ok(f.att.get(1)! > f.att.get(2)! && f.att.get(2)! > f.att.get(4)!);
  assert.ok(f.def.get(4)! > f.def.get(1)!);
  assert.ok(f.home > 1.1 && f.home < 1.35, `home ${f.home}`);
  const [l1, l4] = poissonLambdas(f, 1, 4)!;
  assert.ok(l1 > 2 * l4);
});

await t("내 예측 링크: 인코딩·디코딩·정리", () => {
  const picks = { 552123: "H", 9: "D", 1000000: "A" } as const;
  const enc = encodePicks(picks);
  assert.deepEqual(decodePicks(enc), { 9: "D", 552123: "H", 1000000: "A" });
  assert.ok(enc.startsWith("9D-"), enc);
  assert.deepEqual(decodePicks("zzX-<script>-11h-.."), { 37: "H" }, "잘못된 조각은 버림");
  assert.equal(Object.keys(decodePicks(Array.from({ length: 40 }, (_, i) => `${(i + 1).toString(36)}H`).join("-"))).length, 20, "최대 20경기");
  assert.equal(cleanName("  <b>제임스</b>  "), "b제임스/b");
  assert.equal(cleanName("가나다라마바사아자차카타파하"), "가나다라마바사아자차카타");
  assert.equal(picksUrl({ 9: "D" }, "민수"), "/apps/sports-forecast/picks?p=9D&n=%EB%AF%BC%EC%88%98");
  assert.equal(outcomeOf(2, 1), "H");
  assert.equal(outcomeOf(1, 1), "D");
  assert.equal(outcomeOf(null, 1), null);
  assert.equal(modelPick({ p_home: 0.3, p_draw: 0.25, p_away: 0.45 }), "A");
});

console.log(`\n${passed}개 통과`);
