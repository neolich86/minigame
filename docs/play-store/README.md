# Passport Map — 구글 플레이 등록 가이드

웹사이트(`/passport-map`)를 **TWA(Trusted Web Activity)** 로 감싼 안드로이드 앱입니다.
앱은 크롬 엔진으로 웹 화면을 전체 화면으로 띄우므로, 웹을 고치면 앱도 바로 바뀝니다 (새 버전 업로드 불필요).

- 앱 시작 주소: `https://minigame-on.vercel.app/passport-map` (포털 머리글·광고 없이 전체 화면)
- 매니페스트: `/passport-map.webmanifest`, 아이콘 `/icons/pm-*.png`
- 도메인 확인 파일: `/.well-known/assetlinks.json` (Vercel 환경변수로 채움)
- 개인정보처리방침: `/privacy`, 계정 삭제: `/account/delete`
- ⚠️ 도메인을 바꾸면(커스텀 도메인 연결 등) 앱을 새로 빌드해야 하므로, 도메인을 정했다면 먼저 연결한 뒤 진행하세요.

## 1. 서버 준비 (한 번)
1. Supabase SQL Editor 에서 실행 (재실행 안전)
   - `supabase/migrations/0007_game_saves.sql`, `0008_game_shares.sql` (안 했다면)
   - `supabase/migrations/0012_delete_account.sql` — 계정 삭제 기능
2. Vercel → Settings → Environment Variables
   - `NEXT_PUBLIC_CONTACT_EMAIL` = 문의 받을 이메일 (개인정보처리방침에 표시)
   - 저장 후 Redeploy

## 2. 앱 파일(AAB) 만들기 — PWABuilder
1. https://www.pwabuilder.com 에 `https://minigame-on.vercel.app/passport-map` 입력 → Start
2. **Package For Stores → Android → Google Play → Options**
   - Package ID: 예) `kr.minigame.passportmap` (**한 번 정하면 못 바꿈**)
   - App name: `Passport Map`, Launcher name: `Passport Map`
   - Signing key: **Create new** (이름·비밀번호 입력)
3. Download → zip 안의 파일
   - `*.aab` — 플레이 콘솔에 올릴 파일
   - `signing.keystore`, `signing-key-info.txt` — **절대 잃어버리지 말고 안전한 곳에 백업** (업데이트할 때 필요)
   - `assetlinks.json` — 안에 `sha256_cert_fingerprints` 값이 있음

## 3. 도메인 확인 연결 (주소창 없이 전체 화면이 되게)
1. Vercel 환경변수
   - `ANDROID_PACKAGE` = 2단계의 Package ID
   - `ANDROID_SHA256` = assetlinks.json 의 지문 (예: `AB:CD:...` 32쌍)
2. Redeploy 후 `https://minigame-on.vercel.app/.well-known/assetlinks.json` 을 열어 값이 보이는지 확인
3. 플레이 콘솔에 AAB를 올린 뒤 **설정 → 앱 무결성 → 앱 서명 키 인증서 SHA-256** 값을 복사해서
   `ANDROID_SHA256` 에 쉼표로 **추가** (예: `업로드키지문,앱서명키지문`) → Redeploy
   - 이걸 빠뜨리면 플레이에서 받은 앱 상단에 주소창이 보입니다

## 4. 플레이 콘솔 등록 (조직 계정 → 테스터 조건 없음)
1. **앱 만들기**: 이름 `Passport Map - 나의 여행 지도`, 앱(게임 아님), 무료
2. **앱 콘텐츠**
   - 개인정보처리방침: `https://minigame-on.vercel.app/privacy`
   - 광고: 없음 (앱 화면에는 광고를 넣지 않음)
   - 앱 액세스: 로그인 없이 모든 기능 사용 가능 (로그인은 계정 저장용 선택 기능)
   - 콘텐츠 등급 설문: 사용자 생성 콘텐츠(사진·메모 공유 링크) 있음, 폭력·도박 없음
   - 타겟층: 만 14세 이상 (13~15 구간을 포함하면 가족 정책이 붙으니 **18세 이상** 선택을 권장)
   - **데이터 보안**: 아래 표 참고
   - 계정 삭제 URL: `https://minigame-on.vercel.app/account/delete`
3. **스토어 등록정보**: 아래 문구와 `docs/play-store/` 의 이미지 사용
4. **프로덕션 → 새 버전 만들기** → AAB 업로드 → 출시 노트 → 검토 제출 (보통 며칠)

### 데이터 보안 응답 요약
| 데이터 | 수집 | 목적 | 비고 |
|---|---|---|---|
| 이메일 주소 | 예(선택) | 계정 관리 | 이메일 가입 시 |
| 사용자 ID | 예(선택) | 계정 관리 | 카카오 로그인 식별자 |
| 사진 | 예(선택) | 앱 기능 | 사용자가 올린 여행 사진 |
| 기타 사용자 생성 콘텐츠 | 예(선택) | 앱 기능 | 나라·도시·메모·방문 기간 |
| 앱 상호작용 | 예 | 분석 | Google Analytics |
- 전송 중 암호화: 예 (HTTPS) · 데이터 삭제 요청: 예 (`/account/delete`) · 판매/제3자 공유: 아니요
- 사진·메모는 사용자가 "내 지도 링크 만들기"를 눌렀을 때만 링크로 공개

## 스토어 등록정보 문구
**앱 이름 (30자)**
Passport Map - 나의 여행 지도

**간단한 설명 (80자)**
다녀온 나라를 색칠하고 도시마다 사진·방문 기간을 남기는 나만의 여행 세계지도

**자세한 설명**
지금까지 다녀온 나라, 몇 곳인지 세어 본 적 있나요?
Passport Map은 세계지도 위에 다녀온 나라를 원하는 색으로 칠하고, 도시마다 핀을 꽂아 나만의 여행 기록을 만드는 앱이에요.

■ 나라는 색칠, 도시는 핀
· 지도를 눌러 다녀온 나라를 10가지 색 중에서 골라 칠해요
· 서울·도쿄·파리 등 220여 개 도시를 누르거나 검색해서 핀을 찍어요
· 목록에 없는 곳도 지도에서 직접 핀을 찍을 수 있어요

■ 장소마다 사진 한 장과 방문 기간
· 나라·도시마다 사진 1장, 방문 기간, 한 줄 메모를 남겨요
· 지도에서 장소를 누르면 그때 사진이 떠요
· 방문 기간을 넣으면 여행 일수가 자동으로 계산돼요 (겹치는 날은 한 번만)

■ 7가지 지도 테마
여권, 빈티지 고지도, 도트 맵, 3D 지구본, 페이퍼컷 파스텔, 야경 네온 중에서 골라 꾸며요

■ SNS 공유
· 방문 국가·도시 수, 여행 기간 총합, 세계 몇 %를 다녀왔는지 한 장의 이미지로 만들어요
· 정사각·세로·가로 비율로 인스타그램·카카오톡·X에 올리기 좋아요
· 내 지도 전용 링크를 만들어 친구에게 보여줄 수도 있어요

■ 어디서든 이어서
로그인하면 휴대폰·PC 어디서든 같은 지도를 이어서 볼 수 있어요. 로그인 없이도 모든 기능을 쓸 수 있어요.

**카테고리**: 여행 및 지역정보 · **태그**: 여행, 지도, 기록

## 그래픽 파일 (`docs/play-store/`)
- `icon-512.png` — 앱 아이콘 512×512
- `feature-graphic-1024x500.png` — 그래픽 이미지
- `screenshot-1~3.png` — 휴대전화 스크린샷 1080×1920

## 업데이트
- 화면·기능 수정: 웹만 배포하면 앱에 바로 반영 (AAB 재업로드 불필요)
- 앱 이름·아이콘·패키지 설정 변경: PWABuilder 에서 **같은 signing.keystore** 로 다시 빌드, 버전 코드 올려 업로드
