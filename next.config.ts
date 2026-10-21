import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 배포마다 바뀌는 값 — 게임 iframe 주소에 붙여, 브라우저(특히 사파리)가 예전 게임 파일을 캐시에서 쓰지 않게 한다
  env: { NEXT_PUBLIC_BUILD_ID: (process.env.VERCEL_GIT_COMMIT_SHA || String(Date.now())).slice(0, 8) },
  // 서버 함수 크기 줄이기 (Vercel Functions Storage = 배포마다 함수 묶음 크기만큼 쌓임)
  // sharp(이미지 처리, 약 47MB)가 Next 내부 참조 때문에 모든 함수에 딸려 들어간다.
  // - 모든 함수: Vercel(리눅스 glibc x64)에서 쓰지 않는 musl·wasm 버전 제외
  // - sharp 를 쓰지 않는 공유 이미지 함수(next/og 만 씀)에서는 sharp 전체 제외 (쓰는 곳: /r, /api/mypost, /api/tarot)
  outputFileTracingExcludes: {
    "/**": ["node_modules/@img/sharp-libvips-linuxmusl-*/**", "node_modules/@img/sharp-linuxmusl-*/**", "node_modules/@img/sharp-wasm32/**"],
    "/api/challenge/**": ["node_modules/@img/**", "node_modules/sharp/**"],
    "/api/forecast/**": ["node_modules/@img/**", "node_modules/sharp/**"],
    "/api/explore/**": ["node_modules/@img/**", "node_modules/sharp/**"],
  },
  async rewrites() {
    // 안드로이드 앱(TWA) 도메인 확인
    return [{ source: "/.well-known/assetlinks.json", destination: "/api/assetlinks" }];
  },
  async headers() {
    // 게임 파일은 크고 자주 바뀌지 않으므로 CDN 캐시 (배포 후 1시간 안에 갱신)
    const cache = [{ key: "Cache-Control", value: "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400" }];
    return [
      { source: "/games/:path*", headers: cache },
      { source: "/mgh/:path*", headers: cache },
      { source: "/thumbs/:path*", headers: cache },
    ];
  },
};

export default nextConfig;
