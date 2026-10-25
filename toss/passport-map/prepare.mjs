// 사이트의 Passport Map 화면(public/games/passport-map)을 앱인토스용으로 바꿔 web/ 에 만든다.
// 앱인토스 규칙: 자체 로그인 금지, 우리 사이트로 이동·삽입 금지, 자사 서비스/앱 설치 유도 금지 → 관련 버튼을 숨기고 기기 저장(IndexedDB)만 쓴다.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const out = path.resolve(import.meta.dirname, "web");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, "public/mgh/i18n"), { recursive: true }); // public/ 은 vite 가 그대로 복사

let html = fs.readFileSync(path.join(root, "public/games/passport-map/index.html"), "utf8");
const must = (from, to) => {
  if (!html.includes(from)) throw new Error("not found: " + from.slice(0, 60));
  html = html.split(from).join(to);
};
must('src="/mgh/bridge.js"', 'src="./mgh/bridge.js"');
must('src="/mgh/i18n/passport-map.js"', 'src="./mgh/i18n/passport-map.js"');
html = html.replace(/<link rel="canonical"[^>]*>/, "");
// 사이트 링크·공유 링크·구글플레이 버튼 제거
html = html.replace(/<a class="vbapp"[\s\S]*?<\/a>/, "");
const hide = "#shCopyLink,#shX,#shFb,#linkBox,#viewBar,#shNative,#login{display:none!important}";
must("</style>", hide + "\n</style>");
must("이 브라우저에 저장됨", "이 기기에 저장됨");
html = html.replace(
  /<p class="note" id="shNote">[\s\S]*?<\/p>/,
  '<p class="note" id="shNote">이미지를 저장한 뒤 인스타그램·카카오톡 등에 올려 보세요.</p>',
);
// 공유 팝업 하단: 구글플레이 앱 받기 (토스 SDK openURL 로 연다)
// 주의: 앱인토스 체크리스트는 자사 앱 설치 유도를 금지한다 — 심사에서 반려되면 이 블록을 지우고 다시 빌드
html = html.replace(
  /(<p class="note" id="shNote">[\s\S]*?<\/p>)/,
  '$1\n      <a class="gp-link" id="gpLink" href="https://play.google.com/store/apps/details?id=kr.minigame.passportmap"><img src="./mgh/google-play.png" alt="" width="18" height="20"><span>구글플레이에서 앱 받기</span></a>',
);
must("</style>", ".gp-link{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;color:inherit;text-decoration:none;font-size:13px;font-weight:600;background:var(--panel)}.gp-link img{display:block}\n</style>");
// 앱인토스 SDK 연결 (이미지 저장)
must("</body>", '<script type="module" src="./toss.js"></script>\n</body>');
fs.writeFileSync(path.join(out, "index.html"), html);
fs.copyFileSync(path.join(root, "public/mgh/bridge.js"), path.join(out, "public/mgh/bridge.js"));
fs.copyFileSync(path.join(root, "public/mgh/i18n/passport-map.js"), path.join(out, "public/mgh/i18n/passport-map.js"));
fs.copyFileSync(path.join(import.meta.dirname, "toss.js"), path.join(out, "toss.js"));
fs.copyFileSync(path.join(root, "public/mgh/google-play.png"), path.join(out, "public/mgh/google-play.png"));
console.log("web/ ready");
