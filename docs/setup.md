# 미니게임천국 v2 — 배포·서버 설정 가이드

GitHub(`neolich86/minigame`) → Vercel 자동 배포, 계정·랭킹·온라인 방은 Supabase를 씁니다.
환경변수가 없어도 사이트와 게임은 전부 동작하고, 로그인·랭킹·온라인 대전만 "서버 설정 필요" 안내로 바뀝니다.

**순서가 중요합니다**: 카카오·Supabase 둘 다 실제 서비스 주소가 필요하므로 Vercel로 주소를 먼저 확보합니다.

---

## 0. Vercel 배포

1. [vercel.com](https://vercel.com) → GitHub 계정으로 로그인 → **Add New → Project**
2. `neolich86/minigame` 선택 → Import (Framework: Next.js 자동 인식, 빌드 설정은 그대로)
   - v2 코드는 `portal-v2` 브랜치에 있습니다. `main`에 합치기 전이라면 **Settings → Git → Production Branch**를 `portal-v2`로 바꾸거나, 합친 뒤 배포하세요.
   - ⚠️ 지금 EdgeOne(`game-zip.edgeone.dev`)이 이 리포의 `main`을 배포하고 있다면, Vercel 주소가 준비된 뒤에 `main`에 합치세요 (합치면 EdgeOne의 정적 사이트는 더 이상 동작하지 않습니다).
3. 환경변수는 일단 비워두고 **Deploy** → 할당된 주소 확인 (예: `https://minigame-on.vercel.app`)
4. 이후 브랜치에 push할 때마다 자동 재배포됩니다.

## 1. Supabase

**렉시오 온라인과 같은 Supabase 프로젝트를 그대로 써도 됩니다** (포털 공용 계정 = 같은 `profiles` 테이블). 새 테이블/함수는 `leaderboard`, `ranked_boards`, `mg_*` 이름이라 렉시오와 충돌하지 않습니다.
새로 만든다면 [supabase.com](https://supabase.com) → New project (리전 Seoul 권장).

1. 왼쪽 **SQL Editor → New query** 에서 아래 파일을 **순서대로** 하나씩 통째로 붙여 넣고 **Run** (모두 재실행 안전)
   1. `supabase/migrations/0001_portal.sql` — 공용 프로필 · 랭킹 · 헥사 아일랜드 온라인 방 (`leaderboard`, `ranked_boards`, `mg_*`)
   2. `supabase/migrations/0002_td_ranking.sql` — 랜덤 타워 디펜스 · Element Siege 랭킹 보드
   3. `supabase/migrations/0003_lexio_online.sql` — 타일러쉬 온라인 (`rooms`, `room_members`, `game_states`, `game_public`)
   4. `supabase/migrations/0004_room_delete.sql` — 방장의 방 삭제 기능
   5. `supabase/migrations/0005_dragon_call.sql` — 드래곤 콜 온라인 방 허용 (4인 2:2 팀전)
   6. `supabase/migrations/0006_mypost.sql` — My Post 2026 공유 리포트 (`mypost_reports` 테이블, `mypost` 이미지 버킷)
   7. `supabase/migrations/0007_game_saves.sql` — 로그인 사용자 게임 저장 (`game_saves` 테이블, 비공개 `game-files` 버킷) — 발자국 지도의 지도·사진 저장
2. **Project Settings → API (API Keys)** 에서 복사
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon(또는 publishable) 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - ⚠️ `service_role` / secret 키는 절대 `NEXT_PUBLIC_` 변수에 넣지 마세요 (브라우저에 노출됨)
   - My Post 2026 공유 기능만 서버 전용 변수 `SUPABASE_SERVICE_ROLE_KEY`에 service_role(secret) 키를 씁니다 (서버에서만 읽힘)
3. **Database → Publications(Replication)** 에서 `supabase_realtime`에 `mg_rooms`, `mg_room_members`가 포함됐는지 확인 (SQL이 자동으로 추가함)

### 이메일 로그인
1. **Authentication → Sign In / Providers → Email** → Enable
2. "Confirm email"
   - 켜두면(권장) 가입 시 인증 메일의 링크를 눌러야 로그인됩니다
   - 끄면 가입 즉시 로그인됩니다
3. 기본 메일 발송은 시간당 몇 통으로 제한됩니다. 사용자가 늘면 **Authentication → Emails → SMTP Settings**에 Resend/SendGrid 등 SMTP를 연결하세요.

### 주소 설정 (카카오·이메일 공통)
**Authentication → URL Configuration**
- Site URL: `https://<Vercel 주소>`
- Redirect URLs에 추가:
  - `https://<Vercel 주소>/**`
  - `http://localhost:3000/**`
  - (도메인을 연결하면 `https://<도메인>/**` 도 추가)
  - 로그인 후 돌아오는 주소는 `/auth/callback?next=...` 입니다

## 2. 카카오 로그인

렉시오 온라인에서 이미 카카오 앱을 이 Supabase 프로젝트에 연결했다면 **2-2, 2-3만** 하면 됩니다.

1. [developers.kakao.com](https://developers.kakao.com) → 내 애플리케이션 → 애플리케이션 추가 (앱 이름: 미니게임천국)
   - **앱 키 → REST API 키** 복사
   - **카카오 로그인 → 활성화 ON**
   - **카카오 로그인 → 보안 → Client Secret** 생성 → 사용함
   - **카카오 로그인 → 동의항목**: 닉네임(profile_nickname) 설정. 이메일 동의를 받지 않으려면 Supabase Kakao 설정의 "Allow users without an email"을 켜세요
2. **플랫폼 → Web** 사이트 도메인에 `https://<Vercel 주소>`, `http://localhost:3000` 추가 (도메인 연결 시 그 주소도)
3. **카카오 로그인 → Redirect URI**: `https://<Supabase 프로젝트 ref>.supabase.co/auth/v1/callback`
4. Supabase **Authentication → Sign In / Providers → Kakao** → Enable → Client ID(REST API 키) / Client Secret 입력 → Save

## 3. 환경변수 등록

- **Vercel → Settings → Environment Variables**
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SITE_URL` = 실제 서비스 주소 (canonical·OG·sitemap에 쓰임)
  - My Post 2026 (인스타 연말 결산)
    - `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET` = 메타 앱 → Instagram → "Instagram 로그인을 사용한 API 설정" 화면의 Instagram 앱 ID/시크릿
    - `SUPABASE_SERVICE_ROLE_KEY` = Supabase service_role(secret) 키 — 없으면 리포트가 저장되지 않고 그 탭에서만 보임 (공유 링크 없음)
    - 메타 앱 비즈니스 로그인 설정: 리디렉션 `…/api/mypost/callback`, 승인 취소 `…/api/mypost/deauthorize`, 데이터 삭제 `…/api/mypost/data-deletion`
- 등록 후 **Deployments → 최신 배포 → ⋯ → Redeploy** (`NEXT_PUBLIC_` 변수는 빌드 때 들어가므로 재배포 필수)
- 로컬: `.env.local.example`을 `.env.local`로 복사해 값 입력 → `npm install` → `npm run dev`

## 4. 확인 순서

1. 포털 첫 화면이 브라우저 언어에 따라 한국어/영어로 뜨는지 (오른쪽 위 KO/EN으로 바꿔도 됨)
2. **로그인** → 이메일 가입/로그인, 카카오 로그인 → 오른쪽 위에 닉네임 표시
3. **내 정보**에서 닉네임 변경
4. 랭킹 게임(무기 강화가 가장 빠름: Lv.2 이상 도달) → "새 기록!" 알림 → 오른쪽 랭킹 패널과 `/ranking`에 표시
5. **헥사 아일랜드 → 온라인 대전 → 방 만들기** → 다른 브라우저(시크릿 창)에서 다른 계정으로 코드 입력해 참가 → 준비 → 방장이 시작
   - 빈 자리는 방장이 "AI로 채우기"
   - 게임 중 참가자가 나가면 방장이 "AI로 대체" 가능, 다시 들어오면 자리 복귀
   - 방장이 새로고침해도 저장된 상태에서 이어짐. 방장이 45초 이상 사라지면 다른 참가자가 "내가 방장 이어받기"

## 5. 도메인 연결 (선택)

Vercel → Settings → Domains에서 도메인 추가 → 안내대로 DNS 설정 → 위의 Supabase Redirect URLs · 카카오 Web 도메인 · `NEXT_PUBLIC_SITE_URL`을 새 주소로 추가/변경.

---

## 게임 이름 참고
저작권·상표 문제로 화면에 보이는 이름을 바꿨고, 주소와 DB의 내부 id는 기존 그대로입니다.
- 헥사 아일랜드(Hexa Isle) = `catan` · 타일러쉬(Tile Rush) = `lexio` · 스카이 스트라이크(Sky Strike) = `raiden`

## 구조 요약

| 경로 | 내용 |
|---|---|
| `/` | 게임 목록 (장르 필터, 온라인·랭킹 배지, 내 최고 기록) |
| `/play/<게임>` | 게임 플레이 + 랭킹 패널 |
| `/online/catan`, `/online/lexio`, `/online/<게임>/<코드>` | 온라인 대전 로비 · 방 |
| `/ranking` | 전체 랭킹 |
| `/login`, `/me` | 로그인(이메일·카카오), 내 정보 |
| `public/games/<게임>/index.html` | 기존 단일 HTML 게임 (그대로 서빙) |
| `public/mgh/bridge.js` | 모든 게임 공용 브리지 — 언어 맞춤, 점수 제출, 온라인 통신 |
| `public/mgh/i18n/<게임>.js` | 한국어 전용 게임의 영어 사전 |
| `supabase/migrations/0001_portal.sql` | DB 스키마·RPC·RLS |

### 다국어
- 서버는 `Accept-Language`, 브라우저는 `navigator.languages`로 판단 (한국어면 ko, 아니면 en). 직접 바꾸면 쿠키 `mgh_lang`에 저장
- 자체 다국어가 있는 게임(오리파·타일러쉬·랜타디·Element Siege·세계도시 타이핑)은 브리지가 브라우저 언어를 포털 언어로 맞춰서 그대로 따라감
- 한국어 전용 게임(헥사 아일랜드·무기 강화·궁수 서바이버·스카이 스트라이크·로또·핀볼)은 `/mgh/i18n/<게임>.js` 사전으로 화면·캔버스 글자를 번역. 번역이 빠진 문구는 개발자 도구 콘솔에서 `MGH.missing()`으로 확인

### 랭킹 추가하는 법
1. 게임 코드에서 기록이 나오는 곳에 `if (window.MGH) MGH.submitScore('<보드id>', 점수, {추가정보})`
2. `supabase/migrations/0001_portal.sql`의 `ranked_boards` insert에 보드 한 줄 추가 (점수 범위·최소 제출 간격) → SQL 재실행
3. `src/lib/games.ts`의 해당 게임에 `boards` 추가
- 점수는 높을수록 좋은 기준입니다 (시간이 짧을수록 좋은 게임은 "점수 = 기준값 − 시간"처럼 변환)
- 게임은 브라우저에서 돌아가므로 서버는 범위·빈도만 검사합니다. 조작을 완전히 막을 수는 없습니다

### 타일러쉬 온라인 방식 (내부 id: lexio)
- 규칙 판정·AI는 전부 DB 함수(서버)가 처리. 화면은 공개 상태(`game_public`)와 내 손패(`get_my_hand`)만 받아 그림 → 손패가 다른 사람에게 노출되지 않음
- 기존 lexio-online 앱과 같은 테이블을 쓰므로, 같은 Supabase 프로젝트라면 두 사이트의 방이 공유됨

### 타워 디펜스 랭킹
- 점수 = 도달 라운드 × 1,000,000 + (999,999 − 실제 플레이 시간(초)) → 라운드가 높을수록, 같으면 시간이 짧을수록 위
- 플레이 시간은 배속과 관계없는 실제 시간. 세이브 코드로 불러온 판은 랭킹에 등록하지 않음
- Element Siege 50라운드 클리어는 '클리어'로 표시(내부 값 51)

### 헥사 아일랜드 온라인 방식 (내부 id: catan)
- 방장 브라우저가 기존 규칙 엔진을 그대로 돌리고, Supabase Realtime으로 상태(방장→모두)와 행동(참가자→방장)을 주고받습니다
- 방장은 2초마다 스냅샷을 `mg_room_states`에 저장 → 새로고침·방장 교체 시 이어서 진행
- 한계: 방장이 마음먹으면 조작할 수 있고, 모든 참가자의 손패 정보가 상태에 포함됩니다 (친구끼리 플레이 전제)
