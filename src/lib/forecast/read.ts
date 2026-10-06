// 스포츠 승부 예측 — 화면용 데이터 읽기 (서버 컴포넌트에서 호출, 공개 읽기 키 사용)
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { TeamInfo } from "./teams";
import type { LeagueSim, MatchRow, Prediction, RatingPoint, StandingGroup } from "./shared";

let client: SupabaseClient | null = null;
function db(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export * from "./shared";

const TEAM_COLS = "id,name,short_name,tla,club_colors,name_ko";
const MATCH_COLS = `id,competition,season,matchday,stage,utc_date,status,home_score,away_score,home_score_90,away_score_90,duration,home:fc_teams!fc_matches_home_id_fkey(${TEAM_COLS}),away:fc_teams!fc_matches_away_id_fkey(${TEAM_COLS}),pred:fc_predictions(match_id,model_version,p_home,p_draw,p_away,exp_home,exp_away,top_scores,factors,locked_at,result,hit)`;
// club_colors 열이 없을 때(0010 미실행)를 위한 대체
const TEAM_COLS_OLD = "id,name,short_name,tla,name_ko";
const MATCH_COLS_OLD = MATCH_COLS.replaceAll(TEAM_COLS, TEAM_COLS_OLD);

type Raw = Omit<MatchRow, "pred"> & { pred: Prediction | Prediction[] | null };
const norm = (r: Raw): MatchRow => ({ ...r, pred: Array.isArray(r.pred) ? (r.pred[0] ?? null) : r.pred });

async function selectMatches(build: (cols: string) => PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<MatchRow[]> {
  let { data, error } = await build(MATCH_COLS);
  if (error && /club_colors/.test(error.message)) ({ data, error } = await build(MATCH_COLS_OLD));
  if (error) throw new Error(error.message);
  return ((data ?? []) as Raw[]).map(norm);
}

/** 기간 안의 경기 (UTC ISO 범위) */
export async function matchesBetween(fromIso: string, toIso: string, comp?: string): Promise<MatchRow[]> {
  const c = db();
  if (!c) return [];
  return selectMatches((cols) => {
    let q = c.from("fc_matches").select(cols).gte("utc_date", fromIso).lt("utc_date", toIso).order("utc_date").order("id").limit(400);
    if (comp) q = q.eq("competition", comp);
    return q;
  });
}

export async function matchById(id: number): Promise<MatchRow | null> {
  const c = db();
  if (!c) return null;
  const rows = await selectMatches((cols) => c.from("fc_matches").select(cols).eq("id", id).limit(1));
  return rows[0] ?? null;
}

/** 팀의 최근 끝난 경기 (before 이전) */
export async function recentForm(teamId: number, beforeIso: string, n = 5): Promise<MatchRow[]> {
  const c = db();
  if (!c) return [];
  return selectMatches((cols) =>
    c
      .from("fc_matches")
      .select(cols)
      .or(`home_id.eq.${teamId},away_id.eq.${teamId}`)
      .eq("status", "FINISHED")
      .lt("utc_date", beforeIso)
      .order("utc_date", { ascending: false })
      .limit(n),
  );
}

export async function headToHead(a: number, b: number, beforeIso: string, n = 6): Promise<MatchRow[]> {
  const c = db();
  if (!c) return [];
  return selectMatches((cols) =>
    c
      .from("fc_matches")
      .select(cols)
      .or(`and(home_id.eq.${a},away_id.eq.${b}),and(home_id.eq.${b},away_id.eq.${a})`)
      .eq("status", "FINISHED")
      .lt("utc_date", beforeIso)
      .order("utc_date", { ascending: false })
      .limit(n),
  );
}


export async function ratingHistory(teamId: number, sinceIso: string): Promise<RatingPoint[]> {
  const c = db();
  if (!c) return [];
  const { data, error } = await c.from("fc_ratings").select("date,elo,attack,defense").eq("team_id", teamId).gte("date", sinceIso.slice(0, 10)).order("date");
  if (error) return [];
  return (data ?? []) as RatingPoint[];
}


export async function standings(comp: string): Promise<{ season: number; groups: StandingGroup[]; updated_at: string } | null> {
  const c = db();
  if (!c) return null;
  const { data, error } = await c.from("fc_standings").select("season,data,updated_at").eq("competition", comp).order("season", { ascending: false }).limit(1);
  if (error || !data?.length) return null;
  return { season: data[0].season, groups: (data[0].data ?? []) as StandingGroup[], updated_at: data[0].updated_at };
}

export async function teamsByIds(ids: number[]): Promise<Map<number, TeamInfo>> {
  const c = db();
  const out = new Map<number, TeamInfo>();
  if (!c || !ids.length) return out;
  const first = await c.from("fc_teams").select(TEAM_COLS).in("id", ids);
  let data: unknown[] | null = first.data;
  if (first.error && /club_colors/.test(first.error.message)) data = (await c.from("fc_teams").select(TEAM_COLS_OLD).in("id", ids)).data;
  for (const t of (data ?? []) as TeamInfo[]) out.set(t.id, t);
  return out;
}

/** 팀별 최신 레이팅 (오늘 스냅샷) */
export async function latestRatings(ids: number[]): Promise<Map<number, RatingPoint>> {
  const c = db();
  const out = new Map<number, RatingPoint>();
  if (!c || !ids.length) return out;
  const since = new Date(Date.now() - 10 * 86400_000).toISOString().slice(0, 10);
  const { data } = await c.from("fc_ratings").select("team_id,date,elo,attack,defense").in("team_id", ids).gte("date", since).order("date");
  for (const r of (data ?? []) as (RatingPoint & { team_id: number })[]) out.set(r.team_id, r);
  return out;
}

export interface GradedRow {
  match_id: number;
  p_home: number;
  p_draw: number;
  p_away: number;
  result: "H" | "D" | "A";
  hit: boolean;
  brier: number;
  logloss: number;
  utc_date: string;
  competition: string;
}

/** 채점된 운영 예측 전부 (모델 성적 페이지) */
export async function gradedPredictions(): Promise<GradedRow[]> {
  const c = db();
  if (!c) return [];
  const out: GradedRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await c
      .from("fc_predictions")
      .select("match_id,p_home,p_draw,p_away,result,hit,brier,logloss,m:fc_matches!inner(utc_date,competition)")
      .not("result", "is", null)
      .order("match_id")
      .range(from, from + 999);
    if (error) break;
    for (const r of (data ?? []) as unknown as (Omit<GradedRow, "utc_date" | "competition"> & { m: { utc_date: string; competition: string } })[])
      out.push({ ...r, utc_date: r.m.utc_date, competition: r.m.competition });
    if (!data || data.length < 1000) break;
  }
  return out;
}

export async function leagueSim(comp: string): Promise<{ season: number; run_at: string; data: LeagueSim } | null> {
  const c = db();
  if (!c) return null;
  const { data, error } = await c.from("fc_league_sims").select("season,run_at,data").eq("competition", comp).order("season", { ascending: false }).limit(1);
  if (error || !data?.length) return null;
  return data[0] as { season: number; run_at: string; data: LeagueSim };
}

export const cloudReady = () => db() !== null;
