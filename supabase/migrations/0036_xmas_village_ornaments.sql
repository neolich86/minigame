-- 크리스마스 소원 마을: 장식을 새 그림 14종으로 바꿈 (0035 다음에 실행, 여러 번 실행해도 안전)
-- 예전 장식으로 걸린 소원은 가장 비슷한 새 장식으로 옮긴다.
alter table public.xv_wishes drop constraint if exists xv_wishes_ornament_check;
update public.xv_wishes set ornament = case ornament
  when 'ball' then 'redball' when 'heart' then 'redball' when 'house' then 'gift' when 'moon' then 'star'
  when 'lantern' then 'bell' when 'ginger' then 'cane' when 'angel' then 'star' when 'sleigh' then 'gift'
  when 'deer' then 'tree' when 'candle' then 'goldcane' when 'gold' then 'goldball' else ornament end
 where ornament in ('ball', 'heart', 'house', 'moon', 'lantern', 'ginger', 'angel', 'sleigh', 'deer', 'candle', 'gold');
alter table public.xv_wishes add constraint xv_wishes_ornament_check
  check (ornament in ('redball', 'star', 'flake', 'bell', 'sock', 'tree', 'gift', 'cane',
                      'santahat', 'holly', 'wreath', 'blueball', 'goldcane', 'goldball'));
