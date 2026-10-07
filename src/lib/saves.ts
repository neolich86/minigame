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

/** 저장. prevAt(마지막으로 읽거나 쓴 시각)을 주면, 그 사이 다른 기기가 저장했을 때 덮어쓰지 않고 그쪽 데이터를 돌려준다 */
export async function storeSave(
  gameId: string,
  value: unknown,
  prevAt?: string,
): Promise<{ updatedAt: string; conflict?: false } | { conflict: true; data: unknown; updatedAt: string }> {
  const user = await uid();
  const c = client();
  if (prevAt) {
    const { data: cur, error: selErr } = await c
      .from("game_saves")
      .select("data, updated_at")
      .eq("user_id", user)
      .eq("game_id", gameId)
      .maybeSingle();
    if (selErr) throw selErr;
    if (cur && Date.parse(cur.updated_at as string) > Date.parse(prevAt) + 1) {
      return { conflict: true, data: cur.data, updatedAt: cur.updated_at as string };
    }
  }
  const updatedAt = new Date().toISOString();
  const { error } = await c.from("game_saves").upsert({ user_id: user, game_id: gameId, data: value, updated_at: updatedAt });
  if (error) throw error;
  return { updatedAt };
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

/* ───────── 공개 공유 링크 (game_shares + game-public 버킷) ───────── */
const PUB = "game-public";
const SLUG_ABC = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function newSlug(n = 8): string {
  const b = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(b, (x) => SLUG_ABC[x % SLUG_ABC.length]).join("");
}

export interface ShareInfo {
  slug: string | null;
  /** 공개 파일 주소 앞부분 — base + 파일이름 */
  base: string;
  /** 이미 올라가 있는 공개 파일 이름 */
  names: string[];
}

export async function shareInfo(gameId: string): Promise<ShareInfo> {
  const user = await uid();
  const c = client();
  const { data, error } = await c.from("game_shares").select("slug").eq("user_id", user).eq("game_id", gameId).maybeSingle();
  if (error) throw error;
  const dir = `${user}/${gameId}`;
  const { data: files } = await c.storage.from(PUB).list(dir, { limit: 1000 });
  const base = c.storage.from(PUB).getPublicUrl(`${dir}/`).data.publicUrl;
  return { slug: data?.slug ?? null, base, names: (files ?? []).map((f) => f.name) };
}

/** 공개 스냅숏 저장 — files 는 새로 올릴 파일, keep 에 없는 기존 공개 파일은 지운다. 링크(slug)는 처음 만든 것을 유지 */
export async function publishShare(gameId: string, value: unknown, files: Record<string, Blob>, keep: string[]): Promise<{ slug: string }> {
  const user = await uid();
  const c = client();
  const dir = `${user}/${gameId}`;
  for (const [name, blob] of Object.entries(files)) {
    if (!FILE_RE.test(name) || !(blob instanceof Blob)) throw new Error("bad_file");
    const { error } = await c.storage
      .from(PUB)
      .upload(`${dir}/${name}`, blob, { upsert: true, contentType: blob.type || "image/jpeg", cacheControl: name === "og.png" ? "60" : "31536000" });
    if (error) throw error;
  }
  const { data: existing } = await c.from("game_shares").select("slug").eq("user_id", user).eq("game_id", gameId).maybeSingle();
  const now = new Date().toISOString();
  let slug = existing?.slug as string | undefined;
  if (slug) {
    const { error } = await c.from("game_shares").update({ data: value, updated_at: now }).eq("slug", slug);
    if (error) throw error;
  } else {
    for (let i = 0; i < 3 && !slug; i++) {
      const s = newSlug();
      const { error } = await c.from("game_shares").insert({ slug: s, user_id: user, game_id: gameId, data: value, updated_at: now });
      if (!error) slug = s;
      else if (error.code !== "23505") throw error;
    }
    if (!slug) throw new Error("slug_failed");
  }
  const keepSet = new Set(keep);
  const { data: list } = await c.storage.from(PUB).list(dir, { limit: 1000 });
  const stale = (list ?? []).map((f) => f.name).filter((n) => !keepSet.has(n));
  if (stale.length) await c.storage.from(PUB).remove(stale.map((n) => `${dir}/${n}`));
  return { slug };
}

/** 공개 중지 — 링크와 공개 사진을 지운다 */
export async function deleteShare(gameId: string): Promise<void> {
  const user = await uid();
  const c = client();
  const dir = `${user}/${gameId}`;
  const { error } = await c.from("game_shares").delete().eq("user_id", user).eq("game_id", gameId);
  if (error) throw error;
  const { data: list } = await c.storage.from(PUB).list(dir, { limit: 1000 });
  if (list?.length) await c.storage.from(PUB).remove(list.map((f) => `${dir}/${f.name}`));
}

/* ───────── 회원 탈퇴 ───────── */
/** 내 사진(비공개·공개 버킷)을 모두 지우고 계정을 삭제한다 — delete_my_account() RPC (0012) */
export async function deleteMyAccount(): Promise<void> {
  const user = await uid();
  const c = client();
  for (const bucket of [BUCKET, PUB]) {
    const { data: dirs } = await c.storage.from(bucket).list(user, { limit: 1000 });
    for (const d of dirs ?? []) {
      // 폴더(게임별)는 id 가 없다
      if (d.id) {
        await c.storage.from(bucket).remove([`${user}/${d.name}`]);
        continue;
      }
      const dir = `${user}/${d.name}`;
      for (;;) {
        const { data: files } = await c.storage.from(bucket).list(dir, { limit: 1000 });
        if (!files?.length) break;
        const { error } = await c.storage.from(bucket).remove(files.map((f) => `${dir}/${f.name}`));
        if (error) throw error;
        if (files.length < 1000) break;
      }
    }
  }
  const { error } = await c.rpc("delete_my_account");
  if (error) throw error;
  await c.auth.signOut();
}
