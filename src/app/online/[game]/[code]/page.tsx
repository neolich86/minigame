import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LexioRoomClient } from "@/components/LexioRoom";
import { RoomClient } from "@/components/RoomClient";
import { gameById } from "@/lib/games";

export const metadata: Metadata = { robots: { index: false } };

export default async function RoomPage({ params }: { params: Promise<{ game: string; code: string }> }) {
  const { game, code } = await params;
  const g = gameById(game);
  if (!g || !g.online || !/^[A-Za-z0-9]{4}$/.test(code)) notFound();
  // 렉시오는 서버 판정 방식(rooms 테이블), 카탄은 방장 브라우저 진행 방식(mg_* 테이블)
  if (g.id === "lexio") return <LexioRoomClient code={code.toUpperCase()} />;
  return <RoomClient gameId={g.id} code={code.toUpperCase()} />;
}
