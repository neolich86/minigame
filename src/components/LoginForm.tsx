"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useApp } from "./AppProvider";
import { errorKey, type MsgKey } from "@/lib/i18n";
import { cloudEnabled, sendPasswordReset, signInEmail, signInKakao, signUpEmail } from "@/lib/supabase";

type Mode = "signin" | "signup" | "forgot";

function safeNext(v: string | null): string {
  return v && v.startsWith("/") && !v.startsWith("//") ? v : "/";
}

export function LoginForm() {
  const { t, user, loading } = useApp();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [nick, setNick] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ key: MsgKey; ok?: boolean } | null>(null);

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [user, loading, next, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "signin") {
        await signInEmail(email, pw);
      } else if (mode === "signup") {
        if (pw.length < 6) throw new Error("weak_password");
        const loggedIn = await signUpEmail(email, pw, nick || email.split("@")[0], next);
        if (!loggedIn) setMsg({ key: "signUpSent", ok: true });
      } else {
        await sendPasswordReset(email);
        setMsg({ key: "resetSent", ok: true });
      }
    } catch (err) {
      setMsg({ key: errorKey(err) });
    } finally {
      setBusy(false);
    }
  }

  async function kakao() {
    setBusy(true);
    try {
      await signInKakao(next);
    } catch (err) {
      setMsg({ key: errorKey(err) });
      setBusy(false);
    }
  }

  const title = mode === "signup" ? t("signUp") : mode === "forgot" ? t("sendReset") : t("loginTitle");

  return (
    <div className="wrap narrow">
      <h1 className="page-title">{title}</h1>
      <p className="page-sub">{t("loginSub")}</p>
      {!cloudEnabled ? (
        <div className="notice">{t("serverMissing")}</div>
      ) : (
        <div className="panel">
          {mode !== "forgot" && (
            <>
              <button className="btn kakao block" onClick={kakao} disabled={busy} type="button">
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                  <path fill="currentColor" d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.7 6.7l-1 3.7c-.1.3.3.6.6.4l4.4-2.9c.4 0 .9.1 1.3.1 5.5 0 10-3.6 10-8S17.5 3 12 3z" />
                </svg>
                {t("withKakao")}
              </button>
              <div className="divider">{t("orEmail")}</div>
            </>
          )}
          <form onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="email">{t("email")}</label>
              <input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {mode !== "forgot" && (
              <div className="field">
                <label htmlFor="pw">{mode === "signup" ? t("passwordNew") : t("password")}</label>
                <input
                  id="pw"
                  className="input"
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                  minLength={6}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                />
              </div>
            )}
            {mode === "signup" && (
              <div className="field">
                <label htmlFor="nick">{t("nickname")}</label>
                <input id="nick" className="input" maxLength={12} value={nick} onChange={(e) => setNick(e.target.value)} placeholder={email.split("@")[0] || ""} />
              </div>
            )}
            {msg && <div className={`notice ${msg.ok ? "ok" : "err"}`} style={{ marginBottom: 14 }}>{t(msg.key)}</div>}
            <button className="btn primary block" type="submit" disabled={busy}>
              {mode === "signup" ? t("signUp") : mode === "forgot" ? t("sendReset") : t("signIn")}
            </button>
          </form>
          <div className="row spread wrap-row" style={{ marginTop: 14 }}>
            {mode === "signin" ? (
              <>
                <button className="linkbtn" onClick={() => { setMode("signup"); setMsg(null); }}>{t("toSignUp")}</button>
                <button className="linkbtn" onClick={() => { setMode("forgot"); setMsg(null); }}>{t("forgot")}</button>
              </>
            ) : (
              <button className="linkbtn" onClick={() => { setMode("signin"); setMsg(null); }}>{t("toSignIn")}</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
