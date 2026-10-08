"use client";

import { useState, type MouseEvent } from "react";
import { useApp } from "./AppProvider";
import { cloudEnabled } from "@/lib/supabase";
import { toggleLike, useLikes } from "@/lib/likes";

/** 하트 버튼 — 카드 안(링크 위)에서도 눌러지도록 이동을 막는다 */
export function LikeButton({ id, variant = "card" }: { id: string; variant?: "card" | "bar" }) {
  const { lang } = useApp();
  const { counts, mine } = useLikes();
  const [pop, setPop] = useState(0);
  if (!cloudEnabled) return null;
  const liked = mine.has(id);
  const n = counts[id] ?? 0;
  const label = lang === "ko" ? (liked ? "좋아요 취소" : "재밌어요! 좋아요") : liked ? "Unlike" : "Like";
  function onClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!liked) setPop((x) => x + 1);
    toggleLike(id).catch(() => {});
  }
  return (
    <button type="button" className={`like-btn ${variant}${liked ? " on" : ""}`} onClick={onClick} aria-pressed={liked} aria-label={label} title={label}>
      <svg key={pop} className={pop ? "pop" : ""} viewBox="0 0 24 24" aria-hidden>
        <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.2 4.4 2.6.8-1.4 2.3-2.6 4.4-2.6 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z" />
      </svg>
      <span>{n > 0 ? n.toLocaleString() : variant === "bar" ? (lang === "ko" ? "좋아요" : "Like") : ""}</span>
    </button>
  );
}
