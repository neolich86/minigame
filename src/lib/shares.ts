// 공개 공유 링크 읽기 (서버) — anon 키로 get_game_share(slug) RPC 호출. 로그인 없이 누구나 slug로 한 개만 읽을 수 있다.
import { createClient } from "@supabase/supabase-js";

export interface GameShare {
  slug: string;
  game_id: string;
  data: Record<string, unknown>;
  updated_at: string;
  view_count: number;
}

export const cleanShareSlug = (s: string) => s.replace(/[^A-Za-z0-9]/g, "").slice(0, 16);

export async function getShare(slug: string): Promise<GameShare | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const s = cleanShareSlug(slug);
  if (!url || !key || s.length < 6) return null;
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.rpc("get_game_share", { p_slug: s });
  if (error) {
    console.error("[share]", error.message);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return row ? (row as GameShare) : null;
}

/** Passport Map 스냅숏 요약 (메타 태그용) */
export function passportSummary(d: Record<string, unknown>) {
  const countries = Object.keys((d.countries as Record<string, unknown>) ?? {}).length;
  const cities = Array.isArray(d.cities) ? d.cities.length : 0;
  const share = (d.share as { name?: string } | undefined) ?? {};
  const name = typeof share.name === "string" && share.name.trim() ? share.name.trim() : null;
  const og = typeof d.og === "string" ? d.og : null;
  return { countries, cities, name, og };
}
