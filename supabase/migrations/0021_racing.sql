-- 서킷 메이커(레이싱) 온라인 방 — 방장 브라우저 진행 방식 (mg_* 테이블)
-- 레이싱은 2~8명이라 방 인원·좌석 범위를 8명까지 넓힌다. 다른 게임의 인원 규칙은 그대로.
-- SQL Editor에 붙여 넣고 Run (여러 번 실행해도 안전)

alter table public.mg_rooms drop constraint if exists mg_rooms_max_players_check;
alter table public.mg_rooms add constraint mg_rooms_max_players_check check (max_players between 2 and 8);
alter table public.mg_room_members drop constraint if exists mg_room_members_seat_check;
alter table public.mg_room_members add constraint mg_room_members_seat_check check (seat between 0 and 7);

-- 게임별 인원 규칙
create or replace function public._mg_players_ok(p_game text, p_n int)
returns boolean
language sql immutable
as $$
  select case p_game
    when 'catan' then p_n between 2 and 4
    when 'dragon-call' then p_n = 4
    when 'holdem' then p_n between 2 and 6
    when 'racing' then p_n between 2 and 8
    else false
  end;
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
  if p_game not in ('catan', 'dragon-call', 'holdem', 'racing') then raise exception 'invalid_game'; end if;
  if not public._mg_players_ok(p_game, p_max_players) then raise exception 'invalid_player_count'; end if;
  insert into public.mg_rooms (code, game, host_user_id, max_players)
  values (public._mg_gen_code(), p_game, uid, p_max_players)
  returning * into r;
  insert into public.mg_room_members (room_id, seat, user_id, nickname)
  values (r.id, 0, uid, public._mg_nick(uid));
  return r;
end;
$$;

revoke all on function public._mg_players_ok(text, int) from public, anon;
revoke all on function public.mg_create_room(text, int) from public, anon;
grant execute on function public.mg_create_room(text, int) to authenticated;
