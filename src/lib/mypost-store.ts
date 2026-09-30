// My Post 2026 리포트 저장소 — Supabase (서버 전용, service role 키 사용)
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import type { MyPostData } from "./mypost";
import { rankBest } from "./mypost-summary";

const BUCKET = "mypost";
const TABLE = "mypost_reports";

export function adminDb(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key.trim(), { auth: { persistSession: false, autoRefreshToken: false } });
}

const ALPHA = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function rid(n: number) {
  const b = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(b, (x) => ALPHA[x % ALPHA.length]).join("");
}

export const cleanSlug = (s: string) => s.replace(/[^A-Za-z0-9]/g, "").slice(0, 16);

async function toWebp(url: string, size: number) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`image ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return sharp(buf).rotate().resize(size, size, { fit: "cover" }).webp({ quality: 78 }).toBuffer();
}

/** 같은 계정·같은 해는 링크(slug)를 유지하고 내용만 갱신한다 */
export async function saveReport(db: SupabaseClient, data: MyPostData, ref?: string) {
  if (!data.id) throw new Error("no ig user id");
  const { data: existing, error: selErr } = await db
    .from(TABLE)
    .select("slug, delete_token")
    .eq("ig_user_id", data.id)
    .eq("year", data.year)
    .maybeSingle();
  if (selErr) throw new Error(`db select: ${selErr.message}`);
  const slug: string = existing?.slug ?? rid(8);
  const token: string = existing?.delete_token ?? rid(24);

  // BEST 9 와 프로필 사진만 저장 (인스타 이미지 주소는 며칠 뒤 만료된다). 나머지 게시물은 숫자만 남긴다.
  const posts = data.posts.map((p) => ({ ...p, img: undefined as string | undefined }));
  const upload = async (path: string, src: string, size: number) => {
    const body = await toWebp(src, size);
    const { error } = await db.storage.from(BUCKET).upload(path, body, { contentType: "image/webp", upsert: true, cacheControl: "31536000" });
    if (error) throw new Error(`storage: ${error.message}`);
    return `${db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl}?v=${data.at}`;
  };
  const best = rankBest(data.posts);
  let pic: string | undefined;
  await Promise.all([
    ...best.map(async ({ p, i }, rank) => {
      if (!p.img) return;
      try {
        posts[i].img = await upload(`${slug}/b${rank}.webp`, p.img, 540);
      } catch (e) {
        console.error("[mypost] best image", rank, e instanceof Error ? e.message : e);
      }
    }),
    (async () => {
      if (!data.pic) return;
      try {
        pic = await upload(`${slug}/pic.webp`, data.pic, 160);
      } catch (e) {
        console.error("[mypost] profile image", e instanceof Error ? e.message : e);
      }
    })(),
  ]);

  const { id, ...pub } = data;
  const row: Record<string, unknown> = {
    slug,
    ig_user_id: id,
    username: data.u,
    year: data.year,
    data: { ...pub, pic, posts },
    delete_token: token,
    updated_at: new Date().toISOString(),
  };
  if (!existing && ref) row.ref_from = cleanSlug(ref);
  const { error } = await db.from(TABLE).upsert(row, { onConflict: "ig_user_id,year" });
  if (error) throw new Error(`db upsert: ${error.message}`);
  return { slug, token };
}

export async function getReport(db: SupabaseClient, slug: string) {
  const { data } = await db.from(TABLE).select("slug, username, year, data, view_count, created_at").eq("slug", cleanSlug(slug)).maybeSingle();
  return data as { slug: string; username: string; year: number; data: MyPostData; view_count: number; created_at: string } | null;
}

export async function addView(db: SupabaseClient, slug: string, current: number) {
  await db.from(TABLE).update({ view_count: current + 1 }).eq("slug", slug);
}

export async function deleteReport(db: SupabaseClient, slug: string, token: string) {
  const { data } = await db.from(TABLE).select("delete_token").eq("slug", cleanSlug(slug)).maybeSingle();
  if (!data) return "not_found" as const;
  if (!token || data.delete_token !== token) return "forbidden" as const;
  const { data: files } = await db.storage.from(BUCKET).list(slug, { limit: 100 });
  if (files?.length) await db.storage.from(BUCKET).remove(files.map((f) => `${slug}/${f.name}`));
  await db.from(TABLE).delete().eq("slug", slug);
  return "deleted" as const;
}
