import { timingSafeEqual } from "node:crypto";

// 새 회원 가입 알림 — Supabase(auth.users에 새 줄이 생기면 DB 트리거가 pg_net으로 호출)가 부르면
// 운영자 메일로 알림을 보낸다. 메일 발송은 Resend API.
// 필요한 환경변수: SIGNUP_HOOK_SECRET(트리거와 같은 값), RESEND_API_KEY, SIGNUP_NOTIFY_EMAIL(받을 주소)
// 선택: SIGNUP_NOTIFY_FROM (도메인 인증 전에는 Resend 기본 발신 주소 onboarding@resend.dev 사용)

type Payload = { id?: string; email?: string | null; provider?: string | null; name?: string | null; created_at?: string | null };

const PROVIDER: Record<string, string> = { kakao: "카카오톡", email: "이메일", google: "구글", apple: "애플" };

function sameSecret(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function POST(req: Request) {
  const secret = process.env.SIGNUP_HOOK_SECRET;
  const got = req.headers.get("x-hook-secret") ?? "";
  if (!secret || !sameSecret(got, secret)) return Response.json({ ok: false }, { status: 401 });

  const key = process.env.RESEND_API_KEY, to = process.env.SIGNUP_NOTIFY_EMAIL;
  if (!key || !to) return Response.json({ ok: false, error: "mail not configured" }, { status: 500 });

  let p: Payload = {};
  try { p = (await req.json()) as Payload; } catch { /* 빈 본문이어도 알림은 보낸다 */ }

  const how = PROVIDER[p.provider ?? ""] ?? p.provider ?? "알 수 없음";
  const when = new Date(p.created_at ?? Date.now()).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  const rows: [string, string][] = [
    ["가입 방법", how],
    ["이름", p.name || "-"],
    ["이메일", p.email || "(제공 안 됨)"],
    ["가입 시각", when],
    ["회원 ID", p.id || "-"],
  ];
  const html = `<div style="font-family:sans-serif;font-size:14px;color:#24364a">
<h2 style="margin:0 0 12px">🎉 새 회원이 가입했어요</h2>
<table style="border-collapse:collapse">${rows.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#6c8199">${k}</td><td style="padding:4px 0"><b>${esc(v)}</b></td></tr>`).join("")}</table>
<p style="margin-top:16px;color:#6c8199">playwithme.kr 가입 알림</p></div>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.SIGNUP_NOTIFY_FROM || "미니게임천국 <onboarding@resend.dev>",
      to: to.split(",").map((s) => s.trim()).filter(Boolean),
      subject: `[playwithme] 새 회원 가입 · ${how}${p.name ? ` · ${p.name}` : ""}`,
      html,
      text,
    }),
  });
  if (!r.ok) return Response.json({ ok: false, error: `resend ${r.status}`, detail: await r.text() }, { status: 502 });
  return Response.json({ ok: true });
}
