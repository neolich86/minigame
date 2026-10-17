import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 배포마다 바뀌는 값 — 게임 iframe 주소에 붙여, 브라우저(특히 사파리)가 예전 게임 파일을 캐시에서 쓰지 않게 한다
  env: { NEXT_PUBLIC_BUILD_ID: (process.env.VERCEL_GIT_COMMIT_SHA || String(Date.now())).slice(0, 8) },
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
