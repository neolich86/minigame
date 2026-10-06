import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FcLeague } from "@/components/forecast/ForecastUI";
import { COMP_NAME, latestRatings, leagueSim, matchesBetween, standings, teamsByIds } from "@/lib/forecast/read";
import { BASE, LIST_COMPS, fcMeta, nowMs } from "@/lib/forecast/pages";
import type { TeamInfo } from "@/lib/forecast/teams";
import { serverLang } from "@/lib/serverLang";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const code = (await params).code.toUpperCase();
  const { lang, fromParam } = await serverLang();
  const name = COMP_NAME[code]?.[lang] ?? code;
  const title = lang === "ko" ? `${name} 우승 확률·순위 예측` : `${name} title odds & predictions`;
  const description =
    lang === "ko"
      ? `${name} 우승·강등 확률 시뮬레이션, 순위표와 팀 레이팅, 다가오는 경기의 승·무·패 확률 예측.`
      : `${name} title and relegation odds, standings, team ratings and win/draw/loss forecasts for upcoming matches.`;
  return fcMeta(lang, fromParam, `${BASE}/league/${code}`, title, description);
}

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code.toUpperCase();
  if (!LIST_COMPS.includes(code)) notFound();
  const now = nowMs();
  const [table, sim, upcoming] = await Promise.all([
    standings(code).catch(() => null),
    leagueSim(code).catch(() => null),
    matchesBetween(new Date(now - 3 * 3600_000).toISOString(), new Date(now + 8 * 86400_000).toISOString(), code).catch(() => []),
  ]);
  // 시뮬레이션은 같은 시즌 것만
  const simData = sim && table && sim.season === table.season ? sim.data : null;
  const groups = table?.groups ?? [];
  const ids = [...new Set([...groups.flatMap((g) => g.table.map((r) => r.team.id)), ...(sim?.data.teams.map((t) => t.id) ?? [])])];
  const [teams, ratings] = await Promise.all([teamsByIds(ids).catch(() => new Map()), latestRatings(ids).catch(() => new Map())]);
  const teamObj: Record<number, TeamInfo> = Object.fromEntries(teams);
  const ratingObj: Record<number, number> = {};
  for (const [id, r] of ratings) if (r.elo != null) ratingObj[id] = r.elo;
  return <FcLeague comp={code} comps={LIST_COMPS} table={groups} teams={teamObj} ratings={ratingObj} upcoming={upcoming.filter((m) => m.status !== "FINISHED")} sim={simData} />;
}
