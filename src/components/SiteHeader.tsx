"use client";

import Link from "next/link";
import { LoginLink } from "@/components/LoginLink";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "./AppProvider";
import { cloudEnabled } from "@/lib/supabase";
import { isAppPath } from "@/lib/appPaths";
import { useOnline } from "@/lib/online";

export function SiteHeader() {
  const { t, lang, setLang, user, profile, loading } = useApp();
  const path = usePathname();
  const online = useOnline(path); // 앱 화면에서도 신호는 보낸다 (머리글만 숨김)
  const [appLogin, setAppLogin] = useState(false);
  useEffect(() => {
    const n = path === "/login" ? new URLSearchParams(window.location.search).get("next") : null;
    setAppLogin(isAppPath(n));
  }, [path]);
  const inGame = ["/play/", "/online/", "/tools/", "/apps/"].some((p) => path?.startsWith(p));
  const section = path?.startsWith("/tools") ? "tool" : path?.startsWith("/apps") ? "app" : path === "/" || path?.startsWith("/play/") || path?.startsWith("/online/") ? "game" : "";
  // 앱(구글 플레이) 전용 화면과, 앱에서 들어온 로그인 화면은 포털 머리글 없이
  if (isAppPath(path) || appLogin) return null;

  return (
    <header className={`site-header${inGame ? " compact" : ""}`}>
      <Link href="/" className="brand">
        <span className="brand-icon" aria-hidden>
          🕹️
        </span>
        <span className="brand-text">{t("siteName")}</span>
      </Link>
      <nav className="nav">
        <div className="section-nav">
          <Link href="/" className={`nav-link${section === "game" ? " active" : ""}`} title={t("navGames")} aria-label={t("navGames")}>
            🎮 <span className="hide-sm">{t("navGames")}</span>
          </Link>
          <Link href="/tools" className={`nav-link${section === "tool" ? " active" : ""}`} title={t("navTools")} aria-label={t("navTools")}>
            🎲 <span className="hide-sm">{t("navTools")}</span>
          </Link>
          <Link href="/apps" className={`nav-link${section === "app" ? " active" : ""}`} title={t("navApps")} aria-label={t("navApps")}>
            🧭 <span className="hide-sm">{t("navApps")}</span>
          </Link>
        </div>
        {online.loaded && (
          <span className="online-now" title={lang === "ko" ? "지금 접속 중인 사람 (최근 2분)" : "People online now (last 2 min)"}>
            <i aria-hidden /> {online.total.toLocaleString()}
            <span className="hide-sm">{lang === "ko" ? "명 접속 중" : " online"}</span>
          </span>
        )}
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
            <LoginLink next={path || "/"} className="nav-login">
              {t("navLogin")}
            </LoginLink>
          ))}
      </nav>
    </header>
  );
}
