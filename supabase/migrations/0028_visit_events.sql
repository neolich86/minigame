-- 접속 통계 — 게임·서비스별, 플랫폼별(web 웹사이트 / app 구글플레이 앱 / toss 앱인토스)
-- 게임이 열리면 bridge.js 가 /api/visit-event 로 보내고, 그 API 가 log_visit() 를 부른다.
-- 한 브라우저 탭에서 같은 게임은 한 번만 센다(세션). visitor 는 기기마다 무작위로 만든 익명 id (개인정보 아님).
-- 보기: Supabase 대시보드 Table Editor 또는 SQL 에서  select * from visit_counts;  /  select * from visit_daily;
-- SQL Editor에 붙여 넣고 Run (여러 번 실행해도 안전)

create table if not exists public.visit_events (
  id         bigint generated always as identity primary key,
  game_id    text not null check (game_id ~ '^[a-z0-9-]{1,40}$'),
  platform   text not null check (platform in ('web', 'app', 'toss')),
  visitor    uuid,
  created_at timestamptz not null default now()
);
create index if not exists visit_events_game_idx on public.visit_events (game_id, created_at);
create index if not exists visit_events_time_idx on public.visit_events (created_at);

alter table public.visit_events enable row level security;
-- 정책 없음 = 직접 접근 불가 (RPC 전용)

create or replace function public.log_visit(p_game text, p_platform text, p_visitor uuid)
returns void language plpgsql volatile security definer set search_path = public as $$
begin
  if p_game is null or p_game !~ '^[a-z0-9-]{1,40}$' or p_platform not in ('web', 'app', 'toss') then
    raise exception 'invalid_visit';
  end if;
  -- 같은 기기에서 같은 게임을 10분 안에 또 열면 세지 않는다 (새로고침 연타 방지)
  if p_visitor is not null and exists (select 1 from public.visit_events
      where game_id = p_game and visitor = p_visitor and created_at > now() - interval '10 minutes') then
    return;
  end if;
  -- 한 게임에 1분 동안 1000건 넘으면 버린다 (장난 방지)
  if (select count(*) from public.visit_events where game_id = p_game and created_at > now() - interval '1 minute') >= 1000 then
    return;
  end if;
  insert into public.visit_events (game_id, platform, visitor) values (p_game, p_platform, p_visitor);
end;
$$;
revoke all on function public.log_visit(text, text, uuid) from public;
grant execute on function public.log_visit(text, text, uuid) to anon, authenticated;

-- 게임별 합계 (접속 수 · 플랫폼별 · 순 방문자 · 오늘 · 최근 7일)
create or replace view public.visit_counts with (security_invoker = true) as
select
  game_id,
  count(*)                                                        as visits,
  count(*) filter (where platform = 'web')                        as web,
  count(*) filter (where platform = 'app')                        as app,
  count(*) filter (where platform = 'toss')                       as toss,
  count(distinct visitor)                                         as visitors,
  count(*) filter (where created_at >= date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul') as today,
  count(*) filter (where created_at > now() - interval '7 days')  as last_7d,
  max(created_at)                                                 as last_at
from public.visit_events
group by game_id
order by visits desc;

-- 날짜별 (한국 시간) · 게임별 · 플랫폼별
create or replace view public.visit_daily with (security_invoker = true) as
select
  (created_at at time zone 'Asia/Seoul')::date as day,
  game_id,
  count(*) filter (where platform = 'web')  as web,
  count(*) filter (where platform = 'app')  as app,
  count(*) filter (where platform = 'toss') as toss,
  count(*)                                  as visits,
  count(distinct visitor)                   as visitors
from public.visit_events
group by 1, 2
order by 1 desc, visits desc;

revoke all on public.visit_counts from anon, authenticated;
revoke all on public.visit_daily from anon, authenticated;
