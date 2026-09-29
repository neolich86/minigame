"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./AppProvider";
import { cloudEnabled } from "@/lib/supabase";

export function SiteHeader() {
  const { t, lang, setLang, user, profile, loading } = useApp();
  const path = usePathname();
  const inGame = path?.startsWith("/play/") || path?.startsWith("/online/");
  const loginHref = `/login?next=${encodeURIComponent(path || "/")}`;

  return (
    <header className={`site-header${inGame ? " compact" : ""}`}>
      <Link href="/" className="brand">
        <span className="brand-icon" aria-hidden>
          🕹️
        </span>
        <span>{t("siteName")}</span>
      </Link>
      <nav className="nav">
        <Link href="/ranking" className={`nav-link${path === "/ranking" ? " active" : ""}`}>
          🏆 <span className="hide-sm">{t("navRanking")}</span>
        </Link>
        <div className="lang-toggle" role="group" aria-label="Language">
          {(["ko", "en"] as const).map((l) => (
            <button key={l} type="button" className={lang === l ? "on" : ""} onClick={() => setLang(l)} aria-pressed={lang === l}>
              {l === "ko" ? "KO" : "EN"}
            </button>
          ))}
        </div>
        {cloudEnabled &&
          (loading ? (
            <span className="nav-user ghost">…</span>
          ) : user ? (
            <Link href="/me" className="nav-user" title={t("navMe")}>
              <span className="avatar" aria-hidden>
                {(profile?.nickname ?? "?").slice(0, 1)}
              </span>
              <span className="hide-sm">{profile?.nickname ?? "…"}</span>
            </Link>
          ) : (
            <Link href={loginHref} className="nav-login">
              {t("navLogin")}
            </Link>
          ))}
      </nav>
    </header>
  );
}
