// 마녀 키우기 — 규칙·수치·전투 (DOM 없음: 브라우저와 node 밸런스 시뮬이 같이 씀)
// 좌표 단위: 월드 픽셀. 시간: 초.

export const GAME_LEN = 15 * 60;          // 15분 버티면 마지막 보스
export const BOSS_AT = [180, 360, 540, 720]; // 3분마다 보스
export const ELITE_EVERY = 60;

// ---------- 몬스터 ----------
// art: 'ts' = Tiny Swords 군대(units.json), 'slime'/'soldier' = 새 팩(96px 시트)
export const MON = {
  slime:   { name: '슬라임', art: 'slime',   hp: 14, spd: 78,  dmg: 6,  r: 13, xp: 1 },
  soldier: { name: '병사',   art: 'soldier', hp: 26, spd: 86,  dmg: 8,  r: 15, xp: 2 },
  pawn:    { name: '졸병',   art: 'ts',      hp: 20, spd: 96,  dmg: 7,  r: 15, xp: 1 },
  warrior: { name: '전사',   art: 'ts',      hp: 48, spd: 72,  dmg: 11, r: 18, xp: 3, armor: .25 },
  lancer:  { name: '창기병', art: 'ts',      hp: 34, spd: 138, dmg: 10, r: 18, xp: 2 },
  archer:  { name: '궁수',   art: 'ts',      hp: 26, spd: 74,  dmg: 8,  r: 15, xp: 2, ranged: 250 },
  monk:    { name: '수도승', art: 'ts',      hp: 32, spd: 74,  dmg: 6,  r: 15, xp: 3, heal: 1 },
};
export const TIER = { red: { hp: 1, dmg: 1, xp: 1, s: 1 }, purple: { hp: 2.6, dmg: 1.5, xp: 3, s: 1.08 }, black: { hp: 6, dmg: 2, xp: 6, s: 1.15 } };
// 시간대별 등장 목록 [초, 종류, 색, 가중치]
const POOL = [
  [0, 'slime', 'red', 5], [0, 'pawn', 'red', 3], [25, 'soldier', 'red', 4], [70, 'lancer', 'red', 2], [100, 'archer', 'red', 2],
  [150, 'warrior', 'red', 3], [210, 'monk', 'red', 1], [240, 'pawn', 'purple', 3], [300, 'lancer', 'purple', 2], [330, 'soldier', 'red', 3],
  [390, 'warrior', 'purple', 3], [420, 'archer', 'purple', 2], [480, 'slime', 'red', 4], [540, 'monk', 'purple', 1], [600, 'lancer', 'black', 1],
  [660, 'warrior', 'black', 1], [720, 'pawn', 'black', 2],
];
export const hpScale = (t) => 1 + t / 60 * .42 + Math.pow(t / 300, 2) * .9;
export const spawnRate = (t) => Math.min(11, 2.4 + t / 32);     // 마리/초
export const maxAlive = (t) => Math.min(220, 70 + t / 4);
export const xpNeed = (L) => Math.round(4 + L * 2.5 + L * L * .55);

// ---------- 카드 ----------
// cat: atk(공격 스킬) buff debuff hp xp · max: 최대 레벨 · once: 1회용
export const CARDS = {
  meteor:   { cat: 'atk', name: '메테오 소나기', d: ['운석 3개', '운석 4개', '운석 5개 · 피해 +', '운석 6개', '운석 8개 + 거대 운석 각성'] },
  thunder:  { cat: 'atk', name: '천둥 심판',     d: ['낙뢰 4명', '낙뢰 5명', '낙뢰 6명 · 피해 +', '낙뢰 8명', '낙뢰 10명 + 번개 폭풍 각성'] },
  tornado:  { cat: 'atk', name: '회오리 폭풍',   d: ['회오리 1개', '빨아들이는 힘 +', '회오리 2개', '피해 +', '회오리 3개 → 거대 토네이도 각성'] },
  frost:    { cat: 'atk', name: '빙결 폭발',     d: ['1초 얼림', '범위 +', '1.6초 얼림', '범위 +', '2.5초 얼림 + 얼음 파편 각성'] },
  dragon:   { cat: 'atk', name: '화염 용',       d: ['불의 용이 화면을 가로지름', '피해 +', '더 굵은 불길', '재사용 빨라짐', '용 2마리 엇갈림 각성'] },
  blackhole:{ cat: 'atk', name: '블랙홀',        d: ['2초 흡입 후 폭발', '2.5초', '3초 · 범위 +', '3.5초', '4초 · 범위 2배 · 폭발 2번 각성'] },
  swords:   { cat: 'atk', name: '회전 빛의 검',  d: ['검 2자루', '검 3자루', '검 4자루', '검 5자루', '검 6자루 + 사방 투척 각성'] },
  pillars:  { cat: 'atk', name: '성광 기둥',     d: ['빛기둥 3개', '빛기둥 4개', '빛기둥 5개', '빛기둥 6개', '빛기둥 7개 + 십자 빛 폭발 각성'] },
  laser:    { cat: 'atk', name: '마력 레이저',   d: ['회전 레이저 1줄', '길이 +', '레이저 2줄', '피해 +', '레이저 3줄 · 굵기 2배 · 둔화 각성'] },
  stars:    { cat: 'atk', name: '별의 파편',     d: ['유도탄 6발', '8발', '10발', '13발', '16발 + 별 폭발 각성'] },
  atk:   { cat: 'buff', name: '마력 증폭',   d: ['공격력 +15%'] },
  aspd:  { cat: 'buff', name: '속사',        d: ['기본 공격 속도 +15%'] },
  cdr:   { cat: 'buff', name: '시간 가속',   d: ['스킬 재사용 시간 −10%'] },
  area:  { cat: 'buff', name: '확장 마법',   d: ['스킬 범위 +15%'] },
  multi: { cat: 'buff', name: '다중 시전',   d: ['기본 공격 구슬 +1개'] },
  crit:  { cat: 'buff', name: '급소 포착',   d: ['치명타 확률 +8% · 치명 피해 +20%'] },
  speed: { cat: 'buff', name: '바람의 걸음', d: ['이동 속도 +10%'] },
  dash:  { cat: 'buff', name: '질풍 대시',   d: ['맞기 직전 자동 대시 회피 (8초)', '7초', '6초', '5초', '4초'] },
  slow:  { cat: 'debuff', name: '끈적한 대지', d: ['주변 적 이동 속도 −15%'] },
  mark:  { cat: 'debuff', name: '약점 표식',   d: ['기본 공격에 맞은 적이 받는 피해 +15%'] },
  burn:  { cat: 'debuff', name: '업화',        d: ['모든 공격에 화상 추가'] },
  fear:  { cat: 'debuff', name: '공포의 오라', d: ['가까이 온 적을 밀쳐냄'] },
  shock: { cat: 'debuff', name: '감전',        d: ['맞은 적 10% 확률로 0.5초 기절'] },
  curse: { cat: 'debuff', name: '쇠약의 저주', d: ['새로 나오는 적 체력 −8%'] },
  tough:  { cat: 'hp', name: '강인함',     d: ['최대 체력 +20% · 모두 회복'] },
  regen:  { cat: 'hp', name: '재생',       d: ['초당 체력 1% 회복'] },
  vamp:   { cat: 'hp', name: '흡혈',       d: ['적 처치 때 체력 회복'] },
  barrier:{ cat: 'hp', name: '수호의 결계', d: ['10초마다 피격 1번 막기', '9초', '7초', '6초', '5초'] },
  potion: { cat: 'hp', name: '응급 물약',   d: ['체력 50% 바로 회복'], once: 1 },
  wisdom: { cat: 'xp', name: '지혜',       d: ['경험치 +20%'] },
  magnet: { cat: 'xp', name: '수정 자석',   d: ['보석 흡수 범위 +40%'] },
  xpstorm:{ cat: 'xp', name: '경험치 폭풍', d: ['화면의 보석 모두 흡수'], once: 1 },
  luck:   { cat: 'xp', name: '행운',       d: ['카드 4장 중 선택'], max: 1 },
  reroll: { cat: 'xp', name: '다시 뽑기',   d: ['카드 다시 뽑기 +2회'] },
};
export const ATK_IDS = Object.keys(CARDS).filter((k) => CARDS[k].cat === 'atk');
export const MAX_ATK = 5;
export const cardMax = (id) => CARDS[id].max || (CARDS[id].once ? 99 : 5);
export function cardDesc(id, nextLv) { const d = CARDS[id].d; return d[Math.min(d.length - 1, nextLv - 1)]; }

// ---------- 게임 ----------
let UID = 1;
export function newGame(o = {}) {
  const G = {
    t: 0, over: false, win: false, rnd: o.rnd || Math.random,
    view: { w: o.vw || 460, h: o.vh || 820 },
    h: { x: 0, y: 0, vx: 0, vy: 0, hp: 100, max: 100, face: 0, inv: 0, dash: 0, dashCd: 0, dashDir: [0, 1], dead: false, hurtT: 0, autoDashCd: 0, barrierCd: 0, shield: false, atkT: 0 },
    lv: 1, xp: 0, kills: 0, gold: 0,
    sk: {},               // 카드 레벨
    cd: {},               // 스킬 재사용
    mons: [], shots: [], gems: [], zones: [], ev: [],
    spawnAcc: 0, nextElite: ELITE_EVERY, bossIdx: 0, boss: null, finalBoss: false,
    rerolls: 0, pending: 0, choices: null,
    stats: { dmg: 0 },
  };
  return G;
}
const R = (G, a, b) => a + G.rnd() * (b - a);
const L = (G, id) => G.sk[id] || 0;
// 파생 능력치
export function S(G) {
  const k = (id) => L(G, id);
  return {
    atk: Math.pow(1.15, k('atk')), aspd: Math.pow(1.15, k('aspd')), cdr: Math.pow(.9, k('cdr')), area: 1 + .15 * k('area'),
    orbs: 1 + k('multi'), crit: .05 + .08 * k('crit'), critD: 1.6 + .2 * k('crit'), speed: 175 * (1 + .1 * k('speed')),
    xp: 1 + .2 * k('wisdom'), magnet: 105 * (1 + .4 * k('magnet')),
  };
}

// ---------- 소환 ----------
function pickType(G) {
  const av = POOL.filter((p) => p[0] <= G.t); let tot = 0; for (const p of av) tot += p[3];
  let r = G.rnd() * tot; for (const p of av) { r -= p[3]; if (r <= 0) return p; } return av[0];
}
export function spawn(G, type, col, o = {}) {
  const M = MON[type], T = TIER[col], h = G.h;
  const a = o.a ?? R(G, 0, Math.PI * 2), d = o.d ?? Math.hypot(G.view.w, G.view.h) / 2 + 40;
  const hp = M.hp * T.hp * hpScale(G.t) * (o.hpMul || 1) * (1 - .08 * L(G, 'curse'));
  const m = { id: UID++, type, col, M, x: h.x + Math.cos(a) * d, y: h.y + Math.sin(a) * d, hp, max: hp, spd: M.spd * (o.spdMul || 1) * R(G, .92, 1.08),
    dmg: M.dmg * .7 * T.dmg * (1 + G.t / 600) * (o.dmgMul || 1), r: M.r * (o.size || 1) * T.s, size: (o.size || 1) * T.s, xp: M.xp * T.xp * (o.xpMul || 1),
    face: 1, frame: G.rnd() * 8, hitT: 0, atkT: 0, cd: R(G, .3, 1), slowT: 0, slow: 0, stun: 0, freeze: 0, burn: 0, burnD: 0, mark: 0, dead: 0, kb: [0, 0], elite: !!o.elite, boss: !!o.boss };
  G.mons.push(m); return m;
}
function spawnStep(G, dt) {
  const alive = G.mons.length;
  G.spawnAcc += dt * spawnRate(G.t);
  while (G.spawnAcc >= 1) {
    G.spawnAcc -= 1; if (alive >= maxAlive(G.t)) continue;
    const [, type, col] = pickType(G);
    // 가끔 무리로 (같은 방향에서 4~6마리)
    if (G.rnd() < .12) { const a = R(G, 0, 6.28), n = 4 + (G.rnd() * 3 | 0); for (let i = 0; i < n; i++) spawn(G, type, col, { a: a + (i - n / 2) * .09 }); }
    else spawn(G, type, col);
  }
  if (G.t >= G.nextElite) { G.nextElite += ELITE_EVERY; const [, type] = pickType(G); spawn(G, type, 'purple', { elite: true, hpMul: 6, size: 1.45, xpMul: 6, dmgMul: 1.3 }); G.ev.push({ e: 'elite' }); }
  if (G.bossIdx < BOSS_AT.length && G.t >= BOSS_AT[G.bossIdx]) {
    const kinds = ['warrior', 'lancer', 'warrior', 'lancer'];
    G.boss = spawn(G, kinds[G.bossIdx], 'black', { boss: true, hpMul: 5 + G.bossIdx * 2.5, size: 2.3, xpMul: 25, dmgMul: 1.6, spdMul: .85 });
    G.boss.hp = G.boss.max = [2500, 5000, 8000, 12000][G.bossIdx]; G.boss.spd = 128; G.bossIdx++; G.ev.push({ e: 'boss', n: G.bossIdx });
  }
  if (!G.finalBoss && G.t >= GAME_LEN) {
    G.finalBoss = true; G.boss = spawn(G, 'warrior', 'black', { boss: true, hpMul: 24, size: 3, xpMul: 0, dmgMul: 2.2, spdMul: .9 });
    G.boss.final = true; G.boss.spd = 120; G.boss.hp = G.boss.max = 16000; G.ev.push({ e: 'final' });
  }
}

// ---------- 피해 ----------
export function hit(G, m, base, o = {}) {
  if (m.dead) return 0;
  const st = S(G); let d = base * st.atk, crit = false;
  if (!o.noCrit && G.rnd() < st.crit) { d *= st.critD; crit = true; }
  if (m.mark > 0) d *= 1 + .15 * L(G, 'mark');
  d *= 1 - (m.M.armor || 0) * (o.pierceArmor ? 0 : 1);
  m.hp -= d; m.hitT = .12; G.stats.dmg += d;
  if (o.kb) { const dx = m.x - (o.fx ?? G.h.x), dy = m.y - (o.fy ?? G.h.y), l = Math.hypot(dx, dy) || 1, k = o.kb / (m.boss ? 6 : m.elite ? 2.5 : 1); m.kb[0] += dx / l * k; m.kb[1] += dy / l * k; }
  if (L(G, 'burn') && !o.noBurn) { m.burn = 2; m.burnD = Math.max(m.burnD, 3 * L(G, 'burn') * (1 + G.t / 300)); }
  if (L(G, 'shock') && !m.boss && G.rnd() < .1 * L(G, 'shock')) m.stun = Math.max(m.stun, .5);
  if (!o.quiet) G.ev.push({ e: 'dmg', x: m.x, y: m.y - m.r * 2, d, crit, c: o.c || '' });
  if (m.hp <= 0) kill(G, m);
  return d;
}
function kill(G, m) {
  m.dead = .001; G.kills++;
  const n = m.boss ? 12 : m.elite ? 5 : 1, v = m.xp / n;
  for (let i = 0; i < n; i++) G.gems.push({ x: m.x + R(G, -14, 14) * (n > 1 ? 2 : 0), y: m.y + R(G, -14, 14) * (n > 1 ? 2 : 0), v, big: v >= 4, mag: false });
  if (L(G, 'vamp')) G.h.hp = Math.min(G.h.max, G.h.hp + .35 * L(G, 'vamp'));
  if (m.frozenKill && L(G, 'frost') >= 5) { G.ev.push({ e: 'fx', k: 'shatter', x: m.x, y: m.y }); for (const o of G.mons) if (!o.dead && o !== m && dist(o, m) < 70) hit(G, o, 26, { c: 'b', noBurn: 1 }); }
  G.ev.push({ e: 'kill', x: m.x, y: m.y, type: m.type, col: m.col, boss: m.boss, elite: m.elite, size: m.size });
  if (m === G.boss) { G.boss = null; if (m.final) { G.over = true; G.win = true; G.ev.push({ e: 'win' }); } }
}
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function hurtHero(G, d) {
  const h = G.h; if (h.inv > 0 || h.dead || G.over) return;
  if (L(G, 'dash') && h.autoDashCd <= 0) { h.autoDashCd = 9 - L(G, 'dash'); startDash(G, true); G.ev.push({ e: 'dodge' }); return; }
  if (h.shield) { h.shield = false; h.barrierCd = [10, 9, 7, 6, 5][L(G, 'barrier') - 1]; h.inv = .4; G.ev.push({ e: 'block' }); return; }
  h.hp -= d; h.hurtT = .25; h.inv = .45; G.ev.push({ e: 'hurt', d });
  if (h.hp <= 0) { h.hp = 0; h.dead = true; G.over = true; G.ev.push({ e: 'dead' }); }
}
export function startDash(G, auto) {
  const h = G.h; if (h.dash > 0) return false;
  if (!auto) { if (h.dashCd > 0) return false; h.dashCd = 2.2; }
  let [dx, dy] = Math.hypot(h.vx, h.vy) > 1 ? [h.vx, h.vy] : h.dashDir; const l = Math.hypot(dx, dy) || 1; h.dashDir = [dx / l, dy / l];
  h.dash = .2; h.inv = Math.max(h.inv, .35); G.ev.push({ e: 'dash', x: h.x, y: h.y }); return true;
}

// ---------- 카드 고르기 ----------
export function rollChoices(G) {
  const n = L(G, 'luck') ? 4 : 3, owned = ATK_IDS.filter((k) => L(G, k) > 0).length;
  const pool = [];
  for (const id in CARDS) {
    const C = CARDS[id], lv = L(G, id);
    if (lv >= cardMax(id)) continue;
    if (C.cat === 'atk' && !lv && owned >= MAX_ATK) continue;
    if (id === 'potion' && G.h.hp > G.h.max * .5) continue;
    if (id === 'xpstorm' && G.gems.length < 25) continue;
    let w = C.cat === 'atk' ? (lv ? 9 : 7) : C.cat === 'buff' ? 4 : 3;
    if (id === 'potion') w = 10;
    if (lv) w += 2; // 키운 카드가 잘 나오게
    if (G.lv <= 3 && C.cat === 'atk') w *= 3; // 초반엔 공격 스킬 위주
    pool.push([id, w]);
  }
  const out = [];
  while (out.length < n && pool.length) {
    let tot = 0; for (const p of pool) tot += p[1]; let r = G.rnd() * tot, i = 0;
    for (; i < pool.length; i++) { r -= pool[i][1]; if (r <= 0) break; }
    out.push(pool[Math.min(i, pool.length - 1)][0]); pool.splice(Math.min(i, pool.length - 1), 1);
  }
  if (!out.length) out.push('potion');
  G.choices = out; return out;
}
export function choose(G, id) {
  const C = CARDS[id]; if (!C) return;
  if (id === 'potion') G.h.hp = Math.min(G.h.max, G.h.hp + G.h.max * .5);
  else if (id === 'xpstorm') { for (const g of G.gems) g.mag = true; }
  else {
    G.sk[id] = (G.sk[id] || 0) + 1;
    if (id === 'tough') { G.h.max = Math.round(G.h.max * 1.2); G.h.hp = G.h.max; }
    if (id === 'reroll') G.rerolls += 2;
    if (id === 'barrier' && L(G, 'barrier') === 1) G.h.shield = true;
    if (C.cat === 'atk' && G.cd[id] == null) G.cd[id] = .3;
  }
  G.choices = null; G.pending = Math.max(0, G.pending - 1);
  G.ev.push({ e: 'pick', id, lv: G.sk[id] || 1 });
  if (G.pending > 0) rollChoices(G);
}
export function reroll(G) { if (G.rerolls <= 0 || !G.choices) return; G.rerolls--; rollChoices(G); }

// ---------- 스킬 ----------
const near = (G, x, y, r) => G.mons.filter((m) => !m.dead && Math.hypot(m.x - x, m.y - y) < r + m.r);
function onScreen(G) { const h = G.h, w = G.view.w / 2 + 20, hh = G.view.h / 2 + 20; return G.mons.filter((m) => !m.dead && Math.abs(m.x - h.x) < w * (m.boss ? 1.6 : 1) && Math.abs(m.y - h.y) < hh * (m.boss ? 1.3 : 1)); }
function densest(G, r) {
  const list = onScreen(G); let best = null, bn = 0;
  for (let i = 0; i < list.length; i += Math.max(1, list.length / 40 | 0)) { const m = list[i]; let n = 0; for (const o of list) if (Math.hypot(o.x - m.x, o.y - m.y) < r) n++; if (n > bn) { bn = n; best = m; } }
  return best;
}
const pickN = (G, list, n) => { const a = list.slice(); const bi = a.findIndex((m) => m.boss || m.elite); if (bi > 0) [a[0], a[bi]] = [a[bi], a[0]]; for (let i = a.length - 1; i > (bi >= 0 ? 1 : 0); i--) { const j = (bi >= 0 ? 1 : 0) + (G.rnd() * (i + (bi >= 0 ? 0 : 1)) | 0); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
const pw = (lv, per = .22) => 1 + (lv - 1) * per;
const CD = { meteor: 4, thunder: 3, frost: 5.5, dragon: 7, blackhole: 8, pillars: 3.5, stars: 2.5 };
function cast(G, id) {
  const lv = L(G, id), st = S(G), A = st.area, h = G.h, scr = onScreen(G);
  const fx = (k, o) => G.ev.push({ e: 'fx', k, ...o });
  switch (id) {
    case 'meteor': {
      if (!scr.length) return false;
      const n = [3, 4, 5, 6, 8][lv - 1];
      for (const m of pickN(G, scr, n)) G.zones.push({ k: 'meteor', x: m.x + R(G, -20, 20), y: m.y + R(G, -20, 20), t: 0, at: .55, r: 70 * A, d: 42 * pw(lv) });
      if (lv >= 5) { const c = densest(G, 200) || scr[0]; G.zones.push({ k: 'meteor', big: 1, x: c.x, y: c.y, t: 0, at: .9, r: 210 * A, d: 160 }); }
      return true;
    }
    case 'thunder': {
      if (!scr.length) return false;
      const n = [4, 5, 6, 8, 10][lv - 1];
      for (const m of pickN(G, scr, n)) { fx('bolt', { x: m.x, y: m.y }); hit(G, m, 36 * pw(lv), { c: 'y', pierceArmor: 1 }); }
      if (lv >= 5) { G.cd.thunderN = (G.cd.thunderN || 0) + 1; if (G.cd.thunderN % 3 === 0) G.zones.push({ k: 'storm', t: 0, dur: 3, tick: 0 }); }
      return true;
    }
    case 'frost': {
      const r = (150 + lv * 18) * A, fr = [1, 1.2, 1.6, 1.9, 2.5][lv - 1];
      const hits = near(G, h.x, h.y, r); fx('nova', { x: h.x, y: h.y, r });
      for (const m of hits) { if (!m.boss) { m.freeze = Math.max(m.freeze, fr); m.frozenKill = true; } hit(G, m, 24 * pw(lv), { c: 'b' }); }
      return true;
    }
    case 'dragon': {
      const n = lv >= 5 ? 2 : 1, w = (lv >= 3 ? 130 : 105) * A;
      for (let i = 0; i < n; i++) {
        const dir = i === 0 ? (G.rnd() < .5 ? 1 : -1) : null;
        const ang = n === 2 ? (i ? -.55 : .55) + (G.rnd() < .5 ? 0 : Math.PI) : (dir > 0 ? 0 : Math.PI);
        const L2 = Math.hypot(G.view.w, G.view.h) / 2 + 120, cy = h.y + R(G, -90, 90);
        G.zones.push({ k: 'dragon', x0: h.x - Math.cos(ang) * L2, y0: cy - Math.sin(ang) * L2, ang, len: L2 * 2, t: 0, dur: 1.5, w, d: 55 * pw(lv, .25), hitSet: new Set() });
      }
      return true;
    }
    case 'blackhole': {
      const c = densest(G, 150); if (!c) return false;
      const dur = [2, 2.5, 3, 3.5, 4][lv - 1], r = (lv >= 3 ? 190 : 165) * A * (lv >= 5 ? 1.6 : 1);
      G.zones.push({ k: 'hole', x: c.x, y: c.y, t: 0, dur, r, d: 90 * pw(lv), tick: 0, boom: lv >= 5 ? 2 : 1 });
      return true;
    }
    case 'pillars': {
      if (!scr.length) return false;
      const n = [3, 4, 5, 6, 7][lv - 1];
      for (const m of pickN(G, scr, n)) G.zones.push({ k: 'pillar', x: m.x, y: m.y, t: 0, at: .35, r: 58 * A, d: 46 * pw(lv) });
      if (lv >= 5) { G.cd.pillarN = (G.cd.pillarN || 0) + 1; if (G.cd.pillarN % 2 === 0) G.zones.push({ k: 'cross', x: h.x, y: h.y, t: 0, at: .4, w: 70 * A, len: 520, d: 90 }); }
      return true;
    }
    case 'stars': {
      if (!scr.length) return false;
      const n = [6, 8, 10, 13, 16][lv - 1];
      for (let i = 0; i < n; i++) { const a = i / n * 6.283 + R(G, -.2, .2); G.shots.push({ k: 'star', x: h.x, y: h.y - 20, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, t: 0, life: 3, d: 19 * pw(lv), tgt: null, boom: lv >= 5 }); }
      return true;
    }
  }
  return false;
}
// 늘 켜져 있는 스킬 (회오리 · 빛의 검 · 레이저)
function persistent(G, dt) {
  const h = G.h, A = S(G).area;
  G.orbit = (G.orbit || 0) + dt;
  // 회오리
  const tl = L(G, 'tornado');
  if (tl) {
    const n = tl >= 5 ? 1 : tl >= 3 ? 2 : 1, big = tl >= 5, rr = (big ? 95 : 55) * A, orb = big ? 120 : 150;
    G.torn = [];
    for (let i = 0; i < n; i++) {
      const a = G.orbit * .9 + i * Math.PI, x = h.x + Math.cos(a) * orb, y = h.y + Math.sin(a) * orb * .8; G.torn.push({ x, y, r: rr });
      for (const m of near(G, x, y, rr * 1.8)) {
        const dx = x - m.x, dy = y - m.y, l = Math.hypot(dx, dy) || 1, pull = (tl >= 2 ? 120 : 80) * (m.boss ? .1 : 1);
        m.x += dx / l * pull * dt; m.y += dy / l * pull * dt;
        if (l < rr + m.r) { m.tornT = (m.tornT || 0) - dt; if (m.tornT <= 0) { m.tornT = .3; hit(G, m, 11 * pw(tl, .3) * (big ? 1.8 : 1), { quiet: 1, noCrit: 1 }); } }
      }
    }
  } else G.torn = null;
  // 빛의 검
  const sl = L(G, 'swords');
  if (sl) {
    const n = sl + 1; G.swordsThrow = Math.max(0, (G.swordsThrow || 0) - dt);
    if (sl >= 5) { G.swordsCd = (G.swordsCd ?? 4) - dt; if (G.swordsCd <= 0) { G.swordsCd = 4; G.swordsThrow = 1.2; } }
    const ext = G.swordsThrow > 0 ? Math.sin((1 - G.swordsThrow / 1.2) * Math.PI) * 220 : 0;
    G.swords = [];
    for (let i = 0; i < n; i++) {
      const a = G.orbit * 3.2 + i / n * 6.283, rad = (95 + ext) * A, x = h.x + Math.cos(a) * rad, y = h.y + Math.sin(a) * rad;
      G.swords.push({ x, y, a });
      for (const m of near(G, x, y, 24)) { m.swT = m.swT || {}; if (!m.swT[i] || G.t - m.swT[i] > .4) { m.swT[i] = G.t; hit(G, m, 15 * pw(sl), { kb: 60, fx: h.x, fy: h.y, c: 'w' }); } }
    }
  } else G.swords = null;
  // 레이저
  const ll = L(G, 'laser');
  if (ll) {
    const n = ll >= 5 ? 3 : ll >= 3 ? 2 : 1, len = (ll >= 2 ? 330 : 270) * A, w = (ll >= 5 ? 26 : 13) * A;
    G.lasers = [];
    for (let i = 0; i < n; i++) {
      const a = G.orbit * 1.5 + i / n * 6.283, cx = Math.cos(a), cy = Math.sin(a); G.lasers.push({ a, len, w });
      for (const m of G.mons) {
        if (m.dead) continue; const dx = m.x - h.x, dy = m.y - h.y, along = dx * cx + dy * cy; if (along < 0 || along > len) continue;
        if (Math.abs(dx * -cy + dy * cx) < w / 2 + m.r) { m.lzT = (m.lzT || 0) - dt; if (m.lzT <= 0) { m.lzT = .2; hit(G, m, 10 * pw(ll, .28), { quiet: G.rnd() < .6, noCrit: 1, c: 'p' }); if (ll >= 5) { m.slow = .4; m.slowT = .5; } } }
      }
    }
  } else G.lasers = null;
}
function zoneStep(G, dt) {
  for (let i = G.zones.length - 1; i >= 0; i--) {
    const z = G.zones[i]; z.t += dt;
    if (z.k === 'meteor' || z.k === 'pillar') {
      if (!z.done && z.t >= z.at) { z.done = true; G.ev.push({ e: 'fx', k: z.k === 'meteor' ? (z.big ? 'bigmeteor' : 'meteor') : 'pillar', x: z.x, y: z.y, r: z.r }); for (const m of near(G, z.x, z.y, z.r)) hit(G, m, z.d, { c: z.k === 'meteor' ? 'o' : 'y', kb: z.big ? 140 : 40, fx: z.x, fy: z.y }); if (z.big) G.ev.push({ e: 'shake', s: .5 }); }
      if (z.t > z.at + .5) G.zones.splice(i, 1);
    } else if (z.k === 'cross') {
      if (!z.done && z.t >= z.at) { z.done = true; G.ev.push({ e: 'fx', k: 'cross', x: z.x, y: z.y, w: z.w, len: z.len }); for (const m of G.mons) if (!m.dead && ((Math.abs(m.x - z.x) < z.w / 2 + m.r && Math.abs(m.y - z.y) < z.len) || (Math.abs(m.y - z.y) < z.w / 2 + m.r && Math.abs(m.x - z.x) < z.len))) hit(G, m, z.d, { c: 'y' }); }
      if (z.t > z.at + .6) G.zones.splice(i, 1);
    } else if (z.k === 'dragon') {
      const u = Math.min(1, z.t / z.dur), hx = z.x0 + Math.cos(z.ang) * z.len * u, hy = z.y0 + Math.sin(z.ang) * z.len * u; z.hx = hx; z.hy = hy;
      for (const m of near(G, hx, hy, z.w / 2)) if (!z.hitSet.has(m.id)) { z.hitSet.add(m.id); hit(G, m, z.d, { c: 'o' }); m.burn = 3; m.burnD = Math.max(m.burnD, z.d * .12); }
      if (z.t >= z.dur + .4) G.zones.splice(i, 1);
    } else if (z.k === 'hole') {
      for (const m of near(G, z.x, z.y, z.r)) { const dx = z.x - m.x, dy = z.y - m.y, l = Math.hypot(dx, dy) || 1; if (!m.boss) { m.x += dx / l * Math.min(l, 190 * dt); m.y += dy / l * Math.min(l, 190 * dt); } m.slow = .6; m.slowT = .3; }
      z.tick -= dt; if (z.tick <= 0) { z.tick = .35; for (const m of near(G, z.x, z.y, z.r * .4)) hit(G, m, z.d * .08, { quiet: 1, noCrit: 1 }); }
      if (z.t >= z.dur) {
        G.ev.push({ e: 'fx', k: 'holeboom', x: z.x, y: z.y, r: z.r }); G.ev.push({ e: 'shake', s: .35 });
        for (const m of near(G, z.x, z.y, z.r * .7)) hit(G, m, z.d, { c: 'p', kb: 120, fx: z.x, fy: z.y });
        if (--z.boom > 0) { z.t = z.dur - .5; } else G.zones.splice(i, 1);
      }
    } else if (z.k === 'storm') {
      z.tick -= dt; if (z.tick <= 0) { z.tick = .16; const s = onScreen(G); if (s.length) { const m = s[G.rnd() * s.length | 0]; G.ev.push({ e: 'fx', k: 'bolt', x: m.x, y: m.y }); hit(G, m, 30 * pw(5), { c: 'y', quiet: 1 }); } }
      if (z.t >= z.dur) G.zones.splice(i, 1);
    }
  }
}

// ---------- 한 프레임 ----------
export function step(G, dt, input = { x: 0, y: 0 }) {
  if (G.over || G.choices) return;
  G.t += dt; const h = G.h, st = S(G);
  // 영웅 이동
  h.inv = Math.max(0, h.inv - dt); h.dashCd = Math.max(0, h.dashCd - dt); h.autoDashCd = Math.max(0, h.autoDashCd - dt); h.hurtT = Math.max(0, h.hurtT - dt); h.atkT = Math.max(0, h.atkT - dt);
  if (L(G, 'barrier') && !h.shield) { h.barrierCd -= dt; if (h.barrierCd <= 0) h.shield = true; }
  if (L(G, 'regen')) h.hp = Math.min(h.max, h.hp + h.max * .01 * L(G, 'regen') * dt);
  if (h.dash > 0) { h.dash -= dt; h.x += h.dashDir[0] * 820 * dt; h.y += h.dashDir[1] * 820 * dt; }
  else {
    const il = Math.min(1, Math.hypot(input.x, input.y));
    if (il > .05) { const a = Math.atan2(input.y, input.x); h.vx = Math.cos(a) * st.speed * il; h.vy = Math.sin(a) * st.speed * il; h.dashDir = [Math.cos(a), Math.sin(a)]; } else { h.vx = h.vy = 0; }
    h.x += h.vx * dt; h.y += h.vy * dt;
  }
  spawnStep(G, dt);
  // 기본 공격: 마력 구슬
  G.cd.basic = (G.cd.basic ?? .2) - dt * st.aspd;
  if (G.cd.basic <= 0) {
    const tg = G.mons.filter((m) => !m.dead && dist(m, h) < 430).sort((a, b) => dist(a, h) - dist(b, h));
    if (tg.length) {
      G.cd.basic = .62; h.atkT = .18;
      for (let i = 0; i < st.orbs; i++) { const t = tg[i % tg.length], a = Math.atan2(t.y - (h.y - 22), t.x - h.x) + (i - (st.orbs - 1) / 2) * .12; G.shots.push({ k: 'orb', x: h.x, y: h.y - 22, vx: Math.cos(a) * 560, vy: Math.sin(a) * 560, t: 0, life: 1, d: 15, r: 9 }); }
      G.ev.push({ e: 'cast' });
    } else G.cd.basic = .05;
  }
  // 공격 스킬 재사용
  for (const id in CD) {
    if (!L(G, id)) continue;
    G.cd[id] -= dt;
    if (G.cd[id] <= 0) { const c = CD[id] * st.cdr * (id === 'dragon' && L(G, id) >= 4 ? .8 : 1); G.cd[id] = cast(G, id) ? c : .4; if (G.cd[id] === c) G.ev.push({ e: 'skill', id }); }
  }
  persistent(G, dt); zoneStep(G, dt);
  // 투사체
  for (let i = G.shots.length - 1; i >= 0; i--) {
    const s = G.shots[i]; s.t += dt;
    if (s.k === 'star') {
      if (!s.tgt || s.tgt.dead) { let b = null, bd = 1e9; for (const m of G.mons) { if (m.dead) continue; const d = Math.hypot(m.x - s.x, m.y - s.y); if (d < bd && d < 520) { bd = d; b = m; } } s.tgt = b; }
      if (s.tgt && s.t > .18) { const dx = s.tgt.x - s.x, dy = s.tgt.y - s.y, l = Math.hypot(dx, dy) || 1, sp = 520; s.vx += (dx / l * sp - s.vx) * Math.min(1, dt * 7); s.vy += (dy / l * sp - s.vy) * Math.min(1, dt * 7); }
    }
    if (s.k === 'arrow') { s.x += s.vx * dt; s.y += s.vy * dt; if (Math.hypot(s.x - h.x, s.y + 20 - h.y) < 18) { hurtHero(G, s.d); G.shots.splice(i, 1); continue; } if (s.t > s.life) G.shots.splice(i, 1); continue; }
    s.x += s.vx * dt; s.y += s.vy * dt;
    let hitM = null; for (const m of G.mons) { if (m.dead) continue; if (Math.hypot(m.x - s.x, m.y - m.r - s.y) < m.r + (s.r || 8)) { hitM = m; break; } }
    if (hitM) {
      if (s.k === 'orb') { hit(G, hitM, s.d, { kb: 18 }); if (L(G, 'mark')) hitM.mark = 4; G.ev.push({ e: 'fx', k: 'orbhit', x: s.x, y: s.y }); }
      else { hit(G, hitM, s.d, { c: 'y' }); G.ev.push({ e: 'fx', k: s.boom ? 'starboom' : 'orbhit', x: s.x, y: s.y }); if (s.boom) for (const m of near(G, s.x, s.y, 50)) if (m !== hitM) hit(G, m, s.d * .6, { quiet: 1 }); }
      G.shots.splice(i, 1); continue;
    }
    if (s.t > s.life) G.shots.splice(i, 1);
  }
  // 몬스터
  const slowR = 190 * (1 + .1 * L(G, 'slow')), fearL = L(G, 'fear');
  G.fearT = (G.fearT || 0) - dt; const fearPulse = fearL && G.fearT <= 0; if (fearPulse) { G.fearT = 1.2; G.ev.push({ e: 'fx', k: 'fear', x: h.x, y: h.y }); }
  for (const m of G.mons) {
    if (m.dead) { m.dead += dt; continue; }
    m.hitT = Math.max(0, m.hitT - dt); m.stun = Math.max(0, m.stun - dt); m.freeze = Math.max(0, m.freeze - dt); m.slowT = Math.max(0, m.slowT - dt); m.mark = Math.max(0, m.mark - dt); m.atkT = Math.max(0, m.atkT - dt);
    if (m.freeze <= 0) m.frozenKill = false;
    if (m.burn > 0) { m.burn -= dt; m.burnTick = (m.burnTick || 0) - dt; if (m.burnTick <= 0) { m.burnTick = .5; hit(G, m, m.burnD * .5, { quiet: 1, noCrit: 1, noBurn: 1 }); if (m.dead) continue; } }
    const dx = h.x - m.x, dy = h.y - m.y, d = Math.hypot(dx, dy) || 1;
    if (fearPulse && d < 90 + fearL * 12 && !m.boss) { m.kb[0] -= dx / d * (160 + fearL * 40); m.kb[1] -= dy / d * (160 + fearL * 40); }
    m.x += m.kb[0] * dt; m.y += m.kb[1] * dt; m.kb[0] *= Math.pow(.02, dt); m.kb[1] *= Math.pow(.02, dt);
    if (m.stun > 0 || m.freeze > 0) continue;
    let sp = m.spd;
    if (L(G, 'slow') && d < slowR) sp *= 1 - .15 * L(G, 'slow');
    if (m.slowT > 0) sp *= 1 - m.slow;
    m.face = dx >= 0 ? 1 : -1;
    if (m.M.ranged && d < m.M.ranged) {
      m.cd -= dt;
      if (m.cd <= 0) { m.cd = 1.8; m.atkT = .5; const a = Math.atan2(dy - 18, dx); G.shots.push({ k: 'arrow', x: m.x, y: m.y - 22, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, t: 0, life: 2, d: m.dmg }); }
      if (d < m.M.ranged * .6) { m.x -= dx / d * sp * .5 * dt; m.y -= dy / d * sp * .5 * dt; }
    } else if (d > m.r + 12) { m.x += dx / d * sp * dt; m.y += dy / d * sp * dt; }
    if (d < m.r + 16) { m.cd -= dt; if (m.cd <= 0) { m.cd = .85; m.atkT = .4; hurtHero(G, m.dmg); } }
    if (m.M.heal) { m.healT = (m.healT || 2) - dt; if (m.healT <= 0) { m.healT = 3; m.atkT = 1; for (const o of near(G, m.x, m.y, 150)) if (o.hp < o.max && !o.boss) o.hp = Math.min(o.max, o.hp + o.max * (o.elite ? .04 : .2)); G.ev.push({ e: 'fx', k: 'heal', x: m.x, y: m.y }); } }
    // 너무 멀어진 적은 반대편으로 다시 (맵 끝 없음)
    if (d > Math.hypot(G.view.w, G.view.h) * .95 && !m.boss) { const a = Math.atan2(dy, dx) + R(G, -.6, .6), r = Math.hypot(G.view.w, G.view.h) / 2 + 30; m.x = h.x + Math.cos(a) * r; m.y = h.y + Math.sin(a) * r; }
  }
  // 몬스터끼리 살짝 밀어내기 (겹침 방지, 가까운 것만)
  const ms = G.mons;
  for (let i = 0; i < ms.length; i += 1) { const a = ms[i]; if (a.dead) continue; for (let j = i + 1; j < Math.min(ms.length, i + 12); j++) { const b = ms[j]; if (b.dead) continue; const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r, d2 = dx * dx + dy * dy; if (d2 < rr * rr && d2 > .01) { const d = Math.sqrt(d2), p = (rr - d) / 2 / d; a.x -= dx * p; a.y -= dy * p; b.x += dx * p; b.y += dy * p; } } }
  G.mons = G.mons.filter((m) => !m.dead || m.dead < .5);
  // 보석
  for (let i = G.gems.length - 1; i >= 0; i--) {
    const g = G.gems[i], d = Math.hypot(g.x - h.x, g.y - h.y);
    if (d < st.magnet) g.mag = true;
    if (g.mag) { const sp = 560 * dt; g.x += (h.x - g.x) / (d || 1) * Math.min(d, sp); g.y += (h.y - g.y) / (d || 1) * Math.min(d, sp); }
    if (d < 20) { G.gems.splice(i, 1); G.xp += g.v * st.xp; }
  }
  while (G.xp >= xpNeed(G.lv)) { G.xp -= xpNeed(G.lv); G.lv++; G.pending++; G.ev.push({ e: 'lv', lv: G.lv }); }
  if (G.pending > 0 && !G.choices) rollChoices(G);
}
