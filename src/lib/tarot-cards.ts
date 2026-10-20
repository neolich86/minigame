// 타로 운세 — 카드 사전 페이지(서버)가 쓰는 해석표. 화면(public/games/tarot)과 같은 cards.json 을 읽는다.
import data from "../../public/games/tarot/cards.json";
import type { Lang } from "./i18n";
import { TAROT_CATS, type TarotCat } from "./tarot-share";

type LT = { ko: string; en: string };
type LL = { ko: string[]; en: string[] };
export interface TarotCard {
  id: string;
  number: number;
  stage: 1 | 2 | 3;
  name: LT;
  img: string;
  keywords: { up: LL; rev: LL };
  readings: Record<TarotCat, { up: LT; rev: LT }>;
  advice: { up: LT; rev: LT };
}

export const TAROT_CARDS = (data as unknown as { cards: TarotCard[] }).cards;
export const TAROT_CAT_ORDER: TarotCat[] = ["year", "love", "reunion", "money", "business", "career", "study", "relation"];

/** 주소용 이름 — the-fool, wheel-of-fortune … */
export const cardSlug = (c: TarotCard) => c.name.en.toLowerCase().replace(/^the\s+/, "").replace(/[^a-z]+/g, "-").replace(/(^-|-$)/g, "");
export const cardBySlug = (slug: string) => TAROT_CARDS.find((c) => cardSlug(c) === slug);
export const cardPath = (c: TarotCard) => `/apps/tarot/cards/${cardSlug(c)}`;
export const cardImg = (c: TarotCard, size: 300 | 600) => `/games/tarot/cards/${size}/${c.img}`;

export const STAGE: Record<1 | 2 | 3, LT> = {
  1: { ko: "시작과 의지 (0~7번)", en: "Beginnings & will (0–7)" },
  2: { ko: "시련과 내면 (8~14번)", en: "Trials & inner work (8–14)" },
  3: { ko: "변화와 완성 (15~21번)", en: "Change & completion (15–21)" },
};

export const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];

export const catLabel = (c: TarotCat, lang: Lang) => TAROT_CATS[c][lang];

/** 신년운세 시즌 — 10월부터는 다음 해를 신년운세로 */
export function newYear(now = new Date()) {
  const kst = new Date(now.getTime() + 9 * 3600_000);
  return kst.getUTCMonth() >= 9 ? kst.getUTCFullYear() + 1 : kst.getUTCFullYear();
}
