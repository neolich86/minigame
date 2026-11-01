// 카드 도감 — 이미지 링크로 그림 넣기: 외부 이미지 주소를 대신 받아 돌려준다 (브라우저 CORS 우회).
// 받은 그림은 브라우저에서 1MB 이하로 줄여 사용자 폴더(game-public)에 올린다 → 외부 링크가 사라져도 그림이 남는다.
// GET /api/card-dex/image?url=https://...
import { lookup } from "node:dns/promises";
import net from "node:net";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX = 8 * 1024 * 1024;

function privateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v = ip.toLowerCase();
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("::ffff:127.") || v.startsWith("::ffff:10.") || v.startsWith("::ffff:192.168.");
}
async function safeUrl(raw: string): Promise<URL | null> {
  let u: URL;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (u.username || u.password) return null;
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return null;
  try {
    const addrs = net.isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
    if (!addrs.length || addrs.some((a) => privateIp(a.address))) return null;
  } catch { return null; }
  return u;
}

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("url") || "";
  let target = await safeUrl(raw);
  if (!target) return new Response("bad_url", { status: 400 });
  try {
    let res: Response | null = null;
    for (let hop = 0; hop < 4; hop++) {
      res = await fetch(target, { redirect: "manual", headers: { "user-agent": "Mozilla/5.0 (card-dex image fetch)", accept: "image/*" }, signal: AbortSignal.timeout(10000) });
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        target = await safeUrl(new URL(res.headers.get("location")!, target).toString());
        if (!target) return new Response("bad_url", { status: 400 });
        continue;
      }
      break;
    }
    if (!res || !res.ok || !res.body) return new Response("fetch_failed", { status: 502 });
    const type = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(type)) return new Response("not_image", { status: 415 });
    if (Number(res.headers.get("content-length") || 0) > MAX) return new Response("too_big", { status: 413 });
    const reader = res.body.getReader(), chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX) { reader.cancel(); return new Response("too_big", { status: 413 }); }
      chunks.push(value);
    }
    return new Response(Buffer.concat(chunks), { headers: { "content-type": type, "cache-control": "no-store" } });
  } catch {
    return new Response("fetch_failed", { status: 502 });
  }
}
