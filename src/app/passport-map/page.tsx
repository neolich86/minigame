import type { Metadata, Viewport } from "next";
import { GamePlayer } from "@/components/GamePlayer";

// 구글 플레이 앱(TWA)이 여는 시작 화면 — 포털 머리글·설명 없이 Passport Map 만 전체 화면
export const metadata: Metadata = {
  title: { absolute: "Passport Map" },
  description: "다녀온 나라와 도시를 세계지도에 칠하고 사진을 남기는 여행 지도",
  manifest: "/passport-map.webmanifest",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Passport Map", statusBarStyle: "black-translucent" },
  icons: { apple: "/icons/pm-192.png" },
};

export const viewport: Viewport = { themeColor: "#13213F", viewportFit: "cover", width: "device-width", initialScale: 1 };

export default function PassportMapApp() {
  return <GamePlayer gameId="passport-map" app="/passport-map" />;
}
