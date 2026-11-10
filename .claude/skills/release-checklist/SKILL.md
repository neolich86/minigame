---
name: release-checklist
description: "숨겨 둔 게임을 게임 목록에 공개하기 전, 또는 앱(구글 플레이·앱인토스)으로 낼 때 빠진 것이 없는지 점검."
argument-hint: "[게임 id] [web|app]"
---
# Release Checklist (미니게임천국)

Claude Code Game Studios(MIT)의 release-checklist를 미니게임천국 포털·앱 출시용으로 바꾼 것. 점검 결과를 ✅/⚠️/❌ 표로 보여 주고, 사용자가 "공개"라고 하면 그때 `hidden` 을 뺀다.

## 웹 공개
- [ ] 에셋 라이선스 전부 확인됨(상업·광고 사용 가능) — 명세 "에셋" 칸
- [ ] 다른 게임 이름·그림 그대로 쓴 것 없음
- [ ] `src/lib/games.ts`: title/desc(ko·en) · genre · thumb · src · saves · boards
- [ ] 썸네일 `public/thumbs/<id>.jpg` 636×1048, 실제 플레이 화면
- [ ] `src/lib/seo.ts`: GAME_SEO 항목(title·h1·description·keywords·about·howTo·tags, ko·en) + HOME_SECTIONS 묶음
- [ ] 랭킹을 쓰면 supabase 마이그레이션(ranked_boards) 파일 + 사용자에게 실행 안내
- [ ] 모바일 390×844, 작은 폰 360×740 에서 HUD 안 잘림 · 콘솔 에러 0
- [ ] 첫 로딩 크기(assets 합계) 확인, 5MB 넘으면 줄일 곳 제안
- [ ] 저장/불러오기(localStorage, 로그인 시 계정) 동작
- [ ] `npx tsc --noEmit` 통과
- [ ] `hidden: true` 제거 → 커밋 → 배포 success

## 앱 (추가)
- [ ] `android-<id>/` Capacitor 프로젝트, 패키지명, versionCode 올림
- [ ] AdMob 실제 ID는 사용자가 준 값만, 서명 키는 GitHub Secrets
- [ ] `src/lib/appPaths.ts`, `src/app/<id>-app/page.tsx`
- [ ] 스토어 자료: 아이콘 512, 그래픽 1024×500, 스크린샷 5장, 설명문
- [ ] Play Console 안내(콘텐츠 등급, 데이터 보안, 로그인 필요 여부)
