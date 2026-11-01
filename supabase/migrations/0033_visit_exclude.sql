-- 접속 통계에서 내 기기(관리자·테스트 기기)는 빼고 보기
-- 기기마다 visitor id(브라우저 localStorage 'mgh:vid')가 다르다 → 내 기기 id 를 visit_excluded 에 넣으면 집계에서 빠진다.
-- SQL Editor에 붙여 넣고 Run (0028 다음, 여러 번 실행해도 안전)

create table if not exists public.visit_excluded (
  visitor uuid primary key,
  memo    text not null default '',
  created_at timestamptz not null default now()
);
alter table public.visit_excluded enable row level security; -- 정책 없음 = 대시보드(SQL)에서만

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
from public.visit_events e
where e.visitor is null or not exists (select 1 from public.visit_excluded x where x.visitor = e.visitor)
group by game_id
order by visits desc;

create or replace view public.visit_daily with (security_invoker = true) as
select
  (created_at at time zone 'Asia/Seoul')::date as day,
  game_id,
  count(*) filter (where platform = 'web')  as web,
  count(*) filter (where platform = 'app')  as app,
  count(*) filter (where platform = 'toss') as toss,
  count(*)                                  as visits,
  count(distinct visitor)                   as visitors
from public.visit_events e
where e.visitor is null or not exists (select 1 from public.visit_excluded x where x.visitor = e.visitor)
group by 1, 2
order by 1 desc, visits desc;

revoke all on public.visit_counts from anon, authenticated;
revoke all on public.visit_daily from anon, authenticated;
