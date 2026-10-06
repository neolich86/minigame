// football-data.org v4 클라이언트 (서버 전용)
// 무료 플랜: 12개 대회, 분당 10회. 한 번의 동기화 요청 안에서는 호출 사이에 최소 간격을 둔다.
// 화면은 이 API를 직접 부르지 않는다 — 동기화 작업이 받아서 Supabase에 저장하고, 화면은 DB만 읽는다.

const BASE = "https://api.football-data.org/v4";
const MIN_GAP_MS = 6500; // 분당 10회 → 6초 간격 + 여유

export const FD_COMPETITIONS = ["PL", "PD", "BL1", "SA", "FL1", "PPL", "DED", "ELC", "CL", "EC", "WC", "CLI"] as const;
export type CompCode = (typeof FD_COMPETITIONS)[number];
/** 리그(시즌 단위 순위표가 있는 대회) — 백필·순위표 대상 기본값 */
export const FD_LEAGUES: CompCode[] = ["PL", "PD", "BL1", "SA", "FL1", "PPL", "DED", "ELC"];

export function isComp(x: string): x is CompCode {
  return (FD_COMPETITIONS as readonly string[]).includes(x);
}

export interface FdTeam {
  id: number;
  name: string | null;
  shortName?: string | null;
  tla?: string | null;
  crest?: string | null;
}

interface FdScorePair {
  home: number | null;
  away: number | null;
}

export interface FdMatch {
  id: number;
  utcDate: string;
  status: string;
  matchday: number | null;
  stage: string | null;
  group: string | null;
  lastUpdated: string | null;
  competition: { id: number; code: string; name: string; type?: string };
  season: { id: number; startDate: string; endDate: string; currentMatchday: number | null };
  homeTeam: FdTeam;
  awayTeam: FdTeam;
  score: {
    winner: string | null;
    duration: string | null;
    fullTime: FdScorePair;
    halfTime?: FdScorePair;
    regularTime?: FdScorePair;
    extraTime?: FdScorePair;
    penalties?: FdScorePair;
  };
}

export interface FdMatchesResponse {
  matches: FdMatch[];
  competition?: { id: number; code: string; name: string; type?: string };
  filters?: Record<string, unknown>;
  resultSet?: { count: number; first?: string; last?: string };
}

export interface FdStandingsResponse {
  competition: { id: number; code: string; name: string; type?: string };
  season: { id: number; startDate: string; endDate: string; currentMatchday: number | null };
  standings: unknown[];
}

export class FdError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
  }
}

type Fetcher = typeof fetch;

export class FdClient {
  private last = 0;
  /** 마지막 응답 헤더의 남은 분당 호출 수 */
  remaining: number | null = null;

  constructor(
    private token: string,
    private fetcher: Fetcher = fetch,
    private gapMs = MIN_GAP_MS,
  ) {}

  static fromEnv(fetcher?: Fetcher): FdClient | null {
    const t = process.env.FOOTBALL_DATA_TOKEN?.trim();
    return t ? new FdClient(t, fetcher) : null;
  }

  private async wait() {
    const d = this.last + this.gapMs - Date.now();
    if (this.last && d > 0) await new Promise((r) => setTimeout(r, d));
    this.last = Date.now();
  }

  async get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    await this.wait();
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params ?? {})) if (v !== undefined) qs.set(k, String(v));
    const url = `${BASE}${path}${qs.size ? `?${qs}` : ""}`;
    const res = await this.fetcher(url, { headers: { "X-Auth-Token": this.token }, cache: "no-store" });
    const rem = res.headers.get("x-requests-available-minute");
    if (rem !== null && rem !== "") this.remaining = Number(rem);
    if (!res.ok) {
      let msg = `${res.status}`;
      try {
        const j = (await res.json()) as { message?: string };
        if (j?.message) msg = j.message;
      } catch {}
      const ra = Number(res.headers.get("x-requestcounter-reset") ?? res.headers.get("retry-after") ?? "");
      throw new FdError(res.status, msg, Number.isFinite(ra) && ra > 0 ? ra : undefined);
    }
    return (await res.json()) as T;
  }

  /** 대회·시즌 전체 경기 (season = 시작 연도, 생략하면 현재 시즌) */
  competitionMatches(code: CompCode, season?: number) {
    return this.get<FdMatchesResponse>(`/competitions/${code}/matches`, { season });
  }

  /** 날짜 범위의 모든 무료 대회 경기 (범위는 최대 10일) */
  matchesBetween(dateFrom: string, dateTo: string) {
    return this.get<FdMatchesResponse>(`/matches`, { dateFrom, dateTo });
  }

  /** 대회 참가 팀 목록 (clubColors 포함) */
  competitionTeams(code: CompCode, season?: number) {
    return this.get<{ teams: (FdTeam & { clubColors?: string | null })[] }>(`/competitions/${code}/teams`, { season });
  }

  standings(code: CompCode, season?: number) {
    return this.get<FdStandingsResponse>(`/competitions/${code}/standings`, { season });
  }
}

/* ───────────── API 응답 → DB 행 ───────────── */

export const seasonYear = (s: { startDate: string }) => Number(s.startDate.slice(0, 4));

export interface MatchRow {
  id: number;
  competition: string;
  season: number;
  matchday: number | null;
  stage: string | null;
  group_name: string | null;
  utc_date: string;
  status: string;
  home_id: number | null;
  away_id: number | null;
  home_score: number | null;
  away_score: number | null;
  home_score_90: number | null;
  away_score_90: number | null;
  duration: string | null;
  winner: string | null;
  fd_updated: string | null;
}

export interface TeamRow {
  id: number;
  name: string;
  short_name: string | null;
  tla: string | null;
  crest_url: string | null;
}

/**
 * 90분 스코어. 연장·승부차기가 있으면 regularTime 을 쓴다.
 * (v4 는 fullTime 에 연장 득점이 포함되고, 승부차기 경기는 fullTime 에 승부차기 점수까지 더해 오는 경우가 있다)
 */
export function score90(m: FdMatch): FdScorePair {
  const s = m.score;
  if (s.duration && s.duration !== "REGULAR" && s.regularTime && s.regularTime.home !== null) return s.regularTime;
  return s.fullTime;
}

/** 최종 스코어 (승부차기 점수 제외) */
export function scoreFinal(m: FdMatch): FdScorePair {
  const s = m.score;
  if (s.duration === "PENALTY_SHOOTOUT" && s.regularTime && s.regularTime.home !== null) {
    const et = s.extraTime ?? { home: 0, away: 0 };
    return { home: (s.regularTime.home ?? 0) + (et.home ?? 0), away: (s.regularTime.away ?? 0) + (et.away ?? 0) };
  }
  return s.fullTime;
}

export function toMatchRow(m: FdMatch, compCode?: string): MatchRow {
  const fin = m.status === "FINISHED" || m.status === "AWARDED";
  const f = fin ? scoreFinal(m) : { home: null, away: null };
  const r = fin ? score90(m) : { home: null, away: null };
  return {
    id: m.id,
    competition: m.competition?.code ?? compCode ?? "",
    season: seasonYear(m.season),
    matchday: m.matchday ?? null,
    stage: m.stage ?? null,
    group_name: m.group ?? null,
    utc_date: m.utcDate,
    status: m.status,
    home_id: m.homeTeam?.id ?? null,
    away_id: m.awayTeam?.id ?? null,
    home_score: f.home,
    away_score: f.away,
    home_score_90: r.home,
    away_score_90: r.away,
    duration: m.score?.duration ?? null,
    winner: m.score?.winner ?? null,
    fd_updated: m.lastUpdated ?? null,
  };
}

/** 경기 목록에 들어 있는 팀 정보를 중복 없이 모은다 (팀이 아직 정해지지 않은 토너먼트 경기는 id 가 null) */
export function teamsFrom(matches: FdMatch[]): TeamRow[] {
  const map = new Map<number, TeamRow>();
  for (const m of matches) {
    for (const t of [m.homeTeam, m.awayTeam]) {
      if (!t?.id || !t.name) continue;
      map.set(t.id, {
        id: t.id,
        name: t.name,
        short_name: t.shortName ?? null,
        tla: t.tla ?? null,
        crest_url: t.crest ?? null,
      });
    }
  }
  return [...map.values()];
}

/** KST 기준 오늘 + n일 (YYYY-MM-DD) */
export function kstDate(offsetDays = 0, now = Date.now()): string {
  const d = new Date(now + 9 * 3600_000 + offsetDays * 86400_000);
  return d.toISOString().slice(0, 10);
}
