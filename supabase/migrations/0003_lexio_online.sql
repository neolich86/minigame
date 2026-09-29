-- 렉시오 온라인 (포털 통합) — neolich86/lexio-online 의 0001_init.sql + 0002_game.sql 을 합친 것
-- 서버(DB 함수)가 규칙을 판정하는 렉시오 멀티플레이. 테이블: rooms / room_members / game_states / game_public
-- 렉시오 온라인과 같은 Supabase 프로젝트라면 이미 적용돼 있을 수 있지만, 다시 실행해도 안전합니다.
-- 프로필(profiles / ensure_profile / set_nickname)은 0001_portal.sql 이 담당하므로 여기서는 제외했습니다.
-- 순서: 0001_portal.sql → (0002_td_ranking.sql) → 이 파일

-- ───────────────────────── 방(Room)
create table if not exists public.rooms (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique check (char_length(code) = 4),
  host_user_id uuid not null references auth.users (id) on delete cascade,
  status       text not null default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  max_players  int not null default 4 check (max_players between 2 and 4),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.room_members (
  room_id   uuid not null references public.rooms (id) on delete cascade,
  seat      int not null check (seat between 0 and 3),
  user_id   uuid references auth.users (id) on delete cascade,
  is_ai     boolean not null default false,
  nickname  text not null default '플레이어',
  is_ready  boolean not null default false,
  connected boolean not null default true,
  joined_at timestamptz not null default now(),
  primary key (room_id, seat),
  -- 한 유저가 한 방에 두 좌석을 차지할 수 없음 (AI 좌석은 user_id가 null이라 예외)
  constraint room_members_user_unique unique (room_id, user_id)
);

alter table public.rooms enable row level security;
alter table public.room_members enable row level security;

-- 내가 속한 방과 그 구성원만 볼 수 있음
drop policy if exists "read rooms i'm in" on public.rooms;
create policy "read rooms i'm in" on public.rooms
  for select to authenticated using (
    exists (
      select 1 from public.room_members m
      where m.room_id = rooms.id and m.user_id = (select auth.uid())
    )
  );

drop policy if exists "read members of my rooms" on public.room_members;
create policy "read members of my rooms" on public.room_members
  for select to authenticated using (
    exists (
      select 1 from public.room_members me
      where me.room_id = room_members.room_id and me.user_id = (select auth.uid())
    )
  );

-- 4자리 코드 생성 (대문자+숫자, 0/O·1/I 제외해 혼동 방지)
create or replace function public._gen_room_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  out_code text;
  i int;
  tries int := 0;
begin
  loop
    out_code := '';
    for i in 1..4 loop
      out_code := out_code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (select 1 from public.rooms where code = out_code and status <> 'finished');
    tries := tries + 1;
    if tries > 50 then raise exception 'code_generation_failed'; end if;
  end loop;
  return out_code;
end;
$$;

-- ───────────────────────── 방 만들기 / 참가 / 나가기
create or replace function public.create_room(p_nickname text default null)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_room public.rooms;
  nick text;
begin
  if uid is null then raise exception 'not_authenticated'; end if;

  select coalesce(nullif(left(btrim(p_nickname), 12), ''), p.nickname, '플레이어')
    into nick
    from public.profiles p where p.user_id = uid;
  if nick is null then nick := '플레이어'; end if;

  insert into public.rooms (code, host_user_id)
  values (public._gen_room_code(), uid)
  returning * into new_room;

  insert into public.room_members (room_id, seat, user_id, nickname)
  values (new_room.id, 0, uid, nick);

  return new_room;
end;
$$;

create or replace function public.join_room(p_code text, p_nickname text default null)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  r public.rooms;
  taken_seats int[];
  seat_no int;
  nick text;
begin
  if uid is null then raise exception 'not_authenticated'; end if;

  select * into r from public.rooms where code = upper(btrim(p_code)) for update;
  if not found then raise exception 'room_not_found'; end if;
  if r.status <> 'waiting' then raise exception 'room_already_started'; end if;

  if exists (select 1 from public.room_members m where m.room_id = r.id and m.user_id = uid) then
    return r; -- 이미 참가 중이면 그대로 반환 (재접속 겸용)
  end if;

  select array_agg(seat) into taken_seats from public.room_members where room_id = r.id;
  seat_no := null;
  for i in 0..(r.max_players - 1) loop
    if taken_seats is null or not (i = any(taken_seats)) then
      seat_no := i;
      exit;
    end if;
  end loop;
  if seat_no is null then raise exception 'room_full'; end if;

  select coalesce(nullif(left(btrim(p_nickname), 12), ''), p.nickname, '플레이어')
    into nick
    from public.profiles p where p.user_id = uid;
  if nick is null then nick := '플레이어'; end if;

  insert into public.room_members (room_id, seat, user_id, nickname)
  values (r.id, seat_no, uid, nick);

  return r;
end;
$$;

-- 빈 좌석을 AI로 고정. 방장만 가능
create or replace function public.fill_with_ai(p_room_id uuid, p_seat int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  r public.rooms;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into r from public.rooms where id = p_room_id for update;
  if not found then raise exception 'room_not_found'; end if;
  if r.host_user_id <> uid then raise exception 'not_host'; end if;
  if r.status <> 'waiting' then raise exception 'room_already_started'; end if;
  if exists (select 1 from public.room_members where room_id = p_room_id and seat = p_seat) then
    raise exception 'seat_taken';
  end if;

  insert into public.room_members (room_id, seat, user_id, is_ai, nickname, is_ready)
  values (p_room_id, p_seat, null, true, 'AI', true);
end;
$$;

create or replace function public.set_ready(p_room_id uuid, p_ready boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  update public.room_members
     set is_ready = p_ready
   where room_id = p_room_id and user_id = uid;
  if not found then raise exception 'not_in_room'; end if;
end;
$$;

-- 진행 중이면 자리를 비우지 않고 connected=false만 표시 (재접속 대비)
create or replace function public.leave_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  r public.rooms;
  next_host uuid;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into r from public.rooms where id = p_room_id for update;
  if not found then return; end if;

  if r.status = 'waiting' then
    delete from public.room_members where room_id = p_room_id and user_id = uid;
  else
    update public.room_members set connected = false where room_id = p_room_id and user_id = uid;
  end if;

  -- 방장이 나갔고 남은 인간이 있으면 위임, 없으면 방 종료
  if r.host_user_id = uid then
    select user_id into next_host
      from public.room_members
     where room_id = p_room_id and user_id is not null and user_id <> uid
     order by seat asc limit 1;
    if next_host is not null then
      update public.rooms set host_user_id = next_host, updated_at = now() where id = p_room_id;
    else
      update public.rooms set status = 'finished', updated_at = now() where id = p_room_id;
    end if;
  end if;
end;
$$;

-- ───────────────────────── 권한
revoke all on function public.ensure_profile(text) from public, anon;
revoke all on function public.set_nickname(text) from public, anon;
revoke all on function public.create_room(text) from public, anon;
revoke all on function public.join_room(text, text) from public, anon;
revoke all on function public.fill_with_ai(uuid, int) from public, anon;
revoke all on function public.set_ready(uuid, boolean) from public, anon;
revoke all on function public.leave_room(uuid) from public, anon;

grant execute on function public.ensure_profile(text) to authenticated;
grant execute on function public.set_nickname(text) to authenticated;
grant execute on function public.create_room(text) to authenticated;
grant execute on function public.join_room(text, text) to authenticated;
grant execute on function public.fill_with_ai(uuid, int) to authenticated;
grant execute on function public.set_ready(uuid, boolean) to authenticated;
grant execute on function public.leave_room(uuid) to authenticated;

-- ───────────────────────── Realtime (재실행 안전)
do $$
begin
  begin alter publication supabase_realtime add table public.rooms; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.room_members; exception when duplicate_object then null; end;
end $$;

-- 렉시오 온라인 — M2 서버 검증 게임 로직
-- 기존 정적 렉시오(lexio-game.html)의 Core 엔진을 그대로 이식한 SECURITY DEFINER RPC들.
-- Supabase SQL Editor에 그대로 붙여 넣어 실행하면 됩니다. (0001_init.sql 다음에 실행)
--
-- v1 AI 한계 (문서화된 범위 축소):
--   - 선(lead)일 때 5장 조합(스트레이트/플러시 등)을 먼저 내지 않습니다 (약한 트리플 > 페어 > 싱글 순).
--   - 상대 5장 조합을 받아칠 때는 항상 패스합니다 (5장 조합 비교는 v2에서 추가 예정).
--   - "당장 이길 수 있어도 전략적으로 들고 있기"(shouldHoldInsteadOfPlay) 로직은 생략 — 이길 수 있으면 항상 냅니다.
--   원작 AI의 나머지 규칙(약한 조합부터, 최소 승리 조합 내기)은 동일하게 유지됩니다.

-- ═══════════════════════════ M2-1: 방 스키마 수정 (3~5인 지원) ═══════════════════════════
-- M1에서 max_players/seat 체크 제약이 2~4/0~3으로 잘못 설정됨 — 렉시오는 3/4/5인만 지원.
alter table public.rooms drop constraint if exists rooms_max_players_check;
alter table public.rooms add constraint rooms_max_players_check check (max_players between 3 and 5);
alter table public.rooms alter column max_players set default 4;

alter table public.room_members drop constraint if exists room_members_seat_check;
alter table public.room_members add constraint room_members_seat_check check (seat between 0 and 4);

-- M1에서 발견된 버그: room_members의 SELECT 정책이 room_members 자신을 서브쿼리로 참조해
-- "infinite recursion detected in policy" (42P17) 오류가 남 — 실제로 멤버 목록을 조회하는 순간 터짐.
-- SECURITY DEFINER 함수(RLS 우회)로 멤버십을 확인하도록 두 정책을 모두 교체.
create or replace function public._is_room_member(p_room_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.room_members m
    where m.room_id = p_room_id and m.user_id = auth.uid()
  );
$$;
revoke all on function public._is_room_member(uuid) from public, anon;
grant execute on function public._is_room_member(uuid) to authenticated;

drop policy if exists "read rooms i'm in" on public.rooms;
create policy "read rooms i'm in" on public.rooms
  for select to authenticated using (public._is_room_member(id));

drop policy if exists "read members of my rooms" on public.room_members;
create policy "read members of my rooms" on public.room_members
  for select to authenticated using (public._is_room_member(room_id));

-- create_room에 인원수 파라미터 추가 (기존 시그니처는 삭제 후 재생성)
drop function if exists public.create_room(text);

create or replace function public.create_room(p_nickname text default null, p_player_count int default 4)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_room public.rooms;
  nick text;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if p_player_count not in (3, 4, 5) then raise exception 'invalid_player_count'; end if;

  select coalesce(nullif(left(btrim(p_nickname), 12), ''), p.nickname, '플레이어')
    into nick
    from public.profiles p where p.user_id = uid;
  if nick is null then nick := '플레이어'; end if;

  insert into public.rooms (code, host_user_id, max_players)
  values (public._gen_room_code(), uid, p_player_count)
  returning * into new_room;

  insert into public.room_members (room_id, seat, user_id, nickname)
  values (new_room.id, 0, uid, nick);

  return new_room;
end;
$$;

revoke all on function public.create_room(text, int) from public, anon;
grant execute on function public.create_room(text, int) to authenticated;

-- ═══════════════════════════ M2-2: 카드 엔진 헬퍼 (lexio-core.js 이식) ═══════════════════════════

create or replace function public._color_rank(p_color text)
returns int
language sql
immutable
as $$
  select case p_color
    when 'blue' then 0
    when 'green' then 1
    when 'yellow' then 2
    when 'red' then 3
    else null
  end;
$$;

create or replace function public._number_strength(p_number int)
returns int
language sql
immutable
as $$
  -- 원작 RANK_ORDER = [2,1,15,14,13,...,3] 를 그대로 이식 (2가 가장 약하고, 1, 이후 15부터 내림차순)
  select 16 - array_position(array[2,1,15,14,13,12,11,10,9,8,7,6,5,4,3], p_number);
$$;

create or replace function public._max_number(p_player_count int)
returns int
language sql
immutable
as $$
  select case p_player_count
    when 3 then 9
    when 4 then 13
    when 5 then 15
    else null
  end;
$$;

create or replace function public._tile_value(p_color text, p_number int)
returns int
language sql
immutable
as $$
  select public._number_strength(p_number) * 10 + public._color_rank(p_color);
$$;

-- 손패에서 숫자별 개수·색상 목록(오름차순)을 반환 — AI/페어·트리플 탐색에 사용
create or replace function public._hand_groups(p_hand jsonb)
returns table(number int, cnt int, color_ranks int[])
language sql
stable
as $$
  select (t->>'number')::int as number,
         count(*)::int as cnt,
         array_agg(public._color_rank(t->>'color') order by public._color_rank(t->>'color')) as color_ranks
  from jsonb_array_elements(p_hand) t
  group by (t->>'number')::int;
$$;

-- 덱 생성 + 셔플 + 좌석별 분배를 한 번에 (원작 generateDeck+shuffle+deal)
create or replace function public._deal_hands(p_player_count int)
returns jsonb
language plpgsql
as $$
declare
  deck jsonb;
  shuffled jsonb;
  hand_size int;
  hands jsonb := '{}'::jsonb;
  seat int;
begin
  select jsonb_agg(jsonb_build_object('id', color || '-' || n, 'color', color, 'number', n))
    into deck
    from generate_series(1, public._max_number(p_player_count)) n
    cross join unnest(array['blue', 'green', 'yellow', 'red']) as color;

  select jsonb_agg(elem) into shuffled
    from (select elem from jsonb_array_elements(deck) elem order by random()) s;

  hand_size := jsonb_array_length(shuffled) / p_player_count;
  for seat in 0..(p_player_count - 1) loop
    hands := hands || jsonb_build_object(
      seat::text,
      (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select t from jsonb_array_elements(shuffled) with ordinality as x(t, i)
        where i > seat * hand_size and i <= (seat + 1) * hand_size
      ) s)
    );
  end loop;
  return hands;
end;
$$;

-- 파랑-3을 든 좌석을 찾아 시작 플레이어로 (원작 findStartingPlayer)
create or replace function public._find_starting_seat(p_hands jsonb)
returns int
language plpgsql
as $$
declare
  seat int;
  found boolean;
begin
  for seat in 0..10 loop
    if p_hands ? seat::text then
      select exists(
        select 1 from jsonb_array_elements(p_hands -> seat::text) t
        where t ->> 'color' = 'blue' and (t ->> 'number')::int = 3
      ) into found;
      if found then return seat; end if;
    end if;
  end loop;
  raise exception 'blue_three_not_found';
end;
$$;

-- 5장 조합 판정 (스트레이트/플러시/풀하우스/포카드/스트레이트플러시) — 원작 analyzeCombo의 size=5 분기
create or replace function public._analyze_five(p_numbers int[], p_colors text[], p_max_number int)
returns jsonb
language plpgsql
as $$
declare
  grp_number int[] := '{}';
  grp_count int[] := '{}';
  idx int;
  u int;
  i int;
  distinct_count int;
  quad_number int;
  triple_number int;
  max_color_in_triple int;
  is_flush boolean;
  sorted_numbers int[];
  wrap_set int[];
  is_consecutive boolean;
  valid_straight boolean := false;
  top_value int;
  is_wrap boolean := false;
  target_number int;
  top_color text;
  strengths int[];
  rank_value bigint;
  s int;
begin
  foreach u in array p_numbers loop
    idx := array_position(grp_number, u);
    if idx is null then
      grp_number := array_append(grp_number, u);
      grp_count := array_append(grp_count, 1);
    else
      grp_count[idx] := grp_count[idx] + 1;
    end if;
  end loop;
  distinct_count := array_length(grp_number, 1);

  if distinct_count = 2 then
    if grp_count[1] = 4 or grp_count[2] = 4 then
      quad_number := case when grp_count[1] = 4 then grp_number[1] else grp_number[2] end;
      return jsonb_build_object('valid', true, 'size', 5, 'category', 'five', 'subType', 'fourcard',
        'subTypeOrder', 3, 'rankValue', public._number_strength(quad_number)::bigint);
    elsif (grp_count[1] = 3 and grp_count[2] = 2) or (grp_count[1] = 2 and grp_count[2] = 3) then
      triple_number := case when grp_count[1] = 3 then grp_number[1] else grp_number[2] end;
      max_color_in_triple := 0;
      for i in array_lower(p_numbers, 1)..array_upper(p_numbers, 1) loop
        if p_numbers[i] = triple_number then
          max_color_in_triple := greatest(max_color_in_triple, public._color_rank(p_colors[i]));
        end if;
      end loop;
      return jsonb_build_object('valid', true, 'size', 5, 'category', 'five', 'subType', 'fullhouse',
        'subTypeOrder', 2, 'rankValue', public._number_strength(triple_number)::bigint * 10 + max_color_in_triple);
    else
      return jsonb_build_object('valid', false, 'reason', 'invalid_five_kicker');
    end if;
  elsif distinct_count = 5 then
    is_flush := true;
    for i in 2..5 loop
      if p_colors[i] <> p_colors[1] then is_flush := false; end if;
    end loop;

    select array_agg(x order by x) into sorted_numbers from unnest(p_numbers) x;
    is_consecutive := true;
    for i in 2..5 loop
      if sorted_numbers[i] <> sorted_numbers[i - 1] + 1 then is_consecutive := false; end if;
    end loop;
    if is_consecutive then
      valid_straight := true; top_value := sorted_numbers[5]; is_wrap := false;
    else
      select array_agg(x order by x) into wrap_set
        from unnest(array[p_max_number - 3, p_max_number - 2, p_max_number - 1, p_max_number, 1]) x;
      if sorted_numbers = wrap_set then
        valid_straight := true; top_value := p_max_number + 1; is_wrap := true;
      end if;
    end if;

    if is_flush and valid_straight then
      target_number := case when is_wrap then 1 else sorted_numbers[5] end;
      for i in array_lower(p_numbers, 1)..array_upper(p_numbers, 1) loop
        if p_numbers[i] = target_number then top_color := p_colors[i]; end if;
      end loop;
      return jsonb_build_object('valid', true, 'size', 5, 'category', 'five', 'subType', 'straightflush',
        'subTypeOrder', 4, 'rankValue', top_value::bigint * 10 + public._color_rank(top_color));
    end if;

    if is_flush then
      select array_agg(public._number_strength(x) order by public._number_strength(x) desc) into strengths from unnest(p_numbers) x;
      rank_value := 0;
      foreach s in array strengths loop
        rank_value := rank_value * 16 + s;
      end loop;
      return jsonb_build_object('valid', true, 'size', 5, 'category', 'five', 'subType', 'flush',
        'subTypeOrder', 1, 'rankValue', rank_value);
    end if;

    if valid_straight then
      target_number := case when is_wrap then 1 else sorted_numbers[5] end;
      for i in array_lower(p_numbers, 1)..array_upper(p_numbers, 1) loop
        if p_numbers[i] = target_number then top_color := p_colors[i]; end if;
      end loop;
      return jsonb_build_object('valid', true, 'size', 5, 'category', 'five', 'subType', 'straight',
        'subTypeOrder', 0, 'rankValue', top_value::bigint * 10 + public._color_rank(top_color));
    end if;

    return jsonb_build_object('valid', false, 'reason', 'invalid_five');
  else
    return jsonb_build_object('valid', false, 'reason', 'invalid_five_kicker');
  end if;
end;
$$;

-- 조합 판정 진입점 (원작 analyzeCombo)
create or replace function public._analyze_combo(p_tiles jsonb, p_max_number int)
returns jsonb
language plpgsql
as $$
declare
  sz int := jsonb_array_length(p_tiles);
  numbers int[] := '{}';
  colors text[] := '{}';
  rec record;
  distinct_cnt int;
  max_color int;
begin
  if sz = 4 then
    return jsonb_build_object('valid', false, 'reason', 'four_not_allowed');
  end if;

  for rec in select (value ->> 'color')::text as color, (value ->> 'number')::int as number
             from jsonb_array_elements(p_tiles)
  loop
    numbers := array_append(numbers, rec.number);
    colors := array_append(colors, rec.color);
  end loop;

  if sz = 1 then
    return jsonb_build_object('valid', true, 'size', 1, 'category', 'single', 'subType', 'single',
      'subTypeOrder', null, 'rankValue', public._tile_value(colors[1], numbers[1])::bigint);
  end if;

  if sz = 2 or sz = 3 then
    select count(distinct u) into distinct_cnt from unnest(numbers) u;
    if distinct_cnt <> 1 then
      return jsonb_build_object('valid', false, 'reason', case when sz = 2 then 'pair_same_number' else 'triple_same_number' end);
    end if;
    select max(public._color_rank(c)) into max_color from unnest(colors) c;
    return jsonb_build_object('valid', true, 'size', sz, 'category', case when sz = 2 then 'pair' else 'triple' end,
      'subType', case when sz = 2 then 'pair' else 'triple' end, 'subTypeOrder', null,
      'rankValue', (public._number_strength(numbers[1])::bigint * 10 + max_color));
  end if;

  if sz = 5 then
    return public._analyze_five(numbers, colors, p_max_number);
  end if;

  return jsonb_build_object('valid', false, 'reason', 'bad_size');
end;
$$;

-- 같은 크기 조합끼리 강함 비교 (원작 compareCombo) — 5장은 subType 우선, 그 외는 rankValue만
create or replace function public._compare_combo(a jsonb, b jsonb)
returns bigint
language sql
immutable
as $$
  select case
    when (a ->> 'size')::int = 5 and coalesce((a ->> 'subTypeOrder')::int, -1) <> coalesce((b ->> 'subTypeOrder')::int, -1)
      then ((a ->> 'subTypeOrder')::int - (b ->> 'subTypeOrder')::int)::bigint
    else (a ->> 'rankValue')::bigint - (b ->> 'rankValue')::bigint
  end;
$$;

-- 라운드 종료 시 순위별 점수 계산 (원작 calculateRoundScores — 손패 개수 차이를 순위쌍마다 주고받음)
create or replace function public._calculate_round_scores(p_results jsonb)
returns jsonb
language plpgsql
as $$
declare
  recs record;
  seats int[] := '{}';
  remainings int[] := '{}';
  n int;
  scores jsonb := '{}'::jsonb;
  i int;
  j int;
  diff int;
begin
  for recs in
    select (value ->> 'seat')::int as seat, (value ->> 'remaining')::int as remaining
    from jsonb_array_elements(p_results)
    order by (value ->> 'remaining')::int asc
  loop
    seats := array_append(seats, recs.seat);
    remainings := array_append(remainings, recs.remaining);
    scores := scores || jsonb_build_object(recs.seat::text, 0);
  end loop;
  n := array_length(seats, 1);
  for i in 1..n loop
    for j in (i + 1)..n loop
      diff := remainings[j] - remainings[i];
      scores := jsonb_set(scores, array[seats[i]::text], to_jsonb(((scores ->> seats[i]::text)::int + diff)));
      scores := jsonb_set(scores, array[seats[j]::text], to_jsonb(((scores ->> seats[j]::text)::int - diff)));
    end loop;
  end loop;
  return scores;
end;
$$;

-- ═══════════════════════════ M2-3/4: 게임 상태 테이블 + AI ═══════════════════════════

-- 손패 전체(비공개) — RLS는 켜져 있지만 정책이 하나도 없어 클라이언트는 절대 직접 조회/수정 불가.
-- SECURITY DEFINER 함수(소유자 postgres, RLS 우회)를 통해서만 접근한다.
create table if not exists public.game_states (
  room_id      uuid primary key references public.rooms (id) on delete cascade,
  hands        jsonb not null default '{}'::jsonb,
  played_tiles jsonb not null default '[]'::jsonb,
  updated_at   timestamptz not null default now()
);
alter table public.game_states enable row level security;

-- 공개 게임 상태(턴/필드/점수/손패 "개수"만) — 방 구성원이면 Realtime으로 구독 가능.
create table if not exists public.game_public (
  room_id       uuid primary key references public.rooms (id) on delete cascade,
  status        text not null default 'playing' check (status in ('playing', 'round_over', 'finished')),
  round         int not null default 1,
  total_rounds  int not null default 5,
  max_number    int not null,
  player_count  int not null,
  current_seat  int not null,
  lead_seat     int not null,
  required_size int,
  last_play     jsonb,
  pass_streak   int not null default 0,
  hand_counts   jsonb not null default '{}'::jsonb,
  total_scores  jsonb not null default '{}'::jsonb,
  round_results jsonb,
  updated_at    timestamptz not null default now()
);
alter table public.game_public enable row level security;

drop policy if exists "read game state of my rooms" on public.game_public;
create policy "read game state of my rooms" on public.game_public
  for select to authenticated using (public._is_room_member(room_id));

-- v1 AI 의사결정 (원작 lexio-ai.js를 축소 이식 — 상단 주석의 한계 참고)
create or replace function public._ai_choose_move(p_hand jsonb, p_max_number int, p_required_size int, p_last_combo jsonb)
returns jsonb
language plpgsql
as $$
declare
  grp record;
  best_number int;
  best_rank bigint;
  candidate_rank bigint;
  chosen_tiles jsonb;
  single_best jsonb;
  last_rank bigint;
begin
  if p_required_size is null then
    -- 선(lead): 약한 트리플 > 약한 페어 > 약한 싱글
    best_number := null;
    for grp in select * from public._hand_groups(p_hand) where cnt >= 3 order by public._number_strength(number) asc loop
      best_number := grp.number;
      exit;
    end loop;
    if best_number is not null then
      select coalesce(jsonb_agg(t), '[]'::jsonb) into chosen_tiles from (
        select t from jsonb_array_elements(p_hand) t
        where (t ->> 'number')::int = best_number
        order by public._color_rank(t ->> 'color') asc
        limit 3
      ) s;
      return jsonb_build_object('action', 'play', 'tiles', chosen_tiles);
    end if;

    for grp in select * from public._hand_groups(p_hand) where cnt >= 2 order by public._number_strength(number) asc loop
      best_number := grp.number;
      exit;
    end loop;
    if best_number is not null then
      select coalesce(jsonb_agg(t), '[]'::jsonb) into chosen_tiles from (
        select t from jsonb_array_elements(p_hand) t
        where (t ->> 'number')::int = best_number
        order by public._color_rank(t ->> 'color') asc
        limit 2
      ) s;
      return jsonb_build_object('action', 'play', 'tiles', chosen_tiles);
    end if;

    select t into single_best from jsonb_array_elements(p_hand) t
      order by public._tile_value(t ->> 'color', (t ->> 'number')::int) asc
      limit 1;
    return jsonb_build_object('action', 'play', 'tiles', jsonb_build_array(single_best));
  end if;

  -- 따라내기: 요구된 크기의 조합 중 상대를 이기는 "최소" 조합을 낸다 (원작 pickMinimalWinner)
  last_rank := (p_last_combo ->> 'rankValue')::bigint;

  if p_required_size = 1 then
    select t into single_best from jsonb_array_elements(p_hand) t
      where public._tile_value(t ->> 'color', (t ->> 'number')::int) > last_rank
      order by public._tile_value(t ->> 'color', (t ->> 'number')::int) asc
      limit 1;
    if single_best is null then
      return jsonb_build_object('action', 'pass');
    end if;
    return jsonb_build_object('action', 'play', 'tiles', jsonb_build_array(single_best));
  end if;

  if p_required_size = 2 or p_required_size = 3 then
    best_number := null;
    best_rank := null;
    for grp in select * from public._hand_groups(p_hand) where cnt >= p_required_size loop
      if p_required_size = 2 then
        candidate_rank := public._number_strength(grp.number)::bigint * 10 + grp.color_ranks[2];
      else
        candidate_rank := public._number_strength(grp.number)::bigint * 10 + grp.color_ranks[3];
      end if;
      if candidate_rank > last_rank and (best_rank is null or candidate_rank < best_rank) then
        best_rank := candidate_rank;
        best_number := grp.number;
      end if;
    end loop;
    if best_number is null then
      return jsonb_build_object('action', 'pass');
    end if;
    select coalesce(jsonb_agg(t), '[]'::jsonb) into chosen_tiles from (
      select t from jsonb_array_elements(p_hand) t
      where (t ->> 'number')::int = best_number
      order by public._color_rank(t ->> 'color') asc
      limit p_required_size
    ) s;
    return jsonb_build_object('action', 'play', 'tiles', chosen_tiles);
  end if;

  -- required_size = 5: v1 AI는 5장 조합을 받아치지 않고 항상 패스 (상단 주석 참고)
  return jsonb_build_object('action', 'pass');
end;
$$;

-- 한 수(내기/패스)를 실제로 적용 — 원작 submitPlay/passTurn/endRoundImmediately를 합친 내부 함수.
-- 사람 RPC(submit_move/pass_move)와 AI 루프(_run_ai_turns)가 공통으로 사용한다.
create or replace function public._apply_move(p_room_id uuid, p_seat int, p_tile_ids text[], p_pass boolean)
returns void
language plpgsql
as $$
declare
  gp public.game_public%rowtype;
  gs public.game_states%rowtype;
  hand jsonb;
  tiles jsonb := '[]'::jsonb;
  tile jsonb;
  combo jsonb;
  is_lead boolean;
  new_hand jsonb;
  v_hand_counts jsonb;
  t text;
  results jsonb;
  scores jsonb;
  ranking jsonb;
begin
  select * into gp from public.game_public where room_id = p_room_id for update;
  if not found then raise exception 'game_not_found'; end if;
  if gp.status <> 'playing' then raise exception 'round_not_playing'; end if;
  if gp.current_seat <> p_seat then raise exception 'not_your_turn'; end if;

  select * into gs from public.game_states where room_id = p_room_id for update;

  if p_pass then
    if gp.required_size is null then raise exception 'lead_cannot_pass'; end if;
    gp.pass_streak := gp.pass_streak + 1;
    if gp.pass_streak >= gp.player_count - 1 then
      update public.game_public set
        current_seat = gp.lead_seat, required_size = null, last_play = null, pass_streak = 0, updated_at = now()
      where room_id = p_room_id;
    else
      update public.game_public set
        current_seat = (gp.current_seat + 1) % gp.player_count, pass_streak = gp.pass_streak, updated_at = now()
      where room_id = p_room_id;
    end if;
    return;
  end if;

  hand := gs.hands -> p_seat::text;
  foreach t in array p_tile_ids loop
    select value into tile from jsonb_array_elements(hand) value where value ->> 'id' = t limit 1;
    if tile is null then raise exception 'tile_not_in_hand'; end if;
    tiles := tiles || jsonb_build_array(tile);
  end loop;
  if jsonb_array_length(tiles) = 0 then raise exception 'no_tiles_selected'; end if;

  combo := public._analyze_combo(tiles, gp.max_number);
  if not (combo ->> 'valid')::boolean then
    raise exception 'invalid_combo: %', combo ->> 'reason';
  end if;

  is_lead := gp.required_size is null;
  if not is_lead then
    if (combo ->> 'size')::int <> gp.required_size then
      raise exception 'wrong_size';
    end if;
    if public._compare_combo(combo, gp.last_play -> 'combo') <= 0 then
      raise exception 'must_be_higher';
    end if;
  end if;

  select coalesce(jsonb_agg(value), '[]'::jsonb) into new_hand
    from jsonb_array_elements(hand) value
    where not (value ->> 'id' = any (p_tile_ids));

  update public.game_states set
    hands = jsonb_set(gs.hands, array[p_seat::text], new_hand),
    played_tiles = gs.played_tiles || tiles,
    updated_at = now()
  where room_id = p_room_id;

  v_hand_counts := jsonb_set(gp.hand_counts, array[p_seat::text], to_jsonb(jsonb_array_length(new_hand)));

  if jsonb_array_length(new_hand) = 0 then
    select jsonb_agg(jsonb_build_object('seat', (key)::int, 'remaining', value::int))
      into results
      from jsonb_each_text(v_hand_counts) as e(key, value);
    scores := public._calculate_round_scores(results);
    select jsonb_agg(r order by (r ->> 'remaining')::int asc) into ranking from jsonb_array_elements(results) r;

    update public.game_public set
      hand_counts = v_hand_counts,
      last_play = jsonb_build_object('seat', p_seat, 'tiles', tiles, 'combo', combo),
      required_size = (combo ->> 'size')::int,
      lead_seat = p_seat,
      pass_streak = 0,
      status = case when gp.round >= gp.total_rounds then 'finished' else 'round_over' end,
      round_results = jsonb_build_object('finisherSeat', p_seat, 'results', results, 'scores', scores, 'ranking', ranking),
      total_scores = (
        select jsonb_object_agg(k, coalesce((gp.total_scores ->> k)::int, 0) + coalesce((scores ->> k)::int, 0))
        from jsonb_object_keys(gp.total_scores) k
      ),
      updated_at = now()
    where room_id = p_room_id;
    return;
  end if;

  update public.game_public set
    hand_counts = v_hand_counts,
    last_play = jsonb_build_object('seat', p_seat, 'tiles', tiles, 'combo', combo),
    required_size = (combo ->> 'size')::int,
    lead_seat = p_seat,
    pass_streak = 0,
    current_seat = (p_seat + 1) % gp.player_count,
    updated_at = now()
  where room_id = p_room_id;
end;
$$;

-- 현재 차례가 AI인 동안 자동으로 진행 (Edge Function/cron 없이 RPC 호출 안에서 동기 처리)
create or replace function public._run_ai_turns(p_room_id uuid)
returns void
language plpgsql
as $$
declare
  gp public.game_public%rowtype;
  seat_is_ai boolean;
  hand jsonb;
  decision jsonb;
  tile_ids text[];
  iterations int := 0;
begin
  loop
    iterations := iterations + 1;
    exit when iterations > 200; -- 안전장치: 버그로 인한 무한루프 방지

    select * into gp from public.game_public where room_id = p_room_id;
    if not found or gp.status <> 'playing' then exit; end if;

    select is_ai into seat_is_ai from public.room_members
      where room_id = p_room_id and seat = gp.current_seat;
    exit when not coalesce(seat_is_ai, false);

    select hands -> gp.current_seat::text into hand from public.game_states where room_id = p_room_id;
    decision := public._ai_choose_move(hand, gp.max_number, gp.required_size, gp.last_play -> 'combo');

    if decision ->> 'action' = 'pass' then
      perform public._apply_move(p_room_id, gp.current_seat, null, true);
    else
      select array_agg(t ->> 'id') into tile_ids from jsonb_array_elements(decision -> 'tiles') t;
      perform public._apply_move(p_room_id, gp.current_seat, tile_ids, false);
    end if;
  end loop;
end;
$$;

-- ═══════════════════════════ 공개 RPC ═══════════════════════════

create or replace function public.start_game(p_room_id uuid, p_total_rounds int default 5)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  r public.rooms%rowtype;
  member_count int;
  ready_count int;
  hands jsonb;
  starter int;
  hand_counts jsonb := '{}'::jsonb;
  total_scores jsonb := '{}'::jsonb;
  seat int;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if p_total_rounds < 1 or p_total_rounds > 20 then raise exception 'invalid_total_rounds'; end if;

  select * into r from public.rooms where id = p_room_id for update;
  if not found then raise exception 'room_not_found'; end if;
  if r.host_user_id <> uid then raise exception 'not_host'; end if;
  if r.status <> 'waiting' then raise exception 'room_already_started'; end if;

  select count(*) into member_count from public.room_members where room_id = p_room_id;
  if member_count <> r.max_players then raise exception 'seats_not_full'; end if;
  select count(*) into ready_count from public.room_members where room_id = p_room_id and is_ready;
  if ready_count <> member_count then raise exception 'not_all_ready'; end if;

  hands := public._deal_hands(r.max_players);
  starter := public._find_starting_seat(hands);

  for seat in 0..(r.max_players - 1) loop
    hand_counts := hand_counts || jsonb_build_object(seat::text, jsonb_array_length(hands -> seat::text));
    total_scores := total_scores || jsonb_build_object(seat::text, 0);
  end loop;

  insert into public.game_states (room_id, hands, played_tiles)
  values (p_room_id, hands, '[]'::jsonb)
  on conflict (room_id) do update set hands = excluded.hands, played_tiles = '[]'::jsonb, updated_at = now();

  insert into public.game_public (
    room_id, status, round, total_rounds, max_number, player_count,
    current_seat, lead_seat, required_size, last_play, pass_streak,
    hand_counts, total_scores, round_results, updated_at
  ) values (
    p_room_id, 'playing', 1, p_total_rounds, public._max_number(r.max_players), r.max_players,
    starter, starter, null, null, 0,
    hand_counts, total_scores, null, now()
  )
  on conflict (room_id) do update set
    status = 'playing', round = 1, total_rounds = p_total_rounds, max_number = excluded.max_number,
    player_count = excluded.player_count, current_seat = starter, lead_seat = starter,
    required_size = null, last_play = null, pass_streak = 0,
    hand_counts = excluded.hand_counts, total_scores = excluded.total_scores, round_results = null, updated_at = now();

  update public.rooms set status = 'playing', updated_at = now() where id = p_room_id;

  perform public._run_ai_turns(p_room_id);
end;
$$;

create or replace function public.submit_move(p_room_id uuid, p_tile_ids text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  seat int;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select rm.seat into seat from public.room_members rm where rm.room_id = p_room_id and rm.user_id = uid;
  if seat is null then raise exception 'not_in_room'; end if;
  perform public._apply_move(p_room_id, seat, p_tile_ids, false);
  perform public._run_ai_turns(p_room_id);
end;
$$;

create or replace function public.pass_move(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  seat int;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select rm.seat into seat from public.room_members rm where rm.room_id = p_room_id and rm.user_id = uid;
  if seat is null then raise exception 'not_in_room'; end if;
  perform public._apply_move(p_room_id, seat, null, true);
  perform public._run_ai_turns(p_room_id);
end;
$$;

create or replace function public.start_next_round(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  gp public.game_public%rowtype;
  is_member boolean;
  v_hands jsonb;
  starter int;
  v_hand_counts jsonb := '{}'::jsonb;
  seat int;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into gp from public.game_public where room_id = p_room_id for update;
  if not found then raise exception 'game_not_found'; end if;
  select exists(select 1 from public.room_members where room_id = p_room_id and user_id = uid) into is_member;
  if not is_member then raise exception 'not_in_room'; end if;
  if gp.status <> 'round_over' then raise exception 'round_not_over'; end if;

  v_hands := public._deal_hands(gp.player_count);
  starter := public._find_starting_seat(v_hands);
  for seat in 0..(gp.player_count - 1) loop
    v_hand_counts := v_hand_counts || jsonb_build_object(seat::text, jsonb_array_length(v_hands -> seat::text));
  end loop;

  update public.game_states set hands = v_hands, played_tiles = '[]'::jsonb, updated_at = now() where room_id = p_room_id;

  update public.game_public set
    status = 'playing', round = gp.round + 1, current_seat = starter, lead_seat = starter,
    required_size = null, last_play = null, pass_streak = 0, hand_counts = v_hand_counts,
    round_results = null, updated_at = now()
  where room_id = p_room_id;

  perform public._run_ai_turns(p_room_id);
end;
$$;

create or replace function public.get_my_hand(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  seat int;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select rm.seat into seat from public.room_members rm where rm.room_id = p_room_id and rm.user_id = uid;
  if seat is null then raise exception 'not_in_room'; end if;
  return coalesce((select hands -> seat::text from public.game_states where room_id = p_room_id), '[]'::jsonb);
end;
$$;

-- ═══════════════════════════ 권한 ═══════════════════════════
-- 내부 헬퍼는 authenticated/anon 직접 호출을 막는다 (오직 아래 공개 RPC 안에서만 호출됨).
revoke all on function public._color_rank(text) from public, anon, authenticated;
revoke all on function public._number_strength(int) from public, anon, authenticated;
revoke all on function public._max_number(int) from public, anon, authenticated;
revoke all on function public._tile_value(text, int) from public, anon, authenticated;
revoke all on function public._hand_groups(jsonb) from public, anon, authenticated;
revoke all on function public._deal_hands(int) from public, anon, authenticated;
revoke all on function public._find_starting_seat(jsonb) from public, anon, authenticated;
revoke all on function public._analyze_five(int[], text[], int) from public, anon, authenticated;
revoke all on function public._analyze_combo(jsonb, int) from public, anon, authenticated;
revoke all on function public._compare_combo(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public._calculate_round_scores(jsonb) from public, anon, authenticated;
revoke all on function public._ai_choose_move(jsonb, int, int, jsonb) from public, anon, authenticated;
revoke all on function public._apply_move(uuid, int, text[], boolean) from public, anon, authenticated;
revoke all on function public._run_ai_turns(uuid) from public, anon, authenticated;

revoke all on function public.start_game(uuid, int) from public, anon;
revoke all on function public.submit_move(uuid, text[]) from public, anon;
revoke all on function public.pass_move(uuid) from public, anon;
revoke all on function public.start_next_round(uuid) from public, anon;
revoke all on function public.get_my_hand(uuid) from public, anon;

grant execute on function public.start_game(uuid, int) to authenticated;
grant execute on function public.submit_move(uuid, text[]) to authenticated;
grant execute on function public.pass_move(uuid) to authenticated;
grant execute on function public.start_next_round(uuid) to authenticated;
grant execute on function public.get_my_hand(uuid) to authenticated;

-- ═══════════════════════════ Realtime ═══════════════════════════
-- game_public만 브로드캐스트 (game_states는 손패 전체가 들어있어 절대 구독 대상이 아님)
-- alter publication ... add table은 이미 추가된 경우 에러가 나서 재실행 안전성을 위해 조건부로 감싼다.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'game_public'
  ) then
    alter publication supabase_realtime add table public.game_public;
  end if;
end $$;
