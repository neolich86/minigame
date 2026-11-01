// 앱인토스 전용 연결: 사이트 포털(부모 창) 대신 Supabase 에 직접 붙는다.
// 토스 안에서는 우리 사이트 로그인을 쓸 수 없으므로, 처음 열 때 이 기기용 익명 계정을 자동으로 만든다.
// (Supabase → Authentication → Sign In / Providers → "Allow anonymous sign-ins" 가 켜져 있어야 한다)
import { createClient } from "@supabase/supabase-js";

const SITE = "https://playwithme.kr";
let clientP = null;
function client() {
  if (!clientP) {
    clientP = fetch(SITE + "/api/public-config")
      .then((r) => r.json())
      .then((cfg) => {
        if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) throw new Error("cloud_disabled");
        return createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
          auth: { persistSession: true, autoRefreshToken: true, storageKey: "mycard-auth" },
        });
      });
    clientP.catch(() => { clientP = null; });
  }
  return clientP;
}
const toUser = (u) => (u ? { id: u.id, name: "수집가" } : null);

async function ensureUser() {
  const db = await client();
  const { data } = await db.auth.getSession();
  if (data.session) return data.session.user;
  const r = await db.auth.signInAnonymously();
  if (r.error) throw new Error(r.error.message);
  try { await db.rpc("ensure_profile", { p_nickname: "수집가" + Math.floor(1000 + Math.random() * 9000) }); } catch (e) {}
  return r.data.user;
}

const M = window.MGH;
M.embedded = true;
M.rpc = async (name, params) => {
  const db = await client();
  const { data, error } = await db.rpc(name, params || {});
  if (error) throw new Error(error.message);
  return data;
};
M.save = M.save || {};
M.save.onAuth = (cb) => { ensureUser().then((u) => cb(toUser(u), {})).catch(() => cb(null, {})); };
M.save.login = () => { ensureUser().catch(() => {}); };
M.save.putPublic = async (name, blob) => {
  if (!/^[A-Za-z0-9_-]{1,64}\.(jpg|jpeg|png|webp)$/.test(name)) throw new Error("bad_file_name");
  if (blob.size > 1024 * 1024) throw new Error("file_too_big");
  const db = await client(), u = await ensureUser();
  const p = `${u.id}/card-dex/u/${name}`;
  const { error } = await db.storage.from("game-public").upload(p, blob, { upsert: true, contentType: blob.type || "image/webp", cacheControl: "31536000" });
  if (error) throw new Error(error.message);
  return `${db.storage.from("game-public").getPublicUrl(p).data.publicUrl}?v=${Date.now().toString(36)}`;
};
