-- 드래곤 콜 온라인 방 (방장 브라우저 진행 방식 — 헥사 아일랜드와 같은 mg_* 테이블 사용)
-- 4인 2:2 팀전 전용이라 인원은 항상 4명입니다.
-- SQL Editor에 붙여 넣고 Run (여러 번 실행해도 안전)

create or replace function public.mg_create_room(p_game text, p_max_players int default 4)
returns public.mg_rooms
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  r public.mg_rooms;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if p_game not in ('catan', 'dragon-call') then raise exception 'invalid_game'; end if;
  if p_max_players not between 2 and 4 then raise exception 'invalid_player_count'; end if;
  if p_game = 'dragon-call' and p_max_players <> 4 then raise exception 'invalid_player_count'; end if;
  insert into public.mg_rooms (code, game, host_user_id, max_players)
  values (public._mg_gen_code(), p_game, uid, p_max_players)
  returning * into r;
  insert into public.mg_room_members (room_id, seat, user_id, nickname)
  values (r.id, 0, uid, public._mg_nick(uid));
  return r;
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
  if r.game = 'dragon-call' and p_max <> 4 then raise exception 'invalid_player_count'; end if;
  if exists (select 1 from public.mg_room_members where room_id = p_room and seat >= p_max and user_id is not null) then
    raise exception 'seat_taken';
  end if;
  delete from public.mg_room_members where room_id = p_room and seat >= p_max;
  update public.mg_rooms set max_players = p_max, updated_at = now() where id = p_room;
end;
$$;

revoke all on function public.mg_create_room(text, int) from public, anon;
grant execute on function public.mg_create_room(text, int) to authenticated;
revoke all on function public.mg_set_max_players(uuid, int) from public, anon;
grant execute on function public.mg_set_max_players(uuid, int) to authenticated;
