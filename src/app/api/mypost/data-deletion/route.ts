import { mypostConfig, parseSignedRequest } from "@/lib/mypost";

const STATUS_URL = "https://minigame-on.vercel.app/api/mypost/data-deletion";

// 메타 "데이터 삭제 요청" 콜백. 저장된 데이터가 없으므로 즉시 완료로 응답한다.
export async function POST(request: Request) {
  const { appSecret } = mypostConfig();
  const form = await request.formData().catch(() => null);
  const signed = form?.get("signed_request");
  const payload = appSecret && typeof signed === "string" ? await parseSignedRequest(signed, appSecret) : null;
  if (!payload) return Response.json({ error: "invalid signed_request" }, { status: 400 });
  const code = crypto.randomUUID().slice(0, 8);
  console.log("[mypost] data deletion", String(payload.user_id), code);
  return Response.json({ url: `${STATUS_URL}?code=${code}`, confirmation_code: code });
}

// 삭제 상태 확인 페이지 (메타가 사용자에게 보여주는 주소)
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.replace(/[^\w-]/g, "") ?? "";
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>My Post 2026 · 데이터 삭제</title>
<body style="font-family:system-ui,sans-serif;max-width:560px;margin:40px auto;padding:0 16px;line-height:1.6">
<h1 style="font-size:20px">My Post 2026 데이터 삭제</h1>
<p>My Post 2026은 인스타그램 액세스 토큰과 게시물 데이터를 서버에 저장하지 않습니다. 리포트는 사용자의 브라우저 탭에서만 만들어지고, 탭을 닫으면 사라집니다.</p>
<p>따라서 삭제할 데이터가 없으며, 요청은 <strong>완료</strong> 상태입니다.${code ? ` (확인 코드: ${code})` : ""}</p>
<p>My Post 2026 does not store Instagram access tokens or post data on its servers, so there is nothing to delete. Your request is complete.</p>
</body>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
