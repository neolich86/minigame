-- 지금 접속 중인 사람 수 — 브라우저(기기 ID)마다 1분에 한 번 신호를 보내고, 최근 2분 안에 신호를 보낸 기기 수를 센다.
-- 로그인 없이도 센다. 테이블은 직접 접근 불가, RPC 로만.
-- SQL Editor에 붙여 넣고 Run (여러 번 실행해도 안전)
create table if not exists public.online_pings (
  device  uuid primary key,
  item    text not null default '' check (char_length(item) <= 40),
  seen_at timestamptz not null default now()
);
create index if not exists online_pings_seen_idx on public.online_pings (seen_at);
alter table public.online_pings enable row level security;

-- 신호 보내기 → { total, items: { 게임id: 명수 } }
create or replace function public.online_ping(p_device uuid, p_item text default '')
returns json language plpgsql security definer set search_path = public as $$
declare it text := case when coalesce(p_item, '') ~ '^[a-z0-9-]{1,40}$' then p_item else '' end;
begin
  if p_device is null then raise exception 'bad_device'; end if;
  insert into public.online_pings (device, item, seen_at) values (p_device, it, now())
    on conflict (device) do update set item = excluded.item, seen_at = now();
  -- 가끔 오래된 기록 정리
  if random() < .02 then delete from public.online_pings where seen_at < now() - interval '1 hour'; end if;
  return (select json_build_object(
    'total', count(*),
    'items', coalesce((select json_object_agg(item, n) from (select item, count(*) n from public.online_pings
                        where seen_at > now() - interval '2 minutes' and item <> '' group by item) g), '{}'::json))
    from public.online_pings where seen_at > now() - interval '2 minutes');
end;
$$;

-- 탭을 닫거나 다른 곳으로 갈 때 바로 빠지기
create or replace function public.online_leave(p_device uuid)
returns void language sql security definer set search_path = public as $$
  delete from public.online_pings where device = p_device;
$$;

revoke all on function public.online_ping(uuid, text) from public;
revoke all on function public.online_leave(uuid) from public;
grant execute on function public.online_ping(uuid, text) to anon, authenticated;
grant execute on function public.online_leave(uuid) to anon, authenticated;
