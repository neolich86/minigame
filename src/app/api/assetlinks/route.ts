// 안드로이드 앱(TWA) 도메인 확인 파일 — /.well-known/assetlinks.json 으로 서빙 (next.config.ts rewrite)
// Vercel 환경변수:
//   ANDROID_PACKAGE   예) kr.minigame.passportmap
//   ANDROID_SHA256    앱 서명 인증서 SHA-256 지문. 여러 개면 쉼표로 (Play 앱 서명 키 + 업로드 키)
// Passport Map 앱 (PWABuilder로 만든 업로드 키). 지문은 공개 정보라 코드에 둬도 안전하다.
const DEFAULT_PACKAGE = "kr.minigame.passportmap";
const DEFAULT_SHA256 = [
  // Play 앱 서명 키 (Play 스토어에서 받은 앱)
  "88:CA:A8:F8:5C:14:D3:5E:19:2F:7F:82:3A:E6:1F:65:D2:C4:25:7A:35:13:E7:C6:4B:AF:B3:0D:A0:F6:4E:90",
  // 업로드 키 (PWABuilder 로 만든 .apk 직접 설치)
  "AE:60:77:C7:1C:38:2D:30:8C:6A:86:E5:D3:26:DC:69:89:6D:5B:8D:3F:5A:AD:B3:AD:98:9E:BE:2E:E7:BE:F8",
];

export function GET() {
  const pkg = (process.env.ANDROID_PACKAGE ?? "").trim() || DEFAULT_PACKAGE;
  // 환경변수 지문(예: Play 앱 서명 키)은 기본 지문에 더해진다
  const prints = [...DEFAULT_SHA256, ...(process.env.ANDROID_SHA256 ?? "").split(/[,\s]+/)]
    .map((s) => s.trim().toUpperCase())
    .filter((s, i, a) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(s) && a.indexOf(s) === i);
  const body =
    pkg && prints.length
      ? [{ relation: ["delegate_permission/common.handle_all_urls"], target: { namespace: "android_app", package_name: pkg, sha256_cert_fingerprints: prints } }]
      : [];
  return Response.json(body, { headers: { "cache-control": "public, max-age=300" } });
}
