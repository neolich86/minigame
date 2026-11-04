-- 지금 접속 중인 사람 목록 — 관리자만 볼 수 있다 (0037 다음, 여러 번 실행해도 안전)
-- 관리자 등록은 이 파일 맨 아래 안내대로 SQL Editor에서 한 줄 실행 (이메일은 저장소에 적지 않는다)

-- 관리자 목록 (정책 없음 = 대시보드 SQL 에서만 넣고 뺄 수 있음)
create table if not exists public.app_admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.app_admins enable row level security;

create or replace function public.is_app_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and exists (select 1 from public.app_admins where user_id = auth.uid());
$$;

-- 신호에 로그인 사용자 id 도 함께 남긴다
alter table public.online_pings add column if not exists user_id uuid references auth.users (id) on delete set null;

create or replace function public.online_ping(p_device uuid, p_item text default '')
returns json language plpgsql security definer set search_path = public as $$
declare it text := case when coalesce(p_item, '') ~ '^[a-z0-9-]{1,40}$' then p_item else '' end;
begin
  if p_device is null then raise exception 'bad_device'; end if;
  insert into public.online_pings (device, item, seen_at, user_id) values (p_device, it, now(), auth.uid())
    on conflict (device) do update set item = excluded.item, seen_at = now(), user_id = excluded.user_id;
  if random() < .02 then delete from public.online_pings where seen_at < now() - interval '1 hour'; end if;
  return (select json_build_object(
    'total', count(*),
    'items', coalesce((select json_object_agg(item, n) from (select item, count(*) n from public.online_pings
                        where seen_at > now() - interval '2 minutes' and item <> '' group by item) g), '{}'::json))
    from public.online_pings where seen_at > now() - interval '2 minutes');
end;
$$;

-- 관리자 전용: 지금 접속 중인 사람 (로그인 → 닉네임, 비로그인 → null)
create or replace function public.online_who()
returns json language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_app_admin() then raise exception 'not_admin'; end if;
  return coalesce((
    select json_agg(json_build_object(
             'name', case when o.user_id is null then null else coalesce(p.nickname, '이름 없음') end,
             'item', o.item, 'seen_at', o.seen_at) order by (o.user_id is null), o.seen_at desc)
      from public.online_pings o left join public.profiles p on p.user_id = o.user_id
     where o.seen_at > now() - interval '2 minutes'), '[]'::json);
end;
$$;

revoke all on function public.is_app_admin() from public;
revoke all on function public.online_who() from public, anon;
grant execute on function public.is_app_admin() to anon, authenticated;
grant execute on function public.online_who() to authenticated;

-- ▼ 관리자 등록 (한 번만, 내 로그인 이메일로 바꿔서 실행)
-- insert into public.app_admins (user_id) select id from auth.users where email = '내이메일@example.com' on conflict do nothing;
