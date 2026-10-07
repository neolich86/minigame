import { NextResponse, type NextRequest } from "next/server";
import { gameById, itemPath } from "@/lib/games";

const ITEM_PATH = /^\/(play|tools|apps)\/([^/]+)\/?$/;

export function proxy(request: NextRequest) {
  // 게임·도구·서비스는 각자 주소(/play · /tools · /apps)가 있다.
  // 예전 주소(/play/lotto 등)나 잘못된 구분으로 들어오면 올바른 주소로 영구 이동(308) — 검색 노출 유지
  const m = request.nextUrl.pathname.match(ITEM_PATH);
  if (m) {
    const g = gameById(decodeURIComponent(m[2]));
    if (g) {
      const want = itemPath(g);
      if (request.nextUrl.pathname !== want) {
        const url = request.nextUrl.clone();
        url.pathname = want;
        return NextResponse.redirect(url, 308);
      }
    }
  }

  // 안드로이드 앱(구글 플레이) 전용 화면 표시 — 레이아웃이 광고 스크립트를 넣지 않도록
  const isApp = request.nextUrl.pathname.startsWith("/passport-map");
  // ?lang=ko|en 주소로 들어오면 그 언어로 서버 렌더링 (검색엔진이 영어 페이지를 따로 수집할 수 있게)
  const lang = request.nextUrl.searchParams.get("lang");
  const hasLang = lang === "ko" || lang === "en";
  if (!hasLang && !isApp) return NextResponse.next();
  const headers = new Headers(request.headers);
  if (hasLang) headers.set("x-mgh-lang", lang);
  if (isApp) headers.set("x-mgh-app", "1");
  const res = NextResponse.next({ request: { headers } });
  if (hasLang) res.cookies.set("mgh_lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return res;
}

export const config = {
  matcher: ["/((?!_next/|games/|mgh/|thumbs/|api/|.*\\.[a-z0-9]+$).*)"],
};
