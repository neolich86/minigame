// 나만의 문명 만들기 — 화면 · 입력 · 저장
import * as C from './core.js';
const $ = (id) => document.getElementById(id);
const Q = (() => { let s = location.search; try { if (parent !== window) s += '&' + parent.location.search.slice(1); } catch (e) { } return new URLSearchParams(s); })();
const TEST = Q.has('test');
const KEY = 'mgh:little-civ';
const TS = 48, WW = C.W * TS, WH = C.H * TS;
// 아이콘 시트 순서
const ICO = { food: 0, wood: 1, stone: 2, iron: 3, gold: 4, know: 5, energy: 6, bless: 7, rain: 8, bolt: 9, quake: 10, plenty: 11, wisdom: 12, grass: 13, tree: 14, lake: 15, mount: 16, volc: 17, egg: 18, hand: 19 };
const NAT = { tree: [0, 1, 2], pine: [3, 4], palm: 5, rock: 6, mount: 7, snow: 8, volc: 9, bush: 10, reed: 11 };
const WORK = { field: 0, school: 1, factory: 2, power: 3, rocket: 4 };

const cv = $('cv'), g = cv.getContext('2d');
let W = 0, H = 0, DPR = 1;
const IMG = {}; let ART = null;
const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });

let w = null, speed = 1, tool = null, paused = false, card = null, selTb = -1, terrDirty = true;
const cam = { x: WW / 2, y: WH / 2, s: .5 };
const agents = []; // 화면용 주민
const fx = []; // 효과
function resize() { W = innerWidth; H = innerHeight; DPR = Math.min(2, devicePixelRatio || 1); cv.width = W * DPR; cv.height = H * DPR; fitCam(); }
const minS = () => Math.min(W / WW, H / WH) * 1.15;
function fitCam(reset) { const m = minS(); if (reset) cam.s = Math.max(m, W / WW * 1.25); cam.s = Math.max(m, Math.min(2.2, cam.s)); clampCam(); }
function clampCam() { cam.x = Math.max(0, Math.min(WW, cam.x)); cam.y = Math.max(0, Math.min(WH, cam.y)); }
const sx = (x) => (x - cam.x) * cam.s + W / 2, sy = (y) => (y - cam.y) * cam.s + H / 2;
const ix = (x) => (x - W / 2) / cam.s + cam.x, iy = (y) => (y - H / 2) / cam.s + cam.y;
const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// ---------- 그림 ----------
function spr(c, img, f, x, y, k, flip, ax = .5, ay = 1) {
  if (!img || !f) return; const w2 = f[2] * k, h2 = f[3] * k;
  if (flip) { c.save(); c.translate(x, y); c.scale(-1, 1); c.drawImage(img, f[0], f[1], f[2], f[3], -w2 * ax, -h2 * ay, w2, h2); c.restore(); }
  else c.drawImage(img, f[0], f[1], f[2], f[3], x - w2 * ax, y - h2 * ay, w2, h2);
}
function icon(name, s = 22) {
  const c = document.createElement('canvas'); c.width = c.height = s * 2; c.style.width = c.style.height = s + 'px';
  const f = ART && ART.ico[ICO[name]]; if (f && IMG.ico) { const k = s * 2 / Math.max(f[2], f[3]); c.getContext('2d').drawImage(IMG.ico, f[0], f[1], f[2], f[3], (s * 2 - f[2] * k) / 2, (s * 2 - f[3] * k) / 2, f[2] * k, f[3] * k); }
  c.className = 'ic'; return c;
}
function folkCanvas(sp, era, s = 64) {
  const c = document.createElement('canvas'); c.width = c.height = s * 2; c.style.width = c.style.height = s + 'px';
  const f = ART.folk[sp * 6 + era]; const k = s * 1.9 / Math.max(f[2], f[3]); c.getContext('2d').drawImage(IMG.folk, f[0], f[1], f[2], f[3], (s * 2 - f[2] * k) / 2, s * 2 - f[3] * k, f[2] * k, f[3] * k); return c;
}

// 지형 (바뀔 때만 다시 그림)
const terr = document.createElement('canvas'); terr.width = WW; terr.height = WH; const tg = terr.getContext('2d');
const COL = { sea: '#3fa7d6', shallow: '#7fd3e6', sand: '#f2dc9b', grass: '#8fd16a', grass2: '#7cc35a', dirt: '#b99567', lake: '#4fb4e8', lake2: '#8fdcf5', field: '#c99a5b' };
function blob(x, y, r, col) { tg.fillStyle = col; tg.beginPath(); tg.arc(x, y, r, 0, 6.283); tg.fill(); }
function layer(test, r, col) { // 이웃끼리 이어 붙인 둥근 덩어리
  tg.fillStyle = col; tg.beginPath(); const t = w.t, h = TS * r;
  for (let y = 0; y < C.H; y++) for (let x = 0; x < C.W; x++) {
    if (!test(t[y * C.W + x])) continue; const cx = (x + .5) * TS, cy = (y + .5) * TS;
    tg.moveTo(cx + h, cy); tg.arc(cx, cy, h, 0, 6.283);
    if (x + 1 < C.W && test(t[y * C.W + x + 1])) tg.rect(cx, cy - h, TS, h * 2);
    if (y + 1 < C.H && test(t[(y + 1) * C.W + x])) tg.rect(cx - h, cy, h * 2, TS);
    if (x + 1 < C.W && y + 1 < C.H && test(t[y * C.W + x + 1]) && test(t[(y + 1) * C.W + x]) && test(t[(y + 1) * C.W + x + 1])) tg.rect(cx, cy, TS, TS);
  }
  tg.fill();
}
function drawTerrain() {
  const t = w.t; tg.clearRect(0, 0, WW, WH);
  const land = (v) => v !== C.T.SEA, green = (v) => v !== C.T.SEA && v !== C.T.SAND, rock = (v) => v === C.T.MOUNT || v === C.T.VOLC, lake = (v) => v === C.T.LAKE;
  layer(land, 1.15, 'rgba(127,211,230,.55)'); layer(land, .95, COL.shallow); layer(land, .7, COL.sand); layer(green, .58, '#7cc35a'); layer(green, .52, COL.grass);
  // 풀빛 얼룩
  for (let y = 0; y < C.H; y++) for (let x = 0; x < C.W; x++) if (green(t[y * C.W + x]) && hash(x, y) < .35) { tg.fillStyle = hash(y, x) < .5 ? 'rgba(70,140,50,.12)' : 'rgba(200,240,140,.16)'; tg.beginPath(); tg.arc((x + hash(x, y + 9)) * TS, (y + hash(x + 9, y)) * TS, TS * (.4 + hash(x + 3, y) * .5), 0, 6.283); tg.fill(); }
  layer(rock, .5, COL.dirt);
  layer(lake, .62, '#3d9ccf'); layer(lake, .54, COL.lake); layer(lake, .3, 'rgba(160,225,250,.35)');
  // 풀 무늬
  tg.fillStyle = 'rgba(60,120,40,.25)';
  for (let y = 0; y < C.H; y++) for (let x = 0; x < C.W; x++) { const v = t[y * C.W + x]; if (v !== C.T.GRASS && v !== C.T.FOREST) continue; for (let k = 0; k < 3; k++) { const px = (x + hash(x * 3 + k, y)) * TS, py = (y + hash(x, y * 3 + k)) * TS; tg.fillRect(px, py, 2, 6); tg.fillRect(px + 4, py + 1, 2, 5); } }
  // 밭
  for (let y = 0; y < C.H; y++) for (let x = 0; x < C.W; x++) if (t[y * C.W + x] === C.T.FIELD) {
    const f = ART.work[WORK.field]; if (f && IMG.work) { const k = TS * 1.02 / Math.max(f[2], f[3]); tg.drawImage(IMG.work, f[0], f[1], f[2], f[3], (x + .5) * TS - f[2] * k / 2, (y + .5) * TS - f[3] * k / 2, f[2] * k, f[3] * k); }
    else { tg.fillStyle = COL.field; tg.fillRect(x * TS + 3, y * TS + 3, TS - 6, TS - 6); }
  }
  terrDirty = false;
}

function drawSea(t) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2f8fc4'); gr.addColorStop(1, '#2a79b4'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 2 * cam.s; const step = 70 * cam.s;
  for (let yy = (sy(0) % step) - step; yy < H + step; yy += step) for (let xx = (sx(0) % (step * 2)) - step * 2; xx < W + step; xx += step * 2) {
    const o = Math.sin(t / 900 + xx * .01 + yy * .02) * 6 * cam.s; g.beginPath(); g.moveTo(xx + o, yy); g.quadraticCurveTo(xx + o + 10 * cam.s, yy - 5 * cam.s, xx + o + 20 * cam.s, yy); g.stroke();
  }
}

function territoryLines() {
  if (!w.own) return; const own = w.own;
  for (const tb of w.tribes) {
    const col = C.SPECIES[tb.sp].color; g.strokeStyle = col; g.lineWidth = Math.max(2, 3 * cam.s); g.setLineDash([8 * cam.s, 6 * cam.s]); g.beginPath();
    for (let y = 0; y < C.H; y++) for (let x = 0; x < C.W; x++) {
      if (own[y * C.W + x] !== tb.id) continue; const o = (xx, yy) => (C.inb(xx, yy) ? own[yy * C.W + xx] : -1);
      const X = sx(x * TS), Y = sy(y * TS), S = TS * cam.s;
      if (o(x, y - 1) !== tb.id) { g.moveTo(X, Y); g.lineTo(X + S, Y); }
      if (o(x, y + 1) !== tb.id) { g.moveTo(X, Y + S); g.lineTo(X + S, Y + S); }
      if (o(x - 1, y) !== tb.id) { g.moveTo(X, Y); g.lineTo(X, Y + S); }
      if (o(x + 1, y) !== tb.id) { g.moveTo(X + S, Y); g.lineTo(X + S, Y + S); }
    }
    g.stroke(); g.setLineDash([]);
  }
}

function draw(t) {
  g.setTransform(DPR, 0, 0, DPR, 0, 0); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  drawSea(t); if (!w) return;
  if (terrDirty) drawTerrain();
  g.drawImage(terr, sx(0), sy(0), WW * cam.s, WH * cam.s);
  // 호수 반짝
  const items = [];
  const x0 = Math.max(0, Math.floor(ix(0) / TS) - 1), x1 = Math.min(C.W - 1, Math.ceil(ix(W) / TS) + 1), y0 = Math.max(0, Math.floor(iy(0) / TS) - 1), y1 = Math.min(C.H - 1, Math.ceil(iy(H) / TS) + 2);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const v = w.t[y * C.W + x], cx = (x + .5) * TS, cy = (y + .5) * TS;
    if (v === C.T.FOREST) { for (let k = 0; k < 2; k++) { const hx = hash(x * 7 + k, y * 5), hy = hash(x * 3, y * 11 + k); const pine = hash(x, y) < .3; const fi = pine ? NAT.pine[k % 2] : NAT.tree[Math.floor(hx * 3)]; items.push({ y: cy + (hy - .5) * TS * .5 + k * 6, n: 1, f: ART.nat[fi], x: cx + (k ? 1 : -1) * TS * .2 + (hx - .5) * 8, k: .3 }); } }
    else if (v === C.T.MOUNT) items.push({ y: cy + TS * .4, f: ART.nat[hash(x, y) < .35 ? NAT.snow : NAT.mount], x: cx, k: .42, img: IMG.nat });
    else if (v === C.T.VOLC) items.push({ y: cy + TS * .4, f: ART.nat[NAT.volc], x: cx, k: .5, img: IMG.nat, volc: 1 });
    else if (v === C.T.SAND && hash(x, y) < .08) items.push({ y: cy + 8, f: ART.nat[NAT.palm], x: cx, k: .26 });
    else if (v === C.T.GRASS && hash(y, x) < .05) items.push({ y: cy + 8, f: ART.nat[hash(x, y * 2) < .5 ? NAT.bush : NAT.rock], x: cx, k: .2 });
    else if (v === C.T.LAKE && hash(x, y) < .4) items.push({ y: cy, f: ART.nat[NAT.reed], x: cx + 12, k: .16 });
  }
  for (const tb of w.tribes) {
    const era = tb.era;
    items.push({ y: (tb.cy + .9) * TS, f: ART.bld[6 + era], x: (tb.cx + .5) * TS, k: .4, img: IMG.bld, tb: tb.id });
    for (const i of tb.houses) items.push({ y: ((i / C.W | 0) + .85) * TS, f: ART.bld[era], x: (i % C.W + .5) * TS, k: .24, img: IMG.bld });
    for (const q of tb.works) if (q.k !== 'field') items.push({ y: ((q.i / C.W | 0) + .9) * TS, f: ART.work[WORK[q.k]], x: (q.i % C.W + .5) * TS, k: .3, img: IMG.work });
  }
  for (const a of agents) items.push({ y: a.y, agent: a });
  items.sort((p, q) => p.y - q.y);
  for (const it of items) {
    if (it.agent) { drawAgent(it.agent, t); continue; }
    const k = it.k * cam.s * (it.tb === selTb && it.tb !== undefined ? 1.06 : 1);
    if (it.n) { const sway = Math.sin(t / 800 + it.x * .05) * .03; g.save(); g.translate(sx(it.x), sy(it.y)); g.rotate(sway); spr(g, IMG.nat, it.f, 0, 0, k); g.restore(); }
    else spr(g, it.img || IMG.nat, it.f, sx(it.x), sy(it.y), k);
    if (it.volc && Math.random() < .3) fx.push({ k: 'smoke', x: it.x + (Math.random() - .5) * 10, y: it.y - TS * 1.2, t: 0, life: 2 });
  }
  territoryLines();
  // 마을 이름
  for (const tb of w.tribes) {
    const X = sx((tb.cx + .5) * TS), Y = sy((tb.cy + .9) * TS) + 6; const s = `${C.SPECIES[tb.sp].name} · ${tb.pop}명`;
    g.font = `800 ${Math.max(11, 12 * Math.min(1.3, cam.s * 1.2))}px Pretendard,system-ui`; const tw = g.measureText(s).width + 14;
    g.fillStyle = 'rgba(40,30,60,.82)'; rr(X - tw / 2, Y, tw, 20, 10); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, X, Y + 10.5);
    const bs = buffsOf(tb); if (bs.length) {
      const bt = bs.map((b) => `${(BUFF[b.name] || ['✨'])[0]} ${b.name} ×${+b.m.toFixed(1)} ${Math.ceil(b.t)}초`).join('  ');
      g.font = `800 ${Math.max(11, 11.5 * Math.min(1.3, cam.s * 1.2))}px Pretendard,system-ui`; const bw = g.measureText(bt).width + 14, by = Y + 24;
      g.fillStyle = bs.some((b) => b.m < 1) ? 'rgba(200,70,60,.9)' : 'rgba(255,200,60,.95)'; rr(X - bw / 2, by, bw, 20, 10); g.fill(); g.fillStyle = bs.some((b) => b.m < 1) ? '#fff' : '#3a2a10'; g.fillText(bt, X, by + 10.5);
    }
  }
  if (tut >= 0 && TUT[tut].ring && w.tribes[0]) { const tb = w.tribes[0], p = (t / 900) % 1; g.strokeStyle = `rgba(255,214,90,${1 - p})`; g.lineWidth = 4; g.beginPath(); g.arc(sx((tb.cx + .5) * TS), sy((tb.cy + .5) * TS), (tb.radius + .3) * TS * cam.s * (.85 + p * .15), 0, 6.283); g.stroke(); }
  drawFx(t);
}
function rr(x, y, w2, h2, r) { g.beginPath(); g.roundRect ? g.roundRect(x, y, w2, h2, r) : g.rect(x, y, w2, h2); }

// ---------- 주민 ----------
function syncAgents() {
  for (const tb of w.tribes) {
    const want = Math.min(tb.pop, 22), have = agents.filter((a) => a.tb === tb.id);
    for (let k = have.length; k < want; k++) agents.push({ tb: tb.id, x: (tb.cx + .5) * TS + (Math.random() - .5) * 30, y: (tb.cy + .9) * TS + (Math.random() - .5) * 20, tx: 0, ty: 0, wait: Math.random() * 2, ph: Math.random() * 6, flip: false, job: '' });
    if (have.length > want) for (const a of have.slice(want)) agents.splice(agents.indexOf(a), 1);
  }
  for (let i = agents.length - 1; i >= 0; i--) if (!w.tribes[agents[i].tb]) agents.splice(i, 1);
}
const JOB_T = { farmer: [C.T.FIELD, C.T.GRASS, C.T.LAKE], lumber: [C.T.FOREST], miner: [C.T.MOUNT, C.T.VOLC], scholar: [], soldier: [], engineer: [] };
function moveAgents(dt) {
  for (const a of agents) {
    const tb = w.tribes[a.tb]; if (!tb) continue;
    if (a.wait > 0) { a.wait -= dt; continue; }
    const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
    if (d < 3 || !a.tx) {
      a.wait = .8 + Math.random() * 2.5;
      // 일감 고르기
      const js = Object.entries(tb.jobs || {}).filter(([, v]) => v > 0); const tot = js.reduce((s, [, v]) => s + v, 0);
      let r = Math.random() * tot, job = 'farmer'; for (const [k, v] of js) { r -= v; if (r <= 0) { job = k; break; } }
      a.job = job; let tiles = [];
      if (JOB_T[job] && JOB_T[job].length) for (let i = 0; i < w.t.length; i++) if (w.own && w.own[i] === tb.id && JOB_T[job].includes(w.t[i])) tiles.push(i);
      if (job === 'scholar' || job === 'engineer') tiles = tb.works.filter((q) => q.k !== 'field').map((q) => q.i);
      if (!tiles.length || Math.random() < .25) tiles = [...tb.houses, tb.cy * C.W + tb.cx];
      const i = tiles[Math.floor(Math.random() * tiles.length)];
      a.tx = (i % C.W + .2 + Math.random() * .6) * TS; a.ty = ((i / C.W | 0) + .6 + Math.random() * .35) * TS;
      if (w.t[i] === C.T.LAKE) { a.ty += TS * .45; }
      continue;
    }
    const sp = 34 * dt; a.x += dx / d * Math.min(sp, d); a.y += dy / d * Math.min(sp, d); a.flip = dx < 0; a.ph += dt * 10;
  }
}
function drawAgent(a, t) {
  const tb = w.tribes[a.tb]; if (!tb) return; const f = ART.folk[tb.sp * 6 + tb.era];
  const moving = a.wait <= 0, bob = moving ? Math.abs(Math.sin(a.ph)) * 3 : Math.sin(t / 400 + a.ph) * .6;
  const k = .17 * cam.s; const X = sx(a.x), Y = sy(a.y);
  g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(X, Y, 8 * cam.s, 3 * cam.s, 0, 0, 6.283); g.fill();
  g.save(); g.translate(X, Y - bob * cam.s); if (!moving) g.scale(1 + Math.sin(t / 400 + a.ph) * .02, 1 - Math.sin(t / 400 + a.ph) * .02); spr(g, IMG.folk, f, 0, 0, k, a.flip); g.restore();
}

// ---------- 효과 ----------
function drawFx(t) {
  for (let i = fx.length - 1; i >= 0; i--) {
    const e = fx[i]; e.t += 1 / 60; if (e.t > e.life) { fx.splice(i, 1); continue; } const p = e.t / e.life, X = sx(e.x), Y = sy(e.y);
    if (e.k === 'smoke') { g.fillStyle = `rgba(90,80,80,${.35 * (1 - p)})`; g.beginPath(); g.arc(X + p * 10 * cam.s, Y - p * 40 * cam.s, (5 + p * 12) * cam.s, 0, 6.283); g.fill(); }
    else if (e.k === 'ring') { g.strokeStyle = e.col || 'rgba(255,240,150,' + (1 - p) + ')'; g.globalAlpha = 1 - p; g.lineWidth = 4; g.beginPath(); g.arc(X, Y, (10 + p * 120) * cam.s, 0, 6.283); g.stroke(); g.globalAlpha = 1; }
    else if (e.k === 'rain') { g.strokeStyle = `rgba(200,230,255,${.8 * (1 - p)})`; g.lineWidth = 2; for (let k = 0; k < 40; k++) { const rx = X + (hash(k, 1) - .5) * 200 * cam.s, ry = Y + ((hash(k, 2) + p * 3) % 1 - .5) * 200 * cam.s; g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx - 3, ry + 12); g.stroke(); } }
    else if (e.k === 'bolt') { if (p < .5) { g.strokeStyle = '#fff6a8'; g.lineWidth = 5; g.beginPath(); let bx = X, by = Y - 400; g.moveTo(bx, by); for (let k = 0; k < 8; k++) { bx += (hash(k, e.x | 0) - .5) * 40; by += 50; g.lineTo(bx, by); } g.stroke(); g.fillStyle = `rgba(255,255,220,${.5 - p})`; g.fillRect(0, 0, W, H); } }
    else if (e.k === 'spark') { g.fillStyle = `rgba(255,230,120,${1 - p})`; for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283 + e.x, r = p * 60 * cam.s; g.beginPath(); g.arc(X + Math.cos(a) * r, Y + Math.sin(a) * r - p * 20, 4 * cam.s, 0, 6.283); g.fill(); } }
    else if (e.k === 'shake') { /* 화면 흔들림은 main에서 */ }
    else if (e.k === 'txt') { g.globalAlpha = 1 - p; g.font = '900 16px Pretendard,system-ui'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.strokeStyle = 'rgba(40,30,60,.8)'; g.lineWidth = 4; g.strokeText(e.s, X, Y - p * 40); g.fillText(e.s, X, Y - p * 40); g.globalAlpha = 1; }
  }
}

// ---------- HUD ----------
const fmtN = (v) => (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v >= 100 ? Math.floor(v) : v.toFixed(v < 10 ? 1 : 0));
function hud() {
  $('manaTxt').textContent = `${Math.floor(w.mana)} / ${w.manaMax}`; $('manaFill').style.width = (w.mana / w.manaMax * 100) + '%';
  $('score').textContent = C.score(w).toLocaleString(); $('year').textContent = `${Math.floor(w.time / 10) + 1}년`;
  // 종족 칩
  const box = $('tribes'); if (box.childElementCount !== w.tribes.length) { box.innerHTML = ''; for (const tb of w.tribes) { const d = document.createElement('button'); d.className = 'chip panel'; d.onclick = () => openTribe(tb.id); d.append(folkCanvas(tb.sp, tb.era, 34)); const s = document.createElement('span'); d.append(s); d.dataset.era = -1; box.append(d); } }
  w.tribes.forEach((tb, i) => { const d = box.children[i]; if (+d.dataset.era !== tb.era) { d.firstChild.replaceWith(folkCanvas(tb.sp, tb.era, 34)); d.dataset.era = tb.era; } const bi = buffsOf(tb).map((b) => (BUFF[b.name] || ['✨'])[0]).join(''); d.lastChild.innerHTML = `<b>${C.SPECIES[tb.sp].name}${bi ? ` <i class="bi">${bi}</i>` : ''}</b><small>${C.ERAS[tb.era]} · ${tb.pop}명</small>`; d.classList.toggle('warn', C.needs(w, tb).some((n) => n.k === 'food')); });
  // 도구 버튼 (신력·쿨다운)
  document.querySelectorAll('.tool').forEach((b) => {
    const id = b.dataset.id, kind = b.dataset.kind; let dis = false, cd = '';
    if (kind === 'terra') dis = w.mana < C.TOOLS.find((t) => t.id === id).cost;
    if (kind === 'power') { const p = C.POWERS.find((t) => t.id === id); dis = w.mana < p.cost || !!w.cds[id] || !w.tribes.length; if (w.cds[id]) cd = Math.ceil(w.cds[id]); }
    if (kind === 'life') { dis = w.tribes.length >= C.slots(w) || w.tribes.some((tb) => tb.sp === +id); }
    b.classList.toggle('dis', dis); b.classList.toggle('on', tool && tool.id === id && tool.kind === kind); const c = b.querySelector('.cd'); if (c) c.textContent = cd;
  });
  if (selTb >= 0 && !$('sheet').hidden) fillTribe();
  if (hud.sl !== C.slots(w)) { hud.sl = C.slots(w); if (tab === 'life') { hud.sl = C.slots(w); setTimeout(buildTools); } }
  $('spd').textContent = paused ? '⏸' : `▶ ${speed}×`;
}

// 아래 도구 줄
let tab = 'life';
function buildTools() {
  const row = $('tools'); row.innerHTML = '';
  const add = (kind, id, name, cost, desc, ic, extra) => {
    const b = document.createElement('button'); b.className = 'tool'; b.dataset.kind = kind; b.dataset.id = id;
    if (kind === 'life') b.append(folkCanvas(+id, 0, 40)); else b.append(icon(ic, 34));
    const n = document.createElement('b'); n.textContent = name; b.append(n);
    if (cost != null) { const s = document.createElement('small'); s.textContent = '✨' + cost; b.append(s); }
    if (extra) { const s = document.createElement('small'); s.textContent = extra; b.append(s); }
    const cdv = document.createElement('i'); cdv.className = 'cd'; b.append(cdv);
    b.onclick = () => pickTool(kind, id, name, desc); row.append(b);
  };
  if (tab === 'terra') C.TOOLS.forEach((t) => add('terra', t.id, t.name, t.cost, t.desc, t.id));
  if (tab === 'power') C.POWERS.forEach((p) => add('power', p.id, p.name, p.cost, p.desc, p.id));
  if (tab === 'life') C.SPECIES.forEach((s, i) => add('life', String(i), s.name, null, s.desc, 'egg', w && w.tribes.some((tb) => tb.sp === i) ? '탄생함' : (w && w.tribes.length >= C.slots(w) ? '🔒' : '')));
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('on', t.dataset.tab === tab));
  hud();
}
function pickTool(kind, id, name, desc) {
  if (tool && tool.kind === kind && tool.id === id) { tool = null; hint(''); hud(); return; }
  if (kind === 'life') { const i = +id; if (w.tribes.some((tb) => tb.sp === i)) return toast('이미 섬에 살고 있어요'); if (w.tribes.length >= C.slots(w)) return toast(w.tribes.length === 1 ? '첫 종족이 농경 시대가 되면 열려요' : '종족이 부족 국가 시대가 되면 열려요'); }
  tool = { kind, id }; hint(kind === 'terra' ? `${name}: 땅을 누르거나 끌어서 칠해요 · ${desc}` : kind === 'power' ? `${name}: 마을이나 땅을 눌러요 · ${desc}` : `${name}: 섬의 땅을 눌러 탄생시켜요 · ${desc}`); hud();
}
function hint(s) { $('hint').textContent = s; $('hint').hidden = !s || tut >= 0; }
let toastT = 0; function toast(s) { const e = $('toast'); e.textContent = s; e.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('on'), 1800); }

// ---------- 적용 중인 능력 ----------
const BUFF = { 축복: ['✨', '모든 생산'], 황금시대: ['👑', '모든 생산'], 비: ['🌧', '식량 생산'], 풍년: ['🌾', '식량 생산'], 가뭄: ['☀️', '식량 생산'], 지혜: ['💡', '연구 속도'], 발명가: ['🧪', '연구 속도'] };
const buffsOf = (tb, k) => w.buffs.filter((b) => (b.tb === tb.id || b.tb < 0) && (!k || b.k === k));
const mulTxt = (m) => (m >= 1 ? `×${+m.toFixed(1)} 증가` : `×${+m.toFixed(1)} 감소`);
const buffLine = (b) => { const [e, what] = BUFF[b.name] || ['✨', '생산']; return `<div class="buff${b.m < 1 ? ' bad' : ''}">${e} <b>${b.name}</b>: ${what} ${mulTxt(b.m)} 적용 중<span>${Math.ceil(b.t)}초</span></div>`; };

// ---------- 종족 상세 ----------
function openTribe(id) { tutStat.sheet++; selTb = id; $('sheet').hidden = false; $('sheet').dataset.k = ''; fillTribe(true); }
function fillTribe(full) {
  const tb = w.tribes[selTb]; if (!tb) return; const sp = C.SPECIES[tb.sp], r = tb._r || C.rates(w, tb), el = $('sheetIn');
  const key = tb.era + '|' + tb.techs.length + '|' + (tb.research || '');
  if (full || el.dataset.k !== key) {
    el.dataset.k = key; el.innerHTML = '';
    const head = document.createElement('div'); head.className = 'shead'; head.append(folkCanvas(tb.sp, tb.era, 70));
    head.insertAdjacentHTML('beforeend', `<div><h2>${sp.name}</h2><p class="dimt">${C.ERAS[tb.era]} · ${sp.desc}</p><p id="tPop"></p></div><button class="x" id="sheetX">✕</button>`);
    el.append(head);
    const g2 = document.createElement('div'); g2.className = 'resg'; g2.id = 'resg';
    for (const k of C.RES) { const d = document.createElement('div'); d.className = 'rs'; d.dataset.k = k; d.append(icon(k, 22)); d.insertAdjacentHTML('beforeend', `<span><b></b><small></small></span>`); g2.append(d); }
    el.insertAdjacentHTML('beforeend', '<div id="tBuff" class="note"></div>'); el.append(g2);
    el.insertAdjacentHTML('beforeend', `<h3>연구</h3><div id="tRes" class="note"></div><div class="techs" id="techs"></div><h3>다음 시대 조건</h3><div id="tEra" class="note"></div><div id="tNeed"></div><h3>일하는 주민</h3><div id="tJobs" class="jobs"></div>`);
    const nt = C.nextTech(tb), techs = el.querySelector('#techs');
    for (const t of C.TECHS.filter((q) => q.era === tb.era)) {
      const b = document.createElement('button'); const got = tb.techs.includes(t.id), ok = (t.req || []).every((q) => tb.techs.includes(q));
      b.className = 'tech' + (got ? ' got' : '') + (nt && nt.id === t.id ? ' cur' : '') + (!ok ? ' lock' : '');
      b.innerHTML = `<b>${got ? '✓ ' : ''}${t.name}</b><small>${t.desc}</small><i>${got ? '완료' : '📘 ' + t.cost}</i>`;
      if (!got && ok) b.onclick = () => { tb.research = t.id; fillTribe(true); toast(`'${t.name}'부터 연구해요`); };
      techs.append(b);
    }
    el.querySelector('#sheetX').onclick = closeSheet;
  }
  el.querySelector('#tPop').innerHTML = `👥 <b>${tb.pop}</b> / ${C.capOf(tb)}명 · 🏠 집 ${tb.houses.length}채 · 영토 ${tb.radius}`;
  for (const d of el.querySelectorAll('.rs')) { const k = d.dataset.k; d.querySelector('b').textContent = fmtN(tb.res[k]); const v = r[k]; d.querySelector('small').textContent = `${C.RNAME[k]} ${v >= 0 ? '+' : ''}${(v).toFixed(2)}/초`; d.classList.toggle('neg', v < -0.001); const fb = k === 'food' ? buffsOf(tb, 'food') : k === 'know' ? buffsOf(tb, 'know') : []; let em = d.querySelector('em'); if (!em) { em = document.createElement('em'); d.querySelector('span').append(em); } em.textContent = fb.map((b) => `${(BUFF[b.name] || ['✨'])[0]} ${b.name} ×${+b.m.toFixed(1)}`).join(' '); d.classList.toggle('buffed', fb.some((b) => b.m >= 1)); }
  el.querySelector('#tBuff').innerHTML = buffsOf(tb, 'all').map(buffLine).join('');
  const nt = C.nextTech(tb); el.querySelector('#tRes').innerHTML = nt ? `<div class="nrow">📘 지금 연구: <b>${nt.name}</b> <span class="bar2"><i style="width:${Math.min(100, tb.res.know / nt.cost * 100)}%"></i></span> ${Math.floor(tb.res.know)}/${nt.cost}</div>` : `<div class="nrow">이 시대의 기술을 모두 익혔어요</div>`;
  el.querySelector('#tRes').insertAdjacentHTML('beforeend', buffsOf(tb, 'know').map(buffLine).join(''));
  { const fr = el.querySelector('#tFood'); if (fr) fr.remove(); const fb = buffsOf(tb, 'food'); if (fb.length) { const g2 = el.querySelector('#resg'); g2.insertAdjacentHTML('afterend', `<div id="tFood" class="note" style="margin-top:6px">${fb.map(buffLine).join('')}</div>`); } }
  const miss = C.eraReady(tb); el.querySelector('#tEra').innerHTML = miss == null ? '<div class="nrow">🚀 우주 로켓을 연구하면 우주로 나가요!</div>' : miss.length ? miss.map((m) => `<div class="nrow">⬜ ${m}</div>`).join('') : '<div class="nrow">✅ 곧 다음 시대로!</div>';
  const nd = C.needs(w, tb); el.querySelector('#tNeed').innerHTML = nd.map((n) => `<div class="need">💬 ${n.m}</div>`).join('');
  const J = { farmer: '🌾 농부', lumber: '🪓 나무꾼', miner: '⛏ 광부', scholar: '📚 학자', soldier: '🛡 병사', engineer: '⚙ 기술자' };
  el.querySelector('#tJobs').innerHTML = Object.entries(tb.jobs || {}).filter(([, v]) => v >= .5).map(([k, v]) => `<span>${J[k]} ${Math.round(v)}</span>`).join('');
}
function closeSheet() { $('sheet').hidden = true; selTb = -1; }

// ---------- 사건 카드 ----------
function showCard(ev) {
  card = ev; const d = $('card'), tb = w.tribes[ev.tb ?? ev.a]; d.innerHTML = '';
  const add = (h) => d.insertAdjacentHTML('beforeend', h);
  if (ev.k === 'era') { d.append(folkCanvas(tb.sp, tb.era, 110)); add(`<h2>${C.ERAS[tb.era]}!</h2><p>${C.SPECIES[tb.sp].name}이 ${C.ERAS[tb.era]}에 들어섰어요. 집과 마을이 새 모습으로 바뀌어요.</p>${tb.era === 1 && w.tribes.length < 2 ? '<p class="good">🐣 두 번째 종족을 탄생시킬 수 있어요!</p>' : ''}${tb.era === 2 && w.tribes.length < 3 ? '<p class="good">🐣 세 번째 종족을 탄생시킬 수 있어요!</p>' : ''}<button class="btn" id="ok">좋아요</button>`); }
  else if (ev.k === 'meet') {
    const A = w.tribes[ev.a], B = w.tribes[ev.b]; const row = document.createElement('div'); row.className = 'meet'; row.append(folkCanvas(A.sp, A.era, 80)); row.insertAdjacentHTML('beforeend', '<b>🤝</b>'); row.append(folkCanvas(B.sp, B.era, 80)); d.append(row);
    add(`<h2>다른 종족 발견!</h2><p>${C.SPECIES[A.sp].name}과 ${C.SPECIES[B.sp].name}이 서로를 만났어요. 어떻게 이끌까요?</p><button class="btn g" id="trade">교류해요 <small>(지식 +15%, 금 수입 ↑)</small></button><button class="btn w" id="war">경쟁해요 <small>(센 쪽이 자원을 빼앗아요)</small></button>`);
  } else if (ev.k === 'plague') add(`<div class="big">🦠</div><h2>전염병</h2><p>${ev.m}</p><button class="btn g" id="heal">치유하기 ✨20</button><button class="btn w" id="no">그냥 둬요 (인구 -20%)</button>`);
  else add(`<div class="big">${{ harvest: '🌾', inventor: '💡', golden: '👑', drought: '☀️', volcano: '🌋', fire: '🔥' }[ev.k] || '✨'}</div><h2>${{ harvest: '풍년', inventor: '위대한 발명가', golden: '황금시대', drought: '가뭄', volcano: '화산 폭발', fire: '산불' }[ev.k] || '사건'}</h2><p>${ev.m}</p><button class="btn" id="ok">${ev.hint === 'rain' ? '비 내리러 가기' : '확인'}</button>`);
  $('cardDim').hidden = false;
  const on = (id, fn) => { const b = d.querySelector('#' + id); if (b) b.onclick = () => { fn(); closeCard(); }; };
  on('ok', () => { if (ev.hint === 'rain') { tab = 'power'; buildTools(); pickTool('power', 'rain', '비', '식량 +, 가뭄 해소'); } });
  on('trade', () => C.resolveMeet(w, ev.a, ev.b, 'trade')); on('war', () => C.resolveMeet(w, ev.a, ev.b, 'war'));
  on('heal', () => { if (!C.resolvePlague(w, ev.tb, true)) toast('신력이 부족해서 치유하지 못했어요'); }); on('no', () => C.resolvePlague(w, ev.tb, false));
  if (ev.k === 'volcano') { shake = 1; fx.push({ k: 'ring', x: (ev.x + .5) * TS, y: (ev.y + .5) * TS, t: 0, life: 1.2, col: 'rgba(255,120,40,.9)' }); terrDirty = true; }
}
function closeCard() { $('cardDim').hidden = true; card = null; save(); }
let shake = 0;

// ---------- 입력 ----------
const ptr = new Map(); let drag = null, pinch = null, lastTile = -1, moved = 0;
cv.addEventListener('pointerdown', (e) => {
  cv.setPointerCapture(e.pointerId); ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: cam.s, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, wx: ix((a.x + b.x) / 2), wy: iy((a.y + b.y) / 2) }; drag = null; return; }
  drag = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y }; moved = 0; lastTile = -1;
  if (tool && tool.kind === 'terra') applyAt(e.clientX, e.clientY);
});
cv.addEventListener('pointermove', (e) => {
  if (!ptr.has(e.pointerId)) return; ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch && ptr.size >= 2) { const [a, b] = [...ptr.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); cam.s = pinch.s * d / pinch.d; fitCam(); const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2; cam.x = pinch.wx - (mx - W / 2) / cam.s; cam.y = pinch.wy - (my - H / 2) / cam.s; clampCam(); return; }
  if (!drag) return; moved = Math.max(moved, Math.hypot(e.clientX - drag.x, e.clientY - drag.y));
  if (tool && tool.kind === 'terra') { applyAt(e.clientX, e.clientY); return; }
  cam.x = drag.cx - (e.clientX - drag.x) / cam.s; cam.y = drag.cy - (e.clientY - drag.y) / cam.s; clampCam();
});
const up = (e) => {
  const had = ptr.has(e.pointerId); ptr.delete(e.pointerId); if (ptr.size < 2) pinch = null;
  if (had && drag && moved < 8 && !(tool && tool.kind === 'terra')) tapAt(e.clientX, e.clientY);
  if (!ptr.size) drag = null;
};
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', (e) => { ptr.delete(e.pointerId); drag = null; pinch = null; });
cv.addEventListener('wheel', (e) => { e.preventDefault(); const wx = ix(e.clientX), wy = iy(e.clientY); cam.s *= e.deltaY < 0 ? 1.12 : 1 / 1.12; fitCam(); cam.x = wx - (e.clientX - W / 2) / cam.s; cam.y = wy - (e.clientY - H / 2) / cam.s; clampCam(); }, { passive: false });
const tileAt = (px, py) => [Math.floor(ix(px) / TS), Math.floor(iy(py) / TS)];
function applyAt(px, py) {
  const [x, y] = tileAt(px, py); const i = y * C.W + x; if (i === lastTile) return; lastTile = i;
  const r = C.terraform(w, tool.id, x, y);
  if (r.ok) { tutStat.terra[tool.id] = (tutStat.terra[tool.id] || 0) + 1; terrDirty = true; fx.push({ k: 'spark', x: (x + .5) * TS, y: (y + .5) * TS, t: 0, life: .5 }); C.territory(w); }
  else if (r.msg) toast(r.msg);
}
function tapAt(px, py) {
  const [x, y] = tileAt(px, py); if (!C.inb(x, y)) return;
  if (tool && tool.kind === 'power') {
    const r = C.usePower(w, tool.id, x, y); if (!r.ok) return toast(r.msg || ''); tutStat.power[tool.id] = 1;
    const X = (x + .5) * TS, Y = (y + .5) * TS;
    fx.push({ k: { rain: 'rain', bolt: 'bolt' }[tool.id] || 'ring', x: X, y: Y, t: 0, life: tool.id === 'rain' ? 1.6 : 1 }); fx.push({ k: 'txt', s: r.msg, x: X, y: Y - 30, t: 0, life: 1.6 });
    if (tool.id === 'quake') { shake = 1; terrDirty = true; } if (tool.id === 'rain') terrDirty = true;
    tool = null; hint(''); hud(); return;
  }
  if (tool && tool.kind === 'life') {
    const r = C.spawnTribe(w, +tool.id, x, y); if (!r.ok) return toast(r.msg);
    fx.push({ k: 'ring', x: (x + .5) * TS, y: (y + .5) * TS, t: 0, life: 1.2 }); fx.push({ k: 'spark', x: (x + .5) * TS, y: (y + .5) * TS, t: 0, life: .8 });
    tool = null; hint(''); C.territory(w); syncAgents(); buildTools(); terrDirty = true; save(); openTribe(r.tb.id); return;
  }
  // 마을·영토를 누르면 종족 정보
  const o = w.own ? w.own[y * C.W + x] : -1; if (o >= 0) openTribe(o);
}

// ---------- 저장 ----------
function save() { if (!w || TEST) return; try { const o = { ...w, t: Array.from(w.t), own: undefined, at: Date.now() }; o.tribes = w.tribes.map((b) => ({ ...b, _c: undefined, _r: undefined })); localStorage.setItem(KEY, JSON.stringify(o)); cloudStore(o); } catch (e) { } }
// 로그인하면 계정에도 저장 (30초에 한 번)
const MG = window.MGH || null; let owner = null, cloudAt = null, cloudLast = 0;
function cloudStore(o, now) {
  if (!owner || (!now && Date.now() - cloudLast < 30000)) return; cloudLast = Date.now();
  MG.save.store({ ...o, owner }, cloudAt || undefined).then((r) => { if (r && r.conflict) { cloudAt = r.updatedAt; return MG.save.store({ ...o, owner }, cloudAt); } return r; }).then((r) => { if (r && r.updatedAt) cloudAt = r.updatedAt; }).catch(() => { });
}
function setupAuth() {
  if (!MG || !MG.save || !MG.embedded) return;
  MG.save.onAuth(async (u) => {
    owner = u ? u.id : null; if (!u) return;
    try {
      const r = await MG.save.load(); cloudAt = (r && r.updatedAt) || null; const d = r && r.data;
      const sc = (o) => (o && o.tribes ? o.tribes.reduce((s2, b) => s2 + b.era * 1000 + b.pop, 0) + (o.stars || 0) * 1e5 : -1);
      const loc = w && w.tribes ? w : loadSave();
      if (d && d.t && d.owner === owner && sc(d) > sc(loc)) {
        localStorage.setItem(KEY, JSON.stringify(d)); toast('☁️ 계정 기록을 불러왔어요');
        if ($('title').hidden) start(true); else { $('contBtn').hidden = false; }
      } else if (loc) cloudStore({ ...loc, t: Array.from(loc.t), own: undefined, tribes: loc.tribes.map((b) => ({ ...b, _c: undefined, _r: undefined })), at: Date.now() }, true);
    } catch (e) { }
  });
}
function loadSave() { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (!s || !s.t) return null; s.t = Uint8Array.from(s.t); return s; } catch (e) { return null; } }
function offline(sec) {
  const pops = w.tribes.map((b) => b.pop), eras = w.tribes.map((b) => b.era), n = Math.floor(Math.min(sec, 4 * 3600) * .5); // 자리 비움은 절반 속도
  for (let k = 0; k < n; k++) { C.step(w, 1); for (const ev of w.events) { if (ev.k === 'meet') C.resolveMeet(w, ev.a, ev.b, 'trade'); if (ev.k === 'plague') C.resolvePlague(w, ev.tb, false); } w.events = []; if (w.done) break; }
  if (n > 30) { const lines = w.tribes.map((b, i) => `${C.SPECIES[b.sp].name}: 인구 ${pops[i] ?? 0} → ${b.pop}${b.era > (eras[i] ?? 0) ? ` · ${C.ERAS[b.era]}!` : ''}`); $('card').innerHTML = `<div class="big">🌙</div><h2>자리를 비운 동안</h2><p>${Math.floor(sec / 60)}분 동안 문명이 스스로 자랐어요.</p>${lines.map((l) => `<div class="nrow">${l}</div>`).join('')}<button class="btn" id="ok">좋아요</button>`; $('cardDim').hidden = false; $('card').querySelector('#ok').onclick = closeCard; card = { k: 'away' }; }
}

// ---------- 시작 · 끝 ----------
function start(cont) {
  const s = cont && loadSave();
  if (s) { w = s; C.territory(w); offline((Date.now() - (s.at || Date.now())) / 1000); }
  else { const stars = w ? w.stars : (loadSave() || {}).stars || 0; w = C.newWorld(Q.get('seed') ? +Q.get('seed') : undefined); w.stars = stars; C.territory(w); }
  $('title').hidden = true; $('hudTop').hidden = false; $('hudBot').hidden = false;
  agents.length = 0; syncAgents(); terrDirty = true; fitCam(true); cam.x = WW / 2; cam.y = WH / 2;
  tab = 'life'; buildTools();
  if (!w.tribes.length) { hint('🐣 아래에서 종족을 골라 섬에 첫 생명을 탄생시켜 보세요'); }
  if (!cont && !tutDone()) tutStart(0);
  save();
}
function ending() {
  const tb = w.tribes[w.done.tb]; paused = true;
  $('card').innerHTML = `<div class="big">🚀</div><h2>우주 진출!</h2><p>${C.SPECIES[tb.sp].name}이 별을 향해 날아올랐어요. ${Math.floor(w.time / 60)}분 동안 섬의 역사를 이끌었어요.</p><div class="nrow">문명 점수 <b style="margin-left:auto">${C.score(w).toLocaleString()}</b></div><p class="dimt">새 섬에서 다시 시작하면 '별의 축복'으로 신력이 20% 더 빨리 차요.</p><button class="btn" id="again">새 섬에서 시작 ⭐</button><button class="btn w" id="stay">이 섬 계속 보기</button>`;
  $('cardDim').hidden = false;
  $('card').querySelector('#again').onclick = () => { w.stars++; const st = w.stars; localStorage.removeItem(KEY); w = { stars: st }; start(false); paused = false; closeCard(); };
  $('card').querySelector('#stay').onclick = () => { w.done = 'seen'; paused = false; closeCard(); };
  
}

// ---------- 루프 ----------
let last = performance.now(), acc = 0, saveT = 0, syncT = 0;
function frame(now) {
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  if (w && !$('hudTop').hidden) {
    if (!paused && !card) { acc += dt * speed; let n = 0; while (acc >= .25 && n < 40) { C.step(w, .25); acc -= .25; n++; } }
    moveAgents(dt * (paused || card ? 0 : Math.min(2, speed)));
    if (!card && w.events.length) showCard(w.events.shift());
    if (w.done && w.done !== 'seen' && !card) ending();
    syncT += dt; if (syncT > .5) { syncT = 0; syncAgents(); hud(); if (w.tribes.some((b) => b._built !== b.works.length)) { terrDirty = true; w.tribes.forEach((b) => (b._built = b.works.length)); } }
    saveT += dt; if (saveT > 5) { saveT = 0; save(); }
  }
  if (shake > 0) { shake -= dt * 1.5; cam.x += (Math.random() - .5) * 6 * shake; cam.y += (Math.random() - .5) * 6 * shake; }
  if (tut >= 0) tutTick();
  draw(now);
  requestAnimationFrame(frame);
}

// ---------- 시작 ----------
async function boot() {
  resize(); addEventListener('resize', resize);
  ART = await (await fetch('assets/art.json')).json();
  const [folk, bld, work, nat, ico, title] = await Promise.all(['folk', 'bld', 'work', 'nat', 'ico'].map((n) => load(`assets/${n}.webp`)).concat(load('assets/title.webp')));
  Object.assign(IMG, { folk, bld, work, nat, ico, title });
  $('load').hidden = true;
  const has = !!loadSave(); $('contBtn').hidden = !has; $('newBtn').textContent = has ? '새 섬 만들기' : '시작하기';
  $('newBtn').onclick = () => { if (has && !confirmNew()) return; start(false); };
  $('contBtn').onclick = () => start(true);
  document.querySelectorAll('.tab').forEach((t) => (t.onclick = () => { tab = t.dataset.tab; tool = null; hint(''); buildTools(); }));
  $('spd').onclick = () => { if (paused) paused = false; else speed = speed === 1 ? 2 : speed === 2 ? 4 : 1; hud(); };
  $('menuBtn').onclick = openMenu;
  $('cardDim').onclick = (e) => { if (e.target === $('cardDim') && card && !card.choice && card.k !== 'away') closeCard(); };
  addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  setupAuth();
  if (TEST) window.__civ = { C, get w() { return w; }, set w(v) { w = v; }, step: (n, dt = 1) => { for (let k = 0; k < n; k++) C.step(w, dt); }, start, cam, openTribe, showCard, get card() { return card; }, closeCard, syncAgents, setTool: (kind, id) => (tool = { kind, id }), tapAt, redraw: () => (terrDirty = true), get tut() { return tut; }, tutStart, tutStat };
  requestAnimationFrame(frame);
}
// ---------- 튜토리얼 ----------
const TUT_KEY = 'mgh:little-civ:tut';
const tutStat = { terra: {}, power: {}, sheet: 0 };
let tut = -1, tutBase = 0;
const tutDone = () => { try { return localStorage.getItem(TUT_KEY) === '1'; } catch (e) { return false; } };
const mana = (n) => { if (w.mana < n) w.mana = n; };
const openFirst = () => { if (w.tribes[0] && $('sheet').hidden) openTribe(0); };
const TUT = [
  { t: '안녕하세요, 신님! 👋<br>이 작은 섬은 아직 텅 비어 있어요. 생명을 탄생시키고 살기 좋은 환경을 만들어 주면, 주민들이 <b>스스로 일하고 문명을 키워요.</b>', next: '좋아요' },
  { sel: '.tool[data-kind=life][data-id="0"]', t: '먼저 첫 종족을 골라요.<br>🐰 <b>토토족</b>을 눌러 보세요. 초원을 좋아하고 식량이 잘 늘어요.', on: () => { tab = 'life'; buildTools(); }, done: () => tool && tool.kind === 'life' },
  { t: '섬의 <b>초록 땅</b>을 아무 곳이나 눌러 탄생시켜요.<br>가운데쯤이 넓게 퍼지기 좋아요.', done: () => w.tribes.length > 0, back: () => !(tool && tool.kind === 'life') && !w.tribes.length ? 1 : -1 },
  { sel: '#resg', t: '마을 정보예요. 주민이 모으는 <b>자원 7가지</b>:<br>🍎 식량 — 먹고 인구가 늘어요<br>🪵 목재 — 집을 지어요<br>🪨 돌 · 철 · 🪙 금 — 큰 건물과 후반 발전<br>📘 지식 — 기술 연구 · ⚡ 에너지 — 산업 시대부터<br>오른쪽 숫자는 1초에 늘거나 줄어드는 양이에요.', on: openFirst, next: '다음' },
  { sel: '#tEra', t: '<b>다음 시대 조건</b>이 목표예요.<br>그 시대의 기술을 모두 배우고, 인구와 자원을 채우면 다음 시대로 넘어가요.<br>원시 → 농경 → 부족 국가 → 왕국 → 산업 → 미래 → 🚀 우주!', on: openFirst, next: '다음' },
  { sel: '.tab[data-tab=terra]', t: '자원은 <b>땅</b>에서 나와요. 주민은 자기 영토(점선 안)에서만 일해요.<br>🌱 <b>지형</b>을 눌러 보세요.', ring: 1, on: closeSheet, done: () => tab === 'terra' },
  { sel: '.tool[data-id=tree]', t: '🌳 <b>나무</b>를 고르고 점선 안 초원을 눌러요. 손가락으로 끌면 여러 칸을 한 번에 심어요.<br>숲 → 목재, 목재 → 집, 집 → 인구! <small>(3칸 심기)</small>', ring: 1, on: () => mana(40), done: () => (tutStat.terra.tree || 0) >= 3 },
  { sel: '.tool[data-id=mount]', t: '이번엔 ⛰ <b>산</b>을 하나 만들어요.<br>산에서 돌·철·금이 나와요. 농경 시대부터 꼭 필요해요.<br><small>호수는 식량, 화산은 금이 많이 나와요.</small>', ring: 1, on: () => mana(20), done: () => (tutStat.terra.mount || 0) >= 1 },
  { sel: '.mana', t: '땅을 바꾸고 능력을 쓰면 <b>✨ 신력</b>이 줄어요.<br>신력은 시간이 지나면 다시 차고, 주민이 많을수록 빨리 차요.', next: '다음' },
  { sel: '.tab[data-tab=power]', t: '⚡ <b>신의 능력</b>으로 문명을 직접 도울 수 있어요. 눌러 보세요.', done: () => tab === 'power' },
  { sel: '.tool[data-id=wisdom]', t: '💡 <b>지혜</b>를 고르고 마을을 눌러요.<br>45초 동안 연구가 2배 빨라져요.<br><small>비는 식량, 풍요는 인구, 번개는 에너지를 줘요.</small>', ring: 1, on: () => { mana(40); delete w.cds.wisdom; }, done: () => tutStat.power.wisdom },
  { sel: '.chip', t: '위의 <b>종족 칩</b>이나 마을을 누르면 언제든 정보를 볼 수 있어요.<br>눌러서 지금 연구 중인 기술을 확인해 봐요.', on: () => (tutBase = tutStat.sheet), done: () => tutStat.sheet > tutBase },
  { sel: '#techs', t: '📘 지식이 모이면 기술을 하나씩 배워요. <b>먼저 배우고 싶은 기술을 누르면</b> 순서가 바뀌어요.<br>💬 안내가 뜨면 부족한 걸 채워 주세요.', on: openFirst, next: '다음' },
  { sel: '#spd', t: '▶ 버튼으로 속도를 2배·4배로 올려요. 📜에서 섬의 역사와 도움말을 다시 볼 수 있어요.<br>자리를 비워도 문명은 천천히 자라요. <b>농경 시대가 되면 두 번째 종족</b>이 열려요.<br>이제 마음껏 키워 보세요!', on: closeSheet, next: '시작!' },
];
function tutStart(i) { tut = i; tutEnter(); }
function tutEnter() {
  const st = TUT[tut]; if (st.on) st.on();
  const b = $('tut'); b.hidden = false;
  b.innerHTML = `<div class="tstep">${tut + 1} / ${TUT.length}</div><p>${st.t}</p><div class="trow"><button class="tskip" id="tutSkip">건너뛰기</button>${st.next ? `<button class="tnext" id="tutNext">${st.next}</button>` : ''}</div>`;
  $('tutSkip').onclick = tutEnd; if (st.next) $('tutNext').onclick = tutAdvance;
  hint(''); setTimeout(() => { const el = st.sel && document.querySelector(st.sel); if (el && el.closest('#tools')) el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); }, 50); tutPlace();
}
function tutAdvance() { if (tut >= TUT.length - 1) return tutEnd(); tut++; tutEnter(); }
function tutEnd() { tut = -1; $('tut').hidden = true; $('tutHi').hidden = true; try { localStorage.setItem(TUT_KEY, '1'); } catch (e) { } }
function tutPlace() {
  const st = TUT[tut], hi = $('tutHi'), b = $('tut'), el = st.sel && document.querySelector(st.sel);
  let low = false;
  if (el) {
    if (el.closest('#sheet')) el.scrollIntoView({ block: 'nearest' });
    const r = el.getBoundingClientRect(); hi.hidden = false;
    Object.assign(hi.style, { left: r.left - 5 + 'px', top: r.top - 5 + 'px', width: r.width + 10 + 'px', height: r.height + 10 + 'px' });
    low = r.top + r.height / 2 > innerHeight * .5;
  } else hi.hidden = true;
  const sheetOpen = !$('sheet').hidden;
  if (low || sheetOpen) { b.style.top = 'calc(8px + env(safe-area-inset-top))'; b.style.bottom = 'auto'; }
  else { b.style.top = 'auto'; b.style.bottom = ($('hudBot').getBoundingClientRect().height + 18) + 'px'; }
}
function tutTick() {
  if (card && card.k !== 'menu') { $('tut').hidden = true; $('tutHi').hidden = true; return; }
  $('tut').hidden = false; const st = TUT[tut];
  if (w.nextEv < 30) w.nextEv = 30; // 튜토리얼 중엔 사건 쉬기
  if (st.back && st.back() >= 0) { tut = st.back(); tutEnter(); return; }
  if (st.done && st.done()) return tutAdvance();
  tutPlace();
}
let newArm = 0;
function confirmNew() { if (Date.now() - newArm < 3000) return true; newArm = Date.now(); $('newBtn').textContent = '정말요? 한 번 더 누르면 새 섬'; return false; }
function openMenu() {
  $('card').innerHTML = `<h2>📜 섬의 역사</h2><div class="log">${w.log.slice().reverse().map((l) => `<div class="nrow ${l.kind}"><small>${Math.floor(l.t / 10) + 1}년</small> ${l.m}</div>`).join('') || '<p class="dimt">아직 기록이 없어요</p>'}</div>
  <h3>어떻게 하나요?</h3><p class="dimt">🐣 생명: 종족을 탄생시켜요 (농경 시대·부족 국가가 되면 한 종족씩 더)<br>🌱 지형: 숲·호수·산을 만들어 주면 종족이 알아서 자원을 모아요<br>⚡ 신의 능력: 축복·비·번개·지진·풍요·지혜로 문명을 도와요<br>마을을 누르면 연구할 기술과 부족한 것을 볼 수 있어요. 자리를 비워도 천천히 자라요.</p>
  <button class="btn w" id="tutAgain">🎓 튜토리얼 다시 보기</button><button class="btn w" id="pz">${paused ? '다시 진행' : '잠깐 멈추기'}</button><button class="btn" id="ok">닫기</button>`;
  card = { k: 'menu' }; $('cardDim').hidden = false;
  $('card').querySelector('#ok').onclick = closeCard; $('card').querySelector('#pz').onclick = () => { paused = !paused; closeCard(); hud(); };
  $('card').querySelector('#tutAgain').onclick = () => { closeCard(); paused = false; tutStart(w.tribes.length ? 3 : 0); };
}
boot();
