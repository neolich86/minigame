// 타로 운세 결과 링크 — /apps/tarot?c=love&s=three&d=06r.02.10&n=민지(&y=2026)
// 정적 페이지(public/games/tarot)와 같은 규칙. DB 없이 링크만으로 결과를 다시 보여 준다.

export const TAROT_CATS = {
  year: { ko: "올해 운세", en: "This Year" },
  love: { ko: "애정운", en: "Love" },
  reunion: { ko: "재회운", en: "Reunion" },
  money: { ko: "금전운", en: "Money" },
  business: { ko: "사업운", en: "Business" },
  career: { ko: "직장·취업운", en: "Career" },
  study: { ko: "학업·시험운", en: "Study & Exams" },
  relation: { ko: "인간관계", en: "Relationships" },
} as const;
export type TarotCat = keyof typeof TAROT_CATS;

export const TAROT_NAMES: [string, string][] = [
  ["바보", "The Fool"], ["마법사", "The Magician"], ["여사제", "The High Priestess"], ["여황제", "The Empress"],
  ["황제", "The Emperor"], ["교황", "The Hierophant"], ["연인", "The Lovers"], ["전차", "The Chariot"],
  ["힘", "Strength"], ["은둔자", "The Hermit"], ["운명의 수레바퀴", "Wheel of Fortune"], ["정의", "Justice"],
  ["매달린 사람", "The Hanged Man"], ["죽음", "Death"], ["절제", "Temperance"], ["악마", "The Devil"],
  ["탑", "The Tower"], ["별", "The Star"], ["달", "The Moon"], ["태양", "The Sun"],
  ["심판", "Judgement"], ["세계", "The World"],
];

export interface TarotShare {
  c: TarotCat;
  s: "one" | "three";
  cards: { n: number; rev: boolean }[];
  y: number | null;
  name: string;
}

/** 공유 이름 — 12자, 꺾쇠·줄바꿈 제거 */
export function cleanTarotName(v: string | null | undefined) {
  return (v ?? "").replace(/[<>\r\n\t]/g, "").trim().slice(0, 12);
}

export function parseTarotShare(get: (k: string) => string | null | undefined): TarotShare | null {
  const c = get("c"), s = get("s"), d = get("d"), y = get("y");
  if (!c || !(c in TAROT_CATS) || (s !== "one" && s !== "three") || !d) return null;
  const parts = d.split(".");
  if (parts.length !== (s === "one" ? 1 : 3)) return null;
  const cards: TarotShare["cards"] = [];
  for (const p of parts) {
    const m = /^(\d{2})(r?)$/.exec(p);
    if (!m || +m[1] > 21) return null;
    cards.push({ n: +m[1], rev: m[2] === "r" });
  }
  if (new Set(cards.map((x) => x.n)).size !== cards.length) return null;
  return {
    c: c as TarotCat,
    s,
    cards,
    y: c === "year" && y && /^\d{4}$/.test(y) ? +y : null,
    name: cleanTarotName(get("n")),
  };
}

export function tarotShareQuery(x: TarotShare) {
  const q = new URLSearchParams({ c: x.c, s: x.s, d: x.cards.map((k) => String(k.n).padStart(2, "0") + (k.rev ? "r" : "")).join(".") });
  if (x.y) q.set("y", String(x.y));
  if (x.name) q.set("n", x.name);
  return q.toString();
}

/** 10월~다음 해 1월은 신년운세 시즌 — 그 해는 'O 신년운세', 그 밖에는 'O년 운세' (한국 시간 기준) */
function isNewYear(y: number, now = new Date()) {
  const kst = new Date(now.getTime() + 9 * 3600_000);
  const cy = kst.getUTCFullYear();
  return y > cy || (kst.getUTCMonth() === 0 && y === cy);
}

export function tarotCatName(x: TarotShare, lang: "ko" | "en") {
  if (x.c === "year" && x.y) {
    if (isNewYear(x.y)) return lang === "ko" ? `${x.y} 신년운세` : `${x.y} New Year`;
    return lang === "ko" ? `${x.y}년 운세` : `${x.y} Fortune`;
  }
  return TAROT_CATS[x.c][lang];
}

export function tarotShareTitle(x: TarotShare, lang: "ko" | "en" = "ko") {
  const cat = tarotCatName(x, lang);
  if (lang === "en") return `${x.name ? `${x.name}'s` : "A friend's"} ${cat} tarot reading 🔮`;
  return `${x.name || "친구"}님의 ${cat} 타로 결과 🔮`;
}

export function tarotShareDesc(x: TarotShare, lang: "ko" | "en" = "ko") {
  const cards = x.cards.map((k) => `${TAROT_NAMES[k.n][lang === "ko" ? 0 : 1]}${k.rev ? (lang === "ko" ? "(역)" : " (rev.)") : ""}`).join(" · ");
  return lang === "ko" ? `${cards} — 나도 카드를 뽑아 보세요!` : `${cards} — draw your own cards!`;
}
