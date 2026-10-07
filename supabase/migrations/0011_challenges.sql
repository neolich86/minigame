-- 친구에게 도전하기 (도전장 링크 /challenge/<code>)
-- 게임 결과 화면에서 내 기록으로 도전장을 만들고, 친구는 링크로 들어와 그 기록에 도전한다.
-- 테이블은 직접 읽고 쓸 수 없고, 아래 RPC 로만 만들기/읽기가 된다 (로그인 없이도 가능).

create table if not exists public.challenges (
  code        text primary key,
  game_id     text not null references public.ranked_boards (game_id) on delete cascade,
  user_id     uuid references auth.users (id) on delete set null,
  nickname    text not null check (char_length(nickname) between 1 and 12),
  score       integer not null,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists challenges_user_idx on public.challenges (user_id, created_at desc);

alter table public.challenges enable row level security;
-- 정책 없음 = 직접 접근 불가 (RPC 전용)

-- 이 점수가 랭킹 상위 몇 % 인지 (기록 보유자 중) — 기록이 없으면 null
create or replace function public.score_top_pct(p_game_id text, p_score integer)
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

create or replace function public.create_challenge(p_game_id text, p_score integer, p_nickname text default null, p_meta jsonb default '{}'::jsonb)
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
    -- 로그인 사용자는 1분에 10개까지
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
returns table (code text, game_id text, nickname text, score integer, meta jsonb, created_at timestamptz, pct numeric)
language sql
stable
security definer
set search_path = public
as $$
  select c.code, c.game_id, c.nickname, c.score, c.meta, c.created_at, public.score_top_pct(c.game_id, c.score)
  from public.challenges c
  where c.code = upper(left(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'), 8));
$$;

revoke all on function public.score_top_pct(text, integer) from public;
revoke all on function public.create_challenge(text, integer, text, jsonb) from public;
revoke all on function public.get_challenge(text) from public;
grant execute on function public.score_top_pct(text, integer) to anon, authenticated;
grant execute on function public.create_challenge(text, integer, text, jsonb) to anon, authenticated;
grant execute on function public.get_challenge(text) to anon, authenticated;
