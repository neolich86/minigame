// 렉시오 온라인 — 서버(DB 함수)가 규칙을 판정하는 멀티플레이 (supabase/migrations/0003_lexio_online.sql)
// neolich86/lexio-online 의 rooms.ts / game.ts 를 포털 공용 Supabase 클라이언트로 옮긴 것.
import { sb } from "./supabase";

export interface LexioRoom {
  id: string;
  code: string;
  host_user_id: string;
  status: "waiting" | "playing" | "finished";
  max_players: number;
  created_at: string;
  updated_at: string;
}

export interface LexioMember {
  room_id: string;
  seat: number;
  user_id: string | null;
  is_ai: boolean;
  nickname: string;
  is_ready: boolean;
  connected: boolean;
}

export type Tile = { id: string; color: "blue" | "green" | "yellow" | "red"; number: number };

export interface Combo {
  valid: boolean;
  size?: number;
  category?: "single" | "pair" | "triple" | "five";
  subType?: "single" | "pair" | "triple" | "straight" | "flush" | "fullhouse" | "fourcard" | "straightflush";
}

export interface GamePublic {
  room_id: string;
  status: "playing" | "round_over" | "finished";
  round: number;
  total_rounds: number;
  max_number: number;
  player_count: number;
  current_seat: number;
  lead_seat: number;
  required_size: number | null;
  last_play: { seat: number; tiles: Tile[]; combo: Combo } | null;
  pass_streak: number;
  hand_counts: Record<string, number>;
  total_scores: Record<string, number>;
  round_results: {
    finisherSeat: number;
    scores: Record<string, number>;
    ranking: { seat: number; remaining: number }[];
  } | null;
  updated_at: string;
}

function client() {
  const c = sb();
  if (!c) throw new Error("not_configured");
  return c;
}
async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await client().rpc(fn, args);
  if (error) throw error;
  return data as T;
}

export const lxCreateRoom = (nickname: string | null, players: number) =>
  rpc<LexioRoom>("create_room", { p_nickname: nickname, p_player_count: players });
export const lxJoinRoom = (code: string, nickname: string | null) =>
  rpc<LexioRoom>("join_room", { p_code: code.toUpperCase(), p_nickname: nickname });
export const lxFillAI = (roomId: string, seat: number) => rpc<void>("fill_with_ai", { p_room_id: roomId, p_seat: seat });
export const lxSetReady = (roomId: string, ready: boolean) => rpc<void>("set_ready", { p_room_id: roomId, p_ready: ready });
export const lxLeave = (roomId: string) => rpc<void>("leave_room", { p_room_id: roomId });
export const lxStart = (roomId: string, rounds: number) => rpc<void>("start_game", { p_room_id: roomId, p_total_rounds: rounds });
export const lxNextRound = (roomId: string) => rpc<void>("start_next_round", { p_room_id: roomId });
export const lxSubmit = (roomId: string, tileIds: string[]) => rpc<void>("submit_move", { p_room_id: roomId, p_tile_ids: tileIds });
export const lxPass = (roomId: string) => rpc<void>("pass_move", { p_room_id: roomId });

export async function lxMyHand(roomId: string): Promise<Tile[]> {
  return ((await rpc<Tile[] | null>("get_my_hand", { p_room_id: roomId })) ?? []) as Tile[];
}

export async function lxFetchRoom(roomId: string): Promise<LexioRoom | null> {
  const { data, error } = await client().from("rooms").select("*").eq("id", roomId).maybeSingle();
  if (error) throw error;
  return data as LexioRoom | null;
}

export async function lxFetchMembers(roomId: string): Promise<LexioMember[]> {
  const { data, error } = await client()
    .from("room_members")
    .select("room_id,seat,user_id,is_ai,nickname,is_ready,connected")
    .eq("room_id", roomId)
    .order("seat");
  if (error) throw error;
  return (data ?? []) as LexioMember[];
}

export async function lxFetchGame(roomId: string): Promise<GamePublic | null> {
  const { data, error } = await client().from("game_public").select("*").eq("room_id", roomId).maybeSingle();
  if (error) throw error;
  return data as GamePublic | null;
}

export async function lxMyRooms(): Promise<LexioRoom[]> {
  const { data, error } = await client()
    .from("rooms")
    .select("*")
    .neq("status", "finished")
    .order("updated_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data ?? []) as LexioRoom[];
}

/** 렉시오 서버 오류 코드 → 사용자 문구 */
const LX_ERR: Record<string, { ko: string; en: string }> = {
  not_your_turn: { ko: "아직 내 차례가 아니에요.", en: "It's not your turn yet." },
  lead_cannot_pass: { ko: "필드가 비어 있을 땐 패스할 수 없어요 — 먼저 내야 해요.", en: "You can't pass on an empty field — you have to lead." },
  tile_not_in_hand: { ko: "손패에 없는 타일이에요.", en: "That tile isn't in your hand." },
  no_tiles_selected: { ko: "낼 타일을 먼저 선택해 주세요.", en: "Select tiles to play first." },
  four_not_allowed: { ko: "4장은 낼 수 없어요.", en: "You can't play 4 tiles." },
  pair_same_number: { ko: "페어는 같은 숫자 2장이어야 해요.", en: "A pair must be two tiles of the same number." },
  triple_same_number: { ko: "트리플은 같은 숫자 3장이어야 해요.", en: "A triple must be three tiles of the same number." },
  invalid_five_kicker: { ko: "5장 조합의 구성이 올바르지 않아요.", en: "That 5-tile combo isn't valid." },
  invalid_five: { ko: "인정되지 않는 5장 조합이에요.", en: "That's not a valid 5-tile combo." },
  invalid_combo: { ko: "인정되지 않는 조합이에요.", en: "That's not a valid combo." },
  wrong_size: { ko: "낸 장수가 필드와 맞지 않아요.", en: "You must play the same number of tiles as the field." },
  bad_size: { ko: "낸 장수가 필드와 맞지 않아요.", en: "You must play the same number of tiles as the field." },
  must_be_higher: { ko: "필드보다 높은 조합만 낼 수 있어요.", en: "You must beat the combo on the field." },
  round_not_playing: { ko: "지금은 낼 수 없는 상태예요.", en: "You can't play right now." },
  round_not_over: { ko: "아직 라운드가 끝나지 않았어요.", en: "The round isn't over yet." },
  game_not_found: { ko: "게임 정보를 찾을 수 없어요.", en: "Game not found." },
  not_all_ready: { ko: "아직 모두 준비하지 않았어요.", en: "Not everyone is ready yet." },
  seats_not_full: { ko: "빈 자리가 있어요.", en: "There are empty seats." },
  room_not_found: { ko: "존재하지 않는 방 코드예요.", en: "That room code doesn't exist." },
  room_already_started: { ko: "이미 시작된 방이에요.", en: "That game has already started." },
  room_full: { ko: "방이 가득 찼어요.", en: "The room is full." },
  not_host: { ko: "방장만 할 수 있어요.", en: "Only the host can do that." },
  seat_taken: { ko: "이미 채워진 자리예요.", en: "That seat is already taken." },
  not_in_room: { ko: "방에 참가한 상태가 아니에요.", en: "You're not in this room." },
};

export function lxErrorText(e: unknown, lang: "ko" | "en"): string {
  const m =
    e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : String(e);
  for (const k of Object.keys(LX_ERR)) if (m.includes(k)) return LX_ERR[k][lang];
  if (/Failed to fetch|NetworkError/i.test(m)) return lang === "ko" ? "네트워크에 연결할 수 없어요." : "Can't reach the network.";
  return lang === "ko" ? "문제가 생겼어요. 잠시 후 다시 시도해 주세요." : "Something went wrong. Please try again.";
}
