// 사이트의 타로 운세(public/games/tarot)를 앱인토스용으로 web/ 에 만든다.
// 앱인토스 규칙: 우리 사이트로 이동·링크 금지 → 카카오·링크 공유를 빼고, 결과 이미지 저장만 남긴다.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const here = import.meta.dirname;
const src = path.join(root, "public/games/tarot");
const out = path.resolve(here, "web");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, "public/mgh"), { recursive: true }); // public/ 은 vite 가 그대로 복사

let html = fs.readFileSync(path.join(src, "index.html"), "utf8");
const must = (from, to) => {
  if (!html.includes(from)) throw new Error("not found: " + from.slice(0, 60));
  html = html.split(from).join(to);
};
must('<script src="/mgh/bridge.js"></script>', '<script src="./mgh/bridge.js"></script>');
html = html.replace(/<link rel="canonical"[^>]*>/, "");
// 공유 팝업: 카카오·링크 복사·공유 시트 숨기고 이미지 저장만
must("</style>", "#shKakao,#shNative,#shCopy{display:none!important}.sheet .prev{aspect-ratio:1080/1920;width:52%;margin:4px auto 0;object-fit:contain}.sbtns{grid-template-columns:1fr}\n</style>");
must('share: ["결과 공유하기", "Share result"]', 'share: ["결과 이미지 저장", "Save result image"]');
must('shareTitle: ["결과 공유하기", "Share your reading"]', 'shareTitle: ["결과 이미지 저장", "Save your reading"]');
// 미리보기: 사이트의 공유 이미지 API 대신 기기에서 만든 결과 이미지
must('$("shImg").src = ogUrl(cleanName(shareName));', "tossPreview();");
must("loadKakao().then(", "Promise.resolve(false).then(");
// 결과 이미지 아래의 사이트 버튼·주소 제거
must('  x.fillStyle = "#e6c47a"; roundRect(x, W / 2 - 300, H - 250, 600, 104, 52); x.fill();\n', "");
must('  x.fillStyle = "#1a1433"; x.font = `700 40px ${sans}`; x.fillText(t("kBtnMine"), W / 2, H - 184);\n', "");
must("x.fillText(`${location.host}/apps/tarot`, W / 2, H - 92);", 'x.fillText("✦ 귀여운 타로 ✦", W / 2, H - 120);');
must("</body>", '<script type="module" src="./toss.js"></script>\n</body>');
fs.writeFileSync(path.join(out, "index.html"), html);

fs.copyFileSync(path.join(root, "public/mgh/bridge.js"), path.join(out, "public/mgh/bridge.js"));
fs.copyFileSync(path.join(src, "cards.json"), path.join(out, "public/cards.json"));
fs.cpSync(path.join(src, "cards"), path.join(out, "public/cards"), { recursive: true });
fs.copyFileSync(path.join(here, "toss.js"), path.join(out, "toss.js"));
console.log("web/ ready");
