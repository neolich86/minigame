// 탐험 지도 자랑하기 카드 이미지 (카톡·링크 미리보기 1200×630)
import { ImageResponse } from "next/og";
import { loadFont } from "@/lib/challenge-image";
import { exploreLeaders, fmtPct, parseExploreShare } from "@/lib/explore-share";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const x = parseExploreShare((k) => sp.get(k));
  if (!x) return new Response("bad request", { status: 400 });
  const who = x.n || "친구";
  // 큰 숫자 = 서울·인천·경기 중 가장 높은 탐험률 (같으면 나란히)
  const lead = exploreLeaders(x);
  const lines = {
    top: "EXPLORE MAP · 탐험 지도",
    who: `${who}님의 탐험 기록`,
    place: lead.length ? `${lead.map((r) => r.ko).join(" · ")} 탐험률` : "밝힌 칸",
    big: lead.length ? fmtPct(lead[0].p) : x.c.toLocaleString("ko-KR"),
    // 큰 숫자와 같은 곳이면(예: 경기 수원시) 다시 쓰지 않는다
    best: x.d && !lead.some((r) => r.ko === x.d) ? `가장 많이 밝힌 동네 · ${x.d} ${fmtPct(x.dp)}` : "",
    stats: `${x.c.toLocaleString("ko-KR")}칸 · 지하철역 ${x.r}곳 · 정류장 ${x.b}곳 · ${x.v}개 시·군·구`,
    brand: "playwithme.kr · 나도 탐험하기",
  };
  const regions: [string, string, number][] = [
    ["서울", "Seoul", x.s],
    ["인천", "Incheon", x.i],
    [x.gc || "경기", x.gc ? "Gyeonggi city" : "Gyeonggi", x.g],
  ];
  const statsEn = `${x.c.toLocaleString("en-US")} cells · ${x.r} stations · ${x.b} bus stops · ${x.v} districts`;
  const font = await loadFont(Object.values(lines).join("") + "서울인천경기0123456789.%<");
  const ff = font ? { fontFamily: "BHS" } : {};
  const fonts = font ? [{ name: "BHS", data: font, weight: 400 as const, style: "normal" as const }] : undefined;
  const ascii = (s: string) => (font ? s : s.replace(/[^\x20-\x7E]/g, "").trim());
  // 배경 육각형 무늬 (안개 속 일부만 밝혀진 느낌)
  const hexes: { x: number; y: number; on: boolean }[] = [];
  for (let row = 0; row < 9; row++)
    for (let col = 0; col < 9; col++) {
      const hx = 760 + col * 52 + (row % 2) * 26;
      const hy = 20 + row * 45;
      const d = Math.hypot(hx - 960, hy - 230);
      const wobble = ((row * 7 + col * 13) % 5) * 9;
      hexes.push({ x: hx, y: hy, on: d < 50 + wobble + Math.min(1, (lead[0]?.p ?? 0) / 25) * 130 });
    }
  const img = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "linear-gradient(150deg,#101a30 0%,#0b1222 60%,#1c1a0e 100%)", color: "#fff", ...ff }}>
        {hexes.map((h, k) => (
          <div
            key={k}
            style={{
              position: "absolute",
              left: h.x,
              top: h.y,
              width: 48,
              height: 48,
              borderRadius: 12,
              transform: "rotate(30deg)",
              background: h.on ? "rgba(242,193,78,0.85)" : "rgba(255,255,255,0.05)",
              display: "flex",
            }}
          />
        ))}
        <div style={{ display: "flex", flexDirection: "column", padding: "50px 64px 40px", width: 760, height: "100%" }}>
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 6, color: "#f2c14e" }}>{ascii(lines.top) || "EXPLORE MAP"}</div>
          <div style={{ display: "flex", fontSize: 40, marginTop: 26, color: "#e8ecf4" }}>{ascii(lines.who) || "My exploration"}</div>
          {lead.length > 1 ? (
            <div style={{ display: "flex", marginTop: 26 }}>
              {lead.map((r) => (
                <div key={r.ko} style={{ display: "flex", flexDirection: "column", marginRight: 48 }}>
                  <div style={{ display: "flex", fontSize: 30, color: "#9aa7c2" }}>{font ? r.ko : r.en}</div>
                  <div style={{ display: "flex", fontSize: lead.length > 2 ? 72 : 100, lineHeight: 1, color: "#ffd98a", marginTop: 6 }}>{fmtPct(r.p)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 30, marginTop: 26, color: "#9aa7c2" }}>{font ? lines.place : lead.length ? `${lead[0].en} explored` : "Cells revealed"}</div>
              <div style={{ display: "flex", fontSize: 130, lineHeight: 1, color: "#ffd98a", marginTop: 6 }}>{lines.big}</div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", marginTop: 26, width: 600 }}>
            {regions.map(([name, en, p]) => (
              <div key={name} style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
                <div style={{ display: "flex", width: 130, fontSize: 26, color: "#cfd8ea" }}>{font ? name : en}</div>
                <div style={{ display: "flex", flex: 1, height: 16, borderRadius: 8, background: "rgba(255,255,255,0.1)" }}>
                  <div style={{ display: "flex", width: `${Math.max(p > 0 ? 2 : 0, Math.min(100, p))}%`, height: 16, borderRadius: 8, background: "#4fd1c5" }} />
                </div>
                <div style={{ display: "flex", width: 120, justifyContent: "flex-end", fontSize: 26, color: "#f2c14e" }}>{fmtPct(p)}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flex: 1 }} />
          {lines.best ? <div style={{ display: "flex", fontSize: 25, color: "#f2c14e", marginBottom: 6 }}>{font ? lines.best : `Top district ${fmtPct(x.dp)}`}</div> : null}
          <div style={{ display: "flex", fontSize: 25, color: "#cfd8ea" }}>{font ? lines.stats : statsEn}</div>
          <div style={{ display: "flex", fontSize: 23, marginTop: 6, color: "#8b95a8" }}>{ascii(lines.brand) || "playwithme.kr"}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts },
  );
  img.headers.set("cache-control", "public, max-age=86400, s-maxage=2592000, immutable");
  return img;
}
