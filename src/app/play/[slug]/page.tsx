import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GamePlayer } from "@/components/GamePlayer";
import { GameAbout } from "@/components/SeoSections";
import { gameById } from "@/lib/games";
import { GAME_SEO } from "@/lib/seo";
import { SITE_URL, langAlternates, serverLang } from "@/lib/serverLang";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = gameById(slug);
  if (!g) return {};
  const { lang, fromParam } = await serverLang();
  const seo = GAME_SEO[g.id]?.[lang];
  const title = seo?.title ?? g.title[lang];
  const description = seo?.description ?? g.desc[lang];
  return {
    title,
    description,
    keywords: seo?.keywords,
    ...(g.hidden ? { robots: { index: false, follow: false } } : {}),
    alternates: langAlternates(`/play/${g.id}`, lang, fromParam),
    openGraph: { title, description, images: [{ url: g.thumb }], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [g.thumb] },
  };
}

export default async function PlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = gameById(slug);
  if (!g) notFound();
  const { lang } = await serverLang();
  const seo = GAME_SEO[g.id]?.[lang];
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "VideoGame",
      name: g.title[lang],
      alternateName: g.title[lang === "ko" ? "en" : "ko"],
      description: seo?.description ?? g.desc[lang],
      url: `${SITE_URL}/play/${g.id}`,
      image: `${SITE_URL}${g.thumb}`,
      genre: seo?.tags,
      keywords: seo?.keywords.join(", "),
      inLanguage: ["ko", "en"],
      gamePlatform: "Web browser",
      applicationCategory: "Game",
      operatingSystem: "Any",
      playMode: g.online ? ["SinglePlayer", "MultiPlayer"] : "SinglePlayer",
      offers: { "@type": "Offer", price: 0, priceCurrency: "KRW" },
      author: { "@type": "Person", name: "제임스웹" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: lang === "ko" ? "미니 게임 천국" : "Mini Game Heaven", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: g.title[lang], item: `${SITE_URL}/play/${g.id}` },
      ],
    },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GamePlayer gameId={g.id} />
      <GameAbout gameId={g.id} lang={lang} />
    </>
  );
}
