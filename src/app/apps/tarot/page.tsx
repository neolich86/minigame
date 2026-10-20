import type { Metadata } from "next";
import Link from "next/link";
import { ItemPage, itemMetadata } from "@/lib/itemPage";
import { parseTarotShare, tarotShareDesc, tarotShareQuery, tarotShareTitle } from "@/lib/tarot-share";
import { newYear } from "@/lib/tarot-cards";
import { TarotCardGrid } from "@/components/TarotPages";
import { serverLang } from "@/lib/serverLang";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const base = await itemMetadata("tarot", "app");
  // 결과 공유 링크 — 카톡·메신저 미리보기에 친구 이름과 뽑은 카드가 보이도록
  const sp = await searchParams;
  const x = parseTarotShare((k) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  });
  if (!x) return base;
  const title = tarotShareTitle(x);
  const description = tarotShareDesc(x);
  const image = `/api/tarot/og?${tarotShareQuery(x)}`;
  return {
    ...base,
    title,
    description,
    robots: { index: false, follow: true },
    openGraph: { title, description, images: [{ url: image, width: 1200, height: 630 }], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function Page() {
  const { lang } = await serverLang();
  const ko = lang === "ko";
  const y = newYear();
  return (
    <>
      <ItemPage slug="tarot" kind="app" />
      <section className="wrap mid tarot-dict-teaser">
        <h2>{ko ? "메이저 아르카나 22장 카드 의미" : "Meanings of the 22 Major Arcana"}</h2>
        <p>
          {ko
            ? "카드를 눌러 정방향·역방향 의미와 애정·재회·금전·사업·직장·학업·인간관계별 해석을 확인해 보세요."
            : "Tap a card to read its upright and reversed meanings for love, reunion, money, business, career, study and relationships."}{" "}
          <Link href="/apps/tarot/cards">{ko ? "카드 사전 전체 보기 →" : "Open the card dictionary →"}</Link>
          {" · "}
          <Link href="/apps/tarot/year">{ko ? `${y} 신년운세 타로 →` : `${y} New Year tarot →`}</Link>
        </p>
        <TarotCardGrid lang={lang} />
      </section>
    </>
  );
}
