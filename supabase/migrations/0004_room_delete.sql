-- 방장이 자기가 만든 방을 삭제 (카탄 mg_rooms / 렉시오 rooms)
-- 방을 지우면 참가자·게임 상태도 함께 삭제됩니다(on delete cascade). 진행 중인 게임도 즉시 종료됩니다.
-- SQL Editor에 붙여 넣고 Run (여러 번 실행해도 안전)

create or replace function public.mg_delete_room(p_room uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  host uuid;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select host_user_id into host from public.mg_rooms where id = p_room for update;
  if not found then raise exception 'room_not_found'; end if;
  if host <> uid then raise exception 'not_host'; end if;
  delete from public.mg_rooms where id = p_room;
end;
$$;

create or replace function public.delete_room(p_room_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  host uuid;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select host_user_id into host from public.rooms where id = p_room_id for update;
  if not found then raise exception 'room_not_found'; end if;
  if host <> uid then raise exception 'not_host'; end if;
  delete from public.rooms where id = p_room_id;
end;
$$;

revoke all on function public.mg_delete_room(uuid) from public, anon;
grant execute on function public.mg_delete_room(uuid) to authenticated;
revoke all on function public.delete_room(uuid) from public, anon;
grant execute on function public.delete_room(uuid) to authenticated;
