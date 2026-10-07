// 친구에게 도전하기 — 도전장 만들기/읽기 (supabase/migrations/0011_challenges.sql)
import { createClient } from "@supabase/supabase-js";
import { sb } from "./supabase";

export interface Challenge {
  code: string;
  game_id: string; // 랭킹 보드 id
  nickname: string;
  score: number;
  meta: Record<string, unknown>;
  created_at: string;
  pct: number | null;
}

export const cleanChallengeCode = (s: string) => s.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8);

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function toChallenge(row: unknown): Challenge | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  return {
    code: String(r.code),
    game_id: String(r.game_id),
    nickname: String(r.nickname ?? "익명"),
    score: Number(r.score),
    meta: (r.meta as Record<string, unknown>) ?? {},
    created_at: String(r.created_at ?? ""),
    pct: r.pct == null ? null : Number(r.pct),
  };
}

/** 서버(페이지·OG 이미지)에서 읽기 — 로그인 없이 anon 키 */
export async function getChallengeServer(code: string): Promise<Challenge | null> {
  const c = cleanChallengeCode(code);
  if (!URL || !KEY || c.length < 4) return null;
  const db = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.rpc("get_challenge", { p_code: c });
  if (error) {
    console.error("[challenge]", error.message);
    return null;
  }
  return toChallenge(Array.isArray(data) ? data[0] : data);
}

/** 브라우저에서 읽기 */
export async function fetchChallenge(code: string): Promise<Challenge | null> {
  const db = sb();
  const c = cleanChallengeCode(code);
  if (!db || c.length < 4) return null;
  const { data, error } = await db.rpc("get_challenge", { p_code: c });
  if (error) throw error;
  return toChallenge(Array.isArray(data) ? data[0] : data);
}

export async function fetchTopPct(board: string, score: number): Promise<number | null> {
  const db = sb();
  if (!db) return null;
  const { data, error } = await db.rpc("score_top_pct", { p_game_id: board, p_score: Math.round(score) });
  if (error) throw error;
  return data == null ? null : Number(data);
}

export async function createChallenge(board: string, score: number, nickname: string | null, meta: unknown) {
  const db = sb();
  if (!db) throw new Error("not_configured");
  const { data, error } = await db.rpc("create_challenge", {
    p_game_id: board,
    p_score: Math.round(score),
    p_nickname: nickname,
    p_meta: meta ?? {},
  });
  if (error) throw error;
  const r = data as { code: string; nickname: string; pct: number | null };
  return { code: r.code, nickname: r.nickname, pct: r.pct == null ? null : Number(r.pct) };
}
