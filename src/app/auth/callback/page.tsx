"use client";

// 카카오 OAuth / 이메일 인증 / 비밀번호 재설정 링크가 돌아오는 곳.
// supabase-js(PKCE, detectSessionInUrl)가 ?code= 를 세션으로 교환하면 next 로 이동한다.
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
import { useApp } from "@/components/AppProvider";

export default function AuthCallback() {
  const router = useRouter();
  const { t } = useApp();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("next") || "/";
    const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
    if (params.get("error")) {
      setFailed(true);
      return;
    }
    const c = sb();
    if (!c) {
      router.replace(next);
      return;
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      router.replace(next);
    };
    const { data: sub } = c.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY" || event === "INITIAL_SESSION")) finish();
    });
    c.auth.getSession().then(({ data }) => {
      if (data.session) finish();
    });
    const timer = setTimeout(() => {
      if (!done) setFailed(true);
    }, 8000);
    return () => {
      clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="wrap narrow" style={{ textAlign: "center" }}>
      {failed ? (
        <div className="notice err">
          {t("err_generic")}{" "}
          <a href="/login" className="linkbtn">
            {t("navLogin")}
          </a>
        </div>
      ) : (
        <p className="muted">…</p>
      )}
    </div>
  );
}
