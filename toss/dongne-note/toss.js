// 앱인토스 전용 연결: 사이트 포털(부모 창) 대신 Supabase 에 직접 붙는다.
// 토스 안에서는 우리 사이트 로그인 화면으로 갈 수 없으므로, 쓰기·좋아요를 처음 할 때 이 기기용 익명 계정을 만든다.
// (Supabase 대시보드 → Authentication → Sign In / Providers → "Allow anonymous sign-ins" 를 켜야 한다)
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
          auth: { persistSession: true, autoRefreshToken: true, storageKey: "dongnenote-auth" },
        });
      });
    clientP.catch(() => { clientP = null; });
  }
  return clientP;
}
const toUser = (u) => (u ? { id: u.id, name: "이웃" } : null);

window.DN_BACKEND = {
  async rpc(name, params) {
    const db = await client();
    const { data, error } = await db.rpc(name, params);
    if (error) throw new Error(error.message);
    return data;
  },
  onAuth(cb) {
    client()
      .then(async (db) => {
        const { data } = await db.auth.getSession();
        cb(toUser(data.session && data.session.user));
        db.auth.onAuthStateChange((ev, session) => {
          if (ev === "SIGNED_IN" || ev === "SIGNED_OUT") cb(toUser(session && session.user));
        });
      })
      .catch(() => cb(null));
  },
  // 익명 계정 만들기 + 랜덤 닉네임(이웃1234)
  async login() {
    const db = await client();
    const { data, error } = await db.auth.signInAnonymously();
    if (error) throw new Error(error.message);
    const nick = "이웃" + Math.floor(1000 + Math.random() * 9000);
    try { await db.rpc("ensure_profile", { p_nickname: nick }); } catch (e) {}
    return toUser(data.user);
  },
};
