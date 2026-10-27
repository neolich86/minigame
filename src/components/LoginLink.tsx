"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/**
 * 로그인 링크 — 검색엔진에는 주소를 "/login" 하나로만 보여 주고,
 * 누르면 돌아올 곳(next)을 붙여 이동한다.
 * (페이지마다 /login?next=... 주소가 따로 생기면 robots.txt 차단 페이지가 수천 개로 늘어나 서치 콘솔에 쌓인다)
 */
export function LoginLink({ next, className, style, children }: { next: string; className?: string; style?: React.CSSProperties; children: ReactNode }) {
  const router = useRouter();
  return (
    <a
      href="/login"
      rel="nofollow"
      className={className}
      style={style}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        router.push(`/login?next=${encodeURIComponent(next || "/")}`);
      }}
    >
      {children}
    </a>
  );
}
