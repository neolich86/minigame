import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminDb, cleanSlug, getReport } from "@/lib/mypost-store";
import { summarize } from "@/lib/mypost-summary";

async function load(slug: string) {
  const db = adminDb();
  return db ? getReport(db, cleanSlug(slug)) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const r = await load((await params).slug);
  if (!r) return { title: "My Post 2026" };
  const s = summarize(r.data);
  const title = `@${r.username}의 ${r.year} BEST 9`;
  const description = `게시물 ${s.posts}개 · 좋아요 ${s.total.toLocaleString("ko-KR")}개 · 올해의 타이틀 “${s.title}”. 내 인스타 ${r.year}년을 분석해봤습니다. 나도 만들어 보세요!`;
  const image = { url: `/api/mypost/og/${r.slug}?v=${r.data.at}`, width: 1200, height: 630 };
  return {
    title,
    description,
    robots: { index: false, follow: true },
    openGraph: { title, description, images: [image], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

// 공유 링크 — 리포트 화면(정적 페이지)을 이 주소 아래에서 보여준다
export default async function SharedReport({ params }: { params: Promise<{ slug: string }> }) {
  const r = await load((await params).slug);
  if (!r) notFound();
  return (
    <div style={{ height: "calc(100dvh - 52px)", display: "flex" }}>
      <iframe
        src={`/games/my-post-2026/index.html?r=${r.slug}`}
        title={`@${r.username}의 ${r.year} BEST 9`}
        allow="clipboard-write; web-share"
        style={{ flex: 1, width: "100%", border: 0, display: "block" }}
      />
    </div>
  );
}
