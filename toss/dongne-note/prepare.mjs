// 사이트의 동네쪽지 화면(public/games/dongne-note)을 앱인토스용으로 바꿔 web/ 에 만든다.
// 앱인토스 규칙: 우리 사이트로 이동·삽입 금지, 자사 앱 설치 유도 금지 → 공유 링크·이용약관 링크를 빼고,
// 포털 대신 toss.js(Supabase 직접 연결 + 익명 계정)를 쓴다. 장소 검색·공유 집계는 우리 API 를 fetch 로만 부른다.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const src = path.join(root, "public/games/dongne-note");
const out = path.resolve(import.meta.dirname, "web");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, "public/mgh"), { recursive: true }); // public/ 은 vite 가 그대로 복사

let html = fs.readFileSync(path.join(src, "index.html"), "utf8");
const must = (from, to) => {
  if (!html.includes(from)) throw new Error("not found: " + from.slice(0, 60));
  html = html.split(from).join(to);
};
must(
  '<script src="/mgh/bridge.js"></script>',
  '<script>window.MGH_PLATFORM="toss";window.MGH_API="https://playwithme.kr";window.MGH_GAME="dongne-note";window.DN_API="https://playwithme.kr"</script>\n<script src="./mgh/bridge.js"></script>',
);
// toss.js(DN_BACKEND)가 먼저 실행되도록 본문 스크립트도 module 로 (module 은 문서 순서대로 실행)
must("<script>\n'use strict';", '<script type="module" src="./toss.js"></script>\n<script type="module">\n\'use strict\';');
// 외부 이동 막기: 이용약관 링크·공유 버튼 제거
must("const TERMS_LINK = `<a href=\"/terms\" target=\"_blank\" rel=\"noopener\">${L_('이용약관', 'Terms')}</a>`;", "const TERMS_LINK = '';");
must("</style>", "#mShare{display:none!important}\n</style>");
fs.writeFileSync(path.join(out, "index.html"), html);

// 정적 파일 (vite 가 손대지 않게 public/ 으로)
for (const d of ["vendor", "img", "fonts"]) fs.cpSync(path.join(src, d), path.join(out, "public", d), { recursive: true });
fs.copyFileSync(path.join(src, "mapstyle.js"), path.join(out, "public/mapstyle.js"));
fs.copyFileSync(path.join(root, "public/mgh/bridge.js"), path.join(out, "public/mgh/bridge.js"));
fs.copyFileSync(path.join(import.meta.dirname, "toss.js"), path.join(out, "toss.js"));
console.log("web/ ready");
