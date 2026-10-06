# 킥오프 예측 — 데이터 동기화 설정 (M1)

football-data.org 무료 플랜(12개 대회, 분당 10회)의 경기·순위 데이터를 Supabase에 쌓는다.
화면은 이 API를 직접 부르지 않고 DB만 읽는다.

## 1. Supabase

SQL Editor에서 `supabase/migrations/0009_forecast.sql` 실행 (여러 번 실행해도 안전).

생기는 테이블: `fc_competitions`(12개 대회 기본 입력) · `fc_teams` · `fc_matches` · `fc_standings` ·
`fc_predictions`(킥오프 후 확률 수정 금지 트리거) · `fc_ratings` · `fc_league_sims` · `fc_sync_log`

## 2. Vercel 환경변수

| 이름 | 값 |
|---|---|
| `FOOTBALL_DATA_TOKEN` | football-data.org 가입 메일로 받은 토큰 |
| `CRON_SECRET` | 아무 긴 임의 문자열 (예: 비밀번호 생성기 40자) |
| `SUPABASE_SERVICE_ROLE_KEY` | 이미 My Post 2026 때문에 등록되어 있음 |

추가 후 재배포해야 적용된다.

## 3. GitHub Actions

저장소 → Settings → Secrets and variables → Actions

- **Secrets** → `CRON_SECRET` : Vercel 과 같은 값
- (선택) **Variables** → `FORECAST_SITE_URL` : 기본값 `https://minigame-on.vercel.app`

워크플로 `.github/workflows/forecast-sync.yml`

| 작업 | 언제 | 내용 |
|---|---|---|
| daily | 매일 KST 05:52 | 최근 2일 ~ 앞으로 7일 경기 + 리그 8개·챔스 순위표 (API 10회) |
| results | KST 01:07 / 04:07 / 07:07 | 최근 2일 ~ 내일 경기 결과 (API 1회) |
| backfill | 수동 실행 | 대회별 과거 시즌 전체 경기 적재 |

### 처음 한 번: backfill 실행

Actions → forecast-sync → Run workflow → job = `backfill` (기본: 리그 8개 + 챔스, 6시즌).
약 7분 걸린다. 실행 요약(Summary)에 대회·시즌별 결과표가 나온다.

- ✅ = 적재됨, ❌ 403 = 무료 플랜으로 받을 수 없는 시즌
- 이 표가 곧 "무료 키로 몇 시즌 전까지 받아지는가"의 답이다. 모델 학습에 최소 2~3시즌이 필요하다.

## 4. 확인

```bash
curl -H "Authorization: Bearer $CRON_SECRET" "https://minigame-on.vercel.app/api/forecast/sync?mode=status"
```

대회·시즌별 경기 수(전체/끝난 경기), 팀 수, 최근 동기화 기록 30건이 나온다.

## API 라우트

`/api/forecast/sync` (Authorization: Bearer CRON_SECRET)

- `POST ?mode=recent&back=2&ahead=7` — 날짜 범위 경기 (전 대회, 범위 최대 10일)
- `POST ?mode=season&comp=PL&season=2024` — 한 시즌 전체 (season = 시작 연도)
- `POST ?mode=standings&comp=PL` — 순위표
- `GET ?mode=status` — 적재 현황

API 오류(403·429 등)는 HTTP 200 + `{ ok:false, status }` 로 돌려준다.

## 테스트

`npm run test:forecast` — 가짜 fetch로 클라이언트·스코어 변환(연장·승부차기 90분 스코어 분리) 검증
