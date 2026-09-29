-- 미니게임천국 포털 — 공용 계정 · 랭킹 · 온라인 방(보드게임 멀티플레이)
-- Supabase SQL Editor에 통째로 붙여 넣고 Run. 여러 번 실행해도 안전합니다.
-- 렉시오 온라인과 같은 Supabase 프로젝트를 써도 충돌하지 않도록, 새 테이블/함수는 전부
-- leaderboard / ranked_boards / mg_* 이름을 씁니다. profiles 는 렉시오와 공유합니다.


-- ───────────────────────── 1. 프로필 (포털 공용, 렉시오와 동일 스키마)
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  nickname   text not null default '플레이어' check (char_length(nickname) between 1 and 12),
  created_at timestamptz not null default now(),
  last_seen  timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.ensure_profile(p_nickname text default null)
returns public.profiles
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  row_out public.profiles;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  insert into public.profiles (user_id, nickname)
  values (uid, coalesce(nullif(left(btrim(p_nickname), 12), ''), '플레이어'))
  on conflict (user_id) do update set last_seen = now()
  returning * into row_out;
  return row_out;
end;
$$;

-- 닉네임 변경 시 랭킹·대기 중인 방의 표시 이름도 함께 갱신
create or replace function public.set_nickname(p_nickname text)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  n text := btrim(coalesce(p_nickname, ''));
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if char_length(n) < 1 or char_length(n) > 12 then raise exception 'invalid_nickname'; end if;
  update public.profiles set nickname = n where user_id = uid;
  if to_regclass('public.leaderboard') is not null then
    update public.leaderboard set nickname = n where user_id = uid;
  end if;
  if to_regclass('public.mg_room_members') is not null then
    update public.mg_room_members m set nickname = n
      from public.mg_rooms r
     where m.room_id = r.id and m.user_id = uid and r.status = 'waiting';
  end if;
  return n;
end;
$$;

-- ───────────────────────── 2. 랭킹
-- 랭킹 보드 정의. 점수 상한/하한과 최소 제출 간격으로 최소한의 상식 검증을 한다.
-- (게임은 브라우저에서 돌아가므로 완전한 조작 방지는 불가 — 비정상 값만 걸러낸다)
create table if not exists public.ranked_boards (
  game_id         text primary key,
  min_score       bigint not null default 0,
  max_score       bigint not null,
  min_interval_ms int    not null default 3000
);
alter table public.ranked_boards enable row level security;
drop policy if exists "boards are public" on public.ranked_boards;
create policy "boards are public" on public.ranked_boards for select to anon, authenticated using (true);

insert into public.ranked_boards (game_id, min_score, max_score, min_interval_ms) values
  ('world-typing-kr', 1, 3000,       3000),   -- 한타 타수(정확도 반영)
  ('world-typing-en', 1, 400,        3000),   -- 영타 WPM(정확도 반영)
  ('weapon',          2, 100,        1500),   -- 최고 강화 레벨
  ('oripa',           1, 100000000000, 1500), -- 최고 자금(원)
  ('raiden',          1, 1000000000, 2000),   -- 점수
  ('archer',          10, 86400,     5000)    -- 생존 시간(초)
on conflict (game_id) do update
  set min_score = excluded.min_score, max_score = excluded.max_score, min_interval_ms = excluded.min_interval_ms;

create table if not exists public.leaderboard (
  game_id        text   not null references public.ranked_boards (game_id) on delete cascade,
  user_id        uuid   not null references auth.users (id) on delete cascade,
  nickname       text   not null default '플레이어',
  best_score     bigint not null,
  meta           jsonb,
  plays          int    not null default 1,
  achieved_at    timestamptz not null default now(),
  last_submit_at timestamptz not null default now(),
  primary key (game_id, user_id)
);
create index if not exists leaderboard_rank_idx on public.leaderboard (game_id, best_score desc, achieved_at asc);

alter table public.leaderboard enable row level security;
drop policy if exists "leaderboard is public" on public.leaderboard;
create policy "leaderboard is public" on public.leaderboard for select to anon, authenticated using (true);
-- 쓰기는 submit_score RPC(security definer)로만

create or replace function public.my_rank(p_game_id text)
returns int
language sql stable security definer set search_path = public
as $$
  select case when me.user_id is null then null else (
    select count(*)::int + 1 from public.leaderboard o
     where o.game_id = p_game_id
       and (o.best_score > me.best_score or (o.best_score = me.best_score and o.achieved_at < me.achieved_at))
  ) end
  from (select 1) dummy
  left join public.leaderboard me on me.game_id = p_game_id and me.user_id = auth.uid();
$$;

create or replace function public.submit_score(p_game_id text, p_score bigint, p_meta jsonb default '{}'::jsonb)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  b public.ranked_boards;
  cur public.leaderboard;
  nick text;
  improved boolean := false;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into b from public.ranked_boards where game_id = p_game_id;
  if not found then raise exception 'invalid_score'; end if;
  if p_score is null or p_score < b.min_score or p_score > b.max_score then raise exception 'invalid_score'; end if;
  if p_meta is not null and pg_column_size(p_meta) > 2000 then p_meta := '{}'::jsonb; end if;

  select coalesce(p.nickname, '플레이어') into nick from public.profiles p where p.user_id = uid;
  if nick is null then nick := '플레이어'; end if;

  select * into cur from public.leaderboard where game_id = p_game_id and user_id = uid for update;
  if not found then
    insert into public.leaderboard (game_id, user_id, nickname, best_score, meta)
    values (p_game_id, uid, nick, p_score, p_meta);
    improved := true;
  else
    if cur.last_submit_at > now() - make_interval(secs => b.min_interval_ms / 1000.0) then
      raise exception 'rate_limited';
    end if;
    if p_score > cur.best_score then
      update public.leaderboard
         set best_score = p_score, meta = p_meta, nickname = nick, plays = plays + 1,
             achieved_at = now(), last_submit_at = now()
       where game_id = p_game_id and user_id = uid;
      improved := true;
    else
      update public.leaderboard set plays = plays + 1, nickname = nick, last_submit_at = now()
       where game_id = p_game_id and user_id = uid;
    end if;
  end if;

  return jsonb_build_object(
    'best', greatest(p_score, coalesce(cur.best_score, p_score)),
    'improved', improved,
    'rank', public.my_rank(p_game_id)
  );
end;
$$;

-- ───────────────────────── 3. 온라인 방 (보드게임 멀티플레이 — 방장 브라우저가 게임을 진행)
create table if not exists public.mg_rooms (
  id           uuid primary key default gen_random_uuid(),
  code         text not null check (char_length(code) = 4),
  game         text not null,
  host_user_id uuid not null references auth.users (id) on delete cascade,
  status       text not null default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  max_players  int  not null default 4 check (max_players between 2 and 4),
  host_seen_at timestamptz not null default now(),
  result       jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create unique index if not exists mg_rooms_active_code on public.mg_rooms (code) where status <> 'finished';

create table if not exists public.mg_room_members (
  room_id   uuid not null references public.mg_rooms (id) on delete cascade,
  seat      int  not null check (seat between 0 and 3),
  user_id   uuid references auth.users (id) on delete cascade,
  is_ai     boolean not null default false,
  nickname  text not null default '플레이어',
  is_ready  boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (room_id, seat),
  constraint mg_room_members_user_unique unique (room_id, user_id)
);

-- 게임 진행 스냅샷 (방장이 저장, 재접속·방장 교체 시 복원용). 실시간 전달은 Realtime broadcast가 담당.
create table if not exists public.mg_room_states (
  room_id    uuid primary key references public.mg_rooms (id) on delete cascade,
  state      jsonb not null,
  version    int   not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.mg_rooms enable row level security;
alter table public.mg_room_members enable row level security;
alter table public.mg_room_states enable row level security;

-- RLS 재귀를 피하기 위한 헬퍼 (room_members 정책 안에서 room_members 를 다시 조회하지 않음)
create or replace function public.mg_is_member(p_room uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.mg_room_members where room_id = p_room and user_id = auth.uid());
$$;

drop policy if exists "members read room" on public.mg_rooms;
create policy "members read room" on public.mg_rooms
  for select to authenticated using (public.mg_is_member(id));
drop policy if exists "members read members" on public.mg_room_members;
create policy "members read members" on public.mg_room_members
  for select to authenticated using (public.mg_is_member(room_id));
drop policy if exists "members read state" on public.mg_room_states;
create policy "members read state" on public.mg_room_states
  for select to authenticated using (public.mg_is_member(room_id));

create or replace function public._mg_gen_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  c text;
  tries int := 0;
begin
  loop
    c := '';
    for i in 1..4 loop
      c := c || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (select 1 from public.mg_rooms where code = c and status <> 'finished');
    tries := tries + 1;
    if tries > 50 then raise exception 'code_generation_failed'; end if;
  end loop;
  return c;
end;
$$;

create or replace function public._mg_nick(uid uuid)
returns text
language sql stable security definer set search_path = public
as $$
  select coalesce((select nickname from public.profiles where user_id = uid), '플레이어');
$$;

create or replace function public.mg_create_room(p_game text, p_max_players int default 4)
returns public.mg_rooms
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  r public.mg_rooms;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if p_game not in ('catan') then raise exception 'invalid_game'; end if;
  if p_max_players not between 2 and 4 then raise exception 'invalid_player_count'; end if;
  insert into public.mg_rooms (code, game, host_user_id, max_players)
  values (public._mg_gen_code(), p_game, uid, p_max_players)
  returning * into r;
  insert into public.mg_room_members (room_id, seat, user_id, nickname)
  values (r.id, 0, uid, public._mg_nick(uid));
  return r;
end;
$$;

create or replace function public.mg_join_room(p_code text)
returns public.mg_rooms
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  r public.mg_rooms;
  seat_no int;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into r from public.mg_rooms
   where code = upper(btrim(p_code)) and status <> 'finished'
   order by created_at desc limit 1 for update;
  if not found then raise exception 'room_not_found'; end if;

  if exists (select 1 from public.mg_room_members where room_id = r.id and user_id = uid) then
    -- 재접속: 진행 중에 AI로 대체됐던 자리라면 다시 사람으로 되돌린다
    update public.mg_room_members set is_ai = false where room_id = r.id and user_id = uid;
    return r;
  end if;
  if r.status <> 'waiting' then raise exception 'room_already_started'; end if;

  select s into seat_no from generate_series(0, r.max_players - 1) s
   where not exists (select 1 from public.mg_room_members m where m.room_id = r.id and m.seat = s)
   order by s limit 1;
  if seat_no is null then raise exception 'room_full'; end if;

  insert into public.mg_room_members (room_id, seat, user_id, nickname)
  values (r.id, seat_no, uid, public._mg_nick(uid));
  update public.mg_rooms set updated_at = now() where id = r.id;
  return r;
end;
$$;

-- 방장: 빈 자리를 AI로 채우거나(p_ai=true), AI 자리를 비운다(p_ai=false)
create or replace function public.mg_set_seat_ai(p_room uuid, p_seat int, p_ai boolean)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  r public.mg_rooms;
begin
  select * into r from public.mg_rooms where id = p_room for update;
  if not found then raise exception 'room_not_found'; end if;
  if r.host_user_id <> uid then raise exception 'not_host'; end if;
  if r.status <> 'waiting' then raise exception 'room_already_started'; end if;
  if p_seat < 0 or p_seat >= r.max_players then raise exception 'invalid_seat'; end if;
  if p_ai then
    if exists (select 1 from public.mg_room_members where room_id = p_room and seat = p_seat) then
      raise exception 'seat_taken';
    end if;
    insert into public.mg_room_members (room_id, seat, user_id, is_ai, nickname, is_ready)
    values (p_room, p_seat, null, true, 'AI', true);
  else
    delete from public.mg_room_members where room_id = p_room and seat = p_seat and is_ai and user_id is null;
  end if;
  update public.mg_rooms set updated_at = now() where id = p_room;
end;
$$;

create or replace function public.mg_set_max_players(p_room uuid, p_max int)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  r public.mg_rooms;
begin
  select * into r from public.mg_rooms where id = p_room for update;
  if not found then raise exception 'room_not_found'; end if;
  if r.host_user_id <> uid then raise exception 'not_host'; end if;
  if r.status <> 'waiting' then raise exception 'room_already_started'; end if;
  if p_max not between 2 and 4 then raise exception 'invalid_player_count'; end if;
  if exists (select 1 from public.mg_room_members where room_id = p_room and seat >= p_max and user_id is not null) then
    raise exception 'seat_taken';
  end if;
  delete from public.mg_room_members where room_id = p_room and seat >= p_max;
  update public.mg_rooms set max_players = p_max, updated_at = now() where id = p_room;
end;
$$;

create or replace function public.mg_set_ready(p_room uuid, p_ready boolean)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update public.mg_room_members set is_ready = p_ready where room_id = p_room and user_id = auth.uid();
  if not found then raise exception 'not_in_room'; end if;
  update public.mg_rooms set updated_at = now() where id = p_room;
end;
$$;

create or replace function public.mg_start_room(p_room uuid)
returns public.mg_rooms
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  r public.mg_rooms;
  n int;
begin
  select * into r from public.mg_rooms where id = p_room for update;
  if not found then raise exception 'room_not_found'; end if;
  if r.host_user_id <> uid then raise exception 'not_host'; end if;
  if r.status <> 'waiting' then raise exception 'room_already_started'; end if;
  select count(*) into n from public.mg_room_members where room_id = p_room;
  if n < r.max_players then raise exception 'seats_not_full'; end if;
  if exists (select 1 from public.mg_room_members where room_id = p_room and not is_ready and user_id <> uid) then
    raise exception 'not_all_ready';
  end if;
  update public.mg_rooms set status = 'playing', host_seen_at = now(), updated_at = now()
   where id = p_room returning * into r;
  return r;
end;
$$;

-- 방장: 진행 스냅샷 저장 (+ 방장 생존 신호)
create or replace function public.mg_save_state(p_room uuid, p_state jsonb, p_version int)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if not exists (select 1 from public.mg_rooms where id = p_room and host_user_id = uid and status = 'playing') then
    raise exception 'not_host';
  end if;
  if pg_column_size(p_state) > 400000 then raise exception 'state_too_large'; end if;
  insert into public.mg_room_states (room_id, state, version, updated_at)
  values (p_room, p_state, p_version, now())
  on conflict (room_id) do update set state = excluded.state, version = excluded.version, updated_at = now()
   where public.mg_room_states.version <= excluded.version;
  update public.mg_rooms set host_seen_at = now() where id = p_room;
end;
$$;

create or replace function public.mg_heartbeat(p_room uuid)
returns void
language sql security definer set search_path = public
as $$
  update public.mg_rooms set host_seen_at = now() where id = p_room and host_user_id = auth.uid();
$$;

-- 방장이 45초 이상 응답이 없으면 다른 참가자가 방장 역할을 넘겨받는다 (저장된 스냅샷에서 이어서 진행)
create or replace function public.mg_claim_host(p_room uuid)
returns public.mg_rooms
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  r public.mg_rooms;
begin
  select * into r from public.mg_rooms where id = p_room for update;
  if not found then raise exception 'room_not_found'; end if;
  if not exists (select 1 from public.mg_room_members where room_id = p_room and user_id = uid) then
    raise exception 'not_in_room';
  end if;
  if r.host_user_id = uid then return r; end if;
  if r.host_seen_at > now() - interval '45 seconds' then raise exception 'host_alive'; end if;
  update public.mg_rooms set host_user_id = uid, host_seen_at = now(), updated_at = now()
   where id = p_room returning * into r;
  return r;
end;
$$;

-- 방장: 진행 중 자리를 AI로 대체 (자리 주인이 다시 들어오면 mg_join_room이 되돌림)
create or replace function public.mg_replace_with_ai(p_room uuid, p_seat int)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.mg_rooms where id = p_room and host_user_id = auth.uid()) then
    raise exception 'not_host';
  end if;
  update public.mg_room_members set is_ai = true where room_id = p_room and seat = p_seat;
  update public.mg_rooms set updated_at = now() where id = p_room;
end;
$$;

create or replace function public.mg_finish_room(p_room uuid, p_result jsonb)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update public.mg_rooms set status = 'finished', result = p_result, updated_at = now()
   where id = p_room and host_user_id = auth.uid() and status = 'playing';
end;
$$;

create or replace function public.mg_leave_room(p_room uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  r public.mg_rooms;
  next_host uuid;
begin
  select * into r from public.mg_rooms where id = p_room for update;
  if not found then return; end if;
  if r.status = 'waiting' then
    delete from public.mg_room_members where room_id = p_room and user_id = uid;
  elsif r.status = 'playing' then
    -- 진행 중에 나가면 그 자리는 AI가 이어받는다
    update public.mg_room_members set is_ai = true where room_id = p_room and user_id = uid;
  end if;

  if r.host_user_id = uid then
    select user_id into next_host from public.mg_room_members
     where room_id = p_room and user_id is not null and user_id <> uid and not is_ai
     order by seat limit 1;
    if next_host is not null then
      update public.mg_rooms set host_user_id = next_host, host_seen_at = now() - interval '30 seconds', updated_at = now()
       where id = p_room;
    else
      update public.mg_rooms set status = 'finished', updated_at = now() where id = p_room;
    end if;
  else
    update public.mg_rooms set updated_at = now() where id = p_room;
  end if;
end;
$$;

-- ───────────────────────── 권한
do $$
declare f text;
begin
  foreach f in array array[
    'ensure_profile(text)', 'set_nickname(text)', 'submit_score(text,bigint,jsonb)',
    'mg_create_room(text,int)', 'mg_join_room(text)', 'mg_set_seat_ai(uuid,int,boolean)',
    'mg_set_max_players(uuid,int)', 'mg_set_ready(uuid,boolean)', 'mg_start_room(uuid)',
    'mg_save_state(uuid,jsonb,int)', 'mg_heartbeat(uuid)', 'mg_claim_host(uuid)',
    'mg_replace_with_ai(uuid,int)', 'mg_finish_room(uuid,jsonb)', 'mg_leave_room(uuid)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
revoke all on function public.my_rank(text) from public;
grant execute on function public.my_rank(text) to anon, authenticated;
revoke all on function public.mg_is_member(uuid) from public, anon;
grant execute on function public.mg_is_member(uuid) to authenticated;
revoke all on function public._mg_gen_code() from public, anon, authenticated;
revoke all on function public._mg_nick(uuid) from public, anon, authenticated;

-- ───────────────────────── Realtime (로비 화면 자동 갱신용)
do $$
begin
  begin alter publication supabase_realtime add table public.mg_rooms; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.mg_room_members; exception when duplicate_object then null; end;
end $$;
