import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { FcMatch } from "@/components/forecast/ForecastUI";
import { COMP_NAME, headToHead, matchById, ratingHistory, recentForm, standings } from "@/lib/forecast/read";
import { BASE, fcMeta } from "@/lib/forecast/pages";
import { teamName } from "@/lib/forecast/teams";
import { SITE_URL, serverLang } from "@/lib/serverLang";

const load = cache(async (id: string) => {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) return null;
  return matchById(n).catch(() => null);
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const m = await load((await params).id);
  const { lang, fromParam } = await serverLang();
  if (!m || !m.home || !m.away) return { title: lang === "ko" ? "경기 예측" : "Match forecast" };
  const h = teamName(m.home, lang), a = teamName(m.away, lang);
  const comp = COMP_NAME[m.competition]?.[lang] ?? m.competition;
  const p = m.pred;
  const pp = (x: number) => `${Math.round(x * 100)}%`;
  const title = lang === "ko" ? `${h} vs ${a} 예측 · ${comp}` : `${h} vs ${a} prediction · ${comp}`;
  const description = p
    ? lang === "ko"
      ? `${h} 승 ${pp(p.p_home)}, 무승부 ${pp(p.p_draw)}, ${a} 승 ${pp(p.p_away)}. 유력 스코어와 예측 근거를 확인하세요.`
      : `${h} win ${pp(p.p_home)}, draw ${pp(p.p_draw)}, ${a} win ${pp(p.p_away)}. See the most likely scores and why.`
    : lang === "ko"
      ? `${comp} ${h} vs ${a} 경기 승무패 확률 예측`
      : `${comp} ${h} vs ${a} win/draw/loss forecast`;
  return fcMeta(lang, fromParam, `${BASE}/match/${m.id}`, title, description);
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const m = await load((await params).id);
  if (!m) notFound();
  const { lang } = await serverLang();
  const before = m.status === "FINISHED" ? m.utc_date : new Date().toISOString();
  const yearAgo = new Date(Date.parse(m.utc_date) - 365 * 86400_000).toISOString();
  const safe = <T,>(p: Promise<T>, fb: T) => p.catch(() => fb);
  const [formH, formA, h2h, trendH, trendA, table] = await Promise.all([
    m.home ? safe(recentForm(m.home.id, before), []) : Promise.resolve([]),
    m.away ? safe(recentForm(m.away.id, before), []) : Promise.resolve([]),
    m.home && m.away ? safe(headToHead(m.home.id, m.away.id, m.utc_date), []) : Promise.resolve([]),
    m.home ? safe(ratingHistory(m.home.id, yearAgo), []) : Promise.resolve([]),
    m.away ? safe(ratingHistory(m.away.id, yearAgo), []) : Promise.resolve([]),
    safe(standings(m.competition), null),
  ]);
  const pos = (id?: number) => {
    for (const g of table?.groups ?? []) {
      if (g.type && g.type !== "TOTAL") continue;
      const r = g.table.find((x) => x.team.id === id);
      if (r) return r.position;
    }
    return null;
  };

  const jsonLd =
    m.home && m.away
      ? {
          "@context": "https://schema.org",
          "@type": "SportsEvent",
          name: `${teamName(m.home, lang)} vs ${teamName(m.away, lang)}`,
          startDate: m.utc_date,
          sport: "Soccer",
          eventStatus: m.status === "POSTPONED" ? "https://schema.org/EventPostponed" : m.status === "CANCELLED" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
          url: `${SITE_URL}${BASE}/match/${m.id}`,
          homeTeam: { "@type": "SportsTeam", name: m.home.name },
          awayTeam: { "@type": "SportsTeam", name: m.away.name },
          superEvent: { "@type": "SportsEvent", name: COMP_NAME[m.competition]?.en ?? m.competition },
        }
      : null;

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <FcMatch
        d={{
          m,
          formH,
          formA,
          h2h,
          trendH,
          trendA,
          posH: pos(m.home?.id),
          posA: pos(m.away?.id),
        }}
      />
    </>
  );
}
