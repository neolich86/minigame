// 도전장 링크 미리보기 이미지 (카톡·DM 1200×630)
import { ImageResponse } from "next/og";
import type { Challenge } from "./challenge";
import { formatVs, type Board, type Game } from "./games";

async function loadFont(text: string) {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Black+Han+Sans&text=${encodeURIComponent(text)}`)).text();
    const m = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    if (!m) return null;
    const res = await fetch(m[1]);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export async function challengeImage(c: Challenge, game: Game, board: Board) {
  const rec = formatVs(board, c.score, "ko");
  const lines = {
    top: "CHALLENGE · 도전장",
    who: `${c.nickname}님이 당신에게 도전했습니다`,
    label: `${c.nickname}의 ${board.vs?.label.ko ?? "기록"}`,
    rec,
    pct: c.pct != null ? `TOP ${c.pct}%` : "",
    game: `${game.title.ko} · 미니게임천국`,
    cta: board.vs ? `${board.vs.question.ko}` : "이 기록을 깨보세요",
  };
  const font = await loadFont(Object.values(lines).join(""));
  if (!font) {
    // 한글 글꼴을 못 받으면 기본 글꼴(영문)로만 그린다 — 한글이 섞이면 렌더러가 실패한다
    const ascii = (x: string) => x.replace(/[^\x20-\x7E]/g, "").trim();
    const nick = ascii(c.nickname) || "Your friend";
    lines.top = "CHALLENGE";
    lines.who = `${nick} challenges you`;
    lines.label = `${nick}'s ${board.vs?.label.en ?? "record"}`;
    lines.rec = ascii(formatVs(board, c.score, "en"));
    lines.game = `${ascii(game.title.en)} - Mini Game Heaven`;
    lines.cta = board.vs ? board.vs.question.en : "Can you beat it?";
  }
  const fonts = font ? [{ name: "BHS", data: font, weight: 400 as const, style: "normal" as const }] : undefined;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #1a1030 0%, #0e1420 55%, #2a1408 100%)",
          color: "#fff",
          ...(font ? { fontFamily: "BHS" } : {}),
        }}
      >
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 8, color: "#ffb84d" }}>{lines.top}</div>
        <div style={{ display: "flex", fontSize: 40, marginTop: 22, color: "#e8ecf4" }}>{lines.who}</div>
        <div style={{ display: "flex", width: 760, height: 2, background: "rgba(255,184,77,.35)", marginTop: 28 }} />
        <div style={{ display: "flex", fontSize: 30, marginTop: 26, color: "#9aa3b5" }}>{lines.label}</div>
        <div style={{ display: "flex", fontSize: 150, lineHeight: 1.05, color: "#ffd98a" }}>{lines.rec}</div>
        {lines.pct ? <div style={{ display: "flex", fontSize: 36, color: "#ffb84d", marginTop: 4 }}>{lines.pct}</div> : null}
        <div style={{ display: "flex", width: 760, height: 2, background: "rgba(255,184,77,.35)", marginTop: 26 }} />
        <div style={{ display: "flex", fontSize: 34, marginTop: 24, color: "#fff" }}>{lines.cta}</div>
        <div style={{ display: "flex", fontSize: 24, marginTop: 10, color: "#8b95a8" }}>{lines.game}</div>
      </div>
    ),
    { width: 1200, height: 630, fonts },
  );
}
