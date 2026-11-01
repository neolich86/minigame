// 사이트의 카드 도감(public/games/card-dex)을 앱인토스용으로 바꿔 web/ 에 만든다.
// 앱인토스 규칙: 우리 사이트로 이동·삽입 금지, 자체 로그인 금지 → 공유 링크(사이트 주소) 버튼을 빼고,
// 포털 대신 toss.js(Supabase 직접 연결 + 익명 계정)를 쓴다. 카드 검색·이미지 링크는 우리 API 를 fetch 로만 부른다.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const src = path.join(root, "public/games/card-dex");
const out = path.resolve(import.meta.dirname, "web");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, "public/mgh"), { recursive: true });

let html = fs.readFileSync(path.join(src, "index.html"), "utf8");
const must = (from, to) => {
  if (!html.includes(from)) throw new Error("not found: " + from.slice(0, 60));
  html = html.split(from).join(to);
};
must(
  '<script src="/mgh/bridge.js"></script>',
  '<script>window.MGH_PLATFORM="toss";window.MGH_API="https://playwithme.kr";window.MGH_GAME="card-dex";window.CD_API="https://playwithme.kr"</script>\n<script src="./mgh/bridge.js"></script>',
);
// toss.js 가 MGH 를 먼저 갈아 끼우도록 본문 스크립트도 module 로 (module 은 문서 순서대로 실행)
must("<script>\n'use strict';", '<script type="module" src="./toss.js"></script>\n<script type="module">\n\'use strict\';');
// 공유 링크는 우리 사이트 주소라 앱인토스에서는 숨긴다
must("</style>", "#bSelect,#bShareAll,#selbar{display:none!important}\n</style>");
fs.writeFileSync(path.join(out, "index.html"), html);
fs.copyFileSync(path.join(root, "public/mgh/bridge.js"), path.join(out, "public/mgh/bridge.js"));
fs.copyFileSync(path.join(import.meta.dirname, "toss.js"), path.join(out, "toss.js"));
console.log("web/ ready");
