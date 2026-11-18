// 파고파고 대모험 — 화면 · 입력 · 저장
import * as THREE from 'three';
import * as C from './core.js';
const $ = (id) => document.getElementById(id);
const Q = (() => { let s = location.search; try { if (parent !== window) s += '&' + parent.location.search.slice(1); } catch (e) { } return new URLSearchParams(s); })();
const TEST = Q.has('test'), KEY = 'mgh:digdig';

// ---------- 그림 ----------
const A = await (await fetch('assets/art.json')).json();
const IM = {};
await Promise.all(['dino', 'space', 'fos', 'skel', 'misc'].map((k) => new Promise((r) => { const i = new Image(); i.onload = i.onerror = () => r(); i.src = `assets/${k}.webp`; IM[k] = i; })));
function cropCanvas(sheet, k) { const f = A[sheet][k], c = document.createElement('canvas'); c.width = f[2]; c.height = f[3]; c.getContext('2d').drawImage(IM[sheet], f[0], f[1], f[2], f[3], 0, 0, f[2], f[3]); return c; }
const URLC = {}; const url = (sheet, k) => URLC[sheet + k] || (URLC[sheet + k] = cropCanvas(sheet, k).toDataURL());
const PIECE = (rd, k) => (rd.act === 0 ? ['fos', rd.pieces[k][1]] : rd.pieces[k][1] < 5 ? ['space', 5 + rd.pieces[k][1]] : ['misc', rd.pieces[k][1] - 1]);
// 도구 그림: [시트, 번호]
const TOOL_ART = [[['dino', 0], ['misc', 0], ['misc', 1]], [['space', 0], ['misc', 2]]];
// 화석 그림 → 큐브 모양(마스크)과 색
function maskOf(sheet, k, maxDim) {
  const c = cropCanvas(sheet, k), g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height).data;
  const s = Math.max(c.width, c.height) / maxDim, w = Math.max(2, Math.round(c.width / s)), h = Math.max(2, Math.round(c.height / s));
  const rows = [], cols = [];
  for (let y = 0; y < h; y++) {
    let row = ''; const cr = [];
    for (let x = 0; x < w; x++) {
      let a = 0, r = 0, gg = 0, b = 0, n = 0;
      for (let yy = Math.floor(y * c.height / h); yy < Math.floor((y + 1) * c.height / h); yy += 2) for (let xx = Math.floor(x * c.width / w); xx < Math.floor((x + 1) * c.width / w); xx += 2) {
        const i = (yy * c.width + xx) * 4; n++; if (d[i + 3] > 120) { a++; r += d[i]; gg += d[i + 1]; b += d[i + 2]; }
      }
      const on = a / Math.max(1, n) > .38; row += on ? 'X' : '.'; cr.push(on ? (Math.round(r / a) << 16) | (Math.round(gg / a) << 8) | Math.round(b / a) : 0);
    }
    rows.push(row); cols.push(cr);
  }
  return { rows, cols };
}

// ---------- 상태 ----------
let st = loadLocal() || C.newState();
let W2 = null, masks = [];
const rd = () => C.ROUNDS[st.round];
function buildRound(keepAlive) {
  const r = rd();
  masks = r.pieces.map((_, k) => { const [sh, i] = PIECE(r, k); return maskOf(sh, i, r.act ? 7 : 8); });
  W2 = C.makeWall(st.round, st.seed + st.round * 7919, masks.map((m) => m.rows));
  if (keepAlive) { for (let i = 0; i < C.N; i++) if (!((keepAlive[i >> 3] >> (i & 7)) & 1)) { W2.alive[i] = 0; if (W2.fos[i] >= 0) W2.got[W2.fos[i]]++; } W2.found = W2.got.map((g, k) => g >= W2.cnt[k] * .85); }
  document.body.className = r.act ? 'space' : 'dino';
  paintAll(); buildSlots(); setTool(); hud();
}

// ---------- three ----------
const cv = $('gl'), R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); R.setPixelRatio(Math.min(2, devicePixelRatio));
const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(50, 1, .1, 100);
cam.position.set(0, .3, 7.2); cam.lookAt(0, 0, 0);
const hemi = new THREE.HemisphereLight(0xfff2d8, 0x7a5a3a, 1.2); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(3, 5, 6); scene.add(sun);
const S = .2;
const ro = (w) => { const c = w.charCodeAt(w.length - 1) - 0xac00, j = c % 28; return w + (c < 0 || c > 11171 || j === 0 || j === 8 ? '로' : '으로'); };
const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(S * .96, S * .96, S * .96), new THREE.MeshLambertMaterial(), C.N); scene.add(mesh);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), new THREE.MeshLambertMaterial({ color: 0xc9955e })); floor.rotation.x = -Math.PI / 2; floor.position.y = -3.6; scene.add(floor);
const stars = (() => { const g = new THREE.BufferGeometry(), p = []; for (let i = 0; i < 400; i++) p.push((Math.random() - .5) * 60, (Math.random() - .5) * 40, -20 - Math.random() * 20); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); const o = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: .12 })); scene.add(o); return o; })();
const pos = (i) => { const d = Math.floor(i / (C.NX * C.NY)), r = i % (C.NX * C.NY), y = Math.floor(r / C.NX), x = r % C.NX; return [(x - C.NX / 2 + .5) * S, (y - C.NY / 2 + .5) * S - .4, -d * S]; };
const M4 = new THREE.Matrix4(), col = new THREE.Color(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
const hsh = (a) => { const x = Math.sin(a * 127.1) * 43758.5; return x - Math.floor(x); };
const fosCol = new Int32Array(C.N);
function cubeColor(i) {
  const r = rd(), d = Math.floor(i / (C.NX * C.NY));
  if (W2.fos[i] >= 0) { col.setHex(fosCol[i] || 0xf3ead2); return col; }
  if (W2.bonus[i] >= 0) { col.setHex(r.act ? 0x9d6bff : W2.bonus[i] ? 0xc9a27a : 0xffb01f); return col; }
  const rk = C.ROCKS[r.act][W2.kind[i]]; col.setHex(rk.col[(i * 7 + (i >> 3)) % 2]);
  col.multiplyScalar((.9 + hsh(i * 3.3) * .2) * (1 - d * .045));
  if (r.act && W2.kind[i] < 4 && hsh(i * 9.1) < .03) col.setHex(hsh(i) < .5 ? 0x4fe8ff : 0xffd34a);
  return col;
}
function paintAll() {
  fosCol.fill(0);
  W2.place.forEach(([x0, y0, d0], k) => masks[k].rows.forEach((row, ry) => [...row].forEach((c, rx) => { if (c === '.') return; const y = C.NY - 1 - (y0 + ry), x = x0 + rx; for (const d of [d0, d0 + 1]) fosCol[C.idx(x, y, d)] = masks[k].cols[ry][rx]; })));
  for (let i = 0; i < C.N; i++) { if (W2.alive[i]) { const [x, y, z] = pos(i); M4.makeTranslation(x, y, z); mesh.setMatrixAt(i, M4); } else mesh.setMatrixAt(i, ZERO); mesh.setColorAt(i, cubeColor(i)); }
  mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; mesh.computeBoundingBox(); mesh.computeBoundingSphere();
  const sp = rd().act === 1;
  stars.visible = sp; floor.material.color.setHex(sp ? 0x2a2440 : 0xc9955e);
  hemi.color.setHex(sp ? 0x9fb8ff : 0xfff2d8); hemi.groundColor.setHex(sp ? 0x1a1030 : 0x7a5a3a);
}
// 잔해
const DMAX = 420, dMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(S * .5, S * .5, S * .5), new THREE.MeshLambertMaterial(), DMAX); scene.add(dMesh);
const deb = [];
const beam = $('beam'), bg = beam.getContext('2d');
function resize() { const w = innerWidth, h = innerHeight; R.setSize(w, h, false); cam.aspect = w / h; cam.fov = w / h < .7 ? 62 : 50; cam.updateProjectionMatrix(); beam.width = w * 2; beam.height = h * 2; }
addEventListener('resize', resize); resize();

// ---------- HUD ----------
const fmt = (v) => (v >= 1e9 ? (v / 1e9).toFixed(1) + 'B' : v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e4 ? (v / 1e3).toFixed(1) + 'K' : Math.floor(v).toLocaleString());
const COIN = () => (rd().act ? '💎' : '💰');
function frontRock() { // 가운데 앞쪽에서 가장 앞 층
  for (let d = 0; d < C.ND; d++) { let n = 0; for (let y = 8; y < 22; y++) for (let x = 6; x < 16; x++) n += W2.alive[C.idx(x, y, d)]; if (n > 40) return [d, C.ROCKS[rd().act][W2.kind[C.idx(11, 15, d)]].name]; }
  return [C.ND, '바닥'];
}
function hud() {
  $('money').innerHTML = `${COIN()} ${fmt(st.money)}`;
  const nm = frontRock()[1]; let al = 0; for (let i = 0; i < C.N; i++) al += W2.alive[i]; const d = (C.N - al) / (C.NX * C.NY); $('depthT').innerHTML = `<small>${rd().name} 발굴장 · ${nm}</small>${(rd().act ? (d * .35).toFixed(1) + ' km' : (d * 1.2).toFixed(1) + ' m')}`;
  $('depthBar').style.width = Math.max(4, d / C.ND * 100) + '%';
  $('inc').textContent = `🏛 +${fmt(C.museumIncome(st))}/초`;
  [...document.querySelectorAll('.up')].forEach((b) => { const k = +b.dataset.k, u = C.UPS[k], lv = st.lv[u.id] || 0, max = lv >= u.max; b.classList.toggle('dis', max || st.money < C.upCost(st, k)); b.querySelector('b').textContent = `${u.name} Lv${lv + 1}`; b.querySelector('small').textContent = max ? 'MAX' : `${COIN()}${fmt(C.upCost(st, k))}`; });
  $('dyna').querySelector('i').textContent = st.dyna; $('dyna').classList.toggle('on', armed);
  const rcd = st.radarT > 0; $('radar').classList.toggle('dis', rcd || !(st.lv.radar > 0)); $('radar').querySelector('i').textContent = !(st.lv.radar > 0) ? '🔒' : rcd ? Math.ceil(st.radarT) : '';
  $('gift').hidden = !AD.enabled; $('gift').classList.toggle('dis', st.giftCd > 0 && st.boostT <= 0); $('gift').querySelector('i').textContent = st.boostT > 0 ? Math.ceil(st.boostT) + 's' : st.giftCd > 0 ? Math.ceil(st.giftCd / 60) + '분' : '';
  const tools = C.TOOLS[rd().act], nx = tools[st.tool + 1]; const ev = $('evolve');
  ev.hidden = !nx; if (nx) { ev.innerHTML = `⚒ ${ro(nx.name)} 진화<br><small>${COIN()}${fmt(nx.cost)}</small>`; ev.classList.toggle('dis', st.money < nx.cost); }
  $('boost').hidden = !(st.boostT > 0); $('boost').textContent = `🎁 판매 2배 ${Math.ceil(st.boostT)}초`;
}
function buildSlots() {
  const r = rd(); $('sideT').textContent = (r.act ? '👽 ' : '🦖 ') + r.short;
  $('slots').innerHTML = r.pieces.map((p, k) => { const [sh, i] = PIECE(r, k); return `<div class="${W2.found[k] ? 'on' : ''}" title="${p[0]}"><img src="${url(sh, i)}"></div>`; }).join('');
}
function setTool() { const [sh, i] = TOOL_ART[rd().act][st.tool] || TOOL_ART[rd().act][0]; $('tool').src = url(sh, i); }
function pop(x, y, s, c = '#ffe08a') { const d = document.createElement('div'); d.className = 'pop'; d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.color = c; d.textContent = s; document.body.append(d); setTimeout(() => d.remove(), 900); }
let toastT; function toast(html) { const t = $('toast'); t.innerHTML = html; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1800); }

// 강화 버튼
C.UPS.forEach((u, k) => { if (u.id === 'museum' || u.id === 'radar') return; const b = document.createElement('button'); b.className = 'up'; b.dataset.k = k; b.innerHTML = `<b></b><small></small>`; b.onclick = (e) => { e.stopPropagation(); buyUp(k); }; $('ups').append(b); });
function buyUp(k) { const u = C.UPS[k], c = C.upCost(st, k); if ((st.lv[u.id] || 0) >= u.max || st.money < c) return; st.money -= c; st.lv[u.id] = (st.lv[u.id] || 0) + 1; if (st.tut === 1) tutNext(); hud(); save(); }
$('evolve').onclick = () => { const nx = C.TOOLS[rd().act][st.tool + 1]; if (!nx || st.money < nx.cost) return; st.money -= nx.cost; st.tool++; setTool(); toast(`<img src="${$('tool').src}"><div><b>${nx.name}</b>${ro(nx.name).slice(nx.name.length)} 진화! 위력이 크게 올랐어요</div>`); hud(); save(); };

// ---------- 부수기 ----------
const ray = new THREE.Raycaster(), v2 = new THREE.Vector2();
let beamFx = null, shake = 0, armed = false;
function strike(px, py, big) {
  v2.set(px / innerWidth * 2 - 1, -py / innerHeight * 2 + 1); ray.setFromCamera(v2, cam);
  const h = ray.intersectObject(mesh)[0]; const tl = $('tool'); tl.classList.add('hit'); setTimeout(() => tl.classList.remove('hit'), 80);
  if (!h) return false;
  const p = h.point, r = rd(), hd = Math.floor(h.instanceId / (C.NX * C.NY));
  if (r.act) beamFx = { x: px, y: py, t: .1 };
  const res = C.hit(W2, st, p.x / S + C.NX / 2 - .5, (p.y + .4) / S + C.NY / 2 - .5, hd, big), newly = [];
  for (const i of res.broke) { breakFx(i); if (W2.fos[i] >= 0) newly.push(W2.fos[i]); }
  const broke = res.broke.length, gain = res.gain / C.sellMul(st);
  mesh.instanceMatrix.needsUpdate = true;
  if (gain) { const g = gain * C.sellMul(st); st.money += g; st.total += g; pop(px - 12, py - 34, `+${fmt(g)}`); }
  for (const k of new Set(newly)) checkFossil(k);
  if (big) { shake = .4; }
  if (st.tut === 0 && (st.tutN = (st.tutN || 0) + broke) > 14) tutNext();
  hud(); return true;
}
function breakCube(i) { W2.alive[i] = 0; if (W2.fos[i] >= 0) W2.got[W2.fos[i]]++; breakFx(i); }
function breakFx(i) {
  mesh.setMatrixAt(i, ZERO); const [x, y, z] = pos(i);
  if (deb.length < DMAX) { cubeColor(i); deb.push({ x, y, z, vx: (Math.random() - .5) * 3, vy: Math.random() * 3 + 1, vz: Math.random() * 2.5 + .5, c: col.getHex(), t: 0 }); }
}
function checkFossil(k) {
  if (W2.found[k] || !C.fossilDone(W2, k)) return;
  W2.found[k] = true;
  for (let i = 0; i < C.N; i++) if (W2.alive[i] && W2.fos[i] === k) breakCube(i);
  mesh.instanceMatrix.needsUpdate = true;
  const r = rd(), [sh, ii] = PIECE(r, k);
  toast(`<img src="${url(sh, ii)}"><div><b>${r.pieces[k][0]}</b> 발견!<br><small>${r.short} ${W2.found.filter(Boolean).length} / ${r.pieces.length}</small></div>`);
  buildSlots(); save();
  if (W2.found.every(Boolean)) setTimeout(roundDone, 900);
}

// 입력: 누르고 있으면 계속 파기
let hold = null, lastHit = 0;
cv.addEventListener('pointerdown', (e) => {
  if (armed) { armed = false; st.dyna--; strike(e.clientX, e.clientY, true); boom(e.clientX, e.clientY); save(); return; }
  hold = { x: e.clientX, y: e.clientY, id: e.pointerId }; strike(hold.x, hold.y); lastHit = performance.now();
});
cv.addEventListener('pointermove', (e) => { if (hold && e.pointerId === hold.id) { hold.x = e.clientX; hold.y = e.clientY; } });
const endHold = () => { hold = null; }; cv.addEventListener('pointerup', endHold); cv.addEventListener('pointercancel', endHold); cv.addEventListener('pointerleave', endHold);
function boom(x, y) { const b = document.createElement('div'); b.className = 'boom'; b.style.left = x + 'px'; b.style.top = y + 'px'; document.body.append(b); setTimeout(() => b.remove(), 600); }
$('dyna').onclick = (e) => { e.stopPropagation(); if (st.dyna <= 0) { if (AD.enabled) adFor('dyna'); else toast('🧨 다이너마이트가 없어요 — 라운드를 끝내면 받아요'); return; } armed = !armed; if (armed) toast('🧨 터뜨릴 곳을 누르세요'); hud(); };
$('radar').onclick = (e) => { e.stopPropagation(); if (!(st.lv.radar > 0)) { openMuseum(); return; } if (st.radarT > 0) { if (AD.enabled) adFor('radar'); return; } radar(); };
function radar() {
  st.radarT = C.radarCd(st);
  const k = W2.found.findIndex((f) => !f); if (k < 0) return;
  const [x0, y0, d0] = W2.place[k], m = masks[k].rows; const cx = x0 + m[0].length / 2, cy = y0 + m.length / 2;
  const v = new THREE.Vector3((cx - C.NX / 2) * S, (C.NY - 1 - cy - C.NY / 2 + .5) * S - .4, -d0 * S).project(cam);
  const el = $('ping'); el.style.left = (v.x + 1) / 2 * innerWidth + 'px'; el.style.top = (1 - v.y) / 2 * innerHeight + 'px'; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  toast('📡 화석 신호 감지!'); hud();
}

// ---------- 라운드 · 카드 ----------
function card(html, btns) {
  const d = $('card'); d.innerHTML = html + '<div class="btns"></div>'; const b = d.querySelector('.btns');
  for (const [t, cls, fn] of btns) { const e = document.createElement('button'); e.className = 'btn ' + (cls || ''); e.innerHTML = t; e.onclick = () => fn(e); b.append(e); }
  $('dim').hidden = false;
}
const closeCard = () => { $('dim').hidden = true; };
function roundDone() {
  const r = rd(), reward = r.reward;
  if (!st.done.includes(st.round)) st.done.push(st.round);
  st.dyna += 1;
  const img = r.act ? url('space', 5) : url('skel', st.round);
  const take = (m) => { st.money += reward * m; closeCard(); nextRound(); };
  card(`<img class="big" src="${img}"><h2>${r.name} ${r.act ? '유물 회수' : '복원 완료!'}</h2><p>${r.desc}</p><p class="good">🏛 박물관 관람 수입 +${fmt(r.income)}/초 · 🧨 +1</p>`,
    [[`보상 ${COIN()}${fmt(reward)} 받기`, '', () => take(1)], ...(AD.enabled ? [[`📺 광고 보고 ${COIN()}${fmt(reward * 2)}`, 'g', (e) => showAd(e, () => take(2))]] : [])]);
  save();
}
function nextRound() {
  const last = C.ROUNDS.length - 1;
  if (st.round === 5) { // 1막 끝 → 우주
    card(`<img class="big" src="${url('misc', 3)}"><h2>🚀 우주로 출발!</h2><p>지구의 공룡 화석을 모두 찾았어요! 이제 소행성에 묻힌 외계 유물을 찾으러 가요. 도구가 <b>채굴 레이저</b>로 바뀌어요.</p>`,
      [['출발!', '', () => { closeCard(); st.round = 6; st.tool = 0; st.seed++; buildRound(); save(); }]]);
    return;
  }
  if (st.round >= last) {
    card(`<div class="emo">🌌</div><h2>더 먼 우주는 준비 중!</h2><p>지금까지 공개된 발굴장을 모두 끝냈어요. 다음 업데이트에서 얼음 혜성·수정 소행성 등이 열려요. 같은 소행성을 다시 캐며 박물관을 키울 수 있어요.</p>`,
      [['다시 캐기', '', () => { closeCard(); st.seed++; buildRound(); save(); }]]);
    return;
  }
  st.round++; st.seed++; buildRound(); save();
  toast(`<img src="${url(...PIECE(rd(), 0))}"><div><b>${rd().name}</b> 발굴장 도착!<br><small>화석 ${rd().pieces.length}개를 찾아요</small></div>`);
}
// 박물관
function openMuseum() {
  const done = st.done.filter((r) => C.ROUNDS[r].act === 0);
  const k = C.UPS.findIndex((u) => u.id === 'museum'), kr = C.UPS.findIndex((u) => u.id === 'radar');
  const rows = C.ROUNDS.filter((r) => r.act === 0).map((r, i) => `<div class="ex ${st.done.includes(i) ? '' : 'no'}"><img src="${url('skel', i)}"><b>${st.done.includes(i) ? r.short : '???'}</b><small>${st.done.includes(i) ? '+' + fmt(r.income) + '/초' : '발굴 전'}</small></div>`).join('');
  const arts = st.done.filter((r) => C.ROUNDS[r].act === 1).length;
  card(`<h2>🏛 파고파고 박물관</h2><p class="dimt">전시한 공룡마다 관람 수입이 생겨요. 자리를 비워도 최대 4시간 쌓여요.</p><div class="mus">${rows}</div>${arts ? `<p>👽 외계 유물관: ${arts}곳 전시 중</p>` : ''}<p class="good">지금 수입: ${COIN()}${fmt(C.museumIncome(st))}/초</p>`,
    [[`박물관 확장 Lv${(st.lv.museum || 0) + 1} <small>관람 수입 +25% · ${COIN()}${fmt(C.upCost(st, k))}</small>`, '', () => { buyUp(k); openMuseum(); }],
     [`📡 발굴 레이더 Lv${(st.lv.radar || 0) + 1} <small>화석 위치를 반짝 · ${COIN()}${fmt(C.upCost(st, kr))}</small>`, 'w', () => { buyUp(kr); openMuseum(); }],
     ['닫기', 'w', closeCard]]);
  void done;
}
$('museum').onclick = (e) => { e.stopPropagation(); openMuseum(); };

// ---------- 광고 (보상형) — 궁수 키우기의 AdMob 브리지와 같은 방식 ----------
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
function adFor(kind) {
  if (kind === 'dyna') { const now = Date.now(); st.dynaAds = (st.dynaAds || []).filter((t) => now - t < 3600e3); if (st.dynaAds.length >= 3) return toast('🧨 광고 다이너마이트는 1시간에 3번까지예요'); card(`<div class="emo">🧨</div><h2>다이너마이트 받기</h2><p>광고를 보면 다이너마이트 1개를 받아요.</p>`, [['📺 광고 보기', 'g', (e) => showAd(e, () => { st.dynaAds.push(Date.now()); st.dyna++; closeCard(); hud(); save(); })], ['닫기', 'w', closeCard]]); }
  if (kind === 'radar') card(`<div class="emo">📡</div><h2>레이더 바로 충전</h2><p>광고를 보면 레이더를 지금 바로 쓸 수 있어요.</p>`, [['📺 광고 보기', 'g', (e) => showAd(e, () => { st.radarT = 0; closeCard(); radar(); })], ['닫기', 'w', closeCard]]);
}
$('gift').onclick = (e) => { e.stopPropagation(); if (st.boostT > 0 || st.giftCd > 0) return; card(`<div class="emo">🎁</div><h2>3분 동안 판매 값 2배</h2><p>광고를 보면 3분 동안 캐는 모든 것의 값이 2배가 돼요. (10분에 1번)</p>`, [['📺 광고 보기', 'g', (e2) => showAd(e2, () => { st.boostT = 180; st.giftCd = 600; closeCard(); hud(); save(); })], ['닫기', 'w', closeCard]]); };

// ---------- 튜토리얼 ----------
const TUT = ['👆 벽을 톡톡 두드려 보세요. 꾹 누르고 있으면 계속 파요!', '💰 모은 돈으로 아래 <b>위력</b>을 올려 보세요', '🦖 벽 속에 랩터 화석 3개가 묻혀 있어요. 오른쪽 위 칸을 모두 채우면 복원 완료!'];
function tutShow() { const t = $('tut'); if (st.tut >= TUT.length) { t.hidden = true; return; } t.innerHTML = TUT[st.tut]; t.hidden = false; if (st.tut === 2) setTimeout(() => { if (st.tut === 2) tutNext(); }, 7000); }
function tutNext() { st.tut++; tutShow(); save(); }

// ---------- 저장 ----------
function packAlive() { const b = new Uint8Array(C.N >> 3); for (let i = 0; i < C.N; i++) if (W2.alive[i]) b[i >> 3] |= 1 << (i & 7); let s = ''; for (const v of b) s += String.fromCharCode(v); return btoa(s); }
function save() { if (TEST && !Q.has('save')) return; try { st.at = Date.now(); st.wall = packAlive(); localStorage.setItem(KEY, JSON.stringify(st)); cloudStore(); } catch (e) { } }
function loadLocal() { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); return s && s.v === 2 ? s : null; } catch (e) { return null; } }
const unpack = (s) => { const b = atob(s), a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; };
const MG = window.MGH || null; let owner = null, cloudAt = null, cloudLast = 0;
function cloudStore(now) { if (!owner || (!now && Date.now() - cloudLast < 30000)) return; cloudLast = Date.now(); MG.save.store({ ...st, owner }, cloudAt || undefined).then((r) => { if (r && r.conflict) { cloudAt = r.updatedAt; return MG.save.store({ ...st, owner }, cloudAt); } return r; }).then((r) => { if (r && r.updatedAt) cloudAt = r.updatedAt; }).catch(() => { }); }
if (MG && MG.save && MG.embedded) MG.save.onAuth(async (u) => { owner = u ? u.id : null; if (!u) return; try { const r = await MG.save.load(); cloudAt = (r && r.updatedAt) || null; const d = r && r.data; if (d && d.v === 2 && d.owner === owner && (d.total || 0) > (st.total || 0)) { st = d; buildRound(st.wall ? unpack(st.wall) : null); toast('☁️ 계정 기록을 불러왔어요'); } else cloudStore(true); } catch (e) { } });

// ---------- 루프 ----------
let last = performance.now(), secT = 0, saveT = 0;
const dummy = new THREE.Object3D();
function loop(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (hold && now - lastHit > C.interval(st) * 1000) { lastHit = now; strike(hold.x, hold.y); }
  // 박물관 수입 · 타이머
  const inc = C.museumIncome(st); st.money += inc * dt; st.total += inc * dt;
  if (st.boostT > 0) st.boostT -= dt; if (st.giftCd > 0) st.giftCd -= dt; if (st.radarT > 0) st.radarT -= dt;
  if (!W2) { R.render(scene, cam); requestAnimationFrame(loop); return; }
  secT += dt; if (secT > 1) { secT = 0; hud(); } saveT += dt; if (saveT > 10) { saveT = 0; save(); }
  // 잔해
  for (let k = deb.length - 1; k >= 0; k--) { const d = deb[k]; d.t += dt; d.vy -= 9 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt; if (d.y < -3.5) { d.y = -3.5; d.vy *= -.3; d.vx *= .6; d.vz *= .6; } if (d.t > 1.2) { d.x += (-3 - d.x) * dt * 5; d.z += (3.5 - d.z) * dt * 5; } if (d.t > 1.8) deb.splice(k, 1); }
  for (let k = 0; k < DMAX; k++) { const d = deb[k]; if (d) { dummy.position.set(d.x, d.y, d.z); dummy.rotation.set(d.t * 5, d.t * 4, 0); dummy.scale.setScalar(1); dummy.updateMatrix(); dMesh.setMatrixAt(k, dummy.matrix); dMesh.setColorAt(k, col.setHex(d.c)); } else dMesh.setMatrixAt(k, ZERO); }
  dMesh.instanceMatrix.needsUpdate = true; if (dMesh.instanceColor) dMesh.instanceColor.needsUpdate = true;
  // 화면 흔들림 · 레이저
  if (shake > 0) { shake -= dt; cam.position.x = (Math.random() - .5) * shake * .4; cam.position.y = .3 + (Math.random() - .5) * shake * .4; } else { cam.position.x = 0; cam.position.y = .3; }
  bg.clearRect(0, 0, beam.width, beam.height);
  if (beamFx && beamFx.t > 0) { beamFx.t -= dt; const r = $('tool').getBoundingClientRect(), sx = r.left + r.width * .06, sy = r.top + r.height * .1; bg.lineCap = 'round'; for (const [w, c] of [[18, 'rgba(79,216,255,.35)'], [7, '#bff4ff']]) { bg.strokeStyle = c; bg.lineWidth = w; bg.beginPath(); bg.moveTo(sx * 2, sy * 2); bg.lineTo(beamFx.x * 2, beamFx.y * 2); bg.stroke(); } bg.fillStyle = 'rgba(200,250,255,.8)'; bg.beginPath(); bg.arc(beamFx.x * 2, beamFx.y * 2, 22, 0, 7); bg.fill(); }
  R.render(scene, cam); requestAnimationFrame(loop);
}

// ---------- 시작 ----------
function start() {
  $('title').hidden = true; $('hud').hidden = false;
  buildRound(st.wall ? unpack(st.wall) : null);
  // 자리 비운 동안 박물관 수입
  const away = Math.min(4 * 3600, (Date.now() - (st.at || Date.now())) / 1000), got = C.museumIncome(st) * away;
  if (got > 1 && away > 60) {
    const take = (m) => { st.money += got * m; st.total += got * m; closeCard(); hud(); save(); };
    card(`<div class="emo">🏛</div><h2>자리를 비운 동안</h2><p>${Math.floor(away / 60)}분 동안 박물관에 관람객이 다녀갔어요.</p><p class="good">${COIN()} ${fmt(got)}</p>`,
      [['받기', '', () => take(1)], ...(AD.enabled ? [[`📺 광고 보고 2배 (${COIN()}${fmt(got * 2)})`, 'g', (e) => showAd(e, () => take(2))]] : [])]);
  }
  tutShow(); save();
}
$('go').onclick = start;
if (loadLocal()) $('go').textContent = '이어서 파기';
addEventListener('visibilitychange', () => { if (document.hidden) save(); });
if (TEST) window.__dd = { C, get st() { return st; }, get W() { return W2; }, strike, buildRound, roundDone, nextRound, start, hud, found: (k) => { W2.got[k] = W2.cnt[k]; checkFossil(k); } };
requestAnimationFrame(loop);
