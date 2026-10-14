import { NextResponse, type NextRequest } from "next/server";
import { gameById, itemPath } from "@/lib/games";

const ITEM_PATH = /^\/(play|tools|apps)\/([^/]+)\/?$/;

// 대표 도메인(NEXT_PUBLIC_SITE_URL, 예: https://playwithme.kr)이 정해지면 옛 주소(*.vercel.app)로 온 방문을 대표 도메인으로 영구 이동.
// 환경변수가 없으면 아무 일도 하지 않는다. Passport Map 앱(구글 플레이)과 로그인 콜백은 앱 설정이 옛 주소를 쓰므로 그대로 둔다.
const PRIMARY_HOST = (() => {
  try {
    return process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).host : "";
  } catch {
    return "";
  }
})();

function toPrimary(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  if (!PRIMARY_HOST || host === PRIMARY_HOST || !host.endsWith(".vercel.app")) return null;
  const { pathname, searchParams } = request.nextUrl;
  if (pathname.startsWith("/passport-map") || pathname.startsWith("/auth") || pathname.startsWith("/account")) return null;
  if (pathname === "/login" && (searchParams.get("next") ?? "").startsWith("/passport-map")) return null;
  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.host = PRIMARY_HOST;
  url.port = "";
  return NextResponse.redirect(url, 308);
}

export function proxy(request: NextRequest) {
  const moved = toPrimary(request);
  if (moved) return moved;
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
