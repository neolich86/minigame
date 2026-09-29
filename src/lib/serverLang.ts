import { cookies, headers } from "next/headers";
import { LANG_COOKIE, normLang, pickLang, type Lang } from "./i18n";

/** 서버 렌더링 언어: ?lang= 주소(proxy가 x-mgh-lang 헤더로 전달) > 쿠키 > Accept-Language(없으면 ko) */
export async function serverLang(): Promise<{ lang: Lang; fixed: boolean; fromParam: boolean }> {
  const h = await headers();
  const q = normLang(h.get("x-mgh-lang"));
  if (q) return { lang: q, fixed: true, fromParam: true };
  const c = normLang((await cookies()).get(LANG_COOKIE)?.value);
  if (c) return { lang: c, fixed: true, fromParam: false };
  return { lang: pickLang(h.get("accept-language")), fixed: false, fromParam: false };
}

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://minigame-on.vercel.app";

/** 한국어/영어 버전 주소 쌍 (hreflang). 한국어가 기본 주소, 영어는 ?lang=en */
export function langAlternates(path: string, lang: Lang, fromParam: boolean) {
  const en = `${path}${path.includes("?") ? "&" : "?"}lang=en`;
  return {
    canonical: lang === "en" && fromParam ? en : path,
    languages: { ko: path, en, "x-default": path },
  };
}
