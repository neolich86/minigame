---
paths:
  - "public/games/**"
  - "src/lib/games.ts"
  - "src/lib/seo.ts"
---
# 웹 게임 작업 규칙 (미니게임천국)

## 구조
- 게임 하나 = `public/games/<id>/` 폴더. `index.html`(HUD·CSS) + `game.js`(화면·입력) + `core.js`(규칙·수치·전투, DOM 없이 node에서도 돌아가게).
- `index.html` 맨 위에 `<script src="/mgh/bridge.js"></script>` 와 `<link rel="canonical" href="/play/<id>">`.
- three.js는 `/games/wizard/vendor/` 것을 import map으로 공유. 새로 받지 말 것.
- 폰트는 픽셀 게임이면 Galmuri(OFL, `/games/isekai-hero/assets/`).
- `?test` 로 열면 `window.__<짧은이름>` 테스트 훅(상태 읽기, update(dt), 강제 진행)을 노출.
- 저장: localStorage + 로그인 시 `MGH.save` (games.ts 에 `saves: true`). 랭킹은 `MGH.submitScore` + supabase `ranked_boards` 마이그레이션.

## 화면
- 모바일 세로 우선(390×844 기준), `env(safe-area-inset-*)` 처리, 위 HUD·아래 버튼에 전투가 가리지 않게.
- 메뉴·HUD 글자는 11px 이상(Impeccable 기준), 버튼 터치 영역 44px 이상.
- 완료라고 말하기 전에 `/verify-game` 으로 확인.
- 한국어 문구는 짧고 친절하게. 받침에 따라 '로/으로' 맞추기.

## 에셋
- 쓰기 전에 라이선스 확인: 압축 안 License/Readme → 없으면 제작자 페이지. 상업 사용(광고 포함)이 불명확하면 쓰지 말고 사용자에게 알림.
- 확인한 라이선스는 프로젝트 문서(명세)의 "에셋" 칸에 적음.
- 라그나로크 등 기존 게임 이름·그림을 그대로 쓰지 않음.

## 배포
- 새 게임은 `src/lib/games.ts` 에 `hidden: true` 로 먼저 올림(관리자만 목록에 보임). 사용자가 확인한 뒤 공개.
- 커밋 → `git pull --rebase origin main` → `git push origin HEAD:main` → 커밋 상태(배포) 확인.
- 비밀 키·서명 키(.jks/.keystore)·관리자 이메일·외부 API 키는 절대 커밋하지 않음 (공개 저장소, GitHub Secrets 사용).
