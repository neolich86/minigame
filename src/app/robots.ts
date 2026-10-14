import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/serverLang";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/auth/", "/me", "/login"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
