// 접속 기록 — POST /api/visit-event  body: {"game":"archer","platform":"web|app|toss","visitor":"<uuid>"}
// 게임(iframe)·앱인토스 미니앱의 bridge.js 가 sendBeacon(text/plain)으로 보낸다.
// 저장은 Supabase log_visit() RPC (supabase/migrations/0028_visit_events.sql)
import { createClient } from "@supabase/supabase-js";
import { gameById } from "@/lib/games";

export const dynamic = "force-dynamic";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(req: Request) {
  let body: { game?: unknown; platform?: unknown; visitor?: unknown };
  try {
    body = JSON.parse((await req.text()).slice(0, 500));
  } catch {
    return new Response("bad_json", { status: 400, headers: CORS });
  }
  const game = typeof body.game === "string" ? body.game : "";
  const platform = body.platform === "app" || body.platform === "toss" ? body.platform : "web";
  const visitor = typeof body.visitor === "string" && UUID.test(body.visitor) ? body.visitor : null;
  if (!gameById(game)) return new Response("unknown_game", { status: 400, headers: CORS });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return new Response(null, { status: 204, headers: CORS });
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await db.rpc("log_visit", { p_game: game, p_platform: platform, p_visitor: visitor });
  if (error) console.error("[visit-event]", error.message);
  return new Response(null, { status: 204, headers: CORS });
}
