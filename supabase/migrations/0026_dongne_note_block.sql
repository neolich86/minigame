-- 동네쪽지: 사용자 차단 (구글 플레이 사용자 제작 콘텐츠 정책 — 신고 + 차단)
-- 차단하면 그 사람의 쪽지·댓글이 내 화면에서 안 보인다. 상대 id 는 화면에 내보내지 않고 쪽지·댓글 id 로 차단한다.
-- SQL Editor에 붙여 넣고 Run (여러 번 실행해도 안전, 0025 다음에)

create table if not exists public.dn_blocks (
  user_id    uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, blocked_id)
);
alter table public.dn_blocks enable row level security;

create or replace function public._dn_blocked(p_author uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and exists (select 1 from public.dn_blocks b where b.user_id = auth.uid() and b.blocked_id = p_author);
$$;
revoke all on function public._dn_blocked(uuid) from public, anon, authenticated;

create or replace function public.dn_memos_in_view(p_s double precision, p_w double precision,
                                                   p_n double precision, p_e double precision,
                                                   p_limit int default 300)
returns table (id uuid, lat double precision, lng double precision, place text, area text, body text,
               animal text, nickname text, likes int, comments int, created_at timestamptz,
               expires_at timestamptz, liked boolean, mine boolean)
language sql stable security definer set search_path = public as $$
  select m.id, m.lat, m.lng, m.place, m.area, m.body, m.animal, public._dn_nick(m.user_id),
         m.likes, m.comments, m.created_at, m.expires_at,
         exists (select 1 from public.dn_likes l where l.memo_id = m.id and l.user_id = auth.uid()),
         coalesce(m.user_id = auth.uid(), false)
    from public.dn_memos m
   where not m.hidden and m.expires_at > now()
     and m.lat between p_s and p_n and m.lng between p_w and p_e
     and not public._dn_blocked(m.user_id)
   order by (m.likes + m.comments * 2) desc, m.created_at desc
   limit least(greatest(coalesce(p_limit, 300), 1), 500);
$$;

create or replace function public.dn_memo(p_id uuid)
returns table (id uuid, lat double precision, lng double precision, place text, area text, body text,
               animal text, nickname text, likes int, comments int, created_at timestamptz,
               expires_at timestamptz, liked boolean, mine boolean)
language sql stable security definer set search_path = public as $$
  select m.id, m.lat, m.lng, m.place, m.area, m.body, m.animal, public._dn_nick(m.user_id),
         m.likes, m.comments, m.created_at, m.expires_at,
         exists (select 1 from public.dn_likes l where l.memo_id = m.id and l.user_id = auth.uid()),
         coalesce(m.user_id = auth.uid(), false)
    from public.dn_memos m
   where m.id = p_id and not m.hidden and m.expires_at > now() and not public._dn_blocked(m.user_id);
$$;

create or replace function public.dn_comments(p_id uuid)
returns table (id uuid, body text, nickname text, animal text, created_at timestamptz, mine boolean)
language sql stable security definer set search_path = public as $$
  select c.id, c.body, public._dn_nick(c.user_id),
         coalesce((select u.animal from public.dn_users u where u.user_id = c.user_id), 'dog'),
         c.created_at, coalesce(c.user_id = auth.uid(), false)
    from public.dn_comments c
    join public.dn_memos m on m.id = c.memo_id
   where c.memo_id = p_id and not m.hidden and m.expires_at > now()
     and not public._dn_blocked(c.user_id)
   order by c.created_at
   limit 200;
$$;

-- 쪽지(p_memo) 또는 댓글(p_comment) 작성자를 차단
create or replace function public.dn_block(p_memo uuid default null, p_comment uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare target uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_memo is not null then select user_id into target from public.dn_memos where id = p_memo;
  elsif p_comment is not null then select user_id into target from public.dn_comments where id = p_comment;
  end if;
  if target is null or target = auth.uid() then return; end if;
  insert into public.dn_blocks (user_id, blocked_id) values (auth.uid(), target) on conflict do nothing;
end;
$$;

-- 차단 모두 풀기 → 풀린 수
create or replace function public.dn_unblock_all()
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  delete from public.dn_blocks where user_id = auth.uid();
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.dn_block(uuid, uuid) from public, anon;
revoke all on function public.dn_unblock_all() from public, anon;
grant execute on function public.dn_block(uuid, uuid) to authenticated;
grant execute on function public.dn_unblock_all() to authenticated;
