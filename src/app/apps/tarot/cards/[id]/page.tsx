import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Crumbs, TarotCta } from "@/components/TarotPages";
import { ROMAN, STAGE, TAROT_CARDS, TAROT_CAT_ORDER, cardBySlug, cardImg, cardPath, cardSlug, catLabel, type TarotCard } from "@/lib/tarot-cards";
import type { Lang } from "@/lib/i18n";
import { SITE_URL, langAlternates, serverLang } from "@/lib/serverLang";

type Props = { params: Promise<{ id: string }> };

function Dir({ dir, c, lang }: { dir: "up" | "rev"; c: TarotCard; lang: Lang }) {
  const ko = lang === "ko";
  const n = c.name[lang];
  return (
    <section className="tarot-dir">
      <h2>
        {n} {dir === "up" ? (ko ? "정방향 의미" : "upright meaning") : ko ? "역방향 의미" : "reversed meaning"}
      </h2>
      <p className="tarot-kw">
        {c.keywords[dir][lang].map((k) => (
          <span key={k} className="seo-tag">
            #{k}
          </span>
        ))}
      </p>
      <dl className="tarot-readings">
        {TAROT_CAT_ORDER.map((cat) => (
          <div key={cat}>
            <dt>{cat === "year" ? (ko ? "올해 운세" : "Year ahead") : catLabel(cat, lang)}</dt>
            <dd>{c.readings[cat][dir][lang]}</dd>
          </div>
        ))}
      </dl>
      <p className="tarot-advice">
        <b>{ko ? "조언" : "Advice"}</b> “{c.advice[dir][lang]}”
      </p>
    </section>
  );
}


export function generateStaticParams() {
  return TAROT_CARDS.map((c) => ({ id: cardSlug(c) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = cardBySlug((await params).id);
  if (!c) return {};
  const { lang, fromParam } = await serverLang();
  const n = c.name[lang];
  const title =
    lang === "ko"
      ? `${n} 카드 의미 · 정방향 역방향 해석 (${c.name.en}) | 타로 운세`
      : `${n} Tarot Card Meaning · Upright & Reversed | Tarot Reading`;
  const description =
    lang === "ko"
      ? `타로 ${c.number}번 ${n} 카드 — 정방향 ${c.keywords.up.ko.join("·")}, 역방향 ${c.keywords.rev.ko.join("·")}. 애정운·재회운·금전운·사업운·직장운·학업운·인간관계별 해석.`
      : `Tarot card ${c.number}, ${n} — upright: ${c.keywords.up.en.join(", ")}; reversed: ${c.keywords.rev.en.join(", ")}. Readings for love, money, career and more.`;
  return {
    title: { absolute: title },
    description,
    alternates: langAlternates(cardPath(c), lang, fromParam),
    openGraph: { title, description, images: [{ url: cardImg(c, 600), width: 600, height: 1032 }], type: "article" },
  };
}

export default async function Page({ params }: Props) {
  const c = cardBySlug((await params).id);
  if (!c) notFound();
  const { lang } = await serverLang();
  const ko = lang === "ko";
  const n = c.name[lang];
  const prev = TAROT_CARDS[(c.number + 21) % 22];
  const next = TAROT_CARDS[(c.number + 1) % 22];
  const url = `${SITE_URL}${cardPath(c)}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: ko ? `${n} 카드 의미 · 정방향 역방향 해석` : `${n} tarot card meaning`,
      image: `${SITE_URL}${cardImg(c, 600)}`,
      url,
      inLanguage: lang,
      author: { "@type": "Person", name: "제임스웹" },
      about: { "@type": "Thing", name: `${c.name.en} (tarot card)` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: ko ? "타로 운세" : "Tarot Reading", item: `${SITE_URL}/apps/tarot` },
        { "@type": "ListItem", position: 2, name: ko ? "카드 사전" : "Card dictionary", item: `${SITE_URL}/apps/tarot/cards` },
        { "@type": "ListItem", position: 3, name: n, item: url },
      ],
    },
  ];
  return (
    <div className="wrap mid legal tarot-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Crumbs
        items={[
          { name: ko ? "타로 운세" : "Tarot Reading", href: "/apps/tarot" },
          { name: ko ? "카드 사전" : "Card dictionary", href: "/apps/tarot/cards" },
          { name: n },
        ]}
      />
      <div className="tarot-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cardImg(c, 600)} alt={ko ? `타로 ${n} 카드` : `${n} tarot card`} width={240} height={413} />
        <div>
          <p className="tarot-num">
            {ko ? "메이저 아르카나" : "Major Arcana"} {ROMAN[c.number]} · {STAGE[c.stage][lang]}
          </p>
          <h1 className="page-title">
            {n} {ko ? "카드 의미" : "Tarot Card Meaning"}
            {ko && <small> ({c.name.en})</small>}
          </h1>
          <p>
            <b>{ko ? "정방향" : "Upright"}</b> {c.keywords.up[lang].join(" · ")}
            <br />
            <b>{ko ? "역방향" : "Reversed"}</b> {c.keywords.rev[lang].join(" · ")}
          </p>
          <TarotCta lang={lang} label={ko ? "이 카드가 나올까? 타로 뽑아 보기" : "Will you draw it? Try a reading"} />
        </div>
      </div>
      <Dir dir="up" c={c} lang={lang} />
      <Dir dir="rev" c={c} lang={lang} />
      <nav className="tarot-pn">
        <Link href={cardPath(prev)}>← {prev.name[lang]}</Link>
        <Link href="/apps/tarot/cards">{ko ? "카드 22장 목록" : "All 22 cards"}</Link>
        <Link href={cardPath(next)}>{next.name[lang]} →</Link>
      </nav>
      <p className="small dim">
        {ko
          ? "카드 그림: 라이더-웨이트-스미스 덱 1909년 원본(퍼블릭 도메인). 해석은 재미로 보는 참고용이며 중요한 결정은 스스로 판단하세요."
          : "Card art: original 1909 Rider–Waite–Smith deck (public domain). Readings are for fun and reflection."}
      </p>
    </div>
  );
}
