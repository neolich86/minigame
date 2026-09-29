import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OnlineLobby } from "@/components/OnlineLobby";
import { gameById } from "@/lib/games";

export async function generateMetadata({ params }: { params: Promise<{ game: string }> }): Promise<Metadata> {
  const { game } = await params;
  const g = gameById(game);
  if (!g) return {};
  return { title: `${g.title.ko} 온라인 · ${g.title.en} Online`, alternates: { canonical: `/online/${g.id}` } };
}

export default async function OnlinePage({ params }: { params: Promise<{ game: string }> }) {
  const { game } = await params;
  const g = gameById(game);
  if (!g || !g.online) notFound();
  return <OnlineLobby gameId={g.id} />;
}
