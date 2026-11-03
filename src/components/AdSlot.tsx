"use client";
// AdSense 디스플레이 광고 한 칸 (광고 단위 「미니게임천국」). 앱(WebView)처럼 광고 스크립트가 없는 곳에서는 그리지 않는다.
import { useEffect, useRef, useState } from "react";

const CLIENT = "ca-pub-9826307769121956";
export const AD_SLOT_MAIN = "8492334079";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdSlot({ slot = AD_SLOT_MAIN }: { slot?: string }) {
  const [on, setOn] = useState(false);
  const pushed = useRef(false);
  useEffect(() => {
    if (!document.querySelector('script[src*="adsbygoogle.js"]')) return;
    setOn(true);
  }, []);
  useEffect(() => {
    if (!on || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, [on]);
  if (!on) return null;
  return (
    <div className="ad-slot">
      <ins className="adsbygoogle" style={{ display: "block" }} data-ad-client={CLIENT} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" />
    </div>
  );
}
