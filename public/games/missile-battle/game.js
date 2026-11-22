// 미사일 배틀 — 화면·입력·카메라·저장
import * as C from './core.js';

const $ = (id) => document.getElementById(id);
const TEST = new URLSearchParams(location.search).has('test');
const MANUAL = new URLSearchParams(location.search).has('manual');
const L = (ko, en) => (window.MGH && MGH.L ? MGH.L(ko, en) : ko);
const SAVE = 'mgh:missile-battle';
const save = (() => { try { return JSON.parse(localStorage.getItem(SAVE)) || {}; } catch (e) { return {}; } })();
const store = () => { try { localStorage.setItem(SAVE, JSON.stringify(save)); } catch (e) {} };
save.stage = save.stage || 1; save.best = save.best || 1;

const cv = $('cv'), ctx = cv.getContext('2d');
let VW = 1, VH = 1, DPR = 1;
function resize() { DPR = Math.min(2, devicePixelRatio || 1); VW = innerWidth; VH = innerHeight; cv.width = VW * DPR; cv.height = VH * DPR; }
addEventListener('resize', resize); resize();

// ---------- 상태 ----------
let M, state = 'title', aim = null, lastAim = { angle: 50, power: 0.8 }, enemyT = 0, landT = 0, shake = 0;
const cam = { x: 700, y: 900, z: 0.4, tx: 700, ty: 900, tz: 0.4 };
const parts = [], nums = [], smoke = [];
let flashT = 0, banner = null;
const R = Math.random;

function startStage(n) {
  M = C.newMatch(n); state = 'aim'; aim = null; parts.length = 0; nums.length = 0; smoke.length = 0;
  $('stage').textContent = L(`스테이지 ${n}`, `Stage ${n}`);
  showBanner(L('내 차례! 끌어서 조준하고 놓으면 발사', 'Your turn! Drag to aim, release to fire'), 2.2);
  focusAim(true); hud();
}
function showBanner(t, d = 1.6, col) { banner = { t, d, max: d, col }; }

// ---------- 카메라 ----------
function viewW() { return VW / cam.z; }
function focusAim(snap) {
  // 내 기지 + 첫 배수 구역들이 보이게
  const z = Math.min(VW / 1050, VH / 1250); cam.tz = z; cam.tx = 150 + VW / z / 2 - 60; cam.ty = M.st.floor - VH / z / 2 + 120;
  if (snap) { cam.x = cam.tx; cam.y = cam.ty; cam.z = cam.tz; }
}
function focusBase(side) { const b = M.st.bases[side], z = Math.min(VW / 900, VH / 1100); cam.tz = z; cam.tx = side ? b.x + C.BASE_W - VW / z / 2 + 80 : b.x + VW / z / 2 - 80; cam.ty = M.st.floor - VH / z / 2 + 140; }
function followSwarm() {
  const live = M.missiles.filter((o) => !o.dead); if (!live.length) return;
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, sx = 0, sy = 0;
  for (const o of live) { x0 = Math.min(x0, o.x); x1 = Math.max(x1, o.x); y0 = Math.min(y0, o.y); y1 = Math.max(y1, o.y); sx += o.x; sy += o.y; }
  const cx = sx / live.length, cy = sy / live.length, spanX = x1 - x0 + 700, spanY = y1 - y0 + 700;
  cam.tz = Math.max(Math.min(VW / C.W * 1.02, VH / C.H), Math.min(VW / 1000, VH / 1200, VW / spanX, VH / spanY));
  const dir = M.side ? -1 : 1; cam.tx = cx + dir * 0.12 * VW / cam.tz; cam.ty = cy;
}
function clampCam() {
  const hw = VW / cam.z / 2, hh = VH / cam.z / 2;
  cam.x = Math.max(Math.min(hw - 200, C.W / 2), Math.min(Math.max(C.W - hw + 200, C.W / 2), cam.x));
  cam.y = Math.min(C.H - hh + 60, Math.max(hh - 300, cam.y));
}
const sx = (x) => (x - cam.x) * cam.z + VW / 2, sy = (y) => (y - cam.y) * cam.z + VH / 2;

// ---------- 입력 ----------
let drag = null;
cv.addEventListener('pointerdown', (e) => { if (state !== 'aim') return; drag = { x: e.clientX, y: e.clientY }; aim = { ...lastAim }; cv.setPointerCapture(e.pointerId); updAim(e); });
cv.addEventListener('pointermove', (e) => { if (drag) updAim(e); });
cv.addEventListener('pointerup', () => { if (!drag) return; drag = null; if (aim && aim.power > 0.08) shoot(0, aim.angle, aim.power); });
cv.addEventListener('pointercancel', () => { drag = null; });
function updAim(e) {
  const dx = drag.x - e.clientX, dy = e.clientY - drag.y, len = Math.hypot(dx, dy);
  if (len < 8) { aim = { ...lastAim, power: aim ? aim.power : lastAim.power }; return; }
  // 뒤로 당긴 반대 방향으로 날아간다 (새총)
  let ang = Math.atan2(dy, Math.max(1, dx)) * 180 / Math.PI;
  aim = { angle: Math.max(8, Math.min(85, ang)), power: Math.min(1, len / (Math.min(VW, VH) * 0.42)) };
  hud();
}
function shoot(side, angle, power) {
  if (side === 0) lastAim = { angle, power };
  C.fire(M, side, angle, power); state = 'fly'; aim = null; landT = 0; shake = Math.max(shake, 0.2);
  hud();
}

// ---------- 진행 ----------
function update(dt) {
  if (banner && (banner.d -= dt) <= 0) banner = null;
  shake = Math.max(0, shake - dt); flashT = Math.max(0, flashT - dt);
  if (!M) return;
  C.step(M, dt);
  for (const ev of M.events) onEvent(ev); M.events.length = 0;
  if (state === 'fly') {
    followSwarm();
    for (const o of M.missiles) if (!o.dead && R() < 0.5 + 60 / Math.max(60, M.missiles.length)) smoke.push({ x: o.x, y: o.y, r: 6 + R() * 6, t: 0, life: 0.9 + R() * 0.6, fire: true });
    if (!M.flying) { state = 'land'; landT = 1.3; focusBase(M.side ? 0 : 1); }
  } else if (state === 'land') {
    if ((landT -= dt) <= 0) {
      if (M.over === 0) return win();
      if (M.over === 1) return lose();
      if (M.side === 0) { state = 'enemy'; enemyT = 1.4; focusBase(1); showBanner(L('적의 차례', "Enemy's turn"), 1.4, '#ff8a7a'); }
      else { state = 'aim'; focusAim(); showBanner(L('내 차례!', 'Your turn!'), 1.2); }
    }
  } else if (state === 'enemy') {
    if ((enemyT -= dt) <= 0) { const s = C.aiShot(M); shoot(1, s.angle, s.power); }
  }
  // 카메라
  const k = 1 - Math.exp(-dt * (state === 'fly' ? 4 : 2.6));
  cam.x += (cam.tx - cam.x) * k; cam.y += (cam.ty - cam.y) * k; cam.z += (cam.tz - cam.z) * k; clampCam();
  // 파티클
  for (const p of smoke) p.t += dt; for (let i = smoke.length - 1; i >= 0; i--) if (smoke[i].t > smoke[i].life) smoke.splice(i, 1);
  if (smoke.length > 1600) smoke.splice(0, smoke.length - 1600);
  for (const p of parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g ?? 500) * dt; }
  for (let i = parts.length - 1; i >= 0; i--) if (parts[i].t > parts[i].life) parts.splice(i, 1);
  for (const n of nums) { n.t += dt; n.y -= 60 * dt; } for (let i = nums.length - 1; i >= 0; i--) if (nums[i].t > 1.3) nums.splice(i, 1);
  hud();
}
let hitAcc = [0, 0], hitAt = [null, null];
function onEvent(ev) {
  if (ev.type === 'launch') { for (let i = 0; i < 16; i++) parts.push({ x: ev.x, y: ev.y, vx: (R() - 0.5) * 260, vy: -R() * 200, t: 0, life: 0.6, col: '#ffd27a', r: 3, g: 200 }); }
  else if (ev.type === 'gate') {
    const g = M.st.gates[ev.g]; g.flash = 0.5;
    if (R() < 0.35 || M.missiles.length < 40) for (let i = 0; i < 4; i++) parts.push({ x: ev.x, y: ev.y, vx: (R() - 0.5) * 300, vy: (R() - 0.5) * 300, t: 0, life: 0.4, col: gateCol(g).hi, r: 3, g: 0 });
  } else if (ev.type === 'boom') {
    if (R() < Math.min(1, 50 / Math.max(1, M.missiles.length)) + 0.15) { for (let i = 0; i < 6; i++) parts.push({ x: ev.x, y: ev.y - 4, vx: (R() - 0.5) * 260, vy: -R() * 300, t: 0, life: 0.6, col: R() < 0.5 ? '#ffb040' : '#7a5a3a', r: 3 + R() * 3 }); smoke.push({ x: ev.x, y: ev.y - 10, r: 22, t: 0, life: 1, boom: true }); }
  } else if (ev.type === 'hit') {
    hitAcc[ev.side] += ev.dmg; hitAt[ev.side] = { x: ev.x, y: ev.y };
    flashT = 0.12; shake = Math.min(0.6, shake + 0.05);
    if (R() < Math.min(1, 30 / Math.max(1, M.missiles.length)) + 0.1) { smoke.push({ x: ev.x, y: ev.y, r: 30, t: 0, life: 0.8, boom: true }); for (let i = 0; i < 8; i++) parts.push({ x: ev.x, y: ev.y, vx: (R() - 0.5) * 420, vy: -R() * 420, t: 0, life: 0.7, col: R() < 0.5 ? '#ffe08a' : '#ff6a2a', r: 3 + R() * 3 }); }
  } else if (ev.type === 'land') {
    const s = ev.side ? 0 : 1, d = Math.round(hitAcc[s]);
    if (d > 0) { const b = M.st.bases[s]; nums.push({ x: b.x + C.BASE_W / 2, y: M.st.floor - C.BASE_H - 60, t: 0, txt: `-${d}`, col: s ? '#ffd34a' : '#ff6a5a', big: true }); }
    else nums.push({ x: hitAt[s] ? hitAt[s].x : M.st.bases[s].x, y: M.st.floor - C.BASE_H - 60, t: 0, txt: L('빗나감', 'Miss'), col: '#fff' });
    hitAcc = [0, 0]; hitAt = [null, null];
  }
}
function win() {
  state = 'over'; const n = M.st.n; save.stage = n + 1; save.best = Math.max(save.best, n + 1); store();
  $('ovTitle').textContent = L('승리!', 'Victory!'); $('ovText').textContent = L(`스테이지 ${n} 클리어 · ${M.shot}발 사용`, `Stage ${n} cleared in ${M.shot} shots`);
  $('ovBtn').textContent = L(`스테이지 ${n + 1} 도전`, `Play stage ${n + 1}`); $('ovBtn').onclick = () => { $('ov').hidden = true; startStage(n + 1); };
  $('ov').className = 'ov win'; $('ov').hidden = false;
  if (window.MGH && MGH.submitScore) try { MGH.submitScore('missile-battle', n, { stage: n }); } catch (e) {}
}
function lose() {
  state = 'over'; const n = M.st.n;
  $('ovTitle').textContent = L('기지가 무너졌어요', 'Your base fell'); $('ovText').textContent = L(`스테이지 ${n} · 적 기지 체력 ${Math.ceil(M.st.bases[1].hp)} 남음`, `Stage ${n} · enemy had ${Math.ceil(M.st.bases[1].hp)} HP left`);
  $('ovBtn').textContent = L('다시 도전', 'Try again'); $('ovBtn').onclick = () => { $('ov').hidden = true; startStage(n); };
  $('ov').className = 'ov lose'; $('ov').hidden = false;
}

// ---------- HUD ----------
function hud() {
  if (!M) return; const [a, b] = M.st.bases;
  $('hpMe').style.width = (a.hp / a.max * 100) + '%'; $('hpEn').style.width = (b.hp / b.max * 100) + '%';
  $('hpMeT').textContent = Math.ceil(a.hp); $('hpEnT').textContent = Math.ceil(b.hp);
  const live = state === 'fly' ? Math.round(M.total) : 0; $('count').hidden = !live; if (live) $('count').textContent = '🚀 ×' + live.toLocaleString();
  $('aimInfo').hidden = !(state === 'aim' && aim); if (aim) $('aimInfo').textContent = L(`각도 ${Math.round(aim.angle)}° · 힘 ${Math.round(aim.power * 100)}%`, `Angle ${Math.round(aim.angle)}° · Power ${Math.round(aim.power * 100)}%`);
  $('hint').hidden = state !== 'aim' || !!aim;
}

// ---------- 그리기 ----------
const SKY = [[0, '#2a3a6a'], [0.35, '#e8907a'], [0.62, '#f6c78a'], [1, '#f7dca8']];
function gateCol(g) { return g.op === '÷' ? { a: '#ff5a5a', b: '#a8202a', hi: '#ffd0d0' } : g.op === '+' ? { a: '#7dff8a', b: '#1f9a3a', hi: '#eaffd0' } : g.v >= 10 ? { a: '#ffd34a', b: '#d0700a', hi: '#fff3c0' } : { a: '#6fd8ff', b: '#2060d0', hi: '#d8f4ff' }; }
function drawSky() {
  const g = ctx.createLinearGradient(0, 0, 0, VH); for (const [s, c] of SKY) g.addColorStop(s, c); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  // 해
  const sunX = VW * 0.72 - (cam.x - C.W / 2) * cam.z * 0.05, sunY = VH * 0.42 - (cam.y - 900) * cam.z * 0.05;
  const sg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 160); sg.addColorStop(0, 'rgba(255,250,220,.95)'); sg.addColorStop(0.25, 'rgba(255,220,150,.6)'); sg.addColorStop(1, 'rgba(255,200,120,0)'); ctx.fillStyle = sg; ctx.fillRect(sunX - 160, sunY - 160, 320, 320);
  // 먼 산·풍차 (느리게 따라오는 겹)
  for (const [par, col, base, amp, seed] of [[0.25, 'rgba(180,90,90,.45)', 0.62, 70, 1], [0.45, 'rgba(150,60,70,.6)', 0.7, 50, 2]]) {
    ctx.fillStyle = col; ctx.beginPath(); const off = cam.x * cam.z * par, by = VH * base - (cam.y - 900) * cam.z * par;
    ctx.moveTo(0, VH); for (let x = 0; x <= VW + 20; x += 20) { const wx = (x + off) / 90; ctx.lineTo(x, by - amp * (0.5 + 0.5 * Math.sin(wx * 0.7 + seed) * Math.sin(wx * 0.23 + seed * 3))); } ctx.lineTo(VW, VH); ctx.fill();
    if (par > 0.3) for (let i = -1; i < 6; i++) { const wx = i * 360 - (off % 360) + 120, wy = by - 40; windmill(wx, wy, 0.8 + (i % 2) * 0.25, col); }
  }
  // 구름
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  for (let i = 0; i < 6; i++) { const x = ((i * 523 - cam.x * cam.z * 0.15 + performance.now() * 0.006) % (VW + 300) + VW + 300) % (VW + 300) - 150, y = 60 + (i * 97 % 220) - (cam.y - 900) * cam.z * 0.1; cloud(x, y, 0.7 + (i % 3) * 0.25); }
}
function cloud(x, y, s) { ctx.beginPath(); ctx.ellipse(x, y, 60 * s, 16 * s, 0, 0, 6.28); ctx.ellipse(x - 26 * s, y - 8 * s, 30 * s, 14 * s, 0, 0, 6.28); ctx.ellipse(x + 22 * s, y - 10 * s, 34 * s, 16 * s, 0, 0, 6.28); ctx.fill(); }
function windmill(x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.lineTo(5, -60); ctx.lineTo(-5, -60); ctx.fill();
  ctx.translate(0, -58); ctx.rotate(performance.now() * 0.0004 + x * 0.01); ctx.strokeStyle = col; ctx.lineWidth = 5; for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -44); ctx.stroke(); ctx.fillRect(-1, -44, 9, 30); } ctx.restore();
}
function drawGround() {
  const st = M.st, x0 = cam.x - VW / cam.z / 2 - 40, x1 = cam.x + VW / cam.z / 2 + 40;
  ctx.beginPath(); ctx.moveTo(sx(x0), VH + 10);
  for (let x = x0; x <= x1; x += 8 / cam.z) ctx.lineTo(sx(x), sy(C.groundY(st, x)));
  ctx.lineTo(sx(x1), VH + 10); ctx.closePath();
  const g = ctx.createLinearGradient(0, sy(st.floor - st.hill), 0, sy(st.floor + 200)); g.addColorStop(0, '#9b4a3c'); g.addColorStop(0.5, '#6e2f34'); g.addColorStop(1, '#3e1a28'); ctx.fillStyle = g; ctx.fill();
  // 윗면 풀
  ctx.beginPath(); for (let x = x0; x <= x1; x += 8 / cam.z) { const y = sy(C.groundY(st, x)); x === x0 ? ctx.moveTo(sx(x), y) : ctx.lineTo(sx(x), y); }
  ctx.strokeStyle = '#d0607a'; ctx.lineWidth = Math.max(3, 12 * cam.z); ctx.stroke(); ctx.strokeStyle = '#ff9aa8'; ctx.lineWidth = Math.max(1, 4 * cam.z); ctx.stroke();
  // 꽃
  for (let x = Math.ceil(x0 / 70) * 70; x < x1; x += 70) { const y = C.groundY(st, x), h = (x * 37) % 5; if (h > 2) continue; const px = sx(x), py = sy(y) - 4 * cam.z; ctx.fillStyle = ['#ffd34a', '#c08aff', '#ff7a9a'][h]; ctx.beginPath(); ctx.arc(px, py - 10 * cam.z, 6 * cam.z, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#4a8a3a'; ctx.lineWidth = 2 * cam.z; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - 8 * cam.z); ctx.stroke(); }
}
function drawGates() {
  for (const g of M.st.gates) {
    const gy = C.gateY(g, M.t), x = sx(g.x), y = sy(gy), w = g.w * cam.z, h = g.h * cam.z, c = gateCol(g), f = g.flash || 0; g.flash = Math.max(0, f - 1 / 60);
    if (x + w < -50 || x > VW + 50) continue;
    ctx.save(); ctx.globalAlpha = 0.82 + f * 0.36;
    const gr = ctx.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, c.b); gr.addColorStop(0.5, c.a); gr.addColorStop(1, c.b); ctx.fillStyle = gr;
    rrect(x, y, w, h, 8 * cam.z); ctx.fill(); ctx.lineWidth = Math.max(2, 5 * cam.z); ctx.strokeStyle = c.hi; ctx.stroke();
    // 흐르는 줄무늬
    ctx.globalAlpha = 0.25; ctx.fillStyle = '#fff'; const off = (M.t * 60 * cam.z) % (24 * cam.z);
    ctx.beginPath(); rrect(x, y, w, h, 8 * cam.z); ctx.clip(); for (let k = -1; k < h / (24 * cam.z) + 2; k++) ctx.fillRect(x, y + k * 24 * cam.z - off, w, 8 * cam.z); ctx.restore();
    if (f > 0) { ctx.save(); ctx.globalAlpha = f; ctx.shadowColor = c.a; ctx.shadowBlur = 30; ctx.strokeStyle = c.hi; ctx.lineWidth = 6 * cam.z; rrect(x, y, w, h, 8 * cam.z); ctx.stroke(); ctx.restore(); }
    // 글자
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(-Math.PI / 2 * 0); const fs = Math.max(13, 40 * cam.z);
    ctx.font = `900 ${fs}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = fs * 0.22; ctx.strokeStyle = 'rgba(0,0,0,.55)';
    const t = (g.op === 'x' ? '×' : g.op) + g.v; ctx.strokeText(t, 0, 0); ctx.fillStyle = '#fff'; ctx.fillText(t, 0, 0); ctx.restore();
  }
}
function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function drawBase(b) {
  const st = M.st, z = cam.z, X = sx(b.x), Y = sy(st.floor), Wd = C.BASE_W * z, Hd = C.BASE_H * z, roof = b.side ? '#d8403a' : '#3a78d8', roof2 = b.side ? '#a02828' : '#2450a0', dmg = 1 - b.hp / b.max;
  if (X > VW + 50 || X + Wd < -50) return;
  // 무한궤도 받침
  ctx.fillStyle = '#5a3a2a'; rrect(X - 6 * z, Y - 34 * z, Wd + 12 * z, 30 * z, 8 * z); ctx.fill();
  ctx.fillStyle = '#2a2020'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(X + (30 + k * 57) * z, Y - 8 * z, 14 * z, 0, 6.28); ctx.fill(); ctx.fillStyle = '#7a6a60'; ctx.beginPath(); ctx.arc(X + (30 + k * 57) * z, Y - 8 * z, 6 * z, 0, 6.28); ctx.fill(); ctx.fillStyle = '#2a2020'; }
  // 성벽·탑
  const stone = (x, y, w, h) => { const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#d8d0c8'); g.addColorStop(1, '#a8a098'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.strokeStyle = 'rgba(80,70,70,.35)'; ctx.lineWidth = Math.max(1, 2 * z); for (let yy = y + 16 * z; yy < y + h; yy += 16 * z) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke(); } };
  const tower = (cx, w, h) => { stone(cx - w / 2, Y - 34 * z - h, w, h); ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(cx - w / 2 - 6 * z, Y - 34 * z - h); ctx.lineTo(cx, Y - 34 * z - h - w * 0.9); ctx.lineTo(cx + w / 2 + 6 * z, Y - 34 * z - h); ctx.fill(); ctx.fillStyle = roof2; ctx.beginPath(); ctx.moveTo(cx, Y - 34 * z - h - w * 0.9); ctx.lineTo(cx + w / 2 + 6 * z, Y - 34 * z - h); ctx.lineTo(cx + 4 * z, Y - 34 * z - h); ctx.fill(); ctx.fillStyle = '#3a2a2a'; ctx.beginPath(); ctx.arc(cx, Y - 34 * z - h * 0.6, w * 0.16, Math.PI, 0); ctx.fill(); ctx.fillRect(cx - w * 0.16, Y - 34 * z - h * 0.6, w * 0.32, w * 0.24); };
  stone(X + 20 * z, Y - 34 * z - 90 * z, Wd - 40 * z, 90 * z);
  ctx.fillStyle = '#c8c0b8'; for (let k = 0; k < 7; k++) ctx.fillRect(X + (24 + k * 28) * z, Y - 34 * z - 104 * z, 16 * z, 14 * z);
  tower(X + 38 * z, 56 * z, 136 * z * (1 - dmg * 0.35)); tower(X + Wd - 38 * z, 56 * z, 136 * z * (1 - dmg * 0.5)); tower(X + Wd / 2, 70 * z, 110 * z * (1 - dmg * 0.25));
  // 깃발
  const fx = X + Wd / 2, fy = Y - 34 * z - 110 * z - 70 * z * 0.9; ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 3 * z; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - 46 * z); ctx.stroke();
  ctx.fillStyle = roof; ctx.beginPath(); const wv = Math.sin(performance.now() * 0.006) * 5 * z; ctx.moveTo(fx, fy - 46 * z); ctx.lineTo(fx + (b.side ? -34 : 34) * z, fy - 38 * z + wv); ctx.lineTo(fx, fy - 28 * z); ctx.fill();
  // 금·불 (부서질수록)
  if (dmg > 0.15) { ctx.strokeStyle = 'rgba(40,20,20,.7)'; ctx.lineWidth = 3 * z; for (let k = 0; k < Math.floor(dmg * 8); k++) { const cx = X + ((k * 53) % 190 + 20) * z, cy = Y - (60 + (k * 31) % 90) * z; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 10 * z, cy + 14 * z); ctx.lineTo(cx + 4 * z, cy + 26 * z); ctx.stroke(); } }
  if (dmg > 0.45 && R() < dmg) smoke.push({ x: b.x + 30 + R() * (C.BASE_W - 60), y: st.floor - 120 - R() * 60, r: 10 + R() * 10, t: 0, life: 1.2, fire: R() < 0.5, rise: true });
  // 발사대
  if ((state === 'aim' && b.side === 0) || state === 'enemy') { const p = C.launchPoint(st, b.side); ctx.fillStyle = '#4a4a5a'; ctx.beginPath(); ctx.arc(sx(p.x), sy(p.y + 18), 16 * z, 0, 6.28); ctx.fill(); }
}
function rocket(x, y, ang, s, side) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  ctx.fillStyle = '#e8e8ee'; ctx.beginPath(); ctx.moveTo(-14, -4); ctx.lineTo(8, -4); ctx.quadraticCurveTo(16, 0, 8, 4); ctx.lineTo(-14, 4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = side ? '#e23a3a' : '#3a8ae2'; ctx.beginPath(); ctx.moveTo(6, -4); ctx.quadraticCurveTo(16, 0, 6, 4); ctx.fill(); ctx.fillRect(-16, -6, 6, 12);
  ctx.restore();
}
function draw() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawSky();
  if (!M) return;
  ctx.save(); if (shake > 0) ctx.translate((R() - 0.5) * 14 * shake, (R() - 0.5) * 14 * shake);
  // 연기 꼬리 (뒤에)
  for (const p of smoke) { const k = p.t / p.life, x = sx(p.x), y = sy(p.y - (p.rise ? p.t * 60 : 0)), r = p.r * cam.z * (1 + k * (p.boom ? 2.5 : 1.4));
    if (p.fire && k < 0.25) { ctx.fillStyle = `rgba(255,${120 + 100 * (1 - k * 4)},40,${0.8 * (1 - k * 4)})`; } else ctx.fillStyle = `rgba(${p.boom ? 90 : 120},${p.boom ? 80 : 110},${p.boom ? 80 : 110},${0.35 * (1 - k)})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill(); }
  drawGates();
  drawGround();
  for (const b of M.st.bases) drawBase(b);
  // 조준선
  if (state === 'aim' && aim) {
    const p = C.launchPoint(M.st, 0), v = C.launchVel(0, aim.angle, aim.power); let x = p.x, y = p.y, vx = v.vx, vy = v.vy;
    for (let i = 0; i < 40; i++) { for (let j = 0; j < 2; j++) { vy += C.G / 60; x += vx / 60; y += vy / 60; } ctx.fillStyle = `rgba(255,255,255,${0.9 - i / 46})`; ctx.beginPath(); ctx.arc(sx(x), sy(y), Math.max(2, 6 * cam.z) * (1 - i / 60), 0, 6.28); ctx.fill(); }
    rocket(sx(p.x), sy(p.y), Math.atan2(v.vy, v.vx), Math.max(0.7, 2.2 * cam.z), 0);
  } else if (state === 'aim') { const p = C.launchPoint(M.st, 0), v = C.launchVel(0, lastAim.angle, lastAim.power); rocket(sx(p.x), sy(p.y), Math.atan2(v.vy, v.vx), Math.max(0.7, 2.2 * cam.z), 0); }
  // 미사일
  const ms = Math.max(0.55, 2 * cam.z);
  for (const o of M.missiles) if (!o.dead) rocket(sx(o.x), sy(o.y), Math.atan2(o.vy, o.vx), ms * (o.w > 1.5 ? Math.min(1.6, 1 + Math.log10(o.w) * 0.4) : 1), o.side);
  // 파편
  for (const p of parts) { ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(sx(p.x), sy(p.y), Math.max(1.5, p.r * cam.z * 1.6), 0, 6.28); ctx.fill(); } ctx.globalAlpha = 1;
  // 피해 숫자
  for (const n of nums) { const a = Math.min(1, (1.3 - n.t) * 2), fs = n.big ? 44 : 26; ctx.globalAlpha = a; ctx.font = `italic 900 ${fs}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 7; ctx.strokeStyle = '#3a0a00'; ctx.strokeText(n.txt, sx(n.x), sy(n.y)); ctx.fillStyle = n.col; ctx.fillText(n.txt, sx(n.x), sy(n.y)); } ctx.globalAlpha = 1;
  ctx.restore();
  if (flashT > 0) { ctx.fillStyle = `rgba(255,230,180,${flashT * 1.6})`; ctx.fillRect(0, 0, VW, VH); }
  if (banner) { const a = Math.min(1, banner.d * 2, (banner.max - banner.d) * 4); ctx.globalAlpha = a; ctx.font = '900 22px system-ui, sans-serif'; const bw = ctx.measureText(banner.t).width; if (bw > VW - 30) ctx.font = `900 ${Math.floor(22 * (VW - 30) / bw)}px system-ui, sans-serif`; ctx.textAlign = 'center'; const y = VH * 0.28; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(40,10,10,.85)'; ctx.strokeText(banner.t, VW / 2, y); ctx.fillStyle = banner.col || '#fff'; ctx.fillText(banner.t, VW / 2, y); ctx.globalAlpha = 1; }
}

// ---------- 시작 ----------
$('startBtn').onclick = () => { $('title').hidden = true; startStage(save.stage); };
$('startInfo').textContent = save.stage > 1 ? L(`스테이지 ${save.stage}부터 이어서`, `Continue from stage ${save.stage}`) : L('스테이지 1부터', 'From stage 1');
if (save.stage > 1) { $('resetBtn').hidden = false; $('resetBtn').onclick = () => { save.stage = 1; store(); $('title').hidden = true; startStage(1); }; }
let last = performance.now();
function loop(now) { requestAnimationFrame(loop); const dt = Math.min(0.033, (now - last) / 1000); last = now; if (!MANUAL) update(dt); draw(); }
requestAnimationFrame(loop);
// 처음 화면용 배경
M = C.newMatch(save.stage); focusAim(true); hud();
if (TEST) window.__mb = { get M() { return M; }, get state() { return state; }, start: (n) => { $('title').hidden = true; startStage(n || 1); }, aim: (a, p) => { aim = { angle: a, power: p }; }, fire: (a, p) => shoot(0, a, p), step: (n, dt = 1 / 60) => { for (let i = 0; i < n; i++) update(dt); draw(); }, C };
