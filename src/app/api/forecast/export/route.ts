// 스포츠 승부 예측 — 끝난 경기 내보내기 (백테스트용, GitHub Actions 가 호출)
// GET /api/forecast/export  (Authorization: Bearer CRON_SECRET)
// 응답: { columns, rows } — rows 는 [id, comp, season, utc_ms, home, away, hg90, ag90]
import { authError, json } from "@/lib/forecast/auth";
import { forecastDb } from "@/lib/forecast/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const denied = authError(req);
  if (denied) return denied;
  const db = forecastDb();
  if (!db) return json({ error: "supabase_not_configured" }, 503);

  const rows: (string | number)[][] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await db
      .from("fc_matches")
      .select("id,competition,season,utc_date,home_id,away_id,home_score_90,away_score_90")
      .eq("status", "FINISHED")
      .not("home_score_90", "is", null)
      .not("home_id", "is", null)
      .order("id")
      .range(from, from + page - 1);
    if (error) return json({ error: error.message }, 500);
    for (const m of data ?? [])
      rows.push([m.id, m.competition, m.season, Date.parse(m.utc_date), m.home_id, m.away_id, m.home_score_90, m.away_score_90]);
    if (!data || data.length < page) break;
  }
  return json({ columns: ["id", "comp", "season", "date", "home", "away", "hg", "ag"], rows });
}
