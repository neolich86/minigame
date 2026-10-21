import type { Metadata, Viewport } from "next";
import { GamePlayer } from "@/components/GamePlayer";

// 구글 플레이 앱 '궁수 키우기'가 여는 시작 화면 — 포털 머리글·설명·광고 없이 게임만 전체 화면.
// 안드로이드 앱(Capacitor)이 이 주소를 직접 열고, 광고 보고 이어하기(AdMob)는 앱이 네이티브로 처리한다.
export const metadata: Metadata = {
  title: { absolute: "궁수 키우기" },
  description: "사방에서 몰려오는 몬스터를 처치하고 스킬을 키우는 궁수 로그라이크",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "궁수 키우기", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#12161c", viewportFit: "cover", width: "device-width", initialScale: 1 };

export default function ArcherApp() {
  return <GamePlayer gameId="archer" app="/archer-app" />;
}
