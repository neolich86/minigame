import { GAMES, itemPath, kindOf } from "@/lib/games";
import { GAME_SEO, HOME_SEO } from "@/lib/seo";
import { SITE_URL } from "@/lib/serverLang";

// 네이버 서치어드바이저 RSS 제출용 — 게임·도구·서비스 목록
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const BUILT = new Date().toUTCString();

export const dynamic = "force-static";

export function GET() {
  const items = GAMES.map((g) => {
    const seo = GAME_SEO[g.id]?.ko;
    const url = `${SITE_URL}${itemPath(g)}`;
    const cat = kindOf(g) === "game" ? "게임" : kindOf(g) === "tool" ? "추첨·도구" : "서비스";
    return `<item><title>${esc(seo?.title ?? g.title.ko)}</title><link>${url}</link><guid>${url}</guid><category>${cat}</category><description>${esc(seo?.description ?? g.desc.ko)}</description><pubDate>${BUILT}</pubDate></item>`;
  }).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(HOME_SEO.ko.title)}</title><link>${SITE_URL}</link><description>${esc(HOME_SEO.ko.description)}</description><language>ko</language><lastBuildDate>${BUILT}</lastBuildDate>${items}</channel></rss>`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
