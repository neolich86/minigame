"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useApp } from "./AppProvider";
import { GENRES, KINDS, KIND_INDEX, entryPath, formatScore, itemsOf, type Genre, type Kind } from "@/lib/games";
import { KIND_SEO } from "@/lib/seo";
import { fetchMyScores, type ScoreRow } from "@/lib/supabase";

const ACCENT: Record<Genre, { c: string; bg: string }> = {
  board: { c: "var(--rose)", bg: "var(--rose-dim)" },
  action: { c: "var(--gold)", bg: "var(--gold-dim)" },
  strategy: { c: "var(--teal)", bg: "var(--teal-dim)" },
  casual: { c: "var(--violet)", bg: "var(--violet-dim)" },
};

const VIEW_KEY = "mgh:view";

const KIND_ICON: Record<Kind, string> = { game: "🎮", tool: "🎲", app: "🧭" };
const KIND_LABEL = { game: "navGames", tool: "navTools", app: "navApps" } as const;
const KIND_DESC = { game: "kindDesc_game", tool: "kindDesc_tool", app: "kindDesc_app" } as const;

/** 게임(홈) · 추첨·도구 · 서비스 목록 — kind 로 무엇을 보여줄지 정한다 */
export function GameList({ children, kind = "game" }: { children?: ReactNode; kind?: Kind }) {
  const { t, lang, user } = useApp();
  const ITEMS = useMemo(() => itemsOf(kind), [kind]);
  const isGame = kind === "game";
  const hero = kind === "game" ? null : KIND_SEO[kind][lang];
  const [filter, setFilter] = useState<Genre | "all">("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [mine, setMine] = useState<ScoreRow[]>([]);

  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      if (v === "list" || v === "grid") setView(v);
    } catch {}
  }, []);

  useEffect(() => {
    if (!user) {
      setMine([]);
      return;
    }
    fetchMyScores(user.id).then(setMine).catch(() => setMine([]));
  }, [user]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: ITEMS.length };
    for (const g of ITEMS) c[g.genre] = (c[g.genre] ?? 0) + 1;
    return c;
  }, [ITEMS]);

  const visible = ITEMS.filter((g) => !isGame || filter === "all" || g.genre === filter);

  function changeView(v: "grid" | "list") {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {}
  }

  return (
    <div className="wrap">
      <header className="hero">
        <span className="eyebrow">
          <span className="dot" /> {hero ? hero.eyebrow : t("eyebrow")}
        </span>
        <h1 className="title">{hero ? hero.heading : t("siteName")}</h1>
        <p className="subtitle">{hero ? hero.subtitle : t("subtitle")}</p>
      </header>

      {/* 게임 · 추첨·도구 · 서비스 큰 탭 — 홈/목록 첫 화면에서 바로 보이게 */}
      <nav className="kind-tabs" aria-label={t("navGames") + " · " + t("navTools") + " · " + t("navApps")}>
        {KINDS.map((k) => (
          <Link key={k} href={KIND_INDEX[k]} className={`kind-tab kind-${k}${k === kind ? " active" : ""}`} aria-current={k === kind ? "page" : undefined}>
            <span className="kind-tab-icon" aria-hidden>
              {KIND_ICON[k]}
            </span>
            <span className="kind-tab-text">
              <b>
                {t(KIND_LABEL[k])} <em>{itemsOf(k).length}</em>
              </b>
              <small>{t(KIND_DESC[k])}</small>
            </span>
          </Link>
        ))}
      </nav>

      <div className="controls" style={isGame ? undefined : { justifyContent: "flex-end" }}>
        {isGame && (
        <div className="filters">
          <button className={`filter-btn${filter === "all" ? " active" : ""}`} onClick={() => setFilter("all")}>
            {t("filterAll")} <span className="count">{counts.all}</span>
          </button>
          {GENRES.map((g) => (
            <button key={g} className={`filter-btn${filter === g ? " active" : ""}`} onClick={() => setFilter(g)}>
              {t(`genre_${g}`)} <span className="count">{counts[g] ?? 0}</span>
            </button>
          ))}
        </div>
        )}
        <div className="view-toggle">
          <button className={view === "list" ? "active" : ""} onClick={() => changeView("list")} aria-label={t("viewList")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
            {t("viewList")}
          </button>
          <button className={view === "grid" ? "active" : ""} onClick={() => changeView("grid")} aria-label={t("viewGrid")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
            {t("viewGrid")}
          </button>
        </div>
      </div>

      <main className={`games ${view}`}>
        {visible.map((g, i) => {
          const a = ACCENT[g.genre];
          const n = String(ITEMS.indexOf(g) + 1).padStart(2, "0");
          const title = g.title[lang];
          const best = g.boards
            ?.map((b) => ({ b, row: mine.find((m) => m.game_id === b.id) }))
            .find((x) => x.row);
          const chip = (
            <span className="genre-chip" style={{ color: a.c, background: a.bg }}>
              {isGame ? t(`genre_${g.genre}`) : t(kind === "tool" ? "navTools" : "navApps")}
            </span>
          );
          return (
            <Link
              key={g.id}
              href={entryPath(g)}
              className="card"
              style={{ ["--accent" as string]: a.c, animationDelay: `${i * 0.05}s` }}
            >
              <div className="thumb">
                <div className="badges">
                  {g.online && <span className="badge online">● {t("badgeOnline")}</span>}
                  {g.boards && <span className="badge rank">🏆 {t("badgeRanking")}</span>}
                </div>
                <div className="notch" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.thumb} alt={title} loading="lazy" />
                <span className="play-pill">{isGame ? t("play") : t("openItem")}</span>
              </div>
              <div className="info">
                <div className="left">
                  <h3>
                    <span className="idx">{n}</span>
                    {title}
                  </h3>
                  <p>{g.desc[lang]}</p>
                  <div className="meta-row">
                    {chip}
                    {best?.row && (
                      <span className="card-best">
                        {t("myBest")} {formatScore(best.b, best.row.best_score, lang)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="right">
                  {g.online && <span className="badge online">{t("badgeOnline")}</span>}
                  {g.boards && <span className="badge rank">🏆</span>}
                  {chip}
                  <span className="play-pill">{isGame ? t("play") : t("openItem")}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </main>

      {children}

      <footer className="site-footer">
        <span>{t("footer")}</span>
        <span>
          {visible.length} / {ITEMS.length} {isGame ? t("gamesUnit") : t(kind === "tool" ? "itemsUnit_tool" : "itemsUnit_app")}
        </span>
      </footer>
    </div>
  );
}
