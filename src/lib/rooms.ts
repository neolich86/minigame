// 온라인 방 — 방 생성/참가/좌석 관리 RPC 래퍼 (supabase/migrations/0001_portal.sql 의 mg_* 함수)
import { sb } from "./supabase";

export interface Room {
  id: string;
  code: string;
  game: string;
  host_user_id: string;
  status: "waiting" | "playing" | "finished";
  max_players: number;
  host_seen_at: string;
  result: { winner: number; scores: number[]; turn: number } | null;
  created_at: string;
  updated_at: string;
}

export interface Member {
  room_id: string;
  seat: number;
  user_id: string | null;
  is_ai: boolean;
  nickname: string;
  is_ready: boolean;
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

export const createRoom = (game: string, maxPlayers: number) => rpc<Room>("mg_create_room", { p_game: game, p_max_players: maxPlayers });
export const joinRoom = (code: string) => rpc<Room>("mg_join_room", { p_code: code });
export const setSeatAI = (roomId: string, seat: number, ai: boolean) => rpc<void>("mg_set_seat_ai", { p_room: roomId, p_seat: seat, p_ai: ai });
export const setMaxPlayers = (roomId: string, max: number) => rpc<void>("mg_set_max_players", { p_room: roomId, p_max: max });
export const setReady = (roomId: string, ready: boolean) => rpc<void>("mg_set_ready", { p_room: roomId, p_ready: ready });
export const startRoom = (roomId: string) => rpc<Room>("mg_start_room", { p_room: roomId });
export const saveState = (roomId: string, state: unknown, version: number) => rpc<void>("mg_save_state", { p_room: roomId, p_state: state, p_version: version });
export const heartbeat = (roomId: string) => rpc<void>("mg_heartbeat", { p_room: roomId });
export const claimHost = (roomId: string) => rpc<Room>("mg_claim_host", { p_room: roomId });
export const replaceWithAI = (roomId: string, seat: number) => rpc<void>("mg_replace_with_ai", { p_room: roomId, p_seat: seat });
export const finishRoom = (roomId: string, result: unknown) => rpc<void>("mg_finish_room", { p_room: roomId, p_result: result });
export const leaveRoom = (roomId: string) => rpc<void>("mg_leave_room", { p_room: roomId });

export async function fetchRoom(roomId: string): Promise<Room | null> {
  const { data, error } = await client().from("mg_rooms").select("*").eq("id", roomId).maybeSingle();
  if (error) throw error;
  return data as Room | null;
}

export async function fetchMembers(roomId: string): Promise<Member[]> {
  const { data, error } = await client()
    .from("mg_room_members")
    .select("room_id,seat,user_id,is_ai,nickname,is_ready")
    .eq("room_id", roomId)
    .order("seat");
  if (error) throw error;
  return (data ?? []) as Member[];
}

export async function fetchSavedState(roomId: string): Promise<{ state: unknown; version: number } | null> {
  const { data, error } = await client().from("mg_room_states").select("state,version").eq("room_id", roomId).maybeSingle();
  if (error) throw error;
  return data as { state: unknown; version: number } | null;
}

/** 내가 참가 중인(끝나지 않은) 방 목록 */
export async function fetchMyRooms(game: string): Promise<Room[]> {
  const { data, error } = await client()
    .from("mg_rooms")
    .select("*")
    .eq("game", game)
    .neq("status", "finished")
    .order("updated_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data ?? []) as Room[];
}

// 카탄 좌석 색 (게임 안 PCOLORS 와 동일 순서)
export const SEAT_COLORS = ["#c8433d", "#2f79c4", "#e08a2b", "#e6e0d0"];
