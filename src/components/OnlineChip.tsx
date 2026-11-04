"use client";
// 머리글의 "N명 접속 중" — 관리자(app_admins)가 누르면 지금 접속 중인 사람 목록을 본다 (0038_online_admin.sql)
import { useEffect, useRef, useState } from "react";
import { sb } from "@/lib/supabase";
import { gameById } from "@/lib/games";
import type { Lang } from "@/lib/i18n";

interface Who { name: string | null; item: string; seen_at: string }

export function OnlineChip({ total, lang, userId }: { total: number; lang: Lang; userId: string | null }) {
  const [admin, setAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<Who[] | null>(null);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setAdmin(false);
    const db = sb();
    if (!db || !userId) return;
    db.rpc("is_app_admin").then(({ data }) => setAdmin(data === true));
  }, [userId]);
  async function load() {
    const db = sb();
    if (!db) return;
    const { data, error } = await db.rpc("online_who");
    setList(error ? [] : ((data ?? []) as Who[]));
  }
  useEffect(() => {
    if (!open) return;
    load();
    const t = setInterval(load, 30_000);
    const close = (e: PointerEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    addEventListener("pointerdown", close);
    return () => { clearInterval(t); removeEventListener("pointerdown", close); };
  }, [open]);
  const ko = lang === "ko";
  const label = (
    <>
      <i aria-hidden /> {total.toLocaleString()}
      <span className="hide-sm">{ko ? "명 접속 중" : " online"}</span>
    </>
  );
  if (!admin)
    return <span className="online-now" title={ko ? "지금 접속 중인 사람 (최근 2분)" : "People online now (last 2 min)"}>{label}</span>;
  const where = (id: string) => (id ? gameById(id)?.title[lang] ?? id : ko ? "목록·기타 화면" : "Lists / other");
  const guests = list ? list.filter((w) => !w.name).length : 0;
  return (
    <div className="online-wrap" ref={box}>
      <button type="button" className="online-now admin" onClick={() => setOpen((v) => !v)} aria-expanded={open}>{label}</button>
      {open && (
        <div className="online-pop" role="dialog" aria-label={ko ? "지금 접속 중" : "Online now"}>
          <b>{ko ? `지금 접속 중 ${list ? list.length : total}명` : `Online now: ${list ? list.length : total}`}</b>
          <small>{ko ? `로그인 ${list ? list.length - guests : "…"} · 비로그인 ${list ? guests : "…"} · 관리자만 보여요` : "Admins only"}</small>
          <ul>
            {!list && <li className="muted">{ko ? "불러오는 중…" : "Loading…"}</li>}
            {list && !list.length && <li className="muted">{ko ? "목록을 불러오지 못했어요" : "Could not load"}</li>}
            {list?.map((w, i) => (
              <li key={i}>
                <span className={w.name ? "nm" : "nm guest"}>{w.name ?? (ko ? "비로그인" : "Guest")}</span>
                <span className="at">{where(w.item)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
