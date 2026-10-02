import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GamePlayer } from "@/components/GamePlayer";
import { GameAbout } from "@/components/SeoSections";
import { KIND_INDEX, gameById, itemPath, kindOf, type Kind } from "@/lib/games";
import { GAME_SEO, KIND_SEO } from "@/lib/seo";
import { SITE_URL, langAlternates, serverLang } from "@/lib/serverLang";

// /play · /tools · /apps 의 개별 페이지가 함께 쓰는 메타데이터와 본문

function find(slug: string, kind: Kind) {
  const g = gameById(slug);
  return g && kindOf(g) === kind ? g : undefined;
}

export async function itemMetadata(slug: string, kind: Kind): Promise<Metadata> {
  const g = find(slug, kind);
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
    alternates: langAlternates(itemPath(g), lang, fromParam),
    openGraph: { title, description, images: [{ url: g.thumb }], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [g.thumb] },
  };
}

export async function ItemPage({ slug, kind }: { slug: string; kind: Kind }) {
  const g = find(slug, kind);
  if (!g) notFound();
  const { lang } = await serverLang();
  const seo = GAME_SEO[g.id]?.[lang];
  const url = `${SITE_URL}${itemPath(g)}`;
  const common = {
    "@context": "https://schema.org",
    name: g.title[lang],
    alternateName: g.title[lang === "ko" ? "en" : "ko"],
    description: seo?.description ?? g.desc[lang],
    url,
    image: `${SITE_URL}${g.thumb}`,
    keywords: seo?.keywords.join(", "),
    inLanguage: ["ko", "en"],
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: 0, priceCurrency: "KRW" },
    author: { "@type": "Person", name: "제임스웹" },
  };
  const main =
    kind === "game"
      ? {
          ...common,
          "@type": "VideoGame",
          genre: seo?.tags,
          gamePlatform: "Web browser",
          applicationCategory: "Game",
          playMode: g.online ? ["SinglePlayer", "MultiPlayer"] : "SinglePlayer",
        }
      : {
          ...common,
          "@type": "WebApplication",
          applicationCategory: kind === "tool" ? "UtilitiesApplication" : "LifestyleApplication",
          browserRequirements: "Requires JavaScript",
        };
  const crumbs: { name: string; item: string }[] = [{ name: lang === "ko" ? "미니 게임 천국" : "Mini Game Heaven", item: SITE_URL }];
  if (kind !== "game") crumbs.push({ name: KIND_SEO[kind][lang].heading, item: `${SITE_URL}${KIND_INDEX[kind]}` });
  crumbs.push({ name: g.title[lang], item: url });
  const jsonLd = [
    main,
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, ...c })),
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
