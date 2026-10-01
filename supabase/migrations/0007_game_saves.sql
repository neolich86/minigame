-- 게임별 사용자 저장 데이터 (Passport Map 등) — 로그인한 사용자의 진행 상황을 계정에 보관
-- SQL Editor에 붙여 넣고 Run (여러 번 실행해도 안전)
-- 브라우저(anon 키 + 로그인 세션)에서 직접 읽고 쓰며, RLS로 본인 데이터만 접근할 수 있다.

create table if not exists public.game_saves (
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id text not null check (game_id ~ '^[a-z0-9-]{1,40}$'),
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id),
  constraint game_saves_size check (pg_column_size(data) <= 512 * 1024)
);

alter table public.game_saves enable row level security;

drop policy if exists "game_saves own select" on public.game_saves;
create policy "game_saves own select" on public.game_saves
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "game_saves own insert" on public.game_saves;
create policy "game_saves own insert" on public.game_saves
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "game_saves own update" on public.game_saves;
create policy "game_saves own update" on public.game_saves
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "game_saves own delete" on public.game_saves;
create policy "game_saves own delete" on public.game_saves
  for delete to authenticated using (user_id = auth.uid());

-- 게임 첨부 파일 (Passport Map 사진) — 비공개 버킷, 경로 = <user_id>/<game_id>/<파일>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('game-files', 'game-files', false, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 3145728,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "game-files own read" on storage.objects;
create policy "game-files own read" on storage.objects
  for select to authenticated
  using (bucket_id = 'game-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "game-files own insert" on storage.objects;
create policy "game-files own insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'game-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "game-files own update" on storage.objects;
create policy "game-files own update" on storage.objects
  for update to authenticated
  using (bucket_id = 'game-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "game-files own delete" on storage.objects;
create policy "game-files own delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'game-files' and (storage.foldername(name))[1] = auth.uid()::text);
