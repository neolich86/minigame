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

/** 소셜 로그인 후 돌아갈 곳 — 인증 서버가 콜백 주소를 무시하고 홈으로 보내도 여기 적어 둔 곳으로 다시 보낸다 */
export const AUTH_NEXT_KEY = "mgh:authNext";

export function takeAuthNext(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_NEXT_KEY);
    localStorage.removeItem(AUTH_NEXT_KEY);
    if (!raw) return null;
    const { next, at } = JSON.parse(raw) as { next?: string; at?: number };
    if (!next || !next.startsWith("/") || next.startsWith("//") || !at || Date.now() - at > 10 * 60 * 1000) return null;
    return next;
  } catch {
    return null;
  }
}

export async function signInKakao(next = "/"): Promise<void> {
  const c = sb();
  if (!c) return;
  try {
    localStorage.setItem(AUTH_NEXT_KEY, JSON.stringify({ next, at: Date.now() }));
  } catch {}
  const { error } = await c.auth.signInWithOAuth({ provider: "kakao", options: { redirectTo: callbackUrl(next) } });
  if (error) throw error;
}

/** 구글 로그인 켜짐 여부 — Supabase 에서 Google 공급자를 설정한 뒤 Vercel 환경변수 NEXT_PUBLIC_GOOGLE_LOGIN=1 */
export const googleLoginEnabled = process.env.NEXT_PUBLIC_GOOGLE_LOGIN === "1";
/** 구글 클라우드 '웹 애플리케이션' 클라이언트 ID — 안드로이드 앱의 네이티브 로그인에 쓴다 (공개 값) */
const GOOGLE_WEB_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";

type NativeGoogle = { signIn(o: { webClientId: string; nonce?: string }): Promise<{ idToken: string }> };
type Cap = { isNativePlatform?: () => boolean; Plugins?: { GoogleSignIn?: NativeGoogle } };
function cap(): Cap | undefined {
  try {
    return (window as unknown as { Capacitor?: Cap }).Capacitor;
  } catch {
    return undefined;
  }
}
/** 안드로이드 앱(Capacitor 웹뷰) 안인지 — 구글은 웹뷰 안의 로그인 창을 막는다(disallowed_useragent) */
export function inNativeApp(): boolean {
  return !!cap()?.isNativePlatform?.();
}
/** 앱에 네이티브 구글 로그인 플러그인(kr.minigame.auth.GoogleSignInPlugin)이 들어 있는지 — 예전 버전 앱에는 없다 */
function nativeGoogle(): NativeGoogle | null {
  const c = cap();
  return c?.isNativePlatform?.() && c.Plugins?.GoogleSignIn && GOOGLE_WEB_CLIENT_ID ? c.Plugins.GoogleSignIn : null;
}
/** 지금 이 화면에서 구글 로그인 버튼을 보여도 되는지 */
export const googleLoginAvailable = () => googleLoginEnabled && (!inNativeApp() || !!nativeGoogle());

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function signInGoogle(next = "/"): Promise<void> {
  const c = sb();
  if (!c) return;
  const native = nativeGoogle();
  if (native) {
    // 앱: 휴대폰 구글 계정 선택 창 → ID 토큰 → Supabase (구글에는 해시한 nonce, Supabase 에는 원래 nonce)
    const raw = crypto.randomUUID();
    let idToken: string;
    try {
      ({ idToken } = await native.signIn({ webClientId: GOOGLE_WEB_CLIENT_ID, nonce: await sha256Hex(raw) }));
    } catch (e) {
      if (String((e as { message?: string })?.message ?? e).includes("canceled")) return; // 사용자가 창을 닫음
      throw e;
    }
    const { error } = await c.auth.signInWithIdToken({ provider: "google", token: idToken, nonce: raw });
    if (error) throw error;
    if (window.location.pathname + window.location.search !== next) window.location.href = next;
    return;
  }
  try {
    localStorage.setItem(AUTH_NEXT_KEY, JSON.stringify({ next, at: Date.now() }));
  } catch {}
  const { error } = await c.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callbackUrl(next) } });
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

export async function fetchLeaderboard(gameId: string, limit = 50, minScore?: number): Promise<ScoreRow[]> {
  const c = sb();
  if (!c) return [];
  let q = c
    .from("leaderboard")
    .select("game_id,user_id,nickname,best_score,meta,plays,achieved_at")
    .eq("game_id", gameId);
  if (minScore !== undefined) q = q.gte("best_score", minScore);
  const { data, error } = await q
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
