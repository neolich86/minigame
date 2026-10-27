-- 포션 공방 랭킹 보드 2개
-- potion-daily: 오늘의 포션 — 점수 = 날짜(YYYYMMDD)×1,000,000 + (999,999 − (이동×1000 + 초)). 같은 날 안에서는 적은 이동·빠른 시간이 위.
-- potion-rep:   공방 평판(누적 ⭐)
-- SQL Editor에 붙여 넣고 Run (여러 번 실행해도 안전)
insert into public.ranked_boards (game_id, min_score, max_score, min_interval_ms) values
  ('potion-daily', 20260101000000, 99991231999999, 1500),
  ('potion-rep',   1,              100000000,      1500)
on conflict (game_id) do update
  set min_score = excluded.min_score, max_score = excluded.max_score, min_interval_ms = excluded.min_interval_ms;
