import type { BadgeBook } from "./types";
import { PASSPORT_BOOK } from "./passport";

export type { BadgeBook, Badge, Tier, L10n } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyBook = BadgeBook<any>;

// 뱃지 도감에 보여줄 게임·서비스 (순서대로 탭). 새 도감은 여기에 추가
export const BOOKS: AnyBook[] = [PASSPORT_BOOK];
