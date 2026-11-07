"use client";
// 로그인한 사람이 관리자(app_admins)인지 — 0038_online_admin.sql 의 is_app_admin()
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase";

const cache = new Map<string, boolean>();

export function useIsAdmin(userId: string | null | undefined): boolean {
  const [admin, setAdmin] = useState(() => (userId ? cache.get(userId) ?? false : false));
  useEffect(() => {
    if (!userId) { setAdmin(false); return; }
    if (cache.has(userId)) { setAdmin(cache.get(userId)!); return; }
    const db = sb();
    if (!db) return;
    let off = false;
    db.rpc("is_app_admin").then(({ data }) => { cache.set(userId, data === true); if (!off) setAdmin(data === true); });
    return () => { off = true; };
  }, [userId]);
  return admin;
}
