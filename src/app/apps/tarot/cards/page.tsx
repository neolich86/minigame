import type { Metadata } from "next";
import { Crumbs, TarotCardGrid, TarotCta } from "@/components/TarotPages";
import { STAGE, TAROT_CARDS, cardPath } from "@/lib/tarot-cards";
import { SITE_URL, langAlternates, serverLang } from "@/lib/serverLang";

const PATH = "/apps/tarot/cards";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, fromParam } = await serverLang();
  const title = lang === "ko" ? "타로 카드 의미 22장 · 메이저 아르카나 정방향 역방향 해석" : "Tarot Card Meanings · All 22 Major Arcana, Upright & Reversed";
  const description =
    lang === "ko"
      ? "바보부터 세계까지 메이저 아르카나 22장의 정방향·역방향 키워드와 애정운·재회운·금전운·사업운·직장운·학업운·인간관계 해석을 한곳에 정리했어요."
      : "Upright and reversed keywords for all 22 Major Arcana, from The Fool to The World, with readings for love, reunion, money, business, career, study and relationships.";
  return {
    title,
    description,
    alternates: langAlternates(PATH, lang, fromParam),
    openGraph: { title, description, images: [{ url: "/thumbs/tarot.jpg" }], type: "website" },
  };
}

export default async function Page() {
  const { lang } = await serverLang();
  const ko = lang === "ko";
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: ko ? "타로 카드 의미 22장" : "Tarot card meanings",
      url: `${SITE_URL}${PATH}`,
      inLanguage: ["ko", "en"],
      hasPart: TAROT_CARDS.map((c) => ({ "@type": "Article", name: c.name[lang], url: `${SITE_URL}${cardPath(c)}` })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: ko ? "타로 운세" : "Tarot Reading", item: `${SITE_URL}/apps/tarot` },
        { "@type": "ListItem", position: 2, name: ko ? "카드 사전" : "Card dictionary", item: `${SITE_URL}${PATH}` },
      ],
    },
  ];
  return (
    <div className="wrap mid legal tarot-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Crumbs items={[{ name: ko ? "타로 운세" : "Tarot Reading", href: "/apps/tarot" }, { name: ko ? "카드 사전" : "Card dictionary" }]} />
      <h1 className="page-title">{ko ? "타로 카드 의미 · 메이저 아르카나 22장" : "Tarot Card Meanings · The 22 Major Arcana"}</h1>
      <p>
        {ko
          ? "메이저 아르카나는 0번 바보에서 21번 세계까지, 한 사람이 길을 떠나 성장하고 완성에 이르는 여정을 22장의 그림으로 보여 줘요. 같은 카드라도 정방향으로 나오면 그 기운이 순조롭게 흐르는 것으로, 역방향으로 나오면 막히거나 지나치거나 아직 준비되지 않은 상태로 읽어요."
          : "The Major Arcana run from 0, The Fool, to 21, The World, telling the story of a journey from first steps to completion in 22 pictures. Upright, a card's energy flows freely; reversed, it is blocked, overdone or not yet ready."}
      </p>
      <h2>{ko ? "바보의 여정 — 세 단계" : "The Fool's journey in three stages"}</h2>
      <ul>
        {([1, 2, 3] as const).map((s) => (
          <li key={s}>
            <b>{STAGE[s][lang]}</b> —{" "}
            {TAROT_CARDS.filter((c) => c.stage === s)
              .map((c) => c.name[lang])
              .join(", ")}
          </li>
        ))}
      </ul>
      <TarotCta lang={lang} />
      <h2>{ko ? "카드를 눌러 의미 보기" : "Tap a card for its meaning"}</h2>
      <TarotCardGrid lang={lang} caption={(c) => c.keywords.up[lang].join(" · ")} />
      <p className="small dim">
        {ko
          ? "카드 그림: 라이더-웨이트-스미스 덱 1909년 원본(퍼블릭 도메인). 해석은 재미로 보는 참고용이에요."
          : "Card art: original 1909 Rider–Waite–Smith deck (public domain). Readings are for fun and reflection."}
      </p>
    </div>
  );
}
