// 동네쪽지 지도에서 고른 지점의 동네 이름 — GET /api/dongne-note/reverse?lat=37.57&lng=126.98
import { reverseArea } from "@/lib/osmGeo";

export async function GET(req: Request) {
  const u = new URL(req.url);
  // 약 100m 단위로 반올림해 캐시 (동네 이름만 쓰므로 충분)
  const lat = Math.round(Number(u.searchParams.get("lat")) * 1000) / 1000;
  const lng = Math.round(Number(u.searchParams.get("lng")) * 1000) / 1000;
  if (!isFinite(lat) || !isFinite(lng) || lat < 33 || lat > 39 || lng < 124 || lng > 132) {
    return Response.json({ error: "out_of_area" }, { status: 400, headers: { "access-control-allow-origin": "*" } });
  }
  try {
    return Response.json(await reverseArea(lat, lng), { headers: { "access-control-allow-origin": "*", "cache-control": "public, s-maxage=2592000" } });
  } catch (e) {
    console.error("[dongne-note reverse]", e);
    return Response.json({ area: "", name: "" }, { headers: { "access-control-allow-origin": "*" } });
  }
}
