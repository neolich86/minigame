// 스포츠 승부 예측 — 운영 예측 작업 (서버 전용)
// 1) 끝난 경기를 날짜순으로 재생해 Elo 를 만들고, 리그별 포아송을 "지금" 기준으로 맞춘다
// 2) 앞으로 8일 안의 경기 예측을 만든다 (이미 잠긴 예측은 건드리지 않음)
// 3) 킥오프가 지난 예측을 잠근다
// 4) 끝난 경기의 잠긴 예측을 채점한다
// 5) 팀 레이팅 스냅샷을 남긴다 (처음 한 번은 2주 간격 과거 기록까지)
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_PARAMS, Elo, LEAGUES, MODEL_VERSION, fitPoisson, predict, score, type MatchLite, type PoissonFit } from "./model";

const DAY = 86400_000;
const PAGE = 1000;
const STARTED = new Set(["IN_PLAY", "PAUSED", "FINISHED", "AWARDED", "SUSPENDED"]);
const OPEN = new Set(["SCHEDULED", "TIMED"]);

interface DbMatch {
  id: number;
  competition: string;
  season: number;
  utc_date: string;
  status: string;
  home_id: number | null;
  away_id: number | null;
  home_score_90: number | null;
  away_score_90: number | null;
}

async function loadMatches(db: SupabaseClient): Promise<DbMatch[]> {
  const out: DbMatch[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from("fc_matches")
      .select("id,competition,season,utc_date,status,home_id,away_id,home_score_90,away_score_90")
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`fc_matches: ${error.message}`);
    out.push(...((data ?? []) as DbMatch[]));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

const lite = (m: DbMatch): MatchLite => ({
  id: m.id,
  comp: m.competition,
  season: m.season,
  date: Date.parse(m.utc_date),
  home: m.home_id!,
  away: m.away_id!,
  hg: m.status === "FINISHED" ? m.home_score_90 : null,
  ag: m.status === "FINISHED" ? m.away_score_90 : null,
});

async function upsertChunks(db: SupabaseClient, table: string, rows: object[], onConflict: string) {
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db.from(table).upsert(rows.slice(i, i + 500), { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

export interface PredictReport {
  finished: number;
  predicted: number;
  skippedLocked: number;
  locked: number;
  graded: number;
  ratings: number;
  history: number;
  ms: number;
}

export async function runPredict(db: SupabaseClient, now = Date.now(), aheadDays = 8): Promise<PredictReport> {
  const t0 = Date.now();
  const p = DEFAULT_PARAMS;
  const all = await loadMatches(db);
  const done = all
    .filter((m) => m.status === "FINISHED" && m.home_id && m.away_id && m.home_score_90 !== null && m.away_score_90 !== null)
    .map(lite)
    .sort((a, b) => a.date - b.date || a.id - b.id);

  // 레이팅 기록이 거의 없으면 과거 기록(2주 간격)도 함께 남긴다
  const { count: ratingRows } = await db.from("fc_ratings").select("team_id", { count: "exact", head: true });
  const fillHistory = (ratingRows ?? 0) < 1000;
  const history: { team_id: number; date: string; elo: number }[] = [];

  const elo = new Elo(p);
  let nextSnap = done.length ? Math.ceil(done[0].date / (14 * DAY)) * 14 * DAY + 14 * DAY : 0;
  for (const m of done) {
    if (fillHistory && m.date >= nextSnap) {
      const d = new Date(nextSnap).toISOString().slice(0, 10);
      for (const [team, r] of elo.r) if (elo.league.has(team)) history.push({ team_id: team, date: d, elo: Math.round(r * 10) / 10 });
      while (nextSnap <= m.date) nextSnap += 14 * DAY;
    }
    elo.update(m);
  }

  // 리그별 포아송 (지금 기준)
  const fits = new Map<string, PoissonFit | null>();
  for (const c of LEAGUES) fits.set(c, fitPoisson(done.filter((m) => m.comp === c), now, p.halfLife, p.prior));

  // 기존 예측 상태
  const preds = new Map<number, { locked_at: string | null; result: string | null }>();
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from("fc_predictions").select("match_id,locked_at,result").order("match_id").range(from, from + PAGE - 1);
    if (error) throw new Error(`fc_predictions: ${error.message}`);
    for (const r of data ?? []) preds.set(r.match_id, { locked_at: r.locked_at, result: r.result });
    if (!data || data.length < PAGE) break;
  }

  // 2) 새 예측
  const iso = new Date(now).toISOString();
  const upcoming = all.filter((m) => {
    const t = Date.parse(m.utc_date);
    return OPEN.has(m.status) && m.home_id && m.away_id && t > now && t < now + aheadDays * DAY;
  });
  let skippedLocked = 0;
  const rows: object[] = [];
  for (const m of upcoming) {
    if (preds.get(m.id)?.locked_at) {
      skippedLocked++;
      continue;
    }
    const ml = lite(m);
    const f = predict({ elo, fits, p }, ml);
    const fit = fits.get(m.competition);
    const r4 = (x: number | undefined) => (x === undefined ? null : Math.round(x * 1000) / 1000);
    rows.push({
      match_id: m.id,
      model_version: MODEL_VERSION,
      p_home: f.pH,
      p_draw: f.pD,
      p_away: f.pA,
      exp_home: f.expH,
      exp_away: f.expA,
      top_scores: f.top.map((s) => ({ h: s.h, a: s.a, p: Math.round(s.p * 10000) / 10000 })),
      factors: {
        eloH: Math.round(elo.rating(ml.home, ml.comp, ml.season)),
        eloA: Math.round(elo.rating(ml.away, ml.comp, ml.season)),
        attH: r4(fit?.att.get(ml.home)),
        defH: r4(fit?.def.get(ml.home)),
        attA: r4(fit?.att.get(ml.away)),
        defA: r4(fit?.def.get(ml.away)),
        wPois: Math.round(f.wPois * 100) / 100,
      },
      created_at: iso,
    });
  }
  await upsertChunks(db, "fc_predictions", rows, "match_id");

  // 3) 잠금: 시작했거나 킥오프 시각이 지난 경기 (연기된 경기는 제외 — 새 날짜로 다시 예측)
  const byId = new Map(all.map((m) => [m.id, m]));
  const toLock: number[] = [];
  for (const [id, s] of preds) {
    if (s.locked_at) continue;
    const m = byId.get(id);
    if (!m || m.status === "POSTPONED" || m.status === "CANCELLED") continue;
    if (STARTED.has(m.status) || Date.parse(m.utc_date) <= now) toLock.push(id);
  }
  for (let i = 0; i < toLock.length; i += 200) {
    const { error } = await db.from("fc_predictions").update({ locked_at: iso }).in("match_id", toLock.slice(i, i + 200)).is("locked_at", null);
    if (error) throw new Error(`lock: ${error.message}`);
  }
  const lockedNow = new Set(toLock);

  // 4) 채점
  const ungraded = [...preds].filter(([id, s]) => (s.locked_at || lockedNow.has(id)) && !s.result).map(([id]) => id);
  let graded = 0;
  for (let i = 0; i < ungraded.length; i += 200) {
    const ids = ungraded.slice(i, i + 200).filter((id) => {
      const m = byId.get(id);
      return m?.status === "FINISHED" && m.home_score_90 !== null && m.away_score_90 !== null;
    });
    if (!ids.length) continue;
    const { data, error } = await db.from("fc_predictions").select("match_id,p_home,p_draw,p_away").in("match_id", ids);
    if (error) throw new Error(`grade read: ${error.message}`);
    for (const r of data ?? []) {
      const m = byId.get(r.match_id)!;
      const o = m.home_score_90! > m.away_score_90! ? 0 : m.home_score_90 === m.away_score_90 ? 1 : 2;
      const s = score([r.p_home, r.p_draw, r.p_away], o);
      const { error: ue } = await db
        .from("fc_predictions")
        .update({ result: "HDA"[o], hit: s.hit, brier: s.brier, logloss: s.logloss })
        .eq("match_id", r.match_id);
      if (ue) throw new Error(`grade: ${ue.message}`);
      graded++;
    }
  }

  // 5) 오늘 레이팅 스냅샷 (리그 팀만)
  const today = new Date(now + 9 * 3600_000).toISOString().slice(0, 10);
  const snap: object[] = [];
  for (const [team, r] of elo.r) {
    const lg = elo.league.get(team);
    if (!lg) continue;
    const f = fits.get(lg);
    snap.push({
      team_id: team,
      date: today,
      elo: Math.round(r * 10) / 10,
      attack: f?.att.get(team) ?? null,
      defense: f?.def.get(team) ?? null,
    });
  }
  // 같은 (팀, 날짜)가 한 번에 두 번 들어가면 upsert 가 실패하므로 마지막 값만 남긴다
  const uniq = new Map<string, object>();
  for (const r of [...history, ...snap] as { team_id: number; date: string }[]) uniq.set(`${r.team_id}|${r.date}`, r);
  await upsertChunks(db, "fc_ratings", [...uniq.values()], "team_id,date");

  return {
    finished: done.length,
    predicted: rows.length,
    skippedLocked,
    locked: toLock.length,
    graded,
    ratings: snap.length,
    history: history.length,
    ms: Date.now() - t0,
  };
}
