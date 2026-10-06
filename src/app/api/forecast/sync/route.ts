// 킥오프 예측 — 데이터 동기화 (GitHub Actions 스케줄이 호출)
// 인증: Authorization: Bearer <CRON_SECRET>
//
// POST ?mode=recent[&back=2&ahead=7]   최근·예정 경기 (전 대회, API 1회, 범위 최대 10일)
// POST ?mode=season&comp=PL&season=2024 대회 한 시즌 전체 경기 (API 1회) — 과거 시즌 백필용
// POST ?mode=standings&comp=PL[&season=]  순위표 (API 1회)
// GET  ?mode=status                     DB에 쌓인 경기 수·최근 동기화 기록 (API 호출 없음)
//
// API 오류(권한 없는 시즌 403, 호출 초과 429 등)는 HTTP 200 + { ok:false, status } 로 돌려준다.
// 백필 루프가 끊기지 않고 결과표를 남기기 위해서다.
import { FdClient, FdError, isComp, kstDate } from "@/lib/forecast/fd";
import { forecastDb, logSync, saveMatches, saveStandings } from "@/lib/forecast/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const h = req.headers.get("authorization") ?? "";
  return h === `Bearer ${secret}`;
}

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

function int(v: string | null, def: number, min: number, max: number): number {
  const n = v === null || v === "" ? def : Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.trunc(n))) : def;
}

export async function POST(req: Request) {
  if (!authorized(req)) return json({ error: "unauthorized" }, 401);
  const db = forecastDb();
  if (!db) return json({ error: "supabase_not_configured" }, 503);
  const fd = FdClient.fromEnv();
  if (!fd) return json({ error: "FOOTBALL_DATA_TOKEN_missing" }, 503);

  const q = new URL(req.url).searchParams;
  const mode = q.get("mode") ?? "recent";
  const comp = (q.get("comp") ?? "").toUpperCase();
  let target = "";

  try {
    if (mode === "recent") {
      const back = int(q.get("back"), 2, 0, 9);
      const ahead = int(q.get("ahead"), 7, 0, 9 - back);
      const from = kstDate(-back);
      const to = kstDate(ahead);
      target = `${from}~${to}`;
      const r = await fd.matchesBetween(from, to);
      const rows = await saveMatches(db, r.matches);
      const finished = r.matches.filter((m) => m.status === "FINISHED").length;
      await logSync(db, { mode, target, ok: true, http_status: 200, rows });
      return json({ ok: true, mode, target, rows, finished, remaining: fd.remaining });
    }

    if (mode === "season") {
      if (!isComp(comp)) return json({ error: "bad_comp" }, 400);
      const season = q.get("season") ? int(q.get("season"), 0, 1990, 2100) : undefined;
      target = `${comp}/${season ?? "current"}`;
      const r = await fd.competitionMatches(comp, season);
      const rows = await saveMatches(db, r.matches, comp);
      const finished = r.matches.filter((m) => m.status === "FINISHED").length;
      await logSync(db, { mode, target, ok: true, http_status: 200, rows, detail: `finished=${finished}` });
      return json({ ok: true, mode, target, rows, finished, remaining: fd.remaining });
    }

    if (mode === "standings") {
      if (!isComp(comp)) return json({ error: "bad_comp" }, 400);
      const season = q.get("season") ? int(q.get("season"), 0, 1990, 2100) : undefined;
      target = `${comp}/${season ?? "current"}`;
      const r = await fd.standings(comp, season);
      const rows = await saveStandings(db, comp, r);
      await logSync(db, { mode, target, ok: true, http_status: 200, rows });
      return json({ ok: true, mode, target, rows, remaining: fd.remaining });
    }

    return json({ error: "bad_mode" }, 400);
  } catch (e) {
    if (e instanceof FdError) {
      await logSync(db, { mode, target, ok: false, http_status: e.status, detail: e.message }).catch(() => {});
      return json({ ok: false, mode, target, status: e.status, message: e.message, retryAfter: e.retryAfter ?? null });
    }
    const message = e instanceof Error ? e.message : String(e);
    await logSync(db, { mode, target, ok: false, detail: message }).catch(() => {});
    return json({ ok: false, mode, target, error: message }, 500);
  }
}

export async function GET(req: Request) {
  if (!authorized(req)) return json({ error: "unauthorized" }, 401);
  const db = forecastDb();
  if (!db) return json({ error: "supabase_not_configured" }, 503);
  const mode = new URL(req.url).searchParams.get("mode") ?? "status";
  if (mode !== "status") return json({ error: "bad_mode" }, 400);

  // 대회·시즌별 경기 수 (끝난 경기 / 전체)
  const counts: Record<string, { total: number; finished: number }> = {};
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await db
      .from("fc_matches")
      .select("competition,season,status")
      .order("id")
      .range(from, from + pageSize - 1);
    if (error) return json({ error: error.message }, 500);
    for (const m of data ?? []) {
      const k = `${m.competition}/${m.season}`;
      const c = (counts[k] ??= { total: 0, finished: 0 });
      c.total++;
      if (m.status === "FINISHED") c.finished++;
    }
    if (!data || data.length < pageSize) break;
  }
  const [{ count: teams }, { data: log }] = await Promise.all([
    db.from("fc_teams").select("id", { count: "exact", head: true }),
    db.from("fc_sync_log").select("mode,target,ok,http_status,rows,detail,at").order("at", { ascending: false }).limit(30),
  ]);
  return json({ teams, matches: counts, log });
}
