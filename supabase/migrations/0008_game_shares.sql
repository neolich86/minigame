-- 게임 공개 공유 링크 (Passport Map 내 지도 전용 주소 /m/<slug>)
-- SQL Editor에 붙여 넣고 Run (여러 번 실행해도 안전)
-- 본인 행만 만들고·고치고·지울 수 있고, 다른 사람은 slug를 알 때만 get_game_share()로 읽는다 (목록 조회 불가).

create table if not exists public.game_shares (
  slug text primary key check (slug ~ '^[A-Za-z0-9]{6,16}$'),
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id text not null check (game_id ~ '^[a-z0-9-]{1,40}$'),
  data jsonb not null,
  view_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, game_id),
  constraint game_shares_size check (pg_column_size(data) <= 512 * 1024)
);

alter table public.game_shares enable row level security;

drop policy if exists "game_shares own select" on public.game_shares;
create policy "game_shares own select" on public.game_shares
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "game_shares own insert" on public.game_shares;
create policy "game_shares own insert" on public.game_shares
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "game_shares own update" on public.game_shares;
create policy "game_shares own update" on public.game_shares
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "game_shares own delete" on public.game_shares;
create policy "game_shares own delete" on public.game_shares
  for delete to authenticated using (user_id = auth.uid());

-- slug로 한 개만 읽기 (누구나) + 조회수
create or replace function public.get_game_share(p_slug text)
returns table (slug text, game_id text, data jsonb, updated_at timestamptz, view_count int)
language sql security definer set search_path = public as $$
  update public.game_shares s set view_count = s.view_count + 1
  where s.slug = p_slug
  returning s.slug, s.game_id, s.data, s.updated_at, s.view_count;
$$;
revoke all on function public.get_game_share(text) from public;
grant execute on function public.get_game_share(text) to anon, authenticated;

-- 공개 사진 버킷 — 공개 주소로 누구나 보기, 올리기·지우기·목록은 본인 폴더(<user_id>/...)만
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('game-public', 'game-public', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 3145728,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "game-public own read" on storage.objects;
create policy "game-public own read" on storage.objects
  for select to authenticated
  using (bucket_id = 'game-public' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "game-public own insert" on storage.objects;
create policy "game-public own insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'game-public' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "game-public own update" on storage.objects;
create policy "game-public own update" on storage.objects
  for update to authenticated
  using (bucket_id = 'game-public' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "game-public own delete" on storage.objects;
create policy "game-public own delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'game-public' and (storage.foldername(name))[1] = auth.uid()::text);
