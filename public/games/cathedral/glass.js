// 스테인드글라스 — 성인 메달리온 창(4종)과 장미창을 캔버스로 그리고, 에셋의 유리 조각마다 UV 를 새로 펴서 입힌다.
import * as THREE from 'three';

const PAL = {
  blue: ['#0a2a8c', '#1240b4', '#1a56cc', '#08206e', '#1e4aa8'],
  red: ['#a8101e', '#c81c26', '#86101a', '#b4142a'],
  gold: ['#e8a81c', '#f4c43c', '#d08c10'],
  green: ['#10783a', '#1c9a4a', '#0c5e2e'],
  purple: ['#5a1c8e', '#7a2cae', '#481478'],
  white: ['#efe6cc', '#f8f0dc', '#e2d8bc'],
  skin: ['#f2d2b0', '#ecc6a0'],
};
const LEAD = '#0b0806';
const MANTLES = [PAL.red, PAL.blue, PAL.green, PAL.purple, PAL.gold];
let seed = 7;
const R = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(R() * a.length)];

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
// 유리 한 조각: 색 + 가운데가 밝은 얼룩 + 납선
function piece(g, path, col, lw = 4) {
  if (Array.isArray(col)) col = pick(col);
  g.save();
  g.fillStyle = shade(col, .82 + R() * .36); g.fill(path);
  g.clip(path);
  const b = path.__b;
  if (b) {
    const gr = g.createRadialGradient(b[0] + R() * b[2], b[1] + R() * b[3], 0, b[0] + b[2] / 2, b[1] + b[3] / 2, Math.max(b[2], b[3]));
    gr.addColorStop(0, 'rgba(255,255,255,.28)'); gr.addColorStop(1, 'rgba(0,0,0,.18)');
    g.fillStyle = gr; g.fill(path);
  }
  g.restore();
  g.lineWidth = lw; g.strokeStyle = LEAD; g.lineJoin = 'round'; g.stroke(path);
}
function P(pts) { const p = new Path2D(); p.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) p.lineTo(pts[i], pts[i + 1]); p.closePath(); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < pts.length; i += 2) { x0 = Math.min(x0, pts[i]); x1 = Math.max(x1, pts[i]); y0 = Math.min(y0, pts[i + 1]); y1 = Math.max(y1, pts[i + 1]); } p.__b = [x0, y0, x1 - x0, y1 - y0]; return p; }
function C(x, y, r) { const p = new Path2D(); p.arc(x, y, r, 0, Math.PI * 2); p.__b = [x - r, y - r, 2 * r, 2 * r]; return p; }
function arcSeg(cx, cy, r0, r1, a0, a1) { const p = new Path2D(); p.arc(cx, cy, r1, a0, a1); p.arc(cx, cy, r0, a1, a0, true); p.closePath(); const m = (a0 + a1) / 2, rm = (r0 + r1) / 2; p.__b = [cx + Math.cos(m) * rm - (r1 - r0), cy + Math.sin(m) * rm - (r1 - r0), 2 * (r1 - r0), 2 * (r1 - r0)]; return p; }
// 그리자유(유리 위 갈색 물감 선)
function paint(g, fn, w = 2.2) { g.save(); g.strokeStyle = 'rgba(40,18,6,.75)'; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); fn(g); g.stroke(); g.restore(); }

// 서 있는 성인 한 명 (cx, 발 y=fy, 키 h)
function figure(g, cx, fy, h, robe, mantle, prop) {
  const s = h / 300, top = fy - h;
  const pc = (path, col, lw = 4) => piece(g, path, col, Math.max(1, lw * Math.min(1, s * 1.3)));
  const halo = C(cx, top + 42 * s, 40 * s); pc(halo, pick(PAL.gold), 4);
  paint(g, (c) => { for (let a = 0; a < 12; a++) { const t = a / 12 * Math.PI * 2; c.moveTo(cx + Math.cos(t) * 30 * s, top + 42 * s + Math.sin(t) * 30 * s); c.lineTo(cx + Math.cos(t) * 38 * s, top + 42 * s + Math.sin(t) * 38 * s); } }, 1.5);
  const head = C(cx, top + 46 * s, 22 * s); pc(head, pick(PAL.skin), 3);
  paint(g, (c) => {
    c.moveTo(cx - 9 * s, top + 42 * s); c.lineTo(cx - 4 * s, top + 42 * s);
    c.moveTo(cx + 4 * s, top + 42 * s); c.lineTo(cx + 9 * s, top + 42 * s);
    c.moveTo(cx, top + 44 * s); c.lineTo(cx - 2 * s, top + 52 * s);
    c.moveTo(cx - 5 * s, top + 57 * s); c.lineTo(cx + 5 * s, top + 57 * s);
  }, 1.6);
  // 머리카락
  const hair = new Path2D(); hair.arc(cx, top + 46 * s, 23 * s, Math.PI * 1.05, Math.PI * 1.95); hair.lineTo(cx + 20 * s, top + 38 * s); hair.quadraticCurveTo(cx, top + 30 * s, cx - 20 * s, top + 38 * s); hair.closePath(); hair.__b = [cx - 23 * s, top + 22 * s, 46 * s, 18 * s];
  pc(hair, R() < .5 ? '#7a4a1c' : '#c8a060', 2.5);
  // 옷: 어깨 → 발까지 넓어지는 로브, 세 조각
  const sh = top + 70 * s, w0 = 34 * s, w1 = 62 * s;
  const L = P([cx - w0, sh, cx, sh - 4 * s, cx, fy, cx - w1, fy]);
  const Rr = P([cx, sh - 4 * s, cx + w0, sh, cx + w1, fy, cx, fy]);
  pc(L, robe); pc(Rr, robe);
  // 망토 (어깨에서 대각선으로)
  const M = P([cx - w0 - 4 * s, sh + 2 * s, cx + w0 * .4, sh + 6 * s, cx + w1 * .9, fy - 70 * s, cx + w1 + 2 * s, fy - 10 * s, cx + w1 * .2, fy - 40 * s, cx - w0 - 12 * s, sh + 120 * s]);
  pc(M, mantle);
  paint(g, (c) => { for (let i = -2; i <= 2; i++) { c.moveTo(cx + i * 12 * s, sh + 60 * s); c.quadraticCurveTo(cx + i * 15 * s, fy - 60 * s, cx + i * 20 * s, fy - 6 * s); } });
  // 손과 소지품
  const hx = cx + 10 * s, hy = sh + 70 * s;
  if (prop === 'book') { pc(P([hx - 20 * s, hy - 8 * s, hx + 18 * s, hy - 14 * s, hx + 20 * s, hy + 18 * s, hx - 18 * s, hy + 22 * s]), pick(PAL.red), 3); paint(g, (c) => { c.moveTo(hx, hy - 11 * s); c.lineTo(hx + 1 * s, hy + 20 * s); }, 1.4); }
  else if (prop === 'staff') { g.save(); g.strokeStyle = LEAD; g.lineWidth = 11 * s; g.beginPath(); g.moveTo(cx - 42 * s, top + 10 * s); g.lineTo(cx - 48 * s, fy); g.stroke(); g.strokeStyle = pick(PAL.gold); g.lineWidth = 6 * s; g.stroke(); g.restore(); pc(C(cx - 42 * s, top + 4 * s, 10 * s), pick(PAL.gold), 3); }
  else if (prop === 'lily') { g.save(); g.strokeStyle = '#1c7a3a'; g.lineWidth = 5 * s; g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + 14 * s, hy - 70 * s); g.stroke(); g.restore(); for (let k = 0; k < 3; k++) pc(C(hx + 14 * s + (k - 1) * 9 * s, hy - 76 * s + Math.abs(k - 1) * 8 * s, 8 * s), PAL.white[0], 2.5); }
  pc(C(hx, hy, 9 * s), pick(PAL.skin), 2.5);
}

// 메달리온 테두리 모양
function medShape(kind, cx, cy, r) {
  if (kind === 'circle') return C(cx, cy, r);
  const p = new Path2D();
  if (kind === 'quatre') { // 사엽형
    for (let k = 0; k <= 160; k++) { const t = k / 160 * Math.PI * 2, rr = r * (.74 + .26 * Math.abs(Math.cos(2 * t + Math.PI / 2))) * 1.02; k ? p.lineTo(cx + Math.cos(t) * rr, cy + Math.sin(t) * rr) : p.moveTo(cx + Math.cos(t) * rr, cy + Math.sin(t) * rr); }
    p.closePath();
  } else { // 끝이 뾰족한 아치형
    const w = r * .82; p.moveTo(cx - w, cy + r); p.lineTo(cx - w, cy - r * .2); p.quadraticCurveTo(cx - w, cy - r, cx, cy - r * 1.18); p.quadraticCurveTo(cx + w, cy - r, cx + w, cy - r * .2); p.lineTo(cx + w, cy + r); p.closePath();
  }
  p.__b = [cx - r, cy - r, 2 * r, 2 * r]; return p;
}

// 배경 모자이크(마름모 격자)
function mosaic(g, x0, y0, w, h, base, accent) {
  const d = 34;
  for (let y = y0 - d; y < y0 + h + d; y += d) for (let x = x0 - d; x < x0 + w + d; x += d) {
    const off = (Math.round((y - y0) / d) % 2) * d / 2;
    const cx = x + off, cy = y;
    piece(g, P([cx, cy - d / 2, cx + d / 2, cy, cx, cy + d / 2, cx - d / 2, cy]), pick(base), 3);
    if (R() < .22) piece(g, C(cx, cy, 6), pick(accent), 2);
  }
}

// 랜싯 창 한 칸 (W×H, 위아래로 이어 붙는 무늬)
function drawLancet(g, ox, W, H, v) {
  g.save(); g.beginPath(); g.rect(ox, 0, W, H); g.clip();
  const B = 36;
  const bgBase = v % 2 ? PAL.red : PAL.blue, bgAcc = v % 2 ? PAL.blue : PAL.red;
  mosaic(g, ox + B, 0, W - 2 * B, H, bgBase, bgAcc.concat(PAL.gold));
  // 메달리온 3개(세로 주기 H)
  const kinds = ['circle', 'quatre', 'arch', 'circle'];
  const robes = [PAL.green, PAL.red, PAL.white, PAL.purple, PAL.blue, PAL.gold];
  const props = ['book', 'staff', 'lily', 'book', 'none'];
  for (let i = 0; i < 3; i++) {
    const cy = H / 6 + i * H / 3, cx = ox + W / 2, r = W / 2 - B - 14, kind = kinds[(v + i) % 4];
    const shp = medShape(kind, cx, cy, r);
    g.save(); g.lineWidth = 26; g.strokeStyle = LEAD; g.stroke(shp); g.lineWidth = 16; g.strokeStyle = pick(PAL.gold); g.stroke(shp); g.lineWidth = 4; g.setLineDash([3, 12]); g.strokeStyle = '#fff6d0'; g.stroke(shp); g.restore();
    g.save(); g.clip(shp);
    const inner = (v + i) % 2 ? PAL.blue : PAL.red;
    for (let k = 0; k < 10; k++) { const a0 = k / 10 * Math.PI * 2; piece(g, arcSeg(cx, cy, 0, r * 1.3, a0, a0 + Math.PI / 5), pick(inner), 3); }
    const ground = P([cx - r, cy + r * .72, cx + r, cy + r * .62, cx + r, cy + r + 20, cx - r, cy + r + 20]); piece(g, ground, pick(PAL.green));
    let robe = pick(robes); while (robe === inner) robe = pick(robes);
    if ((v + i) % 3 === 2) { // 두 사람
      figure(g, cx - r * .38, cy + r * .78, r * 1.3, PAL.white, pick(MANTLES.filter((m) => m !== inner)), pick(props));
      figure(g, cx + r * .38, cy + r * .74, r * 1.3, robe, PAL.gold, pick(props));
    } else figure(g, cx, cy + r * .8, r * 1.55, robe, pick(MANTLES.filter((m) => m !== robe && m !== inner)), pick(props));
    g.restore();
    g.lineWidth = 5; g.strokeStyle = LEAD; g.stroke(shp);
    // 메달리온 사이 작은 장미꽃
    const ry = cy + H / 6;
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; piece(g, C(cx + Math.cos(a) * 20, ry + Math.sin(a) * 20, 13), pick(PAL.red), 3); }
    piece(g, C(cx, ry, 12), pick(PAL.gold), 3);
  }
  // 테두리 띠
  for (const bx of [ox, ox + W - B]) {
    for (let y = 0, k = 0; y < H; y += 48, k++) {
      piece(g, P([bx, y, bx + B, y, bx + B, y + 48, bx, y + 48]), k % 2 ? pick(PAL.red) : pick(PAL.blue), 4);
      piece(g, C(bx + B / 2, y + 24, 9), k % 3 ? pick(PAL.gold) : PAL.white[0], 2.5);
    }
  }
  // 받침 쇠막대
  g.fillStyle = LEAD; for (let y = 0; y < H; y += H / 3) g.fillRect(ox, y - 5, W, 10);
  g.fillRect(ox, 0, 6, H); g.fillRect(ox + W - 6, 0, 6, H);
  g.restore();
}

// 장미창 (정사각 캔버스에 원)
function drawRose(g, S) {
  const c = S / 2, Rr = S / 2 - 6;
  g.fillStyle = '#060404'; g.fillRect(0, 0, S, S);
  // 폴라 모자이크 바탕
  for (let r = 40; r < Rr; r += 26) {
    const n = Math.max(8, Math.round(2 * Math.PI * r / 30));
    for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; piece(g, arcSeg(c, c, r, Math.min(Rr, r + 26), a, a + Math.PI * 2 / n), R() < .62 ? pick(PAL.blue) : R() < .6 ? pick(PAL.purple) : pick(PAL.red), 3); }
  }
  // 바퀴살(돌 창살)
  const N = 16;
  g.save(); g.strokeStyle = '#1a1512'; g.lineWidth = 14;
  for (let k = 0; k < N; k++) { const a = k / N * Math.PI * 2; g.beginPath(); g.moveTo(c + Math.cos(a) * 110, c + Math.sin(a) * 110); g.lineTo(c + Math.cos(a) * Rr, c + Math.sin(a) * Rr); g.stroke(); }
  g.restore();
  // 링 1: 성인 메달리온
  for (let k = 0; k < N; k++) {
    const a = (k + .5) / N * Math.PI * 2, x = c + Math.cos(a) * 205, y = c + Math.sin(a) * 205, rr = 44;
    const sh = C(x, y, rr);
    g.save(); g.lineWidth = 16; g.strokeStyle = LEAD; g.stroke(sh); g.lineWidth = 9; g.strokeStyle = pick(PAL.gold); g.stroke(sh); g.restore();
    g.save(); g.clip(sh); piece(g, C(x, y, rr), k % 2 ? pick(PAL.red) : pick(PAL.blue), 3);
    figure(g, x, y + rr * .95, rr * 1.75, PAL.white, pick(k % 2 ? [PAL.blue, PAL.green, PAL.gold] : [PAL.red, PAL.green, PAL.gold]), 'none'); g.restore();
  }
  // 링 2: 꽃잎 + 작은 메달리온
  for (let k = 0; k < N * 2; k++) {
    const a = (k + .5) / (N * 2) * Math.PI * 2, x = c + Math.cos(a) * 340, y = c + Math.sin(a) * 340, rr = 30;
    const sh = C(x, y, rr);
    g.save(); g.lineWidth = 12; g.strokeStyle = LEAD; g.stroke(sh); g.lineWidth = 6; g.strokeStyle = k % 2 ? pick(PAL.gold) : PAL.white[0]; g.stroke(sh); g.restore();
    g.save(); g.clip(sh); piece(g, C(x, y, rr), k % 2 ? pick(PAL.red) : pick(PAL.green), 3);
    if (k % 2) figure(g, x, y + rr * .95, rr * 1.8, PAL.white, pick([PAL.blue, PAL.gold, PAL.green]), 'none');
    else { for (let j = 0; j < 6; j++) { const b = j / 6 * Math.PI * 2; piece(g, C(x + Math.cos(b) * 12, y + Math.sin(b) * 12, 9), pick(PAL.gold), 2.5); } piece(g, C(x, y, 8), pick(PAL.blue), 2.5); }
    g.restore();
  }
  // 링 3: 바깥 삼엽 장식
  for (let k = 0; k < N * 2; k++) {
    const a = k / (N * 2) * Math.PI * 2, x = c + Math.cos(a) * 452, y = c + Math.sin(a) * 452;
    for (let j = -1; j <= 1; j++) { const b = a + j * 1.9; piece(g, C(x + Math.cos(b) * 13, y + Math.sin(b) * 13, 12), j ? pick(PAL.blue) : pick(PAL.red), 3); }
    piece(g, C(x, y, 7), pick(PAL.gold), 2);
  }
  // 가운데
  const ctr = C(c, c, 100);
  g.save(); g.lineWidth = 20; g.strokeStyle = LEAD; g.stroke(ctr); g.lineWidth = 12; g.strokeStyle = pick(PAL.gold); g.stroke(ctr); g.restore();
  g.save(); g.clip(ctr); for (let k = 0; k < 12; k++) { const a0 = k / 12 * Math.PI * 2; piece(g, arcSeg(c, c, 0, 110, a0, a0 + Math.PI / 6), k % 2 ? pick(PAL.blue) : pick(PAL.red), 3); }
  figure(g, c, c + 92, 190, PAL.white[1], pick(PAL.blue), 'lily'); g.restore();
  // 바깥 돌테
  g.save(); g.lineWidth = 16; g.strokeStyle = '#1a1512'; g.beginPath(); g.arc(c, c, Rr - 4, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 10; g.beginPath(); g.arc(c, c, 380, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(c, c, 270, 0, Math.PI * 2); g.stroke(); g.restore();
}

// 유리 질감: 얼룩 + 기포
function glassGrain(g, w, h) {
  g.save(); g.globalCompositeOperation = 'overlay';
  for (let i = 0; i < w * h / 900; i++) { g.fillStyle = R() < .5 ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.12)'; const r = 2 + R() * 9; g.beginPath(); g.arc(R() * w, R() * h, r, 0, 7); g.fill(); }
  g.restore();
}

function canvasTex(c, wrapT) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  t.wrapS = THREE.ClampToEdgeWrapping; t.wrapT = wrapT ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

export const LANCETS = 4;
export function makeGlassMaterials(glow = 2.0) {
  seed = 11;
  const W = 512, H = 1536;
  const lc = document.createElement('canvas'); lc.width = W * LANCETS; lc.height = H;
  const lg = lc.getContext('2d');
  for (let v = 0; v < LANCETS; v++) drawLancet(lg, v * W, W, H, v);
  glassGrain(lg, lc.width, lc.height);
  const rc = document.createElement('canvas'); rc.width = rc.height = 1024;
  const rg = rc.getContext('2d'); drawRose(rg, 1024); glassGrain(rg, 1024, 1024);
  const mk = (t) => { const m = new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }); m.color.setScalar(glow); return m; };
  return { lancet: mk(canvasTex(lc, true)), rose: mk(canvasTex(rc, false)), canvases: [lc, rc] };
}

// 유리 메시: 조각(연결 요소)마다 평면 UV 를 펴고, 둥근 창은 장미창 재질로 나눈다
export function remapGlass(mesh, mats) {
  const geo = mesh.geometry, pos = geo.attributes.position, idx = geo.index, n = pos.count;
  const par = new Int32Array(n); for (let i = 0; i < n; i++) par[i] = i;
  const f = (x) => { while (par[x] !== x) x = par[x] = par[par[x]]; return x; };
  const v = new THREE.Vector3(), wp = new Float32Array(n * 3), keys = new Map();
  for (let i = 0; i < n; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld); wp[i * 3] = v.x; wp[i * 3 + 1] = v.y; wp[i * 3 + 2] = v.z;
    const k = `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;
    if (keys.has(k)) par[f(i)] = f(keys.get(k)); else keys.set(k, i);
  }
  for (let t = 0; t < idx.count; t += 3) { const a = f(idx.getX(t)); par[f(idx.getX(t + 1))] = a; par[f(idx.getX(t + 2))] = f(a); }
  const comps = new Map();
  for (let i = 0; i < n; i++) {
    const r = f(i); let c = comps.get(r);
    if (!c) comps.set(r, c = { mn: [1e9, 1e9, 1e9], mx: [-1e9, -1e9, -1e9] });
    for (let j = 0; j < 3; j++) { c.mn[j] = Math.min(c.mn[j], wp[i * 3 + j]); c.mx[j] = Math.max(c.mx[j], wp[i * 3 + j]); }
  }
  for (const c of comps.values()) { c.cx = (c.mn[0] + c.mx[0]) / 2; c.cz = (c.mn[2] + c.mx[2]) / 2; c.cov = 0; }
  for (let i = 0; i < n; i++) { const c = comps.get(f(i)); c.cov += (wp[i * 3] - c.cx) * (wp[i * 3 + 2] - c.cz); }
  for (const c of comps.values()) {
    const dx = c.mx[0] - c.mn[0], dz = c.mx[2] - c.mn[2], len = Math.hypot(dx, dz) || 1;
    c.hx = dx / len; c.hz = (c.cov < 0 ? -dz : dz) / len; c.w = len; c.h = c.mx[1] - c.mn[1];
    c.rose = c.w > 2.5 && Math.abs(c.w - c.h) / c.w < .15;
    const cx = (c.mn[0] + c.mx[0]) / 2, cz = (c.mn[2] + c.mx[2]) / 2;
    c.var = Math.abs(Math.round(cx * 3.1 + cz * 1.7 + c.mn[1] * .7)) % LANCETS;
    c.off = (Math.abs(Math.round(cx * 7 + cz * 13)) % 3) / 3;
  }
  const uv = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    const c = comps.get(f(i));
    const u = ((wp[i * 3] - c.cx) * c.hx + (wp[i * 3 + 2] - c.cz) * c.hz) / c.w + .5;
    const y = wp[i * 3 + 1] - c.mn[1];
    if (c.rose) { uv[i * 2] = u; uv[i * 2 + 1] = y / c.h; }
    else { uv[i * 2] = (c.var + .01 + .98 * u) / LANCETS; uv[i * 2 + 1] = y / (c.w * 3) + c.off; }
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const lan = [], ros = [];
  for (let t = 0; t < idx.count; t += 3) (comps.get(f(idx.getX(t))).rose ? ros : lan).push(idx.getX(t), idx.getX(t + 1), idx.getX(t + 2));
  geo.setIndex(new THREE.BufferAttribute(n > 65535 ? new Uint32Array(lan.concat(ros)) : new Uint16Array(lan.concat(ros)), 1));
  geo.clearGroups(); geo.addGroup(0, lan.length, 0); geo.addGroup(lan.length, ros.length, 1);
  mesh.material = [mats.lancet, mats.rose];
  return { panes: comps.size, roses: [...comps.values()].filter((c) => c.rose).length };
}
