"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./AppProvider";
import { isAppPath } from "@/lib/appPaths";

// 모든 페이지 아래 공통 바닥글 — 사이트 소개·정책·문의 링크 (애드센스 심사 기준: 운영자·정책 정보가 어디서나 보이도록)
export function SiteFooter() {
  const { lang } = useApp();
  const path = usePathname();
  if (isAppPath(path)) return null;
  const ko = lang === "ko";
  const links = [
    { href: "/about", label: ko ? "사이트 소개" : "About" },
    { href: "/privacy", label: ko ? "개인정보처리방침" : "Privacy" },
    { href: "/terms", label: ko ? "이용약관" : "Terms" },
    { href: "/contact", label: ko ? "문의하기" : "Contact" },
  ];
  return (
    <footer className="global-footer">
      <div className="wrap global-footer-inner">
        <nav aria-label={ko ? "사이트 정보" : "Site info"}>
          {links.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
        <p>{ko ? "© 2026 미니게임천국 · 제임스웹이 직접 만들고 운영하는 무료 브라우저 게임·도구 모음" : "© 2026 Mini Game Heaven · Free browser games and tools made and run by JamesWeb"}</p>
      </div>
    </footer>
  );
}
