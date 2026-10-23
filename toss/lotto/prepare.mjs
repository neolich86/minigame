// 사이트의 로또 번호 추첨기(public/games/lotto)를 앱인토스용으로 web/ 에 만든다.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const here = import.meta.dirname;
const out = path.resolve(here, "web");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, "public/mgh/i18n"), { recursive: true }); // public/ 은 vite 가 그대로 복사

let html = fs.readFileSync(path.join(root, "public/games/lotto/index.html"), "utf8");
const must = (from, to) => {
  if (!html.includes(from)) throw new Error("not found: " + from.slice(0, 60));
  html = html.split(from).join(to);
};
must('<script src="/mgh/bridge.js"></script><script src="/mgh/i18n/lotto.js"></script>',
  '<script src="./mgh/bridge.js"></script><script src="./mgh/i18n/lotto.js"></script>');
html = html.replace(/<link rel="canonical"[^>]*>/, "");
must("</body>", '<script type="module" src="./toss.js"></script>\n</body>');
fs.writeFileSync(path.join(out, "index.html"), html);
fs.copyFileSync(path.join(root, "public/mgh/bridge.js"), path.join(out, "public/mgh/bridge.js"));
fs.copyFileSync(path.join(root, "public/mgh/i18n/lotto.js"), path.join(out, "public/mgh/i18n/lotto.js"));
fs.copyFileSync(path.join(here, "toss.js"), path.join(out, "toss.js"));
console.log("web/ ready");
