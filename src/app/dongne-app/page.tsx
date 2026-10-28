import type { Metadata, Viewport } from "next";
import { GamePlayer } from "@/components/GamePlayer";

// 구글 플레이 앱 '동네쪽지'가 여는 시작 화면 — 포털 머리글·설명·광고 없이 지도만 전체 화면.
export const metadata: Metadata = {
  title: { absolute: "동네쪽지" },
  description: "우리 동네 지도에 쪽지를 붙이고 이웃들의 이야기를 보는 지도",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "동네쪽지", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#fbf6ea", viewportFit: "cover", width: "device-width", initialScale: 1 };

export default function DongneApp() {
  return <GamePlayer gameId="dongne-note" app="/dongne-app" />;
}
