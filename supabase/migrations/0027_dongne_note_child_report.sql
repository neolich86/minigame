-- 동네쪽지: 신고 사유에 '아동 안전' 추가 — 이 사유는 1건만 들어와도 즉시 숨김 (구글 플레이 아동 안전 표준)
-- SQL Editor에 붙여 넣고 Run (여러 번 실행해도 안전, 0026 다음에)

alter table public.dn_reports drop constraint if exists dn_reports_reason_check;
alter table public.dn_reports add constraint dn_reports_reason_check
  check (reason in ('spam', 'sexual', 'hate', 'privacy', 'child', 'etc'));

create or replace function public.dn_report(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare r text := case when p_reason in ('spam','sexual','hate','privacy','child','etc') then p_reason else 'etc' end;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  insert into public.dn_reports (memo_id, user_id, reason) values (p_id, auth.uid(), r)
  on conflict (memo_id, user_id) do update set reason = excluded.reason;
  if r = 'child' or (select count(*) from public.dn_reports where memo_id = p_id) >= 3 then
    update public.dn_memos set hidden = true where id = p_id;
  end if;
end;
$$;
