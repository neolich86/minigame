// 사이트의 핀볼 추첨기(public/games/pinball)를 앱인토스용으로 web/ 에 만든다.
// 물리 엔진(Matter.js)은 CDN 대신 앱 안에 넣는다.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const here = import.meta.dirname;
const out = path.resolve(here, "web");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, "public/mgh/i18n"), { recursive: true }); // public/ 은 vite 가 그대로 복사

let html = fs.readFileSync(path.join(root, "public/games/pinball/index.html"), "utf8");
const must = (from, to) => {
  if (!html.includes(from)) throw new Error("not found: " + from.slice(0, 60));
  html = html.split(from).join(to);
};
must('<script src="/mgh/bridge.js"></script><script src="/mgh/i18n/pinball.js"></script>',
  '<script src="./mgh/bridge.js"></script><script src="./mgh/i18n/pinball.js"></script>');
must('<script src="https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js"></script>', '<script src="./matter.min.js"></script>');
html = html.replace(/<link rel="canonical"[^>]*>/, "");
html = html.split("브라우저 스크롤로").join("스크롤로");
fs.writeFileSync(path.join(out, "index.html"), html);
fs.copyFileSync(path.join(root, "public/mgh/bridge.js"), path.join(out, "public/mgh/bridge.js"));
fs.copyFileSync(path.join(root, "public/mgh/i18n/pinball.js"), path.join(out, "public/mgh/i18n/pinball.js"));
fs.copyFileSync(path.join(here, "node_modules/matter-js/build/matter.min.js"), path.join(out, "public/matter.min.js"));
console.log("web/ ready");
