import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
