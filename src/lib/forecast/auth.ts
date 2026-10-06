// 스포츠 승부 예측 — 서버 작업용 라우트 인증 (Authorization: Bearer CRON_SECRET)

export const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

/** 인증 실패 이유를 구분해서 돌려준다 (값 자체는 절대 노출하지 않음) */
export function authError(req: Request): Response | null {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return json({ error: "CRON_SECRET_not_set_on_server" }, 503);
  const h = (req.headers.get("authorization") ?? "").trim();
  if (!h) return json({ error: "no_authorization_header" }, 401);
  const got = h.replace(/^Bearer\s+/i, "").trim();
  if (got !== secret) return json({ error: "secret_mismatch", got_length: got.length, server_length: secret.length }, 401);
  return null;
}

