// 스포츠 승부 예측 — 내 예측 카드 공유 이미지 (카톡·SNS 미리보기 1200×630)
// GET /api/forecast/picks-og?p=<픽>&n=<이름>&lang=ko|en
import { ImageResponse } from "next/og";
import { matchesByIds } from "@/lib/forecast/read";
import { cleanName, decodePicks, outcomeOf, type Pick } from "@/lib/forecast/picks";
import { badgeColors, teamName, teamTla } from "@/lib/forecast/teams";

const BG = "#0e1420";
const PANEL = "#161f30";
const LINE = "#2a3550";
const TEXT = "#eef1f7";
const DIM = "#8a93ac";
const PICK_BG: Record<Pick, string> = { H: "#4ddbc7", D: "#c3c9d6", A: "#b48cff" };
const LABEL = { ko: { H: "홈승", D: "무", A: "원정승" }, en: { H: "Home", D: "Draw", A: "Away" } };

async function loadFont(text: string, weight: number) {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@${weight}&text=${encodeURIComponent(text)}`)
    ).text();
    const m = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    if (!m) return null;
    const res = await fetch(m[1]);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const lang = q.get("lang") === "en" ? "en" : "ko";
  const picks = decodePicks(q.get("p"));
  const name = cleanName(q.get("n"));
  const matches = (await matchesByIds(Object.keys(picks).map(Number)).catch(() => [])).filter((m) => picks[m.id]);
  const shown = matches.slice(0, 5);
  const more = matches.length - shown.length;

  let done = 0, hit = 0;
  for (const m of matches) {
    const o = m.status === "FINISHED" ? outcomeOf(m.home_score_90, m.away_score_90) : null;
    if (!o) continue;
    done++;
    if (o === picks[m.id]) hit++;
  }
  const who = name || (lang === "ko" ? "친구" : "A friend");
  const title = lang === "ko" ? `${who}의 승부 예측` : `${who}'s picks`;
  const sub =
    done > 0
      ? lang === "ko" ? `${done}경기 중 ${hit}경기 적중` : `${hit} of ${done} correct`
      : lang === "ko" ? `${matches.length}경기 · 누가 더 많이 맞힐까?` : `${matches.length} matches · who'll get more right?`;
  const rows = shown.map((m) => {
    const o = m.status === "FINISHED" ? outcomeOf(m.home_score_90, m.away_score_90) : null;
    return {
      id: m.id,
      h: m.home ? teamName(m.home, lang) : "TBD",
      a: m.away ? teamName(m.away, lang) : "TBD",
      hb: m.home ? { t: teamTla(m.home), ...badgeColors(m.home) } : null,
      ab: m.away ? { t: teamTla(m.away), ...badgeColors(m.away) } : null,
      pick: picks[m.id],
      res: o ? (o === picks[m.id] ? "✓" : "✗") : null,
      score: o ? `${m.home_score_90}-${m.away_score_90}` : "vs",
    };
  });
  const brand = lang === "ko" ? "스포츠 승부 예측" : "Sports Forecast";
  const more_ = more > 0 ? (lang === "ko" ? `외 ${more}경기` : `+${more} more`) : "";
  const allText = [title, sub, brand, more_, ...rows.flatMap((r) => [r.h, r.a, LABEL[lang][r.pick], r.score]), "✓✗vs0123456789-+ABCDEFGHIJKLMNOPQRSTUVWXYZ"].join("");
  const [bold, reg] = await Promise.all([loadFont(allText, 800), loadFont(allText, 500)]);
  const fonts = [
    ...(bold ? [{ name: "NotoKR", data: bold, weight: 800 as const, style: "normal" as const }] : []),
    ...(reg ? [{ name: "NotoKR", data: reg, weight: 500 as const, style: "normal" as const }] : []),
  ];

  const Badge = ({ b }: { b: { t: string; bg: string; fg: string; ring: string } | null }) => (
    <div
      style={{
        width: 46, height: 46, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
        background: b?.bg ?? PANEL, color: b?.fg ?? DIM, border: `4px solid ${b?.ring.startsWith("#") ? b.ring : LINE}`,
        fontSize: 15, fontWeight: 800, flexShrink: 0,
      }}
    >
      {b?.t ?? "?"}
    </div>
  );

  const img = new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", flexDirection: "column", background: BG, color: TEXT, fontFamily: "NotoKR", padding: "44px 56px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 50, fontWeight: 800 }}>🎯 {title}</div>
          <div style={{ display: "flex", fontSize: 24, color: "#4ddbc7", fontWeight: 800 }}>{brand}</div>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: DIM, marginTop: 6, marginBottom: 22, fontWeight: 500 }}>{sub}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rows.map((r) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 14, background: PANEL, border: `2px solid ${LINE}`, borderRadius: 16, padding: "10px 18px", height: 74 }}>
              <Badge b={r.hb} />
              <div style={{ display: "flex", fontSize: 28, fontWeight: 800, width: 260, overflow: "hidden" }}>{r.h}</div>
              <div style={{ display: "flex", fontSize: 24, color: DIM, width: 70, justifyContent: "center", fontWeight: 500 }}>{r.score}</div>
              <div style={{ display: "flex", fontSize: 28, fontWeight: 800, width: 260, overflow: "hidden", justifyContent: "flex-end" }}>{r.a}</div>
              <Badge b={r.ab} />
              <div style={{ display: "flex", flex: 1 }} />
              <div style={{ display: "flex", background: PICK_BG[r.pick], color: "#0b1220", fontSize: 26, fontWeight: 800, padding: "8px 18px", borderRadius: 12 }}>
                {LABEL[lang][r.pick]}
              </div>
              {r.res && <div style={{ display: "flex", fontSize: 32, fontWeight: 800, width: 34, color: r.res === "✓" ? "#6ee7b7" : "#ff7a8a" }}>{r.res}</div>}
            </div>
          ))}
        </div>
        {more_ && <div style={{ display: "flex", fontSize: 22, color: DIM, marginTop: 12, fontWeight: 500 }}>{more_}</div>}
      </div>
    ),
    { width: 1200, height: 630, fonts: fonts.length ? fonts : undefined },
  );
  img.headers.set("cache-control", "public, max-age=300, s-maxage=1800");
  return img;
}
