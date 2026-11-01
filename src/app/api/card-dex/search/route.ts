// 카드 도감 — 카드 검색 (썸네일·이름·번호만)
// GET /api/card-dex/search?game=pokemon&lang=ko&q=피카츄   → [{ref, name, number, set, image}]
// 포켓몬: TCGdex (https://tcgdex.dev, 한글·일어·영문)  /  원피스: OPTCG API (https://optcgapi.com, 영문)
// 카드 그림은 저장하지 않고 각 API 의 이미지 주소를 그대로 돌려준다.
export const dynamic = "force-dynamic";

type Hit = { ref: string; name: string; number: string; set: string; image: string };
const HEAD = { "cache-control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" };
const LANGS = ["ko", "ja", "en"] as const;

// ── 포켓몬 (TCGdex) ──
type SetInfo = { name: string; official: number };
const setCache = new Map<string, { at: number; map: Map<string, SetInfo> }>();
async function tcgdexSets(lang: string) {
  const c = setCache.get(lang);
  if (c && Date.now() - c.at < 864e5 && c.map.size) return c.map;
  const map = new Map<string, SetInfo>();
  try {
    const r = await fetch(`https://api.tcgdex.net/v2/${lang}/sets`, { cache: "no-store" });
    if (r.ok) for (const s of (await r.json()) as { id: string; name: string; cardCount?: { official?: number; total?: number } }[])
      map.set(s.id, { name: s.name, official: Number(s.cardCount?.official || s.cardCount?.total || 0) });
  } catch {}
  setCache.set(lang, { at: Date.now(), map });
  return map;
}
type TcgCard = { id: string; localId?: string; name: string; image?: string };
const setOf = (id: string) => (id.includes("-") ? id.slice(0, id.lastIndexOf("-")) : "");
async function tcgList(lang: string, query: string, per = 120): Promise<TcgCard[]> {
  const r = await fetch(`https://api.tcgdex.net/v2/${lang}/cards?${query}&pagination:itemsPerPage=${per}`, { cache: "no-store" });
  if (!r.ok) return [];
  const list = await r.json();
  return Array.isArray(list) ? list : [];
}
// 이 언어에 카드 그림이 없으면 같은 카드의 다른 언어 그림을 찾아 쓴다 (한글판은 일어판과 그림이 같은 경우가 많다)
async function fillImage(lang: string, c: TcgCard): Promise<string> {
  if (c.image) return c.image;
  const order = lang === "ko" ? ["ja", "en"] : lang === "ja" ? ["ko", "en"] : ["ja", "ko"];
  for (const l of order) {
    try {
      const r = await fetch(`https://api.tcgdex.net/v2/${l}/cards/${encodeURIComponent(c.id)}`, { cache: "no-store" });
      if (!r.ok) continue;
      const d = (await r.json()) as TcgCard;
      if (d && d.image) return d.image;
    } catch {}
  }
  return "";
}
async function pokemon(lang: string, q: string): Promise<Hit[]> {
  const sets = await tcgdexSets(lang);
  let list: TcgCard[];
  // 카드 왼쪽 아래 번호 "012/025" · "12" 로도 찾는다
  const num = /^(\d{1,3})\s*\/\s*(\d{1,3})$/.exec(q) || /^(\d{1,3})$/.exec(q);
  if (num) {
    const n = Number(num[1]), of = num[2] ? Number(num[2]) : 0;
    list = (await tcgList(lang, `localId=${n}`, 500)).filter((c) => Number(c.localId) === n && (!of || sets.get(setOf(c.id))?.official === of));
  } else {
    list = await tcgList(lang, `name=${encodeURIComponent(q)}`);
  }
  list = list.slice(0, 60);
  const imgs = await Promise.all(list.map((c, i) => (i < 30 ? fillImage(lang, c) : Promise.resolve(c.image || ""))));
  const hits = list.map((c, i) => {
    const st = sets.get(setOf(c.id));
    const of = st?.official ? `/${String(st.official).padStart(3, "0")}` : "";
    return { ref: c.id, name: c.name, number: c.localId ? `${c.localId}${of}` : "", set: st?.name || setOf(c.id), image: imgs[i] ? `${imgs[i]}/low.webp` : "" };
  });
  return hits.sort((a, b) => Number(!a.image) - Number(!b.image)); // 그림 있는 카드 먼저
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
