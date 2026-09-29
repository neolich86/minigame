import { NextResponse, type NextRequest } from "next/server";

// ?lang=ko|en 주소로 들어오면 그 언어로 서버 렌더링 (검색엔진이 영어 페이지를 따로 수집할 수 있게)
export function proxy(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get("lang");
  if (lang !== "ko" && lang !== "en") return NextResponse.next();
  const headers = new Headers(request.headers);
  headers.set("x-mgh-lang", lang);
  const res = NextResponse.next({ request: { headers } });
  res.cookies.set("mgh_lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return res;
}

export const config = {
  matcher: ["/((?!_next/|games/|mgh/|thumbs/|api/|.*\\.[a-z0-9]+$).*)"],
};
