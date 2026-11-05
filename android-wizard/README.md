# 마법사 키우기 – Android 앱 (kr.minigame.wizard)

`https://playwithme.kr/wizard-app` 을 여는 Capacitor 앱 + AdMob 보상형 광고(광고 보고 이어하기). 웹을 고치면 앱도 바로 바뀐다 (새 버전 업로드 불필요).

## AAB 만들기 (GitHub Actions)
궁수 키우기·포션 공방과 같은 업로드 키(저장소 Secrets 4개)를 그대로 쓴다.
1. Actions 탭 → **Build Wizard AAB** → Run workflow (versionCode 입력, 업로드마다 +1)
2. 끝나면 Artifacts 의 `wizard-app-release-aab` 다운로드 → `app-release.aab` 를 Play Console 에 업로드

스토어 이미지·문구: `store_assets/`

## 출시 전 교체 (지금은 구글 테스트 ID)
- AdMob 앱 ID: `android/app/src/main/AndroidManifest.xml` → 바꾼 뒤 AAB 다시 빌드
- 보상형 광고 단위 ID: `public/games/wizard/game.js` 의 `AD_UNIT_REWARD` → 웹 배포만 하면 됨 (앱 재빌드 불필요)
