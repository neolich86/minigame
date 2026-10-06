"use client";
// 스포츠 승부 예측 — 화면 컴포넌트 (언어 전환이 바로 반영되도록 클라이언트에서 그린다)
import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import type { Lang } from "@/lib/i18n";
import { BACKTEST_V1 } from "@/lib/forecast/backtest-v1";
import { COMP_NAME, type LeagueSim, type MatchRow, type RatingPoint, type StandingGroup } from "@/lib/forecast/shared";
import { badgeColors, teamName, teamTla, type TeamInfo } from "@/lib/forecast/teams";

export const BASE = "/apps/sports-forecast";

/* ───────────── 문구 ───────────── */

const T = {
  ko: {
    title: "스포츠 승부 예측",
    sub: "유럽 주요 리그와 챔피언스리그 경기의 승·무·패 확률과 예상 스코어를 통계 모델로 계산합니다.",
    navMatches: "경기",
    navLeagues: "대회",
    navAccuracy: "모델 성적",
    today: "오늘",
    tomorrow: "내일",
    weekend: "이번 주말",
    week: "7일",
    past: "지난 경기",
    all: "전체",
    home: "홈승",
    draw: "무",
    away: "원정승",
    likely: "유력 스코어",
    noMatches: "이 기간에 예정된 경기가 없어요.",
    noPred: "예측 준비 중",
    hit: "적중",
    miss: "빗나감",
    live: "진행 중",
    postponed: "연기",
    vs: "vs",
    expGoals: "예상 득점",
    topScores: "가능성 높은 스코어",
    why: "예측 근거",
    attack: "공격력",
    defense: "수비력",
    rating: "팀 레이팅",
    form: "최근 5경기",
    h2h: "최근 맞대결",
    position: "리그 순위",
    trend: "레이팅 추이 (최근 1년)",
    noData: "기록이 없어요",
    result: "실제 결과",
    predicted: "예측",
    lockedNote: "킥오프 시점에 예측을 잠가 경기 후에는 바꿀 수 없어요.",
    beforeLock: "킥오프 전까지 새 결과가 반영되면 확률이 바뀔 수 있어요.",
    cupNote: "리그가 다른 팀끼리의 경기는 전 대회 공통 레이팅만으로 계산해요.",
    disclaimer: "통계 모델로 계산한 참고용 예측입니다. 베팅을 권유하지 않습니다.",
    source: "Football data provided by the Football-Data.org API",
    accBannerLive: "최근 30일 적중률",
    accBannerBt: "과거 시즌 검증 적중률",
    accBannerSub: "단순 비율로 찍을 때",
    standings: "순위표",
    upcoming: "다가오는 경기",
    played: "경기",
    w: "승",
    d: "무",
    l: "패",
    gd: "득실",
    pts: "승점",
    elo: "레이팅",
    leagueList: "대회 선택",
    matchday: "라운드",
    accTitle: "모델 성적",
    accSub: "예측은 킥오프 순간 잠기고, 경기가 끝나면 90분 결과로 자동 채점합니다.",
    liveTitle: "운영 성적",
    liveEmpty: "아직 채점된 예측이 없어요. 경기가 끝나는 대로 쌓입니다.",
    btTitle: "과거 시즌 검증 (모델 v1.0)",
    btBody: "2023/24 시즌으로 레이팅을 만들고 2024/25 시즌으로 설정을 고른 뒤, 설정에 쓰지 않은 2025/26 시즌 경기로 채점한 결과예요.",
    accuracy: "적중률",
    baseline: "기준선",
    baselineNote: "기준선 = 대회별로 지금까지 나온 홈승·무·원정승 비율로 찍는 방법",
    games: "경기",
    calib: "확률은 믿을 만한가",
    calibSub: "예측 확률 구간별로 실제로 일어난 비율. 막대 끝의 점이 실제 비율이에요.",
    byComp: "대회별 적중률",
    brier: "브라이어 점수",
    logloss: "로그 손실",
    lowerBetter: "낮을수록 좋음",
    kst: "",
    recent30: "최근 30일",
    simTitle: "시즌 최종 순위 예측",
    simSub: "남은 {n}경기를 모델 확률대로 {s}번 시뮬레이션한 결과예요.",
    expPts: "예상 승점",
    nowPts: "현재",
    title_: "우승",
    ucl: "상위 {n}",
    promo: "자동 승격 (상위 {n})",
    uclNote: "상위 {n} = 챔피언스리그 진출권 (대회 규정·국가 배정에 따라 실제 출전권 수는 다를 수 있어요)",
    relegation: "강등권 (하위 {n})",
    simEnded: "남은 경기가 없어 시즌 순위가 확정됐어요.",
    smallSample: "아직 채점된 경기가 적어 숫자가 크게 흔들릴 수 있어요. 수백 경기가 쌓이면 과거 시즌 검증 수준으로 수렴합니다.",
    total: "전체",
  },
  en: {
    title: "Sports Forecast",
    sub: "Win, draw and loss probabilities and likely scores for Europe's top leagues and the Champions League, computed by a statistical model.",
    navMatches: "Matches",
    navLeagues: "Leagues",
    navAccuracy: "Track record",
    today: "Today",
    tomorrow: "Tomorrow",
    weekend: "Weekend",
    week: "7 days",
    past: "Results",
    all: "All",
    home: "Home",
    draw: "Draw",
    away: "Away",
    likely: "Likely score",
    noMatches: "No matches in this period.",
    noPred: "Forecast pending",
    hit: "Correct",
    miss: "Missed",
    live: "Live",
    postponed: "Postponed",
    vs: "vs",
    expGoals: "Expected goals",
    topScores: "Most likely scores",
    why: "Why this forecast",
    attack: "Attack",
    defense: "Defence",
    rating: "Team rating",
    form: "Last 5",
    h2h: "Head to head",
    position: "League position",
    trend: "Rating trend (last 12 months)",
    noData: "No data",
    result: "Final result",
    predicted: "Forecast",
    lockedNote: "Forecasts lock at kick-off and can't be changed afterwards.",
    beforeLock: "Probabilities may update before kick-off as new results come in.",
    cupNote: "Matches between clubs from different leagues use the cross-competition rating only.",
    disclaimer: "Statistical forecasts for reference only. We do not encourage betting.",
    source: "Football data provided by the Football-Data.org API",
    accBannerLive: "Last 30 days accuracy",
    accBannerBt: "Back-tested accuracy",
    accBannerSub: "naive baseline",
    standings: "Standings",
    upcoming: "Upcoming",
    played: "P",
    w: "W",
    d: "D",
    l: "L",
    gd: "GD",
    pts: "Pts",
    elo: "Rating",
    leagueList: "Choose a league",
    matchday: "Matchday",
    accTitle: "Track record",
    accSub: "Every forecast locks at kick-off and is graded on the 90-minute result.",
    liveTitle: "Live record",
    liveEmpty: "No graded forecasts yet. They'll appear as matches finish.",
    btTitle: "Back-test (model v1.0)",
    btBody: "Ratings built on 2023/24, settings chosen on 2024/25, then scored on 2025/26 matches that were never used for tuning.",
    accuracy: "Accuracy",
    baseline: "Baseline",
    baselineNote: "Baseline = guessing from each competition's historical home/draw/away rates",
    games: "matches",
    calib: "Can you trust the percentages?",
    calibSub: "How often outcomes actually happened in each forecast band. The dot marks the real rate.",
    byComp: "Accuracy by competition",
    brier: "Brier score",
    logloss: "Log loss",
    lowerBetter: "lower is better",
    kst: " KST",
    recent30: "Last 30 days",
    simTitle: "Season projection",
    simSub: "The remaining {n} matches simulated {s} times with the model's probabilities.",
    expPts: "Proj. pts",
    nowPts: "Now",
    title_: "Title",
    ucl: "Top {n}",
    promo: "Auto promotion (top {n})",
    uclNote: "Top {n} = Champions League places (actual places can differ by competition rules and coefficients)",
    relegation: "Relegation (bottom {n})",
    simEnded: "No matches left — the final table is settled.",
    smallSample: "Only a few matches graded so far, so these numbers will swing. They settle as hundreds of matches accumulate.",
    total: "All time",
  },
};
type Dict = (typeof T)["ko"];
export function useT(): { t: Dict; lang: Lang } {
  const { lang } = useApp();
  return { t: T[lang], lang };
}

/* ───────────── 공통 조각 ───────────── */

const pct = (x: number, d = 0) => `${(x * 100).toFixed(d)}%`;

// 서버(Node)와 브라우저의 toLocaleString 결과가 달라 하이드레이션이 깨지므로 직접 만든다
const WD = { ko: ["일", "월", "화", "수", "목", "금", "토"], en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] };
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function kstParts(iso: string, lang: Lang, withYear = false) {
  const d = new Date(Date.parse(iso) + 9 * 3600_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const time = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  const wd = WD[lang][d.getUTCDay()];
  const y = d.getUTCFullYear();
  const date = withYear
    ? lang === "ko" ? `${y}.${d.getUTCMonth() + 1}.${d.getUTCDate()}` : `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${y}`
    : lang === "ko" ? `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${wd})` : `${wd} ${d.getUTCDate()} ${MON[d.getUTCMonth()]}`;
  return { time, date };
}

/** 어두운 배경에서 보이는 색인지 (대략적인 밝기) */
function visible(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 90;
}

export function TeamBadge({ team, size = 34 }: { team: TeamInfo | null; size?: number }) {
  if (!team) return <span className="fc-badge" style={{ width: size, height: size, background: "var(--bg-panel-hi)" }}>?</span>;
  const c = badgeColors(team);
  return (
    <span
      className="fc-badge"
      aria-hidden
      style={{ width: size, height: size, background: c.bg, color: c.fg, boxShadow: `inset 0 0 0 ${size > 40 ? 4 : 3}px ${c.ring}`, fontSize: size * 0.3 }}
    >
      {teamTla(team)}
    </span>
  );
}

export function ProbBar({ m, big = false }: { m: MatchRow; big?: boolean }) {
  const { t } = useT();
  const p = m.pred;
  if (!p) return <div className="fc-bar empty">{t.noPred}</div>;
  const cells: [string, number, string, "H" | "D" | "A"][] = [
    ["h", p.p_home, t.home, "H"],
    ["d", p.p_draw, t.draw, "D"],
    ["a", p.p_away, t.away, "A"],
  ];
  const max = Math.max(p.p_home, p.p_draw, p.p_away);
  return (
    <div className={`fc-bar${big ? " big" : ""}`}>
      {cells.map(([k, v, label, r]) => (
        <div
          key={k}
          className={`seg ${k}${v === max ? " top" : ""}${p.result === r ? " actual" : ""}`}
          style={{ flexGrow: Math.max(v, 0.08) }}
          title={`${label} ${pct(v, 1)}`}
        >
          <b>{pct(v)}</b>
          {big && <span>{label}</span>}
        </div>
      ))}
    </div>
  );
}

function ScoreOrTime({ m }: { m: MatchRow }) {
  const { t, lang } = useT();
  const fin = m.status === "FINISHED" || m.status === "AWARDED";
  if (fin) return <div className="fc-score">{m.home_score} : {m.away_score}</div>;
  if (m.status === "IN_PLAY" || m.status === "PAUSED") return <div className="fc-score live">{t.live}</div>;
  if (m.status === "POSTPONED" || m.status === "CANCELLED") return <div className="fc-score dim">{t.postponed}</div>;
  const { time } = kstParts(m.utc_date, lang);
  return <div className="fc-time">{time}{t.kst}</div>;
}

export function MatchCard({ m }: { m: MatchRow }) {
  const { t, lang } = useT();
  const p = m.pred;
  const top = p?.top_scores?.[0];
  const fin = m.status === "FINISHED";
  return (
    <Link href={`${BASE}/match/${m.id}`} className="fc-card">
      <div className="fc-card-head">
        <span className="fc-comp">{COMP_NAME[m.competition]?.short[lang] ?? m.competition}</span>
        {fin && p?.hit !== null && p?.hit !== undefined && (
          <span className={`fc-hit ${p.hit ? "ok" : "no"}`}>{p.hit ? `✅ ${t.hit}` : `❌ ${t.miss}`}</span>
        )}
      </div>
      <div className="fc-teams">
        <div className="fc-team">
          <TeamBadge team={m.home} />
          <span>{m.home ? teamName(m.home, lang) : "TBD"}</span>
        </div>
        <ScoreOrTime m={m} />
        <div className="fc-team right">
          <span>{m.away ? teamName(m.away, lang) : "TBD"}</span>
          <TeamBadge team={m.away} />
        </div>
      </div>
      <ProbBar m={m} />
      {top && (
        <div className="fc-likely">
          {t.likely} <b>{top.h}-{top.a}</b> <span className="muted">({pct(top.p)})</span>
        </div>
      )}
    </Link>
  );
}

export function SubNav({ active }: { active: "matches" | "leagues" | "accuracy" }) {
  const { t } = useT();
  return (
    <nav className="fc-subnav">
      <Link href={BASE} className={active === "matches" ? "on" : ""}>{t.navMatches}</Link>
      <Link href={`${BASE}/league/PL`} className={active === "leagues" ? "on" : ""}>{t.navLeagues}</Link>
      <Link href={`${BASE}/accuracy`} className={active === "accuracy" ? "on" : ""}>{t.navAccuracy}</Link>
    </nav>
  );
}

export function Footer() {
  const { t } = useT();
  return (
    <footer className="fc-foot">
      <p>{t.disclaimer}</p>
      <p className="muted small">{t.source}</p>
    </footer>
  );
}

function Head({ active }: { active: "matches" | "leagues" | "accuracy" }) {
  const { t } = useT();
  return (
    <header className="fc-head">
      <div>
        <h1 className="page-title">⚽ {t.title}</h1>
        <p className="page-sub">{t.sub}</p>
      </div>
      <SubNav active={active} />
    </header>
  );
}

/* ───────────── 경기 목록 ───────────── */

export type RangeKey = "today" | "tomorrow" | "weekend" | "week" | "past";

export interface LiveAcc {
  n: number;
  acc: number;
}

export function FcHome({
  range,
  comp,
  comps,
  matches,
  live,
}: {
  range: RangeKey;
  comp: string | null;
  comps: string[];
  matches: MatchRow[];
  live: LiveAcc | null;
}) {
  const { t, lang } = useT();
  const q = (r: RangeKey, c: string | null) => `${BASE}?d=${r}${c ? `&c=${c}` : ""}`;
  const days = new Map<string, MatchRow[]>();
  for (const m of matches) {
    const k = kstParts(m.utc_date, lang).date;
    const arr = days.get(k) ?? [];
    arr.push(m);
    days.set(k, arr);
  }
  const useLive = live && live.n >= 30;
  return (
    <div className="wrap fc">
      <Head active="matches" />
      <Link href={`${BASE}/accuracy`} className="fc-banner">
        <span>{useLive ? t.accBannerLive : t.accBannerBt}</span>
        <b>{pct(useLive ? live!.acc : BACKTEST_V1.holdout.acc, 1)}</b>
        <span className="muted small">
          {useLive ? `${live!.n} ${t.games}` : `${BACKTEST_V1.holdout.n.toLocaleString()} ${t.games}`} · {t.accBannerSub} {pct(BACKTEST_V1.holdout.baseAcc, 1)}
        </span>
      </Link>
      <div className="fc-tabs">
        {(["today", "tomorrow", "weekend", "week", "past"] as RangeKey[]).map((r) => (
          <Link key={r} href={q(r, comp)} className={`filter-btn${r === range ? " active" : ""}`}>
            {t[r]}
          </Link>
        ))}
      </div>
      <div className="fc-chips">
        <Link href={q(range, null)} className={`fc-chip${!comp ? " on" : ""}`}>{t.all}</Link>
        {comps.map((c) => (
          <Link key={c} href={q(range, c)} className={`fc-chip${comp === c ? " on" : ""}`}>
            {COMP_NAME[c]?.short[lang] ?? c}
          </Link>
        ))}
      </div>
      {matches.length === 0 && <p className="panel muted">{t.noMatches}</p>}
      {[...days].map(([d, ms]) => (
        <section key={d} className="fc-day">
          <h2>{d}</h2>
          <div className="fc-grid">
            {ms.map((m) => (
              <MatchCard key={m.id} m={m} />
            ))}
          </div>
        </section>
      ))}
      <Footer />
    </div>
  );
}

/* ───────────── 경기 상세 ───────────── */

function FormDots({ team, ms }: { team: TeamInfo; ms: MatchRow[] }) {
  const { t, lang } = useT();
  if (!ms.length) return <span className="muted small">{t.noData}</span>;
  return (
    <div className="fc-form">
      {ms.map((m) => {
        const home = m.home?.id === team.id;
        const gf = (home ? m.home_score_90 : m.away_score_90) ?? 0;
        const ga = (home ? m.away_score_90 : m.home_score_90) ?? 0;
        const r = gf > ga ? "W" : gf === ga ? "D" : "L";
        const opp = home ? m.away : m.home;
        return (
          <Link key={m.id} href={`${BASE}/match/${m.id}`} className={`fc-dot ${r}`} title={`${opp ? teamName(opp, lang) : ""} ${gf}-${ga}`}>
            {lang === "ko" ? { W: "승", D: "무", L: "패" }[r] : r}
          </Link>
        );
      })}
    </div>
  );
}

function CompareRow({ label, a, b, fmt, higherBetter = true }: { label: string; a?: number | null; b?: number | null; fmt: (x: number) => string; higherBetter?: boolean }) {
  if (a == null || b == null) return null;
  const aWin = higherBetter ? a > b : a < b;
  // 낮을수록 좋은 값(수비 실점 배수, 순위)은 역수로 막대 길이를 정한다
  const wa = higherBetter ? Math.abs(a) : 1 / Math.max(Math.abs(a), 0.01);
  const wb = higherBetter ? Math.abs(b) : 1 / Math.max(Math.abs(b), 0.01);
  const tot = wa + wb || 1;
  return (
    <div className="fc-cmp">
      <span className={aWin ? "win" : ""}>{fmt(a)}</span>
      <div className="fc-cmp-bar">
        <i className="h" style={{ width: `${(wa / tot) * 100}%` }} />
        <i className="a" style={{ width: `${(wb / tot) * 100}%` }} />
      </div>
      <span className={!aWin ? "win" : ""}>{fmt(b)}</span>
      <em>{label}</em>
    </div>
  );
}

function Sparkline({ pts, color }: { pts: RatingPoint[]; color: string }) {
  const v = pts.map((p) => p.elo).filter((x): x is number => x != null);
  if (v.length < 2) return null;
  const min = Math.min(...v), max = Math.max(...v);
  const w = 260, h = 56;
  const path = v.map((y, i) => `${(i / (v.length - 1)) * w},${h - 4 - ((y - min) / (max - min || 1)) * (h - 8)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="fc-spark" preserveAspectRatio="none">
      <polyline points={path} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export interface DetailData {
  m: MatchRow;
  formH: MatchRow[];
  formA: MatchRow[];
  h2h: MatchRow[];
  trendH: RatingPoint[];
  trendA: RatingPoint[];
  posH: number | null;
  posA: number | null;
}

export function FcMatch({ d }: { d: DetailData }) {
  const { t, lang } = useT();
  const { m } = d;
  const p = m.pred;
  const f = p?.factors ?? {};
  const fin = m.status === "FINISHED";
  const { date, time } = kstParts(m.utc_date, lang);
  const cup = !["PL", "PD", "BL1", "SA", "FL1", "PPL", "DED", "ELC"].includes(m.competition);
  const lineColor = (team: TeamInfo | null, fb: string) => {
    if (!team) return fb;
    const c = badgeColors(team);
    for (const x of [c.bg, c.ring]) if (x.startsWith("#") && visible(x)) return x;
    return fb;
  };
  const hc = lineColor(m.home, "#4ddbc7");
  const ac = lineColor(m.away, "#b48cff");
  return (
    <div className="wrap fc mid">
      <SubNav active="matches" />
      <div className="fc-detail-head panel">
        <div className="fc-meta">
          <Link href={`${BASE}/league/${m.competition}`}>{COMP_NAME[m.competition]?.[lang] ?? m.competition}</Link>
          {m.matchday ? ` · ${t.matchday} ${m.matchday}` : ""} · {date} {time}{t.kst}
        </div>
        <div className="fc-teams big">
          <div className="fc-team col">
            <TeamBadge team={m.home} size={64} />
            <h1>{m.home ? teamName(m.home, lang) : "TBD"}</h1>
          </div>
          <ScoreOrTime m={m} />
          <div className="fc-team col">
            <TeamBadge team={m.away} size={64} />
            <h1>{m.away ? teamName(m.away, lang) : "TBD"}</h1>
          </div>
        </div>
        <ProbBar m={m} big />
        {p && p.exp_home != null && (
          <div className="fc-xg">
            {t.expGoals} <b>{p.exp_home.toFixed(2)}</b> : <b>{p.exp_away!.toFixed(2)}</b>
          </div>
        )}
        {fin && p?.hit != null && (
          <div className={`fc-verdict ${p.hit ? "ok" : "no"}`}>
            {p.hit ? `✅ ${t.hit}` : `❌ ${t.miss}`} · {t.result} {m.home_score_90}-{m.away_score_90}
            {m.duration && m.duration !== "REGULAR" ? ` (90')` : ""}
          </div>
        )}
        <p className="muted small">{p?.locked_at ? t.lockedNote : t.beforeLock}</p>
      </div>

      {p?.top_scores?.length ? (
        <section className="panel fc-sec">
          <h2>{t.topScores}</h2>
          <div className="fc-scores">
            {p.top_scores.map((s) => (
              <div key={`${s.h}-${s.a}`} className={fin && s.h === m.home_score_90 && s.a === m.away_score_90 ? "on" : ""}>
                <b>{s.h} - {s.a}</b>
                <span>{pct(s.p, 1)}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel fc-sec">
        <h2>{t.why}</h2>
        {cup && <p className="muted small">{t.cupNote}</p>}
        <div className="fc-cmp-head">
          <span>{m.home ? teamName(m.home, lang) : ""}</span>
          <span>{m.away ? teamName(m.away, lang) : ""}</span>
        </div>
        <CompareRow label={t.rating} a={f.eloH} b={f.eloA} fmt={(x) => String(Math.round(x))} />
        <CompareRow label={t.attack} a={f.attH} b={f.attA} fmt={(x) => x.toFixed(2)} />
        <CompareRow label={t.defense} a={f.defH} b={f.defA} fmt={(x) => x.toFixed(2)} higherBetter={false} />
        <CompareRow label={t.position} a={d.posH} b={d.posA} fmt={(x) => `${x}`} higherBetter={false} />
        <div className="fc-form-row">
          <div>{m.home && <FormDots team={m.home} ms={d.formH} />}</div>
          <em>{t.form}</em>
          <div className="right">{m.away && <FormDots team={m.away} ms={d.formA} />}</div>
        </div>
      </section>

      {(d.trendH.length > 1 || d.trendA.length > 1) && (
        <section className="panel fc-sec">
          <h2>{t.trend}</h2>
          <div className="fc-trend">
            <div>
              <span>{m.home ? teamName(m.home, lang) : ""}</span>
              <Sparkline pts={d.trendH} color={hc} />
            </div>
            <div>
              <span>{m.away ? teamName(m.away, lang) : ""}</span>
              <Sparkline pts={d.trendA} color={ac} />
            </div>
          </div>
        </section>
      )}

      <section className="panel fc-sec">
        <h2>{t.h2h}</h2>
        {d.h2h.length === 0 ? (
          <p className="muted small">{t.noData}</p>
        ) : (
          <ul className="fc-h2h">
            {d.h2h.map((x) => (
              <li key={x.id}>
                <Link href={`${BASE}/match/${x.id}`}>
                  <span className="muted small">{kstParts(x.utc_date, lang, true).date}</span>
                  <span>{x.home ? teamName(x.home, lang) : ""}</span>
                  <b>{x.home_score} - {x.away_score}</b>
                  <span>{x.away ? teamName(x.away, lang) : ""}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <Footer />
    </div>
  );
}

/* ───────────── 대회 ───────────── */

const fill = (str: string, v: Record<string, string | number>) => str.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

function OddsCell({ p, tone }: { p: number; tone: "gold" | "teal" | "rose" }) {
  const label = p >= 0.995 ? ">99%" : p > 0 && p < 0.005 ? "<1%" : p === 0 ? "–" : `${Math.round(p * 100)}%`;
  return (
    <td className="fc-odds">
      <span className={`fc-odds-bar ${tone}`} style={{ width: `${Math.max(p * 100, p > 0 ? 3 : 0)}%` }} />
      <b>{label}</b>
    </td>
  );
}

function SimTable({ sim, teams }: { sim: LeagueSim; teams: Record<number, TeamInfo> }) {
  const { t, lang } = useT();
  const z = sim.zones;
  if (!sim.remaining) return <p className="panel muted">{t.simEnded}</p>;
  return (
    <div className="panel fc-table-wrap">
      <p className="muted small fc-sim-sub">{fill(t.simSub, { n: sim.remaining, s: sim.sims.toLocaleString() })}</p>
      <table className="fc-table fc-sim">
        <thead>
          <tr>
            <th className="l">{lang === "ko" ? "팀" : "Team"}</th>
            <th className="hide-sm">{t.nowPts}</th>
            <th>{t.expPts}</th>
            <th>{t.title_}</th>
            <th>{fill(z.topKind === "promo" ? t.promo : t.ucl, { n: z.top })}</th>
            <th>{fill(t.relegation, { n: z.bottom })}</th>
          </tr>
        </thead>
        <tbody>
          {sim.teams.map((r) => {
            const team = teams[r.id] ?? { id: r.id, name: String(r.id), short_name: null, tla: null };
            return (
              <tr key={r.id}>
                <td className="l">
                  <span className="fc-tname">
                    <TeamBadge team={team} size={24} />
                    <span className="nm">{teamName(team, lang)}</span>
                  </span>
                </td>
                <td className="hide-sm muted">{r.pts}</td>
                <td><b>{Math.round(r.expPts)}</b></td>
                <OddsCell p={r.pTitle} tone="gold" />
                <OddsCell p={r.pTop} tone="teal" />
                <OddsCell p={r.pBottom} tone="rose" />
              </tr>
            );
          })}
        </tbody>
      </table>
      {z.topKind === "ucl" && <p className="muted small fc-sim-sub">{fill(t.uclNote, { n: z.top })}</p>}
    </div>
  );
}

export function FcLeague({
  comp,
  comps,
  table,
  teams,
  ratings,
  upcoming,
  sim,
}: {
  comp: string;
  comps: string[];
  table: StandingGroup[];
  teams: Record<number, TeamInfo>;
  ratings: Record<number, number>;
  upcoming: MatchRow[];
  sim: LeagueSim | null;
}) {
  const { t, lang } = useT();
  const groups = table.filter((g) => !g.type || g.type === "TOTAL");
  return (
    <div className="wrap fc">
      <Head active="leagues" />
      <div className="fc-chips">
        {comps.map((c) => (
          <Link key={c} href={`${BASE}/league/${c}`} className={`fc-chip${comp === c ? " on" : ""}`}>
            {COMP_NAME[c]?.short[lang] ?? c}
          </Link>
        ))}
      </div>
      {sim && (
        <>
          <h2 className="fc-h2">{COMP_NAME[comp]?.[lang] ?? comp} · {t.simTitle}</h2>
          <SimTable sim={sim} teams={teams} />
        </>
      )}
      <h2 className="fc-h2">{COMP_NAME[comp]?.[lang] ?? comp} · {t.standings}</h2>
      {groups.length === 0 && <p className="panel muted">{t.noData}</p>}
      {groups.map((g, gi) => (
        <div key={gi} className="panel fc-table-wrap">
          {g.group && <h3>{g.group.replace("GROUP_", "Group ")}</h3>}
          <table className="fc-table">
            <thead>
              <tr>
                <th>#</th>
                <th className="l">{lang === "ko" ? "팀" : "Team"}</th>
                <th>{t.played}</th>
                <th className="hide-sm">{t.w}</th>
                <th className="hide-sm">{t.d}</th>
                <th className="hide-sm">{t.l}</th>
                <th>{t.gd}</th>
                <th>{t.pts}</th>
                <th>{t.elo}</th>
              </tr>
            </thead>
            <tbody>
              {g.table.map((r) => {
                const team: TeamInfo = teams[r.team.id] ?? { id: r.team.id, name: r.team.name, short_name: r.team.shortName ?? null, tla: r.team.tla ?? null };
                return (
                  <tr key={r.team.id}>
                    <td>{r.position}</td>
                    <td className="l">
                      <span className="fc-tname">
                        <TeamBadge team={team} size={24} />
                        {teamName(team, lang)}
                      </span>
                    </td>
                    <td>{r.playedGames}</td>
                    <td className="hide-sm">{r.won}</td>
                    <td className="hide-sm">{r.draw}</td>
                    <td className="hide-sm">{r.lost}</td>
                    <td>{r.goalDifference > 0 ? `+${r.goalDifference}` : r.goalDifference}</td>
                    <td><b>{r.points}</b></td>
                    <td className="muted">{ratings[r.team.id] ? Math.round(ratings[r.team.id]) : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
      {upcoming.length > 0 && (
        <>
          <h2 className="fc-h2">{t.upcoming}</h2>
          <div className="fc-grid">
            {upcoming.map((m) => (
              <MatchCard key={m.id} m={m} />
            ))}
          </div>
        </>
      )}
      <Footer />
    </div>
  );
}

/* ───────────── 모델 성적 ───────────── */

export interface AccStats {
  all: { n: number; acc: number; brier: number; logloss: number };
  last30: { n: number; acc: number };
  byComp: { comp: string; n: number; acc: number }[];
  calib: { lo: number; hi: number; n: number; pred: number; real: number }[];
}

function CalibChart({ bins }: { bins: AccStats["calib"] }) {
  const shown = bins.filter((b) => b.n > 0);
  return (
    <div className="fc-calib">
      {shown.map((b) => (
        <div key={b.lo} className="row">
          <span className="lbl">{pct(b.lo)}–{pct(b.hi)}</span>
          <div className="track">
            <i className="pred" style={{ width: `${b.pred * 100}%` }} />
            <i className="real" style={{ left: `calc(${b.real * 100}% - 5px)` }} title={pct(b.real, 1)} />
          </div>
          <span className="val">{pct(b.real, 1)}</span>
          <span className="n muted small">{b.n.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export function FcAccuracy({ live }: { live: AccStats }) {
  const { t, lang } = useT();
  const bt = BACKTEST_V1;
  return (
    <div className="wrap fc mid">
      <Head active="accuracy" />
      <p className="page-sub">{t.accSub}</p>

      <section className="panel fc-sec">
        <h2>{t.liveTitle}</h2>
        {live.all.n === 0 ? (
          <p className="muted">{t.liveEmpty}</p>
        ) : (
          <div className="fc-kpis">
            <div><span>{t.total}</span><b>{pct(live.all.acc, 1)}</b><em>{live.all.n} {t.games}</em></div>
            <div><span>{t.recent30}</span><b>{live.last30.n ? pct(live.last30.acc, 1) : "-"}</b><em>{live.last30.n} {t.games}</em></div>
            <div><span>{t.brier}</span><b>{live.all.brier.toFixed(3)}</b><em>{t.lowerBetter}</em></div>
          </div>
        )}
        {live.all.n > 0 && live.all.n < 200 && <p className="muted small">{t.smallSample}</p>}
        {live.byComp.length > 0 && (
          <div className="fc-bycomp">
            {live.byComp.map((c) => (
              <div key={c.comp}>
                <span>{COMP_NAME[c.comp]?.short[lang] ?? c.comp}</span>
                <div className="track"><i style={{ width: `${c.acc * 100}%` }} /></div>
                <b>{pct(c.acc)}</b>
                <em className="muted small">{c.n}</em>
              </div>
            ))}
          </div>
        )}
        {live.all.n >= 100 && (
          <>
            <h3>{t.calib}</h3>
            <CalibChart bins={live.calib} />
          </>
        )}
      </section>

      <section className="panel fc-sec">
        <h2>{t.btTitle}</h2>
        <p className="muted small">{t.btBody}</p>
        <div className="fc-kpis">
          <div><span>{t.accuracy}</span><b>{pct(bt.holdout.acc, 1)}</b><em>{t.baseline} {pct(bt.holdout.baseAcc, 1)}</em></div>
          <div><span>{t.brier}</span><b>{bt.holdout.brier.toFixed(3)}</b><em>{t.baseline} {bt.holdout.baseBrier.toFixed(3)}</em></div>
          <div><span>{t.logloss}</span><b>{bt.holdout.logloss.toFixed(3)}</b><em>{t.baseline} {bt.holdout.baseLogloss.toFixed(3)}</em></div>
        </div>
        <p className="muted small">{bt.holdout.n.toLocaleString()} {t.games} · {t.baselineNote}</p>
        <h3>{t.byComp}</h3>
        <div className="fc-bycomp">
          {Object.entries(bt.byComp)
            .sort((a, b) => b[1][0] - a[1][0])
            .map(([c, [acc, base]]) => (
              <div key={c}>
                <span>{COMP_NAME[c]?.short[lang] ?? c}</span>
                <div className="track">
                  <i style={{ width: `${acc * 100}%` }} />
                  <i className="base" style={{ left: `${base * 100}%` }} title={`${t.baseline} ${pct(base, 1)}`} />
                </div>
                <b>{pct(acc, 1)}</b>
                <em className="muted small">{t.baseline} {pct(base)}</em>
              </div>
            ))}
        </div>
        <h3>{t.calib}</h3>
        <p className="muted small">{t.calibSub}</p>
        <CalibChart bins={bt.calib} />
      </section>
      <Footer />
    </div>
  );
}
