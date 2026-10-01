import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { cleanShareSlug, getShare, passportSummary } from "@/lib/shares";
import { serverLang } from "@/lib/serverLang";

const load = cache(async (slug: string) => {
  const r = await getShare(slug);
  return r && r.game_id === "passport-map" ? r : null;
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const r = await load((await params).slug);
  if (!r) return { title: "Passport Map" };
  const { lang } = await serverLang();
  const s = passportSummary(r.data);
  const title = s.name ? `${s.name} · Passport Map` : lang === "en" ? "My Passport Map" : "나의 Passport Map";
  const description =
    lang === "en"
      ? `${s.countries} countries and ${s.cities} cities visited. Make your own travel map on Passport Map!`
      : `나라 ${s.countries}곳, 도시 ${s.cities}곳을 다녀왔어요. 나도 내 여행 지도를 만들어 보세요!`;
  const images = s.og ? [{ url: s.og, width: 1200, height: 630 }] : undefined;
  return {
    title,
    description,
    robots: { index: false, follow: true },
    openGraph: { title, description, images, type: "website" },
    twitter: { card: "summary_large_image", title, description, images: s.og ? [s.og] : undefined },
  };
}

// 내 지도 전용 주소 — Passport Map 을 보기 전용으로 띄운다
export default async function SharedPassport({ params }: { params: Promise<{ slug: string }> }) {
  const r = await load((await params).slug);
  if (!r) notFound();
  const s = passportSummary(r.data);
  const { lang } = await serverLang();
  return (
    <div style={{ height: "calc(100dvh - 52px)", display: "flex" }}>
      <iframe
        src={`/games/passport-map/index.html?view=${cleanShareSlug(r.slug)}&lang=${lang}`}
        title={s.name ?? "Passport Map"}
        allow="clipboard-write; web-share"
        style={{ flex: 1, width: "100%", border: 0, display: "block" }}
      />
    </div>
  );
}
