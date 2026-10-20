import type { Metadata } from "next";
import { ItemPage, itemMetadata } from "@/lib/itemPage";
import { exploreShareDesc, exploreShareQuery, exploreShareTitle, parseExploreShare } from "@/lib/explore-share";
import { parseTarotShare, tarotShareDesc, tarotShareQuery, tarotShareTitle } from "@/lib/tarot-share";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const slug = (await params).slug;
  const base = await itemMetadata(slug, "app");
  // 동네 정복 자랑하기 링크 — 카톡·메신저 미리보기에 친구의 탐험률 카드가 뜨도록
  if (slug === "explore-map") {
    const sp = await searchParams;
    const x = parseExploreShare((k) => {
      const v = sp[k];
      return Array.isArray(v) ? v[0] : v;
    });
    if (x) {
      const title = exploreShareTitle(x);
      const description = exploreShareDesc(x);
      const image = `/api/explore/card?${exploreShareQuery(x)}`;
      return {
        ...base,
        title,
        description,
        robots: { index: false, follow: true },
        openGraph: { title, description, images: [{ url: image, width: 1200, height: 630 }], type: "website" },
        twitter: { card: "summary_large_image", title, description, images: [image] },
      };
    }
  }
  // 타로 결과 링크 — 미리보기에 뽑은 카드가 보이도록
  if (slug === "tarot") {
    const sp = await searchParams;
    const x = parseTarotShare((k) => {
      const v = sp[k];
      return Array.isArray(v) ? v[0] : v;
    });
    if (x) {
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
  }
  return base;
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <ItemPage slug={(await params).slug} kind="app" />;
}
