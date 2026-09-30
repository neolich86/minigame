// My Post 2026 — 인스타그램 로그인(Business Login for Instagram)으로 본인 게시물을 읽어 리포트용 데이터로 줄인다.
// 토큰은 저장하지 않는다: 콜백에서 한 번 쓰고 버린다.

const GRAPH = "https://graph.instagram.com/v25.0";
export const MYPOST_SCOPE = "instagram_business_basic";
export const MYPOST_STATE_COOKIE = "mypost_state";

// 메타 앱 "비즈니스 로그인 설정 → OAuth 리디렉션 URI" 에 등록한 값과 글자 하나까지 같아야 한다.
// 접속 주소(미리보기 배포 주소 등)에 따라 달라지지 않도록 고정값을 쓴다.
export const MYPOST_REDIRECT_URI = "https://minigame-on.vercel.app/api/mypost/callback";

export function mypostConfig() {
  const appId = process.env.INSTAGRAM_APP_ID?.trim();
  const appSecret = process.env.INSTAGRAM_APP_SECRET?.trim();
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI?.trim() || MYPOST_REDIRECT_URI;
  return { appId, appSecret, redirectUri };
}

export function authorizeUrl(appId: string, redirectUri: string, state: string) {
  const u = new URL("https://www.instagram.com/oauth/authorize");
  u.searchParams.set("client_id", appId);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", MYPOST_SCOPE);
  u.searchParams.set("state", state);
  return u.toString();
}

export async function exchangeCode(appId: string, appSecret: string, redirectUri: string, code: string) {
  const body = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code: code.replace(/#_$/, ""),
  });
  const res = await fetch("https://api.instagram.com/oauth/access_token", { method: "POST", body });
  const json = await res.json();
  if (!res.ok || !json.access_token) throw new Error(`token: ${json.error_message ?? json.error?.message ?? res.status}`);
  return json.access_token as string;
}

async function graph<T>(path: string, token: string): Promise<T> {
  const url = path.startsWith("http") ? path : `${GRAPH}${path}${path.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(`graph: ${json.error?.message ?? res.status}`);
  return json as T;
}

interface IgMedia {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_product_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
}

/** 리포트 페이지(public/games/my-post-2026)가 읽는 압축 형식 */
export interface MyPostData {
  v: 1;
  id?: string; // 인스타 사용자 ID — 저장 키로만 쓰고 공개 응답에서는 뺀다
  u: string; // username
  pic?: string;
  followers?: number;
  year: number;
  at: number; // 생성 시각 (epoch ms)
  posts: { t: number; f: "IMAGE" | "CAROUSEL" | "REELS"; l: number | null; c: number; img?: string; url?: string; tags: string[] }[];
}

const TAG_RE = /#([\p{L}\p{N}_]+)/gu;

/** KST 기준 올해 1월 1일 0시 */
export function yearStartKst(now = new Date()) {
  const kstYear = new Date(now.getTime() + 9 * 3600e3).getUTCFullYear();
  return { year: kstYear, start: Date.UTC(kstYear, 0, 1) - 9 * 3600e3 };
}

export async function fetchMyPostData(token: string): Promise<MyPostData> {
  const me = await graph<{ id: string; username: string; profile_picture_url?: string; followers_count?: number }>(
    "/me?fields=id,user_id,username,profile_picture_url,followers_count",
    token,
  );
  const { year, start } = yearStartKst();
  const fields = "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count";
  let next: string | undefined = `${GRAPH}/me/media?fields=${fields}&limit=50&access_token=${encodeURIComponent(token)}`;
  const posts: MyPostData["posts"] = [];
  let pages = 0;
  while (next && pages < 40) {
    pages++;
    const page: { data: IgMedia[]; paging?: { next?: string } } = await graph(next, token);
    let reachedOld = false;
    for (const m of page.data) {
      const t = Date.parse(m.timestamp.replace(/([+-]\d{2})(\d{2})$/, "$1:$2"));
      if (!Number.isFinite(t)) continue;
      if (t < start) { reachedOld = true; continue; }
      const f = m.media_type === "VIDEO" ? "REELS" : m.media_type === "CAROUSEL_ALBUM" ? "CAROUSEL" : "IMAGE";
      const tags = [...new Set([...(m.caption ?? "").matchAll(TAG_RE)].map((x) => x[1]))].slice(0, 10);
      posts.push({
        t,
        f,
        l: typeof m.like_count === "number" ? m.like_count : null,
        c: m.comments_count ?? 0,
        img: m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url,
        url: m.permalink,
        tags,
      });
    }
    // 게시물은 최신순 — 올해 이전 게시물이 나오면 더 볼 필요 없다
    next = reachedOld ? undefined : page.paging?.next;
  }
  return { v: 1, id: String(me.id), u: me.username, pic: me.profile_picture_url, followers: me.followers_count, year, at: Date.now(), posts };
}

/** 메타가 보내는 signed_request 검증 (앱 시크릿 HMAC-SHA256). 성공하면 payload 를 돌려준다. */
export async function parseSignedRequest(signed: string, appSecret: string): Promise<Record<string, unknown> | null> {
  const [sig, payload] = signed.split(".");
  if (!sig || !payload) return null;
  const b64 = (s: string) => s.replace(/-/g, "+").replace(/_/g, "/");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(appSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
  const expected = Buffer.from(mac).toString("base64").replace(/=+$/, "");
  if (expected !== b64(sig).replace(/=+$/, "")) return null;
  try {
    return JSON.parse(Buffer.from(b64(payload), "base64").toString("utf8"));
  } catch {
    return null;
  }
}
