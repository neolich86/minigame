// 나만의 문명 만들기 — 규칙 · 수치 · 시뮬레이션 (DOM 없음, node에서도 돌아감)
export const W = 46, H = 64;
export const T = { SEA: 0, SAND: 1, GRASS: 2, FOREST: 3, LAKE: 4, MOUNT: 5, VOLC: 6, FIELD: 7 };
export const TNAME = ['바다', '모래', '초원', '숲', '호수', '산', '화산', '밭'];
export const RES = ['food', 'wood', 'stone', 'iron', 'gold', 'know', 'energy'];
export const RNAME = { food: '식량', wood: '목재', stone: '돌', iron: '철', gold: '금', know: '지식', energy: '에너지' };
export const ERAS = ['원시 시대', '농경 시대', '부족 국가', '왕국 시대', '산업 시대', '미래 문명'];

// 종족마다 특산물이 있고, 다른 종족은 그 자원을 조금밖에 못 만든다 → 교류해야 서로 발전
export const SPECIES = [
  { id: 'toto', name: '토토족', like: T.GRASS, color: '#ff4f9a', spec: ['food'], desc: '초원을 좋아하는 토끼 종족. 식량을 잘 길러 이웃에게 나눠요.', mult: { food: 1.3 }, grow: 1.25 },
  { id: 'mogu', name: '모구족', like: T.MOUNT, color: '#ff8a1f', spec: ['iron', 'gold'], desc: '산을 좋아하는 두더지 종족. 철·금은 모구족만 잘 캐요.', mult: { stone: 1.3, iron: 1.5, gold: 1.4 }, grow: 1 },
  { id: 'pong', name: '퐁퐁족', like: T.LAKE, color: '#14b8c8', spec: ['know'], desc: '호수를 좋아하는 개구리 종족. 지식을 많이 쌓아 이웃에게 가르쳐요.', mult: { know: 1.4 }, grow: 1.05 },
];
// 특산물이 아닌 종족의 생산 배율
export const NONSPEC = { food: .8, iron: .3, gold: .5, know: .7 };
export const isSpec = (tb, k) => SPECIES[tb.sp].spec.includes(k);
export const SPEC_OF = (k) => SPECIES.findIndex((s) => s.spec.includes(k));
export const TRADE_SHARE = .5; // 교류 상대가 받는 특산물 비율 (특산물 생산량 대비)
// 섬 종류
export const BIOMES = [
  { name: '고향 섬', icon: '🏝', desc: '' , f: 1, wd: 1, ir: 1, gd: 1 },
  { name: '사막섬', icon: '🏜', desc: '식량은 적지만 금이 많이 나와요', f: .5, wd: .6, ir: 1, gd: 2.5 },
  { name: '눈섬', icon: '❄️', desc: '춥지만 산에서 철이 많이 나와요', f: .6, wd: .9, ir: 2, gd: 1 },
  { name: '정글섬', icon: '🌴', desc: '숲과 호수가 많아 식량·목재가 넘쳐요', f: 1.4, wd: 1.5, ir: .8, gd: .8 },
  { name: '불꽃섬', icon: '🌋', desc: '화산이 많아 금·철이 함께 나와요', f: .7, wd: .8, ir: 1.5, gd: 1.6 },
];
// [중심 x, y, 반지름 x, y, 바이옴]
export const ISLES = [[23, 32, 12, 16, 0], [8, 7, 6, 5, 1], [38, 8, 6, 5.5, 2], [8, 57, 6, 5, 3], [38, 56, 6, 5.5, 4]];

// 지형 만들기 (신력 비용)
export const TOOLS = [
  { id: 'grass', name: '초원', to: T.GRASS, cost: 3, desc: '농사에 좋아요' },
  { id: 'tree', name: '나무', to: T.FOREST, cost: 5, desc: '목재가 나와요' },
  { id: 'lake', name: '호수', to: T.LAKE, cost: 8, desc: '물고기·물 공급' },
  { id: 'mount', name: '산', to: T.MOUNT, cost: 12, desc: '돌·철·금' },
  { id: 'volc', name: '화산', to: T.VOLC, cost: 60, desc: '희귀 광물, 가끔 폭발' },
];
// 신의 능력
export const POWERS = [
  { id: 'bless', name: '축복', cost: 25, cd: 40, desc: '40초 동안 생산량 +60%' },
  { id: 'rain', name: '비', cost: 15, cd: 25, desc: '식량 +, 가뭄 해소, 숲이 자라요' },
  { id: 'bolt', name: '번개', cost: 20, cd: 30, desc: '에너지와 지식을 내려요' },
  { id: 'quake', name: '지진', cost: 35, cd: 45, desc: '그 자리에 산이 솟아요 (건물 주의)' },
  { id: 'plenty', name: '풍요', cost: 40, cd: 60, desc: '아기가 태어나요 (인구 +)' },
  { id: 'wisdom', name: '지혜', cost: 30, cd: 50, desc: '45초 동안 연구 속도 ×2' },
];

// 기술 (era: 속한 시대, cost: 지식)
export const TECHS = [
  { id: 'fire', era: 0, name: '불의 발견', cost: 8, desc: '식량 소비 -15%' },
  { id: 'tool', era: 0, name: '도구 제작', cost: 16, desc: '모든 생산 +20%' },
  { id: 'cook', era: 0, name: '요리', cost: 24, req: ['fire'], desc: '인구 증가 +25%' },
  { id: 'farm', era: 1, name: '농업', cost: 70, desc: '초원에 밭을 일궈요 (식량 ×2)' },
  { id: 'store', era: 1, name: '저장 기술', cost: 90, desc: '자원 보관량 ×2' },
  { id: 'build', era: 1, name: '건축 기술', cost: 110, desc: '집 한 채에 +1명' },
  { id: 'metal', era: 2, name: '금속 가공', cost: 180, desc: '산에서 철을 캐요' },
  { id: 'trade', era: 2, name: '무역', cost: 210, desc: '금 수입, 교류 상대와 나누는 양 +50%' },
  { id: 'army', era: 2, name: '군대', cost: 190, desc: '병사가 마을을 지켜요' },
  { id: 'write', era: 3, name: '문자', cost: 350, desc: '학교 — 지식 ×1.5' },
  { id: 'faith', era: 3, name: '종교와 문화', cost: 380, desc: '신력 회복 +50%' },
  { id: 'castle', era: 3, name: '성 건축', cost: 400, desc: '영토 +2, 집 +1명·3채' },
  { id: 'sail', era: 3, name: '항해', cost: 300, desc: '탐험선으로 새 섬을 찾고 개척 마을을 세워요' },
  { id: 'wtree', era: 3, sp: 'toto', name: '세계수', cost: 320, wonder: 1, desc: '토토족 불가사의 — 식량 ×1.3, 인구 +12' },
  { id: 'under', era: 3, sp: 'mogu', name: '지하도시', cost: 320, wonder: 1, desc: '모구족 불가사의 — 철·금 ×1.3, 집 +4채' },
  { id: 'float', era: 3, sp: 'pong', name: '수상도시', cost: 320, wonder: 1, desc: '퐁퐁족 불가사의 — 지식 ×1.3, 집 +3채' },
  { id: 'steam', era: 4, name: '증기기관', cost: 650, desc: '공장 — 에너지 생산, 생산 +40%' },
  { id: 'rail', era: 4, name: '철도', cost: 700, desc: '영토 +2, 교류로 나누는 양 +50%' },
  { id: 'science', era: 4, name: '과학', cost: 800, desc: '지식 ×2' },
  { id: 'robot', era: 5, name: '로봇과 자동화', cost: 1500, desc: '일손 ×1.5' },
  { id: 'fusion', era: 5, name: '핵융합', cost: 1700, desc: '에너지 ×3' },
  { id: 'rocket', era: 5, name: '우주 로켓', cost: 3000, req: ['robot', 'fusion'], desc: '우주로 진출해요! (에너지 500 · 금 300)' },
];
export const TECH = Object.fromEntries(TECHS.map((t) => [t.id, t]));
export const techsFor = (tb, era) => TECHS.filter((t) => t.era === era && (!t.sp || t.sp === SPECIES[tb.sp].id));
// 다음 시대 조건: 그 시대 기술 모두 + 인구 + 자원
export const ERA_REQ = [
  { pop: 7, res: { food: 30 } },
  { pop: 14, res: { wood: 80 } },
  { pop: 22, res: { stone: 60, iron: 20 } },
  { pop: 32, res: { iron: 100, gold: 60 } },
  { pop: 50, res: { energy: 250, gold: 200 } },
];
export const HOUSE_CAP = [3, 3, 4, 4, 5, 6];
export const MAX_HOUSES = [3, 5, 8, 11, 14, 18];

// ---------- 난수 ----------
export function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const idx = (x, y) => y * W + x;
export const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;

// ---------- 섬 ----------
// 고향 섬 + 바다 건너 4개 섬 (항해로 발견)
export function makeWorld(seed) {
  const R = rng(seed), t = new Uint8Array(W * H), isl = new Int8Array(W * H).fill(-1);
  ISLES.forEach(([cx, cy, rx, ry], k) => {
    const N = []; for (let i = 0; i < 6; i++) N.push([R() * 6.28, 1.5 + R() * 2.5, R() * .16]);
    for (let y = Math.max(0, Math.floor(cy - ry - 3)); y < Math.min(H, cy + ry + 3); y++) for (let x = Math.max(0, Math.floor(cx - rx - 3)); x < Math.min(W, cx + rx + 3); x++) {
      const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry, a = Math.atan2(dy, dx);
      let r = Math.hypot(dx, dy); for (const [p, f, kk] of N) r -= Math.sin(a * f + p) * kk * .6;
      if (r <= 1) { t[idx(x, y)] = r > .84 ? T.SAND : T.GRASS; isl[idx(x, y)] = k; }
    }
  });
  const tilesOf = (k, ty) => { const o = []; for (let i = 0; i < t.length; i++) if (isl[i] === k && t[i] === ty) o.push(i); return o; };
  const sprinkle = (k, ty, n) => { const g = tilesOf(k, T.GRASS); for (let j = 0; j < n && g.length; j++) t[g.splice(Math.floor(R() * g.length), 1)[0]] = ty; };
  // 처음엔 거의 빈 고향 섬: 나무 몇 그루 · 작은 언덕 하나 · 작은 웅덩이 하나
  sprinkle(0, T.FOREST, 7); sprinkle(0, T.MOUNT, 1); sprinkle(0, T.LAKE, 1);
  sprinkle(1, T.MOUNT, 3); sprinkle(1, T.VOLC, 1); sprinkle(1, T.FOREST, 3);
  sprinkle(2, T.MOUNT, 7); sprinkle(2, T.FOREST, 6);
  sprinkle(3, T.FOREST, 16); sprinkle(3, T.LAKE, 5);
  sprinkle(4, T.VOLC, 2); sprinkle(4, T.MOUNT, 4); sprinkle(4, T.FOREST, 3);
  return { t, isl };
}
export const bioAt = (w, i) => (w.isl[i] >= 0 ? ISLES[w.isl[i]][4] : 0);

// ---------- 새 게임 ----------
export function newWorld(seed = 1 + Math.floor(Math.random() * 1e6)) {
  const { t, isl } = makeWorld(seed);
  const w = { v: 2, seed, t, isl, seen: new Uint8Array(W * H), found: [0], time: 0, mana: 40, manaMax: 100, tribes: [], cds: {}, events: [], nextEv: 90, log: [], buffs: [], done: false, stars: 0, met: {}, rs: seed };
  reveal(w, 0); return w;
}
// 섬 하나를 (주변 바다까지) 보이게
export function reveal(w, k) {
  if (!w.found.includes(k)) w.found.push(k);
  for (let i = 0; i < w.t.length; i++) if (w.isl[i] === k) { const x = i % W, y = (i / W) | 0; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (inb(x + dx, y + dy)) w.seen[idx(x + dx, y + dy)] = 1; }
}
export function slots(w) { const top = Math.max(-1, ...w.tribes.map((b) => b.era)); return top >= 2 ? 3 : top >= 1 ? 2 : 1; }

export function spawnTribe(w, sp, x, y) {
  if (w.tribes.length >= slots(w) || w.tribes.some((b) => b.sp === sp)) return { ok: false, msg: '지금은 더 탄생시킬 수 없어요' };
  const tt = w.t[idx(x, y)]; if (!w.seen[idx(x, y)] || tt === T.SEA || tt === T.LAKE || tt === T.MOUNT || tt === T.VOLC) return { ok: false, msg: '땅 위에 탄생시켜 주세요' };
  if (w.isl[idx(x, y)] !== 0) return { ok: false, msg: '종족은 고향 섬에서 태어나요 (다른 섬은 개척으로)' };
  for (const b of w.tribes) if (Math.hypot(b.cx - x, b.cy - y) < 7) return { ok: false, msg: '다른 종족과 너무 가까워요' };
  const tb = {
    id: w.tribes.length, sp, cx: x, cy: y, era: 0, pop: 3, grow: 0, techs: [], res: { food: 20, wood: 5, stone: 0, iron: 0, gold: 0, know: 0, energy: 0 },
    houses: [], works: [], jobs: {}, radius: 3, starve: 0, research: null, sick: 0, cols: [],
  };
  w.tribes.push(tb); w.t[idx(x, y)] = w.t[idx(x, y)] === T.FOREST ? T.GRASS : w.t[idx(x, y)];
  logMsg(w, `${SPECIES[sp].name}이 섬에 태어났어요!`);
  return { ok: true, tb };
}

export function logMsg(w, m, kind = 'info') { w.log.push({ t: w.time, m, kind }); if (w.log.length > 40) w.log.shift(); }
const has = (tb, id) => tb.techs.includes(id);
export function radius(tb) { return Math.min(10, 3 + Math.floor(tb.era * .8) + Math.floor(tb.pop / 12) + (has(tb, 'castle') ? 2 : 0) + (has(tb, 'rail') ? 2 : 0)); }
export function capOf(tb) { return tb.houses.length * (HOUSE_CAP[tb.era] + (has(tb, 'build') ? 1 : 0) + (has(tb, 'castle') ? 1 : 0)) + 4 + (has(tb, 'wtree') ? 12 : 0) + tb.cols.length * 4; }
export function storeCap(tb) { return (150 + tb.era * 120) * (has(tb, 'store') ? 2 : 1); }

// 영토: 마을 중심(개척 마을 포함)에서 땅으로 이어진 칸 중 반경 안. 겹치면 더 가까운 종족
export const centers = (tb) => [{ x: tb.cx, y: tb.cy, r: tb.radius, main: 1 }, ...tb.cols.map((c) => ({ x: c.x, y: c.y, r: Math.max(3, tb.radius - 3) }))];
export function territory(w) {
  const own = new Int8Array(W * H).fill(-1), d = new Float32Array(W * H).fill(1e9);
  for (const tb of w.tribes) {
    tb.radius = radius(tb);
    for (const c of centers(tb)) {
      const st = [idx(c.x, c.y)], vis = new Set(st);
      while (st.length) {
        const i = st.pop(), x = i % W, y = (i / W) | 0, dd = Math.hypot(x - c.x, y - c.y) / c.r;
        if (dd < d[i]) { d[i] = dd; own[i] = tb.id; }
        for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + ax, ny = y + ay; if (!inb(nx, ny)) continue; const j = idx(nx, ny);
          if (vis.has(j) || w.t[j] === T.SEA || !w.seen[j] || Math.hypot(nx - c.x, ny - c.y) > c.r + .3) continue; vis.add(j); st.push(j);
        }
      }
    }
  }
  // 영토가 맞닿은 종족 쌍
  const touch = new Set();
  for (let i = 0; i < own.length; i++) { const o = own[i]; if (o < 0) continue; const x = i % W; for (const j of [i + 1, i + W]) { if (j >= own.length || (j === i + 1 && x === W - 1)) continue; const p = own[j]; if (p >= 0 && p !== o) touch.add(Math.min(o, p) + '-' + Math.max(o, p)); } }
  w.own = own; w.touch = touch; return own;
}
function counts(w, tb) {
  const c = new Array(8).fill(0); let fw = 0, fn = 0, ww = 0, wn = 0, iw = 0, gw = 0, mn = 0;
  for (let i = 0; i < w.t.length; i++) if (w.own[i] === tb.id) {
    const v = w.t[i]; c[v]++; const B = BIOMES[bioAt(w, i)];
    if (v === T.FIELD || v === T.GRASS || v === T.LAKE) { fw += B.f; fn++; } else if (v === T.FOREST) { ww += B.wd; wn++; } else if (v === T.MOUNT || v === T.VOLC) { iw += B.ir; gw += B.gd; mn++; }
  }
  c.bf = fn ? fw / fn : 1; c.bw = wn ? ww / wn : 1; c.bi = mn ? iw / mn : 1; c.bg = mn ? gw / mn : 1;
  return c;
}
const occupied = (tb, i) => tb.houses.includes(i) || tb.works.some((k) => k.i === i) || i === idx(tb.cx, tb.cy) || tb.cols.some((c) => idx(c.x, c.y) === i) || (tb.wonder != null && tb.wonder === i);
function anyOcc(w, i) { return w.tribes.some((b) => occupied(b, i)); }
function freeSpot(w, tb, types, near = true, minD = 0) {
  let best = -1, bd = 1e9; const R = rng(w.rs++ * 7 + tb.id);
  for (let i = 0; i < w.t.length; i++) {
    if (w.own[i] !== tb.id || !types.includes(w.t[i]) || anyOcc(w, i)) continue;
    const x = i % W, y = (i / W) | 0, d0 = Math.hypot(x - tb.cx, y - tb.cy); if (d0 < minD) continue; const d = d0 + R() * 1.2;
    if ((near ? d : -d) < bd) { bd = near ? d : -d; best = i; }
  }
  return best;
}

// 생산·소비 계산 (초당)
export function rates(w, tb) {
  const sp = SPECIES[tb.sp], c = tb._c || counts(w, tb), out = { food: 0, wood: 0, stone: 0, iron: 0, gold: 0, know: 0, energy: 0 };
  let hands = tb.pop * (has(tb, 'robot') ? 1.5 : 1);
  const buff = (k) => w.buffs.filter((b) => (b.tb === tb.id || b.tb < 0) && b.k === k).reduce((m, b) => m * b.m, 1);
  let all = (has(tb, 'tool') ? 1.2 : 1) * (has(tb, 'steam') ? 1.4 : 1) * buff('all');
  const eat = tb.pop * .1 * (has(tb, 'fire') ? .85 : 1);
  // 일자리 칸: 밭·초원·호수 → 식량, 숲 → 목재, 산 → 돌/철/금, 화산 → 금/철
  const field = c[T.FIELD], grass = c[T.GRASS] + c[T.SAND] * .3, lake = c[T.LAKE], forest = c[T.FOREST], mount = c[T.MOUNT], volc = c[T.VOLC];
  const foodSlots = field * 2 + grass * .6 + lake * 1.5, foodPer = (field * 2 * .5 + grass * .6 * .22 + lake * 1.5 * .3) / Math.max(.01, foodSlots);
  const jobs = { farmer: 0, lumber: 0, miner: 0, scholar: 0, soldier: 0, engineer: 0 };
  const sm = (k) => (sp.mult[k] || 1) * (isSpec(tb, k) ? 1 : NONSPEC[k] || 1);
  const foodMul = sm('food') * all * buff('food') * c.bf * (has(tb, 'wtree') ? 1.3 : 1);
  const needF = Math.ceil(eat * 1.3 / Math.max(.01, foodPer * foodMul));
  jobs.farmer = Math.min(hands, foodSlots, needF); hands -= jobs.farmer;
  jobs.soldier = has(tb, 'army') ? Math.min(hands, Math.ceil(tb.pop * .06)) : 0; hands -= jobs.soldier;
  const schoolSlots = 1 + tb.era + tb.works.filter((k) => k.k === 'school').length * 4;
  jobs.scholar = Math.min(hands, Math.max(1, Math.round(tb.pop * (.14 + tb.era * .02))), schoolSlots); hands -= jobs.scholar;
  const facSlots = tb.works.filter((k) => k.k === 'factory' || k.k === 'power').length * 4;
  jobs.engineer = Math.min(hands * .35, facSlots); hands -= jobs.engineer;
  const mineSlots = mount * 2.5 + volc * 3, woodSlots = forest * 1.5;
  const wantM = tb.era >= 1 ? .55 : .35;
  jobs.miner = Math.min(mineSlots, hands * wantM); jobs.lumber = Math.min(woodSlots, hands - jobs.miner);
  const left = hands - jobs.miner - jobs.lumber; if (left > 0) { const m2 = Math.min(mineSlots - jobs.miner, left); jobs.miner += m2; jobs.farmer += Math.min(foodSlots - jobs.farmer, left - m2); }
  tb.jobs = jobs;
  out.food = jobs.farmer * foodPer * foodMul - eat;
  out.wood = jobs.lumber * .18 * all * c.bw;
  const volcShare = volc * 3 / Math.max(.01, mineSlots);
  out.stone = jobs.miner * .12 * (1 - volcShare * .5) * (sp.mult.stone || 1) * all;
  const ug = has(tb, 'under') ? 1.3 : 1;
  if (has(tb, 'metal')) out.iron = jobs.miner * (.05 + volcShare * .05) * sm('iron') * all * c.bi * ug;
  out.gold = jobs.miner * (.012 + volcShare * .06) * sm('gold') * all * c.bg * ug;
  if (has(tb, 'trade')) out.gold += (.04 + tb.pop * .004) * (1 + (tb.partners || 0) * .3);
  out.know = jobs.scholar * .08 * sm('know') * (has(tb, 'float') ? 1.3 : 1) * (has(tb, 'write') ? 1.5 : 1) * (has(tb, 'science') ? 2 : 1) * buff('know') * all;
  out.energy = jobs.engineer * .15 * (has(tb, 'fusion') ? 3 : 1) * all;
  // 더 앞선 종족이 있으면 지식이 퍼짐
  const top = Math.max(...w.tribes.map((b) => b.era)); if (top > tb.era) out.know *= 1.35;
  tb._eat = eat;
  return out;
}

// 무엇이 부족한지 (안내용)
export function needs(w, tb) {
  const c = tb._c || counts(w, tb), n = [];
  if (c[T.FOREST] < 3) n.push({ k: 'tree', m: '숲이 부족해요 — 나무를 심어 주세요' });
  if (tb.era >= 1 && c[T.MOUNT] + c[T.VOLC] < 2) n.push({ k: 'mount', m: '산이 필요해요 — 돌·철이 나와요' });
  if (c[T.LAKE] < 1 && tb.pop > 10) n.push({ k: 'lake', m: '호수가 있으면 식량이 늘어요' });
  if (tb.res.food < 3 && tb._r && tb._r.food < 0) n.push({ k: 'food', m: '배고파요! 초원·호수를 늘리거나 비를 내려 주세요' });
  for (const k of ['iron', 'know', 'food']) {
    if (isSpec(tb, k) || (k === 'iron' && tb.era < 2) || (k === 'know' && tb.era < 1) || (k === 'food' && tb.era < 2)) continue;
    const si = SPEC_OF(k), sp2 = SPECIES[si], other = w.tribes.find((b) => b.sp === si);
    if (!other) n.push({ k: 'spec', m: `${RNAME[k]}은 ${sp2.name}이 잘 만들어요 — ${sp2.name}을 탄생시켜 교류해 보세요` });
    else if (w.met[Math.min(tb.id, other.id) + '-' + Math.max(tb.id, other.id)] !== 'trade') n.push({ k: 'spec', m: `${RNAME[k]}은 ${sp2.name}이 잘 만들어요 — 영토가 닿으면 교류를 골라 주세요` });
  }
  if (tb.era >= 3 && !has(tb, 'sail')) n.push({ k: 'sail', m: '땅이 좁아지면 \'항해\'를 연구해 새 섬을 찾아요' });
  if (tb.pop >= capOf(tb) - 1 && tb.res.wood < houseCost(tb).wood) n.push({ k: 'wood', m: '집 지을 목재가 모자라요' });
  return n;
}
export function maxHouses(tb) { return MAX_HOUSES[tb.era] + (has(tb, 'castle') ? 3 : 0) + (has(tb, 'under') ? 4 : 0) + (has(tb, 'float') ? 3 : 0) + tb.cols.length * 3; }
export function houseCost(tb) { const n = tb.houses.length; return { wood: Math.round(8 + tb.era * 6 + n * 2), stone: tb.era >= 2 ? Math.round(4 + tb.era * 4 + n) : 0 }; }
const pay = (tb, cost) => { for (const k in cost) if ((tb.res[k] || 0) < cost[k]) return false; for (const k in cost) tb.res[k] -= cost[k]; return true; };
export const WORKS = {
  field: { tech: 'farm', on: [T.GRASS], cost: { wood: 6 } },
  school: { tech: 'write', on: [T.GRASS, T.SAND, T.FIELD], cost: { wood: 40, stone: 40 } },
  factory: { tech: 'steam', on: [T.GRASS, T.SAND, T.FIELD], cost: { stone: 80, iron: 60 } },
  power: { tech: 'fusion', on: [T.GRASS, T.SAND, T.FIELD], cost: { iron: 120, gold: 60 } },
};

export function nextTech(tb) {
  const av = techsFor(tb, tb.era).filter((t) => !has(tb, t.id) && (t.req || []).every((r) => has(tb, r)));
  if (tb.research && av.some((t) => t.id === tb.research)) return TECH[tb.research];
  return av.sort((a, b) => a.cost - b.cost)[0] || null;
}
export function eraReady(tb) {
  if (tb.era >= 5) return null;
  const left = techsFor(tb, tb.era).filter((t) => !has(tb, t.id)).map((t) => t.name);
  const rq = ERA_REQ[tb.era], miss = [];
  if (left.length) miss.push('기술: ' + left.join(', '));
  if (tb.pop < rq.pop) miss.push(`인구 ${tb.pop}/${rq.pop}`);
  for (const k in rq.res) if (tb.res[k] < rq.res[k]) miss.push(`${RNAME[k]} ${Math.floor(tb.res[k])}/${rq.res[k]}`);
  return miss;
}

// ---------- 한 걸음 ----------
export function step(w, dt) {
  w.time += dt;
  territory(w);
  const faithN = w.tribes.filter((b) => has(b, 'faith')).length;
  const totalPop = w.tribes.reduce((s, b) => s + b.pop, 0);
  w.manaMax = 100 + w.tribes.reduce((s, b) => s + b.era * 30, 0);
  w.mana = Math.min(w.manaMax, w.mana + dt * (.7 + totalPop * .02) * (1 + faithN * .5 / Math.max(1, w.tribes.length)) * (1 + w.stars * .2));
  for (const k in w.cds) { w.cds[k] -= dt; if (w.cds[k] <= 0) delete w.cds[k]; }
  w.buffs = w.buffs.filter((b) => (b.t -= dt) > 0);
  for (const tb of w.tribes) stepTribe(w, tb, dt);
  tradeFlow(w, dt);
  meet(w);
  w.nextEv -= dt; if (w.nextEv <= 0 && w.tribes.length) { w.nextEv = 80 + rng(w.rs++)() * 70; randomEvent(w); }
}

function stepTribe(w, tb, dt) {
  tb._c = counts(w, tb);
  const r = rates(w, tb); tb._r = r;
  const cap = storeCap(tb);
  for (const k of RES) { tb.res[k] = Math.max(0, tb.res[k] + r[k] * dt); if (k !== 'know') tb.res[k] = Math.min(tb.res[k] , cap * (k === 'food' ? 1 : k === 'gold' || k === 'energy' ? 2 : 1)); }
  // 인구
  const sp = SPECIES[tb.sp], cap2 = capOf(tb);
  if (tb.res.food <= 0 && r.food < 0) { tb.starve += dt; if (tb.starve > 12) { tb.starve = 0; if (tb.pop > 2) { tb.pop--; logMsg(w, `${sp.name}: 굶주림으로 인구가 줄었어요`, 'bad'); } } }
  else { tb.starve = 0; if (tb.pop < cap2) { tb.grow += dt * .03 * (1 + tb.pop / 30) * sp.grow * (has(tb, 'cook') ? 1.25 : 1) * (tb.res.food > 10 ? 1 : .3); if (tb.grow >= 1) { tb.grow = 0; tb.pop++; } } }
  // 집 짓기
  if (tb.pop >= cap2 - 1 && tb.houses.length < maxHouses(tb)) { const hc = houseCost(tb); if (tb.res.wood >= hc.wood && tb.res.stone >= hc.stone) { const i = freeSpot(w, tb, [T.GRASS, T.SAND]); if (i >= 0 && pay(tb, hc)) tb.houses.push(i); } }
  // 일터 짓기
  for (const k in WORKS) {
    const wk = WORKS[k]; if (!has(tb, wk.tech)) continue;
    const n = tb.works.filter((v) => v.k === k).length;
    const want = k === 'field' ? Math.floor(tb.pop / 2.5) : k === 'school' ? 1 + Math.floor(tb.pop / 25) : k === 'factory' ? 1 + Math.floor(tb.pop / 20) : 1 + Math.floor(tb.pop / 30);
    if (n >= want) continue;
    const spot = freeSpot(w, tb, wk.on, k !== 'field');
    if (spot >= 0 && pay(tb, wk.cost)) { if (k === 'field') w.t[spot] = T.FIELD; else tb.works.push({ k, i: spot }); if (k === 'field') tb.works.push({ k, i: spot }); }
  }
  // 밭이 다른 땅으로 바뀌면 일터 목록에서 뺌
  tb.works = tb.works.filter((v) => v.k !== 'field' || w.t[v.i] === T.FIELD);
  tb.houses = tb.houses.filter((i) => w.t[i] === T.GRASS || w.t[i] === T.SAND || w.t[i] === T.FIELD);
  // 연구
  const nt = nextTech(tb);
  if (nt) {
    let ok = tb.res.know >= nt.cost;
    if (nt.id === 'rocket') ok = ok && tb.res.energy >= 500 && tb.res.gold >= 300;
    if (ok) {
      tb.res.know -= nt.cost; tb.techs.push(nt.id); tb.research = null; logMsg(w, `${sp.name}: '${nt.name}' ${nt.wonder ? '완성!' : '발견!'}`, 'good');
      if (nt.wonder) { const i = freeSpot(w, tb, nt.id === 'float' ? [T.LAKE, T.GRASS, T.SAND] : [T.GRASS, T.SAND, T.FIELD], true, 2.5); if (i >= 0) { if (w.t[i] === T.FIELD) w.t[i] = T.GRASS; tb.works = tb.works.filter((q) => q.i !== i); tb.wonder = i; } w.events.push({ k: 'wonder', tb: tb.id, id: nt.id }); }
      if (nt.id === 'rocket') { tb.res.energy -= 500; tb.res.gold -= 300; w.done = { tb: tb.id, t: w.time }; logMsg(w, `${sp.name}이 우주로 날아올랐어요! 🚀`, 'good'); }
    }
  }
  // 시대 발전
  const miss = eraReady(tb);
  if (miss && !miss.length) { const rq = ERA_REQ[tb.era]; for (const k in rq.res) tb.res[k] -= rq.res[k] * .5; tb.era++; logMsg(w, `${sp.name}이 ${ERAS[tb.era]}에 들어섰어요!`, 'era'); w.events.push({ k: 'era', tb: tb.id, era: tb.era }); }
}

// 교류: 특산물 생산량의 절반만큼 상대에게 더 생기고(나눠 줌), 준 쪽은 그 대가로 금을 받음
function tradeFlow(w, dt) {
  for (const tb of w.tribes) { tb._imp = {}; tb._exp = {}; }
  for (const key in w.met) {
    if (w.met[key] !== 'trade') continue; const [a, b] = key.split('-').map(Number), A = w.tribes[a], B = w.tribes[b]; if (!A || !B) continue;
    for (const [P, Q] of [[A, B], [B, A]]) for (const k of SPECIES[P.sp].spec) {
      const base = Math.max(0, (P._r[k] || 0) + (k === 'food' ? P._eat : 0)); if (base <= 0) continue;
      const amt = base * TRADE_SHARE * (has(P, 'trade') ? 1.5 : 1) * (has(P, 'rail') ? 1.5 : 1);
      Q.res[k] += amt * dt; P.res.gold += amt * .2 * dt;
      Q._imp[k] = (Q._imp[k] || 0) + amt; (P._exp[k] = P._exp[k] || []).push(Q.id);
    }
  }
}
// 종족끼리 만남 (영토가 맞닿으면)
function meet(w) {
  for (const a of w.tribes) for (const b of w.tribes) {
    if (a.id >= b.id) continue; const key = a.id + '-' + b.id;
    if (w.met[key]) continue;
    if (w.touch && w.touch.has(key)) { w.met[key] = 'pending'; w.events.push({ k: 'meet', a: a.id, b: b.id, choice: true }); }
  }
}
export function resolveMeet(w, a, b, how) {
  const A = w.tribes[a], B = w.tribes[b]; w.met[a + '-' + b] = how;
  if (how === 'trade') { A.partners = (A.partners || 0) + 1; B.partners = (B.partners || 0) + 1; A.res.know += 20; B.res.know += 20; logMsg(w, `${SPECIES[A.sp].name}과 ${SPECIES[B.sp].name}이 교류를 시작했어요 — 서로 특산물을 나눠요`, 'good'); return; }
  // 경쟁: 힘(인구 + 병사 + 시대)이 센 쪽이 자원을 빼앗음
  const pw = (t) => t.pop + (t.jobs.soldier || 0) * 4 + t.era * 5 + Math.random() * 6;
  const [win, lose] = pw(A) >= pw(B) ? [A, B] : [B, A];
  for (const k of ['food', 'wood', 'stone', 'iron', 'gold']) { const g = lose.res[k] * .4; lose.res[k] -= g; win.res[k] += g; }
  lose.pop = Math.max(2, Math.round(lose.pop * .8)); win.pop = Math.max(2, Math.round(win.pop * .92));
  logMsg(w, `${SPECIES[win.sp].name}이 경쟁에서 이겨 자원을 얻었어요. ${SPECIES[lose.sp].name}은 인구가 줄었어요`, 'bad');
}

// ---------- 신의 능력 · 지형 ----------
export function tribeAt(w, x, y) {
  if (!w.own) territory(w);
  const o = inb(x, y) ? w.own[idx(x, y)] : -1; if (o >= 0) return w.tribes[o];
  let best = null, bd = 1e9; for (const b of w.tribes) { const d = Math.hypot(b.cx - x, b.cy - y); if (d < bd) { bd = d; best = b; } } return best;
}
export function terraform(w, toolId, x, y) {
  const tl = TOOLS.find((t) => t.id === toolId); if (!tl || !inb(x, y)) return { ok: false };
  const i = idx(x, y), cur = w.t[i];
  if (!w.seen[i]) return { ok: false, msg: '아직 발견하지 못한 바다예요' };
  if (cur === tl.to) return { ok: false };
  if (cur === T.SEA) { if (!(tl.to === T.GRASS)) return { ok: false, msg: '바다는 초원으로만 메울 수 있어요' }; }
  if (w.tribes.some((b) => centers(b).some((c) => idx(c.x, c.y) === i))) return { ok: false, msg: '마을 중심은 바꿀 수 없어요' };
  const cost = cur === T.SEA ? tl.cost * 3 : tl.cost;
  if (w.mana < cost) return { ok: false, msg: '신력이 부족해요' };
  if (tl.to === T.VOLC && w.t.filter((v) => v === T.VOLC).length >= 2) return { ok: false, msg: '화산은 2개까지 만들 수 있어요' };
  w.mana -= cost; w.t[i] = tl.to; if (cur === T.SEA) w.isl[i] = nearIsl(w, x, y);
  for (const b of w.tribes) { b.houses = b.houses.filter((h) => h !== i || tl.to === T.GRASS); b.works = b.works.filter((k) => k.i !== i); }
  return { ok: true, cost };
}
function nearIsl(w, x, y) { for (let r = 1; r < 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (inb(x + dx, y + dy) && w.isl[idx(x + dx, y + dy)] >= 0) return w.isl[idx(x + dx, y + dy)]; return 0; }
// ---------- 항해 · 개척 ----------
export const sailors = (w) => w.tribes.filter((b) => has(b, 'sail'));
// 탐험선: 고른 곳에서 가장 가까운, 아직 못 찾은 섬을 발견
export function explore(w, x, y) {
  if (!sailors(w).length) return { ok: false, msg: '\'항해\' 기술을 연구하면 탐험선을 보낼 수 있어요' };
  const left = ISLES.map((v, k) => k).filter((k) => !w.found.includes(k)); if (!left.length) return { ok: false, msg: '주변 섬을 모두 찾았어요' };
  const cost = 30; if (w.mana < cost) return { ok: false, msg: '신력이 부족해요' };
  if (w.cds.ship) return { ok: false, msg: `${Math.ceil(w.cds.ship)}초 뒤에 다시 보낼 수 있어요` };
  left.sort((a, b) => Math.hypot(ISLES[a][0] - x, ISLES[a][1] - y) - Math.hypot(ISLES[b][0] - x, ISLES[b][1] - y));
  const k = left[0]; w.mana -= cost; w.cds.ship = 20; reveal(w, k);
  const B = BIOMES[ISLES[k][4]]; logMsg(w, `탐험선이 ${B.name}을 발견했어요!`, 'good');
  w.events.push({ k: 'island', isl: k });
  return { ok: true, isl: k };
}
export const COLONY_COST = { wood: 100, stone: 60 };
export function settle(w, tbId, x, y) {
  const tb = w.tribes[tbId]; if (!tb || !has(tb, 'sail')) return { ok: false, msg: '\'항해\'를 배운 종족만 개척할 수 있어요' };
  if (!inb(x, y)) return { ok: false }; const i = idx(x, y), v = w.t[i];
  if (!w.seen[i] || w.isl[i] <= 0) return { ok: false, msg: '탐험선으로 찾은 새 섬을 눌러 주세요' };
  if (v === T.SEA || v === T.LAKE || v === T.MOUNT || v === T.VOLC) return { ok: false, msg: '평평한 땅을 눌러 주세요' };
  if (tb.cols.length >= 2) return { ok: false, msg: '개척 마을은 종족마다 2곳까지예요' };
  for (const b of w.tribes) for (const c of centers(b)) if (Math.hypot(c.x - x, c.y - y) < 5) return { ok: false, msg: '다른 마을과 너무 가까워요' };
  for (const k in COLONY_COST) if (tb.res[k] < COLONY_COST[k]) return { ok: false, msg: `목재 ${COLONY_COST.wood} · 돌 ${COLONY_COST.stone}이 필요해요` };
  for (const k in COLONY_COST) tb.res[k] -= COLONY_COST[k];
  for (const b of w.tribes) { b.houses = b.houses.filter((h) => h !== i); b.works = b.works.filter((q) => q.i !== i); }
  if (v === T.FOREST) w.t[i] = T.GRASS;
  tb.cols.push({ x, y, isl: w.isl[i] }); territory(w);
  logMsg(w, `${SPECIES[tb.sp].name}이 ${BIOMES[ISLES[w.isl[i]][4]].name}에 개척 마을을 세웠어요!`, 'good');
  return { ok: true };
}

export function usePower(w, id, x, y) {
  const p = POWERS.find((q) => q.id === id); if (!p) return { ok: false };
  if (w.cds[id]) return { ok: false, msg: `${Math.ceil(w.cds[id])}초 뒤에 다시 쓸 수 있어요` };
  if (w.mana < p.cost) return { ok: false, msg: '신력이 부족해요' };
  const tb = tribeAt(w, x, y); if (!tb && id !== 'quake') return { ok: false, msg: '먼저 생명을 탄생시켜 주세요' };
  w.mana -= p.cost; w.cds[id] = p.cd;
  const sp = tb ? SPECIES[tb.sp].name : '';
  switch (id) {
    case 'bless': w.buffs.push({ tb: tb.id, k: 'all', m: 1.6, t: 40, name: '축복' }); break;
    case 'rain': tb.res.food += 15 + tb.pop * 2; w.buffs = w.buffs.filter((b) => !(b.k === 'food' && b.m < 1 && b.tb === tb.id)); w.buffs.push({ tb: tb.id, k: 'food', m: 1.3, t: 30, name: '비' });
      { const R = rng(w.rs++); for (let k = 0; k < 4; k++) { const xx = x + Math.round(R() * 6 - 3), yy = y + Math.round(R() * 6 - 3); if (inb(xx, yy) && w.t[idx(xx, yy)] === T.GRASS && !anyOcc(w, idx(xx, yy))) w.t[idx(xx, yy)] = T.FOREST; } } break;
    case 'bolt': tb.res.energy += 20 + tb.era * 15; tb.res.know += 6 + tb.era * 12; break;
    case 'quake': {
      let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (!inb(xx, yy)) continue; const j = idx(xx, yy); if (w.t[j] === T.SEA || !w.seen[j] || w.tribes.some((b) => centers(b).some((c) => idx(c.x, c.y) === j))) continue; if (Math.abs(dx) + Math.abs(dy) <= 1 || Math.random() < .4) { w.t[j] = T.MOUNT; n++; for (const b of w.tribes) { b.houses = b.houses.filter((h) => h !== j); b.works = b.works.filter((k) => k.i !== j); } } }
      if (tb) { tb.res.stone += 15; if (has(tb, 'metal')) tb.res.iron += 8; }
      break;
    }
    case 'plenty': tb.pop = Math.max(tb.pop, Math.min(capOf(tb) + 3, tb.pop + Math.max(2, Math.round(tb.pop * .08)))); tb.res.food += 10; break;
    case 'wisdom': w.buffs.push({ tb: tb.id, k: 'know', m: 2, t: 45, name: '지혜' }); break;
  }
  return { ok: true, tb, msg: tb ? `${sp}에게 ${p.name}!` : p.name };
}

// ---------- 랜덤 사건 ----------
export const EVENTS = ['harvest', 'plague', 'volcano', 'inventor', 'golden', 'drought', 'fire'];
export function randomEvent(w, force) {
  const R = rng(w.rs++); const tb = w.tribes[Math.floor(R() * w.tribes.length)]; if (!tb) return;
  const vol = w.t.some((v, i) => v === T.VOLC && w.own[i] >= 0), forests = tb._c ? tb._c[T.FOREST] : 0, sp = SPECIES[tb.sp].name;
  let pool = ['harvest', 'inventor', 'golden', 'drought'];
  if (tb.pop >= 10) pool.push('plague'); if (vol) pool.push('volcano', 'volcano'); if (forests >= 8) pool.push('fire');
  const k = force || pool[Math.floor(R() * pool.length)];
  const ev = { k, tb: tb.id };
  switch (k) {
    case 'harvest': w.buffs.push({ tb: tb.id, k: 'food', m: 2, t: 45, name: '풍년' }); ev.m = `${sp}에 풍년이 들었어요! 45초 동안 식량 2배`; break;
    case 'inventor': w.buffs.push({ tb: tb.id, k: 'know', m: 1.8, t: 60, name: '발명가' }); tb.res.know += 10 + tb.era * 10; ev.m = `${sp}에 위대한 발명가가 나타났어요! 연구 가속`; break;
    case 'golden': w.buffs.push({ tb: tb.id, k: 'all', m: 1.5, t: 45, name: '황금시대' }); ev.m = `${sp}의 황금시대! 45초 동안 모든 생산 +50%`; break;
    case 'drought': w.buffs.push({ tb: tb.id, k: 'food', m: .5, t: 40, name: '가뭄' }); ev.m = `${sp}에 가뭄이 들었어요. 비를 내리면 끝나요`; ev.hint = 'rain'; break;
    case 'plague': ev.m = `${sp}에 전염병이 돌아요! 신력 20으로 치유할까요?`; ev.choice = true; ev.cost = 20; break;
    case 'volcano': {
      const vs = []; w.t.forEach((v, i) => { if (v === T.VOLC && w.own[i] >= 0) vs.push(i); }); const vi = vs[Math.floor(R() * vs.length)], vx = vi % W, vy = (vi / W) | 0;
      let lost = 0; for (const b of w.tribes) { const before = b.houses.length + b.works.length; b.houses = b.houses.filter((h) => Math.hypot(h % W - vx, ((h / W) | 0) - vy) > 2.2); b.works = b.works.filter((q) => Math.hypot(q.i % W - vx, ((q.i / W) | 0) - vy) > 2.2); lost += before - b.houses.length - b.works.length; }
      const near = tribeAt(w, vx, vy); near.res.gold += 30 + near.era * 15; near.res.iron += has(near, 'metal') ? 30 : 0; near.res.stone += 30;
      ev.m = `화산이 폭발했어요! ${SPECIES[near.sp].name}이 금·광물을 얻었어요` + (lost ? ` (건물 ${lost}채 파괴)` : ''); ev.x = vx; ev.y = vy; break;
    }
    case 'fire': { let n = 0; const R2 = rng(w.rs++); for (let i = 0; i < w.t.length && n < 4; i++) if (w.own[i] === tb.id && w.t[i] === T.FOREST && R2() < .3) { w.t[i] = T.GRASS; n++; } tb.res.wood += 20; ev.m = `${sp}의 숲에 산불이 났어요. 숲 ${n}칸이 초원이 됐어요`; break; }
  }
  w.events.push(ev); if (!ev.choice) logMsg(w, ev.m, k === 'drought' || k === 'fire' ? 'bad' : 'good');
  return ev;
}
export function resolvePlague(w, tbId, heal) {
  const tb = w.tribes[tbId];
  if (heal && w.mana >= 20) { w.mana -= 20; logMsg(w, `${SPECIES[tb.sp].name}의 전염병을 치유했어요`, 'good'); return true; }
  tb.pop = Math.max(2, Math.round(tb.pop * .8)); logMsg(w, `${SPECIES[tb.sp].name}: 전염병으로 인구가 줄었어요`, 'bad'); return false;
}

export function score(w) { return Math.round(w.tribes.reduce((s, b) => s + b.pop * 10 + b.era * 500 + b.techs.length * 60 + b.cols.length * 300, 0) + (w.found.length - 1) * 200 + w.stars * 3000); }
