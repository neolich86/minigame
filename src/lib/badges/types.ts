// 뱃지 도감 공통 형태. 게임·서비스마다 BadgeBook 하나를 만들어 src/lib/badges/index.ts 의 BOOKS 에 넣는다.
// 뱃지는 저장 데이터(game_saves)에서 그때그때 계산한다 — 따로 서버에 기록하지 않음.

export type L10n = { ko: string; en: string };
export type Tier = "bronze" | "silver" | "gold" | "diamond";

export type Badge<S> = {
  id: string;
  icon: string;
  name: L10n;
  desc: L10n;
  group: string; // BadgeBook.groups 의 id
  tier: Tier;
  goal: number;
  value: (s: S) => number;
  unit?: L10n; // 진행도 표시 단위 (예: 일, 개국)
};

export type BadgeBook<S = unknown> = {
  id: string;
  gameId: string; // game_saves.game_id
  title: L10n;
  icon: string;
  href: string;
  groups: { id: string; name: L10n }[];
  badges: Badge<S>[];
  /** 저장 데이터 → 계산용 통계. 데이터가 없거나 형식이 다르면 null */
  stats: (data: unknown) => S | null;
  empty: L10n; // 기록이 없을 때 안내
};
