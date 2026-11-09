// 성을 지켜라 — 맵·유닛·타워·영웅 데이터 (화면과 분리)

// ---------- 헥스 좌표 (뾰족한 꼭짓점이 위아래, 폭 2) ----------
// 방향: 0=동 1=북동 2=북서 3=서 4=남서 5=남동  (화면 위쪽 = 북)
export const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
export const offToAx = (c, r) => [c - (r - (r & 1)) / 2, r];
export const axToOff = (q, r) => [q + (r - (r & 1)) / 2, r];
export const HX = 2, HZ = 1.7320508;
export const COLS = 10, ROWS = 14;
const CX = (COLS - 1) / 2 * HX + HX / 4, CZ = (ROWS - 1) / 2 * HZ;
export function axToWorld(q, r) { return [HX * (q + r / 2) - CX, HZ * r - CZ]; }
export function worldToAx(x, z) {
  // 가장 가까운 헥스 (큐브 좌표 반올림)
  const fr = (z + CZ) / HZ, fq = (x + CX) / HX - fr / 2;
  let rx = Math.round(fq), rz = Math.round(fr), ry = Math.round(-fq - fr);
  const dx = Math.abs(rx - fq), dz = Math.abs(rz - fr), dy = Math.abs(ry + fq + fr);
  if (dx > dy && dx > dz) rx = -ry - rz; else if (dz > dy) rz = -rx - ry;
  return [rx, rz];
}
export const key = (q, r) => q + ',' + r;

// ---------- 길 (적 진영 → 성) ----------
const MOVES = 'SW SW W W SW SE SE E E E E SE SW W W W SW SE SE E E SE SW'.split(' ');
const DN = { E: 0, NE: 1, NW: 2, W: 3, SW: 4, SE: 5 };
export function buildMap() {
  let q = 5, r = 0; const path = [[q, r]], dirs = [];
  for (const m of MOVES) { const d = DN[m]; dirs.push(d); q += DIRS[d][0]; r += DIRS[d][1]; path.push([q, r]); }
  const road = new Map(); // key -> {q,r,i,in,out}
  path.forEach(([q, r], i) => road.set(key(q, r), { q, r, i, inD: i > 0 ? (dirs[i - 1] + 3) % 6 : 2, outD: i < dirs.length ? dirs[i] : null }));
  // 타워 자리: 길 옆 빈 땅 중 고른 곳 (너무 많지 않게)
  const tiles = [];
  for (let rr = -2; rr < ROWS + 2; rr++) for (let cc = -2; cc < COLS + 2; cc++) {
    const [aq, ar] = offToAx(cc, rr), k = key(aq, ar);
    const inside = cc >= 0 && cc < COLS && rr >= 0 && rr < ROWS;
    let near = 99;
    for (const p of path) near = Math.min(near, hexDist(aq, ar, p[0], p[1]));
    tiles.push({ q: aq, r: ar, c: cc, rr, inside, road: road.get(k) || null, near });
  }
  // 타워 자리: 길 바로 옆 빈 땅 중 서로 한 칸 이상 떨어진 곳 (성·적 진영 바로 옆은 제외)
  const [sq, sr] = path[0], [eq, er] = path[path.length - 1];
  const cand = tiles.filter((t) => t.inside && !t.road && t.near === 1 && hexDist(t.q, t.r, sq, sr) > 1 && hexDist(t.q, t.r, eq, er) > 1)
    .sort((a, b) => a.r - b.r || a.q - b.q);
  const picked = [];
  for (const t of cand) {
    // 길이 여러 칸 닿는 자리를 먼저 (길 굽이 안쪽)
    t.touch = DIRS.filter(([dq, dr]) => road.has(key(t.q + dq, t.r + dr))).length;
  }
  cand.sort((a, b) => b.touch - a.touch || a.r - b.r);
  for (const t of cand) if (picked.every((p) => hexDist(p.q, p.r, t.q, t.r) >= 2)) picked.push(t);
  for (const t of picked) t.slot = true;
  return { path, dirs, road, tiles };
}
export function hexDist(q1, r1, q2, r2) { const dq = q1 - q2, dr = r1 - r2; return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2; }

// ---------- 적 (Tiny Swords 군대) ----------
export const ENEMY = {
  pawn: { name: '졸병', hp: 26, spd: 1.25, gold: 4, dmg: 4, size: .95 },
  warrior: { name: '전사', hp: 66, spd: .9, gold: 7, dmg: 8, armor: .25, size: 1.05 },
  lancer: { name: '창기병', hp: 52, spd: 1.65, gold: 7, dmg: 7, size: 1.0 },
  archer: { name: '궁수', hp: 38, spd: 1.0, gold: 6, dmg: 5, ranged: 3.2, size: .95 },
  monk: { name: '수도승', hp: 48, spd: 1.0, gold: 8, dmg: 3, heal: 1, size: .95 },
};
export const TIER = { red: { hp: 1, gold: 1, name: '' }, purple: { hp: 2.3, gold: 1.7, name: '정예 ' }, black: { hp: 6.5, gold: 8, name: '대장 ', size: 1.55 } };
export const WAVES = 20;
// 웨이브 구성: [종류, 색, 수, 간격(초)]
export function waveGroups(w) {
  const G = [], p = w >= 8 ? 'purple' : 'red', mix = (t, col, n, gap) => G.push([t, col, n, gap]);
  mix('pawn', 'red', 5 + Math.min(10, w), .8);
  if (w >= 2) mix('warrior', w >= 10 ? 'purple' : 'red', 2 + Math.floor(w / 2), 1.1);
  if (w >= 3) mix('archer', w >= 12 ? 'purple' : 'red', 1 + Math.floor(w / 3), 1.2);
  if (w >= 4) mix('lancer', p, 2 + Math.floor(w / 3), .7);
  if (w >= 6) mix('monk', p, 1 + Math.floor(w / 6), 1.5);
  if (w >= 9) mix('pawn', 'purple', 4 + Math.floor(w / 2), .6);
  if (w % 5 === 0) mix(['warrior', 'lancer', 'warrior', 'lancer'][w / 5 - 1], 'black', w === 20 ? 2 : 1, 3);
  return G;
}
export const waveHp = (w) => Math.pow(1.098, w - 1);

// ---------- 타워 (헥스 팩 건물) ----------
export const TOWERS = {
  archer: { name: '궁수탑', model: 'building_tower_A_blue', desc: '빠른 화살로 한 적을 공격', cost: [60, 90, 140], dmg: [9, 16, 28], rate: [.75, .65, .55], range: [3.3, 3.7, 4.1], proj: 'arrow' },
  cannon: { name: '투석기', model: 'building_tower_catapult_blue', desc: '돌을 던져 주변 적까지 피해', cost: [90, 130, 200], dmg: [26, 46, 78], rate: [2.1, 1.95, 1.8], range: [3.6, 4, 4.4], splash: [1.2, 1.35, 1.5], proj: 'rock' },
  magic: { name: '마법탑', model: 'building_tower_B_blue', desc: '마법 구슬 · 맞은 적은 느려짐', cost: [80, 120, 180], dmg: [14, 25, 42], rate: [1.1, 1, .9], range: [3.4, 3.8, 4.2], slow: [.4, .5, .6], proj: 'magic' },
};
export const sellValue = (type, lv) => Math.floor(TOWERS[type].cost.slice(0, lv + 1).reduce((a, b) => a + b, 0) * .6);

// ---------- 영웅 (KayKit Adventurers) ----------
export const HEROES = {
  Knight: { name: '기사', role: '튼튼한 근접', hp: 260, atk: 16, rate: .9, range: 1.1, spd: 2.6, r: 'sword', l: 'shield',
    s: [{ id: 'spin', name: '회전 베기', cd: 8, d: '주변 적 모두에게 큰 피해' }, { id: 'guard', name: '수호의 외침', cd: 18, d: '6초 동안 받는 피해 70% 감소 + 주변 적 기절' }] },
  Barbarian: { name: '바바리안', role: '강력한 근접', hp: 220, atk: 24, rate: 1.15, range: 1.2, spd: 2.5, r: 'axe',
    s: [{ id: 'slam', name: '대지 강타', cd: 9, d: '넓은 범위 피해 + 1.5초 기절' }, { id: 'rage', name: '광폭화', cd: 20, d: '8초 동안 공격 속도 2배' }] },
  Mage: { name: '마법사', role: '원거리 광역', hp: 150, atk: 14, rate: 1.1, range: 3.6, spd: 2.4, r: 'staff', l: 'book', bolt: 1,
    s: [{ id: 'meteor', name: '메테오', cd: 10, d: '적이 많은 곳에 운석 낙하' }, { id: 'frost', name: '얼음 폭발', cd: 16, d: '주변 적을 2.5초 얼림' }] },
  Ranger: { name: '레인저', role: '원거리 연사', hp: 160, atk: 11, rate: .55, range: 4.2, spd: 2.8, l: 'bow', arrow: 1,
    s: [{ id: 'rain', name: '화살비', cd: 9, d: '적이 많은 곳에 화살 세례' }, { id: 'pierce', name: '관통 사격', cd: 14, d: '길게 꿰뚫는 강한 화살' }] },
  Rogue: { name: '도적', role: '빠른 연타', hp: 180, atk: 10, rate: .45, range: 1.1, spd: 3.2, r: 'dagger', l: 'dagger',
    s: [{ id: 'shadow', name: '그림자 습격', cd: 8, d: '근처 적 5명을 순식간에 베기' }, { id: 'poison', name: '독 안개', cd: 15, d: '6초 동안 주변에 독 피해' }] },
};
export const HERO_IDS = Object.keys(HEROES);
export const heroXp = (lv) => 40 + lv * 35;
