// 스포츠 승부 예측 — 내 승부 예측(픽) 인코딩·저장 (브라우저·서버 공용)
// 공유 링크: /apps/sports-forecast/picks?p=<픽>&n=<이름>
//   픽 = 경기id(36진수) + H|D|A, "-" 로 이어 붙임. 예) "2x9kH-2x9klD"
// 서버에 저장하지 않는다 — 링크 자체에 픽이 들어 있어 로그인·DB 없이 공유된다.

export type Pick = "H" | "D" | "A";
export const MAX_PICKS = 20;
export const PICKS_PATH = "/apps/sports-forecast/picks";

export function encodePicks(picks: Record<number, Pick>): string {
  return Object.entries(picks)
    .map(([id, p]) => [Number(id), p] as const)
    .filter(([id, p]) => Number.isInteger(id) && id > 0 && (p === "H" || p === "D" || p === "A"))
    .sort((a, b) => a[0] - b[0])
    .slice(0, MAX_PICKS)
    .map(([id, p]) => `${id.toString(36)}${p}`)
    .join("-");
}

export function decodePicks(s: string | null | undefined): Record<number, Pick> {
  const out: Record<number, Pick> = {};
  for (const part of String(s ?? "").split(/[-.,]/).slice(0, MAX_PICKS)) {
    const m = /^([0-9a-z]{1,10})([HDA])$/i.exec(part.trim());
    if (!m) continue;
    const id = parseInt(m[1].toLowerCase(), 36);
    if (Number.isInteger(id) && id > 0) out[id] = m[2].toUpperCase() as Pick;
  }
  return out;
}

/** 공유 이름: 12자, 줄바꿈·제어문자 제거 */
export const cleanName = (s: string | null | undefined) =>
  String(s ?? "")
    .replace(/[\u0000-\u001f<>]/g, "")
    .trim()
    .slice(0, 12);

export function picksUrl(picks: Record<number, Pick>, name?: string): string {
  const q = new URLSearchParams({ p: encodePicks(picks) });
  const n = cleanName(name);
  if (n) q.set("n", n);
  return `${PICKS_PATH}?${q}`;
}

/** 경기 결과(90분) → H/D/A */
export function outcomeOf(h: number | null, a: number | null): Pick | null {
  if (h == null || a == null) return null;
  return h > a ? "H" : h === a ? "D" : "A";
}

/** 모델이 가장 높게 본 결과 */
export function modelPick(p: { p_home: number; p_draw: number; p_away: number } | null): Pick | null {
  if (!p) return null;
  const m = Math.max(p.p_home, p.p_draw, p.p_away);
  return m === p.p_home ? "H" : m === p.p_draw ? "D" : "A";
}

/** 내 픽이 맞을 모델 확률 */
export function pickProb(p: { p_home: number; p_draw: number; p_away: number } | null, pick: Pick): number | null {
  if (!p) return null;
  return pick === "H" ? p.p_home : pick === "D" ? p.p_draw : p.p_away;
}

/**
 * 여러 경기 픽의 조합 통계 (경기끼리 독립이라고 가정)
 * all = 전부 맞힐 확률(곱), expected = 예상 적중 수(합), oneIn = 약 N번에 1번
 */
export function comboStats(probs: number[]): { n: number; all: number; expected: number; oneIn: number } {
  const ps = probs.filter((x) => Number.isFinite(x) && x > 0);
  if (!ps.length) return { n: 0, all: 0, expected: 0, oneIn: 0 };
  const all = ps.reduce((a, b) => a * b, 1);
  const expected = ps.reduce((a, b) => a + b, 0);
  return { n: ps.length, all, expected, oneIn: Math.max(1, Math.round(1 / all)) };
}

/** 확률 표시: 10% 이상 정수, 1% 이상 소수 1자리, 그보다 작으면 유효숫자 2자리 */
export function fmtProb(x: number): string {
  if (!(x > 0)) return "0%";
  const pc = x * 100;
  if (pc >= 10) return `${Math.round(pc)}%`;
  if (pc >= 1) return `${pc.toFixed(1)}%`;
  return `${Number(pc.toPrecision(2))}%`;
}
