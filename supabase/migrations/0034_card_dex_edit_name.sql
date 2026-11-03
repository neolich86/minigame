-- 카드 도감: 수정 화면에서 카드 이름 · 번호도 고칠 수 있게
-- SQL Editor에 붙여 넣고 Run (0032 다음, 여러 번 실행해도 안전)
drop function if exists public.cd_update_card(uuid, text, text, numeric, text, text);
create or replace function public.cd_update_card(p_id uuid, p_lang text, p_grader text, p_grade numeric, p_note text, p_tag text default '',
                                                 p_name text default null, p_number text default null)
returns void language plpgsql security definer set search_path = public as $$
declare g text := coalesce(p_grader, 'raw');
begin
  if p_name is not null and char_length(trim(p_name)) = 0 then raise exception 'empty_name'; end if;
  update public.cd_cards set lang = p_lang, grader = g,
         grade = case when g = 'raw' then null else p_grade end,
         grade_tag = case when g = 'raw' then '' else coalesce(p_tag, '') end,
         note = left(coalesce(p_note, ''), 100),
         name = coalesce(left(trim(p_name), 80), name),
         number = coalesce(left(trim(p_number), 40), number)
   where id = p_id and user_id = auth.uid();
end;
$$;
revoke all on function public.cd_update_card(uuid, text, text, numeric, text, text, text, text) from public, anon;
grant execute on function public.cd_update_card(uuid, text, text, numeric, text, text, text, text) to authenticated;
