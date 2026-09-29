import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OnlineLobby } from "@/components/OnlineLobby";
import { GameAbout } from "@/components/SeoSections";
import { gameById } from "@/lib/games";
import { GAME_SEO } from "@/lib/seo";
import { langAlternates, serverLang } from "@/lib/serverLang";

export async function generateMetadata({ params }: { params: Promise<{ game: string }> }): Promise<Metadata> {
  const { game } = await params;
  const g = gameById(game);
  if (!g) return {};
  const { lang, fromParam } = await serverLang();
  const seo = GAME_SEO[g.id]?.[lang];
  const title = lang === "ko" ? `${g.title.ko} 온라인 대전 - 친구와 무료 멀티플레이 보드게임` : `${g.title.en} Online - Free Multiplayer Board Game with Friends`;
  return {
    title,
    description: seo?.description ?? g.desc[lang],
    keywords: seo?.keywords,
    alternates: langAlternates(`/online/${g.id}`, lang, fromParam),
    openGraph: { title, description: seo?.description, images: [{ url: g.thumb }] },
  };
}

export default async function OnlinePage({ params }: { params: Promise<{ game: string }> }) {
  const { game } = await params;
  const g = gameById(game);
  if (!g || !g.online) notFound();
  const { lang } = await serverLang();
  return (
    <>
      <OnlineLobby gameId={g.id} />
      <GameAbout gameId={g.id} lang={lang} subHeading />
    </>
  );
}
