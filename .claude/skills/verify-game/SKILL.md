---
name: verify-game
description: "미니게임천국 게임이 실제로 뜨고 플레이되는지 브라우저로 확인할 때. 만들거나 고친 뒤 '다 됐다'고 말하기 전에 항상. 서버 띄우기 → 모바일 화면으로 열기 → 핵심 동작 3개 → 스크린샷 → 정리."
argument-hint: "[게임 id] [확인할 동작]"
---
# Verify Game (실행 확인)

OpenMausBot(Apache-2.0)의 create-verification-skill 방식(실행 → 준비 신호 → 핵심 동작 → 증거 → 정리)을 미니게임천국에 맞게 고정한 것.

## 1. 띄우기
- `public/` 을 정적 서버로: `cd public && python3 -m http.server <빈 포트> &` (Next 빌드 필요 없음). 끝나면 **내가 띄운 프로세스만** 종료.
- Playwright(설치된 것 사용, 다시 설치 금지)로 `http://localhost:<포트>/games/<id>/index.html?test`.
- 모바일 390×844 (사용자에게 보낼 사진은 deviceScaleFactor 2). three.js 게임은 `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`.

## 2. 준비 신호
- 로딩 화면이 사라지고 시작 화면(직업·영웅 선택 등)이 보이는 것, 그리고 `window.__<id>` 테스트 훅이 있는 것.
- `pageerror` · console error 수집 (bridge.js 의 POST 501 은 로컬 서버라 무시).

## 3. 핵심 동작 (게임마다 3개 이하로 정해 둠)
1. 시작 → 첫 플레이 화면이 뜬다 (HUD 수치 확인).
2. 이 게임의 핵심 행동 1번 (공격·건설·구매 등) → 수치나 화면이 바뀐다.
3. 방금 고친 기능 → 기대한 결과가 보인다.
각각 스크린샷 + 훅으로 읽은 상태(JSON 한 줄)를 증거로 남긴다.

## 4. 판정
- ✅ 세 동작 모두 증거 있음 + 에러 0 → 완료라고 말해도 됨.
- ❌ 하나라도 실패 → 원인을 고치고 다시 1번부터. 고칠 수 없으면 무엇이 안 되는지 그대로 보고.
- 실제 사이트(playwithme.kr)는 여기서 열 수 없으니 "로컬 확인"이라고 밝힌다.

## 5. 정리
- 띄운 서버·브라우저 종료, 스크린샷은 스크래치 폴더에(저장소에 넣지 않음).
