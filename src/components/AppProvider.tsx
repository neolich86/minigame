"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { LANG_COOKIE, LANG_STORAGE, normLang, pickLang, translate, type Lang, type MsgKey } from "@/lib/i18n";
import { cloudEnabled, displayName, ensureProfile, sb, type Profile } from "@/lib/supabase";

interface AppState {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: MsgKey, vars?: Record<string, string | number>) => string;
  loading: boolean;
  user: User | null;
  profile: Profile | null;
  setProfile: (p: Profile | null) => void;
}

const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp outside AppProvider");
  return v;
}

function persistLang(l: Lang) {
  document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
  try {
    localStorage.setItem(LANG_STORAGE, l);
  } catch {}
  document.documentElement.lang = l;
}

export function AppProvider({ initialLang, langFromCookie, children }: { initialLang: Lang; langFromCookie: boolean; children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [auth, setAuth] = useState<{ loading: boolean; user: User | null; profile: Profile | null }>({
    loading: cloudEnabled,
    user: null,
    profile: null,
  });

  // 서버는 Accept-Language로 1차 판정. 쿠키가 없던 첫 방문이면 브라우저 설정으로 한 번 더 확인해 저장한다.
  useEffect(() => {
    if (langFromCookie) {
      try {
        localStorage.setItem(LANG_STORAGE, initialLang);
      } catch {}
      return;
    }
    let stored: Lang | null = null;
    try {
      stored = normLang(localStorage.getItem(LANG_STORAGE));
    } catch {}
    const detected = stored ?? pickLang(navigator.languages?.length ? navigator.languages : [navigator.language]);
    persistLang(detected);
    if (detected !== initialLang) setLangState(detected);
  }, [initialLang, langFromCookie]);

  const setLang = useCallback((l: Lang) => {
    persistLang(l);
    setLangState(l);
    // 열려 있는 게임 iframe에도 알림
    document.querySelectorAll("iframe[data-mgh-game]").forEach((f) => {
      (f as HTMLIFrameElement).contentWindow?.postMessage({ mgh: 1, type: "lang", lang: l }, window.location.origin);
    });
  }, []);

  useEffect(() => {
    if (!cloudEnabled) return;
    const c = sb();
    if (!c) return;
    let cancelled = false;
    async function sync(user: User | null) {
      if (!user) {
        if (!cancelled) setAuth({ loading: false, user: null, profile: null });
        return;
      }
      try {
        const profile = await ensureProfile(displayName(user));
        if (!cancelled) setAuth({ loading: false, user, profile });
      } catch {
        if (!cancelled) setAuth({ loading: false, user, profile: null });
      }
    }
    c.auth.getSession().then(({ data }) => sync(data.session?.user ?? null));
    const { data: sub } = c.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return;
      // onAuthStateChange 콜백 안에서 바로 supabase 호출을 await 하면 교착될 수 있어 다음 틱으로 미룬다
      setTimeout(() => sync(session?.user ?? null), 0);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AppState>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => translate(lang, key, vars),
      loading: auth.loading,
      user: auth.user,
      profile: auth.profile,
      setProfile: (p) => setAuth((s) => ({ ...s, profile: p })),
    }),
    [lang, setLang, auth],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
