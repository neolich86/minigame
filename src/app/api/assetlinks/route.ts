// 안드로이드 앱(TWA) 도메인 확인 파일 — /.well-known/assetlinks.json 으로 서빙 (next.config.ts rewrite)
// Vercel 환경변수:
//   ANDROID_PACKAGE   예) kr.minigame.passportmap
//   ANDROID_SHA256    앱 서명 인증서 SHA-256 지문. 여러 개면 쉼표로 (Play 앱 서명 키 + 업로드 키)
export function GET() {
  const pkg = (process.env.ANDROID_PACKAGE ?? "").trim();
  const prints = (process.env.ANDROID_SHA256 ?? "")
    .split(/[,\s]+/)
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(s));
  const body =
    pkg && prints.length
      ? [{ relation: ["delegate_permission/common.handle_all_urls"], target: { namespace: "android_app", package_name: pkg, sha256_cert_fingerprints: prints } }]
      : [];
  return Response.json(body, { headers: { "cache-control": "public, max-age=300" } });
}
