"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useApp } from "./AppProvider";
import { GAMES, GENRES, formatScore, type Genre } from "@/lib/games";
import { fetchMyScores, type ScoreRow } from "@/lib/supabase";

const ACCENT: Record<Genre, { c: string; bg: string }> = {
  board: { c: "var(--rose)", bg: "var(--rose-dim)" },
  action: { c: "var(--gold)", bg: "var(--gold-dim)" },
  strategy: { c: "var(--teal)", bg: "var(--teal-dim)" },
  casual: { c: "var(--violet)", bg: "var(--violet-dim)" },
};

const VIEW_KEY = "mgh:view";

export function GameList({ children }: { children?: ReactNode }) {
  const { t, lang, user } = useApp();
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
    const c: Record<string, number> = { all: GAMES.length };
    for (const g of GAMES) c[g.genre] = (c[g.genre] ?? 0) + 1;
    return c;
  }, []);

  const visible = GAMES.filter((g) => filter === "all" || g.genre === filter);

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
          <span className="dot" /> {t("eyebrow")}
        </span>
        <h1 className="title">{t("siteName")}</h1>
        <p className="subtitle">{t("subtitle")}</p>
      </header>

      <div className="controls">
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
          const n = String(GAMES.indexOf(g) + 1).padStart(2, "0");
          const title = g.title[lang];
          const best = g.boards
            ?.map((b) => ({ b, row: mine.find((m) => m.game_id === b.id) }))
            .find((x) => x.row);
          const chip = (
            <span className="genre-chip" style={{ color: a.c, background: a.bg }}>
              {t(`genre_${g.genre}`)}
            </span>
          );
          return (
            <Link
              key={g.id}
              href={g.online ? `/online/${g.id}` : `/play/${g.id}`}
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
                <span className="play-pill">{t("play")}</span>
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
                  <span className="play-pill">{t("play")}</span>
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
          {visible.length} / {GAMES.length} {t("gamesUnit")}
        </span>
      </footer>
    </div>
  );
}
