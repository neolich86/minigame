---
name: prototype
description: "명세나 아이디어로 실제 플레이되는 웹 게임 첫 버전을 만들 때. 먼저 샘플 스크린샷으로 방향을 확인받고, 확인되면 public/games/<id>/ 에 만들어 숨김 상태로 배포."
argument-hint: "[게임 이름]"
---
# Prototype (웹 게임 첫 버전)

Claude Code Game Studios(MIT)의 prototype을 미니게임천국 방식으로 고친 것. 규칙은 `.claude/rules/web-games.md`.

## 1. 샘플 (사용자가 아직 화면을 못 봤으면)
- 작업 폴더(스크래치)에 정적 HTML 샘플을 만들어 Playwright로 모바일(390×844, deviceScaleFactor 2) 스크린샷 3~5장 → SendUserFile.
- "이 방향 맞나요?"를 확인받는다. 고칠 점을 받으면 샘플만 고친다.

## 2. 첫 버전
- `public/games/<id>/` 에 `core.js`(규칙·수치·전투, DOM 없음) / `game.js`(그리기·입력·HUD·저장) / `index.html`.
- 에셋은 필요한 것만 복사·압축(png 양자화, glb는 gltf-transform dedup/prune/quantize — 스킨 모델은 quantize 금지).
- `?test` 훅을 꼭 만든다: 상태 읽기, `update(dt)` 수동 진행, 강제 이벤트(웨이브 시작, 보스 등).
- `src/lib/games.ts` 에 `hidden: true` 로 등록(썸네일 `public/thumbs/<id>.jpg` 636×1048).

## 3. 스스로 확인 (사용자에게 넘기기 전)
- 로컬 서버(`python3 -m http.server`로 public/ 제공) + Playwright로 시작 화면 → 플레이 → 핵심 기능 스크린샷. 콘솔 에러 0개.
- WebGL은 `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`.
- 연속 캡처로 움직임 확인(`/playtest-report` 방식), 밸런스는 `/balance-check`.
- 크기·방향·가림(HUD에 가리는지)을 꼭 본다.

## 4. 배포 · 전달
- 커밋(설명은 한국어, 무엇이 됐는지) → pull --rebase → push → 배포 상태 success 확인.
- 명세 문서의 버전 기록 갱신.
- 사용자에게: 스크린샷 3~4장 + 들어간 것 + 확인 필요한 점(라이선스, 부족한 그림) + 주소(/play/<id>, 숨김).
