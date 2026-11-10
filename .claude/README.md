# 미니게임천국 게임 스튜디오 설정

[Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) (MIT, © 2026 Donchitos), [Impeccable](https://github.com/pbakaus/impeccable) (Apache-2.0, 원본 그대로 `skills/impeccable`), [OpenMausBot](https://github.com/milind-soni/OpenMausBot) (Apache-2.0, 검증 방식만 참고)에서
웹 게임(HTML5 · Canvas · three.js)에 맞는 것만 골라 고친 설정입니다. 엔진(Godot·Unity·Unreal)용 부분은 뺐습니다.

## 순서
`/brainstorm` → `/quick-design` → `/prototype` → `/balance-check` → `/playtest-report` → `/release-checklist`

| 명령어 | 하는 일 | 결과 |
|---|---|---|
| /brainstorm | 아이디어 3~5개 → 하나 고르기 | 한 페이지 콘셉트 |
| /quick-design | 짧은 기획서 (규칙·성장·화면·에셋) | 프로젝트 문서 `claude/<게임>-명세.md` |
| /prototype | 샘플 스크린샷 → 확인 → 플레이 가능한 첫 버전 (숨김) | `public/games/<id>/` |
| /balance-check | core.js 봇 시뮬로 진행 속도·난이도 점검 | 수치 표 + 고칠 값 |
| /playtest-report | 화면 연속 캡처로 어색한 움직임·겹침·가림 찾기 | 문제 목록 + 수정 |
| /release-checklist | 포털 등록·라이선스·썸네일·SEO·배포 점검 후 공개 | 체크 결과 |
| /verify-game | 서버 띄우기 → 모바일 화면 → 핵심 동작 3개 → 스크린샷 (완료라고 하기 전에 항상) | 증거 스크린샷 |
| /impeccable | 메뉴·HUD·버튼·선택 화면 디자인 다듬기 (`polish`, `bolder`, `critique`, `audit`, `typeset`, `animate` …) | 고친 화면 |

## 디자인 점검 (Impeccable, Apache-2.0, pbakaus/impeccable)
- 게임 UI 파일(html·css·js)을 고칠 때마다 자동으로 디자인 규칙 62개를 검사해 결과를 알려 줌 (막지 않음).
- 처음 쓸 때 `/impeccable init` 으로 PRODUCT.md(누구를 위한 게임인지) 작성 → 이후 명령이 참고.
- 플레이 화면(캔버스·3D)이 아니라 그 위의 메뉴·HUD·버튼에 적용.

## 역할 (agents)
- `game-designer` — 규칙·성장·경제 설계, 밸런스 수치
- `gameplay-programmer` — 웹 게임 구현 (core.js / game.js 분리)
- `qa-tester` — 브라우저 테스트, 스크린샷 점검, 버그 정리
- `impeccable-*` — 디자인 마무리 리뷰·디자인 시스템 기록·에셋 정리 (Impeccable)

## 규칙
- `rules/web-games.md` — `public/games/**` 작업 때 지키는 방식
- `hooks/commit-warn.sh` — 커밋 전에 비밀 키·서명 파일·라이선스 빠짐을 **경고만** 함 (막지 않음)
