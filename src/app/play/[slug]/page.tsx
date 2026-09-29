import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GamePlayer } from "@/components/GamePlayer";
import { gameById } from "@/lib/games";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = gameById(slug);
  if (!g) return {};
  return {
    title: `${g.title.ko} · ${g.title.en}`,
    description: `${g.desc.ko} — ${g.desc.en}`,
    alternates: { canonical: `/play/${g.id}` },
    openGraph: { images: [{ url: g.thumb }] },
  };
}

export default async function PlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = gameById(slug);
  if (!g) notFound();
  return <GamePlayer gameId={g.id} />;
}
