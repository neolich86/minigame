"use client";

import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import { Leaderboard } from "@/components/Leaderboard";
import { ALL_BOARDS } from "@/lib/games";

export default function RankingPage() {
  const { t, lang } = useApp();
  return (
    <div className="wrap">
      <h1 className="page-title">🏆 {t("rankingTitle")}</h1>
      <p className="page-sub">{t("rankingSub")}</p>
      <div className="rank-grid">
        {ALL_BOARDS.map(({ game, board }) => (
          <section key={board.id} id={board.id} className="panel rank-card">
            <h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={game.thumb} alt="" />
              <span>
                {game.title[lang]}
                {(game.boards?.length ?? 0) > 1 ? ` · ${board.label[lang]}` : ""}
              </span>
            </h2>
            <div className="sub">
              {board.label[lang]} ·{" "}
              <Link href={`/play/${game.id}`} className="linkbtn">
                {t("play")}
              </Link>
            </div>
            <Leaderboard board={board} limit={10} />
          </section>
        ))}
      </div>
    </div>
  );
}
