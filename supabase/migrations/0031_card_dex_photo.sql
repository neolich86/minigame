-- 카드 도감: 그림이 없는 카드에 사용자가 사진을 올릴 수 있게 한다 (공개 버킷 game-public/<user>/card-dex/u/<카드id>.webp, 1MB 이하)
-- SQL Editor에 붙여 넣고 Run (0030 다음, 여러 번 실행해도 안전)
alter table public.cd_cards drop constraint if exists cd_cards_image_check;
alter table public.cd_cards add constraint cd_cards_image_check
  check (image = '' or image ~ '^https://(assets\.tcgdex\.net|optcgapi\.com|images\.pokemontcg\.io|[a-z0-9]+\.supabase\.co/storage/v1/object/public/game-public/)');

-- 내 카드 그림 바꾸기 (올린 사진 주소는 내 폴더여야 한다)
create or replace function public.cd_set_image(p_id uuid, p_image text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_image like '%/storage/v1/object/public/game-public/%'
     and position('/game-public/' || auth.uid()::text || '/card-dex/' in p_image) = 0 then
    raise exception 'bad_image';
  end if;
  update public.cd_cards set image = coalesce(p_image, '') where id = p_id and user_id = auth.uid();
end;
$$;
revoke all on function public.cd_set_image(uuid, text) from public, anon;
grant execute on function public.cd_set_image(uuid, text) to authenticated;
