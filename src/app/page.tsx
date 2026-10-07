import { GameList } from "@/components/GameList";
import { HomeAbout, KindStrip } from "@/components/SeoSections";
import { GAMES, itemPath } from "@/lib/games";
import { GAME_SEO, HOME_SEO } from "@/lib/seo";
import type { Metadata } from "next";
import { SITE_URL, langAlternates, serverLang } from "@/lib/serverLang";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, fromParam } = await serverLang();
  return { alternates: { ...langAlternates("/", lang, fromParam), types: { "application/rss+xml": "/rss.xml" } } };
}

export default async function Home() {
  const { lang } = await serverLang();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: lang === "ko" ? "미니 게임 천국" : "Mini Game Heaven",
      alternateName: ["미니 게임 천국", "Mini Game Heaven", "미니게임천국"],
      url: SITE_URL,
      inLanguage: ["ko", "en"],
      description: HOME_SEO[lang].description,
      publisher: { "@id": `${SITE_URL}/#org` },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: lang === "ko" ? "미니 게임 천국" : "Mini Game Heaven",
      url: SITE_URL,
      logo: `${SITE_URL}/icons/icon-512.png`,
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: HOME_SEO[lang].title,
      itemListElement: GAMES.map((g, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}${itemPath(g)}`,
        name: g.title[lang],
        description: GAME_SEO[g.id]?.[lang]?.description ?? g.desc[lang],
      })),
    },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GameList>
        <KindStrip kind="tool" lang={lang} />
        <KindStrip kind="app" lang={lang} />
        <HomeAbout lang={lang} />
      </GameList>
    </>
  );
}
