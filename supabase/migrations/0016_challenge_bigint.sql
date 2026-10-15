-- 도전장 점수를 bigint 로 (룰렛·바카라 잔액은 21억 원을 넘을 수 있어 integer 로는 도전장을 못 만든다)
-- SQL Editor에 붙여 넣고 Run (여러 번 실행해도 안전)

alter table public.challenges alter column score type bigint;

-- 인자·반환 타입이 바뀌므로 옛 함수를 지우고 다시 만든다
drop function if exists public.score_top_pct(text, integer);
drop function if exists public.create_challenge(text, integer, text, jsonb);
drop function if exists public.get_challenge(text);

create or replace function public.score_top_pct(p_game_id text, p_score bigint)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  with t as (
    select count(*) filter (where best_score > p_score) as better, count(*) as total
    from public.leaderboard where game_id = p_game_id
  )
  select case when total = 0 then null
              else least(100, round((better + 1)::numeric / greatest(total, better + 1) * 100, 1))
         end
  from t;
$$;

create or replace function public.create_challenge(p_game_id text, p_score bigint, p_nickname text default null, p_meta jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  b public.ranked_boards;
  nick text;
  c text;
  alphabet text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  i int;
  tries int := 0;
begin
  select * into b from public.ranked_boards where game_id = p_game_id;
  if not found then raise exception 'invalid_score'; end if;
  if p_score is null or p_score < b.min_score or p_score > b.max_score then raise exception 'invalid_score'; end if;
  if p_meta is null or pg_column_size(p_meta) > 1000 then p_meta := '{}'::jsonb; end if;

  if uid is not null then
    select nickname into nick from public.profiles where user_id = uid;
    if (select count(*) from public.challenges where user_id = uid and created_at > now() - interval '1 minute') >= 10 then
      raise exception 'rate_limited';
    end if;
  end if;
  nick := coalesce(nullif(left(btrim(coalesce(nick, p_nickname, '')), 12), ''), '익명');

  loop
    c := '';
    for i in 1..5 loop
      c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.challenges where code = c);
    tries := tries + 1;
    if tries > 20 then raise exception 'code_failed'; end if;
  end loop;

  insert into public.challenges (code, game_id, user_id, nickname, score, meta)
  values (c, p_game_id, uid, nick, p_score, p_meta);

  return jsonb_build_object('code', c, 'nickname', nick, 'pct', public.score_top_pct(p_game_id, p_score));
end;
$$;

create or replace function public.get_challenge(p_code text)
returns table (code text, game_id text, nickname text, score bigint, meta jsonb, created_at timestamptz, pct numeric)
language sql
stable
security definer
set search_path = public
as $$
  select c.code, c.game_id, c.nickname, c.score, c.meta, c.created_at, public.score_top_pct(c.game_id, c.score)
  from public.challenges c
  where c.code = upper(left(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'), 8));
$$;

revoke all on function public.score_top_pct(text, bigint) from public;
revoke all on function public.create_challenge(text, bigint, text, jsonb) from public;
revoke all on function public.get_challenge(text) from public;
grant execute on function public.score_top_pct(text, bigint) to anon, authenticated;
grant execute on function public.create_challenge(text, bigint, text, jsonb) to anon, authenticated;
grant execute on function public.get_challenge(text) to anon, authenticated;
