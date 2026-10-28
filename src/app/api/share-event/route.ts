// 결과 공유 횟수 기록 — POST /api/share-event  body: {"game":"archer","platform":"web|app|toss","method":"copy"}
// 게임(iframe)·앱인토스 미니앱이 sendBeacon(text/plain)으로 보낸다 → 프리플라이트 없이 다른 출처에서도 받는다.
// 저장은 Supabase log_share() RPC (supabase/migrations/0024_share_events.sql)
import { createClient } from "@supabase/supabase-js";
import { gameById } from "@/lib/games";

export const dynamic = "force-dynamic";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(req: Request) {
  let body: { game?: unknown; platform?: unknown; method?: unknown };
  try {
    body = JSON.parse((await req.text()).slice(0, 500));
  } catch {
    return new Response("bad_json", { status: 400, headers: CORS });
  }
  const game = typeof body.game === "string" ? body.game : "";
  const platform = body.platform === "app" || body.platform === "toss" ? body.platform : "web";
  const method = typeof body.method === "string" && /^[a-z_]{1,20}$/.test(body.method) ? body.method : "other";
  if (!gameById(game)) return new Response("unknown_game", { status: 400, headers: CORS });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return new Response(null, { status: 204, headers: CORS });
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await db.rpc("log_share", { p_game: game, p_platform: platform, p_method: method });
  if (error) console.error("[share-event]", error.message);
  return new Response(null, { status: 204, headers: CORS });
}
