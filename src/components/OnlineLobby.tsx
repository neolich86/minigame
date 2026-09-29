"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useApp } from "./AppProvider";
import { gameById } from "@/lib/games";
import { errorKey, type MsgKey } from "@/lib/i18n";
import { createRoom, deleteRoom, fetchMyRooms, joinRoom } from "@/lib/rooms";
import { lxCreateRoom, lxDeleteRoom, lxErrorText, lxJoinRoom, lxMyRooms } from "@/lib/lexio";

// 게임별 방 방식: 카탄 = 방장 브라우저 진행(mg_* 테이블), 렉시오 = 서버 판정(rooms 테이블)
interface RoomLite {
  id: string;
  code: string;
  status: string;
  max_players: number;
  host_user_id: string;
}
const ONLINE: Record<string, {
  players: number[];
  def: number;
  create: (players: number, nick: string | null) => Promise<{ code: string }>;
  join: (code: string, nick: string | null) => Promise<unknown>;
  mine: () => Promise<RoomLite[]>;
  del: (roomId: string) => Promise<void>;
}> = {
  catan: {
    players: [2, 3, 4],
    def: 4,
    create: (n) => createRoom("catan", n),
    join: (c) => joinRoom(c),
    mine: () => fetchMyRooms("catan"),
    del: (id) => deleteRoom(id),
  },
  lexio: {
    players: [3, 4, 5],
    def: 4,
    create: (n, nick) => lxCreateRoom(nick, n),
    join: (c, nick) => lxJoinRoom(c, nick),
    mine: () => lxMyRooms(),
    del: (id) => lxDeleteRoom(id),
  },
};
import { cloudEnabled } from "@/lib/supabase";

export function OnlineLobby({ gameId }: { gameId: string }) {
  const game = gameById(gameId)!;
  const { t, lang, user, profile, loading } = useApp();
  const router = useRouter();
  const cfg = ONLINE[gameId];
  const [players, setPlayers] = useState(cfg.def);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [rooms, setRooms] = useState<RoomLite[]>([]);
  const errText = (e: unknown) => (gameId === "lexio" ? lxErrorText(e, lang) : t(errorKey(e) as MsgKey));

  useEffect(() => {
    if (!user) return;
    cfg.mine().then(setRooms).catch(() => {});
  }, [user, cfg]);

  async function create() {
    setBusy(true);
    setErr(null);
    try {
      const r = await cfg.create(players, profile?.nickname ?? null);
      router.push(`/online/${gameId}/${r.code}`);
    } catch (e) {
      setErr(errText(e));
      setBusy(false);
    }
  }

  async function join(e: FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c.length !== 4) return;
    setBusy(true);
    setErr(null);
    try {
      await cfg.join(c, profile?.nickname ?? null);
      router.push(`/online/${gameId}/${c}`);
    } catch (e2) {
      setErr(errText(e2));
      setBusy(false);
    }
  }

  const loginHref = `/login?next=${encodeURIComponent(`/online/${gameId}`)}`;

  return (
    <div className="wrap mid">
      <Link href="/" className="linkbtn small">
        {t("back")}
      </Link>
      <div className="row" style={{ gap: 16, margin: "14px 0 24px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={game.thumb} alt="" width={72} height={72} style={{ borderRadius: 14, objectFit: "cover" }} />
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            {game.title[lang]}
          </h1>
          <p className="muted" style={{ margin: "6px 0 0", fontSize: 14 }}>
            {game.desc[lang]}
          </p>
        </div>
      </div>

      <div className="mode-choice" style={{ marginBottom: 20 }}>
        <Link href={`/play/${gameId}`} className="panel" style={{ textDecoration: "none" }}>
          <div style={{ fontSize: 26 }}>🤖</div>
          <h2 style={{ fontSize: 17, margin: "8px 0 4px" }}>{t("soloPlay")}</h2>
          <p className="muted small" style={{ margin: 0 }}>
            {lang === "ko" ? "로그인 없이 바로 AI와 대결" : "Jump straight in against the AI — no sign-in needed"}
          </p>
        </Link>
        <div className="panel" style={{ borderColor: "var(--teal-dim)" }}>
          <div style={{ fontSize: 26 }}>🌐</div>
          <h2 style={{ fontSize: 17, margin: "8px 0 4px" }}>{t("onlinePlay")}</h2>
          <p className="muted small" style={{ margin: 0 }}>
            {t("lobbySub")}
          </p>
        </div>
      </div>

      {!cloudEnabled ? (
        <div className="notice">{t("serverMissing")}</div>
      ) : loading ? (
        <p className="muted">…</p>
      ) : !user ? (
        <div className="panel" style={{ textAlign: "center" }}>
          <p style={{ marginTop: 0 }}>{t("loginNeeded")}</p>
          <Link href={loginHref} className="btn primary">
            {t("navLogin")}
          </Link>
        </div>
      ) : (
        <>
          <div className="mode-choice">
            <div className="panel">
              <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>{t("createRoom")}</h3>
              <div className="row wrap-row" style={{ marginBottom: 14 }}>
                <span className="muted small">{t("players")}</span>
                <div className="seg">
                  {cfg.players.map((n) => (
                    <button key={n} className={players === n ? "on" : ""} onClick={() => setPlayers(n)}>
                      {t("playersN", { n })}
                    </button>
                  ))}
                </div>
              </div>
              <button className="btn teal block" onClick={create} disabled={busy}>
                {t("createRoom")}
              </button>
            </div>
            <form className="panel" onSubmit={join}>
              <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>{t("joinRoom")}</h3>
              <input
                className="input"
                placeholder={t("roomCode")}
                value={code}
                maxLength={4}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                style={{ fontFamily: "Space Mono, monospace", letterSpacing: ".3em", textTransform: "uppercase", marginBottom: 14 }}
              />
              <button className="btn primary block" disabled={busy || code.length !== 4}>
                {t("joinRoom")}
              </button>
            </form>
          </div>
          {err && (
            <div className="notice err" style={{ marginTop: 14 }}>
              {err}
            </div>
          )}
          {rooms.length > 0 && (
            <div className="panel" style={{ marginTop: 20 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>{t("myRooms")}</h3>
              <div className="room-list">
                {rooms.map((r) => (
                  <div key={r.id} className="room-item">
                    <span style={{ fontFamily: "Space Mono, monospace", fontWeight: 700, letterSpacing: ".2em", color: "var(--gold)" }}>{r.code}</span>
                    <span className={`pill ${r.status === "playing" ? "ok" : "wait"}`}>{r.status === "playing" ? "PLAYING" : "WAITING"}</span>
                    <span className="muted small" style={{ flex: 1 }}>{t("playersN", { n: r.max_players })}</span>
                    <Link className="btn sm" href={`/online/${gameId}/${r.code}`}>
                      {t("enter")}
                    </Link>
                    {r.host_user_id === user.id && (
                      <button
                        className="btn sm ghost"
                        disabled={busy}
                        onClick={async () => {
                          if (!window.confirm(t("deleteConfirm"))) return;
                          setErr(null);
                          try {
                            await cfg.del(r.id);
                            setRooms((list) => list.filter((x) => x.id !== r.id));
                          } catch (e) {
                            setErr(errText(e));
                          }
                        }}
                      >
                        🗑 {t("deleteRoom")}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
