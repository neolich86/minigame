import { adminDb, addView, cleanSlug, deleteReport, getReport } from "@/lib/mypost-store";

// 공유된 리포트 데이터 (누구나 읽기) — 리포트 페이지가 불러간다
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const db = adminDb();
  if (!db) return Response.json({ error: "not_configured" }, { status: 503 });
  const slug = cleanSlug((await params).slug);
  const r = await getReport(db, slug);
  if (!r) return Response.json({ error: "not_found" }, { status: 404 });
  await addView(db, r.slug, r.view_count).catch(() => {});
  return Response.json({ ...r.data, slug: r.slug, views: r.view_count + 1 }, { headers: { "cache-control": "no-store" } });
}

// 본인 삭제 — 리포트를 만든 브라우저에 저장된 삭제 토큰이 있어야 한다
export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const db = adminDb();
  if (!db) return Response.json({ error: "not_configured" }, { status: 503 });
  const result = await deleteReport(db, (await params).slug, req.headers.get("x-delete-token") ?? "");
  const status = result === "deleted" ? 200 : result === "forbidden" ? 403 : 404;
  return Response.json({ result }, { status });
}
