-- 카드 도감: 등급 회사마다 다른 등급 표기 — 같은 10점이라도 BGS 블랙라벨 · 프리스틴, CGC 프리스틴 · 젬민트, ARS 10+ 를 구분한다
-- grade_tag: '' | 'bl'(BGS Black Label) | 'pristine' | 'gem' | 'plus'(ARS 10+)
-- SQL Editor에 붙여 넣고 Run (0031 다음, 여러 번 실행해도 안전)
alter table public.cd_cards add column if not exists grade_tag text not null default '';
alter table public.cd_cards drop constraint if exists cd_cards_grade_tag_check;
alter table public.cd_cards add constraint cd_cards_grade_tag_check check (grade_tag in ('', 'bl', 'pristine', 'gem', 'plus'));

drop function if exists public.cd_my_cards();
create function public.cd_my_cards()
returns setof public.cd_cards language sql stable security definer set search_path = public as $$
  select * from public.cd_cards where user_id = auth.uid() order by created_at desc;
$$;

drop function if exists public.cd_add_card(text, text, text, text, text, text, text, text, numeric, text);
create or replace function public.cd_add_card(p_game text, p_ref text, p_name text, p_number text, p_set text, p_image text,
                                              p_lang text, p_grader text, p_grade numeric, p_note text, p_tag text default '')
returns uuid language plpgsql security definer set search_path = public as $$
declare nid uuid; g text := coalesce(p_grader, 'raw');
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if (select count(*) from public.cd_cards where user_id = auth.uid()) >= 3000 then raise exception 'too_many_cards'; end if;
  insert into public.cd_cards (user_id, game, ref, name, number, set_name, image, lang, grader, grade, grade_tag, note)
  values (auth.uid(), p_game, left(p_ref, 60), left(p_name, 80), left(coalesce(p_number, ''), 40), left(coalesce(p_set, ''), 80),
          coalesce(p_image, ''), p_lang, g, case when g = 'raw' then null else p_grade end,
          case when g = 'raw' then '' else coalesce(p_tag, '') end, left(coalesce(p_note, ''), 100))
  returning id into nid;
  return nid;
end;
$$;

drop function if exists public.cd_update_card(uuid, text, text, numeric, text);
create or replace function public.cd_update_card(p_id uuid, p_lang text, p_grader text, p_grade numeric, p_note text, p_tag text default '')
returns void language plpgsql security definer set search_path = public as $$
declare g text := coalesce(p_grader, 'raw');
begin
  update public.cd_cards set lang = p_lang, grader = g,
         grade = case when g = 'raw' then null else p_grade end,
         grade_tag = case when g = 'raw' then '' else coalesce(p_tag, '') end,
         note = left(coalesce(p_note, ''), 100)
   where id = p_id and user_id = auth.uid();
end;
$$;

create or replace function public.cd_get_share(p_id text)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'nickname', public._cd_nick(s.user_id),
    'game', s.game,
    'all', s.card_ids is null,
    'cards', coalesce((
      select json_agg(json_build_object('id', c.id, 'game', c.game, 'ref', c.ref, 'name', c.name, 'number', c.number,
                                        'set_name', c.set_name, 'image', c.image, 'lang', c.lang, 'grader', c.grader,
                                        'grade', c.grade, 'grade_tag', c.grade_tag, 'note', c.note) order by c.created_at desc)
        from public.cd_cards c
       where c.user_id = s.user_id
         and (s.game is null or c.game = s.game)
         and (s.card_ids is null or c.id = any (s.card_ids))), '[]'::json))
  from public.cd_shares s where s.id = p_id;
$$;

revoke all on function public.cd_my_cards() from public, anon;
revoke all on function public.cd_add_card(text, text, text, text, text, text, text, text, numeric, text, text) from public, anon;
revoke all on function public.cd_update_card(uuid, text, text, numeric, text, text) from public, anon;
grant execute on function public.cd_my_cards() to authenticated;
grant execute on function public.cd_add_card(text, text, text, text, text, text, text, text, numeric, text, text) to authenticated;
grant execute on function public.cd_update_card(uuid, text, text, numeric, text, text) to authenticated;
grant execute on function public.cd_get_share(text) to anon, authenticated;
