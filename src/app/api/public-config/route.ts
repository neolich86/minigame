// 정적 게임(iframe)이 쓸 공개 설정 — 카카오 JavaScript 키는 원래 브라우저에 공개되는 값이다
export function GET() {
  return Response.json(
    { kakaoJsKey: process.env.NEXT_PUBLIC_KAKAO_JS_KEY || null },
    { headers: { "cache-control": "public, max-age=300, s-maxage=3600" } },
  );
}
