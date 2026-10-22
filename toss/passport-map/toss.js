// 앱인토스 전용 연결: 공유 이미지를 기기에 저장 (웹뷰에서는 a[download] 가 동작하지 않음)
import { File } from "@apps-in-toss/web-framework";

function hookSave() {
  const btn = document.getElementById("shSave");
  const cv = document.getElementById("shareCv");
  const msg = document.getElementById("shMsg");
  if (!btn || !cv) return;
  btn.onclick = async () => {
    try {
      if (!File.saveBase64.isSupported()) throw new Error("unsupported");
      const data = cv.toDataURL("image/png").split(",")[1];
      await File.saveBase64({ data, fileName: `passport-map-${Date.now()}.png`, mimeType: "image/png" });
      if (msg) msg.textContent = document.documentElement.lang === "en" ? "Saved to your photos." : "사진첩에 저장했어요.";
    } catch (e) {
      if (msg) msg.textContent = document.documentElement.lang === "en" ? "Couldn't save. Please update the Toss app." : "저장하지 못했어요. 토스 앱을 최신 버전으로 업데이트해 주세요.";
    }
  };
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hookSave);
else hookSave();
