"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "./AppProvider";
import { Leaderboard } from "./Leaderboard";
import { useToasts } from "./Toasts";
import { formatScore, gameById } from "@/lib/games";
import { cloudEnabled, fetchMyRank, fetchMyScores, submitScore, type ScoreRow } from "@/lib/supabase";
import { errorKey } from "@/lib/i18n";

const PENDING_KEY = "mgh:pending-scores";

interface Pending {
  board: string;
  score: number;
  meta: unknown;
  at: number;
}

function readPending(): Pending[] {
  try {
    const v = JSON.parse(localStorage.getItem(PENDING_KEY) || "[]");
    return Array.isArray(v) ? v.filter((p) => Date.now() - p.at < 1000 * 60 * 60 * 6) : [];
  } catch {
    return [];
  }
}
function writePending(p: Pending[]) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(p.slice(-10)));
  } catch {}
}

export function GamePlayer({ gameId }: { gameId: string }) {
  const game = gameById(gameId)!;
  const { t, lang, user, loading } = useApp();
  const frame = useRef<HTMLIFrameElement>(null);
  const [tab, setTab] = useState(game.boards?.[0]?.id ?? "");
  const [refresh, setRefresh] = useState(0);
  const [sideOpen, setSideOpen] = useState(false);
  const [mine, setMine] = useState<ScoreRow[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const { push, view: toasts } = useToasts();
  const warnedLogin = useRef(false);
  const board = game.boards?.find((b) => b.id === tab);
  // iframe 주소는 처음 언어로 고정 — 언어 변경은 postMessage로 전달되어 게임이 스스로 다시 로드한다
  const [frameLang] = useState(lang);

  const reloadMine = useCallback(() => {
    if (!user || !game.boards) return;
    fetchMyScores(user.id).then(setMine).catch(() => {});
  }, [user, game.boards]);

  useEffect(reloadMine, [reloadMine, refresh]);
  useEffect(() => {
    if (!user || !tab) {
      setMyRank(null);
      return;
    }
    fetchMyRank(tab).then(setMyRank).catch(() => setMyRank(null));
  }, [user, tab, refresh]);

  const send = useCallback(
    async (boardId: string, score: number, meta: unknown) => {
      try {
        const r = await submitScore(boardId, score, meta);
        if (r?.improved) {
          push(`🏆 ${t("newRecord")} · #${r.rank}`);
          setTab(boardId);
        }
        setRefresh((x) => x + 1);
      } catch (e) {
        push(t(errorKey(e)), true);
      }
    },
    [push, t],
  );

  // 게임(iframe) → 포털 메시지
  useEffect(() => {
    function onMsg(ev: MessageEvent) {
      if (ev.origin !== window.location.origin || ev.source !== frame.current?.contentWindow) return;
      const d = ev.data;
      if (!d || d.mgh !== 1) return;
      if (d.type === "score" && game.boards?.some((b) => b.id === d.board) && Number.isFinite(d.score)) {
        if (!cloudEnabled) return;
        if (user) {
          send(d.board, d.score, d.meta);
        } else if (!loading) {
          // 비로그인 상태의 기록은 보관해 뒀다가 로그인 후 자동 등록
          const list = readPending().filter((p) => !(p.board === d.board && p.score >= d.score));
          const prevBest = list.find((p) => p.board === d.board);
          if (!prevBest || prevBest.score < d.score) {
            writePending([...list.filter((p) => p.board !== d.board), { board: d.board, score: d.score, meta: d.meta, at: Date.now() }]);
          }
          if (!warnedLogin.current) {
            warnedLogin.current = true;
            push(t("loginToRank"));
          }
        }
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [game.boards, user, loading, send, push, t]);

  // 로그인 후 보관된 기록 등록
  useEffect(() => {
    if (!user || !game.boards) return;
    const list = readPending();
    const mineNow = list.filter((p) => game.boards!.some((b) => b.id === p.board));
    if (!mineNow.length) return;
    writePending(list.filter((p) => !mineNow.includes(p)));
    mineNow.forEach((p) => send(p.board, p.score, p.meta));
  }, [user, game.boards, send]);

  const myRow = mine.find((m) => m.game_id === tab);
  const loginHref = `/login?next=${encodeURIComponent(`/play/${game.id}`)}`;

  return (
    <div className="play-shell">
      <div className="play-main">
        <div className="play-bar">
          <Link className="back" href="/">
            {t("back")}
          </Link>
          <span className="title">{game.title[lang]}</span>
          {game.online && (
            <Link className="btn sm teal" href={`/online/${game.id}`}>
              {t("onlinePlay")}
            </Link>
          )}
          {game.boards && (
            <button className="btn sm side-toggle-mobile" onClick={() => setSideOpen((v) => !v)}>
              🏆 {sideOpen ? t("hideRanking") : t("showRanking")}
            </button>
          )}
        </div>
        <iframe
          ref={frame}
          data-mgh-game={game.id}
          className="game-frame"
          src={`${game.src}?lang=${frameLang}`}
          title={game.title[lang]}
          allow="autoplay; fullscreen; clipboard-write"
          allowFullScreen
        />
      </div>

      {game.boards && board && (
        <aside className={`side${sideOpen ? " open" : ""}`}>
          <div className="side-inner">
            <h3>
              <span>🏆 {t("rankingTitle")}</span>
              <Link href={`/ranking#${board.id}`} className="linkbtn small">
                {t("fullRanking")}
              </Link>
            </h3>
            {game.boards.length > 1 && (
              <div className="tabs">
                {game.boards.map((b) => (
                  <button key={b.id} className={`tab${b.id === tab ? " on" : ""}`} onClick={() => setTab(b.id)}>
                    {b.label[lang]}
                  </button>
                ))}
              </div>
            )}
            {cloudEnabled &&
              (user ? (
                <div className="mybox">
                  <div>
                    {t("myBest")}
                    <b>{myRow ? formatScore(board, Number(myRow.best_score), lang) : "-"}</b>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {t("myRank")}
                    <b>{myRank ? `#${myRank}` : "-"}</b>
                  </div>
                </div>
              ) : (
                !loading && (
                  <Link href={loginHref} className="btn primary block" style={{ marginBottom: 14 }}>
                    {t("loginToRank")}
                  </Link>
                )
              ))}
            <Leaderboard board={board} refreshKey={refresh} />
          </div>
        </aside>
      )}
      {toasts}
    </div>
  );
}
