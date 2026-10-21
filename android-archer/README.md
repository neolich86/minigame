# 궁수 키우기 – Android 앱 (kr.minigame.archer)

`https://playwithme.kr/archer-app` 을 여는 Capacitor 앱 + AdMob 보상형 광고.

## AAB 만들기 (GitHub Actions)
1. 서명 키를 **내 PC에서** 한 번 만든다 (아래). 이 저장소는 public 이라 키를 저장소/아티팩트에 두면 안 됨.
2. 저장소 Settings → Secrets and variables → Actions 에 4개 등록:
   `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`
3. Actions 탭 → **Build Archer AAB** → Run workflow (versionCode 입력, 업로드마다 +1)
4. 끝나면 Artifacts 의 `archer-app-release-aab` 다운로드 → `app-release.aab` 를 Play Console 에 업로드

## 서명 키 만들기
```
keytool -genkeypair -v -keystore upload-keystore.jks -storetype PKCS12 -alias upload -keyalg RSA -keysize 2048 -validity 10000
```
(Android Studio: Build → Generate Signed Bundle → Create new… 도 가능)

base64 변환 → `ANDROID_KEYSTORE_BASE64` 값으로:
- Windows PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("upload-keystore.jks")) | Set-Clipboard`
- macOS: `base64 -i upload-keystore.jks | pbcopy`

`.jks` 파일과 비밀번호는 안전한 곳에 백업. Play App Signing 을 쓰면 분실해도 재설정 가능하지만 번거롭다.

## 출시 전 교체
- AdMob 테스트 ID: `android/app/src/main/AndroidManifest.xml` 의 앱 ID, `public/games/archer/index.html` 의 `AD_UNIT_REWARD`
