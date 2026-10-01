import { getShare } from "@/lib/shares";

// 공개 공유 데이터 (누구나 읽기) — /m/<slug> 페이지 안의 게임이 불러간다
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const r = await getShare((await params).slug);
  if (!r) return Response.json({ error: "not_found" }, { status: 404, headers: { "cache-control": "no-store" } });
  return Response.json(
    { slug: r.slug, game: r.game_id, data: r.data, updatedAt: r.updated_at, views: r.view_count },
    { headers: { "cache-control": "no-store" } },
  );
}
