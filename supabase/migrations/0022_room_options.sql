-- 온라인 방 설정 (게임별 옵션) — 대기실에서 방장이 고르는 값. 예: 서킷 메이커 랩 수 {"laps": 3}
-- SQL Editor에 붙여 넣고 Run (여러 번 실행해도 안전)

alter table public.mg_rooms add column if not exists options jsonb not null default '{}'::jsonb;

create or replace function public.mg_set_options(p_room uuid, p_options jsonb)
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
  if jsonb_typeof(p_options) <> 'object' or pg_column_size(p_options) > 2000 then raise exception 'invalid_options'; end if;
  update public.mg_rooms set options = p_options, updated_at = now() where id = p_room;
end;
$$;

revoke all on function public.mg_set_options(uuid, jsonb) from public, anon;
grant execute on function public.mg_set_options(uuid, jsonb) to authenticated;
