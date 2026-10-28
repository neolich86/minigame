// 동네쪽지 장소 검색 — OpenStreetMap Nominatim (ODbL: 결과 저장 가능, 출처 표시 필요)
// 카카오 로컬 API 는 결과 저장이 금지라 쪽지 위치로 쓸 수 없다.
// Nominatim 이용 정책: 초당 1회, 자동완성 금지(엔터로만 검색), 앱 식별 User-Agent, 결과 캐시.
const UA = "dongne-note/1.0 (+https://playwithme.kr/apps/dongne-note)";
let last = 0;
async function nominatim(path: string, params: Record<string, string>) {
  const wait = last + 1100 - Date.now();
  last = Math.max(Date.now(), last + 1100);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  const u = new URL(`https://nominatim.openstreetmap.org/${path}`);
  for (const [k, v] of Object.entries({ format: "jsonv2", "accept-language": "ko", ...params })) u.searchParams.set(k, v);
  const r = await fetch(u, { headers: { "user-agent": UA, referer: "https://playwithme.kr/" }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`nominatim_${r.status}`);
  return r.json();
}

type Addr = Record<string, string | undefined>;
/** "종로구 사직동" 같은 짧은 지역 이름 */
export function areaName(a: Addr | undefined): string {
  if (!a) return "";
  const big = a.borough || a.city_district || a.county || a.city || a.town || "";
  const small = a.quarter || a.suburb || a.neighbourhood || a.village || "";
  const city = a.city && a.city !== big ? a.city.replace(/(특별시|광역시|특별자치시)$/, "") : "";
  return [big ? "" : city, big, small].filter(Boolean).join(" ").slice(0, 40);
}

export interface Place { name: string; area: string; addr: string; lat: number; lng: number; kind: string }

export async function searchPlaces(q: string, lat?: number, lng?: number): Promise<Place[]> {
  const params: Record<string, string> = { q, countrycodes: "kr", limit: "10", addressdetails: "1" };
  if (lat != null && lng != null && isFinite(lat) && isFinite(lng)) {
    params.viewbox = `${lng - 0.25},${lat + 0.2},${lng + 0.25},${lat - 0.2}`; // 보고 있는 곳 근처 우선 (bounded 아님)
  }
  const rows = (await nominatim("search", params)) as { name?: string; display_name: string; lat: string; lon: string; type?: string; category?: string; address?: Addr }[];
  return rows.map((r) => ({
    name: (r.name || r.display_name.split(",")[0] || "").trim().slice(0, 60),
    area: areaName(r.address),
    addr: r.display_name.split(",").slice(0, 4).join(",").slice(0, 120),
    lat: Number(r.lat),
    lng: Number(r.lon),
    kind: `${r.category ?? ""}:${r.type ?? ""}`,
  }));
}

export async function reverseArea(lat: number, lng: number): Promise<{ area: string; name: string }> {
  const r = (await nominatim("reverse", { lat: String(lat), lon: String(lng), zoom: "17", addressdetails: "1" })) as { name?: string; address?: Addr };
  return { area: areaName(r.address), name: (r.name || "").slice(0, 60) };
}
