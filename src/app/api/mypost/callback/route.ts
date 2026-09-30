import { NextResponse, type NextRequest } from "next/server";
import { MYPOST_STATE_COOKIE, exchangeCode, fetchMyPostData, mypostConfig } from "@/lib/mypost";

export const maxDuration = 60;

function back(request: NextRequest, error: string) {
  const res = NextResponse.redirect(new URL(`/play/my-post-2026?mypost_error=${error}`, request.url));
  res.cookies.delete({ name: MYPOST_STATE_COOKIE, path: "/api/mypost" });
  return res;
}

// 인스타그램 로그인 후 돌아오는 곳: 코드 → 토큰 → 올해 게시물 → 브라우저에 넘기고 토큰은 버린다
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  if (q.get("error")) return back(request, "denied");
  const code = q.get("code");
  const state = q.get("state");
  if (!code || !state || state !== request.cookies.get(MYPOST_STATE_COOKIE)?.value) return back(request, "state");

  const { appId, appSecret, redirectUri } = mypostConfig();
  if (!appId || !appSecret) return back(request, "config");

  let data;
  try {
    const token = await exchangeCode(appId, appSecret, redirectUri, code);
    data = await fetchMyPostData(token);
  } catch (e) {
    console.error("[mypost]", e instanceof Error ? e.message : e);
    return back(request, "fetch");
  }

  // 리포트 페이지(같은 출처의 iframe)가 sessionStorage 에서 읽는다 — 서버에는 아무것도 남기지 않는다
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  const html = `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>My Post 2026</title>
<script>try{sessionStorage.setItem("mypost:data",${JSON.stringify(json)})}catch(e){}location.replace("/play/my-post-2026")</script>`;
  const res = new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  res.cookies.delete({ name: MYPOST_STATE_COOKIE, path: "/api/mypost" });
  return res;
}
