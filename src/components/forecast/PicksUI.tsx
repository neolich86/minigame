"use client";
// 스포츠 승부 예측 — 내 승부 예측(픽) 선택·공유 UI
import { logShare } from "@/lib/shareEvent";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useApp } from "@/components/AppProvider";
import type { Lang } from "@/lib/i18n";
import { MAX_PICKS, cleanName, comboStats, fmtProb, picksUrl, type Pick } from "@/lib/forecast/picks";

/* ───────────── 저장 (이 브라우저에만) ───────────── */

const KEY = "sf:picks";
const NAME_KEY = "sf:pickName";
const KEEP_MS = 3 * 86400_000; // 킥오프 후 3일 지난 픽은 정리
/** p = 고른 결과, t = 킥오프 시각, q = 고를 때 모델이 본 그 결과의 확률 */
type Stored = Record<string, { p: Pick; t: number; q?: number }>;

let cache: Stored | null = null;
const subs = new Set<() => void>();

function read(): Stored {
  if (cache) return cache;
  let v: Stored = {};
  try {
    v = JSON.parse(localStorage.getItem(KEY) || "{}") as Stored;
  } catch {}
  const cut = Date.now() - KEEP_MS;
  for (const [k, x] of Object.entries(v)) if (!x || typeof x.t !== "number" || x.t < cut) delete v[k];
  cache = v;
  return v;
}
function write(v: Stored) {
  cache = v;
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {}
  subs.forEach((f) => f());
}
const EMPTY: Stored = {};
function subscribe(f: () => void) {
  subs.add(f);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      f();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    subs.delete(f);
    window.removeEventListener("storage", onStorage);
  };
}

export function useMyPicks() {
  const stored = useSyncExternalStore(subscribe, read, () => EMPTY);
  const setPick = useCallback((id: number, p: Pick | null, kickoff: number, q?: number) => {
    const v = { ...read() };
    if (!p || v[id]?.p === p) delete v[id];
    else {
      if (!v[id] && Object.keys(v).length >= MAX_PICKS) return false;
      v[id] = { p, t: kickoff, ...(q ? { q } : {}) };
    }
    write(v);
    return true;
  }, []);
  const clear = useCallback(() => write({}), []);
  const picks = useMemo(() => {
    const o: Record<number, Pick> = {};
    for (const [k, x] of Object.entries(stored)) o[Number(k)] = x.p;
    return o;
  }, [stored]);
  const probs = useMemo(() => Object.values(stored).map((x) => x.q ?? NaN), [stored]);
  return { picks, probs, count: Object.keys(picks).length, setPick, clear };
}

/* ───────────── 문구 ───────────── */

const T = {
  ko: {
    myPick: "내 예측",
    H: "홈승",
    D: "무",
    A: "원정승",
    full: `최대 ${MAX_PICKS}경기까지 고를 수 있어요`,
    bar: "{n}경기 예측 완료",
    view: "내 예측 카드 · 공유",
    reset: "초기화",
    allHit: "다 맞힐 확률 {p} (약 {n}번에 1번)",
    expected: "예상 적중 {e}경기",
  },
  en: {
    myPick: "My pick",
    H: "Home",
    D: "Draw",
    A: "Away",
    full: `You can pick up to ${MAX_PICKS} matches`,
    bar: "{n} picks made",
    view: "My pick card · Share",
    reset: "Reset",
    allHit: "All correct: {p} (about 1 in {n})",
    expected: "Expected hits: {e}",
  },
};

export function pickLabel(p: Pick, lang: Lang) {
  return T[lang][p];
}

/* ───────────── 경기 카드 안 선택 버튼 ───────────── */

export function PickRow({
  matchId,
  kickoff,
  open,
  probs,
}: {
  matchId: number;
  kickoff: number;
  open: boolean;
  /** 모델 확률 [홈승, 무, 원정승] — 버튼에 함께 표시 */
  probs?: [number, number, number] | null;
}) {
  const { lang } = useApp();
  const t = T[lang];
  const { picks, setPick } = useMyPicks();
  const [warn, setWarn] = useState(false);
  const mine = picks[matchId];
  if (!open && !mine) return null;
  return (
    <div className="fc-pick" onClick={(e) => e.stopPropagation()}>
      <span className="lbl">{t.myPick}</span>
      {(["H", "D", "A"] as Pick[]).map((p) => (
        <button
          key={p}
          type="button"
          disabled={!open}
          className={`${p.toLowerCase()}${mine === p ? " on" : ""}`}
          aria-pressed={mine === p}
          onClick={(e) => {
            e.preventDefault();
            if (Date.now() >= kickoff) return; // 킥오프 지난 경기는 못 고침
            const ok = setPick(matchId, p, kickoff, probs ? probs["HDA".indexOf(p)] : undefined);
            setWarn(!ok);
          }}
        >
          {t[p]}
          {probs && <small>{fmtProb(probs["HDA".indexOf(p)])}</small>}
        </button>
      ))}
      {warn && <em className="warn">{t.full}</em>}
    </div>
  );
}

/* ───────────── 화면 아래 고정 바 ───────────── */

export function PickBar() {
  const { lang } = useApp();
  const t = T[lang];
  const { picks, probs, count, clear } = useMyPicks();
  const combo = comboStats(probs);
  const [name, setName] = useState("");
  useEffect(() => {
    try {
      setName(localStorage.getItem(NAME_KEY) ?? "");
    } catch {}
  }, []);
  if (!count) return null;
  return (
    <div className="fc-pickbar" role="region" aria-label={t.view}>
      <span className="n">
        {t.bar.replace("{n}", String(count))}
        {combo.n === count && combo.n > 0 && (
          <em>
            {t.allHit.replace("{p}", fmtProb(combo.all)).replace("{n}", combo.oneIn.toLocaleString())} · {t.expected.replace("{e}", combo.expected.toFixed(1))}
          </em>
        )}
      </span>
      <button type="button" className="btn sm ghost" onClick={clear}>
        {t.reset}
      </button>
      <Link href={picksUrl(picks, cleanName(name))} className="btn sm primary">
        {t.view} →
      </Link>
    </div>
  );
}

/* ───────────── 공유 버튼 (예측 카드 페이지) ───────────── */

declare global {
  interface Window {
    Kakao?: {
      isInitialized(): boolean;
      init(key: string): void;
      Share: { sendDefault(o: unknown): void };
    };
  }
}

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
const KAKAO_SDK = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";

function loadKakao(): Promise<boolean> {
  if (!KAKAO_KEY) return Promise.resolve(false);
  if (window.Kakao) {
    if (!window.Kakao.isInitialized()) window.Kakao.init(KAKAO_KEY);
    return Promise.resolve(true);
  }
  return new Promise((res) => {
    const s = document.createElement("script");
    s.src = KAKAO_SDK;
    s.async = true;
    s.crossOrigin = "anonymous";
    s.onload = () => {
      try {
        window.Kakao?.init(KAKAO_KEY);
        res(!!window.Kakao);
      } catch {
        res(false);
      }
    };
    s.onerror = () => res(false);
    document.head.appendChild(s);
  });
}

const S = {
  ko: {
    name: "공유할 이름 (선택)",
    namePh: "예: 제임스",
    kakao: "카카오톡 공유",
    share: "공유하기",
    copy: "링크 복사",
    copied: "링크를 복사했어요",
    edit: "예측 고치기",
    mine: "내가 만든 예측 카드예요. 친구에게 보내 보세요!",
    kakaoTitle: "{who}의 승부 예측 {n}경기",
    kakaoDesc: "누가 더 많이 맞힐까? 나도 예측하고 겨뤄 보세요.",
    btnView: "예측 보기",
    btnMake: "나도 예측하기",
  },
  en: {
    name: "Name to show (optional)",
    namePh: "e.g. James",
    kakao: "Share to KakaoTalk",
    share: "Share",
    copy: "Copy link",
    copied: "Link copied",
    edit: "Edit picks",
    mine: "This is your pick card. Send it to your friends!",
    kakaoTitle: "{who}'s picks for {n} matches",
    kakaoDesc: "Who'll get more right? Make your own picks and compare.",
    btnView: "See picks",
    btnMake: "Make my picks",
  },
};

export function ShareBox({
  picks,
  name,
  setName,
  ogPath,
  siteUrl,
  editHref,
}: {
  picks: Record<number, Pick>;
  name: string;
  setName: (s: string) => void;
  ogPath: string;
  siteUrl: string;
  editHref: string;
}) {
  const { lang } = useApp();
  const t = S[lang];
  const { picks: myPicks } = useMyPicks();
  const [msg, setMsg] = useState("");
  const [kakaoReady, setKakaoReady] = useState(false);
  const [canNative, setCanNative] = useState(false);

  // 이 브라우저에 저장된 픽과 같으면 "내 카드" (이름 입력·고치기 노출)
  const mine = useMemo(() => {
    const a = Object.entries(picks), b = myPicks;
    return a.length > 0 && a.every(([id, p]) => b[Number(id)] === p);
  }, [picks, myPicks]);

  useEffect(() => {
    loadKakao().then(setKakaoReady);
    setCanNative(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const n = Object.keys(picks).length;
  const who = cleanName(name) || (lang === "ko" ? "친구" : "A friend");
  // 공유 링크는 지금 열려 있는 주소의 도메인으로 만든다 (카카오에 등록한 도메인과 어긋나지 않게)
  const origin = () => (typeof window !== "undefined" ? window.location.origin : siteUrl);
  const shareUrl = () => `${origin()}${picksUrl(picks, name)}`;
  const title = t.kakaoTitle.replace("{who}", who).replace("{n}", String(n));

  // 이름을 바꾸면 주소창도 맞춘다 (새로고침해도 유지)
  useEffect(() => {
    if (!mine) return;
    try {
      localStorage.setItem(NAME_KEY, cleanName(name));
    } catch {}
    const next = picksUrl(picks, name);
    if (window.location.pathname + window.location.search !== next) window.history.replaceState(null, "", next);
  }, [name, mine, picks]);

  const flash = (s: string) => {
    setMsg(s);
    setTimeout(() => setMsg(""), 2200);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      logShare("sports-forecast", "copy");
      flash(t.copied);
    } catch {
      window.prompt(t.copy, shareUrl());
    }
  };
  const kakao = () => {
    const url = shareUrl();
    const img = `${origin()}${ogPath}${ogPath.includes("?") ? "&" : "?"}n=${encodeURIComponent(cleanName(name))}`;
    window.Kakao?.Share.sendDefault({
      objectType: "feed",
      content: { title, description: t.kakaoDesc, imageUrl: img, imageWidth: 1200, imageHeight: 630, link: { mobileWebUrl: url, webUrl: url } },
      buttons: [
        { title: t.btnView, link: { mobileWebUrl: url, webUrl: url } },
        { title: t.btnMake, link: { mobileWebUrl: `${origin()}/apps/sports-forecast`, webUrl: `${origin()}/apps/sports-forecast` } },
      ],
    });
    logShare("sports-forecast", "kakao");
  };
  const native = async () => {
    try {
      await navigator.share({ title, text: t.kakaoDesc, url: shareUrl() });
      logShare("sports-forecast", "native");
    } catch {}
  };

  return (
    <div className="panel fc-share">
      {mine && (
        <>
          <p className="small">{t.mine}</p>
          <label className="field">
            <span>{t.name}</span>
            <input className="input" value={name} maxLength={12} placeholder={t.namePh} onChange={(e) => setName(e.target.value)} />
          </label>
        </>
      )}
      <div className="row wrap-row">
        {kakaoReady && (
          <button type="button" className="btn kakao" onClick={kakao}>
            💬 {t.kakao}
          </button>
        )}
        {canNative && (
          <button type="button" className={`btn ${kakaoReady ? "" : "kakao"}`} onClick={native}>
            {kakaoReady ? "📤" : "💬"} {t.share}
          </button>
        )}
        <button type="button" className="btn" onClick={copy}>
          🔗 {t.copy}
        </button>
        {mine && (
          <Link href={editHref} className="btn ghost">
            ✏️ {t.edit}
          </Link>
        )}
      </div>
      {msg && <p className="notice ok small">{msg}</p>}
    </div>
  );
}
