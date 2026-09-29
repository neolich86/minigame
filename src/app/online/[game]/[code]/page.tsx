import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoomClient } from "@/components/RoomClient";
import { gameById } from "@/lib/games";

export const metadata: Metadata = { robots: { index: false } };

export default async function RoomPage({ params }: { params: Promise<{ game: string; code: string }> }) {
  const { game, code } = await params;
  const g = gameById(game);
  if (!g || !g.online || !/^[A-Za-z0-9]{4}$/.test(code)) notFound();
  return <RoomClient gameId={g.id} code={code.toUpperCase()} />;
}
