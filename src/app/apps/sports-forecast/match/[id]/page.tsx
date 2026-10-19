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

  // 이벤트(SportsEvent) 마크업은 경기장 주소(location) 같은 필수값이 없어 구글 경고가 나므로 쓰지 않는다.
  // 이 페이지는 "경기 예측 글"이므로 일반 웹페이지 + 이동 경로(breadcrumb)로만 표시한다.
  const url = `${SITE_URL}${BASE}/match/${m.id}`;
  const comp = COMP_NAME[m.competition]?.[lang] ?? m.competition;
  const jsonLd =
    m.home && m.away
      ? {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: lang === "ko" ? `${teamName(m.home, lang)} vs ${teamName(m.away, lang)} 예측` : `${teamName(m.home, lang)} vs ${teamName(m.away, lang)} prediction`,
          url,
          inLanguage: lang,
          breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: lang === "ko" ? "스포츠 승부 예측" : "Sports forecast", item: `${SITE_URL}${BASE}` },
              { "@type": "ListItem", position: 2, name: comp, item: url },
            ],
          },
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
