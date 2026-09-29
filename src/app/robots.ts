import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://minigame-on.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/auth/", "/me", "/login"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
