import { STOP_ZOOM, stopsForTile, tileIsOpen } from "@/lib/explore";

export const maxDuration = 30;

// GET /api/explore/stops/14/{x}/{y} → { stops: StopRow[], open }
export async function GET(req: Request, { params }: { params: Promise<{ z: string; x: string; y: string }> }) {
  const p = await params;
  const z = Number(p.z);
  const x = Number(p.x);
  const y = Number(p.y);
  const max = 2 ** STOP_ZOOM;
  if (z !== STOP_ZOOM || !Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= max || y >= max) {
    return Response.json({ error: "bad_tile" }, { status: 400 });
  }
  if (!tileIsOpen(x, y)) {
    return Response.json({ stops: [], open: false }, { headers: { "cache-control": "public, max-age=86400, s-maxage=604800" } });
  }
  try {
    const stops = await stopsForTile(x, y);
    return Response.json(
      { stops, open: true },
      { headers: { "cache-control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800" } },
    );
  } catch (e) {
    console.error("[explore/stops]", e instanceof Error ? e.message : e);
    // 원인 파악용으로 짧은 오류 내용을 함께 돌려준다 (외부 서버 응답 코드·메시지)
    const detail = (e instanceof Error ? e.message : String(e)).slice(0, 400);
    const debug = new URL(req.url).searchParams.has("debug");
    return Response.json({ error: "upstream", detail }, { status: debug ? 200 : 503, headers: { "cache-control": "no-store" } });
  }
}
