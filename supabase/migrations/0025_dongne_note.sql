-- 동네쪽지 (dongne-note) — 장소에 남기는 쪽지 지도
-- 위치는 이용자가 장소 검색·지도에서 직접 고른 좌표만 저장한다 (기기 GPS는 쓰지 않음).
-- 쪽지는 7일 뒤 사라지고, 다른 사람의 좋아요 1명당 +6시간, 댓글 1명당 +12시간 (작성 후 최대 30일).
-- 테이블 직접 접근 불가, 모두 RPC. SQL Editor에 붙여 넣고 Run (여러 번 실행해도 안전)

create table if not exists public.dn_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  animal     text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.dn_memos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  lat        double precision not null check (lat between 33 and 39),
  lng        double precision not null check (lng between 124 and 132),
  place      text check (char_length(place) <= 60),
  area       text check (char_length(area) <= 60),
  body       text not null check (char_length(body) between 1 and 140),
  animal     text not null,
  likes      int not null default 0,
  comments   int not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  hidden     boolean not null default false
);
create index if not exists dn_memos_geo_idx on public.dn_memos (lat, lng) where not hidden;
create index if not exists dn_memos_exp_idx on public.dn_memos (expires_at);
create index if not exists dn_memos_user_idx on public.dn_memos (user_id, created_at);

create table if not exists public.dn_likes (
  memo_id    uuid not null references public.dn_memos (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (memo_id, user_id)
);

create table if not exists public.dn_comments (
  id         uuid primary key default gen_random_uuid(),
  memo_id    uuid not null references public.dn_memos (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 100),
  created_at timestamptz not null default now()
);
create index if not exists dn_comments_memo_idx on public.dn_comments (memo_id, created_at);
create index if not exists dn_comments_user_idx on public.dn_comments (user_id, created_at);

create table if not exists public.dn_reports (
  memo_id    uuid not null references public.dn_memos (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  reason     text not null check (reason in ('spam', 'sexual', 'hate', 'privacy', 'etc')),
  created_at timestamptz not null default now(),
  primary key (memo_id, user_id)
);

alter table public.dn_users enable row level security;
alter table public.dn_memos enable row level security;
alter table public.dn_likes enable row level security;
alter table public.dn_comments enable row level security;
alter table public.dn_reports enable row level security;
-- 정책 없음 = 직접 접근 불가 (RPC 전용)

-- ───────── 내부 도우미 ─────────
create or replace function public._dn_animal_ok(p text)
returns boolean language sql immutable as $$
  select p = any (array['dog','cat','fox','bear','panda','rabbit','hamster','koala','tiger','lion',
                        'cow','pig','frog','monkey','penguin','chicken','unicorn','octopus','owl','wolf']);
$$;

create or replace function public._dn_nick(p uuid)
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select nickname from public.profiles where user_id = p), '이웃');
$$;

-- 전화번호·계좌번호처럼 보이는 숫자 막기
create or replace function public._dn_text_ok(p text)
returns boolean language sql immutable as $$
  select p !~ '01[016789][ .-]?[0-9]{3,4}[ .-]?[0-9]{4}'
     and regexp_replace(p, '[ .-]', '', 'g') !~ '[0-9]{10,}';
$$;

-- 유지 기간 다시 계산: 7일 + 좋아요한 사람 × 6시간 + 댓글 단 사람 × 12시간 (본인 제외), 최대 30일
create or replace function public._dn_extend(p_id uuid)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare
  m public.dn_memos;
  nl int; nc int; e timestamptz;
begin
  select * into m from public.dn_memos where id = p_id;
  if not found then return null; end if;
  select count(*) into nl from public.dn_likes where memo_id = p_id and user_id <> m.user_id;
  select count(distinct user_id) into nc from public.dn_comments where memo_id = p_id and user_id <> m.user_id;
  e := least(m.created_at + interval '30 days',
             m.created_at + interval '7 days' + nl * interval '6 hours' + nc * interval '12 hours');
  update public.dn_memos
     set expires_at = e,
         likes = (select count(*) from public.dn_likes where memo_id = p_id),
         comments = (select count(*) from public.dn_comments where memo_id = p_id)
   where id = p_id;
  return e;
end;
$$;

-- ───────── 읽기 ─────────
-- 지도에 보이는 영역의 살아 있는 쪽지 (반응·최신 순 최대 300개)
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
   order by (m.likes + m.comments * 2) desc, m.created_at desc
   limit least(greatest(coalesce(p_limit, 300), 1), 500);
$$;

-- 쪽지 하나 (공유 링크)
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
   where m.id = p_id and not m.hidden and m.expires_at > now();
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
   order by c.created_at
   limit 200;
$$;

-- 내 정보: 동물 · 닉네임 · 쪽지 기록
create or replace function public.dn_me()
returns jsonb language sql stable security definer set search_path = public as $$
  select case when auth.uid() is null then null else jsonb_build_object(
    'animal', (select animal from public.dn_users where user_id = auth.uid()),
    'nickname', public._dn_nick(auth.uid()),
    'memos', coalesce((select jsonb_agg(jsonb_build_object(
        'id', m.id, 'lat', m.lat, 'lng', m.lng, 'place', m.place, 'area', m.area, 'body', m.body,
        'likes', m.likes, 'comments', m.comments, 'created_at', m.created_at, 'expires_at', m.expires_at,
        'alive', (m.expires_at > now() and not m.hidden)) order by m.created_at desc)
      from (select * from public.dn_memos where user_id = auth.uid() order by created_at desc limit 100) m), '[]'::jsonb)
  ) end;
$$;

-- ───────── 쓰기 ─────────
create or replace function public.dn_set_animal(p_animal text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not public._dn_animal_ok(p_animal) then raise exception 'invalid_animal'; end if;
  insert into public.dn_users (user_id, animal) values (auth.uid(), p_animal)
  on conflict (user_id) do update set animal = excluded.animal;
end;
$$;

create or replace function public.dn_post_memo(p_lat double precision, p_lng double precision,
                                               p_place text, p_area text, p_body text, p_animal text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  b text := btrim(coalesce(p_body, ''));
  new_id uuid;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if p_lat is null or p_lng is null or p_lat not between 33 and 39 or p_lng not between 124 and 132 then
    raise exception 'out_of_area';
  end if;
  if char_length(b) < 1 or char_length(b) > 140 then raise exception 'invalid_body'; end if;
  if not public._dn_text_ok(b) then raise exception 'blocked_text'; end if;
  if not public._dn_animal_ok(p_animal) then raise exception 'invalid_animal'; end if;
  if (select count(*) from public.dn_memos where user_id = uid and created_at > now() - interval '1 day') >= 10 then
    raise exception 'daily_limit';
  end if;
  insert into public.dn_users (user_id, animal) values (uid, p_animal)
  on conflict (user_id) do update set animal = excluded.animal;
  insert into public.dn_memos (user_id, lat, lng, place, area, body, animal)
  values (uid, p_lat, p_lng, nullif(left(btrim(coalesce(p_place, '')), 60), ''),
          nullif(left(btrim(coalesce(p_area, '')), 60), ''), b, p_animal)
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.dn_delete_memo(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.dn_memos where id = p_id and user_id = auth.uid();
end;
$$;

-- 좋아요 켜기/끄기 → {liked, likes, expires_at}
create or replace function public.dn_toggle_like(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  on_ boolean;
  e timestamptz;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from public.dn_memos where id = p_id and not hidden and expires_at > now()) then
    raise exception 'gone';
  end if;
  if exists (select 1 from public.dn_likes where memo_id = p_id and user_id = uid) then
    delete from public.dn_likes where memo_id = p_id and user_id = uid; on_ := false;
  else
    insert into public.dn_likes (memo_id, user_id) values (p_id, uid); on_ := true;
  end if;
  e := public._dn_extend(p_id);
  return jsonb_build_object('liked', on_, 'likes', (select likes from public.dn_memos where id = p_id), 'expires_at', e);
end;
$$;

create or replace function public.dn_add_comment(p_id uuid, p_body text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  b text := btrim(coalesce(p_body, ''));
  e timestamptz;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if char_length(b) < 1 or char_length(b) > 100 then raise exception 'invalid_body'; end if;
  if not public._dn_text_ok(b) then raise exception 'blocked_text'; end if;
  if not exists (select 1 from public.dn_memos where id = p_id and not hidden and expires_at > now()) then
    raise exception 'gone';
  end if;
  if (select count(*) from public.dn_comments where user_id = uid and created_at > now() - interval '1 day') >= 100 then
    raise exception 'daily_limit';
  end if;
  insert into public.dn_comments (memo_id, user_id, body) values (p_id, uid, b);
  e := public._dn_extend(p_id);
  return jsonb_build_object('comments', (select comments from public.dn_memos where id = p_id), 'expires_at', e);
end;
$$;

create or replace function public.dn_delete_comment(p_comment uuid)
returns void language plpgsql security definer set search_path = public as $$
declare mid uuid;
begin
  delete from public.dn_comments where id = p_comment and user_id = auth.uid() returning memo_id into mid;
  if mid is not null then perform public._dn_extend(mid); end if;
end;
$$;

-- 신고: 서로 다른 3명이 신고하면 숨김
create or replace function public.dn_report(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  insert into public.dn_reports (memo_id, user_id, reason)
  values (p_id, auth.uid(), case when p_reason in ('spam','sexual','hate','privacy','etc') then p_reason else 'etc' end)
  on conflict do nothing;
  if (select count(*) from public.dn_reports where memo_id = p_id) >= 3 then
    update public.dn_memos set hidden = true where id = p_id;
  end if;
end;
$$;

-- ───────── 권한 ─────────
revoke all on function public._dn_animal_ok(text) from public, anon, authenticated;
revoke all on function public._dn_nick(uuid) from public, anon, authenticated;
revoke all on function public._dn_text_ok(text) from public, anon, authenticated;
revoke all on function public._dn_extend(uuid) from public, anon, authenticated;
grant execute on function public.dn_memos_in_view(double precision, double precision, double precision, double precision, int) to anon, authenticated;
grant execute on function public.dn_memo(uuid) to anon, authenticated;
grant execute on function public.dn_comments(uuid) to anon, authenticated;
grant execute on function public.dn_me() to authenticated;
revoke all on function public.dn_set_animal(text) from public, anon;
revoke all on function public.dn_post_memo(double precision, double precision, text, text, text, text) from public, anon;
revoke all on function public.dn_delete_memo(uuid) from public, anon;
revoke all on function public.dn_toggle_like(uuid) from public, anon;
revoke all on function public.dn_add_comment(uuid, text) from public, anon;
revoke all on function public.dn_delete_comment(uuid) from public, anon;
revoke all on function public.dn_report(uuid, text) from public, anon;
grant execute on function public.dn_set_animal(text) to authenticated;
grant execute on function public.dn_post_memo(double precision, double precision, text, text, text, text) to authenticated;
grant execute on function public.dn_delete_memo(uuid) to authenticated;
grant execute on function public.dn_toggle_like(uuid) to authenticated;
grant execute on function public.dn_add_comment(uuid, text) to authenticated;
grant execute on function public.dn_delete_comment(uuid) to authenticated;
grant execute on function public.dn_report(uuid, text) to authenticated;
