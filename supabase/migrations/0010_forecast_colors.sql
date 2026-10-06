-- 스포츠 승부 예측 — 팀 대표색 (엠블럼 대신 약자 + 색 배지로 표시)
-- SQL Editor에 붙여 넣고 Run (여러 번 실행해도 안전)
alter table public.fc_teams add column if not exists club_colors text;   -- football-data.org clubColors 원문 (예: "Red / White")
