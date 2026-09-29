"use client";

// 렉시오 온라인 방 — 대기실 + 게임 화면. 규칙 판정은 전부 서버(DB 함수)가 하고,
// 이 화면은 game_public(공개 상태)과 내 손패(get_my_hand)만 받아서 그린다.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "./AppProvider";
import {
  lxErrorText,
  lxFetchGame,
  lxFetchMembers,
  lxFetchRoom,
  lxDeleteRoom,
  lxFillAI,
  lxJoinRoom,
  lxLeave,
  lxMyHand,
  lxNextRound,
  lxPass,
  lxSetReady,
  lxStart,
  lxSubmit,
  type GamePublic,
  type LexioMember,
  type LexioRoom,
  type Tile,
} from "@/lib/lexio";
import { cloudEnabled, sb } from "@/lib/supabase";

const TILE_COLOR: Record<Tile["color"], { bg: string; fg: string }> = {
  blue: { bg: "#e7eefc", fg: "#2e5c8a" },
  green: { bg: "#e9f4ec", fg: "#3f7350" },
  yellow: { bg: "#fbf3df", fg: "#b8860b" },
  red: { bg: "#fbe9e6", fg: "#c0392b" },
};

const TX = {
  ko: {
    title: "렉시오 온라인", room: "방", waiting: "대기 중", playing: "진행 중", finished: "종료",
    share: "코드를 친구에게 공유하세요", empty: "빈 자리", fillAI: "AI로 채우기", host: "방장", ai: "AI",
    ready: "준비 완료", notReady: "대기 중", readyBtn: "준비 완료", unready: "준비 취소", rounds: "라운드 수",
    start: "게임 시작", leave: "방 나가기", waitHost: "전원 준비 완료 — 방장이 시작하길 기다리고 있어요.",
    needAll: "모든 자리가 차고 전원이 준비하면 방장이 시작할 수 있어요.", copy: "복사", copied: "복사됨",
    round: "라운드", myTurn: "내 차례", turnOf: (n: string) => `${n}의 차례`, roundOver: "라운드 종료", gameOver: "게임 종료",
    ranks: "족보", closeRanks: "닫기", tiles: "장", pts: "점", emptyField: "필드가 비어 있어요 — 자유롭게 낼 수 있어요",
    play: "내기", pass: "패스", finisher: (n: string) => `${n}님이 먼저 손을 털었어요!`, left: (k: number) => `${k}장 남음`,
    place: (i: number) => `${i}위`, next: "다음 라운드", final: "최종 결과", back: "로비로 돌아가기", loading: "불러오는 중…",
    solo: "혼자 하기 (AI 대전)",
  },
  en: {
    title: "LEXIO Online", room: "Room", waiting: "Waiting", playing: "Playing", finished: "Finished",
    share: "Share the code with friends", empty: "Empty seat", fillAI: "Fill with AI", host: "Host", ai: "AI",
    ready: "Ready", notReady: "Not ready", readyBtn: "Ready", unready: "Cancel ready", rounds: "Rounds",
    start: "Start game", leave: "Leave room", waitHost: "Everyone's ready — waiting for the host to start.",
    needAll: "The host can start once every seat is filled and everyone is ready.", copy: "Copy", copied: "Copied",
    round: "Round", myTurn: "Your turn", turnOf: (n: string) => `${n}'s turn`, roundOver: "Round over", gameOver: "Game over",
    ranks: "Hand ranks", closeRanks: "Close", tiles: "tiles", pts: "pts", emptyField: "The field is empty — play anything",
    play: "Play", pass: "Pass", finisher: (n: string) => `${n} went out first!`, left: (k: number) => `${k} left`,
    place: (i: number) => `#${i}`, next: "Next round", final: "Final results", back: "Back to lobby", loading: "Loading…",
    solo: "Play solo (vs AI)",
  },
};

const SUBTYPE = {
  ko: { single: "싱글", pair: "페어", triple: "트리플", straight: "스트레이트", flush: "플러시", fullhouse: "풀하우스", fourcard: "포카드", straightflush: "스트레이트플러시" },
  en: { single: "Single", pair: "Pair", triple: "Triple", straight: "Straight", flush: "Flush", fullhouse: "Full house", fourcard: "Four of a kind", straightflush: "Straight flush" },
} as const;

function TileFace({ tile, small }: { tile: Tile; small?: boolean }) {
  const s = TILE_COLOR[tile.color];
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: small ? 34 : 44, height: small ? 48 : 60, borderRadius: 6, background: s.bg, color: s.fg,
        fontFamily: "Space Mono, monospace", fontWeight: 700, fontSize: small ? 15 : 19,
        border: "1px solid rgba(0,0,0,.15)", flexShrink: 0,
      }}
    >
      {tile.number}
    </span>
  );
}

export function LexioRoomClient({ code }: { code: string }) {
  const { lang, user, profile, loading, t } = useApp();
  const L = TX[lang];
  const router = useRouter();
  const [room, setRoom] = useState<LexioRoom | null>(null);
  const [members, setMembers] = useState<LexioMember[]>([]);
  const [fatal, setFatal] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rounds, setRounds] = useState(5);
  const [copied, setCopied] = useState(false);

  const loaded = useRef(false);
  const refresh = useCallback(async (id: string) => {
    try {
      const [r, m] = await Promise.all([lxFetchRoom(id), lxFetchMembers(id)]);
      if (r) {
        loaded.current = true;
        setRoom(r);
      } else if (loaded.current) setFatal("__deleted__"); // 방장이 방을 삭제함
      setMembers(m);
    } catch {}
  }, []);

  useEffect(() => {
    if (!user || !cloudEnabled) return;
    let cancelled = false;
    lxJoinRoom(code, profile?.nickname ?? null)
      .then((r) => {
        if (cancelled) return;
        setRoom(r);
        refresh(r.id);
      })
      .catch((e) => !cancelled && setFatal(lxErrorText(e, lang)));
    return () => {
      cancelled = true;
    };
    // 닉네임/언어가 바뀌어도 다시 참가하지 않도록 code·user 기준으로만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, code, refresh]);

  const roomId = room?.id;
  useEffect(() => {
    const c = sb();
    if (!c || !roomId) return;
    const ch = c
      .channel(`lexio-room:${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` }, () => refresh(roomId))
      .on("postgres_changes", { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${roomId}` }, () => refresh(roomId))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "room_members" }, (p) => {
        if ((p.old as { room_id?: string })?.room_id === roomId) refresh(roomId);
      })
      .subscribe();
    return () => {
      c.removeChannel(ch);
    };
  }, [roomId, refresh]);

  const me = members.find((m) => m.user_id === user?.id) ?? null;
  const isHost = !!room && !!user && room.host_user_id === user.id;

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setErr(null);
    try {
      await fn();
      if (room) await refresh(room.id);
    } catch (e) {
      setErr(lxErrorText(e, lang));
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    if (room) await lxLeave(room.id).catch(() => {});
    router.push("/online/lexio");
  }

  async function removeRoom() {
    if (!room || !window.confirm(t("deleteConfirm"))) return;
    try {
      await lxDeleteRoom(room.id);
      router.push("/online/lexio");
    } catch (e) {
      setErr(lxErrorText(e, lang));
    }
  }

  if (!cloudEnabled) return <div className="wrap narrow"><div className="notice">{t("serverMissing")}</div></div>;
  if (loading) return <div className="wrap narrow muted">{L.loading}</div>;
  if (!user) {
    return (
      <div className="wrap narrow" style={{ textAlign: "center" }}>
        <p>{t("loginNeeded")}</p>
        <Link className="btn primary" href={`/login?next=${encodeURIComponent(`/online/lexio/${code}`)}`}>{t("navLogin")}</Link>
      </div>
    );
  }
  if (fatal) {
    return (
      <div className="wrap narrow">
        <div className="notice err" style={{ marginBottom: 14 }}>{fatal === "__deleted__" ? t("roomDeleted") : fatal}</div>
        <Link className="btn" href="/online/lexio">{L.back}</Link>
      </div>
    );
  }
  if (!room || !me) return <div className="wrap narrow muted">{L.loading}</div>;

  if (room.status !== "waiting") {
    return <LexioGame roomId={room.id} mySeat={me.seat} members={members} onLeave={leave} onDelete={isHost ? removeRoom : undefined} />;
  }

  const seats = Array.from({ length: room.max_players }, (_, i) => members.find((m) => m.seat === i) ?? null);
  const full = seats.every(Boolean);
  const allReady = full && seats.every((m) => m!.is_ready);

  return (
    <div className="wrap mid">
      <Link href="/online/lexio" className="linkbtn small">← {L.title}</Link>
      <div className="panel" style={{ margin: "14px 0 18px", textAlign: "center" }}>
        <div className="muted small">{L.share}</div>
        <div className="code-big">{room.code}</div>
        <div className="row" style={{ justifyContent: "center", marginTop: 10 }}>
          <button
            className="btn sm"
            onClick={() =>
              navigator.clipboard?.writeText(`${window.location.origin}/online/lexio/${room.code}`).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              })
            }
          >
            🔗 {copied ? L.copied : L.copy}
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="row spread" style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, margin: 0 }}>{L.title}</h2>
          <span className="muted small">{members.length}/{room.max_players}</span>
        </div>
        <div className="seat-list">
          {seats.map((m, i) => (
            <div key={i} className="seat">
              <div className="who">
                {m ? (
                  <>
                    <b>{m.is_ai ? `🤖 ${L.ai}` : m.nickname}{m.user_id === user.id ? ` (${t("you")})` : ""}</b>
                    <span>{t("seat")} {i + 1}</span>
                  </>
                ) : (
                  <>
                    <b className="muted">{L.empty}</b>
                    <span>{t("seat")} {i + 1}</span>
                  </>
                )}
              </div>
              {m && m.user_id === room.host_user_id && <span className="pill host">{L.host}</span>}
              {m && <span className={`pill ${m.is_ready ? "ok" : "wait"}`}>{m.is_ready ? L.ready : L.notReady}</span>}
              {!m && isHost && (
                <button className="btn sm" disabled={busy} onClick={() => run(() => lxFillAI(room.id, i))}>{L.fillAI}</button>
              )}
            </div>
          ))}
        </div>

        {err && <div className="notice err" style={{ marginTop: 14 }}>{err}</div>}

        <div className="row wrap-row" style={{ marginTop: 18, gap: 10 }}>
          <button className="btn ghost" onClick={leave}>{L.leave}</button>
          {isHost && <button className="btn ghost" onClick={removeRoom}>🗑 {t("deleteRoom")}</button>}
          <span style={{ flex: 1 }} />
          <button className={`btn ${me.is_ready ? "" : "primary"}`} disabled={busy} onClick={() => run(() => lxSetReady(room.id, !me.is_ready))}>
            {me.is_ready ? L.unready : L.readyBtn}
          </button>
        </div>

        {isHost ? (
          <div className="row wrap-row" style={{ marginTop: 14, justifyContent: "flex-end", gap: 10 }}>
            {!allReady && <span className="muted small">{L.needAll}</span>}
            <span className="muted small">{L.rounds}</span>
            <button className="btn sm" disabled={rounds <= 1} onClick={() => setRounds((r) => Math.max(1, r - 1))}>−</button>
            <b style={{ fontFamily: "Space Mono, monospace", minWidth: 22, textAlign: "center" }}>{rounds}</b>
            <button className="btn sm" disabled={rounds >= 20} onClick={() => setRounds((r) => Math.min(20, r + 1))}>+</button>
            <button className="btn teal" disabled={busy || !allReady} onClick={() => run(() => lxStart(room.id, rounds))}>{L.start}</button>
          </div>
        ) : (
          allReady && <p className="small" style={{ color: "var(--gold)", textAlign: "right" }}>{L.waitHost}</p>
        )}
      </div>
    </div>
  );
}

function LexioGame({ roomId, mySeat, members, onLeave, onDelete }: { roomId: string; mySeat: number; members: LexioMember[]; onLeave: () => void; onDelete?: () => void }) {
  const { lang, t } = useApp();
  const L = TX[lang];
  const [gp, setGp] = useState<GamePublic | null>(null);
  const [hand, setHand] = useState<Tile[]>([]);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showRanks, setShowRanks] = useState(false);
  // 내가 낸 패를 잠깐 붙잡아 두기 — 바로 이어지는 AI 차례가 필드를 덮어써 사라져 보이는 것 방지
  const [localPlay, setLocalPlay] = useState<{ seat: number; tiles: Tile[] } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nick = useCallback((seat: number) => {
    const m = members.find((x) => x.seat === seat);
    return m ? (m.is_ai ? `AI ${seat + 1}` : m.nickname) : `#${seat + 1}`;
  }, [members]);

  const refresh = useCallback(async () => {
    try {
      const [g, h] = await Promise.all([lxFetchGame(roomId), lxMyHand(roomId)]);
      setGp(g);
      setHand(h);
      setSel(new Set());
    } catch (e) {
      setErr(lxErrorText(e, lang));
    }
  }, [roomId, lang]);

  useEffect(() => {
    refresh();
    const c = sb();
    if (!c) return;
    const ch = c
      .channel(`lexio-game:${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "game_public", filter: `room_id=eq.${roomId}` }, () => refresh())
      .subscribe();
    return () => {
      c.removeChannel(ch);
    };
  }, [roomId, refresh]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const sorted = useMemo(() => [...hand].sort((a, b) => a.number - b.number || a.color.localeCompare(b.color)), [hand]);
  const myTurn = gp?.status === "playing" && gp.current_seat === mySeat;

  async function act(fn: () => Promise<unknown>, onOk?: () => void) {
    setBusy(true);
    setErr(null);
    try {
      await fn();
      onOk?.();
    } catch (e) {
      setErr(lxErrorText(e, lang));
    } finally {
      setBusy(false);
    }
  }

  if (!gp) return <div className="wrap narrow muted">{L.loading}</div>;

  const shown = localPlay ?? gp.last_play;
  const combo = localPlay ? null : gp.last_play?.combo ?? null;
  const status = gp.status === "playing" ? (myTurn ? L.myTurn : L.turnOf(nick(gp.current_seat))) : gp.status === "round_over" ? L.roundOver : L.gameOver;

  return (
    <div className="wrap mid">
      <div className="panel">
        <div className="row spread wrap-row" style={{ marginBottom: 6 }}>
          <h1 style={{ margin: 0, fontSize: 19 }}>LEXIO · {L.round} {gp.round}/{gp.total_rounds}</h1>
          <div className="row">
            <button className="btn sm" onClick={() => setShowRanks((v) => !v)}>{L.ranks}</button>
            <span className="small" style={{ color: myTurn ? "var(--gold)" : "var(--text-dim)", fontWeight: 700 }}>{status}</span>
          </div>
        </div>

        {showRanks && (
          <div className="panel" style={{ padding: 12, margin: "10px 0", background: "#121a2a" }}>
            <div className="row" style={{ gap: 28, fontSize: 13, alignItems: "flex-start" }}>
              <ol style={{ margin: 0, paddingLeft: 18 }}>
                <li>{SUBTYPE[lang].single}</li><li>{SUBTYPE[lang].pair}</li><li>{SUBTYPE[lang].triple}</li>
              </ol>
              <div>
                <div className="muted small">{lang === "ko" ? "5장 · 낮은 순" : "5 tiles · low to high"}</div>
                <ol style={{ margin: 0, paddingLeft: 18 }}>
                  {(["straight", "flush", "fullhouse", "fourcard", "straightflush"] as const).map((k) => <li key={k}>{SUBTYPE[lang][k]}</li>)}
                </ol>
              </div>
            </div>
          </div>
        )}

        <div className="row wrap-row" style={{ margin: "12px 0", gap: 8 }}>
          {Object.entries(gp.hand_counts).map(([seat, count]) => {
            const cur = Number(seat) === gp.current_seat;
            return (
              <span key={seat} className="small" style={{ padding: "4px 10px", borderRadius: 999, border: `1px solid ${cur ? "var(--gold)" : "var(--line)"}`, color: cur ? "var(--gold)" : "var(--text-dim)" }}>
                {nick(Number(seat))}{Number(seat) === mySeat ? " ★" : ""} · {count}{lang === "ko" ? "장" : ""} · {gp.total_scores[seat] ?? 0}{L.pts}
              </span>
            );
          })}
        </div>

        <div style={{ minHeight: 96, border: "1px dashed var(--line)", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: 12, marginBottom: 16, background: "rgba(0,0,0,.18)" }}>
          {shown ? (
            <>
              <div className="row" style={{ gap: 4 }}>{shown.tiles.map((tl) => <TileFace key={tl.id} tile={tl} />)}</div>
              <div className="muted small">
                {nick(shown.seat)}
                {combo?.subType ? ` · ${SUBTYPE[lang][combo.subType]}` : ""}
              </div>
            </>
          ) : (
            <div className="muted small">{gp.status === "playing" ? L.emptyField : "—"}</div>
          )}
        </div>

        {gp.status === "playing" && (
          <>
            <div className="row wrap-row" style={{ gap: 6, justifyContent: "center", minHeight: 66, marginBottom: 12 }}>
              {sorted.map((tl) => (
                <div
                  key={tl.id}
                  onClick={() => setSel((prev) => { const n = new Set(prev); if (n.has(tl.id)) n.delete(tl.id); else n.add(tl.id); return n; })}
                  style={{ cursor: "pointer", transform: sel.has(tl.id) ? "translateY(-8px)" : undefined, boxShadow: sel.has(tl.id) ? "0 0 0 2px var(--gold)" : undefined, borderRadius: 6, transition: "transform .12s" }}
                >
                  <TileFace tile={tl} />
                </div>
              ))}
            </div>
            <div className="row" style={{ justifyContent: "center", gap: 10 }}>
              <button
                className="btn primary"
                disabled={!myTurn || busy || sel.size === 0}
                onClick={() => {
                  const played = sorted.filter((x) => sel.has(x.id));
                  act(() => lxSubmit(roomId, [...sel]), () => {
                    if (timer.current) clearTimeout(timer.current);
                    setLocalPlay({ seat: mySeat, tiles: played });
                    timer.current = setTimeout(() => setLocalPlay(null), 1000);
                  });
                }}
              >
                {L.play} ({sel.size})
              </button>
              <button className="btn" disabled={!myTurn || busy || gp.required_size === null} onClick={() => act(() => lxPass(roomId))}>{L.pass}</button>
            </div>
          </>
        )}

        {gp.status === "round_over" && gp.round_results && (
          <div style={{ marginTop: 8 }}>
            <h3 style={{ fontSize: 15, color: "var(--gold)", textAlign: "center" }}>{L.finisher(nick(gp.round_results.finisherSeat))}</h3>
            <ol className="lb">
              {gp.round_results.ranking.map((r, i) => {
                const sc = gp.round_results!.scores[r.seat] ?? 0;
                return (
                  <li key={r.seat}>
                    <span className="pos">{i + 1}</span>
                    <span className="nm">{nick(r.seat)} <span className="muted small">({L.left(r.remaining)})</span></span>
                    <span className="sc" style={{ color: sc >= 0 ? "var(--green)" : "var(--red)" }}>{sc >= 0 ? "+" : ""}{sc}</span>
                  </li>
                );
              })}
            </ol>
            <button className="btn primary block" style={{ marginTop: 14 }} disabled={busy} onClick={() => act(() => lxNextRound(roomId))}>{L.next}</button>
          </div>
        )}

        {gp.status === "finished" && (
          <div style={{ marginTop: 8 }}>
            <h3 style={{ fontSize: 15, color: "var(--gold)", textAlign: "center" }}>🏆 {L.final}</h3>
            <ol className="lb">
              {Object.entries(gp.total_scores).sort((a, b) => b[1] - a[1]).map(([seat, sc], i) => (
                <li key={seat}>
                  <span className="pos">{i + 1}</span>
                  <span className="nm">{nick(Number(seat))}</span>
                  <span className="sc" style={{ color: sc >= 0 ? "var(--green)" : "var(--red)" }}>{sc >= 0 ? "+" : ""}{sc}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {err && <div className="notice err" style={{ marginTop: 14 }}>{err}</div>}

        <div className="row" style={{ justifyContent: "flex-end", marginTop: 16 }}>
          <button className="btn sm ghost" onClick={onLeave}>{gp.status === "finished" ? L.back : L.leave}</button>
          {onDelete && <button className="btn sm ghost" onClick={onDelete}>🗑 {t("deleteRoom")}</button>}
        </div>
      </div>
    </div>
  );
}
