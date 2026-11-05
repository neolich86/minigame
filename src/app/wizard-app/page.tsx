import type { Metadata, Viewport } from "next";
import { GamePlayer } from "@/components/GamePlayer";

// 구글 플레이 앱 '마법사 키우기'가 여는 시작 화면 — 포털 머리글·설명·광고 없이 게임만 전체 화면.
export const metadata: Metadata = {
  title: { absolute: "마법사 키우기" },
  description: "1인칭으로 몬스터 무리를 파이어볼과 마법으로 막아내는 3D 서바이벌",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "마법사 키우기", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#12182a", viewportFit: "cover", width: "device-width", initialScale: 1 };

export default function WizardApp() {
  return <GamePlayer gameId="wizard" app="/wizard-app" />;
}
