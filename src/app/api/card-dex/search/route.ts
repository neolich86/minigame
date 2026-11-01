// 카드 도감 — 카드 검색 (썸네일·이름·번호만)
// GET /api/card-dex/search?game=pokemon&lang=ko&q=피카츄   → [{ref, name, number, set, image}]
// 포켓몬: TCGdex (https://tcgdex.dev, 한글·일어·영문)  /  원피스: OPTCG API (https://optcgapi.com, 영문)
// 카드 그림은 저장하지 않고 각 API 의 이미지 주소를 그대로 돌려준다.
import NAMES from "@/lib/pokemonNames.json";

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
type LHit = Hit & { lang: string };
// 북미판(영문)은 Pokémon TCG API (pokemontcg.io) — 거의 모든 카드가 공식 스캔 그림과 함께 있다. 키(POKEMONTCG_API_KEY)는 있으면 한도가 늘어난다
async function ptcgSearch(q: string, rest = ""): Promise<LHit[]> {
  const num = /^(\d{1,3})\s*\/\s*(\d{1,3})$/.exec(q) || /^(\d{1,3})$/.exec(q);
  const clean = (v: string) => v.replace(/["\\*:()]/g, " ").trim();
  let query: string;
  if (num) query = `number:${Number(num[1])}` + (num[2] ? ` set.printedTotal:${Number(num[2])}` : "");
  else { query = `name:"${clean(q)}*"`; }
  const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}&pageSize=80&orderBy=-set.releaseDate&select=id,name,number,set,images`;
  const headers: Record<string, string> = {};
  if (process.env.POKEMONTCG_API_KEY) headers["X-Api-Key"] = process.env.POKEMONTCG_API_KEY;
  const r = await fetch(url, { cache: "no-store", headers });
  if (!r.ok) return [];
  const j = (await r.json()) as { data?: { id: string; name: string; number: string; set?: { name?: string; printedTotal?: number }; images?: { small?: string } }[] };
  let list = j.data || [];
  if (rest) { const t = rest.toLowerCase().replace(/\s+/g, ""); list = list.filter((c) => c.name.toLowerCase().replace(/\s+/g, "").includes(t)); }
  return list.map((c) => ({
    ref: "ptcg:" + c.id, name: c.name,
    number: c.set?.printedTotal ? `${c.number}/${String(c.set.printedTotal).padStart(3, "0")}` : c.number,
    set: c.set?.name || "", image: c.images?.small || "", lang: "en",
  }));
}
async function searchIn(lang: string, q: string, sets: Map<string, SetInfo>, rest = ""): Promise<LHit[]> {
  if (lang === "en") { try { const p = await ptcgSearch(q, rest); if (p.length) return p; } catch {} }
  let list: TcgCard[];
  // 카드 왼쪽 아래 번호 "012/025" · "12" 로도 찾는다
  const num = /^(\d{1,3})\s*\/\s*(\d{1,3})$/.exec(q) || /^(\d{1,3})$/.exec(q);
  if (num) {
    const n = Number(num[1]), of = num[2] ? Number(num[2]) : 0;
    list = (await tcgList(lang, `localId=${n}`, 500)).filter((c) => Number(c.localId) === n && (!of || sets.get(setOf(c.id))?.official === of));
  } else {
    list = await tcgList(lang, `name=${encodeURIComponent(q)}`);
    if (rest) { const r = rest.toLowerCase().replace(/\s+/g, ""); list = list.filter((c) => c.name.toLowerCase().replace(/\s+/g, "").includes(r)); }
  }
  return list.slice(0, 60).map((c) => {
    const st = sets.get(setOf(c.id));
    const of = st?.official ? `/${String(st.official).padStart(3, "0")}` : "";
    return { ref: c.id, name: c.name, number: c.localId ? `${c.localId}${of}` : "", set: st?.name || setOf(c.id), image: c.image || "", lang };
  });
}
// 한글 이름 → 일본어·영어 이름 (포켓몬 1025종, src/lib/pokemonNames.json: [한, 日, EN])
function translateKo(q: string): { ja: string; en: string; rest: string } | null {
  let best: string[] | null = null;
  for (const row of NAMES) if (q.includes(row[0]) && (!best || row[0].length > best[0].length)) best = row;
  if (!best) return null;
  return { ja: best[1], en: best[2], rest: q.replace(best[0], "").trim() };
}
async function pokemon(lang: string, q: string): Promise<(Hit & { lang: string })[]> {
  const [setsKo, setsJa, setsEn] = await Promise.all(["ko", "ja", "en"].map((l) => tcgdexSets(l)));
  const S: Record<string, Map<string, SetInfo>> = { ko: setsKo, ja: setsJa, en: setsEn };
  let hits = await searchIn(lang, q, S[lang]);
  // 한글로 찾았는데 결과가 적으면: 이름을 일본어·영어로 바꿔(번호 검색은 그대로) 다시 찾는다
  if (lang === "ko" && hits.length < 6) {
    const isNum = /^\d{1,3}(\s*\/\s*\d{1,3})?$/.test(q);
    const tr = isNum ? { ja: q, en: q, rest: "" } : /[가-힣]/.test(q) ? translateKo(q) : { ja: q, en: q, rest: "" };
    if (tr) {
      const [ja, en] = await Promise.all([searchIn("ja", tr.ja, S.ja, tr.rest), searchIn("en", tr.en, S.en, tr.rest)]);
      const seen = new Set(hits.map((h) => h.lang + h.ref));
      for (const h of [...ja, ...en]) if (!seen.has(h.lang + h.ref)) { seen.add(h.lang + h.ref); hits.push(h); }
    }
  }
  hits = hits.slice(0, 80);
  const isP = (h: LHit) => h.ref.startsWith("ptcg:");
  const imgs = await Promise.all(hits.map((h, i) => (isP(h) ? Promise.resolve(h.image) : i < 30 ? fillImage(h.lang, { id: h.ref, name: h.name, image: h.image || undefined }) : Promise.resolve(h.image))));
  hits.forEach((h, i) => { h.image = !imgs[i] ? "" : isP(h) ? imgs[i] : `${imgs[i]}/low.webp`; });
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
