"use client";

import { useCallback, useEffect, useState } from "react";
import { useApp } from "./AppProvider";
import { formatScore, kstDayKey, type Board } from "@/lib/games";
import { cloudEnabled, fetchLeaderboard, type ScoreRow } from "@/lib/supabase";

export function Leaderboard({ board, limit = 20, refreshKey = 0 }: { board: Board; limit?: number; refreshKey?: number }) {
  const { t, lang, user } = useApp();
  const [rows, setRows] = useState<ScoreRow[] | null>(null);
  const [err, setErr] = useState(false);

  const load = useCallback(() => {
    if (!cloudEnabled) {
      setRows([]);
      return;
    }
    // 오늘의 퍼즐은 오늘(한국 시간) 기록만
    fetchLeaderboard(board.id, limit, board.format === "daily" ? kstDayKey() * 1000000 : undefined)
      .then((r) => {
        setRows(r);
        setErr(false);
      })
      .catch(() => setErr(true));
  }, [board.id, board.format, limit]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (!cloudEnabled) return <p className="muted small">{t("serverMissing")}</p>;
  if (err) return <p className="muted small">{t("err_generic")}</p>;
  if (!rows) return <p className="muted small">…</p>;
  if (!rows.length) return <p className="muted small">{t("noRanking")}</p>;

  return (
    <ol className="lb">
      {rows.map((r, i) => (
        <li key={r.user_id} className={user?.id === r.user_id ? "me" : ""}>
          <span className="pos">{i + 1}</span>
          <span className="nm">{r.nickname}</span>
          <span className="sc">{formatScore(board, Number(r.best_score), lang)}</span>
        </li>
      ))}
    </ol>
  );
}
