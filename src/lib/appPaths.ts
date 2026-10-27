// 안드로이드 앱(구글 플레이)이 여는 전용 주소 — 포털 머리글·바닥글·광고 스크립트 없이 전체 화면으로 보여 준다.
// 새 앱을 추가하면 여기에만 주소를 더하면 된다.
export const APP_PATHS = ["/passport-map", "/archer-app", "/potion-app"] as const;

export function isAppPath(path: string | null | undefined): boolean {
  return !!path && APP_PATHS.some((p) => path.startsWith(p));
}
