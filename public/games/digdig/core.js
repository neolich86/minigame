// 파고파고 대모험 — 규칙 · 수치 (DOM 없음)
export const NX = 22, NY = 30, ND = 10, N = NX * NY * ND;
export const idx = (x, y, d) => d * NX * NY + y * NX + x;

// 암석 (1막 지구 / 2막 우주)
export const ROCKS = [
  [ // 지구 (hp·val 은 라운드 배율 HPX·VALX 를 곱해서 씀)
    { name: '표토', hp: 1, val: 1, col: [0x8a5a34, 0x9a6a3e] },
    { name: '사암', hp: 3, val: 2.5, col: [0xd9b07a, 0xe6c28f] },
    { name: '붉은 점토', hp: 7, val: 5, col: [0xb8643f, 0xc97650] },
    { name: '석회암', hp: 15, val: 9, col: [0xb9b2a0, 0xc8c1ae] },
    { name: '화강암', hp: 30, val: 15, col: [0x7c7a82, 0x8c8a92] },
  ],
  [ // 우주
    { name: '먼지 껍질', hp: 6, val: 1.5, col: [0x5a5670, 0x6a6684] },
    { name: '규산암', hp: 16, val: 3, col: [0x4a3f63, 0x5a4f76] },
    { name: '철 암반', hp: 36, val: 6, col: [0x3a3350, 0x463d60] },
    { name: '심층 핵', hp: 80, val: 11, col: [0x2b2640, 0x352f4e] },
    { name: '수정', hp: 24, val: 30, col: [0x9d6bff, 0x4fe8ff] },
  ],
];
// 라운드마다 암석이 단단해지고 값도 오름 (강화가 따라가야 함)
export const HPX = (r) => Math.pow(HP_G, r);
export const VALX = (r) => Math.pow(VAL_G, r);
export let HP_G = 3.2, VAL_G = 2.8, ZW = 3, REW = 400, INC = 1.5;
export function tune(o) { if (o.HP_G) HP_G = o.HP_G; if (o.VAL_G) VAL_G = o.VAL_G; if (o.ZW) ZW = o.ZW; if (o.REW) REW = o.REW; if (o.INC) INC = o.INC; if (o.UPS) o.UPS.forEach((u, k) => Object.assign(UPS[k], u)); if (o.TOOLS) o.TOOLS.forEach((a, i) => a.forEach((t, j) => Object.assign(TOOLS[i][j], t))); if (o.ROUNDS) o.ROUNDS.forEach((r, i) => Object.assign(ROUNDS[i], r)); scaleRounds(); }

// 라운드: 공룡(1막) · 소행성(2막). pieces = 아이콘 번호(fos 시트), name
export const ROUNDS = [
  { act: 0, id: 'raptor', name: '벨로키랍토르', short: '랩터', base: 0, pieces: [['두개골', 0], ['낫 발톱', 1], ['꼬리뼈', 2]], income: 1, reward: 60,
    desc: '빠르고 영리한 사냥꾼. 뒷발의 커다란 낫 발톱이 특징이에요.' },
  { act: 0, id: 'stego', name: '스테고사우루스', short: '스테고', base: .6, pieces: [['두개골', 3], ['등 골판', 4], ['꼬리 가시', 5], ['다리뼈', 6]], income: 2, reward: 180,
    desc: '등에 커다란 골판이 줄지어 있는 초식 공룡이에요.' },
  { act: 0, id: 'trike', name: '트리케라톱스', short: '트리케라', base: 1.2, pieces: [['프릴 두개골', 7], ['뿔', 8], ['갈비뼈', 9], ['다리뼈', 10]], income: 4, reward: 450,
    desc: '뿔 세 개와 커다란 목 프릴을 가진 튼튼한 공룡이에요.' },
  { act: 0, id: 'ptera', name: '프테라노돈', short: '프테라', base: 1.8, pieces: [['볏 두개골', 11], ['날개뼈', 12], ['가슴뼈', 13], ['발', 14]], income: 7, reward: 1100,
    desc: '하늘을 나는 파충류. 머리 뒤로 긴 볏이 뻗어 있어요.' },
  { act: 0, id: 'trex', name: '티라노사우루스', short: '티라노', base: 2.4, pieces: [['두개골', 15], ['이빨', 16], ['작은 앞발', 17], ['갈비뼈', 18], ['꼬리', 19]], income: 12, reward: 2600,
    desc: '공룡의 왕! 거대한 머리와 아주 작은 앞발을 가졌어요.' },
  { act: 0, id: 'brachio', name: '브라키오사우루스', short: '브라키오', base: 3, pieces: [['두개골', 20], ['긴 목뼈', 21], ['갈비뼈', 22], ['다리뼈', 23], ['꼬리', 24]], income: 20, reward: 6000,
    desc: '목이 아주 긴 거대한 초식 공룡이에요.' },
  { act: 1, id: 'dust', name: '먼지 소행성', short: '먼지', base: 0, pieces: [['룬 반지', 0], ['수정 해골', 1], ['떠 있는 큐브', 2]], income: 40, reward: 20000,
    desc: '무른 먼지 껍질 속에 반짝이는 크리스털이 박힌 소행성이에요.' },
  { act: 1, id: 'iron', name: '철 소행성', short: '철', base: 1.4, pieces: [['크리스털 상자', 3], ['금광석', 4], ['외계 헬멧', 5], ['별 지도 판', 6]], income: 70, reward: 60000,
    desc: '단단한 철 암반 속에 금이 가득한 소행성이에요.' },
];
// 완료 보상·관람 수입도 라운드 배율을 따라감
export function scaleRounds() { ROUNDS.forEach((r, i) => { r.reward = Math.round(REW * VALX(i)); r.income = Math.round(INC * VALX(i) * 10) / 10; }); }
scaleRounds();
export const BONUS = [{ name: '호박 속 모기', val: 25 }, { name: '암모나이트', val: 15 }];

// 강화 (비용 = base × grow^레벨)
export const UPS = [
  { id: 'pow', name: '위력', base: 200, grow: 1.8, max: 80, desc: '피해 ×1.35' },
  { id: 'size', name: '크기', base: 1000, grow: 2.8, max: 10, desc: '범위 +' },
  { id: 'spd', name: '속도', base: 650, grow: 2.3, max: 12, desc: '연타 빨라짐' },
  { id: 'sell', name: '판매', base: 500, grow: 2.0, max: 40, desc: '값 +20%' },
  { id: 'museum', name: '박물관', base: 5000, grow: 1.9, max: 25, desc: '관람 수입 +25%' },
  { id: 'radar', name: '레이더', base: 4000, grow: 2.5, max: 5, desc: '화석 위치 반짝' },
];
export const TOOLS = [ // 도구 진화 (act별)
  [{ name: '곡괭이', mul: 1, cost: 0 }, { name: '착암기', mul: 3, cost: 50000 }, { name: '굴착 드릴', mul: 8, cost: 1600000 }],
  [{ name: '채굴 레이저', mul: 16, cost: 0 }, { name: '플라즈마 드릴', mul: 60, cost: 3e9 }],
];
export const DYNA_COST = (r) => Math.round(60 * Math.pow(1.6, r));

export function upCost(st, k) { const u = UPS[k]; return Math.round(u.base * Math.pow(u.grow, st.lv[u.id] || 0)); }
export function power(st) { const t = TOOLS[ROUNDS[st.round].act][st.tool] || TOOLS[0][0]; return Math.pow(1.35, st.lv.pow || 0) * t.mul; }
export const radius = (st) => 1.6 + (st.lv.size || 0) * 0.15; // 큐브 단위
export const interval = (st) => 0.22 * Math.pow(0.93, st.lv.spd || 0);
export const sellMul = (st) => (1 + 0.2 * (st.lv.sell || 0)) * (st.boostT > 0 ? 2 : 1);
export function museumIncome(st) { let s = 0; for (const r of st.done) s += ROUNDS[r].income; return s * (1 + 0.25 * (st.lv.museum || 0)); }
export const radarCd = (st) => Math.max(8, 40 - (st.lv.radar || 0) * 6);

// 큐브 하나의 값 (화석 큐브는 0 — 화석 자체가 보상)
export function cubeVal(W, i, round) {
  if (W.fos[i] >= 0) return 0;
  const v = W.bonus[i] >= 0 ? BONUS[W.bonus[i]].val * 4 : ROCKS[ROUNDS[round].act][W.kind[i]].val;
  return v * VALX(round);
}
// 한 번 치기. (hx, hy) = 큐브 좌표(실수), hd = 맞은 큐브의 깊이. 부서진 큐브 번호와 번 돈을 돌려줌.
export function hit(W, st, hx, hy, hd, big) {
  const rad = big ? 5.5 : radius(st), pw = power(st) * (big ? 25 : 1), zw = big ? 1.2 : ZW;
  const broke = []; let gain = 0;
  const x0 = Math.max(0, Math.floor(hx - rad)), x1 = Math.min(NX - 1, Math.ceil(hx + rad));
  const y0 = Math.max(0, Math.floor(hy - rad)), y1 = Math.min(NY - 1, Math.ceil(hy + rad));
  const d1 = Math.min(ND - 1, hd + Math.ceil(rad / zw));
  for (let d = hd; d <= d1; d++) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const i = idx(x, y, d); if (!W.alive[i]) continue;
    const dd = Math.hypot(x - hx, y - hy, (d - hd) * zw); if (dd > rad) continue;
    W.hp[i] -= pw * (dd < rad * .65 ? 1 : .6);
    if (W.hp[i] <= 0) { W.alive[i] = 0; if (W.fos[i] >= 0) W.got[W.fos[i]]++; broke.push(i); gain += cubeVal(W, i, st.round); }
  }
  return { broke, gain: gain * sellMul(st) };
}
// 화석 k 를 다 찾았나 (85%)
export const fossilDone = (W, k) => W.got[k] >= W.cnt[k] * .85;

// ---------- 난수 ----------
export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- 벽 만들기 ----------
// masks[i] = 화석 i 의 모양(문자열 배열, 'X' = 큐브). 게임이 아이콘 그림에서 만들어 넘겨 줌.
export function makeWall(roundIdx, seed, masks) {
  const R = rng(seed), rd = ROUNDS[roundIdx];
  const kind = new Uint8Array(N), hp = new Float32Array(N), fos = new Int8Array(N).fill(-1), bonus = new Int8Array(N).fill(-1);
  for (let d = 0; d < ND; d++) for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
    const i = idx(x, y, d), n = (Math.sin(x * 1.7 + y * .9 + seed) + Math.sin(x * .5 - y * 1.3 + d)) * .25;
    let k = Math.floor(rd.base + (NY - 1 - y) / NY * 1.8 + d * .18 + n + R() * .35);
    if (rd.act === 1 && R() < .03) k = 4; // 수정
    else k = Math.max(0, Math.min(rd.act ? 3 : 4, k));
    kind[i] = k; hp[i] = ROCKS[rd.act][k].hp * HPX(roundIdx);
  }
  // 화석 묻기: 뒤로 갈수록 깊이
  const used = [], place = [];
  const fits = (x0, y0, w, h) => used.every(([a, b, c, e]) => x0 + w + 1 < a || a + c + 1 < x0 || y0 + h + 1 < b || b + e + 1 < y0);
  rd.pieces.forEach((p, k) => {
    const m = masks[k], h = m.length, w = m[0].length;
    let x0 = 0, y0 = 0;
    for (let t = 0; t < 200; t++) { x0 = 1 + Math.floor(R() * (NX - w - 2)); y0 = 2 + Math.floor(R() * (NY - h - 4)); if (fits(x0, y0, w, h)) break; }
    used.push([x0, y0, w, h]);
    const deep = Math.min(ND - 3, 2 + (roundIdx % 6)), d0 = Math.min(ND - 2, 1 + Math.floor(k * deep / Math.max(1, rd.pieces.length - 1) + R() * 1.2)); place.push([x0, y0, d0]); // 라운드가 갈수록 깊이 묻힘
    m.forEach((row, ry) => [...row].forEach((c, rx) => {
      if (c === '.') return; const y = NY - 1 - (y0 + ry), x = x0 + rx;
      for (const d of [d0, d0 + 1]) { const i = idx(x, y, d); fos[i] = k; hp[i] = ROCKS[rd.act][kind[i]].hp * 1.5 * HPX(roundIdx); }
    }));
  });
  // 보너스 보물 (작은 덩어리)
  for (let b = 0; b < 3; b++) {
    const x = 1 + Math.floor(R() * (NX - 3)), y = Math.floor(R() * (NY - 3)), d = Math.floor(R() * (ND - 1)), t = rd.act ? 1 : Math.floor(R() * 2);
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { const i = idx(x + dx, y + dy, d); if (fos[i] < 0) bonus[i] = t; }
  }
  const cnt = rd.pieces.map((_, k) => fos.reduce((s, v) => s + (v === k ? 1 : 0), 0));
  return { place, kind, hp, fos, bonus, alive: new Uint8Array(N).fill(1), cnt, got: rd.pieces.map(() => 0), found: rd.pieces.map(() => false) };
}

// 새 저장
export function newState() {
  return { v: 2, money: 0, round: 0, tool: 0, lv: {}, done: [], dyna: 1, boostT: 0, radarT: 0, seed: 1 + Math.floor(Math.random() * 1e6), total: 0, at: Date.now(), tut: 0 };
}
