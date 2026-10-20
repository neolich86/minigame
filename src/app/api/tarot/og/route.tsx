// 타로 운세 결과 미리보기 이미지 (카톡·SNS 1200×630)
// GET /api/tarot/og?c=love&s=three&d=06r.02.10&n=민지(&y=2026)
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { loadFont } from "@/lib/challenge-image";
import { TAROT_NAMES, parseTarotShare, tarotCatName } from "@/lib/tarot-share";

const BG = "#0d0b1e";
const GOLD = "#e6c47a";
const INK = "#f4efe4";
const DIM = "#a8a2c6";

// 카드 그림(webp)을 렌더러가 읽을 수 있는 jpeg data URI 로 — 역방향이면 180° 돌린다
async function cardImage(origin: string, n: number, rev: boolean, w: number) {
  try {
    const res = await fetch(`${origin}/games/tarot/cards/600/maj${String(n).padStart(2, "0")}.webp`);
    if (!res.ok) return null;
    let img = sharp(Buffer.from(await res.arrayBuffer())).resize(w, Math.round(w * 1.72));
    if (rev) img = img.rotate(180);
    const buf = await img.jpeg({ quality: 84 }).toBuffer();
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const x = parseTarotShare((k) => url.searchParams.get(k));
  if (!x) return new Response("bad request", { status: 400 });
  const one = x.cards.length === 1;
  const cw = one ? 250 : 200;
  const imgs = await Promise.all(x.cards.map((k) => cardImage(url.origin, k.n, k.rev, cw)));

  const pos = x.c === "year"
    ? (one ? ["올해의 카드"] : ["상반기", "하반기", "한 해의 조언"])
    : (one ? ["핵심 카드"] : ["과거", "현재", "미래"]);
  const lines = {
    top: "TAROT READING · 타로 운세",
    who: `${x.name || "친구"}님의`,
    cat: `${tarotCatName(x, "ko")} 타로`,
    cta: "나도 카드 뽑아 보기 →",
    brand: "playwithme.kr",
  };
  const names = x.cards.map((k) => `${TAROT_NAMES[k.n][0]}${k.rev ? " (역)" : ""}`);
  const font = await loadFont(Object.values(lines).join("") + names.join("") + pos.join("") + "()·→");
  const fonts = font ? [{ name: "BHS", data: font, weight: 400 as const, style: "normal" as const }] : undefined;
  if (!font) {
    // 한글 글꼴을 못 받으면 영어로만 그린다 (한글이 섞이면 렌더러가 실패)
    lines.top = "TAROT READING";
    lines.who = x.name && /^[\x20-\x7E]+$/.test(x.name) ? `${x.name}'s` : "A friend's";
    lines.cat = `${tarotCatName(x, "en")} reading`;
    lines.cta = "Draw your own cards →";
    names.splice(0, names.length, ...x.cards.map((k) => `${TAROT_NAMES[k.n][1]}${k.rev ? " (rev.)" : ""}`));
    pos.splice(0, pos.length, ...(x.c === "year" ? (one ? ["Card of the year"] : ["1st half", "2nd half", "Advice"]) : one ? ["Your card"] : ["Past", "Present", "Future"]));
  }
  const ff = font ? { fontFamily: "BHS" } : {};

  const stars = [[80, 90, 3], [190, 520, 2], [560, 60, 2], [1120, 110, 3], [1040, 560, 2], [640, 590, 2], [330, 40, 2], [900, 40, 2]];

  const img = new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", background: `radial-gradient(ellipse at 70% 40%, #2d2470 0%, ${BG} 65%)`, color: INK, position: "relative", ...ff }}>
        {stars.map(([l, t, r], i) => (
          <div key={i} style={{ position: "absolute", left: l, top: t, width: r, height: r, borderRadius: r, background: "#fff", opacity: 0.7 }} />
        ))}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 0 0 64px", width: one ? 640 : 470 }}>
          <div style={{ display: "flex", fontSize: 24, color: GOLD, letterSpacing: 2 }}>{lines.top}</div>
          <div style={{ display: "flex", fontSize: 44, marginTop: 26, color: DIM }}>{lines.who}</div>
          <div style={{ display: "flex", fontSize: one ? 76 : 64, marginTop: 6, lineHeight: 1.1 }}>{lines.cat}</div>
          <div style={{ display: "flex", marginTop: 40, background: GOLD, color: "#1a1433", fontSize: 30, padding: "14px 26px", borderRadius: 16, alignSelf: "flex-start" }}>{lines.cta}</div>
          <div style={{ display: "flex", fontSize: 22, color: DIM, marginTop: 28 }}>{lines.brand}</div>
        </div>
        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", gap: 22, paddingRight: 40 }}>
          {x.cards.map((k, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", fontSize: 22, color: DIM }}>{pos[i]}</div>
              {imgs[i] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgs[i]!} width={cw} height={Math.round(cw * 1.72)} style={{ borderRadius: 14, border: `3px solid ${GOLD}` }} alt="" />
              ) : (
                <div style={{ display: "flex", width: cw, height: Math.round(cw * 1.72), borderRadius: 14, background: "#221a55", border: `3px solid ${GOLD}` }} />
              )}
              <div style={{ display: "flex", fontSize: 26, color: k.rev ? "#c6bfff" : GOLD }}>{names[i]}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts },
  );
  img.headers.set("cache-control", "public, max-age=86400, s-maxage=604800, immutable");
  return img;
}
