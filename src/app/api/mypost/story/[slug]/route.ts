import { reportImage } from "@/lib/mypost-image";
import { adminDb, cleanSlug, getReport } from "@/lib/mypost-store";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const db = adminDb();
  if (!db) return new Response("not configured", { status: 503 });
  const slug = cleanSlug((await params).slug);
  const r = await getReport(db, slug);
  if (!r) return new Response("not found", { status: 404 });
  const img = await reportImage(r.data, r.slug, "story");
  img.headers.set("cache-control", "public, max-age=300, s-maxage=3600");
  return img;
}
