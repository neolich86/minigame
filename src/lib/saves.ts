// 게임 저장 데이터 — 로그인 사용자의 게임별 상태(game_saves)와 첨부 파일(game-files 버킷).
// 게임(iframe)은 bridge.js 의 MGH.save 로 요청하고, 포털(GamePlayer)이 이 함수들로 처리한다.
import { sb } from "./supabase";

const BUCKET = "game-files";
const FILE_RE = /^[A-Za-z0-9_-]{1,64}\.(jpg|jpeg|png|webp)$/;

function client() {
  const c = sb();
  if (!c) throw new Error("cloud_disabled");
  return c;
}

async function uid(): Promise<string> {
  const { data } = await client().auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error("not_logged_in");
  return id;
}

function filePath(user: string, gameId: string, name: string): string {
  if (!FILE_RE.test(name)) throw new Error("bad_file_name");
  return `${user}/${gameId}/${name}`;
}

export async function loadSave(gameId: string): Promise<{ data: unknown; updatedAt: string } | null> {
  const user = await uid();
  const { data, error } = await client()
    .from("game_saves")
    .select("data, updated_at")
    .eq("user_id", user)
    .eq("game_id", gameId)
    .maybeSingle();
  if (error) throw error;
  return data ? { data: data.data, updatedAt: data.updated_at as string } : null;
}

export async function storeSave(gameId: string, value: unknown): Promise<string> {
  const user = await uid();
  const updatedAt = new Date().toISOString();
  const { error } = await client()
    .from("game_saves")
    .upsert({ user_id: user, game_id: gameId, data: value, updated_at: updatedAt });
  if (error) throw error;
  return updatedAt;
}

export async function putFile(gameId: string, name: string, blob: Blob): Promise<void> {
  const user = await uid();
  const { error } = await client()
    .storage.from(BUCKET)
    .upload(filePath(user, gameId, name), blob, { upsert: true, contentType: blob.type || "image/jpeg", cacheControl: "31536000" });
  if (error) throw error;
}

export async function deleteFiles(gameId: string, names: string[]): Promise<void> {
  if (!names.length) return;
  const user = await uid();
  const { error } = await client()
    .storage.from(BUCKET)
    .remove(names.map((n) => filePath(user, gameId, n)));
  if (error) throw error;
}

/** 파일 이름 → 1일짜리 서명 주소 */
export async function fileUrls(gameId: string, names: string[]): Promise<Record<string, string>> {
  if (!names.length) return {};
  const user = await uid();
  const paths = names.map((n) => filePath(user, gameId, n));
  const { data, error } = await client().storage.from(BUCKET).createSignedUrls(paths, 60 * 60 * 24);
  if (error) throw error;
  const out: Record<string, string> = {};
  (data ?? []).forEach((d, i) => {
    if (d.signedUrl) out[names[i]] = d.signedUrl;
  });
  return out;
}
