// 카드 도감 — 카드 검색 (썸네일·이름·번호만)
// GET /api/card-dex/search?game=pokemon&lang=ko&q=피카츄   → [{ref, name, number, set, image}]
// 포켓몬: TCGdex (https://tcgdex.dev, 한글·일어·영문)  /  원피스: OPTCG API (https://optcgapi.com, 영문)
// 카드 그림은 저장하지 않고 각 API 의 이미지 주소를 그대로 돌려준다.
export const dynamic = "force-dynamic";

type Hit = { ref: string; name: string; number: string; set: string; image: string };
const HEAD = { "cache-control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" };
const LANGS = ["ko", "ja", "en"] as const;

// ── 포켓몬 (TCGdex) ──
const setNames = new Map<string, { at: number; map: Map<string, string> }>();
async function tcgdexSets(lang: string) {
  const c = setNames.get(lang);
  if (c && Date.now() - c.at < 864e5) return c.map;
  const map = new Map<string, string>();
  try {
    const r = await fetch(`https://api.tcgdex.net/v2/${lang}/sets`, { cache: "no-store" });
    if (r.ok) for (const s of (await r.json()) as { id: string; name: string }[]) map.set(s.id, s.name);
  } catch {}
  setNames.set(lang, { at: Date.now(), map });
  return map;
}
async function pokemon(lang: string, q: string): Promise<Hit[]> {
  const url = `https://api.tcgdex.net/v2/${lang}/cards?name=${encodeURIComponent(q)}&pagination:itemsPerPage=80`;
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) return [];
  const list = (await r.json()) as { id: string; localId?: string; name: string; image?: string }[];
  if (!Array.isArray(list)) return [];
  const sets = await tcgdexSets(lang);
  return list.slice(0, 80).map((c) => {
    const setId = c.id.includes("-") ? c.id.slice(0, c.id.lastIndexOf("-")) : "";
    return { ref: c.id, name: c.name, number: c.localId || "", set: sets.get(setId) || setId, image: c.image ? `${c.image}/low.webp` : "" };
  });
}

// ── 원피스 (OPTCG API: 전체 목록을 받아 두고 이름·번호로 거른다) ──
let opCache: { at: number; list: Hit[] } | null = null;
const pick = (o: Record<string, unknown>, ...keys: string[]) => { for (const k of keys) { const v = o[k]; if (typeof v === "string" && v) return v; } return ""; };
async function onepieceAll(): Promise<Hit[]> {
  if (opCache && Date.now() - opCache.at < 864e5 && opCache.list.length) return opCache.list;
  const seen = new Set<string>(), out: Hit[] = [];
  for (const path of ["allSetCards", "allSTCards", "allPromoCards"]) {
    try {
      const r = await fetch(`https://optcgapi.com/api/${path}/`, { cache: "no-store" });
      if (!r.ok) continue;
      const arr = (await r.json()) as Record<string, unknown>[];
      if (!Array.isArray(arr)) continue;
      for (const c of arr) {
        const id = pick(c, "card_set_id", "card_id", "id");
        const imgId = pick(c, "card_image_id") || id;
        if (!id || seen.has(imgId)) continue;
        seen.add(imgId);
        let image = pick(c, "card_image", "image", "image_url");
        if (!image.startsWith("https://optcgapi.com/")) image = `https://optcgapi.com/media/static/Card_Images/${imgId}.jpg`;
        out.push({ ref: imgId, name: pick(c, "card_name", "name"), number: id, set: pick(c, "set_name", "set_id"), image });
      }
    } catch {}
  }
  opCache = { at: Date.now(), list: out };
  return out;
}
async function onepiece(q: string): Promise<Hit[]> {
  const all = await onepieceAll(), s = q.toLowerCase().replace(/\s+/g, " ");
  return all.filter((c) => c.name.toLowerCase().includes(s) || c.number.toLowerCase().includes(s) || c.ref.toLowerCase().includes(s)).slice(0, 80);
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const game = u.searchParams.get("game");
  const lang = (LANGS as readonly string[]).includes(u.searchParams.get("lang") || "") ? u.searchParams.get("lang")! : "ko";
  const q = (u.searchParams.get("q") || "").trim().slice(0, 40);
  if (q.length < 1) return Response.json([], { headers: HEAD });
  try {
    const hits = game === "onepiece" ? await onepiece(q) : game === "pokemon" ? await pokemon(lang, q) : [];
    return Response.json(hits, { headers: HEAD });
  } catch (e) {
    console.error("[card-dex/search]", (e as Error).message);
    return Response.json({ error: "search_failed" }, { status: 502 });
  }
}
