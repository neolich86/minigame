// 스포츠 승부 예측 — 모델 v1.0 백테스트 결과 (2026-10-06, forecast-backtest run 37458205500)
// 운영 예측이 충분히 쌓이기 전까지 "과거 시즌 검증" 숫자로 화면에 쓴다.
export const BACKTEST_V1 = {
  version: "v1.0",
  holdout: { seasons: "2025/26", n: 3597, acc: 0.506, baseAcc: 0.433, logloss: 0.9981, baseLogloss: 1.0742, brier: 0.5955, baseBrier: 0.65 },
  all: { n: 6705, acc: 0.513, baseAcc: 0.435, predDraw: 0.252, draw: 0.253 },
  byComp: {
    PPL: [0.545, 0.418], FL1: [0.539, 0.461], SA: [0.527, 0.396], DED: [0.521, 0.436], BL1: [0.518, 0.419],
    PD: [0.517, 0.466], PL: [0.495, 0.414], ELC: [0.449, 0.433], CL: [0.591, 0.508],
  } as Record<string, [number, number]>,
  calib: [
    { lo: 0, hi: 0.1, n: 690, pred: 0.069, real: 0.074 },
    { lo: 0.1, hi: 0.2, n: 2526, pred: 0.159, real: 0.157 },
    { lo: 0.2, hi: 0.3, n: 7786, pred: 0.257, real: 0.261 },
    { lo: 0.3, hi: 0.4, n: 3599, pred: 0.341, real: 0.339 },
    { lo: 0.4, hi: 0.5, n: 2385, pred: 0.446, real: 0.442 },
    { lo: 0.5, hi: 0.6, n: 1538, pred: 0.546, real: 0.531 },
    { lo: 0.6, hi: 0.7, n: 904, pred: 0.645, real: 0.649 },
    { lo: 0.7, hi: 0.8, n: 454, pred: 0.746, real: 0.784 },
    { lo: 0.8, hi: 0.9, n: 205, pred: 0.841, real: 0.81 },
    { lo: 0.9, hi: 1, n: 28, pred: 0.923, real: 0.857 },
  ],
};
