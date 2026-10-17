-- 탐험 지도 랭킹 보드 추가
-- 점수 = 밝힌 칸 수 (H3 해상도 10 육각형). 저장은 game_saves(game_id = 'explore-map') 를 그대로 쓴다.
-- SQL Editor에 붙여 넣고 Run (여러 번 실행해도 안전)
insert into public.ranked_boards (game_id, min_score, max_score, min_interval_ms) values
  ('explore-map', 1, 10000000, 1500)
on conflict (game_id) do update
  set min_score = excluded.min_score, max_score = excluded.max_score, min_interval_ms = excluded.min_interval_ms;
