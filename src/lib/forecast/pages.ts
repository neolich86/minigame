// 스포츠 승부 예측 — 페이지 공용 (기간 계산, 메타데이터)
import type { Metadata } from "next";
import type { Lang } from "@/lib/i18n";
import { SITE_URL, langAlternates } from "@/lib/serverLang";

export const BASE = "/apps/sports-forecast";
export const LIST_COMPS = ["PL", "PD", "BL1", "SA", "FL1", "CL", "PPL", "DED", "ELC"];
export type RangeKey = "today" | "tomorrow" | "weekend" | "week" | "past";

const H = 3600_000;
const D = 24 * H;

/** KST 기준 날짜 범위 → UTC ISO */
export function rangeFor(key: RangeKey, now = Date.now()): [string, string] {
  const kstMidnight = Math.floor((now + 9 * H) / D) * D - 9 * H; // 오늘 KST 00:00 (UTC ms)
  const dow = new Date(now + 9 * H).getUTCDay(); // 0=일
  let a: number, b: number;
  switch (key) {
    case "tomorrow":
      a = kstMidnight + D; b = a + D; break;
    case "weekend": {
      // 토 00:00 ~ 월 12:00 (유럽 일요일 밤 경기는 한국 월요일 새벽)
      const toSat = dow === 6 ? 0 : dow === 0 ? -1 : 6 - dow;
      a = kstMidnight + toSat * D; b = a + 2 * D + 12 * H; break;
    }
    case "week":
      a = now - 3 * H; b = kstMidnight + 8 * D; break;
    case "past":
      a = kstMidnight - 3 * D; b = now; break;
    default:
      a = kstMidnight; b = a + D;
  }
  return [new Date(a).toISOString(), new Date(b).toISOString()];
}

export const SEO = {
  ko: {
    title: "스포츠 승부 예측 — 축구 경기 승무패 확률",
    description: "프리미어리그·라리가·분데스리가·세리에A·리그1·챔피언스리그 경기의 승·무·패 확률과 예상 스코어를 통계 모델로 계산합니다. 적중률을 투명하게 공개합니다.",
    keywords: ["축구 승부 예측", "축구 경기 예측", "프리미어리그 예측", "챔피언스리그 예측", "승무패 확률", "예상 스코어"],
  },
  en: {
    title: "Sports Forecast — football win/draw/loss probabilities",
    description: "Statistical forecasts for the Premier League, La Liga, Bundesliga, Serie A, Ligue 1 and Champions League: win, draw and loss probabilities and likely scores, with a public track record.",
    keywords: ["football predictions", "match forecast", "premier league predictions", "champions league predictions", "win draw loss probability"],
  },
};

export function fcMeta(lang: Lang, fromParam: boolean, path: string, title: string, description: string, extra?: Partial<Metadata>): Metadata {
  return {
    title,
    description,
    keywords: SEO[lang].keywords,
    alternates: langAlternates(path, lang, fromParam),
    openGraph: { title, description, type: "website", url: `${SITE_URL}${path}`, images: [{ url: "/thumbs/sports-forecast-og.jpg" }] },
    twitter: { card: "summary_large_image", title, description, images: ["/thumbs/sports-forecast-og.jpg"] },
    ...extra,
  };
}

/** 서버 렌더링 시점 (컴포넌트 본문에서 Date.now 를 직접 부르지 않기 위해) */
export const nowMs = () => Date.now();
