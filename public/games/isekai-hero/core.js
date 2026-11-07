// 이세계 용사 — 게임 규칙·전투 계산 (화면과 분리: 브라우저와 밸런스 시뮬(node)이 함께 씀)
// 좌표: 논리 화면 폭 400. 파티는 왼쪽, 몬스터는 오른쪽에서 다가옴.

export const JOBS = {
  knight: { names: ['검사', '기사', '성기사'], role: '탱커 · 근접', color: '#6aa8ff', hp: 2.4, atk: .9, aps: .95, cr: .05, melee: 1,
    desc: '맨 앞에서 공격을 받아내고 앞쪽 적을 한꺼번에 베어요.' },
  assassin: { names: ['도둑', '암살자', '스토커'], role: '연타 · 치명타', color: '#ff6a8a', hp: 1.15, atk: .62, aps: 1.75, cr: .2,
    desc: '단검을 빠르게 던지고 치명타로 큰 피해를 줘요.' },
  mage: { names: ['메이지', '위저드', '소서러'], role: '원거리 광역', color: '#c08aff', hp: .8, atk: 1.25, aps: .8, cr: .05, splash: .45,
    desc: '불꽃 마법으로 여러 적을 한 번에 공격해요.' },
  priest: { names: ['클레릭', '프리스트', '비숍'], role: '버프 · 디버프 · 공격', color: '#ffe066', hp: 1.05, atk: .85, aps: .95, cr: .05,
    desc: '파티를 강하게 하고 적을 약하게 만든 뒤 신성 마법으로 공격해요.' },
};
export const JOB_IDS = ['knight', 'assassin', 'mage', 'priest'];
// 대형: 기사 맨 앞 · 도둑/법사 가운데 · 클레릭 맨 뒤
export const SLOT = { knight: [64, -2], assassin: [26, 34], mage: [-8, -34], priest: [-44, 12] };
export const AX = 112; // 파티 기준점 x
export const FIELD_W = 400;
const VIEW_X = 352; // 이 안으로 들어온 적만 공격 (화면 안에서 싸우는 모습이 보이도록)
const seen = (B, m) => !m.dead && m.x < VIEW_X && Math.abs(m.y) < B.fightY; // fightY: 위아래 메뉴에 가리지 않는 범위

// 스킬: t = 몇 차 전직부터 쓸 수 있는지 (0 = 처음부터)
export const SKILLS = {
  knight: [
    { id: 'quake', name: '대지 가르기', t: 0, cd: 7, d: '앞쪽 적 모두에게 공격력 260% 피해' },
    { id: 'iron', name: '강철 의지', t: 0, cd: 16, d: '6초 동안 파티가 받는 피해 40% 감소' },
    { id: 'wave', name: '검기 베기', t: 1, cd: 4.5, d: '가장 앞의 적에게 공격력 420% 피해' },
    { id: 'holy', name: '성검 일섬', t: 2, cd: 12, d: '한 적에게 공격력 1500% 피해' },
  ],
  assassin: [
    { id: 'storm', name: '칼날 폭풍', t: 0, cd: 6, d: '무작위 적에게 공격력 70%로 8번 공격' },
    { id: 'venom', name: '맹독 칼날', t: 0, cd: 9, d: '모든 적에게 6초 동안 초당 공격력 45% 독 피해' },
    { id: 'hide', name: '은신', t: 1, cd: 11, d: '다음 공격 5번이 반드시 치명타' },
    { id: 'shadow', name: '그림자 연격', t: 2, cd: 13, d: '가장 강한 적에게 공격력 120%로 12번 공격' },
  ],
  mage: [
    { id: 'fireball', name: '화염구', t: 0, cd: 6.5, d: '모든 적에게 공격력 230% 폭발 피해' },
    { id: 'frost', name: '서리 창', t: 0, cd: 8, d: '한 적에게 공격력 450% 피해 + 4초 둔화' },
    { id: 'arrows', name: '불꽃 화살', t: 1, cd: 4, d: '적 3명에게 공격력 200% 피해' },
    { id: 'stone', name: '석화 저주', t: 2, cd: 15, d: '모든 적 3초 기절 + 공격력 400% 피해' },
  ],
  priest: [
    { id: 'bless', name: '축복의 성가', t: 0, cd: 15, d: '8초 동안 파티 공격력 35%·공격 속도 25% 증가' },
    { id: 'mark', name: '약화의 낙인', t: 0, cd: 12, d: '8초 동안 모든 적이 받는 피해 30% 증가' },
    { id: 'chain', name: '심판의 사슬', t: 1, cd: 10, d: '가장 강한 적을 5초 속박 + 초당 공격력 120% 피해' },
    { id: 'cross', name: '성광 십자', t: 2, cd: 9, d: '모든 적에게 공격력 380% 신성 피해' },
  ],
};

export const REGIONS = [
  { name: '초원 들판', mons: ['mon1', 'mon1p', 'mon9', 'mon7', 'mon5', 'mon11', 'mon2'], boss: 'boss1', bossName: '고대 정령목', circle: '#ffd76a' },
  { name: '황금 사막', mons: ['mon8s', 'mon12s', 'mon6', 'mon15', 'mon2'], boss: 'boss5', bossName: '모래 폭군', circle: '#ffb347' },
  { name: '망자의 고성', mons: ['mon3', 'mon4', 'mon13', 'mon10', 'mon12', 'mon14'], boss: 'boss2', bossName: '심연의 마신', circle: '#ff3a4a' },
];
// 몬스터 종류별 생김새 크기(논리 단위 높이)·체력·공격 배율
export const MON = {
  mon1: [34, 1, 1, '초록 젤리'], mon1p: [32, 1, 1, '분홍 젤리'], mon9: [34, 1.05, 1, '파랑 젤리'], mon7: [36, 1.15, 1.05, '새싹이'],
  mon5: [36, 1.2, 1.1, '버섯'], mon11: [32, .85, 1.2, '꿀벌', 1], mon2: [30, .8, 1.15, '박쥐', 1],
  mon8s: [44, 1.3, 1.1, '모래 멧돼지'], mon12s: [34, .95, 1.1, '모래 눈알', 1], mon6: [40, 1.1, 1.15, '사막 임프'], mon15: [32, 1.4, 1, '가시성게'],
  mon3: [44, 1.1, 1.1, '스켈레톤'], mon4: [44, 1, 1.2, '망령', 1], mon13: [36, .9, 1.15, '날개눈알', 1], mon10: [46, 1.2, 1.25, '저승사자'],
  mon12: [36, 1, 1.1, '핏빛 눈알', 1], mon14: [60, 2, 1.1, '바위골렘'],
  boss1: [96], boss2: [96], boss3: [96], boss4: [96], boss5: [96],
};

export const KILLS_PER_STAGE = 25;
export const BOSS_TIME = 30;
export const MAX_LV = 99;
export const TM = [1, 8, 64]; // 전직 단계별 기본 능력 배율 (전직하면 레벨 1이어도 이전 99레벨보다 강함)

// ---------- 숫자 ----------
const UNITS = ['', '만', '억', '조', '경', '해', '자', '양', '구', '간'];
export function fmt(n) {
  n = Math.floor(n); if (!isFinite(n)) return '∞';
  if (n < 10000) return n.toLocaleString('ko-KR');
  let u = 0; while (n >= 10000 && u < UNITS.length - 1) { n /= 10000; u++; }
  return (n >= 100 ? Math.floor(n) : n >= 10 ? Math.floor(n * 10) / 10 : Math.floor(n * 100) / 100) + UNITS[u];
}

// ---------- 성장 ----------
export const UPS = [
  { id: 'atk', name: '공격력', max: Infinity, base: 12, g: 1.075, eff: (n) => `+${n * 10}%` },
  { id: 'hp', name: '체력', max: Infinity, base: 10, g: 1.075, eff: (n) => `+${n * 10}%` },
  { id: 'cr', name: '치명타 확률', max: 1000, base: 40, g: 1.0105, eff: (n) => `+${(n / 10).toFixed(1)}%` },
  { id: 'cd', name: '치명타 피해', max: Infinity, base: 30, g: 1.06, eff: (n) => `+${n * 2}%` },
  { id: 'as', name: '공격 속도', max: 200, base: 80, g: 1.075, eff: (n) => `+${(n / 2).toFixed(1)}%` },
];
export const upCost = (u, n) => Math.ceil(u.base * Math.pow(u.g, n));
// k번 올리는 비용 (k='max' 면 살 수 있는 만큼). 반환 [횟수, 비용]
export function upBulk(u, n, k, gold) {
  let c = 0, i = 0; const lim = k === 'max' ? 100000 : k;
  while (i < lim && n + i < u.max) { const nx = upCost(u, n + i); if (k === 'max' && c + nx > gold) break; c += nx; i++; }
  return [i, c];
}
export const expNeed = (L, T) => Math.ceil(14 * Math.pow(L, 1.9) * Math.pow(6, T));
export const growth = (S) => S.T * MAX_LV + S.L; // 성장 단계 (동료 가격 기준)
export function compPrice(S) {
  const g = growth(S), owned = S.comp.length;
  return Math.ceil(100 * Math.pow(1 + g / 5, 1.8) * (1 + owned) / 10) * 10;
}

export function newSave(job, name) {
  return { v: 1, name: name || '용사', job, T: 0, L: 1, exp: 0, gold: 0, up: { atk: 0, hp: 0, cr: 0, cd: 0, as: 0 }, comp: [], s: 0, kills: 0,
    best: 0, autoBoss: true, lastAt: Date.now(), rate: { g: 0, e: 0 }, made: Date.now(), playSec: 0 };
}
export function sanitize(d) {
  if (!d || !JOBS[d.job]) return null;
  const S = newSave(d.job, String(d.name || '용사').slice(0, 10));
  for (const k of ['T', 'L', 'exp', 'gold', 's', 'kills', 'best', 'lastAt', 'made', 'playSec']) if (Number.isFinite(d[k])) S[k] = d[k];
  S.T = Math.max(0, Math.min(2, S.T | 0)); S.L = Math.max(1, Math.min(MAX_LV, S.L | 0)); S.s = Math.max(0, S.s | 0);
  for (const u of UPS) S.up[u.id] = Math.max(0, Math.min(u.max, (d.up && d.up[u.id]) | 0));
  S.comp = Array.isArray(d.comp) ? [...new Set(d.comp.filter((j) => JOBS[j] && j !== S.job))].slice(0, 3) : [];
  S.autoBoss = d.autoBoss !== false; if (d.rate) S.rate = { g: +d.rate.g || 0, e: +d.rate.e || 0 };
  return S;
}

export const jobName = (job, T) => JOBS[job].names[T];
export const regionOf = (s) => REGIONS[Math.floor(s / 10) % REGIONS.length];
export function stageName(s) {
  const ch = Math.floor(s / 10), lap = Math.floor(ch / REGIONS.length);
  return `${REGIONS[ch % REGIONS.length].name}${lap ? ' ' + ['', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ'][Math.min(lap, 8)] : ''} ${ch + 1}-${(s % 10) + 1}`;
}
export const monHp = (s) => 26 * Math.pow(1.165, s);
export const monAtk = (s) => 5 * Math.pow(1.15, s);
export const monGold = (s) => 3 * Math.pow(1.16, s);
export const monExp = (s) => 6 * Math.pow(1.09, s);

// 파티원 능력치 (동료도 주인공 레벨·전직·강화를 그대로 따라감)
export function stats(S, job) {
  const J = JOBS[job], tm = TM[S.T], u = S.up;
  return {
    atk: (40 + 2.5 * S.L) * tm * J.atk * (1 + .1 * u.atk),
    hp: (240 + 15 * S.L) * tm * J.hp * (1 + .1 * u.hp),
    aps: J.aps * (1 + .005 * u.as),
    cr: Math.min(1, J.cr + u.cr / 1000),
    cd: 1.5 + u.cd * .02,
  };
}
export const members = (S) => [S.job, ...S.comp];
export function power(S) {
  let p = 0; for (const j of members(S)) { const t = stats(S, j); p += t.atk * t.aps * (1 + t.cr * (t.cd - 1)) * 10 + t.hp; }
  return p;
}

// ---------- 전투 ----------
let UID = 1;
export function createBattle(S, rnd = Math.random) {
  const B = { S, rnd, viewY: 300, fightY: 170, t: 0, scroll: 0, walking: true, party: [], mons: [], wave: 0, boss: null, bossT: 0, state: 'walk', pause: 0,
    buffs: { bless: 0, iron: 0, mark: 0 }, ev: [], waveDelay: 1.2, earn: { g: 0, e: 0 }, failCool: 0 };
  syncParty(B);
  return B;
}
export function syncParty(B) {
  const S = B.S, keep = new Map(B.party.map((m) => [m.job, m]));
  B.party = members(S).map((job) => {
    const st = stats(S, job), old = keep.get(job), [dx, dy] = SLOT[job];
    const m = old || { id: UID++, job, x: AX + dx, y: dy, hp: st.hp, cd: 0, sk: {}, crit5: 0, dead: false, anim: Math.random() * 6, hitT: 0, atkT: 0 };
    m.st = st; m.hp = old ? Math.min(st.hp, old.hp * (st.hp / Math.max(1, old.st.hp))) : st.hp;
    for (const sk of SKILLS[job]) if (!(sk.id in m.sk)) m.sk[sk.id] = sk.cd * (.3 + Math.random() * .4);
    return m;
  });
}
const alive = (a) => a.filter((m) => !m.dead);
function spawnWave(B) {
  const S = B.S, R = regionOf(S.s), n = 3 + Math.min(3, Math.floor((S.s % 10) / 3)) + (B.rnd() < .3 ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const k = R.mons[Math.floor(B.rnd() * R.mons.length)], M = MON[k];
    const hp = monHp(S.s) * M[1] * (.9 + B.rnd() * .2);
    // 앞(오른쪽) · 위 · 아래 세 방향에서 나타남 — 첫 마리는 항상 앞
    const ly = -70 + (i / Math.max(1, n - 1)) * 140 + (B.rnd() - .5) * 20, r = B.rnd(), dir = i === 0 || r < .4 ? 0 : r < .7 ? -1 : 1;
    const x = dir ? 190 + B.rnd() * 150 : FIELD_W + 30 + i * 26 + B.rnd() * 30, y = dir ? dir * (B.viewY + 40 + B.rnd() * 40) : ly;
    B.mons.push({ id: UID++, k, h: M[0], fly: !!M[4], x, y, ly, dir,
      hp, max: hp, atk: monAtk(S.s) * M[2], cd: 1 + B.rnd(), slow: 0, stun: 0, poison: 0, root: 0, hitT: 0, dead: 0, gold: monGold(S.s), exp: monExp(S.s), name: M[3] });
  }
  B.wave++;
}
export function startBoss(B) {
  const S = B.S, R = regionOf(S.s), last = S.s % 10 === 9;
  B.mons.length = 0;
  const k = last ? R.boss : R.mons[(S.s * 7) % R.mons.length], hp = monHp(S.s) * (last ? 70 : 30);
  const b = { id: UID++, k, h: last ? 104 : MON[k][0] * 2.1, fly: false, x: FIELD_W + 60, y: 0, ly: 0, dir: 0, hp, max: hp, atk: monAtk(S.s) * (last ? 6 : 4.5), cd: 1.5,
    slow: 0, stun: 0, poison: 0, root: 0, hitT: 0, dead: 0, gold: monGold(S.s) * 30, exp: monExp(S.s) * 20, boss: true, name: last ? R.bossName : '대장 ' + MON[k][3] };
  B.mons.push(b); B.boss = b; B.bossT = BOSS_TIME; B.state = 'walk'; B.walking = true; B.ev.push({ e: 'boss', last });
  for (const m of B.party) { m.dead = false; m.hp = m.st.hp; }
}
function frontX(B) { let f = -1e9; for (const m of alive(B.party)) f = Math.max(f, m.x); return f; }
function dmgMon(B, src, mon, mult, o = {}) {
  if (mon.dead) return 0;
  const st = src.st; let crit = false;
  if (src.crit5 > 0 && o.basic) { crit = true; src.crit5--; } else crit = B.rnd() < st.cr;
  let d = st.atk * mult * (crit ? st.cd : 1) * (B.buffs.bless > 0 ? 1.35 : 1) * (B.buffs.mark > 0 ? 1.3 : 1) * (.92 + B.rnd() * .16);
  mon.hp -= d; mon.hitT = .15;
  B.ev.push({ e: 'dmg', id: mon.id, x: mon.x, y: mon.y, h: mon.h, d, crit, c: o.c || '' });
  if (mon.hp <= 0) kill(B, mon);
  return d;
}
function kill(B, mon) {
  mon.dead = 1; mon.hp = 0; const S = B.S;
  S.gold += mon.gold; B.earn.g += mon.gold; gainExp(B, mon.exp); B.earn.e += mon.exp;
  B.ev.push({ e: 'kill', id: mon.id, x: mon.x, y: mon.y, gold: mon.gold, boss: !!mon.boss });
  if (mon.boss) {
    B.boss = null; S.s++; S.best = Math.max(S.best, S.s); S.kills = 0; B.ev.push({ e: 'clear', s: S.s });
  } else if (!B.boss) { S.kills = Math.min(KILLS_PER_STAGE, S.kills + 1); }
}
export function gainExp(B, e) {
  const S = B.S; if (S.L >= MAX_LV) return;
  S.exp += e; let up = 0;
  while (S.L < MAX_LV && S.exp >= expNeed(S.L, S.T)) { S.exp -= expNeed(S.L, S.T); S.L++; up++; }
  if (S.L >= MAX_LV) S.exp = 0;
  if (up) { syncParty(B); for (const m of B.party) if (!m.dead) m.hp = m.st.hp; B.ev.push({ e: 'lv', L: S.L }); }
}
export const canBoss = (S) => S.kills >= KILLS_PER_STAGE;

function pick(B, how) {
  const a = B.mons.filter((m) => seen(B, m)); if (!a.length) return null;
  if (how === 'front') return a.reduce((p, c) => (c.x < p.x ? c : p));
  if (how === 'strong') return a.reduce((p, c) => (c.hp > p.hp ? c : p));
  return a[Math.floor(B.rnd() * a.length)];
}
const inView = (B) => B.mons.filter((m) => seen(B, m));

function castSkill(B, m, sk) {
  const tg = inView(B); if (!tg.length) return false;
  const fx = (k, o = {}) => B.ev.push({ e: 'fx', k, who: m.id, ...o });
  switch (sk.id) {
    case 'quake': { const fx0 = frontX(B); const hit = tg.filter((t) => t.x < fx0 + 150); if (!hit.length) return false; fx('quake', { x: fx0 + 60 }); hit.forEach((t) => dmgMon(B, m, t, 2.6)); break; }
    case 'iron': B.buffs.iron = 6; fx('iron'); break;
    case 'wave': { const t = pick(B, 'front'); if (!t) return false; fx('wave', { tx: t.x, ty: t.y }); dmgMon(B, m, t, 4.2); break; }
    case 'holy': { const t = pick(B, 'strong'); if (!t) return false; fx('holy', { tx: t.x, ty: t.y }); dmgMon(B, m, t, 15, { c: 'g' }); break; }
    case 'storm': for (let i = 0; i < 8; i++) { const t = pick(B, 'rand'); if (!t) break; fx('slash', { tx: t.x, ty: t.y, dl: i * .06 }); dmgMon(B, m, t, .7); } break;
    case 'venom': tg.forEach((t) => { t.poison = 6; t.poisonD = m.st.atk * .45; }); fx('venom'); break;
    case 'hide': m.crit5 = 5; fx('hide'); break;
    case 'shadow': { const t = pick(B, 'strong'); if (!t) return false; for (let i = 0; i < 12; i++) { if (t.dead) break; fx('slash', { tx: t.x, ty: t.y, dl: i * .05 }); dmgMon(B, m, t, 1.2); } break; }
    case 'fireball': fx('fireball'); tg.forEach((t) => { fx('boom', { tx: t.x, ty: t.y }); dmgMon(B, m, t, 2.3, { c: 'o' }); }); break;
    case 'frost': { const t = pick(B, 'strong'); if (!t) return false; t.slow = 4; fx('frost', { tx: t.x, ty: t.y }); dmgMon(B, m, t, 4.5, { c: 'b' }); break; }
    case 'arrows': for (let i = 0; i < 3; i++) { const t = pick(B, 'rand'); if (!t) break; fx('arrow', { tx: t.x, ty: t.y, dl: i * .1 }); dmgMon(B, m, t, 2, { c: 'o' }); } break;
    case 'stone': tg.forEach((t) => { t.stun = 3; fx('stone', { tx: t.x, ty: t.y }); dmgMon(B, m, t, 4, { c: 'h' }); }); break;
    case 'bless': B.buffs.bless = 8; fx('bless'); break;
    case 'mark': B.buffs.mark = 8; fx('mark'); break;
    case 'chain': { const t = pick(B, 'strong'); if (!t) return false; t.root = 5; t.chainD = m.st.atk * 1.2; t.chainSrc = m; fx('chain', { tx: t.x, ty: t.y }); break; }
    case 'cross': fx('cross'); tg.forEach((t) => { fx('holyhit', { tx: t.x, ty: t.y }); dmgMon(B, m, t, 3.8, { c: 'g' }); }); break;
  }
  B.ev.push({ e: 'skill', who: m.id, job: m.job, sk: sk.id, name: sk.name });
  return true;
}

export function step(B, dt) {
  const S = B.S; B.t += dt; S.playSec = (S.playSec || 0) + dt;
  for (const k in B.buffs) B.buffs[k] = Math.max(0, B.buffs[k] - dt);
  if (B.pause > 0) { B.pause -= dt; if (B.pause <= 0) { for (const m of B.party) { m.dead = false; m.hp = m.st.hp; } B.state = 'walk'; } return; }
  B.failCool = Math.max(0, B.failCool - dt);

  // 보스 시간
  if (B.boss) {
    B.bossT -= dt;
    if (B.bossT <= 0) return bossFail(B, 'time');
  } else if (canBoss(S) && S.autoBoss && B.failCool <= 0 && !B.mons.some((m) => !m.dead)) { startBoss(B); }

  // 웨이브 생성
  B.mons = B.mons.filter((m) => !m.dead || (m.dead += dt) < .6);
  const live = B.mons.filter((m) => !m.dead);
  if (!live.length && !B.boss) {
    B.waveDelay -= dt;
    if (B.waveDelay <= 0) { spawnWave(B); B.waveDelay = 1.1; for (const m of B.party) if (!m.dead) m.hp = Math.min(m.st.hp, m.hp + m.st.hp * .5); }
  }

  // 이동: 가까운 적이 없으면 파티가 걷고(바닥이 왼쪽으로 흐름) 몬스터는 다가옴
  const fx0 = frontX(B), near = live.some((m) => m.x < fx0 + 140 && Math.abs(m.y) < B.fightY + 30);
  B.walking = !near; const walkV = B.walking ? 46 : 0;
  B.scroll += walkV * dt;
  for (const m of live) {
    const contact = fx0 + 34 + (m.h > 60 ? 20 : 0) + Math.abs(m.ly) * .12;
    const v = (m.dir ? 58 : 38) * (m.slow > 0 ? .5 : 1) * (m.stun > 0 || m.root > 0 ? 0 : 1);
    const ddx = contact - m.x, ddy = m.ly - m.y, dist = Math.hypot(ddx, ddy);
    if (dist > .5) { const q = Math.min(dist, v * dt) / dist; m.x += ddx * q; m.y += ddy * q; }
    if (m.x > contact) m.x = Math.max(contact, m.x - walkV * dt);
    const arrived = Math.abs(m.x - contact) < 3 && Math.abs(m.y - m.ly) < 3;
    m.slow = Math.max(0, m.slow - dt); m.stun = Math.max(0, m.stun - dt); m.hitT = Math.max(0, m.hitT - dt);
    if (m.poison > 0) { m.poison -= dt; m.hp -= m.poisonD * dt * (B.buffs.mark > 0 ? 1.3 : 1); m.pTick = (m.pTick || 0) + dt; if (m.pTick > .5) { m.pTick = 0; B.ev.push({ e: 'tick', id: m.id, c: 'p' }); } if (m.hp <= 0) kill(B, m); }
    if (m.root > 0) { m.root -= dt; m.hp -= m.chainD * dt * (B.buffs.mark > 0 ? 1.3 : 1); if (m.hp <= 0 && !m.dead) kill(B, m); }
    // 몬스터 공격
    if (!m.dead && arrived && m.stun <= 0) {
      m.cd -= dt;
      if (m.cd <= 0) {
        m.cd = m.boss ? 1.6 : 1.3;
        const tgts = alive(B.party); if (!tgts.length) break;
        const t = tgts.find((p) => p.job === 'knight') || tgts.reduce((p, c) => (c.x > p.x ? c : p));
        const d = m.atk * (B.buffs.iron > 0 ? .6 : 1) * (.9 + B.rnd() * .2);
        t.hp -= d; t.hitT = .2; B.ev.push({ e: 'hurt', id: t.id, d, mid: m.id });
        if (t.hp <= 0) { t.dead = true; t.hp = 0; B.ev.push({ e: 'down', id: t.id }); }
      }
    }
  }
  if (!alive(B.party).length) {
    if (B.boss) return bossFail(B, 'dead');
    B.ev.push({ e: 'wipe' }); B.mons.length = 0; B.pause = 2.5; B.state = 'wipe'; return;
  }

  // 파티 공격
  const view = inView(B);
  for (const m of B.party) {
    m.anim += dt * (B.walking ? 9 : 4); m.hitT = Math.max(0, m.hitT - dt); m.atkT = Math.max(0, m.atkT - dt);
    if (m.dead) continue;
    for (const sk of SKILLS[m.job]) {
      if (sk.t > S.T) continue;
      m.sk[sk.id] -= dt;
      if (m.sk[sk.id] <= 0 && view.length) { if (castSkill(B, m, sk)) m.sk[sk.id] = sk.cd; else m.sk[sk.id] = .5; }
    }
    m.cd -= dt * (B.buffs.bless > 0 ? 1.25 : 1);
    if (m.cd <= 0 && view.length) {
      const J = JOBS[m.job]; let t;
      t = pick(B, m.job === 'priest' ? 'strong' : 'front'); if (!t) continue;
      if (J.melee && t.x > m.x + 80) { m.cd = .1; continue; }
      m.cd = 1 / m.st.aps; m.atkT = .25;
      B.ev.push({ e: 'atk', who: m.id, job: m.job, tx: t.x, ty: t.y, tid: t.id });
      dmgMon(B, m, t, 1, { basic: 1, c: m.job === 'priest' ? 'g' : '' });
      if (J.splash) for (const o of view) if (o !== t && !o.dead && Math.abs(o.x - t.x) < 60) dmgMon(B, m, o, J.splash);
    }
  }
}
function bossFail(B, why) {
  // 실패하면 45초 동안 사냥하며 강해진 뒤 다시 도전 (자동 도전이 켜져 있을 때)
  B.ev.push({ e: 'bossfail', why }); B.boss = null; B.mons.length = 0; B.failCool = 45; B.pause = 2;
}

// 방치 보상: 마지막 접속 뒤 흐른 시간(최대 12시간) × 최근 사냥 속도 × 60%
export const OFF_MAX = 12 * 3600;
export function offline(S, now = Date.now()) {
  const sec = Math.min(OFF_MAX, Math.max(0, (now - (S.lastAt || now)) / 1000));
  if (sec < 120) return null;
  const g = (S.rate.g || monGold(S.s) * .3) * sec * .6, e = (S.rate.e || monExp(S.s) * .3) * sec * .6;
  return { sec, g, e };
}
