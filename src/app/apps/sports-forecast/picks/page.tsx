import type { Metadata } from "next";
import { cache } from "react";
import { FcPicks } from "@/components/forecast/ForecastUI";
import { matchesByIds } from "@/lib/forecast/read";
import { cleanName, decodePicks, encodePicks } from "@/lib/forecast/picks";
import { SITE_URL, serverLang } from "@/lib/serverLang";

type SP = Promise<{ p?: string; n?: string }>;

const load = cache(async (p: string) => {
  const picks = decodePicks(p);
  const ids = Object.keys(picks).map(Number);
  const matches = await matchesByIds(ids).catch(() => []);
  // 없는 경기 id 는 버린다
  const known = new Set(matches.map((m) => m.id));
  for (const id of ids) if (!known.has(id)) delete picks[id];
  return { picks, matches };
});

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const { lang } = await serverLang();
  const { picks } = await load(sp.p ?? "");
  const n = Object.keys(picks).length;
  const name = cleanName(sp.n);
  const who = name || (lang === "ko" ? "친구" : "A friend");
  const title = lang === "ko" ? `${who}의 승부 예측 ${n}경기` : `${who}'s picks for ${n} matches`;
  const description =
    lang === "ko" ? "누가 더 많이 맞힐까? 나도 경기마다 승·무·패를 골라 예측 카드를 만들어 보세요." : "Who'll get more right? Pick home, draw or away for each match and make your own card.";
  const q = new URLSearchParams({ p: encodePicks(picks), lang });
  if (name) q.set("n", name);
  const img = `${SITE_URL}/api/forecast/picks-og?${q}`;
  return {
    title,
    description,
    robots: { index: false, follow: true },
    openGraph: { title, description, type: "website", images: [{ url: img, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [img] },
  };
}

export default async function Page({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { lang } = await serverLang();
  const { picks, matches } = await load(sp.p ?? "");
  const q = new URLSearchParams({ p: encodePicks(picks), lang });
  return <FcPicks picks={picks} matches={matches} name={cleanName(sp.n)} siteUrl={SITE_URL} ogPath={`/api/forecast/picks-og?${q}`} />;
}
