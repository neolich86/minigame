# 스포츠 승부 예측 — 데이터 동기화 설정 (M1)

football-data.org 무료 플랜(12개 대회, 분당 10회)의 경기·순위 데이터를 Supabase에 쌓는다.
화면은 이 API를 직접 부르지 않고 DB만 읽는다.

## 1. Supabase

SQL Editor에서 `supabase/migrations/0009_forecast.sql`, `0010_forecast_colors.sql`(팀 대표색) 실행 (여러 번 실행해도 안전).

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
| daily | 매일 KST 05:52 | 최근 2일 ~ 앞으로 7일 경기 + 순위표 + 예측 생성 + 리그 순위 시뮬레이션 (월요일엔 팀 대표색도) |
| results | KST 01:07 / 04:07 / 07:07 | 최근 경기 결과 + 예측 잠금·채점 |
| predict | 수동 실행 | 예측 + 리그 순위 시뮬레이션 다시 (API 호출 없음) |
| teams | 수동 실행 | 팀 목록·대표색 (배지 색) |
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
- `POST ?mode=teams&comp=PL` — 팀 대표색
- `POST ?mode=predict` — 예측 생성(앞으로 8일)·킥오프 지난 예측 잠금·끝난 경기 채점·레이팅 스냅샷 (API 호출 없음)
- `POST ?mode=sims[&n=10000]` — 리그 8개 남은 경기 몬테카를로 → `fc_league_sims` (API 호출 없음)
- `GET ?mode=status` — 적재 현황

API 오류(403·429 등)는 HTTP 200 + `{ ok:false, status }` 로 돌려준다.

## 테스트

`npm run test:forecast` — API 클라이언트·스코어 변환·모델 단위 테스트 + 가짜 DB로 예측 생성·잠금·채점 흐름 검증

## 5. 모델 백테스트 (M2)

Actions → **forecast-backtest** → Run workflow. 약 5분.

- 사이트의 `GET /api/forecast/export`(Bearer CRON_SECRET)로 끝난 경기를 받아 `scripts/backtest.mts` 실행
- 첫 시즌은 워밍업, 두 번째 시즌으로 파라미터를 고르고(튜닝), 그 뒤 시즌은 고른 값으로 채점만 한다(홀드아웃)
- 실행 Summary: 기준선·Elo·포아송·합친 모델 비교, 대회별 성적, 보정표, 고른 파라미터
- 아티팩트 `forecast-backtest`: `backtest.md`, `best-params.json`

로컬 확인: `npm run backtest -- --synthetic` (진짜 강도를 알고 있는 합성 리그로 모델 점검)

## 6. 화면 (M3)

| 주소 | 내용 |
|---|---|
| `/apps/sports-forecast` | 경기 목록 (`?d=today|tomorrow|weekend|week|past`, `&c=PL`) |
| `/apps/sports-forecast/match/<id>` | 경기 상세 — 확률, 예상 득점, TOP 5 스코어, 예측 근거, 레이팅 추이, 맞대결 |
| `/apps/sports-forecast/league/<code>` | 순위표 + 팀 레이팅 + 다가오는 경기 |
| `/apps/sports-forecast/accuracy` | 운영 성적 + 과거 시즌 검증 |

- 서버 페이지가 데이터를 읽고(공개 읽기 키), 화면은 클라이언트 컴포넌트가 그린다 → 상단 KO/EN 전환이 바로 반영
- 구단 엠블럼 대신 약자(TLA) + 구단 대표색 배지. 대표색이 없으면 팀 id 로 고른 기본색
- 포털 `/apps` 목록·사이트맵에 노출 (`games.ts` 의 `sports-forecast`, 정적 경로가 `/apps/[slug]` 보다 우선)
- 출처 표기는 football-data.org 약관 7.1 문구 그대로: "Football data provided by the Football-Data.org API"
