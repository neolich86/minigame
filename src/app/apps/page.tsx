import type { Metadata } from "next";
import { GameList } from "@/components/GameList";
import { KindAbout } from "@/components/SeoSections";
import { itemPath, itemsOf } from "@/lib/games";
import { KIND_SEO } from "@/lib/seo";
import { SITE_URL, langAlternates, serverLang } from "@/lib/serverLang";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, fromParam } = await serverLang();
  const seo = KIND_SEO.app[lang];
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: langAlternates("/apps", lang, fromParam),
    openGraph: { title: seo.title, description: seo.description, type: "website" },
  };
}

export default async function Page() {
  const { lang } = await serverLang();
  const seo = KIND_SEO.app[lang];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: seo.title,
    itemListElement: itemsOf("app").map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}${itemPath(g)}`,
      name: g.title[lang],
    })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GameList kind="app">
        <KindAbout kind="app" lang={lang} />
      </GameList>
    </>
  );
}
