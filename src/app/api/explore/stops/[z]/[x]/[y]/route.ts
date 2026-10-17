import { STOP_ZOOM, stopsForTile, tileIsOpen } from "@/lib/explore";

// GET /api/explore/stops/14/{x}/{y} → { stops: StopRow[], open }
export async function GET(_req: Request, { params }: { params: Promise<{ z: string; x: string; y: string }> }) {
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
    return Response.json({ error: "upstream" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
