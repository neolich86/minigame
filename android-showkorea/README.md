# Show Korea – Android 앱 (kr.minigame.showkorea)

외국인 여행자용 한국어 보여주기 카드. `public/games/korea-kit/` 의 `index.html`·`icons.webp` 를 **앱 안에 넣어서** 실행한다. 인터넷 없이도 동작하고, 광고만 인터넷이 있을 때 나온다.
웹을 고친 뒤에는 이 앱도 **다시 빌드해서 새 버전을 올려야** 반영된다 (서버 주소를 여는 다른 앱들과 다름).

## 광고 (AdMob)
- 첫 화면에만 하단 적응형 배너. 상황 화면·보여주기 화면에서는 숨김.
- 지금은 **구글 공식 테스트 ID**. 출시 전에 두 곳을 실제 ID로 바꿀 것:
  1. `android/app/src/main/AndroidManifest.xml` 의 `com.google.android.gms.ads.APPLICATION_ID` → AdMob 앱 ID (`ca-app-pub-9826307769121956~…`)
  2. `public/games/korea-kit/index.html` 의 `AD_UNIT_BANNER` → 배너 광고 단위 ID (`ca-app-pub-9826307769121956/…`)

## AAB 만들기 (GitHub Actions)
궁수 키우기·RPG 디펜스와 같은 업로드 키(저장소 Secrets 4개)를 쓴다.
1. Actions 탭 → **Build Show Korea AAB** → Run workflow (versionCode 입력, 업로드마다 +1)
2. 끝나면 Artifacts 의 `show-korea-app-release-aab` 다운로드 → `app-release.aab` 를 Play Console 에 업로드

## 직접 빌드
```
npm ci
npm run sync          # 웹 파일 복사(www/) + cap sync
cd android && ./gradlew bundleRelease
```

스토어 이미지·문구·Play Console 답변: `store_assets/`
