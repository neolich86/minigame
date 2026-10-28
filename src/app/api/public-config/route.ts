// 정적 게임(iframe)·앱인토스 미니앱이 쓸 공개 설정 — 모두 원래 브라우저에 공개되는 값이다
// (카카오 JavaScript 키, Supabase 주소·anon 키: 권한은 RLS·RPC 로 지킨다)
export function GET() {
  return Response.json(
    {
      kakaoJsKey: process.env.NEXT_PUBLIC_KAKAO_JS_KEY || null,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || null,
    },
    { headers: { "cache-control": "public, max-age=300, s-maxage=3600", "access-control-allow-origin": "*" } },
  );
}
