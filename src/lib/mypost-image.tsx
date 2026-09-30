// 공유 이미지 (카톡·DM 미리보기 1200×630, 인스타 스토리 1080×1920) 공통 요소
import { ImageResponse } from "next/og";
import sharp from "sharp";
import type { MyPostData } from "./mypost";
import { MONTH_EN, summarize } from "./mypost-summary";

const INK = "#101217";
const BLUE = "#9BA9FF";
const YELLOW = "#FFD43B";
const MUTED = "#8D93A5";
const fmt = (n: number) => n.toLocaleString("en-US");

// 이미지에 들어가는 글자만 담은 구글 폰트 서브셋 (ttf) — 실패하면 기본 글꼴로 그린다
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

// 저장된 사진은 WebP 인데 이미지 렌더러(satori)는 WebP 를 못 그린다 → JPEG data URI 로 바꿔서 넘긴다
async function toJpegDataUri(url: string | undefined, size: number) {
  if (!url) return undefined;
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const buf = await sharp(Buffer.from(await res.arrayBuffer())).resize(size, size, { fit: "cover" }).jpeg({ quality: 82 }).toBuffer();
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    return undefined;
  }
}

function Tile({ src, size }: { src?: string; size: number }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} width={size} height={size} style={{ borderRadius: 6, objectFit: "cover" }} alt="" />
  ) : (
    <div style={{ width: size, height: size, borderRadius: 6, background: "linear-gradient(135deg,#3A4157,#1C2030)" }} />
  );
}

function Grid({ best, size, gap }: { best: { img?: string }[]; size: number; gap: number }) {
  const cells = Array.from({ length: 9 }, (_, i) => best[i]);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", width: size * 3 + gap * 2, gap }}>
      {cells.map((p, i) => (
        <Tile key={i} src={p?.img} size={size} />
      ))}
    </div>
  );
}

function Stat({ label, value, w, big }: { label: string; value: string; w: number; big: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: w, background: "#1C2030", borderRadius: 16, padding: "18px 20px" }}>
      <div style={{ fontSize: big * 0.36, color: MUTED, letterSpacing: 2 }}>{label}</div>
      <div style={{ fontSize: big, color: "#fff" }}>{value}</div>
    </div>
  );
}

export async function reportImage(d: MyPostData, slug: string, kind: "og" | "story") {
  const s = summarize(d);
  const period = `${d.year}.01 – ${String(s.lastMonth + 1).padStart(2, "0")}`;
  const top = MONTH_EN[s.topMonth].slice(0, 3).toUpperCase();
  // 스토리를 본 친구가 직접 입력해 들어올 주소 — 샘플·로그인 버튼이 있는 시작 페이지
  const link = "https://minigame-on.vercel.app/play/my-post-2026";
  void slug;
  const texts = ["MY POST", String(d.year), `@${d.u}`, period, s.title, "BEST", "TOTAL LIKES", "POSTS", "TOP MONTH", top, fmt(s.best[0]?.l ?? 0), fmt(s.total), String(s.posts), "나도 만들기 →", link, "올해의 타이틀", "BEST 9"].join("");
  const tile = kind === "og" ? 172 : 328;
  const [font, imgs] = await Promise.all([loadFont(texts), Promise.all(s.best.map((p) => toJpegDataUri(p.img, tile)))]);
  const best = imgs.map((img) => ({ img }));
  const fonts = font ? [{ name: "BHS", data: font, weight: 400 as const, style: "normal" as const }] : undefined;
  const ff = font ? { fontFamily: "BHS" } : {};
  // 한글 글꼴을 못 불러오면 한글 글자(타이틀)는 빼고 그린다 (네모 깨짐 방지)
  const ko = !!font;

  if (kind === "og") {
    return new ImageResponse(
      (
        <div style={{ display: "flex", width: "100%", height: "100%", background: INK, padding: 48, gap: 48, ...ff }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", fontSize: 64, color: "#fff", lineHeight: 1 }}>
                MY POST&nbsp;<span style={{ color: BLUE }}>{d.year}</span>
              </div>
              <div style={{ fontSize: 30, color: "#C9CEDA" }}>{`@${d.u} · ${period}`}</div>
              {ko && (
                <div style={{ display: "flex", alignSelf: "flex-start", background: YELLOW, color: "#1B1600", fontSize: 34, padding: "8px 18px", borderRadius: 8, marginTop: 10, transform: "rotate(-2deg)" }}>
                  {s.title}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Stat label="BEST" value={fmt(s.best[0]?.l ?? 0)} w={180} big={40} />
              <Stat label="TOTAL LIKES" value={fmt(s.total)} w={200} big={40} />
              <Stat label="POSTS" value={String(s.posts)} w={140} big={40} />
            </div>
          </div>
          <Grid best={best} size={172} gap={8} />
        </div>
      ),
      { width: 1200, height: 630, fonts },
    );
  }

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", height: "100%", background: INK, padding: "80px 40px", gap: 30, ...ff }}>
        <div style={{ display: "flex", fontSize: 96, color: "#fff", lineHeight: 1 }}>
          MY POST&nbsp;<span style={{ color: BLUE }}>{d.year}</span>
        </div>
        <div style={{ fontSize: 40, color: "#C9CEDA" }}>{`@${d.u} · ${period}`}</div>
        {ko && (
          <div style={{ display: "flex", alignSelf: "flex-start", background: YELLOW, color: "#1B1600", fontSize: 48, padding: "10px 24px", borderRadius: 10, transform: "rotate(-2deg)" }}>
            {s.title}
          </div>
        )}
        <Grid best={best} size={328} gap={8} />
        <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
          <Stat label="BEST" value={fmt(s.best[0]?.l ?? 0)} w={322} big={60} />
          <Stat label="TOTAL LIKES" value={fmt(s.total)} w={322} big={60} />
          <Stat label="TOP MONTH" value={top} w={322} big={60} />
        </div>
        <div style={{ display: "flex", justifyContent: "center", fontSize: 28, color: MUTED, marginTop: 30 }}>{ko ? `나도 만들기 → ${link}` : `MAKE YOURS → ${link}`}</div>
      </div>
    ),
    { width: 1080, height: 1920, fonts },
  );
}
