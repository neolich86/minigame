"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useApp } from "@/components/AppProvider";
import { ALL_BOARDS, formatScore, itemPath } from "@/lib/games";
import { errorKey, type MsgKey } from "@/lib/i18n";
import { fetchMyScores, setNickname, signOut, type ScoreRow } from "@/lib/supabase";

export default function MePage() {
  const { t, lang, user, profile, loading, setProfile } = useApp();
  const router = useRouter();
  const [nick, setNick] = useState("");
  const [msg, setMsg] = useState<{ key: MsgKey; ok?: boolean } | null>(null);
  const [rows, setRows] = useState<ScoreRow[] | null>(null);

  useEffect(() => {
    if (profile) setNick(profile.nickname);
  }, [profile]);
  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/me");
  }, [loading, user, router]);
  useEffect(() => {
    if (user) fetchMyScores(user.id).then(setRows).catch(() => setRows([]));
  }, [user]);

  async function save(e: FormEvent) {
    e.preventDefault();
    try {
      const n = await setNickname(nick);
      if (profile) setProfile({ ...profile, nickname: n });
      setMsg({ key: "saved", ok: true });
    } catch (err) {
      setMsg({ key: errorKey(err) });
    }
  }

  if (!user) return <div className="wrap narrow muted">…</div>;

  return (
    <div className="wrap mid">
      <h1 className="page-title">{t("meTitle")}</h1>
      <p className="page-sub">{user.email ?? "Kakao"}</p>

      <div className="panel" style={{ marginBottom: 20 }}>
        <form onSubmit={save} className="row wrap-row" style={{ alignItems: "flex-end" }}>
          <div className="field" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
            <label htmlFor="nick">{t("nickname")}</label>
            <input id="nick" className="input" maxLength={12} value={nick} onChange={(e) => { setNick(e.target.value); setMsg(null); }} />
          </div>
          <button className="btn primary">{t("save")}</button>
        </form>
        {msg && <div className={`notice ${msg.ok ? "ok" : "err"}`} style={{ marginTop: 12 }}>{t(msg.key)}</div>}
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, margin: "0 0 12px" }}>{t("myRecords")}</h2>
        {!rows ? (
          <p className="muted small">…</p>
        ) : !rows.length ? (
          <p className="muted small">{t("noRecords")}</p>
        ) : (
          <ol className="lb">
            {ALL_BOARDS.filter(({ board }) => rows.some((r) => r.game_id === board.id)).map(({ game, board }) => {
              const r = rows.find((x) => x.game_id === board.id)!;
              return (
                <li key={board.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={game.thumb} alt="" width={28} height={28} style={{ borderRadius: 6, objectFit: "cover" }} />
                  <Link href={itemPath(game)} className="nm" style={{ textDecoration: "none" }}>
                    {game.title[lang]}
                    {(game.boards?.length ?? 0) > 1 ? ` · ${board.label[lang]}` : ""}
                  </Link>
                  <span className="sc">{formatScore(board, Number(r.best_score), lang)}</span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <button className="btn ghost" onClick={async () => { await signOut(); router.replace("/"); }}>
        {t("navLogout")}
      </button>
      <p className="muted small" style={{ marginTop: 18 }}>
        <Link href="/account/delete">{lang === "en" ? "Delete account" : "계정 삭제"}</Link> ·{" "}
        <Link href="/privacy">{lang === "en" ? "Privacy Policy" : "개인정보처리방침"}</Link>
      </p>
    </div>
  );
}
