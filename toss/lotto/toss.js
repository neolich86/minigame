// 앱인토스 전용: 동행복권 바로가기는 토스 SDK 로 외부 브라우저에서 연다
import { openURL } from "@apps-in-toss/web-framework";

function hook() {
  const btn = document.getElementById("officialBtn");
  if (!btn) return;
  const clone = btn.cloneNode(true); // 기존 window.open 핸들러 제거
  btn.replaceWith(clone);
  clone.addEventListener("click", () => {
    openURL("https://www.dhlottery.co.kr").catch(() => window.open("https://www.dhlottery.co.kr", "_blank", "noopener"));
  });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hook);
else hook();
