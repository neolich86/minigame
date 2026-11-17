// 범인은 바로 너! — 화면 · 입력 · 팝업
import * as C from './core.js';
const $ = (id) => document.getElementById(id);
const Q = (() => { let s = location.search; try { if (parent !== window) s += '&' + parent.location.search.slice(1); } catch (e) { } return new URLSearchParams(s); })();
const TEST = Q.has('test');

// 장면 위 사람·증거가 설 수 있는 자리 (그림 크기 대비 비율, 발 위치)
const SPOTS = [
  [0.07, 0.57], [0.13, 0.47], [0.11, 0.62], [0.36, 0.62], [0.34, 0.47], [0.41, 0.4], [0.42, 0.59], [0.3, 0.27], [0.37, 0.17], [0.58, 0.12],
  [0.62, 0.28], [0.66, 0.43], [0.58, 0.63], [0.66, 0.7], [0.72, 0.78], [0.63, 0.88], [0.47, 0.81], [0.4, 0.95], [0.28, 0.93], [0.8, 0.68],
  [0.89, 0.52], [0.96, 0.47], [0.86, 0.17], [0.56, 0.44], [0.05, 0.3], [0.55, 0.8],
];
const IW = 2752, IH = 1536, MAN_H = 125, EV_S = 56; // 그림 기준 사람 키 · 증거 크기
const EV_ORDER = ['c_red', 'c_blue', 'c_yellow', 'c_green', 'i_umbrella', 'i_balloon', 'i_camera', 'i_book', 'i_flower', 'i_icecream', 'h_beret', 'h_cap', 'h_none', 'notice'];

const cv = $('cv'), g = cv.getContext('2d');
let W = 0, H = 0, DPR = 1;
const IMG = {}; let ART = null;
const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });

let cs = null, st = null; // 사건 · 진행 상태
const cam = { x: IW / 2, y: IH / 2, s: .5 };
function resize() {
  W = innerWidth; H = innerHeight; DPR = Math.min(2, devicePixelRatio || 1);
  cv.width = W * DPR; cv.height = H * DPR; fitCam();
}
const minS = () => Math.max(W / IW, H / IH);
function fitCam(reset) { const m = minS(); if (reset) cam.s = m * 1.05; cam.s = Math.max(m, Math.min(1.6, cam.s)); clampCam(); }
function clampCam() { const hw = W / 2 / cam.s, hh = H / 2 / cam.s; cam.x = Math.max(hw, Math.min(IW - hw, cam.x)); cam.y = Math.max(hh, Math.min(IH - hh, cam.y)); }
const sx = (x) => (x - cam.x) * cam.s + W / 2, sy = (y) => (y - cam.y) * cam.s + H / 2;
const ix = (x) => (x - W / 2) / cam.s + cam.x, iy = (y) => (y - H / 2) / cam.s + cam.y;

// ---------- 사건 시작 ----------
function newCase(seed) {
  cs = C.makeCase(seed, SPOTS);
  st = { found: new Set(), got: new Set(), cross: new Set(), t0: performance.now(), pen: 0, wrong: 0, done: false, hint: null, hintN: 0 };
  $('cTitle').textContent = '🔎 ' + cs.crime.title; $('cSub').textContent = `${C.PLACES[cs.crime.place]} · ${cs.time} · 사건 #${seed}`;
  buildStrip(); buildEvs(); fitCam(true); cam.x = IW / 2; cam.y = IH / 2; clampCam();
  $('top').hidden = false; $('bot').hidden = false; $('hintBtn').hidden = true;
  showBrief();
}
const elapsed = () => (st.done ? st.final : (performance.now() - st.t0) / 1000 + st.pen);
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ---------- 그리기 ----------
function sprite(c, idx, x, y, h, flip) { // 용의자 그림 (x,y = 발)
  const f = ART.sus[idx], w = h * f[2] / f[3];
  c.save(); c.translate(x, y); if (flip) c.scale(-1, 1); c.drawImage(IMG.sus, f[0], f[1], f[2], f[3], -w / 2, -h, w, h); c.restore();
}
function evIcon(c, id, x, y, s) { const f = ART.ev[EV_ORDER.indexOf(id)]; const k = s / Math.max(f[2], f[3]); c.drawImage(IMG.ev, f[0], f[1], f[2], f[3], x - f[2] * k / 2, y - f[3] * k / 2, f[2] * k, f[3] * k); }
const susIdx = (id) => C.SUSPECTS.findIndex((s) => s.id === id);
function draw(t) {
  g.setTransform(DPR, 0, 0, DPR, 0, 0); g.fillStyle = '#2e2440'; g.fillRect(0, 0, W, H);
  if (!IMG.scene) return;
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(IMG.scene, sx(0), sy(0), IW * cam.s, IH * cam.s);
  if (!cs) return;
  // 증거 (아직 못 찾은 것만)
  for (const id of cs.evs) { if (st.got.has(id)) continue; const [px, py] = cs.epos[id]; const x = sx(px * IW), y = sy(py * IH); evIcon(g, id, x, y - EV_S * cam.s * .3, EV_S * cam.s); }
  // 용의자
  const list = cs.suspects.map((id) => ({ id, x: cs.pos[id][0] * IW, y: cs.pos[id][1] * IH })).sort((a, b) => a.y - b.y);
  for (const p of list) {
    const x = sx(p.x), y = sy(p.y), h = MAN_H * cam.s, bob = st.done ? 0 : Math.sin(t / 380 + p.x) * h * .015;
    g.fillStyle = 'rgba(40,30,20,.18)'; g.beginPath(); g.ellipse(x, y, h * .2, h * .06, 0, 0, 7); g.fill();
    sprite(g, susIdx(p.id), x, y + bob, h, cs.flip[p.id]);
    if (st.found.has(p.id)) { const nm = C.SP[p.id].name; g.font = `800 ${Math.max(11, 13 * cam.s / .6)}px system-ui,sans-serif`; const tw = g.measureText(nm).width + 10; g.fillStyle = st.cross.has(p.id) ? 'rgba(120,110,130,.9)' : 'rgba(58,42,74,.9)'; g.beginPath(); g.roundRect(x - tw / 2, y - h - 20, tw, 17, 8); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(nm, x, y - h - 7); }
  }
  // 힌트 고리
  if (st.hint) { const k = (t / 600) % 1, x = sx(st.hint[0]), y = sy(st.hint[1]); g.strokeStyle = `rgba(255,207,90,${1 - k})`; g.lineWidth = 4; g.beginPath(); g.arc(x, y - 30 * cam.s, (30 + k * 50) * cam.s + 10, 0, 7); g.stroke(); }
  // 반짝임 효과
  for (let i = sparks.length - 1; i >= 0; i--) { const p = sparks[i]; p.t += 16; if (p.t > 700) { sparks.splice(i, 1); continue; } const u = p.t / 700; g.fillStyle = `rgba(255,220,90,${1 - u})`; for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28; g.beginPath(); g.arc(sx(p.x) + Math.cos(a) * u * 50, sy(p.y) + Math.sin(a) * u * 50, 4 * (1 - u) + 1, 0, 7); g.fill(); } }
}
const sparks = [];

// ---------- 위 · 아래 막대 ----------
function portrait(id, w = 64, h = 70) {
  const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2; const q = c.getContext('2d'); q.scale(2, 2);
  const f = ART.sus[susIdx(id)], k = Math.min((w - 6) / f[2], (h * 1.55) / f[3]); // 얼굴·상반신 위주
  q.drawImage(IMG.sus, f[0], f[1], f[2], f[3], (w - f[2] * k) / 2, 3, f[2] * k, f[3] * k); return c;
}
function evCanvas(id, s = 40) { const c = document.createElement('canvas'); c.width = c.height = s * 2; const q = c.getContext('2d'); q.scale(2, 2); evIcon(q, id, s / 2, s / 2, s - 2); return c; }
function buildStrip() {
  const box = $('sus'); box.innerHTML = '';
  for (const id of cs.suspects) {
    const d = document.createElement('button'); d.className = 'su' + (st.found.has(id) ? '' : ' hide') + (st.cross.has(id) ? ' x' : ''); d.dataset.id = id;
    d.append(portrait(id)); const i = document.createElement('i'); i.textContent = st.found.has(id) ? C.SP[id].name : '???'; d.append(i);
    d.onclick = () => (st.found.has(id) ? showSuspect(id) : toast('광장 어딘가에 숨어 있어요. 찾아서 눌러 보세요!'));
    box.append(d);
  }
}
function buildEvs() {
  const box = $('evs'); box.innerHTML = '';
  for (const id of cs.evs) { const d = document.createElement('button'); d.className = 'ev' + (st.got.has(id) ? ' got' : ' hide'); d.append(evCanvas(id)); d.onclick = () => (st.got.has(id) ? showEvidence(id) : toast(`광장 어딘가에 떨어진 "${C.EV[id].name}"을(를) 찾아보세요`)); box.append(d); }
}

// ---------- 팝업 ----------
function pop(html, after) { $('pop').innerHTML = html; $('dim').hidden = false; after && after($('pop')); }
function closePop() { $('dim').hidden = true; }
$('dim').addEventListener('pointerdown', (e) => { if (e.target === $('dim') && !st?.done) closePop(); });
function showBrief() {
  const shared = Q.get('case') && +Q.get('case') === cs.seed && Q.get('t');
  pop(`<img src="assets/title.webp" alt="" style="display:block;width:100%;height:190px;object-fit:cover;object-position:50% 62%;border-radius:14px;border:2px solid var(--line);margin-bottom:8px"><div class="title"><h1>범인은 <span>바로 너!</span></h1></div>
    <p class="dimt" style="text-align:center">사건 #${cs.seed}</p>
    <h2>🚨 ${cs.crime.title}</h2>
    <p>${cs.time}, ${C.PLACES[cs.crime.place]}에서 사건이 일어났어요. ${cs.crime.what}</p>
    <p>용의자는 6명. 광장에서 <b>용의자를 찾아 알리바이</b>를 듣고, 떨어진 <b>증거 3개</b>를 찾아 범인을 지목하세요.</p>
    <p class="dimt">· 화면을 끌어서 둘러보고, 두 손가락(마우스 휠)으로 확대해요<br>· 틀리게 지목하면 30초가 더해져요</p>
    ${shared ? `<div class="cmp"><div><small>친구 기록</small><b>${fmt(+Q.get('t'))}</b></div><div><small>목표</small><b>더 빨리!</b></div></div>` : ''}
    <button class="btn" id="go">수사 시작!</button>
    <div class="credit">그림: Higgsfield AI</div>`, (p) => { p.querySelector('#go').onclick = () => { closePop(); st.t0 = performance.now(); }; });
}
function showSuspect(id) {
  const s = C.SP[id], place = C.PLACES[cs.alibi[id]];
  pop(`<div class="who"><span id="pp"></span><div><h3>${s.name} <span class="dimt">${s.job}</span></h3>
      <div class="tags"><span class="tag">${C.COLORS[s.color]} 옷</span><span class="tag">${C.ITEMS[s.item]}</span><span class="tag">${C.HATS[s.hat]}</span></div></div></div>
    <div class="bubble">"${cs.time}쯤이요? 저는 <b>${place}</b>에 있었어요. 전 아무것도 몰라요!"</div>
    <div class="row"><button class="btn w" id="xb">${st.cross.has(id) ? '↩ 다시 의심' : '✖ 의심 빼기'}</button><button class="btn" id="ok">알겠어요</button></div>`,
  (p) => { p.querySelector('#pp').replaceWith(portrait(id, 88, 96)); p.querySelector('#ok').onclick = closePop; p.querySelector('#xb').onclick = () => { st.cross.has(id) ? st.cross.delete(id) : st.cross.add(id); buildStrip(); closePop(); }; });
}
function showEvidence(id) {
  pop(`<div class="who"><span id="ec"></span><div><h3>증거 발견! ${C.EV[id].name}</h3><p class="dimt">${cs.crime.title}</p></div></div>
    <div class="bubble">💡 ${C.evidenceText(cs, id)}</div><button class="btn" id="ok">수첩에 적기</button>`,
  (p) => { p.querySelector('#ec').replaceWith(evCanvas(id, 88)); p.querySelector('#ok').onclick = closePop; });
}
function showNote() {
  const clues = cs.evs.filter((id) => st.got.has(id));
  pop(`<h2>📒 수사 수첩</h2>
    <p class="dimt">증거 ${clues.length}/3 · 용의자 ${st.found.size}/6 — 줄을 눌러 의심을 빼거나 되돌려요</p>
    <div class="note">${clues.length ? clues.map((id) => `<div class="nrow"><span data-e="${id}"></span><div><b>${C.EV[id].name}</b><br>${C.evidenceText(cs, id)}</div></div>`).join('') : '<div class="nrow">아직 찾은 증거가 없어요.</div>'}</div>
    <div class="note">${cs.suspects.map((id) => st.found.has(id) ? `<div class="nrow ${st.cross.has(id) ? 'x' : ''}" data-s="${id}"><span data-p="${id}"></span><div><b>${C.SP[id].name}</b> · ${C.COLORS[C.SP[id].color]} 옷 · ${C.ITEMS[C.SP[id].item]} · ${C.HATS[C.SP[id].hat]}<br>알리바이: ${C.PLACES[cs.alibi[id]]}</div></div>` : `<div class="nrow">❓ 아직 못 찾은 용의자</div>`).join('')}</div>
    <button class="btn" id="ok">닫기</button>`,
  (p) => {
    p.querySelectorAll('[data-e]').forEach((e) => e.replaceWith(evCanvas(e.dataset.e, 38)));
    p.querySelectorAll('[data-p]').forEach((e) => { const c = portrait(e.dataset.p, 38, 42); e.replaceWith(c); });
    p.querySelectorAll('[data-s]').forEach((e) => (e.onclick = () => { const id = e.dataset.s; st.cross.has(id) ? st.cross.delete(id) : st.cross.add(id); buildStrip(); showNote(); }));
    p.querySelector('#ok').onclick = closePop;
  });
}
let pickId = null;
function showAccuse() {
  pickId = null;
  const render = () => pop(`<h2>👉 범인은 바로…</h2><p class="dimt">찾은 용의자 중에서 고르세요. 틀리면 30초가 더해져요.</p>
    <div class="grid">${cs.suspects.map((id) => `<button class="pick ${pickId === id ? 'on' : ''} ${st.cross.has(id) ? 'x' : ''}" data-id="${id}" ${st.found.has(id) ? '' : 'disabled'}><span data-p="${id}"></span>${st.found.has(id) ? C.SP[id].name : '???'}</button>`).join('')}</div>
    <button class="btn" id="ok" ${pickId ? '' : 'disabled style="opacity:.5"'}>${pickId ? `${C.SP[pickId].name}, 바로 너야!` : '용의자를 고르세요'}</button><button class="btn w" id="no">조금 더 수사하기</button>`,
  (p) => {
    p.querySelectorAll('[data-p]').forEach((e) => { const c = portrait(e.dataset.p); if (!st.found.has(e.dataset.p)) c.style.filter = 'brightness(0) opacity(.25)'; e.replaceWith(c); });
    p.querySelectorAll('.pick').forEach((b) => (b.onclick = () => { pickId = b.dataset.id; render(); }));
    p.querySelector('#no').onclick = closePop; p.querySelector('#ok').onclick = () => pickId && accuse(pickId);
  });
  render();
}
function accuse(id) {
  if (id !== cs.culprit) { st.wrong++; st.pen += 30; st.cross.add(id); buildStrip(); closePop(); toast(`❌ ${C.SP[id].name}은(는) 범인이 아니에요! +30초`); return; }
  st.final = elapsed(); st.done = true; closePop(); sparks.push({ x: cs.pos[id][0] * IW, y: cs.pos[id][1] * IH - 40, t: 0 });
  const s = C.SP[id], secs = Math.round(st.final), friend = Q.get('case') && +Q.get('case') === cs.seed && Q.get('t') ? +Q.get('t') : null;
  const why = cs.clues.map((c) => C.EV[c].says.replace('범인은 ', '')).join(' · ');
  const best = bestOf(cs.seed, secs);
  setTimeout(() => pop(`<div class="big">🎉</div><h2 style="text-align:center">사건 해결!</h2>
    <div class="who" style="margin-top:8px"><span id="pp"></span><div><h3>범인은 ${s.name}!</h3><p class="dimt">${s.job}</p></div></div>
    <div class="bubble">🔎 증거: ${why}<br>🕒 "${C.PLACES[cs.alibi[id]]}에 있었다"던 알리바이는 거짓말 — 그 시간 ${C.PLACES[cs.closed]}은(는) 문을 닫았어요!</div>
    <div class="cmp"><div><small>해결 시간</small><b>${fmt(secs)}</b></div><div><small>틀린 지목</small><b>${st.wrong}번</b></div>${friend ? `<div><small>친구</small><b>${fmt(friend)}</b></div>` : ''}</div>
    ${friend ? `<p style="text-align:center;font-weight:800">${secs < friend ? '🏆 친구보다 빨랐어요!' : secs === friend ? '🤝 친구와 똑같아요!' : '😅 친구가 더 빨랐어요'}</p>` : ''}
    <p class="dimt" style="text-align:center">이 사건 내 최고 기록 ${fmt(best)}</p>
    <button class="btn g" id="share">📨 친구에게 이 사건 출제하기</button>
    <button class="btn" id="next">🔄 새 사건 받기</button>`,
  (p) => { p.querySelector('#pp').replaceWith(portrait(id, 88, 96)); p.querySelector('#next').onclick = () => { closePop(); newCase(randSeed()); }; p.querySelector('#share').onclick = () => share(cs.seed, secs); }), 700);
}
function bestOf(seed, secs) { try { const k = 'mgh:whodunit:best', b = JSON.parse(localStorage.getItem(k) || '{}'); if (!b[seed] || secs < b[seed]) b[seed] = secs; localStorage.setItem(k, JSON.stringify(b)); return b[seed]; } catch (e) { return secs; } }
async function share(seed, secs) {
  let base = location.origin + '/play/whodunit'; try { if (parent !== window) base = parent.location.origin + parent.location.pathname; } catch (e) { }
  const url = `${base}?case=${seed}&t=${secs}`, text = `🔎 범인은 바로 너! 사건 #${seed}을(를) ${fmt(secs)} 만에 풀었어요. 나보다 빨리 범인을 찾을 수 있을까?`;
  try { if (navigator.share) { await navigator.share({ title: '범인은 바로 너!', text, url }); return; } } catch (e) { return; }
  try { await navigator.clipboard.writeText(`${text} ${url}`); toast('📋 링크를 복사했어요! 친구에게 보내 보세요'); } catch (e) { prompt('이 링크를 친구에게 보내세요', url); }
}
const randSeed = () => 1000 + Math.floor(Math.random() * 899000);

let toastT = null;
function toast(t) { const el = $('toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 1800); }

// ---------- 입력: 끌기 · 확대 · 누르기 ----------
const ptr = new Map(); let drag = null, pinch = null, moved = 0;
cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); ptr.set(e.pointerId, [e.clientX, e.clientY]); moved = 0;
  if (ptr.size === 1) drag = { x: e.clientX, y: e.clientY }; else if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s: cam.s }; drag = null; } });
cv.addEventListener('pointermove', (e) => { if (!ptr.has(e.pointerId)) return; ptr.set(e.pointerId, [e.clientX, e.clientY]);
  if (pinch && ptr.size >= 2) { const [a, b] = [...ptr.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); zoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, pinch.s * d / pinch.d); moved = 99; }
  else if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; moved += Math.abs(dx) + Math.abs(dy); cam.x -= dx / cam.s; cam.y -= dy / cam.s; clampCam(); drag = { x: e.clientX, y: e.clientY }; } });
const up = (e) => { if (!ptr.has(e.pointerId)) return; ptr.delete(e.pointerId); if (ptr.size < 2) pinch = null; if (ptr.size === 0) { if (moved < 8 && drag) tap(e.clientX, e.clientY); drag = null; } };
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
cv.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(e.clientX, e.clientY, cam.s * (e.deltaY < 0 ? 1.12 : 1 / 1.12)); }, { passive: false });
function zoomAt(px, py, s) { const bx = ix(px), by = iy(py); cam.s = Math.max(minS(), Math.min(1.6, s)); cam.x = bx - (px - W / 2) / cam.s; cam.y = by - (py - H / 2) / cam.s; clampCam(); }
function tap(px, py) {
  if (!cs || st.done) return;
  const x = ix(px), y = iy(py), tol = Math.max(14, 22 / cam.s); // 작게 보일 때도 누르기 쉽게
  for (const id of cs.evs) { if (st.got.has(id)) continue; const [ex, ey] = cs.epos[id]; if (Math.hypot(ex * IW - x, ey * IH - EV_S * .3 - y) < EV_S * .5 + tol) { st.got.add(id); st.hint = null; sparks.push({ x: ex * IW, y: ey * IH, t: 0 }); buildEvs(); showEvidence(id); return; } }
  let best = null, bd = 1e9;
  for (const id of cs.suspects) { const [px2, py2] = cs.pos[id], fx = px2 * IW, fy = py2 * IH; if (x > fx - 24 - tol && x < fx + 24 + tol && y > fy - MAN_H - tol && y < fy + tol) { const d = Math.hypot(fx - x, fy - MAN_H / 2 - y); if (d < bd) { bd = d; best = id; } } }
  if (best) { const first = !st.found.has(best); st.found.add(best); if (first) { st.hint = null; sparks.push({ x: cs.pos[best][0] * IW, y: cs.pos[best][1] * IH - 40, t: 0 }); buildStrip(); const el = document.querySelector(`.su[data-id="${best}"]`); el && el.classList.add('new'); } showSuspect(best); }
}
$('noteBtn').onclick = () => cs && showNote();
$('accuse').onclick = () => cs && !st.done && showAccuse();
$('hintBtn').onclick = () => {
  const ev = cs.evs.find((id) => !st.got.has(id)), su = cs.suspects.find((id) => !st.found.has(id));
  const p = ev ? cs.epos[ev] : su ? cs.pos[su] : null; if (!p) { toast('모두 찾았어요! 이제 범인을 지목하세요'); return; }
  st.hint = [p[0] * IW, p[1] * IH]; st.pen += 15; st.hintN++; cam.x = st.hint[0]; cam.y = st.hint[1] - 30; clampCam(); toast('🔍 반짝이는 곳을 살펴보세요 (+15초)');
};

// ---------- 루프 ----------
function loop(t) {
  draw(t);
  if (cs) { $('timer').textContent = fmt(elapsed()); $('hintBtn').hidden = st.done || !$('dim').hidden || elapsed() < 45; }
  requestAnimationFrame(loop);
}
addEventListener('resize', resize);
(async () => {
  resize();
  [IMG.scene, IMG.sus, IMG.ev, ART] = await Promise.all([load('assets/scene.webp'), load('assets/suspects.webp'), load('assets/evidence.webp'), fetch('assets/art.json').then((r) => r.json())]);
  $('load').hidden = true;
  const qc = +Q.get('case'); newCase(Number.isFinite(qc) && qc > 0 ? qc : randSeed());
  requestAnimationFrame(loop);
  if (TEST) window.__wd = { C, get cs() { return cs; }, get st() { return st; }, cam, newCase, tap, accuse, sx, sy, IW, IH, SPOTS };
})();
