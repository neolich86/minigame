// Supabase 연동 — 포털 공용 계정(이메일·카카오), 프로필, 랭킹, 온라인 방.
// 환경변수가 없으면 cloudEnabled=false: 로그인/랭킹/온라인은 꺼지고 게임은 그대로 플레이 가능.
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const cloudEnabled = Boolean(URL && KEY);

let client: SupabaseClient | null = null;
export function sb(): SupabaseClient | null {
  if (!cloudEnabled || typeof window === "undefined") return null;
  if (!client) {
    client = createClient(URL!, KEY!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
        // 포털과 모든 게임이 같은 도메인(같은 Next 앱)이라 이 세션 하나를 공유한다.
        storageKey: "mgh:auth",
      },
    });
  }
  return client;
}

export function displayName(u: User): string {
  const m = (u.user_metadata ?? {}) as Record<string, unknown>;
  const n = [m.nickname, m.name, m.full_name, m.preferred_username, m.user_name].find(
    (x) => typeof x === "string" && x.trim(),
  ) as string | undefined;
  const fromEmail = u.email ? u.email.split("@")[0] : undefined;
  return (n ?? fromEmail ?? "플레이어").trim().slice(0, 12) || "플레이어";
}

function callbackUrl(next = "/"): string {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export async function signInKakao(next = "/"): Promise<void> {
  const c = sb();
  if (!c) return;
  const { error } = await c.auth.signInWithOAuth({ provider: "kakao", options: { redirectTo: callbackUrl(next) } });
  if (error) throw error;
}

export async function signInEmail(email: string, password: string): Promise<void> {
  const c = sb();
  if (!c) return;
  const { error } = await c.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

/** true = 즉시 로그인됨(이메일 인증 꺼짐), false = 인증 메일 발송됨 */
export async function signUpEmail(email: string, password: string, nickname: string, next = "/"): Promise<boolean> {
  const c = sb();
  if (!c) return false;
  const { data, error } = await c.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { nickname: nickname.trim().slice(0, 12) }, emailRedirectTo: callbackUrl(next) },
  });
  if (error) throw error;
  // Supabase는 이미 가입된 이메일에 대해 identities가 빈 user를 돌려준다 (이메일 열거 방지)
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error("user_already_exists");
  }
  return Boolean(data.session);
}

export async function sendPasswordReset(email: string): Promise<void> {
  const c = sb();
  if (!c) return;
  const { error } = await c.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: callbackUrl("/auth/reset"),
  });
  if (error) throw error;
}

export async function updatePassword(pw: string): Promise<void> {
  const c = sb();
  if (!c) return;
  const { error } = await c.auth.updateUser({ password: pw });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  await sb()?.auth.signOut();
}

export interface Profile {
  user_id: string;
  nickname: string;
  created_at: string;
  last_seen: string;
}

export async function ensureProfile(nickname?: string): Promise<Profile | null> {
  const c = sb();
  if (!c) return null;
  const { data, error } = await c.rpc("ensure_profile", { p_nickname: nickname ?? null });
  if (error) throw error;
  return data as Profile;
}

export async function setNickname(n: string): Promise<string> {
  const c = sb();
  if (!c) return n;
  const { data, error } = await c.rpc("set_nickname", { p_nickname: n });
  if (error) throw error;
  return data as string;
}

/* ───────────── 랭킹 ───────────── */

export interface ScoreRow {
  game_id: string;
  user_id: string;
  nickname: string;
  best_score: number;
  meta: Record<string, unknown> | null;
  plays: number;
  achieved_at: string;
}

export interface SubmitResult {
  best: number;
  improved: boolean;
  rank: number;
}

export async function submitScore(gameId: string, score: number, meta: unknown): Promise<SubmitResult | null> {
  const c = sb();
  if (!c) return null;
  const { data, error } = await c.rpc("submit_score", {
    p_game_id: gameId,
    p_score: Math.round(score),
    p_meta: meta ?? {},
  });
  if (error) throw error;
  return data as SubmitResult;
}

export async function fetchLeaderboard(gameId: string, limit = 50): Promise<ScoreRow[]> {
  const c = sb();
  if (!c) return [];
  const { data, error } = await c
    .from("leaderboard")
    .select("game_id,user_id,nickname,best_score,meta,plays,achieved_at")
    .eq("game_id", gameId)
    .order("best_score", { ascending: false })
    .order("achieved_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ScoreRow[];
}

export async function fetchMyScores(userId: string): Promise<ScoreRow[]> {
  const c = sb();
  if (!c) return [];
  const { data, error } = await c
    .from("leaderboard")
    .select("game_id,user_id,nickname,best_score,meta,plays,achieved_at")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []) as ScoreRow[];
}

export async function fetchMyRank(gameId: string): Promise<number | null> {
  const c = sb();
  if (!c) return null;
  const { data, error } = await c.rpc("my_rank", { p_game_id: gameId });
  if (error) throw error;
  return (data as number | null) ?? null;
}
