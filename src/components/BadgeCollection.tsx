"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BOOKS, type AnyBook, type Badge } from "@/lib/badges";
import { loadSave } from "@/lib/saves";

type Lang = "ko" | "en";
type Row = { badge: Badge<unknown>; value: number; done: boolean };

const TIER: Record<string, { ko: string; en: string }> = {
  bronze: { ko: "브론즈", en: "Bronze" },
  silver: { ko: "실버", en: "Silver" },
  gold: { ko: "골드", en: "Gold" },
  diamond: { ko: "다이아", en: "Diamond" },
};

function useBookData(book: AnyBook) {
  const [state, setState] = useState<{ data: unknown; ready: boolean }>({ data: null, ready: false });
  useEffect(() => {
    let live = true;
    loadSave(book.gameId)
      .then((r) => live && setState({ data: r?.data ?? null, ready: true }))
      .catch(() => live && setState({ data: null, ready: true }));
    return () => { live = false; };
  }, [book.gameId]);
  return state;
}

export default function BadgeCollection({ lang }: { lang: Lang }) {
  const [bookId, setBookId] = useState(BOOKS[0].id);
  const book = BOOKS.find((b) => b.id === bookId) ?? BOOKS[0];
  return (
    <div className="panel" style={{ marginBottom: 20 }}>
      <div className="bd-head">
        <h2>{lang === "en" ? "Badge collection" : "뱃지 도감"}</h2>
      </div>
      {BOOKS.length > 1 && (
        <div className="bd-tabs">
          {BOOKS.map((b) => (
            <button key={b.id} className={`chip${b.id === book.id ? " on" : ""}`} onClick={() => setBookId(b.id)}>
              {b.icon} {b.title[lang]}
            </button>
          ))}
        </div>
      )}
      <Book key={book.id} book={book} lang={lang} />
    </div>
  );
}

function Book({ book, lang }: { book: AnyBook; lang: Lang }) {
  const { data, ready } = useBookData(book);
  const stats = useMemo(() => (data ? book.stats(data) : null), [book, data]);
  const rows: Row[] = useMemo(
    () => book.badges.map((badge) => { const value = stats ? badge.value(stats) : 0; return { badge, value, done: value >= badge.goal }; }),
    [book, stats],
  );
  const [pick, setPick] = useState<string | null>(null);
  const got = rows.filter((r) => r.done).length;
  const sel = rows.find((r) => r.badge.id === pick) ?? null;
  // 다음 목표: 가장 가까운(진행률 높은) 미획득 뱃지
  const next = rows.filter((r) => !r.done && r.badge.goal > 1).sort((a, b) => b.value / b.badge.goal - a.value / a.badge.goal)[0];

  return (
    <div>
      <div className="bd-sum">
        <Link href={book.href} className="bd-book">{book.icon} {book.title[lang]}</Link>
        <span className="bd-count"><b>{ready ? got : "–"}</b> / {rows.length}</span>
      </div>
      <div className="bd-bar"><i style={{ width: `${ready ? (got / rows.length) * 100 : 0}%` }} /></div>
      {ready && !stats && (
        <p className="muted small" style={{ margin: "10px 0 0" }}>
          {book.empty[lang]} <Link href={book.href}>{lang === "en" ? "Open →" : "바로 가기 →"}</Link>
        </p>
      )}
      {ready && next && stats && (
        <p className="muted small" style={{ margin: "10px 0 0" }}>
          {lang === "en" ? "Next: " : "다음 목표: "}
          <b style={{ color: "var(--text)" }}>{next.badge.icon} {next.badge.name[lang]}</b> — {fmt(next, lang)}
        </p>
      )}

      {book.groups.map((g) => {
        const list = rows.filter((r) => r.badge.group === g.id);
        if (!list.length) return null;
        return (
          <section key={g.id} className="bd-group">
            <h3>{g.name[lang]} <span>{list.filter((r) => r.done).length}/{list.length}</span></h3>
            <div className="bd-grid">
              {list.map((r) => (
                <button
                  key={r.badge.id}
                  className={`bd-item t-${r.badge.tier}${r.done ? " done" : ""}${pick === r.badge.id ? " sel" : ""}`}
                  onClick={() => setPick(pick === r.badge.id ? null : r.badge.id)}
                  aria-label={`${r.badge.name[lang]} — ${r.done ? (lang === "en" ? "earned" : "획득") : (lang === "en" ? "locked" : "미획득")}`}
                >
                  <span className="bd-medal">
                    <span className="bd-ico">{r.done ? r.badge.icon : "?"}</span>
                  </span>
                  <span className="bd-nm">{r.badge.name[lang]}</span>
                  {!r.done && r.badge.goal > 1 && <span className="bd-prog"><i style={{ width: `${Math.min(100, (r.value / r.badge.goal) * 100)}%` }} /></span>}
                </button>
              ))}
            </div>
            {sel && sel.badge.group === g.id && (
              <div className={`bd-detail t-${sel.badge.tier}${sel.done ? " done" : ""}`}>
                <span className="bd-medal sm"><span className="bd-ico">{sel.done ? sel.badge.icon : "?"}</span></span>
                <div>
                  <b>{sel.badge.name[lang]}</b> <em>{TIER[sel.badge.tier][lang]}</em>
                  <div className="muted small">{sel.badge.desc[lang]}</div>
                  <div className="small" style={{ marginTop: 4, color: sel.done ? "var(--green)" : "var(--text-dim)" }}>
                    {sel.done ? (lang === "en" ? "✓ Earned" : "✓ 획득 완료") : fmt(sel, lang)}
                  </div>
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function fmt(r: Row, lang: Lang) {
  const u = r.badge.unit?.[lang] ?? "";
  const sp = lang === "en" && u ? " " : "";
  if (r.badge.goal === 1 && !u) return lang === "en" ? "Not yet" : "아직이에요";
  const left = r.badge.goal - r.value;
  return lang === "en" ? `${r.value}${sp}${u} / ${r.badge.goal}${sp}${u} (${left} to go)` : `${r.value}${u} / ${r.badge.goal}${u} (${left}${u} 남음)`;
}
