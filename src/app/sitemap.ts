import type { MetadataRoute } from "next";
import { GAMES, itemPath } from "@/lib/games";
import { SITE_URL } from "@/lib/serverLang";

// 한국어 주소 + 영어(?lang=en) 대체 주소를 함께 알려준다
function entry(path: string, priority: number, changeFrequency: "daily" | "weekly" | "monthly"): MetadataRoute.Sitemap[number] {
  const url = `${SITE_URL}${path}`;
  const en = `${url}${path.includes("?") ? "&" : "?"}lang=en`;
  return { url, lastModified: new Date(), changeFrequency, priority, alternates: { languages: { ko: url, en } } };
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    entry("/", 1, "weekly"),
    entry("/tools", 0.8, "weekly"),
    entry("/apps", 0.8, "weekly"),
    ...GAMES.map((g) => entry(itemPath(g), 0.8, "monthly")),
    ...GAMES.filter((g) => g.online).map((g) => entry(`/online/${g.id}`, 0.8, "monthly")),
    entry("/ranking", 0.6, "daily"),
  ];
}
