-- 카드 도감 — 내가 가진 포켓몬·원피스 카드를 등록해 전시하고, 도감 전체나 고른 카드를 링크로 공유한다.
-- 카드 그림은 저장하지 않고 카드 API(TCGdex · OPTCG API)의 이미지 주소만 기록한다.
-- 테이블은 직접 접근 불가, RPC 로만 쓴다 (정적 게임 → MGH.rpc → src/lib/gameRpc.ts 허용 목록).
-- SQL Editor에 붙여 넣고 Run (여러 번 실행해도 안전)

create table if not exists public.cd_cards (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  game       text not null check (game in ('pokemon', 'onepiece')),
  ref        text not null check (char_length(ref) between 1 and 60),        -- API 카드 id (예: swsh1-25, OP01-001)
  name       text not null check (char_length(name) between 1 and 80),
  number     text not null default '' check (char_length(number) <= 40),
  set_name   text not null default '' check (char_length(set_name) <= 80),
  image      text not null default '' check (image = '' or image ~ '^https://(assets\.tcgdex\.net|optcgapi\.com)/'),
  lang       text not null check (lang in ('ko', 'ja', 'en')),               -- 한글판 · 일어판 · 북미(영문)판
  grader     text not null default 'raw' check (grader in ('raw', 'psa', 'bgs', 'cgc', 'brg', 'ars')),
  grade      numeric(3, 1) check (grade is null or (grade >= 1 and grade <= 10)),
  note       text not null default '' check (char_length(note) <= 100),
  created_at timestamptz not null default now()
);
create index if not exists cd_cards_user_idx on public.cd_cards (user_id, game, created_at desc);
alter table public.cd_cards enable row level security;

create table if not exists public.cd_shares (
  id         text primary key check (id ~ '^[a-zA-Z0-9]{8}$'),
  user_id    uuid not null references auth.users (id) on delete cascade,
  game       text check (game is null or game in ('pokemon', 'onepiece')), -- null = 두 도감 모두
  card_ids   uuid[],                                                       -- null = 도감 전체 (항상 최신)
  created_at timestamptz not null default now()
);
create index if not exists cd_shares_user_idx on public.cd_shares (user_id);
alter table public.cd_shares enable row level security;

create or replace function public._cd_nick(p uuid)
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select nickname from public.profiles where user_id = p), '수집가');
$$;
revoke all on function public._cd_nick(uuid) from public, anon, authenticated;

-- 내 카드
create or replace function public.cd_my_cards()
returns setof public.cd_cards language sql stable security definer set search_path = public as $$
  select * from public.cd_cards where user_id = auth.uid() order by created_at desc;
$$;

create or replace function public.cd_add_card(p_game text, p_ref text, p_name text, p_number text, p_set text, p_image text,
                                              p_lang text, p_grader text, p_grade numeric, p_note text)
returns uuid language plpgsql security definer set search_path = public as $$
declare nid uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if (select count(*) from public.cd_cards where user_id = auth.uid()) >= 3000 then raise exception 'too_many_cards'; end if;
  insert into public.cd_cards (user_id, game, ref, name, number, set_name, image, lang, grader, grade, note)
  values (auth.uid(), p_game, left(p_ref, 60), left(p_name, 80), left(coalesce(p_number, ''), 40), left(coalesce(p_set, ''), 80),
          coalesce(p_image, ''), p_lang, coalesce(p_grader, 'raw'),
          case when coalesce(p_grader, 'raw') = 'raw' then null else p_grade end, left(coalesce(p_note, ''), 100))
  returning id into nid;
  return nid;
end;
$$;

create or replace function public.cd_update_card(p_id uuid, p_lang text, p_grader text, p_grade numeric, p_note text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.cd_cards set lang = p_lang, grader = coalesce(p_grader, 'raw'),
         grade = case when coalesce(p_grader, 'raw') = 'raw' then null else p_grade end,
         note = left(coalesce(p_note, ''), 100)
   where id = p_id and user_id = auth.uid();
end;
$$;

create or replace function public.cd_delete_card(p_id uuid)
returns void language sql security definer set search_path = public as $$
  delete from public.cd_cards where id = p_id and user_id = auth.uid();
$$;

-- 공유 만들기: p_ids 가 비어 있으면 도감 전체(p_game 이 null 이면 두 도감 모두) → 8자 링크 id
create or replace function public.cd_share(p_game text, p_ids uuid[])
returns text language plpgsql security definer set search_path = public as $$
declare sid text; ids uuid[];
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_game is not null and p_game not in ('pokemon', 'onepiece') then raise exception 'bad_game'; end if;
  if p_ids is not null and cardinality(p_ids) > 0 then
    select array_agg(id) into ids from public.cd_cards where user_id = auth.uid() and id = any (p_ids);
    if ids is null then raise exception 'no_cards'; end if;
  end if;
  -- 같은 내용의 공유가 이미 있으면 재사용
  select s.id into sid from public.cd_shares s
   where s.user_id = auth.uid() and s.game is not distinct from p_game
     and ((ids is null and s.card_ids is null) or (s.card_ids @> ids and s.card_ids <@ ids))
   limit 1;
  if sid is not null then return sid; end if;
  if (select count(*) from public.cd_shares where user_id = auth.uid() and created_at > now() - interval '1 day') >= 50 then
    raise exception 'too_many_shares';
  end if;
  loop
    sid := substr(md5(random()::text || clock_timestamp()::text), 1, 8);
    exit when not exists (select 1 from public.cd_shares where id = sid);
  end loop;
  insert into public.cd_shares (id, user_id, game, card_ids) values (sid, auth.uid(), p_game, ids);
  return sid;
end;
$$;

-- 공유 보기 (로그인 없이도) → {nickname, game, all, cards:[...]}
create or replace function public.cd_get_share(p_id text)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'nickname', public._cd_nick(s.user_id),
    'game', s.game,
    'all', s.card_ids is null,
    'cards', coalesce((
      select json_agg(json_build_object('id', c.id, 'game', c.game, 'ref', c.ref, 'name', c.name, 'number', c.number,
                                        'set_name', c.set_name, 'image', c.image, 'lang', c.lang, 'grader', c.grader,
                                        'grade', c.grade, 'note', c.note) order by c.created_at desc)
        from public.cd_cards c
       where c.user_id = s.user_id
         and (s.game is null or c.game = s.game)
         and (s.card_ids is null or c.id = any (s.card_ids))), '[]'::json))
  from public.cd_shares s where s.id = p_id;
$$;

revoke all on function public.cd_my_cards() from public, anon;
revoke all on function public.cd_add_card(text, text, text, text, text, text, text, text, numeric, text) from public, anon;
revoke all on function public.cd_update_card(uuid, text, text, numeric, text) from public, anon;
revoke all on function public.cd_delete_card(uuid) from public, anon;
revoke all on function public.cd_share(text, uuid[]) from public, anon;
grant execute on function public.cd_my_cards() to authenticated;
grant execute on function public.cd_add_card(text, text, text, text, text, text, text, text, numeric, text) to authenticated;
grant execute on function public.cd_update_card(uuid, text, text, numeric, text) to authenticated;
grant execute on function public.cd_delete_card(uuid) to authenticated;
grant execute on function public.cd_share(text, uuid[]) to authenticated;
grant execute on function public.cd_get_share(text) to anon, authenticated;
