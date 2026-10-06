import type { Metadata } from "next";
import { FcAccuracy, type AccStats } from "@/components/forecast/ForecastUI";
import { gradedPredictions } from "@/lib/forecast/read";
import { BASE, fcMeta, nowMs } from "@/lib/forecast/pages";
import { serverLang } from "@/lib/serverLang";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, fromParam } = await serverLang();
  const title = lang === "ko" ? "예측 모델 성적 · 적중률" : "Forecast track record";
  const description =
    lang === "ko"
      ? "스포츠 승부 예측 모델의 실제 적중률, 브라이어 점수, 확률 보정 결과를 공개합니다. 예측은 킥오프 순간 잠깁니다."
      : "The real accuracy, Brier score and calibration of the Sports Forecast model. Every forecast locks at kick-off.";
  return fcMeta(lang, fromParam, `${BASE}/accuracy`, title, description);
}

export default async function Page() {
  const rows = await gradedPredictions().catch(() => []);
  const since = nowMs() - 30 * 86400_000;
  const n = rows.length;
  const recent = rows.filter((r) => Date.parse(r.utc_date) >= since);
  const byComp = new Map<string, { n: number; hit: number }>();
  for (const r of rows) {
    const c = byComp.get(r.competition) ?? { n: 0, hit: 0 };
    c.n++;
    if (r.hit) c.hit++;
    byComp.set(r.competition, c);
  }
  const bins = Array.from({ length: 10 }, (_, i) => ({ lo: i / 10, hi: (i + 1) / 10, n: 0, pred: 0, real: 0 }));
  for (const r of rows) {
    const ps = [r.p_home, r.p_draw, r.p_away];
    const o = "HDA".indexOf(r.result);
    ps.forEach((p, k) => {
      const b = bins[Math.min(9, Math.floor(p * 10))];
      b.n++;
      b.pred += p;
      if (k === o) b.real++;
    });
  }
  const stats: AccStats = {
    all: {
      n,
      acc: n ? rows.filter((r) => r.hit).length / n : 0,
      brier: n ? rows.reduce((s, r) => s + r.brier, 0) / n : 0,
      logloss: n ? rows.reduce((s, r) => s + r.logloss, 0) / n : 0,
    },
    last30: { n: recent.length, acc: recent.length ? recent.filter((r) => r.hit).length / recent.length : 0 },
    byComp: [...byComp].map(([comp, c]) => ({ comp, n: c.n, acc: c.hit / c.n })).sort((a, b) => b.n - a.n),
    calib: bins.map((b) => ({ ...b, pred: b.n ? b.pred / b.n : 0, real: b.n ? b.real / b.n : 0 })),
  };
  return <FcAccuracy live={stats} />;
}
