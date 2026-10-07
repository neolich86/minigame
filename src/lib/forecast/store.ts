// 스포츠 승부 예측 — Supabase 저장 (서버 전용, service role 키)
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { seasonYear, teamsFrom, toMatchRow, type FdMatch, type FdStandingsResponse } from "./fd";

export function forecastDb(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key.trim(), { auth: { persistSession: false, autoRefreshToken: false } });
}

const CHUNK = 500;

async function upsertChunks(db: SupabaseClient, table: string, rows: object[], onConflict: string) {
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await db.from(table).upsert(rows.slice(i, i + CHUNK), { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

/** fc_competitions 에 등록된 대회 코드 */
async function knownCompetitions(db: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await db.from("fc_competitions").select("code");
  if (error) throw new Error(`fc_competitions: ${error.message}`);
  return new Set((data ?? []).map((r: { code: string }) => r.code));
}

/**
 * 경기 목록 저장 — 팀을 먼저 넣고 경기를 넣는다. 반환값은 저장한 경기 수.
 * 날짜 범위 조회(/v4/matches)는 무료 플랜의 모든 대회를 돌려주므로(예: 브라질 BSA)
 * 우리가 다루지 않는 대회 경기는 건너뛴다. skipped 에 대회별 건너뛴 수를 담는다.
 */
export async function saveMatches(db: SupabaseClient, all: FdMatch[], compCode?: string, skipped?: Record<string, number>): Promise<number> {
  const known = await knownCompetitions(db);
  const matches = all.filter((m) => {
    const c = m.competition?.code ?? compCode ?? "";
    if (known.has(c)) return true;
    if (skipped) skipped[c || "?"] = (skipped[c || "?"] ?? 0) + 1;
    return false;
  });
  if (!matches.length) return 0;
  const now = new Date().toISOString();
  const teams = teamsFrom(matches).map((t) => ({ ...t, updated_at: now }));
  // name_ko 는 덮어쓰지 않도록 upsert 대상 열에서 뺀다 (객체에 없으면 건드리지 않음)
  await upsertChunks(db, "fc_teams", teams, "id");
  const rows = matches.map((m) => ({ ...toMatchRow(m, compCode), updated_at: now })).filter((r) => r.competition);
  await upsertChunks(db, "fc_matches", rows, "id");

  // 대회의 현재 시즌·API id 갱신 (경기 목록에서 가장 늦은 시즌)
  const latest = new Map<string, { season: number; fd_id: number }>();
  for (const m of matches) {
    const code = m.competition?.code ?? compCode;
    if (!code) continue;
    const s = seasonYear(m.season);
    const cur = latest.get(code);
    if (!cur || s > cur.season) latest.set(code, { season: s, fd_id: m.competition.id });
  }
  for (const [code, v] of latest) {
    const { error: idErr } = await db.from("fc_competitions").update({ fd_id: v.fd_id, updated_at: now }).eq("code", code);
    if (idErr) throw new Error(`fc_competitions: ${idErr.message}`);
    // current_season 은 앞으로만 움직인다 (과거 시즌 백필이 되돌리지 않게)
    const { error } = await db
      .from("fc_competitions")
      .update({ current_season: v.season })
      .eq("code", code)
      .or(`current_season.is.null,current_season.lt.${v.season}`);
    if (error) throw new Error(`fc_competitions season: ${error.message}`);
  }
  return rows.length;
}

export async function saveStandings(db: SupabaseClient, code: string, s: FdStandingsResponse): Promise<number> {
  const season = seasonYear(s.season);
  const { error } = await db
    .from("fc_standings")
    .upsert({ competition: code, season, data: s.standings, updated_at: new Date().toISOString() }, { onConflict: "competition,season" });
  if (error) throw new Error(`fc_standings: ${error.message}`);
  return s.standings.length;
}

export async function logSync(
  db: SupabaseClient,
  e: { mode: string; target?: string; ok: boolean; http_status?: number; rows?: number; detail?: string },
) {
  await db.from("fc_sync_log").insert({ ...e, detail: e.detail?.slice(0, 500) });
}

/** 팀 대표색 저장 (fc_teams.club_colors — 0010 마이그레이션 필요) */
export async function saveTeamColors(db: SupabaseClient, teams: { id: number; name: string | null; shortName?: string | null; tla?: string | null; crest?: string | null; clubColors?: string | null }[]) {
  const now = new Date().toISOString();
  const rows = teams
    .filter((t) => t.id && t.name)
    .map((t) => ({ id: t.id, name: t.name, short_name: t.shortName ?? null, tla: t.tla ?? null, crest_url: t.crest ?? null, club_colors: t.clubColors ?? null, updated_at: now }));
  await upsertChunks(db, "fc_teams", rows, "id");
  return rows.length;
}
