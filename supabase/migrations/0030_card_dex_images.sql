-- 카드 도감: 북미판 카드 그림(Pokémon TCG API, images.pokemontcg.io)도 저장할 수 있게 이미지 주소 검사를 넓힌다
-- SQL Editor에 붙여 넣고 Run (0029 다음, 여러 번 실행해도 안전)
alter table public.cd_cards drop constraint if exists cd_cards_image_check;
alter table public.cd_cards add constraint cd_cards_image_check
  check (image = '' or image ~ '^https://(assets\.tcgdex\.net|optcgapi\.com|images\.pokemontcg\.io)/');
