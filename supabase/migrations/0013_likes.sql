-- 콘텐츠 좋아요(하트) — 게임·도구·서비스마다 '재밌어요' 하트
-- 로그인 없이 누를 수 있도록 브라우저마다 만든 기기 ID(device)로 한 번만 누르게 한다.
-- 테이블은 직접 접근 불가, RPC 로만 읽고 쓴다.

create table if not exists public.item_likes (
  item_id    text not null check (item_id ~ '^[a-z0-9-]{1,40}$'),
  device     uuid not null,
  user_id    uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (item_id, device)
);
create index if not exists item_likes_device_idx on public.item_likes (device);

create table if not exists public.item_like_counts (
  item_id text primary key,
  likes   integer not null default 0
);

alter table public.item_likes enable row level security;
alter table public.item_like_counts enable row level security;
-- 정책 없음 = 직접 접근 불가 (RPC 전용)

-- 모든 항목의 좋아요 수
create or replace function public.like_counts()
returns table (item_id text, likes integer)
language sql
stable
security definer
set search_path = public
as $$
  select c.item_id, c.likes from public.item_like_counts c where c.likes > 0;
$$;

-- 이 기기가 좋아요한 항목
create or replace function public.my_likes(p_device uuid)
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select l.item_id from public.item_likes l where l.device = p_device;
$$;

-- 좋아요 켜기/끄기 → {liked, likes}
create or replace function public.toggle_like(p_item text, p_device uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  n integer;
  liked boolean;
begin
  if p_item is null or p_item !~ '^[a-z0-9-]{1,40}$' or p_device is null then
    raise exception 'invalid_like';
  end if;
  -- 한 기기가 1분에 너무 많이 누르면 막는다
  if (select count(*) from public.item_likes where device = p_device and created_at > now() - interval '1 minute') >= 30 then
    raise exception 'rate_limited';
  end if;

  delete from public.item_likes where item_id = p_item and device = p_device;
  if found then
    liked := false;
    insert into public.item_like_counts as c (item_id, likes) values (p_item, 0)
      on conflict (item_id) do update set likes = greatest(c.likes - 1, 0)
      returning c.likes into n;
  else
    insert into public.item_likes (item_id, device, user_id) values (p_item, p_device, auth.uid());
    liked := true;
    insert into public.item_like_counts as c (item_id, likes) values (p_item, 1)
      on conflict (item_id) do update set likes = c.likes + 1
      returning c.likes into n;
  end if;
  return jsonb_build_object('liked', liked, 'likes', n);
end;
$$;

revoke all on function public.like_counts() from public;
revoke all on function public.my_likes(uuid) from public;
revoke all on function public.toggle_like(text, uuid) from public;
grant execute on function public.like_counts() to anon, authenticated;
grant execute on function public.my_likes(uuid) to anon, authenticated;
grant execute on function public.toggle_like(text, uuid) to anon, authenticated;
