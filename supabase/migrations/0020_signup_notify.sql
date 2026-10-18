-- 새 회원 가입 알림: auth.users 에 새 회원이 생기면 사이트의 /api/hooks/new-user 를 호출한다.
-- 비밀값은 이 파일에 적지 않고 Supabase Vault 에 따로 저장한다 (docs/setup.md 참고):
--   select vault.create_secret('<SIGNUP_HOOK_SECRET 과 같은 값>', 'signup_hook_secret');
-- 알림이 실패해도 가입은 절대 막지 않는다.

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_new_signup()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  secret text;
begin
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'signup_hook_secret' limit 1;
  if secret is null then
    return new;
  end if;
  perform net.http_post(
    url := 'https://playwithme.kr/api/hooks/new-user',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-hook-secret', secret),
    body := jsonb_build_object(
      'id', new.id,
      'email', new.email,
      'provider', coalesce(new.raw_app_meta_data ->> 'provider', 'email'),
      'name', coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'nickname', new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'user_name'),
      'created_at', new.created_at
    )
  );
  return new;
exception when others then
  return new;
end;
$$;

revoke all on function public.notify_new_signup() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_notify on auth.users;
create trigger on_auth_user_created_notify
  after insert on auth.users
  for each row execute function public.notify_new_signup();
