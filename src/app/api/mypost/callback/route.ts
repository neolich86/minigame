import { NextResponse, type NextRequest } from "next/server";
import { MYPOST_STATE_COOKIE, exchangeCode, fetchMyPostData, mypostConfig } from "@/lib/mypost";
import { adminDb, saveReport } from "@/lib/mypost-store";

export const maxDuration = 60;

function back(request: NextRequest, error: string, detail?: string) {
  const u = new URL("/play/my-post-2026", request.url);
  u.searchParams.set("mypost_error", error);
  // 메타가 돌려준 오류 문구 (토큰·시크릿은 들어있지 않다) — 원인 파악용으로 화면에 작게 보여준다
  if (detail) u.searchParams.set("mypost_detail", detail.slice(0, 200));
  const res = NextResponse.redirect(u);
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
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[mypost]", msg);
    return back(request, "fetch", msg);
  }

  // 저장소가 설정돼 있으면 리포트를 저장하고 공유 링크(/r/slug)로 보낸다. 삭제 토큰은 이 브라우저에만 남긴다.
  const db = adminDb();
  let script: string;
  if (db && data.posts.length) {
    try {
      const { slug, token } = await saveReport(db, data, request.cookies.get("mypost_ref")?.value);
      script = `try{localStorage.setItem(${JSON.stringify("mypost:own:" + slug)},${JSON.stringify(token)});localStorage.setItem("mypost:last",${JSON.stringify(slug)});sessionStorage.removeItem("mypost:data")}catch(e){}location.replace(${JSON.stringify("/r/" + slug)})`;
    } catch (e) {
      console.error("[mypost] save", e instanceof Error ? e.message : e);
      script = "";
    }
  } else script = "";
  if (!script) {
    // 저장 실패·미설정: 이 탭에서만 보이는 리포트로 (서버에 남기지 않음)
    const { id: _id, ...pub } = data;
    void _id;
    const json = JSON.stringify(pub).replace(/</g, "\\u003c");
    script = `try{sessionStorage.setItem("mypost:data",${JSON.stringify(json)})}catch(e){}location.replace("/play/my-post-2026")`;
  }
  const html = `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>My Post 2026</title><script>${script}</script>`;
  const res = new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  res.cookies.delete({ name: MYPOST_STATE_COOKIE, path: "/api/mypost" });
  res.cookies.delete({ name: "mypost_ref", path: "/api/mypost" });
  return res;
}
