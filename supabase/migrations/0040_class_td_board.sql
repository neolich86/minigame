-- 직업 디펜스 — 도달 라운드 랭킹 보드
-- 점수 = 도달 라운드 × 1,000,000 + (999,999 − 게임 시간(초))
--   → 라운드가 높을수록, 같은 라운드면 시간이 짧을수록 순위가 높다.
-- SQL Editor에 붙여 넣고 Run (여러 번 실행해도 안전)
insert into public.ranked_boards (game_id, min_score, max_score, min_interval_ms) values
  ('class-td', 1000000, 10000999999, 5000)
on conflict (game_id) do update
  set min_score = excluded.min_score, max_score = excluded.max_score, min_interval_ms = excluded.min_interval_ms;
