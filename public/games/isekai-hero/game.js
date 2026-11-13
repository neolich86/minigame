// 이세계 용사 — 화면·조작·저장
import * as C from './core.js';
const { JOBS, JOB_IDS, SKILLS, UPS, fmt } = C;
const $ = (id) => document.getElementById(id);
const MG = window.MGH || null;
const Q = new URLSearchParams(location.search), TEST = Q.has('test');
const LS = 'isekai-hero-v1';

// ---------- 그림 불러오기 ----------
const IMG = {}, FX = {};
const loadImg = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
const FX_NAMES = ['fireball-impact', 'hit-spark', 'crit-hit', 'level-up', 'coin-pickup', 'frost-nova', 'ice-spike', 'chain-lightning', 'meteor-strike', 'ground-flames', 'blizzard'];
const MON_KEYS = Object.keys(C.MON);
let ATL = null;
async function loadAll() {
  const [meta, heroes] = await Promise.all([fetch('assets/heroes.json').then((r) => r.json()), loadImg('assets/heroes.webp')]);
  ATL = meta; IMG.heroes = heroes;
  await Promise.all([
    ...MON_KEYS.map(async (k) => { IMG[k] = await loadImg(`assets/mon/${k}.png`); }),
    ...FX_NAMES.map(async (k) => { const [m, im] = await Promise.all([fetch(`assets/fx/${k}.json`).then((r) => r.json()), loadImg(`assets/fx/${k}.png`)]); FX[k] = { m, im }; }),
    document.fonts ? Promise.race([document.fonts.load('16px G'), new Promise((r) => setTimeout(r, 2500))]) : 0,
  ]);
}
// 직업 그림: heroes.json = { knight0: { walk: [[x,y,w,h,발x,발y]...], idle: [...], atk: [...], face: [x,y,크기] }, knight1: ... }
// walk 는 기존 걷기 5컷, idle·atk 는 RPG 디펜스와 같은 공격 모션 시트(대기 1컷 + 공격 4컷)
// 1차 = 0, 2차·최종 = 1 (시트에서 2차와 최종이 같은 그림). 그림은 오른쪽을 보고 있음.
const fkey = (job, T) => job + (T > 0 ? 1 : 0);
function drawFig(g, job, T, kind, f, x, y, sc) {
  const L = ATL[fkey(job, T)][kind], fr = L[f % L.length];
  g.drawImage(IMG.heroes, fr[0], fr[1], fr[2], fr[3], x - fr[4] * sc, y - fr[5] * sc, fr[2] * sc, fr[3] * sc);
}
function figCanvas(cv, job, T, f = 0, kind = 'walk') {
  const g = cv.getContext('2d'); cv.width = 96; cv.height = 128; g.imageSmoothingEnabled = false; g.clearRect(0, 0, 96, 128);
  drawFig(g, job, T, kind, f, 48, 125, .95);
}
function faceCanvas(cv, job, T) {
  const g = cv.getContext('2d'); cv.width = cv.height = 48; g.imageSmoothingEnabled = false; g.clearRect(0, 0, 48, 48);
  const grd = g.createLinearGradient(0, 0, 0, 48); grd.addColorStop(0, '#3a3070'); grd.addColorStop(1, '#1a1640'); g.fillStyle = grd; g.fillRect(0, 0, 48, 48);
  const fc = ATL[fkey(job, T)].face; g.drawImage(IMG.heroes, fc[0], fc[1], fc[2], fc[2], 0, 2, 48, 48);
}

// 받침에 따라 '로/으로'
const ro = (w) => { const c = w.charCodeAt(w.length - 1) - 0xac00; const jong = c >= 0 && c < 11172 ? c % 28 : 0; return w + (jong && jong !== 8 ? '으로' : '로'); };
// ---------- 상태 ----------
let S = null, B = null;
let W = 400, H = 700, k = 1, DPR = 1, Y0 = 350;
const cv = $('cv'), g = cv.getContext('2d');
function resize() {
  const r = $('wrap').getBoundingClientRect(); W = r.width; H = r.height; DPR = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); k = W / C.FIELD_W; Y0 = H * .5; groundCache = {};
}
addEventListener('resize', resize);

// ---------- 바닥 (지역별, 가로로 흐름) ----------
let groundCache = {};
function rng(sd) { return () => (sd = (sd * 16807) % 2147483647) / 2147483647; }
function groundTile(ri) {
  if (groundCache[ri]) return groundCache[ri];
  const PX = 3, w = Math.ceil(W / PX) * 2, h = Math.ceil(H / PX), c = document.createElement('canvas'); c.width = w; c.height = h; const gg = c.getContext('2d');
  const P = [{ a: '#6fb84a', b: '#62a842', c: '#7ec653', path: '#c9a46a', pd: '#b8925a' }, { a: '#e0b66a', b: '#d4a75c', c: '#ecc47c', path: '#c89a52', pd: '#b68a46' }, { a: '#2a2734', b: '#24212e', c: '#302c3c', path: '#1e1b26', pd: '#17141e' }][ri];
  gg.fillStyle = P.a; gg.fillRect(0, 0, w, h);
  const r = rng(5 + ri * 31);
  for (let i = 0; i < w * h / 9; i++) { gg.fillStyle = r() < .5 ? P.b : P.c; gg.fillRect(r() * w | 0, r() * h | 0, 2, 1); }
  if (ri === 2) { gg.strokeStyle = 'rgba(0,0,0,.45)'; gg.lineWidth = 1; for (let y = 0; y < h; y += 12) { gg.beginPath(); gg.moveTo(0, y + .5); gg.lineTo(w, y + .5); gg.stroke(); for (let x = (y / 12) % 2 ? 0 : 9; x < w; x += 18) { gg.beginPath(); gg.moveTo(x + .5, y); gg.lineTo(x + .5, y + 12); gg.stroke(); } } }
  if (ri === 1) { gg.fillStyle = 'rgba(160,110,50,.25)'; for (let i = 0; i < 26; i++) { const x = r() * w, y = r() * h; for (let j = 0; j < 30; j++) gg.fillRect((x + j * 2) % w | 0, y + Math.sin(j * .4) * 2 | 0, 2, 1); } }
  const py = Y0 / PX;
  for (let x = 0; x < w; x++) { const yy = py + Math.sin(x / w * Math.PI * 2 * 3) * 6; gg.fillStyle = P.path; gg.fillRect(x, yy - 15, 1, 30); gg.fillStyle = P.pd; if (x % 7 === 0) gg.fillRect(x, yy - 4 + ((x * 13) % 9), 2, 1); }
  // 장식은 따로 그려 좌우로 이어 붙임 (가장자리에서 잘리지 않게)
  const dc = document.createElement('canvas'); dc.width = w + 40; dc.height = h; const main = gg;
  { const gg = dc.getContext('2d'); gg.translate(20, 0);
  const r2 = rng(17 + ri);
  for (let i = 0; i < w * h / 260; i++) {
    const x = r2() * w | 0, y = r2() * h | 0, kd = r2(); if (Math.abs(y - py) < 20) continue;
    if (ri === 0) { if (kd < .55) { gg.fillStyle = ['#ff8fb8', '#ffe066', '#ffffff', '#c59bff'][i % 4]; gg.fillRect(x, y, 2, 2); gg.fillStyle = '#3f8f30'; gg.fillRect(x, y + 2, 1, 1); } else { gg.fillStyle = '#4a9a38'; gg.fillRect(x, y, 1, 3); gg.fillRect(x + 2, y + 1, 1, 2); gg.fillRect(x - 1, y + 1, 1, 2); } }
    if (ri === 1) { if (kd < .2) { gg.fillStyle = '#4f8a3a'; gg.fillRect(x, y - 6, 2, 8); gg.fillRect(x - 3, y - 3, 3, 1); gg.fillRect(x - 3, y - 5, 1, 2); gg.fillRect(x + 2, y - 4, 3, 1); gg.fillRect(x + 4, y - 6, 1, 2); } else { gg.fillStyle = '#b48a4e'; gg.fillRect(x, y, 3, 2); gg.fillStyle = '#f4d898'; gg.fillRect(x, y, 2, 1); } }
    if (ri === 2) { if (kd < .25) { gg.fillStyle = '#5a566a'; gg.fillRect(x, y, 5, 6); gg.fillRect(x + 1, y - 1, 3, 1); gg.fillStyle = 'rgba(0,0,0,.4)'; gg.fillRect(x, y + 6, 6, 2); } else if (kd < .5) { gg.fillStyle = '#c070ff'; gg.fillRect(x, y, 1, 1); gg.fillStyle = 'rgba(192,112,255,.25)'; gg.fillRect(x - 1, y - 1, 3, 3); } else { gg.fillStyle = '#3c3848'; gg.fillRect(x, y, 2, 1); } }
  }
  for (let i = 0; i < w / 14; i++) {
    const x = r2() * w | 0, top = r2() < .5, y = (top ? r2() * h * .2 : h * .8 + r2() * h * .2) | 0;
    if (ri === 0) { gg.fillStyle = 'rgba(0,0,0,.2)'; gg.beginPath(); gg.ellipse(x + 2, y + 7, 8, 4, 0, 0, 7); gg.fill(); gg.fillStyle = '#2f7a3a'; gg.beginPath(); gg.arc(x, y, 8, 0, 7); gg.fill(); gg.fillStyle = '#3f8f45'; gg.beginPath(); gg.arc(x - 2, y - 2, 6, 0, 7); gg.fill(); }
    if (ri === 1) { gg.fillStyle = '#a07a44'; gg.beginPath(); gg.ellipse(x, y, 10, 5, 0, 0, 7); gg.fill(); gg.fillStyle = '#c69a5a'; gg.beginPath(); gg.ellipse(x - 2, y - 2, 8, 3, 0, 0, 7); gg.fill(); }
    if (ri === 2) { gg.fillStyle = '#16131e'; gg.fillRect(x - 1, y - 8, 2, 9); gg.fillRect(x - 5, y - 6, 4, 1); gg.fillRect(x + 1, y - 4, 5, 1); }
  }
  }
  for (const dx of [-20 - w, -20, w - 20]) main.drawImage(dc, dx, 0);
  return (groundCache[ri] = c);
}
const circleCache = {};
function magicCircle(col) {
  if (circleCache[col]) return circleCache[col];
  const r = 96, S2 = r * 2 + 20, c = document.createElement('canvas'); c.width = c.height = S2 * 2; const q = c.getContext('2d'); q.scale(2, 2); const cx = S2 / 2, cy = S2 / 2;
  q.strokeStyle = col; q.shadowColor = col; q.shadowBlur = 10; q.lineWidth = 3; q.beginPath(); q.arc(cx, cy, r, 0, 7); q.stroke(); q.lineWidth = 1.5; q.beginPath(); q.arc(cx, cy, r * .82, 0, 7); q.stroke(); q.beginPath(); q.arc(cx, cy, r * .45, 0, 7); q.stroke();
  for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283, b = (i + 2) / 6 * 6.283; q.beginPath(); q.moveTo(cx + Math.cos(a) * r * .82, cy + Math.sin(a) * r * .82); q.lineTo(cx + Math.cos(b) * r * .82, cy + Math.sin(b) * r * .82); q.stroke(); }
  q.font = `${r * .12}px serif`; q.fillStyle = col; for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; q.save(); q.translate(cx + Math.cos(a) * r * .91, cy + Math.sin(a) * r * .91); q.rotate(a + 1.57); q.fillText('ᚱᚨᚾᛟᛋᛖᛁ'[i % 7], -3, 3); q.restore(); }
  const gr = q.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, col + '30'); gr.addColorStop(1, col + '00'); q.fillStyle = gr; q.beginPath(); q.arc(cx, cy, r, 0, 7); q.fill();
  return (circleCache[col] = c);
}

// ---------- 연출 ----------
const fxs = [], nums = [], shots = [], banners = []; let shake = 0;
const sx = (x) => x * k, sy = (y) => Y0 + y * k * 1.35;
function addFx(name, x, y, sc = 1, o = {}) { if (!FX[name]) return; fxs.push({ name, x, y, sc, t: -(o.dl || 0), add: o.add !== false, tint: o.tint, len: o.len }); }
function addNum(x, y, d, crit, c) {
  if (nums.length > 60) nums.shift();
  nums.push({ x: x + (Math.random() - .5) * 18, y, t: 0, s: fmt(d), crit, c });
}
function banner(text, sub, col = '#ffe08a') { banners.length = 0; banners.push({ text, sub, col, t: 0 }); }
const byId = new Map();
function handleEvents() {
  byId.clear(); for (const m of B.party) byId.set(m.id, m); for (const m of B.mons) byId.set(m.id, m);
  for (const e of B.ev) {
    switch (e.e) {
      case 'dmg': addNum(sx(e.x), sy(e.y) - e.h * k * 1.3, e.d, e.crit, e.c); if (e.crit) addFx('crit-hit', sx(e.x), sy(e.y) - e.h * k * .5, .7 * k); break;
      case 'atk': {
        const m = byId.get(e.who); if (!m) break; const x0 = sx(m.x) + 10 * k, y0 = sy(m.y) - 40 * k, x1 = sx(e.tx), y1 = sy(e.ty) - 20 * k;
        if (e.job === 'knight' || e.job === 'assassin') addFx('hit-spark', x1, y1, (e.job === 'knight' ? 1 : .75) * k, { dl: .12 });
        else shots.push({ job: e.job, x0, y0, x1, y1, t: 0, d: e.job === 'assassin' ? .14 : .22 });
        break;
      }
      case 'fx': fxEvent(e); break;
      case 'skill': { const m = byId.get(e.who); if (m) { m.say = e.name; m.sayT = 1.1; m.atkT = m.atkD = .45; } flashSkill(e.sk); break; }
      case 'kill': addFx('coin-pickup', sx(e.x), sy(e.y) - 16 * k, 1.1 * k); if (e.boss) { shake = .5; } break;
      case 'hurt': { const m = byId.get(e.id); if (m) nums.push({ x: sx(m.x), y: sy(m.y) - 100 * k, t: 0, s: '-' + fmt(e.d), crit: false, c: 'r' }); break; }
      case 'lv': for (const m of B.party) addFx('level-up', sx(m.x), sy(m.y) + 4, 1.1 * k); if (e.L >= C.MAX_LV) banner('레벨 99 달성!', S.T < 2 ? '전직할 수 있어요 — 아래 ✨전직' : '최고 레벨', '#ffe08a'); dirty = true; break;
      case 'boss': banner(e.last ? '지역 보스 등장!' : '보스 등장!', `${C.BOSS_TIME}초 안에 쓰러뜨리세요`, '#ff6a5a'); shake = .3; break;
      case 'clear': banner('스테이지 클리어!', C.stageName(S.s), '#7ae0ff'); dirty = true; save(); break;
      case 'bossfail': banner(e.why === 'time' ? '시간 초과…' : '파티 전멸…', '사냥으로 더 강해진 뒤 다시 도전!', '#ff8a8a'); break;
      case 'wipe': banner('파티 전멸…', '잠시 재정비 후 다시 사냥해요', '#ff8a8a'); break;
    }
  }
  B.ev.length = 0;
}
function fxEvent(e) {
  const tx = e.tx != null ? sx(e.tx) : 0, ty = e.ty != null ? sy(e.ty) : 0, m = byId.get(e.who);
  switch (e.k) {
    case 'quake': for (let i = 0; i < 5; i++) addFx('ground-flames', sx(e.x) + (i - 2) * 30 * k, Y0 + (i % 2 ? -40 : 40) * k * .8 + (i - 2) * 8 * k, 1.5 * k, { dl: i * .05 }); shake = .25; break;
    case 'wave': shots.push({ job: 'wave', x0: sx(m.x) + 20 * k, y0: sy(m.y) - 34 * k, x1: tx, y1: ty - 20 * k, t: 0, d: .2 }); addFx('crit-hit', tx, ty - 20 * k, 1.1 * k, { dl: .2 }); break;
    case 'holy': addFx('meteor-strike', tx, ty + 6 * k, 1.5 * k); shake = .35; break;
    case 'slash': addFx('hit-spark', tx + (Math.random() - .5) * 20 * k, ty - (14 + Math.random() * 30) * k, 1.0 * k, { dl: e.dl }); break;
    case 'boom': addFx('fireball-impact', tx + 20 * k, ty - 14 * k, 1.3 * k); break;
    case 'fireball': shake = .15; break;
    case 'frost': addFx('ice-spike', tx, ty + 6 * k, 1.3 * k); break;
    case 'arrow': shots.push({ job: 'mage', x0: sx(m.x) + 10 * k, y0: sy(m.y) - 40 * k, x1: tx, y1: ty - 20 * k, t: -e.dl, d: .2, big: 1 }); addFx('fireball-impact', tx + 14 * k, ty - 16 * k, 1 * k, { dl: e.dl + .2 }); break;
    case 'stone': addFx('frost-nova', tx, ty + 4 * k, 1.0 * k, { tint: 1 }); break;
    case 'bless': for (const p of B.party) addFx('level-up', sx(p.x), sy(p.y) + 4, 1.1 * k); break;
    case 'iron': for (const p of B.party) addFx('frost-nova', sx(p.x), sy(p.y) + 4, .8 * k); break;
    case 'chain': addFx('chain-lightning', sx(m.x) + 6 * k, sy(m.y) - 40 * k, 1 * k, { len: Math.hypot(tx - sx(m.x), ty - sy(m.y)) }); fxs[fxs.length - 1].ang = Math.atan2(ty - 20 * k - (sy(m.y) - 40 * k), tx - sx(m.x)); break;
    case 'cross': crossT = .7; for (const t of B.mons) if (!t.dead) addFx('crit-hit', sx(t.x), sy(t.y) - 20 * k, 1.3 * k); break;
    case 'hide': if (m) addFx('frost-nova', sx(m.x), sy(m.y) + 4, .7 * k); break;
    case 'venom': for (const t of B.mons) if (!t.dead) addFx('hit-spark', sx(t.x), sy(t.y) - 20 * k, 1.2 * k); break;
  }
}
let crossT = 0;

// ---------- 그리기 ----------
const NUMC = { '': '#fff', o: '#ffb35a', b: '#8fdcff', g: '#ffe98a', h: '#c9a0ff', r: '#ff6a6a', p: '#9ae66a' };
function drawFrame(dt) {
  g.setTransform(DPR, 0, 0, DPR, 0, 0); g.imageSmoothingEnabled = false;
  const ri = Math.floor(S.s / 10) % 3, tile = groundTile(ri), PX = 3;
  let ox = 0, oy = 0; if (shake > 0) { ox = (Math.random() - .5) * 8 * shake; oy = (Math.random() - .5) * 8 * shake; shake -= dt; }
  g.save(); g.translate(ox, oy);
  const tw = tile.width * PX, off = ((B.scroll * k) % tw + tw) % tw;
  g.drawImage(tile, -off, 0, tw, tile.height * PX); g.drawImage(tile, tw - off, 0, tw, tile.height * PX);
  // 파티 발밑 마법진
  const R = C.regionOf(S.s), mc = magicCircle(R.circle), cr = 170 * k;
  g.save(); g.globalAlpha = .75; g.globalCompositeOperation = 'screen'; g.translate(sx(C.AX + 10), Y0 + 6 * k); g.scale(1, .5); g.rotate(B.t * .25); g.drawImage(mc, -cr, -cr, cr * 2, cr * 2); g.restore();
  // 그림자 · 캐릭터 (y 순서)
  const list = [];
  for (const m of B.party) list.push({ y: m.y, p: m });
  for (const m of B.mons) list.push({ y: m.y + (m.boss ? 1 : 0), m });
  list.sort((a, b) => a.y - b.y);
  for (const it of list) it.p ? drawMember(it.p) : drawMon(it.m);
  // 투사체
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i]; s.t += dt; const u = Math.max(0, Math.min(1, s.t / s.d)); if (s.t < 0) continue;
    const x = s.x0 + (s.x1 - s.x0) * u, y = s.y0 + (s.y1 - s.y0) * u - Math.sin(u * Math.PI) * 14 * k;
    g.save(); g.globalCompositeOperation = 'lighter';
    if (s.job === 'mage') { orb(x, y, (s.big ? 9 : 7) * k, '255,140,40'); }
    else if (s.job === 'priest') { orb(x, y, 6 * k, '255,230,120'); }
    else if (s.job === 'assassin') { g.strokeStyle = 'rgba(255,200,220,.95)'; g.lineWidth = 3 * k; g.beginPath(); g.moveTo(x - 16 * k, y); g.lineTo(x, y); g.stroke(); g.fillStyle = '#fff'; g.fillRect(x - 2, y - 1.5, 6 * k, 3); }
    else if (s.job === 'wave') { g.strokeStyle = 'rgba(180,220,255,.95)'; g.lineWidth = 4 * k; g.beginPath(); g.arc(x - 20 * k, y, 22 * k, -1, 1); g.stroke(); }
    g.restore();
    if (u >= 1) { shots.splice(i, 1); if (s.job === 'mage' && !s.big) addFx('fireball-impact', s.x1 + 12 * k, s.y1, .7 * k); else if (s.job === 'priest') addFx('hit-spark', s.x1, s.y1, .8 * k); else if (s.job === 'assassin') addFx('hit-spark', s.x1, s.y1, .6 * k); }
  }
  // 스프라이트 이펙트
  for (let i = fxs.length - 1; i >= 0; i--) {
    const f = fxs[i]; f.t += dt; if (f.t < 0) continue; const F = FX[f.name], m = F.m;
    let acc = 0, fr = -1; for (let j = 0; j < m.f.length; j++) { acc += m.f[j][3] / 1000; if (f.t < acc) { fr = j; break; } }
    if (fr < 0) { fxs.splice(i, 1); continue; }
    const q = m.f[fr];
    g.save(); if (f.add) g.globalCompositeOperation = 'lighter'; if (f.tint) g.filter = 'hue-rotate(200deg) saturate(.4)';
    g.translate(f.x, f.y); if (f.ang != null) g.rotate(f.ang);
    if (f.ang != null) { const sc2 = Math.max(.4, (fxs[i].len || 100) / m.w); g.drawImage(F.im, q[0], q[1], m.w, m.h, 0, -m.h * f.sc / 2, m.w * sc2, m.h * f.sc); }
    else g.drawImage(F.im, q[0], q[1], m.w, m.h, -m.pv[0] * f.sc, -m.pv[1] * f.sc, m.w * f.sc, m.h * f.sc);
    g.restore();
  }
  // 성광 십자
  if (crossT > 0) { crossT -= dt; const a = Math.min(1, crossT * 2); g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * .8; const cx = sx(300), cy = Y0 - 40 * k; const gr = g.createLinearGradient(cx, cy - 160 * k, cx, cy + 120 * k); gr.addColorStop(0, 'rgba(255,240,150,0)'); gr.addColorStop(.5, 'rgba(255,240,150,1)'); gr.addColorStop(1, 'rgba(255,240,150,0)'); g.fillStyle = gr; g.fillRect(cx - 14 * k, cy - 160 * k, 28 * k, 280 * k); g.fillRect(cx - 90 * k, cy - 50 * k, 180 * k, 22 * k); g.restore(); }
  // 버프 장판
  if (B.buffs.iron > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .25 + .1 * Math.sin(B.t * 8); g.strokeStyle = '#8fd0ff'; g.lineWidth = 3 * k; g.beginPath(); g.ellipse(sx(C.AX + 10), Y0 - 30 * k, 100 * k, 80 * k, 0, 0, 7); g.stroke(); g.restore(); }
  // 숫자
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  for (let i = nums.length - 1; i >= 0; i--) {
    const n = nums[i]; n.t += dt; if (n.t > .9) { nums.splice(i, 1); continue; }
    const sz = (n.crit ? 21 : 15) * Math.min(1.25, k) * (n.t < .1 ? 1 + (.1 - n.t) * 4 : 1);
    g.globalAlpha = n.t > .6 ? (.9 - n.t) / .3 : 1; g.font = `700 ${sz}px G`; g.lineWidth = 4; g.strokeStyle = '#000';
    const y = n.y - n.t * 40;
    if (n.crit) { g.font = `700 ${sz * .55}px G`; g.strokeText('치명', n.x, y - sz * .8); g.fillStyle = '#ff8a4a'; g.fillText('치명', n.x, y - sz * .8); g.font = `700 ${sz}px G`; }
    g.strokeText(n.s, n.x, y); g.fillStyle = n.crit ? '#ffd43b' : NUMC[n.c] || '#fff'; g.fillText(n.s, n.x, y);
  }
  g.globalAlpha = 1;
  g.restore();
  // 비네트
  const v = g.createRadialGradient(W / 2, H * .5, W * .4, W / 2, H * .5, W * 1.1); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, ri === 2 ? 'rgba(0,0,0,.7)' : 'rgba(0,0,0,.35)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
  // 배너
  for (let i = banners.length - 1; i >= 0; i--) {
    const b = banners[i]; b.t += dt; if (b.t > 2.2) { banners.splice(i, 1); continue; }
    const a = b.t < .2 ? b.t / .2 : b.t > 1.8 ? (2.2 - b.t) / .4 : 1, y = H * .3;
    g.globalAlpha = a; const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.2, 'rgba(0,0,0,.7)'); gr.addColorStop(.8, 'rgba(0,0,0,.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, y - 30, W, 60);
    g.font = `700 ${Math.round(22 * (b.t < .15 ? 1.3 - b.t * 2 : 1))}px G`; g.lineWidth = 5; g.strokeStyle = '#000'; g.strokeText(b.text, W / 2, y - 8); g.fillStyle = b.col; g.fillText(b.text, W / 2, y - 8);
    if (b.sub) { g.font = '700 12px G'; g.lineWidth = 3; g.strokeText(b.sub, W / 2, y + 16); g.fillStyle = '#e8e6ff'; g.fillText(b.sub, W / 2, y + 16); }
    g.globalAlpha = 1;
  }
}
function orb(x, y, r, rgb) { const gr = g.createRadialGradient(x, y, 0, x, y, r * 2.2); gr.addColorStop(0, `rgba(255,255,255,1)`); gr.addColorStop(.3, `rgba(${rgb},.9)`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 2.2, 0, 7); g.fill(); }
function shadowAt(x, y, w) { g.fillStyle = 'rgba(0,0,0,.32)'; g.beginPath(); g.ellipse(x, y, w / 2, w * .16, 0, 0, 7); g.fill(); }
function hpBar(x, y, w, f, col) { g.fillStyle = '#000'; g.fillRect(x - w / 2 - 1.5, y - 1.5, w + 3, 7); g.fillStyle = '#300'; g.fillRect(x - w / 2, y, w, 4); g.fillStyle = col; g.fillRect(x - w / 2, y, w * Math.max(0, f), 4); }
function drawMember(m) {
  // 근접 직업은 공격할 때 앞으로 한 걸음 내디뎠다 돌아옴
  const lunge = m.atkT > 0 && JOBS[m.job].melee ? Math.sin((1 - m.atkT / (m.atkD || .4)) * Math.PI) * 12 * k : 0;
  const x = sx(m.x) + lunge, y = sy(m.y), sc = .9 * k;
  shadowAt(x, y, 44 * k);
  let kind = 'walk', f = 0, bob = 0;
  if (m.dead) { g.save(); g.globalAlpha = .35; g.filter = 'grayscale(1)'; drawFig(g, m.job, S.T, 'walk', 0, x, y + 2, sc); g.restore(); return; }
  // 평타는 공격 3컷, 스킬(atkD .45)은 마무리 컷까지 4컷. 멈춰 있을 때는 대기 그림
  if (m.atkT > 0) { const n = (m.atkD || .4) >= .45 ? 4 : 3; kind = 'atk'; f = Math.min(n - 1, Math.floor((1 - m.atkT / (m.atkD || .4)) * n)); }
  else if (B.walking) f = Math.floor(m.anim * .9) % 5;
  else { kind = 'idle'; bob = Math.sin(m.anim) * 1.2; }
  if (m.hitT > 0) { g.save(); g.filter = 'brightness(1.8) sepia(.6) hue-rotate(-30deg)'; drawFig(g, m.job, S.T, kind, f, x + (Math.random() - .5) * 3, y + bob, sc); g.restore(); }
  else drawFig(g, m.job, S.T, kind, f, x, y + bob, sc);
  if (B.buffs.bless > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .35 + .15 * Math.sin(B.t * 6 + m.id); orb(x, y - 40 * k, 14 * k, '255,220,120'); g.restore(); }
  if (m.crit5 > 0) { g.save(); g.globalAlpha = .55; g.filter = 'brightness(0.4) saturate(2) hue-rotate(250deg)'; drawFig(g, m.job, S.T, kind, f, x - 6 * k, y + bob, sc); g.restore(); }
  hpBar(x, y - 104 * k, 34 * k, m.hp / m.st.hp, '#4be06a');
  if (m.sayT > 0) {
    m.sayT -= 1 / 60; g.save(); g.globalAlpha = Math.min(1, m.sayT * 3); g.font = '700 11px G'; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = '#000';
    g.strokeText(m.say + '!', x, y - 114 * k); g.fillStyle = JOBS[m.job].color; g.fillText(m.say + '!', x, y - 114 * k); g.restore();
  }
}
function drawMon(m) {
  const im = IMG[m.k]; if (!im) return; const h = m.h * k * 1.35, w = h * im.width / im.height, x = sx(m.x), y = sy(m.y);
  const lift = m.fly ? 14 * k + Math.sin(B.t * 4 + m.id) * 3 * k : 0, bob = m.dead ? 0 : Math.abs(Math.sin(B.t * 6 + m.id)) * 2 * k;
  g.save(); if (m.dead) g.globalAlpha = Math.max(0, 1 - m.dead / .6);
  shadowAt(x, y, w * .7);
  let filt = ''; if (m.hitT > 0) filt += 'brightness(2.2) '; if (m.stun > 0) filt += 'grayscale(1) brightness(1.2) '; else if (m.slow > 0) filt += 'hue-rotate(160deg) saturate(1.4) '; if (m.poison > 0) filt += 'sepia(.4) hue-rotate(50deg) ';
  if (filt) g.filter = filt;
  const sq = m.dead ? 1 - m.dead : 1; g.drawImage(im, x - w / 2, y - h * sq - lift - bob, w, h * sq); g.filter = 'none';
  if (m.root > 0) { g.strokeStyle = '#ffe066'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(x, y - h * (.25 + i * .22) - lift, w * .5, 5 * k, 0, 0, 7); g.stroke(); } }
  if (B.buffs.mark > 0 && !m.dead) { g.font = `700 ${12 * k}px G`; g.textAlign = 'center'; g.fillStyle = '#c070ff'; g.fillText('▼', x + w * .35, y - h - lift - 2); }
  g.restore();
  if (!m.dead && !m.boss && m.hp < m.max) hpBar(x, y - h - lift - 10 * k, Math.max(26, w * .6), m.hp / m.max, '#ff4b3e');
}

// ---------- HUD ----------
let dirty = true, hudT = 0;
// 아이콘: VerArc Stash Basic Skills and Buffs (16px → assets/icons.png 64px 한 줄)
const ICO = { quake: 0, iron: 1, wave: 2, holy: 3, storm: 4, venom: 5, hide: 6, shadow: 7, fireball: 8, frost: 9, arrows: 10, stone: 11, bless: 12, mark: 13, chain: 14, cross: 15, s_atk: 16, s_hp: 17, s_cr: 18, s_cd: 19, s_as: 20 };
const ic = (n, px) => `<b class="ico" style="--i:${ICO[n]}${px ? `;--s:${px}px` : ''}"></b>`;
const SK_ICON = new Proxy({}, { get: (_, k) => ic(k, 16) });
const skEls = {};
function buildSkillBar() {
  const box = $('skbar'); box.innerHTML = '';
  for (const j of C.members(S)) for (const sk of SKILLS[j]) {
    const d = document.createElement('div'); d.className = 'sb' + (sk.t > S.T ? ' lock' : '');
    d.style.background = `radial-gradient(circle at 50% 40%, ${JOBS[j].color}55, #14102c 75%)`; d.style.boxShadow = `inset 0 0 0 2px ${JOBS[j].color}`;
    d.innerHTML = `${ic(sk.id, 0)}<small class="sh">${sk.t > S.T ? JOBS[j].names[sk.t] : ''}</small>`; d.title = sk.name;
    box.appendChild(d); skEls[j + sk.id] = d;
  }
}
function flashSkill(id) { for (const key in skEls) if (key.endsWith(id)) { const e = skEls[key]; e.classList.remove('flash'); void e.offsetWidth; e.classList.add('flash'); } }
const partyEls = [];
function buildParty() {
  const box = $('party'); box.innerHTML = ''; partyEls.length = 0;
  const ms = C.members(S);
  ms.forEach((j, i) => {
    const d = document.createElement('div'); d.className = 'pt'; d.style.borderColor = JOBS[j].color;
    const c = document.createElement('canvas'); faceCanvas(c, j, S.T); d.appendChild(c);
    d.insertAdjacentHTML('beforeend', `<span><b></b></span><em class="sh">${i ? JOBS[j].names[S.T] : '나'}</em>`);
    d.onclick = () => openSheet(i ? 'comp' : 'up'); box.appendChild(d); partyEls.push({ d, j });
  });
  if (ms.length < 4) {
    const d = document.createElement('div'); d.className = 'pt add'; d.id = 'addSlot'; d.textContent = '＋'; d.onclick = () => openSheet('comp'); box.appendChild(d);
    for (let i = ms.length + 1; i < 4; i++) { const e = document.createElement('div'); e.className = 'pt add'; e.style.opacity = .45; e.textContent = '＋'; e.onclick = () => openSheet('comp'); box.appendChild(e); }
    const b = document.createElement('div'); b.className = 'bub sh'; b.id = 'bub'; b.hidden = true; b.style.top = (ms.length * 57) + 'px'; box.appendChild(b);
  }
}
function rebuild() { faceCanvas($('avc'), S.job, S.T); buildParty(); buildSkillBar(); dirty = true; }
let fightPx = 0; // 위 HUD와 아래 메뉴 사이, 전투가 보이는 높이의 절반(px)
function updHud() {
  { const wr = $('wrap').getBoundingClientRect(), t = $('stg').getBoundingClientRect().bottom - wr.top, bt = document.querySelector('.bot').getBoundingClientRect().top - wr.top; fightPx = Math.min(Y0 - t, bt - Y0) - 10; }
  $('lv').textContent = 'Lv.' + S.L; $('jb').textContent = C.jobName(S.job, S.T); $('nm').textContent = S.name;
  const need = C.expNeed(S.L, S.T), pct = S.L >= C.MAX_LV ? 100 : Math.min(100, S.exp / need * 100);
  $('xpb').style.width = pct + '%'; $('xpt').textContent = S.L >= C.MAX_LV ? 'MAX' : pct.toFixed(1) + '%';
  $('cp').textContent = '⚔ 전투력 ' + fmt(C.power(S)); $('gold').textContent = fmt(S.gold);
  $('gps').textContent = S.rate.g > 0 ? `+${fmt(S.rate.g * 60)}/분` : '';
  const bf = [];
  if (B.buffs.bless > 0) bf.push(['#d8a82a', ic('bless', 18), B.buffs.bless]); if (B.buffs.iron > 0) bf.push(['#2a8ad8', ic('iron', 18), B.buffs.iron]); if (B.buffs.mark > 0) bf.push(['#7a3ad8', ic('mark', 18), B.buffs.mark]);
  $('buffs').innerHTML = bf.map(([c, i, t]) => `<div style="background:${c}">${i}<small>${Math.ceil(t)}</small></div>`).join('');
  // 스테이지
  const boss = B.boss, stg = $('stg'); stg.classList.toggle('boss', !!boss);
  $('sname').textContent = boss ? `${boss.name}` : C.stageName(S.s);
  if (boss) { $('pill').textContent = `보스전 · ${C.stageName(S.s)} · ${Math.ceil(B.bossT)}초`; $('gbar').style.width = (boss.hp / boss.max * 100) + '%'; $('gtxt').textContent = fmt(Math.max(0, boss.hp)); }
  else { $('pill').textContent = `지역 토벌 ${Math.floor(S.kills / C.KILLS_PER_STAGE * 100)}%`; $('gbar').style.width = (S.kills / C.KILLS_PER_STAGE * 100) + '%'; $('gtxt').textContent = C.canBoss(S) ? '보스 도전 가능' : `${S.kills} / ${C.KILLS_PER_STAGE}`; }
  const showBtn = !boss && C.canBoss(S) && (!S.autoBoss || B.failCool > 0);
  $('bossrow').hidden = !(C.canBoss(S) && !boss); $('bossGo').hidden = !showBtn; $('autoBoss').checked = S.autoBoss;
  if (showBtn) $('bossGo').textContent = B.failCool > 0 && S.autoBoss ? `보스 도전 ▶ (${Math.ceil(B.failCool)})` : '보스 도전 ▶';
  // 파티 체력
  partyEls.forEach((p, i) => { const m = B.party[i]; if (!m) return; p.d.querySelector('b').style.width = (m.hp / m.st.hp * 100) + '%'; p.d.classList.toggle('dead', m.dead); });
  // 스킬 쿨타임
  for (const m of B.party) for (const sk of SKILLS[m.job]) { const e = skEls[m.job + sk.id]; if (e && sk.t <= S.T) e.style.setProperty('--c', (100 - Math.max(0, Math.min(1, m.sk[sk.id] / sk.cd)) * 100) + '%'); }
  // 동료 모집 말풍선 · 알림 점
  const canComp = S.comp.length < 3 && S.gold >= C.compPrice(S), canJob = S.L >= C.MAX_LV && S.T < 2;
  const bub = $('bub'), add = $('addSlot');
  if (bub) { bub.hidden = !canComp; if (canComp) bub.innerHTML = `동료 모집 · 🪙${fmt(C.compPrice(S))}<br>구매 가능!`; }
  if (add) add.classList.toggle('can', canComp);
  const canUp = UPS.some((u) => S.up[u.id] < u.max && S.gold >= C.upCost(u, S.up[u.id]));
  document.querySelector('.nv[data-t=up]').classList.toggle('n', canUp && S.gold >= C.upCost(UPS[0], S.up.atk) * 3);
  document.querySelector('.nv[data-t=comp]').classList.toggle('n', canComp);
  document.querySelector('.nv[data-t=job]').classList.toggle('n', canJob);
  if (sheetTab && (dirty || sheetTab === 'up' || sheetTab === 'comp')) renderSheet(false);
  dirty = false;
}
$('bossGo').onclick = () => { if (C.canBoss(S) && !B.boss) { B.failCool = 0; C.startBoss(B); } };
$('autoBoss').onchange = (e) => { S.autoBoss = e.target.checked; save(); };

// ---------- 성장 창 ----------
let sheetTab = null, mul = 1;
const TABS = { up: '성장', comp: '동료', job: '전직', skill: '스킬', menu: '메뉴' };
document.querySelectorAll('.nv').forEach((b) => (b.onclick = () => (sheetTab === b.dataset.t ? closeSheet() : openSheet(b.dataset.t))));
$('shX').onclick = closeSheet;
function openSheet(t) { sheetTab = t; $('sheet').classList.add('on'); document.querySelectorAll('.nv').forEach((b) => b.classList.toggle('on', b.dataset.t === t)); renderSheet(true); }
function closeSheet() { sheetTab = null; $('sheet').classList.remove('on'); document.querySelectorAll('.nv').forEach((b) => b.classList.remove('on')); }
let lastSheetHtml = '';
function renderSheet(force) {
  const t = sheetTab; if (!t) return;
  $('shT').textContent = TABS[t];
  $('tabs').innerHTML = Object.entries(TABS).map(([id, n]) => `<button data-t="${id}" class="${id === t ? 'on' : ''}">${n}</button>`).join('');
  $('tabs').querySelectorAll('button').forEach((b) => (b.onclick = () => openSheet(b.dataset.t)));
  $('mul').innerHTML = t === 'up' ? ['1', '10', '100', 'max'].map((m) => `<button data-m="${m}" class="${String(mul) === m ? 'on' : ''}">${m === 'max' ? 'MAX' : 'x' + m}</button>`).join('') : '';
  $('mul').querySelectorAll('button').forEach((b) => (b.onclick = () => { mul = b.dataset.m === 'max' ? 'max' : +b.dataset.m; renderSheet(true); }));
  let html = '';
  if (t === 'up') html = UPS.map((u) => {
    const n = S.up[u.id], [cnt, cost] = C.upBulk(u, n, mul, S.gold), maxed = n >= u.max, ok = !maxed && cnt > 0 && S.gold >= cost;
    const icon = ic('s_' + u.id, 32);
    return `<div class="row"><div class="ic">${icon}</div><div class="tx"><b>${u.name} <span style="color:#ffe08a">Lv.${n}</span></b><small>${u.eff(n)}${u.max < Infinity ? ` · 최대 ${u.max}` : ''}</small></div>
      <button class="buy" data-up="${u.id}" ${ok ? '' : 'disabled'}>${maxed ? '최대' : `강화${cnt > 1 ? ' x' + cnt : ''}<br>🪙${fmt(cnt ? cost : C.upCost(u, n))}`}</button></div>`;
  }).join('') + `<div class="note">강화는 동료 모두에게 똑같이 적용돼요. 버튼을 꾹 누르면 계속 강화해요.</div>`;
  if (t === 'comp') {
    const price = C.compPrice(S);
    html = `<div class="note" style="margin:0 0 8px">동료는 주인공의 레벨·전직·강화를 그대로 따라와요. 주인공이 강해질수록 데려오는 값이 올라가요. 같은 직업은 한 명만.</div>` + JOB_IDS.map((j) => {
      const own = j === S.job ? '주인공' : S.comp.includes(j) ? '함께하는 중' : null;
      return `<div class="card"><div class="top"><canvas class="fig" data-fig="${j}"></canvas><div style="flex:1"><h5 class="sh" style="color:${JOBS[j].color}">${JOBS[j].names[S.T]}</h5><div class="rl">${JOBS[j].role}</div><p>${JOBS[j].desc}</p></div></div>
        <div class="sks">${SKILLS[j].map((s) => `<span class="${s.t > S.T ? 'l' : ''}">${SK_ICON[s.id]} ${s.name}${s.t > S.T ? ` (${JOBS[j].names[s.t]})` : ''}</span>`).join('')}</div>
        ${own ? `<button class="big ghost" disabled>${own}</button>` : `<button class="big" data-comp="${j}" ${S.gold >= price ? '' : 'disabled'}>데려오기 · 🪙${fmt(price)}</button>`}</div>`;
    }).join('');
  }
  if (t === 'job') {
    const J = JOBS[S.job], next = S.T + 1, ready = S.L >= C.MAX_LV && S.T < 2;
    html = `<div class="card"><div class="path">${[0, 1, 2].map((i) => `${i ? '<i>▶</i>' : ''}<div class="${i === S.T ? 'cur' : i > S.T ? 'lock' : ''}"><canvas data-fig="${S.job}" data-tier="${i}"></canvas>${J.names[i]}</div>`).join('')}</div>
      ${S.T >= 2 ? `<div class="note" style="text-align:center">최종 전직 완료! 다음 업데이트에서 더 강해질 수 있어요.</div>` :
      `<div class="note">레벨 99가 되면 <b style="color:#ffe08a">${ro(J.names[next])}</b> 전직할 수 있어요.<br>· 이름과 모습이 바뀌고 레벨은 1부터 다시 시작해요.<br>· 기본 능력이 ${C.TM[next] / C.TM[S.T]}배가 되어 레벨 1이어도 지금보다 강해요.<br>· 강화·동료·스테이지는 그대로, 동료도 함께 전직해요.<br>· 새 스킬: ${C.members(S).map((j) => SKILLS[j].filter((s) => s.t === next).map((s) => `${SK_ICON[s.id]} ${s.name}`).join(', ')).join(' · ')}</div>
      <button class="big" id="jobBtn" ${ready ? '' : 'disabled'}>${ready ? `✨ ${ro(J.names[next])} 전직하기` : `레벨 99 필요 (지금 Lv.${S.L})`}</button>`}</div>`;
  }
  if (t === 'skill') html = C.members(S).map((j) => `<div class="card"><h5 class="sh" style="color:${JOBS[j].color}">${JOBS[j].names[S.T]} · ${JOBS[j].role}</h5>${SKILLS[j].map((s) => `<div class="row" style="margin:6px 0 0;${s.t > S.T ? 'opacity:.5' : ''}"><div class="ic" style="background:radial-gradient(circle at 50% 40%, ${JOBS[j].color}55, #14102c 75%)">${ic(s.id, 32)}</div><div class="tx"><b>${s.name} <span style="font-size:10px;color:#bdb8e8">재사용 ${s.cd}초</span></b><small>${s.d}${s.t > S.T ? ` · ${JOBS[j].names[s.t]} 전직 시 열림` : ''}</small></div></div>`).join('')}</div>`).join('') + '<div class="note">스킬은 자동으로 사용돼요.</div>';
  if (t === 'menu') {
    const cloud = owner ? '☁️ 계정에 자동 저장 중' : MG && MG.save && MG.embedded ? '이 기기에 저장 중 · 로그인하면 계정에 저장돼요' : '이 기기에 자동 저장돼요';
    html = `<div class="card"><h5>${S.name} · ${C.jobName(S.job, S.T)} Lv.${S.L}</h5><p>최고 기록: ${C.stageName(Math.max(S.best, S.s))}<br>플레이 시간: ${Math.floor((S.playSec || 0) / 3600)}시간 ${Math.floor((S.playSec || 0) % 3600 / 60)}분</p></div>
      <div class="card"><h5>저장</h5><p>${cloud}</p>${!owner && MG && MG.save && MG.embedded && authKnown ? '<button class="big" id="loginBtn">로그인하고 계정에 저장</button>' : ''}</div>
      <div class="card"><h5>방치 보상</h5><p>게임을 꺼 두어도 최대 12시간 동안 최근 사냥 속도의 60%만큼 골드와 경험치가 쌓여요.</p></div>
      <div class="card"><h5>닉네임</h5><div class="nmrow" style="margin-top:6px"><input id="nm2" maxlength="8" value="${S.name.replace(/"/g, '')}"><button class="buy g" id="nmSave" style="min-width:60px">변경</button></div></div>
      <button class="big ghost" id="resetBtn">처음부터 다시 하기</button>`;
  }
  if (!force && html === lastSheetHtml) return;
  lastSheetHtml = html; const body = $('shB'), st = body.scrollTop; body.innerHTML = html; body.scrollTop = st;
  body.querySelectorAll('canvas[data-fig]').forEach((c) => figCanvas(c, c.dataset.fig, c.dataset.tier != null ? +c.dataset.tier : S.T));
  body.querySelectorAll('[data-up]').forEach((b) => holdBtn(b, () => doUp(b.dataset.up)));
  body.querySelectorAll('[data-comp]').forEach((b) => (b.onclick = () => buyComp(b.dataset.comp)));
  if ($('jobBtn')) $('jobBtn').onclick = jobChange;
  if ($('loginBtn')) $('loginBtn').onclick = () => MG.save.login();
  if ($('nmSave')) $('nmSave').onclick = () => { const v = $('nm2').value.trim(); if (v) { S.name = v.slice(0, 8); save(); toast('닉네임을 바꿨어요'); dirty = true; } };
  if ($('resetBtn')) $('resetBtn').onclick = () => modal(`<h3>처음부터 다시 할까요?</h3><p class="note" style="text-align:center">레벨·골드·동료·스테이지가 모두 사라지고 직업을 새로 골라요. 되돌릴 수 없어요.</p><button class="big" id="rsY" style="background:linear-gradient(#ff6a4a,#c42818);color:#fff">다시 시작</button><button class="big ghost" id="rsN">취소</button>`, () => {
    $('rsY').onclick = () => { closeModal(); closeSheet(); try { localStorage.removeItem(LS); } catch (e) { } S = null; B = null; showPick(); if (owner) cloudStoreNow(null); };
    $('rsN').onclick = closeModal;
  });
}
function holdBtn(b, fn) {
  let t1 = null, t2 = null, n = 0;
  const stop = () => { clearTimeout(t1); clearInterval(t2); t1 = t2 = null; };
  b.onpointerdown = (e) => { e.preventDefault(); n = 0; fn(); t1 = setTimeout(() => { t2 = setInterval(() => { n++; if (!fn()) stop(); }, n > 10 ? 50 : 90); }, 350); };
  b.onpointerup = b.onpointerleave = b.onpointercancel = stop;
}
function doUp(id) {
  const u = UPS.find((x) => x.id === id), [cnt, cost] = C.upBulk(u, S.up[id], mul, S.gold);
  if (!cnt || S.gold < cost) return false;
  S.gold -= cost; S.up[id] += cnt; C.syncParty(B); renderSheet(true); changed(); return true;
}
function buyComp(j) {
  const p = C.compPrice(S); if (S.gold < p || S.comp.includes(j) || j === S.job || S.comp.length >= 3) return;
  S.gold -= p; S.comp.push(j); C.syncParty(B); rebuild(); renderSheet(true);
  const m = B.party.find((x) => x.job === j); if (m) addFx('level-up', sx(m.x), sy(m.y) + 4, 1.2 * k);
  banner(`${JOBS[j].names[S.T]} 합류!`, `파티 ${S.comp.length + 1}/4`, JOBS[j].color); save();
}
function jobChange() {
  if (S.L < C.MAX_LV || S.T >= 2) return;
  const old = C.jobName(S.job, S.T); S.T++; S.L = 1; S.exp = 0; C.syncParty(B); for (const m of B.party) { m.dead = false; m.hp = m.st.hp; addFx('level-up', sx(m.x), sy(m.y) + 4, 1.4 * k); }
  rebuild(); renderSheet(true); shake = .4; banner(`${C.jobName(S.job, S.T)} 전직!`, `${old} → ${C.jobName(S.job, S.T)} · 새 스킬이 열렸어요`, '#ffe08a'); save();
}

// ---------- 모달 · 알림 ----------
function modal(html, bind) { $('mbox').innerHTML = html; $('modal').hidden = false; bind && bind(); }
function closeModal() { $('modal').hidden = true; }
let toastT = null;
function toast(t) { const e = $('toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('on'), 2000); }
function fmtDur(sec) { const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60); return h ? `${h}시간 ${m}분` : `${m}분`; }
function showOffline() {
  const o = C.offline(S); S.lastAt = Date.now(); if (!o) return;
  modal(`<h3>방치 보상</h3><p class="note" style="text-align:center">${fmtDur(o.sec)} 동안 파티가 사냥했어요${o.sec >= C.OFF_MAX ? ' (최대 12시간)' : ''}</p>
    <div class="rw"><div><small>골드</small>🪙 ${fmt(o.g)}</div><div><small>경험치</small>✨ ${fmt(o.e)}</div></div><button class="big" id="offOk">받기</button>`, () => {
    $('offOk').onclick = () => { S.gold += o.g; C.gainExp(B, o.e); B.ev.length = 0; closeModal(); rebuild(); save(); toast(`🪙 ${fmt(o.g)} 받았어요`); };
  });
}

// ---------- 저장 ----------
let owner = null, authKnown = false, cloudAt = null, saving = false, again = false, cloudT = null;
function save() {
  if (!S) return; S.lastAt = Date.now();
  try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) { }
  changed();
}
function changed() { if (owner) { clearTimeout(cloudT); cloudT = setTimeout(cloudStore, 4000); } }
async function cloudStore() {
  if (!owner || !S) return; if (saving) { again = true; return; } saving = true;
  try { let r = await MG.save.store({ ...S, owner }, cloudAt || undefined); if (r && r.conflict) { cloudAt = r.updatedAt; r = await MG.save.store({ ...S, owner }, cloudAt); } if (r && r.updatedAt) cloudAt = r.updatedAt; } catch (e) { }
  saving = false; if (again) { again = false; cloudStore(); }
}
function cloudStoreNow(data) { if (owner) MG.save.store(data ? { ...data, owner } : { reset: true, owner }, cloudAt || undefined).then((r) => { if (r && r.updatedAt) cloudAt = r.updatedAt; }).catch(() => { }); }
const progressOf = (d) => (d.T || 0) * 1e6 + (d.L || 0) * 1e3 + (d.s || 0);
function setupAuth() {
  if (!MG || !MG.save || !MG.embedded) return;
  MG.save.onAuth(async (u) => {
    owner = u ? u.id : null; authKnown = true; dirty = true; if (!u) return;
    try {
      const r = await MG.save.load(); cloudAt = r && r.updatedAt || null;
      const cl = r && r.data && C.sanitize(r.data);
      if (cl && (!S || progressOf(cl) > progressOf(S))) { S = cl; try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) { } if (B) { B = C.createBattle(S); $('pick').hidden = true; $('hud').hidden = false; rebuild(); } else startGame(); toast('☁️ 계정 기록을 불러왔어요'); }
      else if (S) cloudStore();
    } catch (e) { }
  });
}

// ---------- 직업 선택 ----------
let pickJob = null;
function showPick() {
  $('hud').hidden = true; $('pick').hidden = false; pickJob = null;
  $('jobs').innerHTML = JOB_IDS.map((j) => `<div class="jc" data-j="${j}"><canvas data-fig="${j}"></canvas><b class="sh" style="color:${JOBS[j].color}">${JOBS[j].names[0]}</b><div class="rl" style="color:#ffe08a">${JOBS[j].role}</div><p>${JOBS[j].desc}</p></div>`).join('');
  $('jobs').querySelectorAll('.jc').forEach((c) => (c.onclick = () => { pickJob = c.dataset.j; $('jobs').querySelectorAll('.jc').forEach((x) => x.classList.toggle('on', x === c)); $('startBtn').disabled = false; $('startBtn').textContent = `${ro(JOBS[pickJob].names[0])} 모험 시작`; }));
  $('startBtn').disabled = true; $('startBtn').textContent = '직업을 골라 주세요';
}
$('startBtn').onclick = () => { if (!pickJob) return; S = C.newSave(pickJob, $('nmIn').value.trim() || '용사'); save(); startGame(); setTimeout(() => toast('파티는 자동으로 사냥해요. 골드로 강해지세요!'), 600); };
let pickF = 0;
function animPick(dt) { pickF += dt * 6; document.querySelectorAll('#jobs canvas').forEach((c) => { figCanvas(c, c.dataset.fig, 0, Math.floor(pickF) % 5); }); }

// ---------- 시작 · 루프 ----------
function startGame() {
  $('pick').hidden = true; $('hud').hidden = false;
  B = C.createBattle(S); rebuild(); showOffline();
}
let last = performance.now(), rateT = 0, rateG = 0, rateE = 0, saveT = 0;
function loop(now) {
  const dt = Math.min(.1, Math.max(0, (now - last) / 1000)); last = now;
  if (!$('pick').hidden) { animPick(dt); g.setTransform(DPR, 0, 0, DPR, 0, 0); g.fillStyle = '#120e2a'; g.fillRect(0, 0, W, H); }
  else if (S && B) {
    B.viewY = (H / 2) / (k * 1.35);
    if (fightPx) B.fightY = Math.max(90, fightPx / (k * 1.35));
    if (!TEST || !window.__ih.frozen) { const n = Math.ceil(dt / .05); for (let i = 0; i < n; i++) C.step(B, dt / n); }
    handleEvents(); drawFrame(dt);
    hudT -= dt; if (hudT <= 0 || dirty) { hudT = .12; updHud(); }
    rateT += dt; if (rateT >= 10) { const gg = B.earn.g / rateT, ee = B.earn.e / rateT; S.rate.g = S.rate.g ? S.rate.g * .7 + gg * .3 : gg; S.rate.e = S.rate.e ? S.rate.e * .7 + ee * .3 : ee; B.earn.g = B.earn.e = 0; rateT = 0; }
    saveT += dt; if (saveT > 8) { saveT = 0; save(); }
  }
  requestAnimationFrame(loop);
}
document.addEventListener('visibilitychange', () => {
  if (!S || !B) return;
  if (document.hidden) save();
  else if ($('modal').hidden) showOffline();
});
addEventListener('pagehide', () => save());

(async () => {
  resize(); await loadAll();
  try { const d = JSON.parse(localStorage.getItem(LS) || 'null'); S = C.sanitize(d); } catch (e) { S = null; }
  $('load').hidden = true;
  if (S) startGame(); else showPick();
  setupAuth();
  requestAnimationFrame((t) => { last = t; loop(t); });
  if (TEST) window.__ih = { C, get S() { return S; }, get B() { return B; }, frozen: false, step: (sec) => { for (let i = 0; i < sec * 20; i++) C.step(B, .05); }, open: openSheet, rebuild };
})();
