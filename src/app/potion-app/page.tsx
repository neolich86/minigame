import type { Metadata, Viewport } from "next";
import { GamePlayer } from "@/components/GamePlayer";

// 구글 플레이 앱 '포션 공방'이 여는 시작 화면 — 포털 머리글·설명·광고 없이 게임만 전체 화면.
export const metadata: Metadata = {
  title: { absolute: "포션 공방" },
  description: "물약을 붓고 섞어 손님이 주문한 포션을 만드는 퍼즐 가게",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "포션 공방", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#2a1b12", viewportFit: "cover", width: "device-width", initialScale: 1 };

export default function PotionApp() {
  return <GamePlayer gameId="potion-atelier" app="/potion-app" />;
}
