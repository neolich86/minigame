-- 블랙잭 랭킹 보드 추가
-- 점수 = 최고 잔액(원). 시작 금액 100만 원 이상일 때만 등록한다.
-- SQL Editor에 붙여 넣고 Run (여러 번 실행해도 안전)
insert into public.ranked_boards (game_id, min_score, max_score, min_interval_ms) values
  ('blackjack', 1000000, 1000000000000000, 1500)
on conflict (game_id) do update
  set min_score = excluded.min_score, max_score = excluded.max_score, min_interval_ms = excluded.min_interval_ms;
