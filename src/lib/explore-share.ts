// 탐험 지도 자랑하기 — 공유 링크 주소에 담는 기록 (이름·지역·탐험률)
export interface ExploreShare {
  n: string; // 이름
  d: string; // 가장 많이 밝힌 시·군·구
  dp: number; // 그 시·군·구 탐험률 %
  s: number; // 서울 %
  i: number; // 인천 %
  g: number; // 경기 %
  c: number; // 밝힌 칸
  r: number; // 지하철역 수
  b: number; // 버스정류장 수
  v: number; // 가 본 시·군·구 수
}

const txt = (v: string | null | undefined, max: number) => (v ?? "").replace(/[<>\n\r\t]/g, "").trim().slice(0, max);
const num = (v: string | null | undefined, max: number) => {
  const x = Number(v);
  return Number.isFinite(x) && x >= 0 ? Math.min(max, x) : 0;
};

export function parseExploreShare(get: (k: string) => string | null | undefined): ExploreShare | null {
  const c = num(get("c"), 1e8);
  if (!c) return null;
  return {
    n: txt(get("n"), 12),
    d: txt(get("d"), 12),
    dp: num(get("dp"), 100),
    s: num(get("s"), 100),
    i: num(get("i"), 100),
    g: num(get("g"), 100),
    c: Math.round(c),
    r: Math.round(num(get("r"), 1e5)),
    b: Math.round(num(get("b"), 1e6)),
    v: Math.round(num(get("v"), 1000)),
  };
}

export const fmtPct = (p: number) => (p >= 10 ? p.toFixed(1) : p >= 0.01 ? p.toFixed(2) : p > 0 ? "<0.01" : "0") + "%";

export function exploreShareTitle(x: ExploreShare) {
  const who = x.n || "친구";
  return x.d ? `${who}님은 ${x.d}의 ${fmtPct(x.dp)}를 밝혔어요` : `${who}님은 ${x.c.toLocaleString("ko-KR")}칸을 밝혔어요`;
}

export function exploreShareDesc(x: ExploreShare) {
  return `서울 ${fmtPct(x.s)} · 인천 ${fmtPct(x.i)} · 경기 ${fmtPct(x.g)} — 지하철역 ${x.r}곳 · 정류장 ${x.b}곳 체크인. 나도 탐험 지도 시작하기!`;
}

export function exploreShareQuery(x: ExploreShare) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(x)) if (v !== "" && v !== 0) p.set(k, String(v));
  return p.toString();
}
