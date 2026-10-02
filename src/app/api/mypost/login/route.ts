import { NextResponse, type NextRequest } from "next/server";
import { MYPOST_STATE_COOKIE, authorizeUrl, mypostConfig } from "@/lib/mypost";

// "Instagram으로 계속하기" → 인스타그램 로그인 화면으로 보낸다
export async function GET(request: NextRequest) {
  const { appId, redirectUri } = mypostConfig();
  if (!appId) return NextResponse.redirect(new URL("/apps/my-post-2026?mypost_error=config", request.url));
  const state = crypto.randomUUID();
  const res = NextResponse.redirect(authorizeUrl(appId, redirectUri, state));
  res.cookies.set(MYPOST_STATE_COOKIE, state, { httpOnly: true, secure: true, sameSite: "lax", path: "/api/mypost", maxAge: 600 });
  // 친구의 공유 링크에서 들어왔으면 기록 (바이럴 추적)
  const ref = request.nextUrl.searchParams.get("ref")?.replace(/[^A-Za-z0-9]/g, "").slice(0, 16);
  if (ref) res.cookies.set("mypost_ref", ref, { httpOnly: true, secure: true, sameSite: "lax", path: "/api/mypost", maxAge: 600 });
  return res;
}
