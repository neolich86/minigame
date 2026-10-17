import type { Metadata } from "next";
import { ItemPage, itemMetadata } from "@/lib/itemPage";
import { exploreShareDesc, exploreShareQuery, exploreShareTitle, parseExploreShare } from "@/lib/explore-share";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const slug = (await params).slug;
  const base = await itemMetadata(slug, "app");
  // 탐험 지도 자랑하기 링크 — 카톡·메신저 미리보기에 친구의 탐험률 카드가 뜨도록
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
  return base;
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <ItemPage slug={(await params).slug} kind="app" />;
}
