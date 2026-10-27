# 포션 공방 – Android 앱 (kr.minigame.potion)

`https://playwithme.kr/potion-app` 을 여는 Capacitor 앱 (광고 없음). 웹을 고치면 앱도 바로 바뀐다 (새 버전 업로드 불필요).

## AAB 만들기 (GitHub Actions)
궁수 키우기와 같은 업로드 키(저장소 Secrets 4개)를 그대로 쓴다.
1. Actions 탭 → **Build Potion AAB** → Run workflow (versionCode 입력, 업로드마다 +1)
2. 끝나면 Artifacts 의 `potion-app-release-aab` 다운로드 → `app-release.aab` 를 Play Console 에 업로드

스토어 이미지·문구: `store_assets/`
