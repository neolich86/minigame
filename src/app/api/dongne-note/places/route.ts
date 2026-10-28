// 동네쪽지 장소 검색 — GET /api/dongne-note/places?q=경복궁&lat=37.57&lng=126.98
import { searchPlaces } from "@/lib/osmGeo";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const q = (u.searchParams.get("q") ?? "").trim().slice(0, 60);
  if (q.length < 1) return Response.json([], { headers: { "access-control-allow-origin": "*" } });
  // 캐시 적중률을 높이려고 기준 위치는 소수 1자리(약 10km)로 반올림
  const r1 = (v: string | null) => (v == null || v === "" ? undefined : Math.round(Number(v) * 10) / 10);
  try {
    const list = await searchPlaces(q, r1(u.searchParams.get("lat")), r1(u.searchParams.get("lng")));
    return Response.json(list, { headers: { "access-control-allow-origin": "*", "cache-control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
  } catch (e) {
    console.error("[dongne-note places]", e);
    return Response.json({ error: "search_failed" }, { status: 502, headers: { "access-control-allow-origin": "*" } });
  }
}
