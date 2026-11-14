// 마녀 키우기 — 화면·입력·연출 (규칙은 core.js)
import * as C from './core.js';

const $ = (id) => document.getElementById(id);
const Q = new URLSearchParams(location.search), TEST = Q.has('test');
const MG = window.MGH || null;
const LS = 'witch-best-v1';
const ICO = { meteor: 0, thunder: 1, tornado: 2, frost: 3, dragon: 4, blackhole: 5, swords: 6, pillars: 7, laser: 8, stars: 9, atk: 10, aspd: 11, cdr: 12, area: 13, multi: 14, crit: 15, speed: 16, dash: 17, slow: 18, mark: 19, burn: 20, fear: 21, shock: 22, curse: 23, tough: 24, regen: 25, vamp: 26, barrier: 27, potion: 28, wisdom: 29, magnet: 30, xpstorm: 31, luck: 32, reroll: 33 };
const CAT = { atk: '공격 마법', buff: '강화', debuff: '약화', hp: '체력', xp: '경험치' };

// ---------- 그림 ----------
const IMG = {}, FX = {};
const load = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
let UNITS = null;
async function loadAll() {
  const names = ['hero', 'slime', 'soldier', 'units', 'ground', 'deco', 'icons'];
  await Promise.all(names.map(async (n) => (IMG[n] = await load(`assets/${n}.png`))));
  UNITS = await fetch('assets/units.json').then((r) => r.json());
  for (const k of ['meteor-strike', 'chain-lightning', 'frost-nova', 'ice-spike', 'fireball-impact', 'hit-spark', 'crit-hit', 'level-up', 'ground-flames']) {
    const [m, im] = await Promise.all([fetch(`assets/fx/${k}.json`).then((r) => r.json()), load(`assets/fx/${k}.png`)]); FX[k] = { m, im };
  }
  for (const [k, n, s] of [['explosion', 8, 192], ['fire', 8, 64], ['dust', 8, 64]]) { const im = await load(`assets/fx/${k}.png`); FX[k] = { im, n, s }; }
  IMG.arrow = await load('assets/fx/enemy_arrow.png');
  try { await document.fonts.load('700 16px G'); } catch (e) { }
}

// ---------- 화면 ----------
const cv = $('cv'), g = cv.getContext('2d');
let W = 390, H = 844, DPR = 1, Z = 1;
function resize() {
  W = innerWidth; H = innerHeight; DPR = Math.min(2, devicePixelRatio || 1);
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  Z = Math.max(.75, Math.min(1.5, Math.min(W, H * .62) / 440)); // 월드 → 화면 배율
  if (G) G.view = { w: W / Z, h: H / Z };
}
addEventListener('resize', resize);

// ---------- 입력 ----------
const keys = new Set(); let stick = null;
addEventListener('keydown', (e) => { keys.add(e.code); if (e.code === 'Space') { e.preventDefault(); if (G && !G.choices) C.startDash(G); } if (e.code === 'Escape' || e.code === 'KeyP') togglePause(); if (G && G.choices && /^Digit[1-4]$/.test(e.code)) { const b = $('cards').children[+e.code.slice(5) - 1]; if (b) b.click(); } });
addEventListener('keyup', (e) => keys.delete(e.code));
cv.addEventListener('pointerdown', (e) => { if (!G || G.over) return; stick = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); hideHint(); });
cv.addEventListener('pointermove', (e) => { if (stick && e.pointerId === stick.id) { stick.x = e.clientX; stick.y = e.clientY; } });
const endStick = (e) => { if (stick && e.pointerId === stick.id) stick = null; };
cv.addEventListener('pointerup', endStick); cv.addEventListener('pointercancel', endStick);
function input() {
  let x = 0, y = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) x--; if (keys.has('KeyD') || keys.has('ArrowRight')) x++;
  if (keys.has('KeyW') || keys.has('ArrowUp')) y--; if (keys.has('KeyS') || keys.has('ArrowDown')) y++;
  if (x || y) { const l = Math.hypot(x, y); return { x: x / l, y: y / l }; }
  if (stick) { const dx = stick.x - stick.x0, dy = stick.y - stick.y0, l = Math.hypot(dx, dy); if (l > 6) { const k = Math.min(1, l / 50); return { x: dx / l * k, y: dy / l * k }; } }
  return { x: 0, y: 0 };
}
$('dashBtn').addEventListener('pointerdown', (e) => { e.stopPropagation(); if (G && !G.choices) C.startDash(G); });
let hintT = 0; function hideHint() { $('hint').style.opacity = 0; }

// ---------- 상태 ----------
let G = null, paused = false, fx = [], nums = [], parts = [], shake = 0, camX = 0, camY = 0, heroAnim = 0, trail = new Map();
function newRun() {
  G = C.newGame({ vw: W / Z, vh: H / Z }); fx = []; nums = []; parts = []; shake = 0; trail.clear();
  $('start').hidden = true; $('end').hidden = true; $('hud').hidden = false; $('hint').style.opacity = 1; hintT = 6; paused = false;
  buildSkillRow(); hud(true);
}

// ---------- 연출 ----------
function addFx(k, x, y, s = 1, o = {}) { fx.push({ k, x, y, s, t: -(o.dl || 0), o }); if (fx.length > 220) fx.shift(); }
function addNum(x, y, d, crit, c) {
  if (nums.length > 60) nums.shift();
  nums.push({ x: x + (Math.random() - .5) * 16, y, t: 0, s: Math.round(d).toLocaleString(), crit, c });
}
const NUMC = { '': '#ffffff', o: '#ffb35a', y: '#ffe76a', b: '#9fe4ff', p: '#e0a0ff', w: '#e8fbff' };
function banner(t, sub) { const b = $('banner'); b.innerHTML = t + (sub ? `<small>${sub}</small>` : ''); b.classList.remove('on'); void b.offsetWidth; b.classList.add('on'); }
function flash() { const f = $('flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }
function handleEvents() {
  for (const e of G.ev) {
    switch (e.e) {
      case 'dmg': if (Math.random() < (G.mons.length > 120 ? .35 : .8) || e.crit) addNum(e.x, e.y, e.d, e.crit, e.c); break;
      case 'kill': addFx(e.boss ? 'explosion' : 'dust', e.x, e.y, e.boss ? 2.4 : .9 * e.size); if (e.boss) shake = .6; break;
      case 'fx': {
        const k = e.k;
        if (k === 'meteor') { addFx('meteor-strike', e.x, e.y, Math.min(2.4, e.r / 38)); addFx('explosion', e.x, e.y - 10, Math.min(1.6, e.r / 75)); shake = Math.max(shake, .12); }
        else if (k === 'bigmeteor') { addFx('meteor-strike', e.x, e.y, Math.min(3.6, e.r / 34)); addFx('explosion', e.x, e.y, Math.min(3, e.r / 55)); for (let i = 0; i < 4; i++) addFx('explosion', e.x + Math.cos(i * 1.57) * e.r * .7, e.y + Math.sin(i * 1.57) * e.r * .4, 1, { dl: .05 + i * .05 }); for (let i = 0; i < 8; i++) addFx('fire', e.x + Math.cos(i) * e.r * .6, e.y + Math.sin(i) * e.r * .4, 1.6, { dl: i * .03 }); }
        else if (k === 'pillar') addFx('pillar', e.x, e.y, e.r / 58);
        else if (k === 'cross') addFx('cross', e.x, e.y, 1, { w: e.w, len: e.len });
        else if (k === 'bolt') addFx('bolt', e.x, e.y, 1);
        else if (k === 'nova') { addFx('nova', e.x, e.y, 1, { r: e.r }); addFx('frost-nova', e.x, e.y, Math.min(2.2, e.r / 75)); }
        else if (k === 'shatter') addFx('ice-spike', e.x, e.y, 1);
        else if (k === 'holeboom') { addFx('ring', e.x, e.y, 1, { r: e.r, c: '190,110,255' }); addFx('explosion', e.x, e.y, e.r / 70); }
        else if (k === 'orbhit') addFx('hit-spark', e.x, e.y, .7);
        else if (k === 'starboom') addFx('crit-hit', e.x, e.y, .9);
        else if (k === 'fear') addFx('ring', e.x, e.y - 10, 1, { r: 120, c: '120,60,180' });
        else if (k === 'heal') addFx('ring', e.x, e.y - 10, 1, { r: 150, c: '120,255,140' });
        break;
      }
      case 'shake': shake = Math.max(shake, e.s); break;
      case 'hurt': flash(); shake = Math.max(shake, .15); addNum(G.h.x, G.h.y - 70, e.d, false, 'r'); break;
      case 'dash': addFx('dust', e.x, e.y, 1.1); break;
      case 'dodge': addNum(G.h.x, G.h.y - 70, 0, false, 'dodge'); break;
      case 'block': addFx('ring', G.h.x, G.h.y - 26, 1, { r: 60, c: '255,230,120' }); break;
      case 'lv': addFx('level-up', G.h.x, G.h.y + 6, 1.3); break;
      case 'boss': banner(`보스 등장!`, `${e.n}번째 대장이 나타났어요`); shake = .4; break;
      case 'final': banner('마지막 보스!', '쓰러뜨리면 승리'); shake = .6; break;
      case 'elite': banner('정예 등장', ''); break;
      case 'pick': buildSkillRow(); break;
      case 'dead': setTimeout(() => showEnd(false), 1300); break;
      case 'win': setTimeout(() => showEnd(true), 1600); break;
    }
  }
  G.ev.length = 0;
}

// ---------- 그리기 ----------
const tx = (x) => (x - camX) * Z + W / 2, ty = (y) => (y - camY) * Z + H / 2;
let groundPat = null;
function drawGround() {
  if (!groundPat) { const c = document.createElement('canvas'); c.width = c.height = 64; c.getContext('2d').drawImage(IMG.ground, 0, 0, 64, 64, 0, 0, 64, 64); groundPat = g.createPattern(c, 'repeat'); }
  g.save(); const s = Z * 1.1; g.translate(W / 2 - camX * Z, H / 2 - camY * Z); g.scale(s, s); g.fillStyle = groundPat;
  g.fillRect((camX * Z - W / 2) / s - 64, (camY * Z - H / 2) / s - 64, W / s + 128, H / s + 128); g.restore();
}
// 장식: 512px 칸마다 같은 씨앗으로 배치
function chunkDeco(cx, cy) {
  let s = (cx * 73856093) ^ (cy * 19349663); const r = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const out = [];
  const n = 2 + (r() * 4 | 0);
  for (let i = 0; i < n; i++) { const k = r(); out.push({ x: cx * 512 + r() * 512, y: cy * 512 + r() * 512, t: k < .22 ? 'tree' : k < .7 ? 'bush' : 'rock', v: r() * 4 | 0 }); }
  return out;
}
function decoList() {
  const out = [], hw = W / Z / 2 + 200, hh = H / Z / 2 + 260;
  for (let cx = Math.floor((camX - hw) / 512); cx <= Math.floor((camX + hw) / 512); cx++) for (let cy = Math.floor((camY - hh) / 512); cy <= Math.floor((camY + hh) / 512); cy++) out.push(...chunkDeco(cx, cy));
  return out;
}
function drawDeco(d) {
  const im = IMG.deco, x = tx(d.x), y = ty(d.y);
  if (d.t === 'tree') { const sw = 192, sh = d.v < 2 ? 256 : 192, s = Z * .55; g.drawImage(im, d.v * 192, 256 - sh, sw, sh, x - sw * s / 2, y - sh * s * .92, sw * s, sh * s); }
  else if (d.t === 'bush') { const s = Z * .5; g.drawImage(im, 768 + d.v * 128, 128, 128, 128, x - 64 * s, y - 90 * s, 128 * s, 128 * s); }
  else { const s = Z * .6; g.drawImage(im, 1280 + d.v * 64, 192, 64, 64, x - 32 * s, y - 44 * s, 64 * s, 64 * s); }
}
function shadow(x, y, w) { g.fillStyle = 'rgba(20,10,30,.28)'; g.beginPath(); g.ellipse(x, y, w, w * .32, 0, 0, 7); g.fill(); }
// 영웅 (6방향: 아래·오른아래·오른위·위·왼위·왼아래)
let heroDir = 0;
function dirIdx(vx, vy) { const a = Math.atan2(vy, vx) * 180 / Math.PI; if (a >= 60 && a < 120) return 0; if (a >= 0 && a < 60) return 1; if (a >= -60 && a < 0) return 2; if (a >= -120 && a < -60) return 3; if (a >= -180 && a < -120) return 4; return 5; }
function drawHero(dt) {
  const h = G.h, moving = Math.hypot(h.vx, h.vy) > 5;
  if (moving || h.dash > 0) heroDir = dirIdx(h.dash > 0 ? h.dashDir[0] : h.vx, h.dash > 0 ? h.dashDir[1] : h.vy);
  heroAnim += dt * (h.dash > 0 ? 30 : moving ? 12 : 7);
  const anim = h.dead ? 3 : h.dash > 0 ? 2 : moving ? 0 : 1, f = h.dead ? Math.min(7, Math.floor(heroAnim * .4)) : Math.floor(heroAnim) % 8;
  const x = tx(h.x), y = ty(h.y), s = Z * 2.6;
  shadow(x, y, 16 * Z);
  if (h.shield) { g.save(); g.globalAlpha = .5 + .2 * Math.sin(G.t * 6); g.strokeStyle = '#ffe78a'; g.lineWidth = 3; g.beginPath(); g.arc(x, y - 30 * Z, 34 * Z, 0, 7); g.stroke(); g.restore(); }
  g.save(); if (h.inv > 0 && !h.dash && Math.floor(G.t * 20) % 2) g.globalAlpha = .45;
  g.imageSmoothingEnabled = false;
  g.drawImage(IMG.hero, f * 48, (anim * 6 + heroDir) * 64, 48, 64, x - 24 * s, y - 43 * s, 48 * s, 64 * s);
  if (h.atkT > 0) { g.globalCompositeOperation = 'lighter'; glow(x + (heroDir === 1 || heroDir === 2 ? 10 : heroDir >= 4 ? -10 : 0) * Z, y - 34 * Z, 16 * Z, '200,120,255', h.atkT / .18); }
  g.restore();
  // 체력바
  const w = 44 * Z; g.fillStyle = '#140a22'; g.fillRect(x - w / 2 - 2, y + 8 * Z, w + 4, 8); g.fillStyle = '#3a0a10'; g.fillRect(x - w / 2, y + 8 * Z + 2, w, 4);
  g.fillStyle = h.hp / h.max < .3 ? '#ff5a4a' : '#4be06a'; g.fillRect(x - w / 2, y + 8 * Z + 2, w * h.hp / h.max, 4);
}
function glow(x, y, r, rgb, a = 1) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(.35, `rgba(${rgb},${.85 * a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
// 몬스터
function drawMon(m, dt) {
  const x = tx(m.x), y = ty(m.y); m.frame += dt * (m.atkT > 0 ? 12 : 10) * (m.stun > 0 || m.freeze > 0 ? 0 : 1);
  const fade = m.dead ? Math.max(0, 1 - m.dead / .45) : 1;
  shadow(x, y, m.r * Z * 1.1);
  g.save(); g.globalAlpha = fade;
  let filt = ''; if (m.hitT > 0) filt = 'brightness(2.4)'; else if (m.freeze > 0) filt = 'hue-rotate(170deg) saturate(1.6) brightness(1.2)'; else if (m.stun > 0) filt = 'grayscale(1)'; else if (m.burn > 0) filt = 'sepia(.5) saturate(1.6)';
  if (filt) g.filter = filt;
  if (m.M.art === 'ts') {
    const u = UNITS.u[m.col + '_' + m.type], L = m.atkT > 0 ? u.atk : u.run, fr = L[Math.floor(m.frame) % L.length], s = Z * .55 * m.size;
    g.imageSmoothingEnabled = true; g.translate(x, y); if (m.face < 0) g.scale(-1, 1);
    g.drawImage(IMG.units, fr[0], fr[1], u.w, u.h, -u.ax * s, -u.ay * s, u.w * s, u.h * s);
  } else {
    const im = IMG[m.M.art], row = m.dead ? 7 : m.atkT > 0 ? 4 : 1, n = row === 7 ? 10 : 8, f = m.dead ? Math.min(9, Math.floor(m.dead * 22)) : Math.floor(m.frame) % n;
    const s = Z * (m.type === 'slime' ? 2.8 : 2.5) * m.size; g.imageSmoothingEnabled = false; g.translate(x, y); if (m.face < 0) g.scale(-1, 1);
    let tint = m.col === 'purple' ? 'hue-rotate(250deg) saturate(1.3)' : m.col === 'black' ? 'brightness(.45) saturate(.6)' : '';
    if (tint && !filt) g.filter = tint;
    g.drawImage(im, f * 96, row * 96, 96, 96, -45 * s, -57 * s, 96 * s, 96 * s);
  }
  g.restore();
  if (m.freeze > 0) { g.fillStyle = 'rgba(160,230,255,.25)'; g.beginPath(); g.ellipse(x, y - m.r * Z, m.r * Z * 1.3, m.r * Z * 1.6, 0, 0, 7); g.fill(); }
  if ((m.elite || m.boss) && !m.dead) { const w = m.r * Z * 2.2; g.fillStyle = '#140a22'; g.fillRect(x - w / 2 - 1, y + 6, w + 2, 6); g.fillStyle = m.boss ? '#ff6a3a' : '#c07aff'; g.fillRect(x - w / 2, y + 7, w * m.hp / m.max, 4); }
  if (m.mark > 0 && !m.dead) { g.fillStyle = '#ff5ab0'; g.font = `700 ${12 * Z}px G`; g.textAlign = 'center'; g.fillText('▼', x, y - m.r * Z * 2.6); }
}
// 지속 스킬·장판
function drawZones() {
  for (const z of G.zones) {
    if (z.k === 'meteor' || z.k === 'pillar') {
      if (z.done) continue; const u = z.t / z.at, x = tx(z.x), y = ty(z.y), r = z.r * Z;
      g.fillStyle = z.k === 'meteor' ? `rgba(40,10,0,${.15 + .35 * u})` : `rgba(255,230,120,${.1 + .25 * u})`; g.beginPath(); g.ellipse(x, y, r * (.4 + .6 * u), r * .5 * (.4 + .6 * u), 0, 0, 7); g.fill();
      if (z.k === 'meteor') { g.save(); g.globalCompositeOperation = 'lighter'; const mx = x + (1 - u) * 260 * Z, my = y - (1 - u) * 420 * Z; glow(mx, my, (z.big ? 70 : 26) * Z, '255,120,30'); g.strokeStyle = 'rgba(255,160,60,.6)'; g.lineWidth = (z.big ? 26 : 10) * Z; g.beginPath(); g.moveTo(mx, my); g.lineTo(mx + 70 * Z, my - 110 * Z); g.stroke(); g.restore(); }
    } else if (z.k === 'dragon') {
      const u = Math.min(1, z.t / z.dur); g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 16; i++) {
        const uu = u - i * .025; if (uu < 0) break; const px = z.x0 + Math.cos(z.ang) * z.len * uu, py = z.y0 + Math.sin(z.ang) * z.len * uu, wob = Math.sin(uu * 30 - i * .6) * 18;
        const x = tx(px - Math.sin(z.ang) * wob), y = ty(py + Math.cos(z.ang) * wob), r = (z.w / 2) * Z * (1 - i / 20) * (i === 0 ? 1.15 : 1);
        glow(x, y, r, i === 0 ? '255,170,60' : '230,70,10', (z.t > z.dur ? Math.max(0, 1 - (z.t - z.dur) / .4) : 1) * (i === 0 ? .8 : .45));
      }
      if (u < 1) { const x = tx(z.hx), y = ty(z.hy); g.fillStyle = '#ffe8a0'; g.beginPath(); g.arc(x + Math.cos(z.ang) * 18 * Z, y + Math.sin(z.ang) * 18 * Z - 8 * Z, 5 * Z, 0, 7); g.fill(); if (Math.random() < .6) addFx('fire', z.hx + (Math.random() - .5) * z.w * .6, z.hy + (Math.random() - .5) * z.w * .3, 1.4); }
      g.restore();
    } else if (z.k === 'hole') {
      const x = tx(z.x), y = ty(z.y), r = z.r * Z, life = z.t / z.dur;
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) { g.strokeStyle = `rgba(190,110,255,${.75 - i * .18})`; g.lineWidth = (7 - i * 1.8) * Z; g.beginPath(); for (let a = 0; a < 6.283 * 1.5; a += .2) { const rr = r * (1 - a / 9.4) * (.55 + i * .15), aa = a - z.t * (4 + i); const px = x + Math.cos(aa) * rr, py = y + Math.sin(aa) * rr * .55; a === 0 ? g.moveTo(px, py) : g.lineTo(px, py); } g.stroke(); }
      g.restore();
      g.fillStyle = '#0a0014'; g.beginPath(); g.ellipse(x, y, Math.min(46 * Z, r * .14) * (1 + .1 * Math.sin(z.t * 20)), Math.min(28 * Z, r * .085), 0, 0, 7); g.fill();
      g.strokeStyle = 'rgba(220,170,255,.9)'; g.lineWidth = 2; g.stroke();
      if (Math.random() < .8) parts.push({ x: z.x + Math.cos(life * 50 + Math.random() * 6) * z.r, y: z.y + Math.sin(Math.random() * 6) * z.r * .55, tx: z.x, ty: z.y, t: 0, life: .5, c: '200,140,255' });
    } else if (z.k === 'storm') { g.fillStyle = `rgba(255,255,200,${Math.random() < .2 ? .12 : 0})`; g.fillRect(0, 0, W, H); }
  }
  const h = G.h, hx = tx(h.x), hy = ty(h.y) - 26 * Z;
  g.save(); g.globalCompositeOperation = 'lighter';
  if (G.torn) for (const t of G.torn) {
    const x = tx(t.x), y = ty(t.y), r = t.r * Z;
    for (let i = 0; i < 7; i++) { const yy = y - i * r * .32, rr = r * (.35 + i * .12), a = G.t * 9 + i; g.strokeStyle = `rgba(210,240,255,${.55 - i * .05})`; g.lineWidth = 4 * Z; g.beginPath(); g.ellipse(x + Math.sin(G.t * 3 + i) * 6 * Z, yy, rr, rr * .3, 0, a % 6.28, a % 6.28 + 4); g.stroke(); }
  }
  if (G.lasers) for (const l of G.lasers) {
    const ex = hx + Math.cos(l.a) * l.len * Z, ey = hy + Math.sin(l.a) * l.len * Z;
    for (const [w, c] of [[l.w * 2.2, 'rgba(255,60,190,.16)'], [l.w, 'rgba(255,100,220,.6)'], [l.w * .3, 'rgba(255,230,250,.9)']]) { g.strokeStyle = c; g.lineWidth = w * Z; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx, hy); g.lineTo(ex, ey); g.stroke(); }
    glow(ex, ey, 22 * Z, '255,120,230');
  }
  if (G.swords) for (const s of G.swords) {
    const x = tx(s.x), y = ty(s.y) - 20 * Z; g.save(); g.translate(x, y); g.rotate(s.a + Math.PI / 2 + Math.PI / 2);
    glow(0, 0, 26 * Z, '120,220,255', .6);
    g.fillStyle = '#e8fbff'; g.beginPath(); g.moveTo(0, -24 * Z); g.lineTo(5 * Z, 6 * Z); g.lineTo(0, 12 * Z); g.lineTo(-5 * Z, 6 * Z); g.closePath(); g.fill();
    g.fillStyle = '#7ad8ff'; g.fillRect(-8 * Z, 8 * Z, 16 * Z, 3 * Z); g.restore();
  }
  if (G.h && C.S(G) && G.sk.slow) { g.strokeStyle = 'rgba(160,120,255,.25)'; g.lineWidth = 2; g.beginPath(); g.ellipse(hx, ty(h.y), 190 * (1 + .1 * G.sk.slow) * Z, 190 * (1 + .1 * G.sk.slow) * Z * .55, 0, 0, 7); g.stroke(); }
  g.restore();
}
function drawShots(dt) {
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const s of G.shots) {
    const x = tx(s.x), y = ty(s.y);
    if (s.k === 'orb') { const tl = trail.get(s) || []; tl.unshift([x, y]); if (tl.length > 6) tl.pop(); trail.set(s, tl); tl.forEach(([px, py], i) => glow(px, py, (9 - i) * Z, '190,90,255', .5)); glow(x, y, 12 * Z, '210,120,255'); }
    else if (s.k === 'star') { glow(x, y, 13 * Z, '255,220,80'); g.fillStyle = '#fff'; g.beginPath(); for (let i = 0; i < 8; i++) { const r = (i % 2 ? 2.5 : 7) * Z, a = i / 8 * 6.283 + G.t * 8; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.fill(); }
  }
  g.restore();
  for (const s of G.shots) if (s.k === 'arrow') { const x = tx(s.x), y = ty(s.y); g.save(); g.translate(x, y); g.rotate(Math.atan2(s.vy, s.vx)); g.drawImage(IMG.arrow, -16 * Z, -16 * Z, 32 * Z, 32 * Z); g.restore(); }
  for (const k of trail.keys()) if (!G.shots.includes(k)) trail.delete(k);
}
function drawGems() {
  for (const gm of G.gems) {
    const x = tx(gm.x), y = ty(gm.y) - 6 * Z, s = (gm.big ? 8 : 5) * Z;
    g.fillStyle = gm.big ? '#ff6ad0' : '#6ae0ff'; g.strokeStyle = '#140a22'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x, y - s * 1.3); g.lineTo(x + s, y); g.lineTo(x, y + s * 1.3); g.lineTo(x - s, y); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(x - s * .3, y - s * .6, s * .3, s * .5);
  }
}
function drawFx(dt) {
  for (let i = fx.length - 1; i >= 0; i--) {
    const f = fx[i]; f.t += dt; if (f.t < 0) continue; const x = tx(f.x), y = ty(f.y);
    if (f.k === 'pillar') {
      const u = f.t / .5; if (u > 1) { fx.splice(i, 1); continue; } const w = 46 * Z * f.s * (1 - u * .5);
      g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createLinearGradient(0, y - 520 * Z, 0, y); gr.addColorStop(0, 'rgba(255,240,150,0)'); gr.addColorStop(.6, `rgba(255,225,120,${.5 * (1 - u)})`); gr.addColorStop(1, `rgba(255,250,220,${.75 * (1 - u)})`);
      g.fillStyle = gr; g.fillRect(x - w / 2, y - 520 * Z, w, 520 * Z); glow(x, y, 46 * Z * f.s, '255,210,90', .6 * (1 - u)); g.restore(); continue;
    }
    if (f.k === 'cross') {
      const u = f.t / .6; if (u > 1) { fx.splice(i, 1); continue; } const w = f.o.w * Z * (1 - u * .4), L = f.o.len * Z;
      g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,220,120,${.45 * (1 - u)})`; g.fillRect(x - w / 2, y - L, w, L * 2); g.fillRect(x - L, y - w / 2, L * 2, w); g.fillStyle = `rgba(255,250,220,${.7 * (1 - u)})`; g.fillRect(x - w / 6, y - L, w / 3, L * 2); g.fillRect(x - L, y - w / 6, L * 2, w / 3); g.restore(); continue;
    }
    if (f.k === 'bolt') {
      const u = f.t / .25; if (u > 1) { fx.splice(i, 1); continue; }
      g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,255,200,${1 - u})`; g.shadowColor = '#ffe86a'; g.shadowBlur = 16; g.lineWidth = 4 * Z;
      g.beginPath(); let px = x + (Math.random() - .5) * 60 * Z, py = y - 520 * Z; g.moveTo(px, py); for (let k = 1; k <= 8; k++) { px = x + (Math.random() - .5) * 40 * Z * (1 - k / 8); py = y - 520 * Z + k * 65 * Z - 20 * Z; g.lineTo(px, py); } g.stroke(); glow(x, y - 16 * Z, 36 * Z, '255,240,120', 1 - u); g.restore(); continue;
    }
    if (f.k === 'nova' || f.k === 'ring') {
      const u = f.t / .45; if (u > 1) { fx.splice(i, 1); continue; } const r = f.o.r * Z * (.3 + u * .7), c = f.o.c || '170,230,255';
      g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(${c},${1 - u})`; g.lineWidth = 10 * Z * (1 - u) + 2; g.beginPath(); g.ellipse(x, y, r, r * .55, 0, 0, 7); g.stroke(); g.fillStyle = `rgba(${c},${.18 * (1 - u)})`; g.fill(); g.restore(); continue;
    }
    const F = FX[f.k]; if (!F) { fx.splice(i, 1); continue; }
    if (F.m) {
      const m = F.m; let acc = 0, fr = -1; for (let j = 0; j < m.f.length; j++) { acc += m.f[j][3] / 1000; if (f.t < acc) { fr = j; break; } }
      if (fr < 0) { fx.splice(i, 1); continue; } const q = m.f[fr], s = f.s * Z * 1.2;
      g.save(); g.globalCompositeOperation = 'lighter'; g.drawImage(F.im, q[0], q[1], m.w, m.h, x - m.pv[0] * s, y - m.pv[1] * s, m.w * s, m.h * s); g.restore();
    } else {
      const fi = Math.floor(f.t / .06); if (fi >= F.n) { fx.splice(i, 1); continue; } const s = f.s * Z * (F.s === 192 ? .7 : 1);
      g.drawImage(F.im, fi * F.s, 0, F.s, F.s, x - F.s * s / 2, y - F.s * s * .7, F.s * s, F.s * s);
    }
  }
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.t += dt; const u = p.t / p.life; if (u >= 1) { parts.splice(i, 1); continue; } const x = tx(p.x + (p.tx - p.x) * u), y = ty(p.y + (p.ty - p.y) * u); glow(x, y, 5 * Z, p.c, 1 - u); }
  g.restore();
}
function drawNums(dt) {
  g.textAlign = 'center'; g.lineJoin = 'round';
  for (let i = nums.length - 1; i >= 0; i--) {
    const n = nums[i]; n.t += dt; if (n.t > .75) { nums.splice(i, 1); continue; }
    const x = tx(n.x), y = ty(n.y) - n.t * 40, sz = (n.crit ? 20 : 14) * Math.min(1.3, Z) * (n.t < .08 ? 1.35 : 1);
    g.globalAlpha = n.t > .5 ? (.75 - n.t) / .25 : 1; g.font = `700 ${sz}px G`; g.lineWidth = 4; g.strokeStyle = '#140a22';
    const s = n.c === 'dodge' ? '회피!' : n.c === 'r' ? '-' + n.s : n.s;
    g.strokeText(s, x, y); g.fillStyle = n.c === 'r' ? '#ff6a6a' : n.c === 'dodge' ? '#9fe4ff' : n.crit ? '#ffd34a' : NUMC[n.c] || '#fff'; g.fillText(s, x, y);
  }
  g.globalAlpha = 1;
}
function drawStick() {
  if (!stick) return; const dx = stick.x - stick.x0, dy = stick.y - stick.y0, l = Math.min(50, Math.hypot(dx, dy)), a = Math.atan2(dy, dx);
  g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.arc(stick.x0, stick.y0, 54, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 2; g.stroke();
  g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.arc(stick.x0 + Math.cos(a) * l, stick.y0 + Math.sin(a) * l, 24, 0, 7); g.fill();
}
function render(dt) {
  g.setTransform(DPR, 0, 0, DPR, 0, 0); g.imageSmoothingEnabled = false;
  const h = G.h; camX += (h.x - camX) * Math.min(1, dt * 10); camY += (h.y - camY) * Math.min(1, dt * 10);
  let sx = 0, sy = 0; if (shake > 0) { sx = (Math.random() - .5) * 14 * shake; sy = (Math.random() - .5) * 14 * shake; shake -= dt; }
  g.save(); g.translate(sx, sy);
  drawGround();
  const deco = decoList(), low = deco.filter((d) => d.t !== 'tree');
  for (const d of low) drawDeco(d);
  drawGems();
  // y 순서로 영웅·몬스터·나무
  const list = [...G.mons.map((m) => [m.y, 0, m]), [h.y, 1, h], ...deco.filter((d) => d.t === 'tree').map((d) => [d.y, 2, d])].sort((a, b) => a[0] - b[0]);
  { const hx = tx(h.x), hy = ty(h.y); g.save(); g.globalAlpha = .55; g.strokeStyle = '#d8a0ff'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(hx, hy, 22 * Z, 8 * Z, 0, 0, 7); g.stroke(); g.restore(); }
  for (const [, k, o] of list) k === 0 ? drawMon(o, dt) : k === 2 ? drawDeco(o) : null;
  drawHero(dt); // 영웅은 무리에 묻히지 않게 항상 맨 위
  drawZones(); drawShots(dt); drawFx(dt); drawNums(dt);
  g.restore();
  // 화면 가장자리 붉은 기운 (체력 낮을 때)
  if (h.hp / h.max < .3 && !h.dead) { const v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .7); v.addColorStop(0, 'rgba(255,0,0,0)'); v.addColorStop(1, `rgba(200,0,0,${.25 + .1 * Math.sin(G.t * 8)})`); g.fillStyle = v; g.fillRect(0, 0, W, H); }
  drawStick();
}

// ---------- HUD ----------
const fmtT = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
function icon(el, id, px) { const inner = px; el.style.backgroundSize = `${inner * 34}px ${inner}px`; el.style.backgroundPosition = `${-ICO[id] * inner}px 0`; }
function buildSkillRow() {
  const a = $('atkRow'), b = $('subRow'); a.innerHTML = ''; b.innerHTML = '';
  for (const id in G.sk) {
    const Cd = C.CARDS[id], el = document.createElement('div'); el.className = 'ic ' + Cd.cat; el.innerHTML = `<em>${G.sk[id]}</em>`;
    icon(el, id, Cd.cat === 'atk' ? 26 : 20); (Cd.cat === 'atk' ? a : b).appendChild(el);
  }
}
let lastHud = 0;
function hud(force) {
  if (!G) return;
  $('xpFill').style.width = (G.xp / C.xpNeed(G.lv) * 100) + '%'; $('lvTxt').textContent = 'Lv.' + G.lv;
  $('clock').textContent = fmtT(Math.min(G.t, C.GAME_LEN)); $('kills').textContent = '☠ ' + G.kills.toLocaleString();
  const nb = C.BOSS_AT.find((t) => t > G.t); $('nextTxt').textContent = G.t >= C.GAME_LEN ? '마지막 보스!' : nb ? `보스까지 ${fmtT(nb - G.t)}` : `마지막 보스까지 ${fmtT(C.GAME_LEN - G.t)}`;
  const B = G.boss; $('bossBar').hidden = !B; if (B) { $('bossFill').style.width = Math.max(0, B.hp / B.max * 100) + '%'; $('bossName').textContent = B.final ? '마지막 보스 · 검은 대장군' : `보스 · 검은 ${B.M.name}`; }
  $('dashBtn').style.setProperty('--c', (G.h.dashCd / 2.2 * 100) + '%');
}

// ---------- 레벨업 카드 ----------
let shownChoices = null;
function showCards() {
  if (shownChoices === G.choices) return; shownChoices = G.choices; stick = null;
  const box = $('cards'); box.innerHTML = '';
  for (const id of G.choices) {
    const Cd = C.CARDS[id], lv = (G.sk[id] || 0) + 1, b = document.createElement('button');
    b.className = 'card ' + Cd.cat + (lv === 1 && !Cd.once ? ' new' : '');
    const lvTxt = Cd.once ? '1회용' : lv >= 5 && Cd.cat === 'atk' ? 'Lv.5 각성!' : `Lv.${lv}${C.cardMax(id) > 1 ? ' / ' + C.cardMax(id) : ''}`;
    b.innerHTML = `<i class="ci"></i><div><b class="sh">${Cd.name}</b><span class="tag">${CAT[Cd.cat]}</span><span class="lv">${lvTxt}</span><small>${C.cardDesc(id, lv)}</small></div>`;
    icon(b.querySelector('.ci'), id, 50);
    b.onclick = () => { C.choose(G, id); shownChoices = null; if (!G.choices) $('lvl').hidden = true; };
    box.appendChild(b);
  }
  $('rerollBtn').hidden = G.rerolls <= 0; $('rerollBtn').textContent = `다시 뽑기 (${G.rerolls})`;
  $('lvl').hidden = false;
}
$('rerollBtn').onclick = () => { C.reroll(G); shownChoices = null; showCards(); };

// ---------- 일시정지 · 결과 ----------
function togglePause() {
  if (!G || G.over || G.choices) return; paused = !paused; $('pause').hidden = !paused;
  if (paused) { const p = $('pskills'); p.innerHTML = ''; for (const id in G.sk) { const el = document.createElement('div'); el.className = 'ic ' + C.CARDS[id].cat; el.style.width = el.style.height = '44px'; el.innerHTML = `<em>${G.sk[id]}</em>`; icon(el, id, 40); el.title = C.CARDS[id].name; p.appendChild(el); } }
}
$('pauseBtn').onclick = togglePause; $('resumeBtn').onclick = togglePause;
$('quitBtn').onclick = () => { paused = false; $('pause').hidden = true; G = null; showStart(); };
document.addEventListener('visibilitychange', () => { if (document.hidden && G && !G.over && !G.choices && !paused) togglePause(); });
function best() { try { return JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) { return null; } }
function showEnd(win) {
  const t = Math.min(G.t, C.GAME_LEN + 600), b = best() || { t: 0, kills: 0, win: false };
  const nb = { t: Math.max(b.t, t), kills: Math.max(b.kills, G.kills), win: b.win || win };
  try { localStorage.setItem(LS, JSON.stringify(nb)); } catch (e) { }
  $('endTitle').textContent = win ? '마왕군을 물리쳤어요!' : '쓰러졌어요…';
  $('eTime').textContent = fmtT(t); $('eLv').textContent = G.lv; $('eKills').textContent = G.kills.toLocaleString();
  $('eBest').textContent = `최고 기록 ${fmtT(nb.t)} · 처치 ${nb.kills.toLocaleString()}${nb.win ? ' · 클리어 ★' : ''}`;
  $('end').hidden = false; $('hud').hidden = true;
}
$('againBtn').onclick = newRun; $('startBtn').onclick = newRun;
let prevT = 0;
function showStart() {
  $('start').hidden = false; $('hud').hidden = true; $('end').hidden = true;
  const b = best(); $('bestTxt').textContent = b ? `최고 기록 ${fmtT(b.t)} · 처치 ${b.kills.toLocaleString()}${b.win ? ' · 클리어 ★' : ''}` : '';
}
function drawPreview(dt) {
  prevT += dt * 7; const c = $('heroPrev').getContext('2d'); c.imageSmoothingEnabled = false; c.clearRect(0, 0, 48, 64);
  c.drawImage(IMG.hero, (Math.floor(prevT) % 8) * 48 + 10, 1 * 64 + 14, 28, 34, 0, 0, 48, 64);
}

// ---------- 루프 ----------
let last = 0;
function loop(now) {
  const dt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now;
  if (!$('start').hidden) { drawPreview(dt); g.setTransform(DPR, 0, 0, DPR, 0, 0); g.fillStyle = '#1a1028'; g.fillRect(0, 0, W, H); }
  if (G) {
    if (!paused && !G.choices && !(TEST && window.__witch.frozen)) { const n = dt > .034 ? 2 : 1; for (let i = 0; i < n; i++) C.step(G, dt / n, input()); }
    else if (G.over) { /* 쓰러진 뒤에도 그림은 계속 */ }
    handleEvents();
    if (G.choices) showCards();
    render(paused || G.choices ? 0 : dt);
    if (now - lastHud > 120) { lastHud = now; hud(); }
    if (hintT > 0) { hintT -= dt; if (hintT <= 0) hideHint(); }
  }
  requestAnimationFrame(loop);
}
(async () => {
  resize(); await loadAll(); $('load').hidden = true; showStart();
  requestAnimationFrame((t) => { last = t; loop(t); });
  if (TEST) window.__witch = { C, get G() { return G; }, frozen: false, newRun, step: (sec) => { for (let i = 0; i < sec * 30; i++) { C.step(G, 1 / 30, { x: 0, y: 0 }); if (G.choices) C.choose(G, G.choices[0]); } G.ev.length = 0; } };
})();
