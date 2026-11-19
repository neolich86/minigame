import type { Metadata, Viewport } from "next";
import { GamePlayer } from "@/components/GamePlayer";

// 구글 플레이 앱 'RPG 디펜스'가 여는 시작 화면 — 포털 머리글·설명·광고 없이 게임만 전체 화면.
export const metadata: Metadata = {
  title: { absolute: "RPG 디펜스" },
  description: "검사·도둑·마법사·복사를 배치해 몰려오는 몬스터를 막는 타워 디펜스",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "RPG 디펜스", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#14201b", viewportFit: "cover", width: "device-width", initialScale: 1 };

export default function RpgDefenseApp() {
  return <GamePlayer gameId="class-td" app="/rpg-defense-app" />;
}
