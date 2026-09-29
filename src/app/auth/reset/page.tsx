"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useApp } from "@/components/AppProvider";
import { errorKey, type MsgKey } from "@/lib/i18n";
import { updatePassword } from "@/lib/supabase";

export default function ResetPassword() {
  const { t, user, loading } = useApp();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ key: MsgKey; ok?: boolean } | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (pw.length < 6) throw new Error("weak_password");
      await updatePassword(pw);
      setMsg({ key: "resetDone", ok: true });
    } catch (err) {
      setMsg({ key: errorKey(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap narrow">
      <h1 className="page-title">{t("resetTitle")}</h1>
      <div className="panel" style={{ marginTop: 20 }}>
        {!loading && !user ? (
          <div className="notice">
            {t("loginNeeded")} <Link href="/login" className="linkbtn">{t("navLogin")}</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="pw">{t("passwordNew")}</label>
              <input id="pw" className="input" type="password" autoComplete="new-password" minLength={6} required value={pw} onChange={(e) => setPw(e.target.value)} />
            </div>
            {msg && <div className={`notice ${msg.ok ? "ok" : "err"}`} style={{ marginBottom: 14 }}>{t(msg.key)}</div>}
            <button className="btn primary block" disabled={busy}>{t("save")}</button>
          </form>
        )}
      </div>
    </div>
  );
}
