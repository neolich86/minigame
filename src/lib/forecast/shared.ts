// 스포츠 승부 예측 — 서버·브라우저 공용 타입과 대회 이름 (서버 전용 코드를 import 하지 않는다)
import type { TeamInfo } from "./teams";

export const COMP_ORDER = ["PL", "PD", "BL1", "SA", "FL1", "CL", "PPL", "DED", "ELC", "EC", "WC", "CLI"] as const;
export const COMP_NAME: Record<string, { ko: string; en: string; short: { ko: string; en: string } }> = {
  PL: { ko: "프리미어리그", en: "Premier League", short: { ko: "EPL", en: "EPL" } },
  PD: { ko: "라리가", en: "La Liga", short: { ko: "라리가", en: "La Liga" } },
  BL1: { ko: "분데스리가", en: "Bundesliga", short: { ko: "분데스", en: "Bundesliga" } },
  SA: { ko: "세리에A", en: "Serie A", short: { ko: "세리에A", en: "Serie A" } },
  FL1: { ko: "리그1", en: "Ligue 1", short: { ko: "리그1", en: "Ligue 1" } },
  CL: { ko: "UEFA 챔피언스리그", en: "UEFA Champions League", short: { ko: "챔스", en: "UCL" } },
  PPL: { ko: "프리메이라리가", en: "Primeira Liga", short: { ko: "포르투갈", en: "Portugal" } },
  DED: { ko: "에레디비시", en: "Eredivisie", short: { ko: "에레디비시", en: "Eredivisie" } },
  ELC: { ko: "챔피언십", en: "Championship", short: { ko: "챔피언십", en: "Championship" } },
  EC: { ko: "유로", en: "European Championship", short: { ko: "유로", en: "EURO" } },
  WC: { ko: "월드컵", en: "FIFA World Cup", short: { ko: "월드컵", en: "World Cup" } },
  CLI: { ko: "코파 리베르타도레스", en: "Copa Libertadores", short: { ko: "리베르타도레스", en: "Libertadores" } },
};

export interface Prediction {
  match_id: number;
  model_version: string;
  p_home: number;
  p_draw: number;
  p_away: number;
  exp_home: number | null;
  exp_away: number | null;
  top_scores: { h: number; a: number; p: number }[] | null;
  factors: { eloH?: number; eloA?: number; attH?: number | null; defH?: number | null; attA?: number | null; defA?: number | null; wPois?: number } | null;
  locked_at: string | null;
  result: "H" | "D" | "A" | null;
  hit: boolean | null;
}

export interface MatchRow {
  id: number;
  competition: string;
  season: number;
  matchday: number | null;
  stage: string | null;
  utc_date: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  home_score_90: number | null;
  away_score_90: number | null;
  duration: string | null;
  home: TeamInfo | null;
  away: TeamInfo | null;
  pred: Prediction | null;
}

export interface RatingPoint {
  date: string;
  elo: number | null;
  attack: number | null;
  defense: number | null;
}

export interface StandingRow {
  position: number;
  team: { id: number; name: string; shortName?: string; tla?: string };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form?: string | null;
}

export interface StandingGroup {
  stage?: string;
  type?: string;
  group?: string | null;
  table: StandingRow[];
}

export interface LeagueSim {
  sims: number;
  remaining: number;
  zones: { top: number; topKind: "ucl" | "promo"; bottom: number };
  teams: { id: number; pts: number; played: number; expPts: number; avgPos: number; pTitle: number; pTop: number; pBottom: number; pos: number[] }[];
}
