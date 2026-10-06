-- 스포츠 승부 예측 (sports-forecast) — 축구 경기 데이터·예측 저장
-- SQL Editor에 붙여 넣고 Run (여러 번 실행해도 안전)
-- 쓰기는 서버(API, service role 키)만 한다. 읽기는 누구나 (로그인 불필요).
-- 데이터 출처: football-data.org 무료 플랜 (12개 대회)

/* ───────────── 대회 ───────────── */
create table if not exists public.fc_competitions (
  code text primary key,                   -- PL, PD, BL1 ... (football-data.org 코드)
  fd_id int,                               -- football-data.org competition id
  name text not null,
  name_ko text,
  area text,
  type text,                               -- LEAGUE / CUP
  current_season int,                      -- 시즌 시작 연도 (2026/27 → 2026)
  home_adv real,                           -- 리그별 홈 어드밴티지 (M2 모델이 채움)
  updated_at timestamptz not null default now()
);

insert into public.fc_competitions (code, name, name_ko, area, type) values
  ('PL',  'Premier League',          '프리미어리그',       'England',       'LEAGUE'),
  ('PD',  'Primera Division',        '라리가',             'Spain',         'LEAGUE'),
  ('BL1', 'Bundesliga',              '분데스리가',         'Germany',       'LEAGUE'),
  ('SA',  'Serie A',                 '세리에A',            'Italy',         'LEAGUE'),
  ('FL1', 'Ligue 1',                 '리그1',              'France',        'LEAGUE'),
  ('PPL', 'Primeira Liga',           '프리메이라리가',     'Portugal',      'LEAGUE'),
  ('DED', 'Eredivisie',              '에레디비시',         'Netherlands',   'LEAGUE'),
  ('ELC', 'Championship',            '챔피언십',           'England',       'LEAGUE'),
  ('CL',  'UEFA Champions League',   'UEFA 챔피언스리그',  'Europe',        'CUP'),
  ('EC',  'European Championship',   '유로',               'Europe',        'CUP'),
  ('WC',  'FIFA World Cup',          '월드컵',             'World',         'CUP'),
  ('CLI', 'Copa Libertadores',       '코파 리베르타도레스', 'South America', 'CUP')
on conflict (code) do update set name_ko = excluded.name_ko;

/* ───────────── 팀 ───────────── */
create table if not exists public.fc_teams (
  id int primary key,                      -- football-data.org team id
  name text not null,
  short_name text,
  tla text,
  crest_url text,
  name_ko text,                            -- 한국어 이름 (사전 또는 수동)
  updated_at timestamptz not null default now()
);

/* ───────────── 경기 ───────────── */
create table if not exists public.fc_matches (
  id int primary key,                      -- football-data.org match id
  competition text not null references public.fc_competitions(code),
  season int not null,                     -- 시즌 시작 연도
  matchday int,
  stage text,                              -- REGULAR_SEASON, LEAGUE_STAGE, LAST_16 ...
  group_name text,
  utc_date timestamptz not null,
  status text not null,                    -- SCHEDULED/TIMED/IN_PLAY/PAUSED/FINISHED/POSTPONED/SUSPENDED/CANCELLED/AWARDED
  home_id int references public.fc_teams(id),
  away_id int references public.fc_teams(id),
  home_score int,                          -- 최종 스코어 (연장 포함, 승부차기 제외)
  away_score int,
  home_score_90 int,                       -- 90분 스코어 (예측 채점·모델 학습은 이 값 기준)
  away_score_90 int,
  duration text,                           -- REGULAR / EXTRA_TIME / PENALTY_SHOOTOUT
  winner text,                             -- HOME_TEAM / AWAY_TEAM / DRAW (최종 기준)
  fd_updated timestamptz,                  -- API의 lastUpdated
  updated_at timestamptz not null default now()
);

create index if not exists fc_matches_date_idx on public.fc_matches (utc_date);
create index if not exists fc_matches_comp_season_idx on public.fc_matches (competition, season);
create index if not exists fc_matches_home_idx on public.fc_matches (home_id, utc_date);
create index if not exists fc_matches_away_idx on public.fc_matches (away_id, utc_date);

/* ───────────── 순위표 (API 원본 그대로) ───────────── */
create table if not exists public.fc_standings (
  competition text not null references public.fc_competitions(code),
  season int not null,
  data jsonb not null,                     -- standings 배열 (stage/type/group/table)
  updated_at timestamptz not null default now(),
  primary key (competition, season)
);

/* ───────────── 예측 (M2부터 채움) ───────────── */
create table if not exists public.fc_predictions (
  match_id int primary key references public.fc_matches(id) on delete cascade,
  model_version text not null,
  p_home real not null, p_draw real not null, p_away real not null,
  exp_home real, exp_away real,             -- 예상 득점
  top_scores jsonb,                         -- [{h,a,p}] 5개
  factors jsonb,                            -- 화면 "예측 근거"용 수치
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  locked_at timestamptz,                    -- 킥오프 시점에 잠금, 이후 수정 금지
  result text check (result in ('H','D','A')),
  hit boolean, brier real, logloss real
);

-- 잠긴 예측은 확률을 바꿀 수 없다 (채점 칸만 채울 수 있음)
create or replace function public.fc_predictions_guard() returns trigger
language plpgsql as $$
begin
  if old.locked_at is not null and (
       new.p_home is distinct from old.p_home or new.p_draw is distinct from old.p_draw
    or new.p_away is distinct from old.p_away or new.exp_home is distinct from old.exp_home
    or new.exp_away is distinct from old.exp_away or new.top_scores is distinct from old.top_scores
    or new.model_version is distinct from old.model_version or new.locked_at is distinct from old.locked_at) then
    raise exception 'prediction % is locked', old.match_id;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists fc_predictions_guard on public.fc_predictions;
create trigger fc_predictions_guard before update on public.fc_predictions
  for each row execute function public.fc_predictions_guard();

/* ───────────── 레이팅 이력 (M2부터 채움) ───────────── */
create table if not exists public.fc_ratings (
  team_id int not null references public.fc_teams(id),
  date date not null,
  elo real, attack real, defense real,
  primary key (team_id, date)
);

/* ───────────── 리그 최종 순위 시뮬레이션 (M4) ───────────── */
create table if not exists public.fc_league_sims (
  competition text not null references public.fc_competitions(code),
  season int not null,
  run_at timestamptz not null default now(),
  data jsonb not null,                      -- 팀별 우승/챔스권/강등 확률
  primary key (competition, season)
);

/* ───────────── 동기화 기록 ───────────── */
create table if not exists public.fc_sync_log (
  id bigint generated always as identity primary key,
  mode text not null,
  target text,
  ok boolean not null,
  http_status int,
  rows int,
  detail text,
  at timestamptz not null default now()
);
create index if not exists fc_sync_log_at_idx on public.fc_sync_log (at desc);

/* ───────────── 권한 ───────────── */
alter table public.fc_competitions enable row level security;
alter table public.fc_teams        enable row level security;
alter table public.fc_matches      enable row level security;
alter table public.fc_standings    enable row level security;
alter table public.fc_predictions  enable row level security;
alter table public.fc_ratings      enable row level security;
alter table public.fc_league_sims  enable row level security;
alter table public.fc_sync_log     enable row level security;   -- 정책 없음 = 서버만

do $$
declare t text;
begin
  foreach t in array array['fc_competitions','fc_teams','fc_matches','fc_standings','fc_predictions','fc_ratings','fc_league_sims']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_read', t);
    execute format('create policy %I on public.%I for select to anon, authenticated using (true)', t || '_read', t);
  end loop;
end $$;
