// 윈드 러너 2D — 옆에서 보는 화면 (규칙·강화·저장은 3D와 같음, 같은 저장을 씀)
import * as C from './core.js';

const $ = (i) => document.getElementById(i);
const Q = new URLSearchParams(location.search), TEST = Q.has('test'), MANUAL = Q.has('manual');
const fmt = (v) => Math.floor(v).toLocaleString('ko-KR');
const KEY = 'mgh:glide';

// ---------- 저장 ----------
let st = loadLocal() || C.newSave();
function loadLocal() { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); return s && s.v === 1 ? s : null; } catch (e) { return null; } }
function save() { if (TEST && !Q.has('save')) return; try { st.at = Date.now(); localStorage.setItem(KEY, JSON.stringify(st)); cloudStore(); } catch (e) { } }
const MG = window.MGH || null; let owner = null, cloudAt = null, cloudLast = 0;
function cloudStore(now) { if (!owner || (!now && Date.now() - cloudLast < 20000)) return; cloudLast = Date.now(); MG.save.store({ ...st, owner }, cloudAt || undefined).then((r) => { if (r && r.conflict) { cloudAt = r.updatedAt; return MG.save.store({ ...st, owner }, cloudAt); } return r; }).then((r) => { if (r && r.updatedAt) cloudAt = r.updatedAt; }).catch(() => { }); }
if (MG && MG.save && MG.embedded) MG.save.onAuth(async (u) => { owner = u ? u.id : null; if (!u) return; try { const r = await MG.save.load(); cloudAt = (r && r.updatedAt) || null; const d = r && r.data; if (d && d.v === 1 && d.owner === owner && (d.total || 0) > (st.total || 0)) { st = d; titleInfo(); toast('☁️ 계정 기록을 불러왔어요'); } else cloudStore(true); } catch (e) { } });

// ---------- 광고 (보상형) — 궁수 키우기와 같은 AdMob 브리지 ----------
const AD_UNIT_REWARD = 'ca-app-pub-9826307769121956/8305405897';
const AD = (function () {
  const cap = (function () { try { if (window.Capacitor) return window.Capacitor; } catch (e) { } try { if (window.parent && window.parent !== window) return window.parent.Capacitor; } catch (e) { } return undefined; })();
  const native = !!(cap && cap.isNativePlatform && cap.isNativePlatform()), fake = !native && Q.has('testads');
  const AM = native && ((cap.Plugins && cap.Plugins.AdMob) || (cap.registerPlugin && cap.registerPlugin('AdMob')));
  let ready = fake, loading = false, rewarded = false, pending = null;
  const settle = (ok) => { if (pending) { const r = pending; pending = null; r(ok); } };
  async function load() { if (!AM || loading || ready) return; loading = true; try { await AM.prepareRewardVideoAd({ adId: AD_UNIT_REWARD }); ready = true; } catch (e) { ready = false; } loading = false; }
  (async () => { if (!AM) return; try { AM.addListener('onRewardedVideoAdReward', () => { rewarded = true; }); AM.addListener('onRewardedVideoAdDismissed', () => { ready = false; settle(rewarded); setTimeout(load, 500); }); AM.addListener('onRewardedVideoAdFailedToShow', () => { ready = false; settle(false); setTimeout(load, 3000); }); await AM.initialize({}); } catch (e) { } load(); })();
  return { enabled: native || fake, show() { return new Promise((res) => { if (fake) { setTimeout(() => res(true), 400); return; } if (!AM || !ready) { res(false); return; } rewarded = false; pending = res; AM.showRewardVideoAd().catch(() => settle(false)); setTimeout(() => settle(false), 120000); }); } };
})();
async function showAd(btn, ok) { if (btn) { btn.disabled = true; btn.textContent = '광고 불러오는 중…'; } const r = await AD.show(); if (r) ok(); else { toast('광고를 끝까지 보지 않았거나 불러오지 못했어요'); if (btn) btn.disabled = false; } }

let toastT = 0; function toast(m) { const t = $('toast'); t.textContent = m; t.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => t.style.opacity = 0, 2200); }

// ---------- 2D 화면 ----------
const cv = $('c'), ctx = cv.getContext('2d'); let W = 0, H = 0, DPR = 1;
function resize() { DPR = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
addEventListener('resize', resize); resize();
const img = (s) => { const i = new Image(); i.src = s; return i; };
const SIDE = C.GLIDERS.map((_, i) => img(`assets/s${i}.webp`));
const SKY = [img('assets/sky0.webp'), img('assets/sky1.webp'), img('assets/sky2.webp')];
const RING = img('assets/ring.webp'), RAMP = img('assets/ramp.webp');
const ok = (i) => i.complete && i.naturalWidth > 0;
// 지역별 색 (땅 · 바위 · 먼 산 · 하늘 위/아래)
const PAL = [
  { g: ['#d9824c', '#c0623a', '#8e3d24'], edge: '#f2b27a', far: '#c9784e', sky: ['#1478e6', '#ffc89a'], dot: '#7c3a1e' },
  { g: ['#ffffff', '#dfeaf5', '#b9cbe0'], edge: '#ffffff', far: '#9fb3cc', sky: ['#2f8be8', '#dceeff'], dot: '#8aa0b8' },
  { g: ['#8a8474', '#6f6a5e', '#57534a'], edge: '#7ec25a', far: '#5d8f7a', sky: ['#2a8fe6', '#ffe0b0'], dot: '#e8fbff', water: true },
];
let f = null, state = 'title', hold = false, rocketHold = false, revived = false, launchT = 0, trail = [], camY = 200, scale = 2, curReg = 0;
const keys = {};
addEventListener('keydown', (e) => { if (e.code === 'Space') rocketHold = true; if (e.code === 'ArrowUp' || e.code === 'KeyW') hold = true; });
addEventListener('keyup', (e) => { if (e.code === 'Space') rocketHold = false; if (e.code === 'ArrowUp' || e.code === 'KeyW') hold = false; });
cv.addEventListener('pointerdown', (e) => { if (state === 'fly' || state === 'launch') hold = true; });
addEventListener('pointerup', () => hold = false); addEventListener('pointercancel', () => hold = false);
$('hint').innerHTML = '👆 누르고 있으면 기수를 올려요 · 떼면 활강<br>⭕ 링을 통과하면 다시 솟아올라요!';
const RAMP_D = -70;
// 구름 (앞쪽 시차) · 먼 산 실루엣
const clouds = Array.from({ length: 9 }, (_, i) => ({ x: Math.random() * 2000, y: 40 + Math.random() * 260, s: .6 + Math.random() * .9, p: 1.2 + Math.random() * .5 }));
function farHill(x) { return 40 + 26 * Math.sin(x * .004) + 18 * Math.sin(x * .011 + 2) + 10 * Math.sin(x * .027); }


const rb = $('rocket');
rb.addEventListener('pointerdown', (e) => { e.stopPropagation(); rocketHold = true; rb.setPointerCapture(e.pointerId); });
rb.addEventListener('pointerup', () => rocketHold = false); rb.addEventListener('pointercancel', () => rocketHold = false);

// ---------- 화면 전환 ----------
const show = (id) => { for (const s of document.querySelectorAll('.scr')) s.classList.toggle('on', s.id === id); };
function titleInfo() { $('tCoins').textContent = `🪙 ${fmt(st.coins)} · 최고 ${fmt(st.best)}m`; $('bFlyAd').hidden = !AD.enabled || !(st.lv.rocket > 0) && st.flights < 1; }
function hudVisible(v) { for (const id of ['prog', 'hint']) $(id).style.visibility = v ? '' : 'hidden'; document.querySelector('.hud').style.visibility = v ? '' : 'hidden'; document.querySelector('.bar').style.visibility = v ? '' : 'hidden'; }
function start(adFuel) {
  C.terrainSeed(Math.floor(Math.random() * 1e6));
  f = C.newFlight(st, { adFuel, flat: true }); revived = false;
  state = 'launch'; launchT = 0; curReg = 0; hold = false; rocketHold = false; trail = []; camY = f.st.startY;
  show(''); hudVisible(true); $('hint').style.opacity = 1; rb.hidden = !(f.fuelMax > 0); buildProg();
}
function buildProg() { const p = $('prog'); p.querySelectorAll('b,em').forEach((x) => x.remove()); for (const r of C.REGIONS.slice(1)) { const b = document.createElement('b'), em = document.createElement('em'); const x = r.from / C.GOAL * 100; b.style.left = x + '%'; em.style.left = Math.min(94, x) + '%'; em.textContent = ['', '🏔', '🌊', '🏝'][C.REGIONS.indexOf(r)]; p.append(b, em); } if (st.best > 0) { const b = document.createElement('b'); b.style.left = Math.min(100, st.best / C.GOAL * 100) + '%'; b.style.background = '#ff5a3c'; b.title = '최고 기록'; p.append(b); } }
$('bFly').onclick = () => start(false);
$('bFlyAd').onclick = (e) => showAd(e.currentTarget, () => { e.currentTarget.disabled = false; e.currentTarget.textContent = '📺 로켓 연료 +3초 달고 날기'; start(true); });
$('bHangar').onclick = () => openHangar('up');
$('hBack').onclick = () => { show('sTitle'); titleInfo(); };
$('hFly').onclick = () => start(false);

function landed() {
  state = 'land'; hold = false; rocketHold = false;
  if (f.crashed && AD.enabled && !revived) { setTimeout(() => { show('sRevive'); $('bRevive').disabled = false; $('bRevive').textContent = '📺 한 번 더 띄우기'; }, 700); return; }
  setTimeout(result, 900);
}
$('bRevive').onclick = (e) => showAd(e.currentTarget, () => { revived = true; C.revive(f); state = 'fly'; show(''); });
$('bNoRevive').onclick = () => result();
function result() {
  const p = C.payout(f, st.best), goal = !!f.goal;
  const rows = [['비행 거리', `${fmt(p.dist)} m`, p.dist], ['⭕ 링 ' + f.got + '개', `🪙 ${fmt(p.ringC)}`], ['🪙 하늘 코인 ' + f.picked + '개', `🪙 ${fmt(p.coinC)}`]];
  $('resCard').innerHTML = `<h2>${goal ? '🏝 하늘 섬 도착!' : '착지!'}</h2><div class="big">${fmt(p.dist)} m</div>${p.record ? '<div class="rec">🎉 최고 기록! 코인 +20%</div>' : `<div style="font-size:13px">최고 기록 ${fmt(st.best)} m</div>`}
    <table>${rows.map((r) => `<tr><td>${r[0]}</td><td>${r[0] === '비행 거리' ? '🪙 ' + fmt(r[2]) : r[1]}</td></tr>`).join('')}<tr><td><b>합계</b></td><td>🪙 ${fmt(p.total)}</td></tr></table>
    <div class="row"><button class="btn" id="rTake">🪙 ${fmt(p.total)} 받기</button>${AD.enabled ? `<button class="btn ad" id="rAd">📺 광고 보고 2배 (🪙 ${fmt(p.total * 2)})</button>` : ''}</div>`;
  show('sResult');
  const take = (m) => { st.coins += p.total * m; st.total += p.total * m; st.best = Math.max(st.best, p.dist); st.flights++; if (goal && !st.goal) { st.goal = true; } st.tut = 1; save(); show('sTitle'); titleInfo(); if (goal) toast('🏝 하늘 섬에 도착했어요! 최고 기록에 도전해 보세요'); };
  $('rTake').onclick = () => take(1);
  if ($('rAd')) $('rAd').onclick = (e) => showAd(e.currentTarget, () => take(2));
}
// 격납고
let hTab = 'up';
for (const b of document.querySelectorAll('.tabs button')) b.onclick = () => openHangar(b.dataset.t);
function openHangar(t) {
  hTab = t; show('sHangar'); for (const b of document.querySelectorAll('.tabs button')) b.classList.toggle('on', b.dataset.t === t);
  $('hCoins').textContent = `🪙 ${fmt(st.coins)}`; const L = $('hList'); L.innerHTML = '';
  if (t === 'up') C.UPS.forEach((u, k) => {
    const lv = st.lv[u.id] || 0, max = lv >= u.max, cost = C.upCost(st, k);
    const el = document.createElement('div'); el.className = 'item';
    el.innerHTML = `<div class="ic">${['🪽', '🛝', '⭕', '🎯', '🚀', '🛡️'][k]}</div><div class="tx"><b>${u.name} <span class="lvdots">Lv ${lv}/${u.max}</span></b><small>${u.desc(lv)}${max ? '' : ` → <b style="display:inline;font-size:12px">${u.desc(lv + 1)}</b>`}</small></div><button ${max || st.coins < cost ? 'disabled' : ''}>${max ? 'MAX' : '🪙 ' + fmt(cost)}</button>`;
    el.querySelector('button').onclick = () => { if (max || st.coins < cost) return; st.coins -= cost; st.lv[u.id] = lv + 1; save(); openHangar('up'); };
    L.append(el);
  });
  else C.GLIDERS.forEach((g, i) => {
    const own = st.owned.includes(g.id), sel = st.glider === g.id;
    const el = document.createElement('div'); el.className = 'item gl' + (sel ? ' sel' : '');
    el.innerHTML = `<div class="ic"><img src="assets/s${i}.webp" alt=""></div><div class="tx"><b>${g.name}</b><small>활공력 +${Math.round((1 / g.drag - 1) * 100)}% · ${g.desc}</small></div><button class="${own ? 'own' : ''}" ${!own && st.coins < g.price ? 'disabled' : ''}>${sel ? '타는 중' : own ? '타기' : '🪙 ' + fmt(g.price)}</button>`;
    el.querySelector('button').onclick = () => { if (sel) return; if (!own) { if (st.coins < g.price) return; st.coins -= g.price; st.owned.push(g.id); toast(`🪂 ${g.name} 구매!`); } st.glider = g.id; save(); openHangar('gl'); };
    L.append(el);
  });
}


// ---------- 루프 ----------
let last = performance.now(), T = 0, bannerT = 0, lastGot = 0;
function loop(now) { requestAnimationFrame(loop); const dt = Math.min(.05, (now - last) / 1000); last = now; if (!MANUAL) tick(dt); }
function banner(t, s) { const b = $('banner'); b.innerHTML = `${t}<small>${s || ''}</small>`; b.style.opacity = 1; clearTimeout(bannerT); bannerT = setTimeout(() => b.style.opacity = 0, 2400); }
function pop(t) { const p = $('pop'); p.textContent = t; p.classList.remove('go'); void p.offsetWidth; p.classList.add('go'); }
function tick(dt, noRender) {
  T += dt;
  if (f && state === 'launch') { launchT += dt; f.d = RAMP_D + Math.min(1, launchT / 1.4) ** 2 * -RAMP_D; f.y = f.st.startY - 9 + (f.d - RAMP_D) / -RAMP_D * 9; if (launchT >= 1.4) { f.d = 0; f.y = f.st.startY; state = 'fly'; lastGot = 0; } }
  else if (f && state === 'fly') {
    C.step(f, { pitch: hold ? 0.34 : -0.14, turn: 0, rocket: rocketHold }, dt * C.PACE);
    if (f.t > (st.tut ? 4 : 9)) $('hint').style.opacity = 0;
    if (f.got > lastGot) { pop('⭕ 링 통과! 상승!'); lastGot = f.got; }
    if (f.bounces && f.bounces > (f._b || 0)) { f._b = f.bounces; pop('🛡️ 튕겨 올랐다!'); }
    if (f.bumps && f.bumps > (f._m || 0)) { f._m = f.bumps; pop('💥 바위에 부딪혀 속도 감소!'); }
    const reg = Math.min(2, C.regionAt(f.d)); if (reg !== curReg) { curReg = reg; banner(C.REGIONS[reg].name, `${fmt(C.REGIONS[reg].from)} m 돌파!`); }
    if (f.over) landed();
    trail.push({ d: f.d, y: f.y, b: f.boostT > 0 || f.liftT > 0 || f.rocketOn }); if (trail.length > 36) trail.shift();
  }
  if (f) {
    $('dist').textContent = `${fmt(Math.max(0, f.d))} m`; $('alt').textContent = Math.max(0, Math.round(f.y - C.ground(Math.max(0, f.d), 0, true))); $('rings').textContent = f.got; $('cn').textContent = f.picked;
    $('spd').textContent = `${Math.round(f.v * 3.6 * C.PACE)} km/h`; $('vbar').style.width = Math.min(100, f.v / C.VMAX * 100) + '%'; $('vb').className = 'b' + (f.boostT > 0 || f.rocketOn ? ' boost' : '');
    $('stall').style.opacity = f.stall > .2 ? 1 : 0; const pr = Math.max(0, Math.min(1, f.d / C.GOAL)); $('progI').style.width = pr * 100 + '%'; $('progMe').style.left = pr * 100 + '%';
    rb.style.setProperty('--f', (f.fuelMax ? f.fuel / f.fuelMax * 100 : 0) + '%'); rb.classList.toggle('on', !!(f.rocketOn && state === 'fly')); rb.classList.toggle('empty', f.fuel <= 0);
  }
  if (!noRender) draw(dt);
}
function draw(dt) {
  const fd = f ? f.d : RAMP_D, fy = f ? f.y : (st.lv.ramp || 0) * 20 + 191, v = f ? f.v : 0;
  // 높을수록 멀리, 빠를수록 살짝 멀리 → 속도감
  const want = Math.max(1.5, Math.min(3.6, (H * 0.5) / (fy + 35))) * (1 - Math.min(.28, Math.max(0, v - 28) / 160));
  scale += (want - scale) * Math.min(1, dt * 1.5); camY += (fy - camY) * Math.min(1, dt * 4);
  const px = W * 0.3, py = H * 0.46, sx = (d) => px + (d - fd) * scale, sy = (y) => py - (y - camY) * scale;
  const reg = Math.min(2, C.regionAt(Math.max(0, fd))), P = PAL[reg];
  // 하늘 그림 (느린 시차) — 지역 경계에서 겹쳐 바뀜
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, P.sky[0]); g.addColorStop(1, P.sky[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const drawSky = (im, alpha) => { if (!ok(im) || alpha <= 0) return; const bh = H, bw = bh * im.naturalWidth / im.naturalHeight, off = -((fd * 0.12) % bw + bw) % bw, by = Math.min(0, sy(0) - bh * 0.88); ctx.globalAlpha = alpha; for (let x = off; x < W; x += bw) ctx.drawImage(im, x, by, bw + 1, bh); ctx.globalAlpha = 1; };
  const nb = C.REGIONS[reg + 1] ? C.REGIONS[reg + 1].from : 1e9, mix = reg < 2 ? Math.max(0, Math.min(1, (fd - (nb - 250)) / 250)) : 0;
  drawSky(SKY[reg], 1); if (mix > 0) drawSky(SKY[reg + 1], mix);
  ctx.fillStyle = 'rgba(220,235,255,.18)'; ctx.fillRect(0, 0, W, H);
  // 먼 언덕 (중간 시차)
  ctx.fillStyle = P.far; ctx.globalAlpha = .55; ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W + 8; x += 8) { const wx = fd * 0.45 + x / scale; ctx.lineTo(x, sy(0) - farHill(wx) * scale * 0.55 - 6); }
  ctx.lineTo(W, H); ctx.fill(); ctx.globalAlpha = 1;
  // 절벽 + 점프대
  const CT = (f ? f.st.startY : fy + 9) - 24;
  if (sx(0) > -40) {
    ctx.fillStyle = '#a8492a'; ctx.beginPath(); ctx.moveTo(sx(RAMP_D - 600), H); ctx.lineTo(sx(RAMP_D - 600), sy(CT)); ctx.lineTo(sx(-14), sy(CT)); ctx.lineTo(sx(4), H); ctx.fill();
    ctx.fillStyle = '#5f9a3a'; ctx.fillRect(sx(RAMP_D - 600), sy(CT) - 4, sx(-14) - sx(RAMP_D - 600), 8);
    if (ok(RAMP)) { const rw = 93 * scale, rh = rw * RAMP.naturalHeight / RAMP.naturalWidth; ctx.drawImage(RAMP, sx(0) - rw * 0.85, sy(CT + 24) - rh * 0.25, rw, rh); }
  }
  // 땅 · 바위산 (지역 색)
  for (let r = 0; r < 3; r++) {
    const d0 = C.REGIONS[r].from, d1 = C.REGIONS[r + 1] ? C.REGIONS[r + 1].from : C.GOAL + 3000;
    const x0 = Math.max(-4, sx(Math.max(d0, -8))), x1 = Math.min(W + 4, sx(d1)); if (x1 <= x0) continue;
    const Pr = PAL[r]; ctx.beginPath(); ctx.moveTo(x0, H);
    for (let x = x0; x <= x1 + 4; x += 4) { const d = fd + (Math.min(x, x1) - px) / scale; ctx.lineTo(Math.min(x, x1), sy(C.ground(d, 0, true))); }
    ctx.lineTo(x1, H); ctx.closePath();
    const gg = ctx.createLinearGradient(0, sy(90), 0, sy(-20)); gg.addColorStop(0, Pr.g[0]); gg.addColorStop(.5, Pr.g[1]); gg.addColorStop(1, Pr.g[2]); ctx.fillStyle = gg; ctx.fill();
    ctx.strokeStyle = Pr.edge; ctx.lineWidth = 3; ctx.stroke();
    if (Pr.water) { const wy = sy(1.5), wg = ctx.createLinearGradient(0, wy, 0, H); wg.addColorStop(0, '#46c3e6'); wg.addColorStop(1, '#1a6d9e'); ctx.fillStyle = wg; ctx.fillRect(x0, wy, x1 - x0, H - wy); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(x0, wy - 1, x1 - x0, 3); }
    // 땅 위 점·물결 (지나가는 속도가 보이게)
    ctx.fillStyle = Pr.dot; ctx.globalAlpha = .45;
    for (let d = Math.ceil((fd - px / scale) / 14) * 14; d < fd + (W - px) / scale; d += 14) { if (d < d0 || d >= d1) continue; const h = C.ground(d, 0, true), k = (Math.sin(d * 12.9898) * 43758.5453) % 1; const x = sx(d), y = sy(h) + 6 + Math.abs(k) * 30; if (r === 2) ctx.fillRect(x, y, 10, 2); else ctx.fillRect(x, y, 4, 3); }
    ctx.globalAlpha = 1;
  }
  // 하늘 섬
  { const ix = sx(C.GOAL + 140), iy = sy(130); if (ix < W + 400) { ctx.fillStyle = '#8a7a66'; ctx.beginPath(); ctx.moveTo(ix - 160 * scale * .5, iy); ctx.lineTo(ix + 160 * scale * .5, iy); ctx.lineTo(ix, iy + 150 * scale * .5); ctx.fill(); ctx.fillStyle = '#6fbf4a'; ctx.fillRect(ix - 85 * scale * .5 * 2, iy - 10 * scale * .5, 170 * scale * .5 * 2, 12 * scale * .5); ctx.fillStyle = '#3f8a3a'; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(ix + i * 22 * scale * .5 * 2, iy - 10 * scale * .5); ctx.lineTo(ix + (i * 22 + 7) * scale, iy - 40 * scale * .5); ctx.lineTo(ix + (i * 22 + 14) * scale, iy - 10 * scale * .5); ctx.fill(); } } }
  if (f) {
    // 링
    for (const r of f.rings) {
      const x = sx(r.d), y = sy(r.y), Rr = f.rr * scale;
      if (x < -80) continue;
      if (x > W + 30) { const yy = Math.max(100, Math.min(H - 90, y)); ctx.fillStyle = 'rgba(255,220,90,.95)'; ctx.beginPath(); ctx.moveTo(W - 6, yy); ctx.lineTo(W - 22, yy - 10); ctx.lineTo(W - 22, yy + 10); ctx.fill(); ctx.font = '800 12px system-ui'; ctx.textAlign = 'right'; ctx.fillText(`⭕ ${Math.round(r.d - f.d)}m`, W - 26, yy + 4); continue; }
      ctx.save(); ctx.translate(x, y);
      if (r.hit) { r.ht = (r.ht || 0) + dt; ctx.globalAlpha = Math.max(0, 1 - r.ht * 2); ctx.scale(1 + r.ht * 3, 1 + r.ht * 3); }
      if (ok(RING)) ctx.drawImage(RING, -Rr * 0.45, -Rr * 1.1, Rr * 0.9, Rr * 2.2); else { ctx.strokeStyle = '#ffd34a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(0, 0, Rr * .4, Rr, 0, 0, 6.283); ctx.stroke(); }
      ctx.restore();
    }
    // 코인
    for (const c of f.coinRows) for (let i = 0; i < c.n; i++) {
      const p = C.coinPos(c, i), x = sx(p.d), y = sy(p.y); if (x < -20 || x > W + 20) continue;
      const got = c.got & (1 << i); if (got) continue;
      const w = Math.abs(Math.cos(T * 4 + i)) * 9 + 2; ctx.fillStyle = '#ffcf3a'; ctx.strokeStyle = '#a86a00'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, w, 11, 0, 0, 6.283); ctx.fill(); ctx.stroke();
    }
  }
  // 바람 자국
  if (trail.length > 2) { ctx.lineCap = 'round'; for (let k = 1; k < trail.length; k++) { const a = trail[k - 1], b = trail[k], q = k / trail.length; ctx.strokeStyle = b.b ? `rgba(255,225,110,${q})` : `rgba(130,220,255,${q * .8})`; ctx.lineWidth = 2 + q * 5; ctx.beginPath(); ctx.moveTo(sx(a.d) - 18, sy(a.y) - 16); ctx.lineTo(sx(b.d) - 18, sy(b.y) - 16); ctx.stroke(); } }
  // 글라이더 + 로켓 불꽃
  const gi = Math.max(0, C.GLIDERS.findIndex((x) => x.id === st.glider)), G2 = ok(SIDE[gi]) ? SIDE[gi] : ok(SIDE[0]) ? SIDE[0] : null;
  {
    // 글라이더: 화면 높이에 맞춰 크게, 어두운 테두리 그림자로 배경과 구분 (그림이 아직 없으면 단순한 모양)
    const gw = Math.max(120, Math.min(190, H * 0.19)), gh = G2 ? gw * G2.naturalHeight / G2.naturalWidth : gw * .62, a = f ? f.a : 0;
    const gx = sx(fd), gy = sy(fy) - (state === 'launch' || !f ? 16 : 0);
    ctx.save(); ctx.translate(gx, gy); ctx.rotate((Number.isFinite(a) ? -a * 0.9 : 0) + (f && f.stall ? Math.sin(T * 30) * .05 * f.stall : 0));
    if (f && f.rocketOn && state === 'fly') { const L = 34 + Math.random() * 22; const fg = ctx.createLinearGradient(-gw * .45, 0, -gw * .45 - L, 0); fg.addColorStop(0, '#fff3a0'); fg.addColorStop(.4, '#ff9a3a'); fg.addColorStop(1, 'rgba(255,60,20,0)'); ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(-gw * .4, gh * .12 - 9); ctx.lineTo(-gw * .45 - L, gh * .12); ctx.lineTo(-gw * .4, gh * .12 + 9); ctx.fill(); }
    ctx.shadowColor = f && (f.boostT > 0 || f.liftT > 0) ? '#ffe066' : 'rgba(20,10,40,.75)'; ctx.shadowBlur = f && (f.boostT > 0 || f.liftT > 0) ? 26 : 10;
    if (G2) ctx.drawImage(G2, -gw * 0.55, -gh * 0.6, gw, gh);
    else { ctx.fillStyle = '#f3dca8'; ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-gw * .5, -gh * .1); ctx.quadraticCurveTo(0, -gh * .6, gw * .45, -gh * .1); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#7a4a22'; ctx.beginPath(); ctx.ellipse(0, gh * .15, gw * .22, gh * .1, 0, 0, 6.283); ctx.fill(); }
    ctx.restore();
  }
  // 앞쪽 구름 (빠른 시차) + 속도선
  for (const c of clouds) { const x = ((c.x - fd * c.p * scale * .5) % (W + 400) + W + 400) % (W + 400) - 200, y = c.y; ctx.globalAlpha = .55; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x, y, 60 * c.s, 18 * c.s, 0, 0, 6.283); ctx.ellipse(x + 30 * c.s, y - 10 * c.s, 34 * c.s, 16 * c.s, 0, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1; }
  const sp = f ? Math.max(0, (v - 26) / 30) + (f.boostT > 0 || f.rocketOn ? .7 : 0) : 0;
  if (sp > 0.05) { ctx.strokeStyle = `rgba(255,255,255,${Math.min(.6, sp * .5)})`; ctx.lineWidth = 2; const n = Math.round(6 + sp * 14); for (let i = 0; i < n; i++) { const y = (i * 97.3 + T * 50) % H, x = ((i * 211.7 - T * (v * 18)) % (W + 200) + W + 200) % (W + 200) - 100, L = 40 + sp * 80; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + L, y); ctx.stroke(); } }
}
requestAnimationFrame(loop);
hudVisible(false); titleInfo();
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
if (TEST) window.__gl = { get st() { return st; }, set st(v) { st = v; }, get f() { return f; }, get state() { return state; }, start, tick, C, set hold(v) { hold = v; }, set rocket(v) { rocketHold = v; }, openHangar, result };

