// 탐험 지도 자랑하기 — 공유 링크 주소에 담는 기록 (이름·지역·탐험률)
export interface ExploreShare {
  n: string; // 이름
  d: string; // 가장 많이 밝힌 시·군·구
  dp: number; // 그 시·군·구 탐험률 %
  s: number; // 서울 %
  i: number; // 인천 %
  g: number; // 경기에서 가장 많이 밝힌 시·군의 %
  gc: string; // 그 시·군 이름 (예: 수원시)
  c: number; // 밝힌 칸
  r: number; // 지하철역 수
  b: number; // 버스정류장 수
  v: number; // 가 본 시·군·구 수
  a: string; // 벌집 지도로 그릴 곳 (11 서울 · 23 인천 · 경기 시·군 코드)
  m: string; // 벌집 칸별 밝힌 정도 (decodeHoney)
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
    gc: txt(get("gc"), 12),
    c: Math.round(c),
    r: Math.round(num(get("r"), 1e5)),
    b: Math.round(num(get("b"), 1e6)),
    v: Math.round(num(get("v"), 1000)),
    a: /^\d{2,5}$/.test(get("a") ?? "") ? (get("a") as string) : "",
    m: /^[A-Za-z0-9_-]{1,4000}$/.test(get("m") ?? "") ? (get("m") as string) : "",
  };
}

export const fmtPct = (p: number) => (p >= 10 ? p.toFixed(1) : p >= 0.01 ? p.toFixed(2) : p > 0 ? "<0.01" : "0") + "%";

/** 서울·인천·경기 중 탐험률이 가장 높은 곳 — 표시 값이 같으면(예: 서울 50%·인천 50%) 함께 */
export function exploreLeaders(x: ExploreShare): { ko: string; en: string; p: number }[] {
  const all = [
    { ko: "서울", en: "Seoul", p: x.s },
    { ko: "인천", en: "Incheon", p: x.i },
    { ko: x.gc || "경기", en: "Gyeonggi", p: x.g },
  ].filter((r) => r.p > 0);
  if (!all.length) return [];
  const top = fmtPct(Math.max(...all.map((r) => r.p)));
  return all.filter((r) => fmtPct(r.p) === top);
}

export function exploreShareTitle(x: ExploreShare) {
  const who = x.n || "친구";
  const lead = exploreLeaders(x);
  if (!lead.length) return `${who}님은 ${x.c.toLocaleString("ko-KR")}칸을 밝혔어요`;
  if (lead.length === 1) return `${who}님은 ${lead[0].ko}의 ${fmtPct(lead[0].p)}를 밝혔어요`;
  const last = lead[lead.length - 1].ko;
  const code = last.charCodeAt(last.length - 1) - 0xac00;
  const josa = code >= 0 && code % 28 !== 0 ? "을" : "를"; // 받침 있으면 '을'
  return `${who}님은 ${lead.map((r) => r.ko).join("·")}${josa} 각각 ${fmtPct(lead[0].p)}씩 밝혔어요`;
}

export function exploreShareDesc(x: ExploreShare) {
  const best = x.d && x.d !== x.gc ? ` · 가장 많이 밝힌 동네 ${x.d} ${fmtPct(x.dp)}` : "";
  return `서울 ${fmtPct(x.s)} · 인천 ${fmtPct(x.i)} · ${x.gc || "경기"} ${fmtPct(x.g)}${best} — 지하철역 ${x.r}곳 · 정류장 ${x.b}곳 체크인. 나도 탐험 지도 시작하기!`;
}

export function exploreShareQuery(x: ExploreShare) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(x)) if (v !== "" && v !== 0) p.set(k, String(v));
  return p.toString();
}

/* 공유 카드 벌집 지도 — area(서울·인천·경기 시·군)의 H3 해상도 8 칸마다 밝힌 정도(1~3)를
   희소하게 인코딩: (이전 칸과의 순번 차이 × 4 + 단계)를 가변 길이 정수로 이어 붙여 base64url */
export function decodeHoney(m: string): Map<number, number> {
  const out = new Map<number, number>();
  let bytes: Uint8Array;
  try {
    const b64 = m.replace(/-/g, "+").replace(/_/g, "/");
    bytes = Uint8Array.from(atob(b64 + "===".slice((b64.length + 3) % 4)), (ch) => ch.charCodeAt(0));
  } catch {
    return out;
  }
  let idx = -1, v = 0, shift = 0;
  for (const b of bytes) {
    v |= (b & 0x7f) << shift;
    if (b & 0x80) {
      shift += 7;
      if (shift > 28) return out;
      continue;
    }
    const level = v & 3, delta = v >>> 2;
    idx += delta;
    if (level) out.set(idx, level);
    v = 0;
    shift = 0;
  }
  return out;
}
