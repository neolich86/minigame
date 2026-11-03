-- 크리스마스 소원 마을 — 트리에 거는 소원 · 하트 · 신고 · 출석
-- 테이블은 직접 접근 불가, RPC 로만 쓴다 (정적 게임 → MGH.rpc → src/lib/gameRpc.ts 허용 목록).
-- 읽기는 로그인 없이, 소원 걸기 · 하트 · 신고 · 삭제 · 출석은 로그인 사용자만.
-- SQL Editor에 붙여 넣고 Run (여러 번 실행해도 안전)

create table if not exists public.xv_wishes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  nick       text not null default '' check (char_length(nick) <= 12),
  text       text not null check (char_length(text) between 1 and 50),
  ornament   text not null check (ornament in ('ball', 'star', 'flake', 'heart', 'bell', 'house', 'sock', 'moon',
                                                'gift', 'lantern', 'ginger', 'angel', 'sleigh', 'deer', 'candle', 'gold')),
  hearts     integer not null default 0,
  reports    integer not null default 0,
  hidden     boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists xv_wishes_new_idx on public.xv_wishes (created_at desc) where not hidden;
create index if not exists xv_wishes_top_idx on public.xv_wishes (hearts desc, created_at desc) where not hidden;
create index if not exists xv_wishes_user_idx on public.xv_wishes (user_id, created_at desc);
alter table public.xv_wishes enable row level security;

create table if not exists public.xv_hearts (
  wish_id    uuid not null references public.xv_wishes (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (wish_id, user_id)
);
create index if not exists xv_hearts_time_idx on public.xv_hearts (created_at);
alter table public.xv_hearts enable row level security;

create table if not exists public.xv_reports (
  wish_id    uuid not null references public.xv_wishes (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (wish_id, user_id)
);
alter table public.xv_reports enable row level security;

create table if not exists public.xv_players (
  user_id uuid primary key references auth.users (id) on delete cascade,
  days    date[] not null default '{}'
);
alter table public.xv_players enable row level security;

-- 소원 한 줄을 화면용 json 으로
create or replace function public._xv_row(w public.xv_wishes)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object('id', w.id, 'nick', w.nick, 'text', w.text, 'ornament', w.ornament, 'hearts', w.hearts,
                           'created_at', w.created_at,
                           'mine', auth.uid() is not null and w.user_id = auth.uid(),
                           'liked', auth.uid() is not null and exists (select 1 from public.xv_hearts h where h.wish_id = w.id and h.user_id = auth.uid()));
$$;
revoke all on function public._xv_row(public.xv_wishes) from public, anon, authenticated;

-- 트리에 걸 소원: 최신 180 + 하트 많은 120 (겹치면 하나만)
create or replace function public.xv_tree()
returns json language sql stable security definer set search_path = public as $$
  with pick as (
    (select * from public.xv_wishes where not hidden order by created_at desc limit 180)
    union
    (select * from public.xv_wishes where not hidden and hearts > 0 order by hearts desc, created_at desc limit 120)
  )
  select coalesce(json_agg(public._xv_row(p) order by p.created_at), '[]'::json) from pick p;
$$;

-- 소원 하나 (실시간으로 들어온 새 소원을 확인할 때)
create or replace function public.xv_wish(p_id uuid)
returns json language sql stable security definer set search_path = public as $$
  select public._xv_row(w) from public.xv_wishes w where w.id = p_id and not w.hidden;
$$;

-- 목록: p_sort = 'new' | 'top' | 'mine', 30개씩
create or replace function public.xv_list(p_sort text, p_offset integer default 0)
returns json language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(public._xv_row(w) order by
           case when p_sort = 'top' then w.hearts end desc nulls last, w.created_at desc), '[]'::json)
  from (
    select * from public.xv_wishes
     where (p_sort = 'mine' and user_id = auth.uid()) or (p_sort <> 'mine' and not hidden)
     order by case when p_sort = 'top' then hearts end desc nulls last, created_at desc
     limit 30 offset greatest(coalesce(p_offset, 0), 0)
  ) w;
$$;

-- 소원 걸기
create or replace function public.xv_add(p_text text, p_ornament text, p_nick text)
returns json language plpgsql security definer set search_path = public as $$
declare t text := btrim(coalesce(p_text, '')); n text := left(btrim(coalesce(p_nick, '')), 12); w public.xv_wishes;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if char_length(t) < 1 or char_length(t) > 50 then raise exception 'bad_length'; end if;
  if t ~* '(https?:|www\.|\.(com|net|kr|io|me)\M|\d{2,4}[-\s.]?\d{3,4}[-\s.]?\d{4})' then raise exception 'no_links'; end if;
  if t ~* '(씨발|시발|ㅅㅂ|ㅆㅂ|병신|ㅂㅅ|좆|존나|개새|새끼|니미|느금|섹스|sex|fuck|shit)' then raise exception 'bad_words'; end if;
  if (select count(*) from public.xv_wishes
       where user_id = auth.uid() and created_at >= date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul') >= 3 then
    raise exception 'daily_limit';
  end if;
  insert into public.xv_wishes (user_id, nick, text, ornament) values (auth.uid(), coalesce(nullif(n, ''), '눈사람'), t, p_ornament)
  returning * into w;
  return public._xv_row(w);
end;
$$;

-- 하트 켜기/끄기 → {liked, hearts}
create or replace function public.xv_heart(p_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare liked boolean; n integer;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  delete from public.xv_hearts where wish_id = p_id and user_id = auth.uid();
  if found then liked := false; update public.xv_wishes set hearts = greatest(hearts - 1, 0) where id = p_id returning hearts into n;
  else
    insert into public.xv_hearts (wish_id, user_id) values (p_id, auth.uid());
    liked := true; update public.xv_wishes set hearts = hearts + 1 where id = p_id returning hearts into n;
  end if;
  return json_build_object('liked', liked, 'hearts', coalesce(n, 0));
end;
$$;

-- 신고 (3명이 신고하면 숨김)
create or replace function public.xv_report(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  insert into public.xv_reports (wish_id, user_id) values (p_id, auth.uid()) on conflict do nothing;
  select count(*) into n from public.xv_reports where wish_id = p_id;
  update public.xv_wishes set reports = n, hidden = hidden or n >= 3 where id = p_id;
end;
$$;

-- 내 소원 지우기
create or replace function public.xv_delete(p_id uuid)
returns void language sql security definer set search_path = public as $$
  delete from public.xv_wishes where id = p_id and user_id = auth.uid();
$$;

-- 출석: 오늘(한국 날짜)과 이 기기에 쌓인 날짜를 합쳐 저장 → 출석 일수
create or replace function public.xv_checkin(p_days date[] default '{}')
returns integer language plpgsql security definer set search_path = public as $$
declare today date := (now() at time zone 'Asia/Seoul')::date; d date[];
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select array_agg(distinct x order by x) into d from (
    select unnest(coalesce((select days from public.xv_players where user_id = auth.uid()), '{}')) x
    union select unnest(coalesce(p_days, '{}')) x
    union select today
  ) s where x between date '2026-01-01' and today;
  d := d[greatest(array_length(d, 1) - 399, 1):];
  insert into public.xv_players (user_id, days) values (auth.uid(), d)
    on conflict (user_id) do update set days = excluded.days;
  return array_length(d, 1);
end;
$$;

-- 오늘의 소원: 어제(한국 날짜) 하트를 가장 많이 받은 소원
create or replace function public.xv_today()
returns json language sql stable security definer set search_path = public as $$
  select public._xv_row(w) from public.xv_wishes w
    join (select h.wish_id, count(*) c from public.xv_hearts h
           where (h.created_at at time zone 'Asia/Seoul')::date = (now() at time zone 'Asia/Seoul')::date - 1
           group by h.wish_id) y on y.wish_id = w.id
   where not w.hidden
   order by y.c desc, w.hearts desc, w.created_at
   limit 1;
$$;

revoke all on function public.xv_tree() from public;
revoke all on function public.xv_wish(uuid) from public;
revoke all on function public.xv_list(text, integer) from public;
revoke all on function public.xv_today() from public;
revoke all on function public.xv_add(text, text, text) from public, anon;
revoke all on function public.xv_heart(uuid) from public, anon;
revoke all on function public.xv_report(uuid) from public, anon;
revoke all on function public.xv_delete(uuid) from public, anon;
revoke all on function public.xv_checkin(date[]) from public, anon;
grant execute on function public.xv_tree() to anon, authenticated;
grant execute on function public.xv_wish(uuid) to anon, authenticated;
grant execute on function public.xv_list(text, integer) to anon, authenticated;
grant execute on function public.xv_today() to anon, authenticated;
grant execute on function public.xv_add(text, text, text) to authenticated;
grant execute on function public.xv_heart(uuid) to authenticated;
grant execute on function public.xv_report(uuid) to authenticated;
grant execute on function public.xv_delete(uuid) to authenticated;
grant execute on function public.xv_checkin(date[]) to authenticated;
