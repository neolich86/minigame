-- 결과 공유 횟수 — 게임별 · 플랫폼별(web 웹사이트 / app 구글플레이 앱 / toss 앱인토스)
-- 게임이 공유(링크 복사·카카오·공유 시트·이미지 저장)를 마치면 /api/share-event 가 log_share() 를 부른다.
-- 테이블은 직접 접근 불가, RPC 로만 쓴다. 보기는 Supabase 대시보드에서 share_counts 뷰(아래)를 연다.

create table if not exists public.share_events (
  id         bigint generated always as identity primary key,
  game_id    text not null check (game_id ~ '^[a-z0-9-]{1,40}$'),
  platform   text not null check (platform in ('web', 'app', 'toss')),
  method     text not null check (method ~ '^[a-z_]{1,20}$'),
  created_at timestamptz not null default now()
);
create index if not exists share_events_game_idx on public.share_events (game_id, created_at);

alter table public.share_events enable row level security;
-- 정책 없음 = 직접 접근 불가 (RPC 전용)

create or replace function public.log_share(p_game text, p_platform text, p_method text)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if p_game is null or p_game !~ '^[a-z0-9-]{1,40}$'
     or p_platform not in ('web', 'app', 'toss')
     or p_method is null or p_method !~ '^[a-z_]{1,20}$' then
    raise exception 'invalid_share';
  end if;
  -- 한 게임에 1분 동안 300건 넘게 들어오면 버린다 (장난 방지)
  if (select count(*) from public.share_events
      where game_id = p_game and created_at > now() - interval '1 minute') >= 300 then
    return;
  end if;
  insert into public.share_events (game_id, platform, method) values (p_game, p_platform, p_method);
end;
$$;

revoke all on function public.log_share(text, text, text) from public;
grant execute on function public.log_share(text, text, text) to anon, authenticated;

-- 게임별 합계: 전체 · 플랫폼별 · 최근 7일 (대시보드 Table Editor 또는 SQL 에서 select * from share_counts)
create or replace view public.share_counts
with (security_invoker = true) as
select
  game_id,
  count(*)                                                as total,
  count(*) filter (where platform = 'web')                as web,
  count(*) filter (where platform = 'app')                as app,
  count(*) filter (where platform = 'toss')               as toss,
  count(*) filter (where created_at > now() - interval '7 days') as last_7d,
  max(created_at)                                         as last_at
from public.share_events
group by game_id
order by total desc;

revoke all on public.share_counts from anon, authenticated;
