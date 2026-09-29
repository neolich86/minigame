"use client";

// 온라인 방 — 대기실(좌석·준비·시작)과 게임 중계.
// 게임 규칙은 방장 브라우저의 게임(iframe)이 돌리고, 이 컴포넌트는 Supabase Realtime으로
//   방장 → 모두: 상태(state)   참가자 → 방장: 행동(intent)
// 을 중계한다. 방장은 진행 스냅샷을 DB(mg_room_states)에 저장해 새로고침·방장 교체 시 이어서 진행한다.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useApp } from "./AppProvider";
import { gameById } from "@/lib/games";
import { errorKey, type MsgKey } from "@/lib/i18n";
import {
  SEAT_COLORS,
  claimHost,
  deleteRoom,
  fetchMembers,
  fetchRoom,
  fetchSavedState,
  finishRoom,
  heartbeat,
  joinRoom,
  leaveRoom,
  replaceWithAI,
  saveState,
  setMaxPlayers,
  setReady,
  setSeatAI,
  startRoom,
  type Member,
  type Room,
} from "@/lib/rooms";
import { cloudEnabled, sb } from "@/lib/supabase";

type NetMsg = { mgh?: number; type: string; [k: string]: unknown };

export function RoomClient({ gameId, code }: { gameId: string; code: string }) {
  const game = gameById(gameId)!;
  const { t, lang, user, loading } = useApp();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [err, setErr] = useState<MsgKey | null>(null);
  const [fatal, setFatal] = useState<MsgKey | null>(null);
  const [present, setPresent] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [frameKey, setFrameKey] = useState(0);
  const [hostGoneSince, setHostGoneSince] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const roomRef = useRef<Room | null>(null);
  const membersRef = useRef<Member[]>([]);
  const chRef = useRef<RealtimeChannel | null>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const latest = useRef<{ state: unknown; ver: number } | null>(null);
  const sendTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSend = useRef<{ state: unknown; ver: number; from: string | null } | null>(null);
  const prevAi = useRef<Record<number, boolean>>({});
  const [frameLang] = useState(lang);

  const uid = user?.id ?? null;
  const me = members.find((m) => m.user_id === uid) ?? null;
  const isHost = !!room && !!uid && room.host_user_id === uid;
  const role: "host" | "guest" = isHost ? "host" : "guest";
  const roleRef = useRef(role);
  // 실시간 콜백(채널·postMessage)이 항상 최신 값을 보도록 ref 동기화
  useEffect(() => {
    roleRef.current = role;
    roomRef.current = room;
    membersRef.current = members;
  }, [role, room, members]);

  const post = useCallback((msg: NetMsg) => {
    frameRef.current?.contentWindow?.postMessage({ mgh: 1, ...msg }, window.location.origin);
  }, []);

  const refresh = useCallback(async (roomId: string) => {
    try {
      const [r, m] = await Promise.all([fetchRoom(roomId), fetchMembers(roomId)]);
      if (r) setRoom(r);
      else if (roomRef.current) setFatal("roomDeleted"); // 방장이 방을 삭제함
      setMembers(m);
    } catch {
      /* 일시적 오류는 다음 이벤트에서 복구 */
    }
  }, []);

  // 1) 방 참가(재접속 포함)
  useEffect(() => {
    if (!user || !cloudEnabled) return;
    let cancelled = false;
    joinRoom(code)
      .then((r) => {
        if (cancelled) return;
        setRoom(r);
        refresh(r.id);
      })
      .catch((e) => !cancelled && setFatal(errorKey(e)));
    return () => {
      cancelled = true;
    };
  }, [user, code, refresh]);

  // 2) 실시간 채널
  const roomId = room?.id;
  useEffect(() => {
    const c = sb();
    if (!c || !roomId || !uid) return;
    const ch = c.channel(`mg-room:${roomId}`, { config: { broadcast: { self: false }, presence: { key: uid } } });
    ch.on("broadcast", { event: "state" }, ({ payload }) => {
      const r = roomRef.current;
      if (roleRef.current !== "guest" || !r || payload.from !== r.host_user_id) return;
      latest.current = { state: payload.state, ver: payload.ver };
      post({ type: "net:state", state: payload.state, ver: payload.ver });
    })
      .on("broadcast", { event: "intent" }, ({ payload }) => {
        if (roleRef.current !== "host") return;
        const m = membersRef.current.find((x) => x.user_id === payload.from);
        if (!m || m.seat !== payload.seat) return;
        post({ type: "net:intent", seat: m.seat, intent: payload.intent });
      })
      .on("broadcast", { event: "req" }, () => {
        if (roleRef.current === "host") post({ type: "net:requestState" });
      })
      .on("presence", { event: "sync" }, () => {
        setPresent(Object.keys(ch.presenceState()));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "mg_room_members", filter: `room_id=eq.${roomId}` }, () => refresh(roomId))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "mg_room_members" }, (p) => {
        if ((p.old as { room_id?: string })?.room_id === roomId) refresh(roomId);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "mg_rooms", filter: `id=eq.${roomId}` }, () => refresh(roomId))
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          ch.track({ at: Date.now() });
          refresh(roomId);
        }
      });
    chRef.current = ch;
    return () => {
      chRef.current = null;
      c.removeChannel(ch);
    };
  }, [roomId, uid, post, refresh]);

  // 3) 게임(iframe) → 포털
  useEffect(() => {
    function flushSend() {
      sendTimer.current = null;
      const m = pendingSend.current;
      pendingSend.current = null;
      if (m && chRef.current) chRef.current.send({ type: "broadcast", event: "state", payload: m });
    }
    async function onMsg(ev: MessageEvent) {
      if (ev.origin !== window.location.origin || ev.source !== frameRef.current?.contentWindow) return;
      const d = ev.data as NetMsg;
      if (!d || d.mgh !== 1) return;
      const r = roomRef.current;
      const mine = membersRef.current.find((m) => m.user_id === uid);
      if (!r || !mine) return;
      if (d.type === "net:ready") {
        const players = Array.from({ length: r.max_players }, (_, i) => {
          const m = membersRef.current.find((x) => x.seat === i);
          return { name: m?.nickname ?? "AI", ai: !m || m.is_ai };
        });
        prevAi.current = Object.fromEntries(players.map((p, i) => [i, p.ai]));
        if (roleRef.current === "host") {
          let saved: { state: unknown; version: number } | null = null;
          try {
            saved = await fetchSavedState(r.id);
          } catch {}
          post({ type: "net:init", role: "host", mySeat: mine.seat, players, state: saved?.state ?? null, ver: saved?.version ?? 0 });
        } else {
          let st = latest.current;
          if (!st) {
            try {
              const saved = await fetchSavedState(r.id);
              if (saved) st = { state: saved.state, ver: saved.version };
            } catch {}
          }
          post({ type: "net:init", role: "guest", mySeat: mine.seat, players, state: st?.state ?? null, ver: st?.ver ?? 0 });
          chRef.current?.send({ type: "broadcast", event: "req", payload: { from: uid } });
        }
      } else if (d.type === "net:state" && roleRef.current === "host") {
        const ver = Number(d.ver) || 0;
        latest.current = { state: d.state, ver };
        pendingSend.current = { state: d.state, ver, from: uid };
        if (!sendTimer.current) sendTimer.current = setTimeout(flushSend, 120);
        // DB 저장은 2초 모아서 (게임이 끝나면 즉시)
        if (saveTimer.current) clearTimeout(saveTimer.current);
        const doSave = () => {
          const s = latest.current;
          if (s) saveState(r.id, s.state, s.ver).catch(() => {});
        };
        if (d.winner !== null && d.winner !== undefined) doSave();
        else saveTimer.current = setTimeout(doSave, 2000);
      } else if (d.type === "net:intent" && roleRef.current === "guest") {
        chRef.current?.send({ type: "broadcast", event: "intent", payload: { from: uid, seat: mine.seat, intent: d.intent } });
      } else if (d.type === "net:finished" && roleRef.current === "host") {
        finishRoom(r.id, { winner: d.winner, scores: d.scores, turn: d.turn }).catch(() => {});
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [uid, post]);

  // 4) 방장 역할이 바뀌면 게임 화면을 새로 연결 (새 방장은 저장된 스냅샷에서 이어서 진행)
  const hostId = room?.host_user_id;
  const prevHost = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (prevHost.current && hostId && prevHost.current !== hostId) {
      latest.current = null;
      setFrameKey((k) => k + 1);
    }
    prevHost.current = hostId;
  }, [hostId]);

  // 5) 방장: 좌석의 AI 전환(나감/복귀)을 게임에 반영 + 생존 신호
  useEffect(() => {
    if (!isHost || room?.status !== "playing") return;
    for (const m of members) {
      const was = prevAi.current[m.seat];
      if (was !== undefined && was !== m.is_ai) post({ type: "net:setAI", seat: m.seat, ai: m.is_ai });
      prevAi.current[m.seat] = m.is_ai;
    }
  }, [members, isHost, room?.status, post]);

  useEffect(() => {
    if (!isHost || !room || room.status !== "playing") return;
    const id = room.id;
    heartbeat(id).catch(() => {});
    const h = setInterval(() => heartbeat(id).catch(() => {}), 15000);
    return () => clearInterval(h);
  }, [isHost, room]);

  // 6) 접속 상태 → 게임 안 '접속 끊김' 표시, 방장 부재 감지
  const offlineSeats = members.filter((m) => m.user_id && !m.is_ai && !present.includes(m.user_id)).map((m) => m.seat);
  const offlineKey = offlineSeats.join(",");
  useEffect(() => {
    if (room?.status === "playing") post({ type: "net:presence", offline: offlineKey ? offlineKey.split(",").map(Number) : [] });
  }, [offlineKey, room?.status, post]);

  const hostPresent = !!hostId && present.includes(hostId);
  useEffect(() => {
    if (isHost || room?.status !== "playing") {
      setHostGoneSince(null);
      return;
    }
    setHostGoneSince((s) => (hostPresent ? null : s ?? Date.now()));
  }, [hostPresent, isHost, room?.status]);
  useEffect(() => {
    if (hostGoneSince === null) return;
    const h = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(h);
  }, [hostGoneSince]);

  async function run(fn: () => Promise<unknown>) {
    setErr(null);
    try {
      await fn();
      if (room) await refresh(room.id);
    } catch (e) {
      setErr(errorKey(e));
    }
  }

  async function leave() {
    if (room) await leaveRoom(room.id).catch(() => {});
    router.push(`/online/${gameId}`);
  }

  async function removeRoom() {
    if (!room || !window.confirm(t("deleteConfirm"))) return;
    try {
      await deleteRoom(room.id);
      router.push(`/online/${gameId}`);
    } catch (e) {
      setErr(errorKey(e));
    }
  }

  function copyInvite() {
    const url = `${window.location.origin}/online/${gameId}/${code}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  /* ───────── 렌더 ───────── */
  if (!cloudEnabled) return <div className="wrap narrow"><div className="notice">{t("serverMissing")}</div></div>;
  if (loading) return <div className="wrap narrow muted">…</div>;
  if (!user) {
    return (
      <div className="wrap narrow" style={{ textAlign: "center" }}>
        <p>{t("loginNeeded")}</p>
        <Link className="btn primary" href={`/login?next=${encodeURIComponent(`/online/${gameId}/${code}`)}`}>
          {t("navLogin")}
        </Link>
      </div>
    );
  }
  if (fatal) {
    return (
      <div className="wrap narrow">
        <div className="notice err" style={{ marginBottom: 14 }}>{t(fatal)}</div>
        <Link className="btn" href={`/online/${gameId}`}>{t("backToLobby")}</Link>
      </div>
    );
  }
  if (!room || !me) return <div className="wrap narrow muted">…</div>;

  // 게임 중 / 종료
  if (room.status !== "waiting") {
    const finished = room.status === "finished";
    const winnerName = finished && room.result ? members.find((m) => m.seat === room.result!.winner)?.nickname ?? "AI" : null;
    return (
      <div className="play-shell">
        <div className="play-main">
          <div className="play-bar">
            <button className="btn sm ghost" onClick={leave}>{t("leave")}</button>
            {isHost && <button className="btn sm ghost" onClick={removeRoom}>🗑 {t("deleteRoom")}</button>}
            <span className="title">{game.title[lang]} · <span style={{ fontFamily: "Space Mono, monospace", color: "var(--gold)" }}>{room.code}</span></span>
            {members.map((m) => (
              <span key={m.seat} className="row" style={{ gap: 5, fontSize: 12 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: SEAT_COLORS[m.seat], display: "inline-block" }} />
                {m.is_ai && !m.user_id ? "AI" : m.nickname}
                {m.is_ai && m.user_id && <span className="pill wait">AI</span>}
                {offlineSeats.includes(m.seat) && <span className="pill off">{t("offline")}</span>}
                {isHost && !finished && offlineSeats.includes(m.seat) && (
                  <button className="btn sm" onClick={() => run(() => replaceWithAI(room.id, m.seat))}>{t("replaceAI")}</button>
                )}
              </span>
            ))}
          </div>
          {!isHost && hostGoneSince !== null && !finished && (
            <div className="net-banner row spread wrap-row">
              <span>{t("hostDisconnected")}</span>
              {now - hostGoneSince > 20000 && (
                <button className="btn sm" onClick={() => run(() => claimHost(room.id))}>
                  {lang === "ko" ? "내가 방장 이어받기" : "Take over as host"}
                </button>
              )}
            </div>
          )}
          {finished && (
            <div className="net-banner row spread wrap-row" style={{ background: "rgba(77,219,199,.1)", color: "var(--teal)", borderColor: "var(--teal-dim)" }}>
              <span>🏁 {t("gameOver")}{winnerName ? ` — ${winnerName} 🏆` : ""}</span>
              <Link className="btn sm teal" href={`/online/${gameId}`}>{t("backToLobby")}</Link>
            </div>
          )}
          {err && <div className="net-banner">{t(err)}</div>}
          <iframe
            key={frameKey}
            ref={frameRef}
            data-mgh-game={game.id}
            className="game-frame"
            src={`${game.src}?online=1&lang=${frameLang}`}
            title={game.title[lang]}
          />
        </div>
      </div>
    );
  }

  // 대기실
  const seats = Array.from({ length: room.max_players }, (_, i) => members.find((m) => m.seat === i) ?? null);
  const full = seats.every(Boolean);
  const allReady = seats.every((m) => m && (m.is_ai || m.is_ready || m.user_id === room.host_user_id));
  return (
    <div className="wrap mid">
      <Link href={`/online/${gameId}`} className="linkbtn small">{t("backToLobby")}</Link>
      <div className="panel" style={{ margin: "14px 0 18px", textAlign: "center" }}>
        <div className="muted small">{t("roomCodeLabel")}</div>
        <div className="code-big">{room.code}</div>
        <div className="row" style={{ justifyContent: "center", marginTop: 10 }}>
          <button className="btn sm" onClick={copyInvite}>🔗 {copied ? t("copied") : t("copy")}</button>
        </div>
      </div>

      <div className="panel">
        <div className="row spread wrap-row" style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, margin: 0 }}>{game.title[lang]}</h2>
          {isHost ? (
            <div className="seg">
              {[2, 3, 4].map((n) => (
                <button key={n} className={room.max_players === n ? "on" : ""} onClick={() => run(() => setMaxPlayers(room.id, n))}>
                  {t("playersN", { n })}
                </button>
              ))}
            </div>
          ) : (
            <span className="muted small">{t("playersN", { n: room.max_players })}</span>
          )}
        </div>
        <div className="seat-list">
          {seats.map((m, i) => (
            <div key={i} className="seat">
              <span className="sw" style={{ background: SEAT_COLORS[i] }} />
              <div className="who">
                {m ? (
                  <>
                    <b>
                      {m.is_ai ? "🤖 AI" : m.nickname}
                      {m.user_id === uid ? ` (${t("you")})` : ""}
                    </b>
                    <span>{t("seat")} {i + 1}</span>
                  </>
                ) : (
                  <>
                    <b className="muted">{t("emptySeat")}</b>
                    <span>{t("seat")} {i + 1}</span>
                  </>
                )}
              </div>
              {m && m.user_id === room.host_user_id && <span className="pill host">{t("host")}</span>}
              {m && !m.is_ai && m.user_id !== room.host_user_id && (
                <span className={`pill ${m.is_ready ? "ok" : "wait"}`}>{m.is_ready ? t("ready") : t("waitingReady")}</span>
              )}
              {m && m.user_id && !m.is_ai && !present.includes(m.user_id) && <span className="pill off">{t("offline")}</span>}
              {isHost && !m && <button className="btn sm" onClick={() => run(() => setSeatAI(room.id, i, true))}>{t("fillAI")}</button>}
              {isHost && m?.is_ai && !m.user_id && <button className="btn sm ghost" onClick={() => run(() => setSeatAI(room.id, i, false))}>{t("removeSeat")}</button>}
            </div>
          ))}
        </div>
        {err && <div className="notice err" style={{ marginTop: 14 }}>{t(err)}</div>}
        <div className="row spread wrap-row" style={{ marginTop: 18 }}>
          <div className="row">
            <button className="btn ghost" onClick={leave}>{t("leave")}</button>
            {isHost && <button className="btn ghost" onClick={removeRoom}>🗑 {t("deleteRoom")}</button>}
          </div>
          {isHost ? (
            <div className="row wrap-row">
              <span className="muted small">{!full ? t("needFull") : !allReady ? t("needAllReady") : ""}</span>
              <button className="btn teal" disabled={!full || !allReady} onClick={() => run(() => startRoom(room.id))}>{t("startGame")}</button>
            </div>
          ) : (
            <button className={`btn ${me.is_ready ? "" : "primary"}`} onClick={() => run(() => setReady(room.id, !me.is_ready))}>
              {me.is_ready ? `✓ ${t("ready")}` : t("notReady")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
