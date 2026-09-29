import { GameList } from "@/components/GameList";
import { HomeAbout } from "@/components/SeoSections";
import { GAMES } from "@/lib/games";
import { GAME_SEO, HOME_SEO } from "@/lib/seo";
import { SITE_URL, serverLang } from "@/lib/serverLang";

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
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: HOME_SEO[lang].title,
      itemListElement: GAMES.map((g, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/play/${g.id}`,
        name: g.title[lang],
        description: GAME_SEO[g.id]?.[lang]?.description ?? g.desc[lang],
      })),
    },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GameList>
        <HomeAbout lang={lang} />
      </GameList>
    </>
  );
}
