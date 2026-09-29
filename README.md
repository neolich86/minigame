# 미니 게임 천국 · Mini Game Heaven

직접 만든 브라우저 게임 모음 포털 — 로그인(이메일·카카오), 게임별 랭킹, 헥사 아일랜드·타일러쉬 온라인 대전, 한국어/영어 자동 전환.

- Next.js 16 (App Router) + Supabase(Auth · Postgres · Realtime) + Vercel
- 기존 단일 HTML 게임은 `public/games/<id>/index.html`에서 그대로 서빙하고, `public/mgh/bridge.js`로 포털과 연결

```bash
cp .env.local.example .env.local   # Supabase 값 입력 (없어도 게임은 동작)
npm install
npm run dev                        # http://localhost:3000
```

배포·Supabase·카카오 설정은 [docs/setup.md](docs/setup.md)를 보세요.
