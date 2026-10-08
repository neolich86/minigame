// 콘텐츠 좋아요(하트) — 로그인 없이 브라우저(기기)마다 한 번 (supabase/migrations/0013_likes.sql)
"use client";
import { useEffect, useSyncExternalStore } from "react";
import { cloudEnabled, sb } from "./supabase";

const DEVICE_KEY = "mgh:device";
interface State {
  counts: Record<string, number>;
  mine: Set<string>;
  loaded: boolean;
}
let state: State = { counts: {}, mine: new Set(), loaded: false };
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
const set = (s: Partial<State>) => {
  state = { ...state, ...s };
  emit();
};

function deviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

let loading: Promise<void> | null = null;
function load() {
  if (loading || !cloudEnabled) return loading;
  const db = sb();
  if (!db) return null;
  loading = (async () => {
    const [c, m] = await Promise.all([db.rpc("like_counts"), db.rpc("my_likes", { p_device: deviceId() })]);
    const counts: Record<string, number> = {};
    for (const r of (c.data ?? []) as { item_id: string; likes: number }[]) counts[r.item_id] = r.likes;
    const mine = new Set<string>(((m.data ?? []) as unknown[]).map((x) => (typeof x === "string" ? x : String((x as { my_likes?: string }).my_likes ?? ""))));
    set({ counts, mine, loaded: true });
  })().catch(() => {
    loading = null;
  });
  return loading;
}

export async function toggleLike(id: string): Promise<void> {
  const db = sb();
  if (!db) return;
  // 바로 반영하고(낙관적), 서버 결과로 맞춘다
  const was = state.mine.has(id);
  const mine = new Set(state.mine);
  if (was) mine.delete(id);
  else mine.add(id);
  set({ mine, counts: { ...state.counts, [id]: Math.max(0, (state.counts[id] ?? 0) + (was ? -1 : 1)) } });
  const { data, error } = await db.rpc("toggle_like", { p_item: id, p_device: deviceId() });
  if (error) {
    const back = new Set(state.mine);
    if (was) back.add(id);
    else back.delete(id);
    set({ mine: back, counts: { ...state.counts, [id]: Math.max(0, (state.counts[id] ?? 0) + (was ? 1 : -1)) } });
    throw error;
  }
  const r = data as { liked: boolean; likes: number };
  const fixed = new Set(state.mine);
  if (r.liked) fixed.add(id);
  else fixed.delete(id);
  set({ mine: fixed, counts: { ...state.counts, [id]: r.likes } });
}

const empty: State = { counts: {}, mine: new Set(), loaded: false };
export function useLikes(): State {
  useEffect(() => {
    load();
  }, []);
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => state,
    () => empty,
  );
}
