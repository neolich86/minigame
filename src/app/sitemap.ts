import type { MetadataRoute } from "next";
import { GAMES } from "@/lib/games";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://minigame-on.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/ranking`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    ...GAMES.map((g) => ({ url: `${SITE_URL}/play/${g.id}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...GAMES.filter((g) => g.online).map((g) => ({ url: `${SITE_URL}/online/${g.id}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
