import { mypostConfig, parseSignedRequest } from "@/lib/mypost";

// 사용자가 인스타 설정에서 앱 연결을 끊으면 메타가 호출한다. My Post 는 토큰·데이터를 저장하지 않으므로 지울 것이 없다.
export async function POST(request: Request) {
  const { appSecret } = mypostConfig();
  const form = await request.formData().catch(() => null);
  const signed = form?.get("signed_request");
  if (appSecret && typeof signed === "string") {
    const payload = await parseSignedRequest(signed, appSecret);
    console.log("[mypost] deauthorize", payload ? `user ${String(payload.user_id)}` : "invalid signature");
  }
  return new Response(null, { status: 200 });
}
