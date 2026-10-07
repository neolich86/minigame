import type { MetadataRoute } from "next";

// 홈 화면에 추가 · 검색엔진이 읽는 앱 정보
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "미니 게임 천국 - 무료 웹게임 모음",
    short_name: "미니게임천국",
    description: "설치 없이 바로 하는 무료 브라우저 게임 · 추첨기 · 서비스 모음",
    start_url: "/",
    display: "standalone",
    background_color: "#0e1420",
    theme_color: "#0e1420",
    lang: "ko",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
