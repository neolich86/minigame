-- My Post 2026 — 공유 리포트 저장 (인스타 연말 결산)
-- SQL Editor에 붙여 넣고 Run (여러 번 실행해도 안전)
-- 읽기·쓰기는 모두 서버(API)가 service role 키로만 한다. 브라우저에서 직접 접근하는 정책은 두지 않는다.

create table if not exists public.mypost_reports (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,               -- 공유 링크 /r/<slug>
  ig_user_id text not null,                -- 같은 계정·같은 해는 링크를 유지하고 내용만 갱신
  username text not null,
  year int not null,
  data jsonb not null,                     -- 게시물별 숫자 + BEST 9 이미지 주소
  delete_token text not null,              -- 만든 사람 브라우저에만 저장되는 삭제 키
  ref_from text,                           -- 어떤 공유 링크를 보고 만들었는지 (바이럴 추적)
  view_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ig_user_id, year)
);

create index if not exists mypost_reports_ref_idx on public.mypost_reports (ref_from);

alter table public.mypost_reports enable row level security;
-- 정책 없음 = anon/authenticated 접근 불가 (service role 만 가능)

-- BEST 9·프로필 이미지 (공개 읽기 버킷, 업로드는 서버만)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mypost', 'mypost', true, 1048576, array['image/webp'])
on conflict (id) do update set public = true, file_size_limit = 1048576, allowed_mime_types = array['image/webp'];

-- 바이럴 지표: 리포트 1개당 친구가 새로 만든 리포트 수 (K-factor)
create or replace view public.mypost_kfactor as
select
  count(*) as reports,
  count(*) filter (where ref_from is not null) as from_share,
  round(count(*) filter (where ref_from is not null)::numeric / nullif(count(*), 0), 3) as k_factor,
  sum(view_count) as total_views
from public.mypost_reports;

revoke all on public.mypost_kfactor from anon, authenticated;
