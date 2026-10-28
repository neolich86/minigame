// 결과 공유 횟수 기록 (포털 React 화면용) — 정적 게임은 /mgh/bridge.js 의 MGH.shared() 를 쓴다
export function logShare(game: string, method: string) {
  try {
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    const platform = cap?.isNativePlatform?.() ? "app" : "web";
    const body = JSON.stringify({ game, platform, method });
    if (navigator.sendBeacon?.("/api/share-event", body)) return;
    fetch("/api/share-event", { method: "POST", body, keepalive: true }).catch(() => {});
  } catch {}
}
