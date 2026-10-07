-- 회원 탈퇴 (구글 플레이 계정 삭제 정책) — 로그인한 본인 계정을 지운다
-- SQL Editor에 붙여 넣고 Run (여러 번 실행해도 안전)
-- auth.users 를 지우면 profiles·랭킹·게임 저장·공유 링크·방 기록이 on delete cascade 로 함께 지워진다.
-- 저장소(사진) 파일은 SQL로 지울 수 없어서 브라우저가 Storage API 로 먼저 지운 뒤 이 함수를 부른다.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'not_logged_in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
