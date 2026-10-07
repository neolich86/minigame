import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { getChallengeServer } from "@/lib/challenge";
import { boardById, formatVs, itemPath } from "@/lib/games";
import { serverLang } from "@/lib/serverLang";

// 도전장 페이지 — 친구가 링크로 들어와 기록을 보고 같은 게임에 도전한다
const load = cache(async (code: string) => {
  const c = await getChallengeServer(code);
  if (!c) return null;
  const found = boardById(c.game_id);
  return found ? { c, ...found } : null;
});

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const r = await load((await params).code);
  const { lang } = await serverLang();
  if (!r) return { title: lang === "ko" ? "도전장" : "Challenge", robots: { index: false, follow: true } };
  const rec = formatVs(r.board, r.c.score, lang);
  const title =
    lang === "ko"
      ? `⚔️ ${r.c.nickname}님이 ${r.game.title.ko} ${rec} 기록으로 도전장을 보냈어요`
      : `⚔️ ${r.c.nickname} challenges you: ${rec} in ${r.game.title.en}`;
  const q = r.board.vs?.question[lang];
  const description = lang === "ko" ? `${q ? q + " — " : ""}이 기록을 깰 수 있을까요? 지금 바로 도전해 보세요.` : `${q ? q + " — " : ""}Can you beat this record? Take the challenge now.`;
  const image = { url: `/api/challenge/og/${r.c.code}`, width: 1200, height: 630 };
  return {
    title: { absolute: title },
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: `/challenge/${r.c.code}` },
    openGraph: { title, description, images: [image], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

export default async function ChallengePage({ params }: { params: Promise<{ code: string }> }) {
  const r = await load((await params).code);
  const { lang } = await serverLang();
  const ko = lang === "ko";
  if (!r) {
    return (
      <main className="wrap mid challenge-page">
        <div className="challenge-card">
          <div className="challenge-icon">⚔️</div>
          <h1>{ko ? "도전장을 찾을 수 없어요" : "Challenge not found"}</h1>
          <p className="muted">{ko ? "링크가 잘못되었거나 만료된 도전장이에요." : "The link may be wrong or expired."}</p>
          <Link href="/" className="btn primary challenge-go">
            {ko ? "게임 보러 가기" : "Browse games"}
          </Link>
        </div>
      </main>
    );
  }
  const { c, game, board } = r;
  const rec = formatVs(board, c.score, lang);
  const vsLabel = board.vs?.label[lang] ?? (ko ? "기록" : "record");
  const question = board.vs?.question[lang];
  const multiBoard = (game.boards?.length ?? 0) > 1;
  return (
    <main className="wrap mid challenge-page">
      <div className="challenge-card">
        <div className="challenge-icon">⚔️</div>
        <p className="challenge-lead">
          {ko ? (
            <>
              <b>{c.nickname}</b>님이 당신에게 도전했습니다.
            </>
          ) : (
            <>
              <b>{c.nickname}</b> has challenged you.
            </>
          )}
        </p>
        <div className="challenge-game">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={game.thumb} alt={game.title[lang]} />
          <span>
            {game.title[lang]}
            {multiBoard ? ` · ${board.label[lang]}` : ""}
          </span>
        </div>
        <div className="challenge-vs">
          <div className="vs-row them">
            <span className="vs-who">{ko ? `${c.nickname}의 ${vsLabel}` : `${c.nickname}'s ${vsLabel}`}</span>
            <span className="vs-val">{rec}</span>
          </div>
          <div className="vs-mid">VS</div>
          <div className="vs-row me">
            <span className="vs-who">{ko ? "나" : "You"}</span>
            <span className="vs-val unknown">? ? ?</span>
          </div>
        </div>
        {c.pct != null && <div className="challenge-pct">🏆 {ko ? `${c.nickname}님은 TOP ${c.pct}%` : `${c.nickname} is TOP ${c.pct}%`}</div>}
        <p className="challenge-q">→ {question ?? (ko ? "이 기록을 깨보세요." : "Can you beat it?")}</p>
        <Link href={`${itemPath(game)}?challenge=${c.code}`} className="btn primary challenge-go">
          {ko ? "도전 시작" : "Start challenge"}
        </Link>
      </div>
    </main>
  );
}
