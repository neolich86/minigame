// 사이트의 궁수 게임(public/games/archer)을 앱인토스용으로 바꿔 web/ 에 만든다.
// 앱인토스 규칙: 자체 로그인 금지, 우리 사이트로 이동·삽입 금지, 자사 서비스 유도 금지
// → 앱 모드(제목 '궁수 키우기')로 고정하고, 사이트 랭킹·친구 대결 공유(result.js)는 뺀다. 광고(이어하기)는 2단계에서 토스 광고로.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const out = path.resolve(import.meta.dirname, "web");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, "public/mgh/i18n"), { recursive: true }); // public/ 은 vite 가 그대로 복사

let html = fs.readFileSync(path.join(root, "public/games/archer/index.html"), "utf8");
const must = (from, to) => {
  if (!html.includes(from)) throw new Error("not found: " + from.slice(0, 60));
  html = html.split(from).join(to);
};
must('<script src="/mgh/bridge.js"></script><script src="/mgh/i18n/archer.js"></script><script src="/mgh/result.js"></script>',
  '<script>window.MGH_PLATFORM="toss";window.MGH_API="https://playwithme.kr";window.MGH_GAME="archer"</script><script src="./mgh/bridge.js"></script><script src="./mgh/i18n/archer.js"></script>');
html = html.replace(/<link rel="canonical"[^>]*>/, "");
must("return /[?&]app=1/.test(location.search||'');", "return true; // 앱인토스: 항상 앱 모드");
must("</style>", "#btnVs{display:none!important}\n</style>");
fs.writeFileSync(path.join(out, "index.html"), html);
fs.copyFileSync(path.join(root, "public/mgh/bridge.js"), path.join(out, "public/mgh/bridge.js"));
fs.copyFileSync(path.join(root, "public/mgh/i18n/archer.js"), path.join(out, "public/mgh/i18n/archer.js"));
console.log("web/ ready");
