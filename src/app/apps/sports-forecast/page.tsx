import type { Metadata } from "next";
import { FcHome } from "@/components/forecast/ForecastUI";
import { gradedPredictions, matchesBetween } from "@/lib/forecast/read";
import { BASE, LIST_COMPS, SEO, fcMeta, nowMs, rangeFor, type RangeKey } from "@/lib/forecast/pages";
import { SITE_URL, serverLang } from "@/lib/serverLang";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, fromParam } = await serverLang();
  return fcMeta(lang, fromParam, BASE, SEO[lang].title, SEO[lang].description);
}

const RANGES: RangeKey[] = ["today", "tomorrow", "weekend", "week", "past"];

export default async function Page({ searchParams }: { searchParams: Promise<{ d?: string; c?: string }> }) {
  const sp = await searchParams;
  const { lang } = await serverLang();
  const comp = sp.c && LIST_COMPS.includes(sp.c) ? sp.c : null;
  let range: RangeKey = RANGES.includes(sp.d as RangeKey) ? (sp.d as RangeKey) : "today";
  let [a, b] = rangeFor(range);
  let matches = await matchesBetween(a, b, comp ?? undefined).catch(() => []);
  // 기본(오늘)인데 경기가 없으면 7일로 넓힌다
  if (!sp.d && matches.length === 0) {
    range = "week";
    [a, b] = rangeFor(range);
    matches = await matchesBetween(a, b, comp ?? undefined).catch(() => []);
  }
  if (range === "past") matches = matches.reverse();

  const since = nowMs() - 30 * 86400_000;
  const graded = (await gradedPredictions().catch(() => [])).filter((g) => Date.parse(g.utc_date) >= since);
  const live = graded.length ? { n: graded.length, acc: graded.filter((g) => g.hit).length / graded.length } : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: lang === "ko" ? "스포츠 승부 예측" : "Sports Forecast",
    alternateName: lang === "ko" ? "Sports Forecast" : "스포츠 승부 예측",
    url: `${SITE_URL}${BASE}`,
    description: SEO[lang].description,
    applicationCategory: "SportsApplication",
    operatingSystem: "Any",
    inLanguage: ["ko", "en"],
    offers: { "@type": "Offer", price: 0, priceCurrency: "KRW" },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <FcHome range={range} comp={comp} comps={LIST_COMPS} matches={matches} live={live} />
    </>
  );
}
