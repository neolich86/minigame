// 앱인토스 전용 연결: 결과 이미지 미리보기 + 사진첩 저장 (웹뷰에서는 a[download] 가 동작하지 않음)
import { File } from "@apps-in-toss/web-framework";

const $ = (id) => document.getElementById(id);
const ko = document.documentElement.lang !== "en";
let lastUrl = null, seq = 0;

// index.html 의 공유 미리보기 자리에서 부른다
window.tossPreview = async () => {
  const my = ++seq;
  try {
    const blob = await window.storyBlob();
    if (my !== seq) return;
    if (lastUrl) URL.revokeObjectURL(lastUrl);
    lastUrl = URL.createObjectURL(blob);
    $("shImg").src = lastUrl;
  } catch (e) {}
};

function toBase64(blob) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1]); r.onerror = rej; r.readAsDataURL(blob); });
}
function hookSave() {
  const btn = $("shSave");
  if (!btn) return;
  btn.onclick = async () => {
    const old = btn.textContent; btn.disabled = true; btn.textContent = ko ? "저장 중…" : "Saving…";
    try {
      if (!File.saveBase64.isSupported()) throw new Error("unsupported");
      const data = await toBase64(await window.storyBlob());
      await File.saveBase64({ data, fileName: `tarot-${Date.now()}.png`, mimeType: "image/png" });
      try { window.MGH && MGH.shared("image_save"); } catch (e) {}
      window.toast(ko ? "사진첩에 저장했어요" : "Saved to your photos");
    } catch (e) {
      window.toast(ko ? "저장하지 못했어요. 토스 앱을 최신 버전으로 업데이트해 주세요" : "Couldn't save. Please update the Toss app.");
    }
    btn.textContent = old; btn.disabled = false;
  };
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hookSave);
else hookSave();
