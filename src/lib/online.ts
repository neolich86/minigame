// 지금 접속 중인 사람 수 — 1분마다 신호를 보내고 최근 2분 안의 기기 수를 받는다 (supabase/migrations/0037_online_now.sql)
"use client";
import { useEffect, useSyncExternalStore } from "react";
import { cloudEnabled, sb } from "./supabase";
import { deviceId } from "./likes";

interface Online { total: number; items: Record<string, number>; loaded: boolean }
let state: Online = { total: 0, items: {}, loaded: false };
const subs = new Set<() => void>();

/** 주소에서 지금 보고 있는 게임·도구·서비스 id */
export function itemOfPath(path: string | null): string {
  const m = /^\/(?:play|apps|tools|online)\/([a-z0-9-]{1,40})/.exec(path ?? "");
  return m ? m[1] : "";
}

let item = "", timer: ReturnType<typeof setInterval> | null = null, users = 0;
async function ping() {
  const db = sb();
  if (!db || document.hidden) return;
  const { data, error } = await db.rpc("online_ping", { p_device: deviceId(), p_item: item });
  if (error || !data) return;
  const d = data as { total: number; items: Record<string, number> | null };
  state = { total: Math.max(1, Number(d.total) || 1), items: d.items ?? {}, loaded: true };
  subs.forEach((f) => f());
}
function leave() {
  const db = sb();
  if (db) void db.rpc("online_leave", { p_device: deviceId() });
}
function onVis() { if (!document.hidden) ping(); }

/** 신호를 보내며 접속자 수를 돌려준다. path 가 바뀌면 바로 한 번 더 보낸다 */
export function useOnline(path: string | null): Online {
  useEffect(() => {
    if (!cloudEnabled) return;
    item = itemOfPath(path);
    ping();
  }, [path]);
  useEffect(() => {
    if (!cloudEnabled) return;
    if (users++ === 0) {
      timer = setInterval(ping, 60_000);
      document.addEventListener("visibilitychange", onVis);
      addEventListener("pagehide", leave);
    }
    return () => {
      if (--users === 0) {
        if (timer) clearInterval(timer);
        document.removeEventListener("visibilitychange", onVis);
        removeEventListener("pagehide", leave);
      }
    };
  }, []);
  return useSyncExternalStore(
    (f) => { subs.add(f); return () => subs.delete(f); },
    () => state,
    () => state,
  );
}
