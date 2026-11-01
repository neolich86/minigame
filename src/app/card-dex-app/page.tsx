import type { Metadata, Viewport } from "next";
import { GamePlayer } from "@/components/GamePlayer";

// 구글 플레이 앱 '카드 도감'이 여는 시작 화면 — 포털 머리글·설명·광고 없이 도감만 전체 화면.
export const metadata: Metadata = {
  title: { absolute: "카드 도감" },
  description: "가진 포켓몬카드·원피스카드를 등급과 함께 모아 두고 자랑하는 온라인 도감",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "카드 도감", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#121218", viewportFit: "cover", width: "device-width", initialScale: 1 };

export default function CardDexApp() {
  return <GamePlayer gameId="card-dex" app="/card-dex-app" />;
}
