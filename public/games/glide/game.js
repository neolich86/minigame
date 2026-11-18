// 윈드 러너 — 3D 화면 · 입력 · HUD · 격납고 · 저장
import * as THREE from 'three';
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

// ---------- three ----------
const R = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true }); R.setPixelRatio(Math.min(2, devicePixelRatio)); R.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xf0b48c, 500, 2600); scene.background = new THREE.Color(0x1477ee);
const cam = new THREE.PerspectiveCamera(62, 1, .5, 7000);
function resize() { R.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.fov = cam.aspect < 1 ? 74 : 60; cam.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
scene.add(new THREE.HemisphereLight(0xfff1dc, 0x8a6a4a, 1.6)); const sun = new THREE.DirectionalLight(0xfff0d0, 1.4); sun.position.set(-300, 500, -400); scene.add(sun);
const TL = new THREE.TextureLoader(); const tex = (s, cb) => TL.load(s, (t) => { t.colorSpace = THREE.SRGBColorSpace; cb && cb(t); });
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

// 지역별 모습
const LOOK = [
  { sky: 'assets/sky0.webp', fog: 0xf0b48c, bg: 0x1477ee, ground: ['#c86f42', '#b85d34', '#d6845a', '#a8502c', '#e09466'], rock: ['#c4552f', '#d9744a', '#b04a2a', '#e08a5a', '#a9442a', '#cf6a40'], top: 0xd88a55 },
  { sky: 'assets/sky1.webp', fog: 0xdfeaf5, bg: 0x2f8be8, ground: ['#eef4fb', '#dbe7f3', '#ffffff', '#c9d9ea', '#b7cbe0'], rock: ['#8d97a6', '#a3adbb', '#7a8494', '#b6bfcc', '#6f7988', '#9aa4b2'], top: 0xffffff },
  { sky: 'assets/sky2.webp', fog: 0xbfe6f0, bg: 0x2a8fe6, ground: null, rock: ['#6f6a5e', '#857f70', '#5e5a50', '#9a9280', '#6a655a', '#7e786a'], top: 0x5aa04a },
];
const skyTex = LOOK.map(() => null); LOOK.forEach((L, i) => tex(L.sky, (t) => { t.wrapS = THREE.RepeatWrapping; t.repeat.set(3, 1); skyTex[i] = t; if (i === curReg) setSky(i); }));
const skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false });
const sky = new THREE.Mesh(new THREE.CylinderGeometry(3200, 3200, 2600, 48, 1, true), skyMat); scene.add(sky);
let curReg = 0;
function setSky(i) { if (skyTex[i]) { skyMat.map = skyTex[i]; skyMat.needsUpdate = true; } scene.fog.color.set(LOOK[i].fog); scene.background.set(LOOK[i].bg); }
function canvasTex(w, h, draw, rep) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rep) t.repeat.set(rep[0], rep[1]); return t; }
function groundTex(cols) { return canvasTex(256, 256, (g) => { g.fillStyle = cols[0]; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 1400; i++) { g.fillStyle = cols[1 + (i % 4)]; g.globalAlpha = .35; const s = 2 + Math.random() * 10; g.fillRect(Math.random() * 256, Math.random() * 256, s, s * .6); } }, [320, 320]); }
function rockTex(cols) { return canvasTex(64, 256, (g) => { for (let y = 0; y < 256; y += 16) { g.fillStyle = cols[(y / 16) % cols.length]; g.fillRect(0, y, 64, 16 + Math.random() * 6); } }, [4, 1]); }
// 땅 3구간 (협곡 · 설원 · 바다)
const SEG = [[700, -3000], [-3000, -6000], [-6000, -C.GOAL - 1500]];
const waterTex = canvasTex(128, 128, (g) => { g.fillStyle = '#2a9fd0'; g.fillRect(0, 0, 128, 128); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; for (let i = 0; i < 26; i++) { const x = Math.random() * 128, y = Math.random() * 128; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 6, y - 3, x + 12, y); g.stroke(); } }, [480, 480]);
SEG.forEach(([z0, z1], i) => {
  const len = z0 - z1, geo = new THREE.PlaneGeometry(7000, len, 140, Math.round(len / 50)); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let k = 0; k < p.count; k++) { const z = p.getZ(k) + (z0 + z1) / 2; p.setZ(k, z); const d = -z; p.setY(k, i === 2 ? 0 : 6 * Math.sin(d * .013) + 4 * Math.sin(d * .031 + 1) + (i === 1 ? Math.abs(p.getX(k)) * 0.02 : 0)); }
  geo.computeVertexNormals();
  const mat = i === 2 ? new THREE.MeshLambertMaterial({ map: waterTex, color: 0xbfefff }) : new THREE.MeshLambertMaterial({ map: groundTex(LOOK[i].ground) });
  scene.add(new THREE.Mesh(geo, mat));
});
const rockMat = LOOK.map((L) => [new THREE.MeshLambertMaterial({ map: rockTex(L.rock) }), new THREE.MeshLambertMaterial({ color: L.top }), new THREE.MeshLambertMaterial({ color: L.top })]);
let terrainGroup = new THREE.Group(); scene.add(terrainGroup);
// 🏁 결승선 + 하늘 섬 (도착 지점)
{ const goal = new THREE.Group(); scene.add(goal);
  const pm = new THREE.MeshLambertMaterial({ color: 0xffd34a, emissive: 0x6a4a00 });
  for (const x of [-90, 90]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(4, 5, 460, 12), pm); p.position.set(x, 230, 0); goal.add(p); }
  const chk = canvasTex(64, 64, (g) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#222' : '#fff'; g.fillRect(x * 8, y * 8, 8, 8); } }, [12, 1]);
  for (let h = 40; h <= 440; h += 100) { const b = new THREE.Mesh(new THREE.PlaneGeometry(180, 9), new THREE.MeshBasicMaterial({ map: chk, side: THREE.DoubleSide, fog: false })); b.position.set(0, h, 0); goal.add(b); }
  const curtain = new THREE.Mesh(new THREE.PlaneGeometry(180, 460), new THREE.MeshBasicMaterial({ color: 0xffe680, transparent: true, opacity: .14, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); curtain.position.y = 230; goal.add(curtain);
  const sign = canvasTex(256, 96, (g) => { g.fillStyle = '#e2382a'; g.fillRect(0, 0, 256, 96); g.strokeStyle = '#fff'; g.lineWidth = 8; g.strokeRect(4, 4, 248, 88); g.fillStyle = '#fff'; g.font = '900 60px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('GOAL', 128, 50); });
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(90, 34), new THREE.MeshBasicMaterial({ map: sign, side: THREE.DoubleSide, fog: false })); sg.position.set(0, 470, 0); goal.add(sg);
  goal.position.set(0, 0, -C.GOAL);
  // 하늘 섬: 잔디 윗면(고도 ISLE.top) + 흙 테두리 + 바위 뿌리 + 폭포 + 나무·천막·착륙 데크
  const isle = new THREE.Group(), R0 = 220, Y = C.ISLE.top, L = (c) => new THREE.MeshLambertMaterial({ color: c });
  const grass = new THREE.Mesh(new THREE.CylinderGeometry(R0, R0, 6, 40), L(0x6fc04a)); grass.position.y = Y - 3; isle.add(grass);
  const dirt = new THREE.Mesh(new THREE.CylinderGeometry(R0 + 2, R0 * .9, 26, 40), L(0x8a6a44)); dirt.position.y = Y - 19; isle.add(dirt);
  const root = new THREE.Mesh(new THREE.ConeGeometry(R0 * .9, 260, 14), L(0x7a6a58)); root.rotation.x = Math.PI; root.position.y = Y - 32 - 130; isle.add(root);
  for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + (i - 1.5) * .5, wf = new THREE.Mesh(new THREE.PlaneGeometry(16, 150), new THREE.MeshBasicMaterial({ color: 0x8fe4ff, transparent: true, opacity: .8, side: THREE.DoubleSide })); wf.position.set(Math.cos(a) * (R0 + 4), Y - 90, Math.sin(a) * (R0 + 4)); wf.lookAt(0, Y - 90, 0); isle.add(wf); }
  for (let i = 0; i < 26; i++) { const a = Math.random() * 6.283, r = 40 + Math.random() * (R0 - 60); const tr = new THREE.Group(); const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 10, 6), L(0x7a4a22)); trunk.position.y = 5; const top = new THREE.Mesh(new THREE.SphereGeometry(8 + Math.random() * 5, 10, 8), L(i % 3 ? 0x4fa83a : 0x6cc24a)); top.position.y = 15; tr.add(trunk, top); tr.position.set(Math.cos(a) * r, Y, Math.sin(a) * r); if (Math.abs(tr.position.x) < 30 && tr.position.z > 0) continue; isle.add(tr); }
  [0xe2382a, 0x3f7fe0, 0x9a4ad6, 0xf59e1b].forEach((c, i) => { const t = new THREE.Mesh(new THREE.ConeGeometry(9, 14, 8), L(c)); t.position.set(-60 + i * 40, Y + 7, -40 - (i % 2) * 30); isle.add(t); });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(40, 2, 46), L(0xa0703e)); deck.position.set(0, Y + 1, R0 - 10); isle.add(deck);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 18, 6), L(0x6b4a2a)); pole.position.set(18, Y + 10, R0 + 8); const flag = new THREE.Mesh(new THREE.PlaneGeometry(9, 6), new THREE.MeshBasicMaterial({ color: 0xe2382a, side: THREE.DoubleSide })); flag.position.set(22.5, Y + 16, R0 + 8); isle.add(pole, flag);
  isle.position.set(0, 0, -(C.ISLE.d + 60)); scene.add(isle); }

function buildTerrain() {
  scene.remove(terrainGroup); terrainGroup = new THREE.Group(); scene.add(terrainGroup);
  for (const m of C.mesaList()) { const geo = m.reg === 1 ? new THREE.CylinderGeometry(m.w * .45, m.w * 1.05, m.h * 1.3, 7, 1) : new THREE.CylinderGeometry(m.w * .85, m.w * 1.05, m.h, 7, 1); const mesh = new THREE.Mesh(geo, rockMat[m.reg]); mesh.position.set(m.lat, (m.reg === 1 ? m.h * 1.3 : m.h) / 2, -m.d); mesh.rotation.y = m.d; terrainGroup.add(mesh); }
  for (let i = 0; i < 150; i++) { const d = Math.random() * (C.GOAL + 800), reg = Math.min(2, C.regionAt(d)), side = Math.random() < .5 ? -1 : 1, h = (reg === 1 ? 180 : 60) + Math.random() * (reg === 1 ? 320 : 140), w = 80 + Math.random() * 200;
    const geo = reg === 1 ? new THREE.ConeGeometry(w * 1.2, h, 7) : new THREE.CylinderGeometry(w * .85, w * 1.05, h, 7); const mesh = new THREE.Mesh(geo, rockMat[reg]); mesh.position.set(side * (420 + Math.random() * 1400), h / 2, -d); terrainGroup.add(mesh); }
  // 길가 덤불·돌·눈 바위: 비행 경로 양옆에 촘촘히 (가까이 지나가는 물체로 속도감)
  const n = 1400, dummy = new THREE.Object3D();
  const bush = new THREE.InstancedMesh(new THREE.ConeGeometry(2.2, 5, 6), new THREE.MeshLambertMaterial({ color: 0xffffff }), n), rock = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1.8), new THREE.MeshLambertMaterial({ color: 0xffffff }), n);
  const col = new THREE.Color(); let bi = 0, ri = 0;
  for (let k = 0; k < n * 2; k++) {
    const d = (k / (n * 2)) * 6000 + Math.random() * 4, reg = C.regionAt(d), lat = (Math.random() - .5) * 180, sc = .6 + Math.random() * 1.4;
    if (reg >= 2) continue;
    dummy.position.set(lat, C.baseGround(d) + (reg === 1 ? Math.abs(lat) * .02 : 0), -d); dummy.rotation.set(0, Math.random() * 6, 0); dummy.scale.setScalar(sc); dummy.updateMatrix();
    if (k % 2 && bi < n) { bush.setMatrixAt(bi, dummy.matrix); bush.setColorAt(bi, col.set(reg === 1 ? 0x2f6b45 : 0x6f8a3a)); bi++; }
    else if (ri < n) { rock.setMatrixAt(ri, dummy.matrix); rock.setColorAt(ri, col.set(reg === 1 ? 0xeef4fb : 0x9a4a2a)); ri++; }
  }
  bush.count = bi; rock.count = ri; terrainGroup.add(bush, rock);
}
const coinGeo = new THREE.CylinderGeometry(2.6, 2.6, .5, 20); coinGeo.rotateX(Math.PI / 2);
const coinMat = new THREE.MeshLambertMaterial({ color: 0xffd23a, emissive: 0xb07800, fog: false });
const coinObjs = new Map();   // 코인 줄 → 메쉬 목록
// 출발 절벽 + 점프대
const cliffMat = rockMat[0];
const cliff = new THREE.Mesh(new THREE.BoxGeometry(260, 1, 500), cliffMat); scene.add(cliff);
const RAMP_D = -70;
const ramp = new THREE.Group(); scene.add(ramp);
{ const deck = new THREE.Mesh(new THREE.BoxGeometry(8, 1.2, -RAMP_D), new THREE.MeshLambertMaterial({ color: 0x8a5a2e })); ramp.add(deck); for (const s of [-4.2, 4.2]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(.5, 1.6, -RAMP_D), new THREE.MeshLambertMaterial({ color: 0x5a3416 })); rail.position.set(s, .7, 0); ramp.add(rail); } }
function placeCliff(y) { cliff.scale.y = y - 4; cliff.position.set(0, (y - 4) / 2, 250); ramp.position.set(0, y - 2, -RAMP_D / 2); ramp.rotation.x = -.11; }
// 글라이더
const gMat = new THREE.SpriteMaterial({ color: 0xffffff }); const glider = new THREE.Sprite(gMat); glider.scale.set(10, 6.6, 1); scene.add(glider);
const gTex = {}; function setGliderTex() { const i = Math.max(0, C.GLIDERS.findIndex((g) => g.id === st.glider)); const use = (t) => { gMat.map = t; gMat.needsUpdate = true; glider.scale.set(10.5, 10.5 * t.image.height / t.image.width, 1); }; if (gTex[i]) use(gTex[i]); else tex(`assets/g${i}.webp`, (t) => { gTex[i] = t; use(t); }); }
// 로켓 불꽃
const flame = new THREE.Mesh(new THREE.ConeGeometry(.9, 5, 10), new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false })); flame.visible = false; scene.add(flame);
// 링
let ringTex = null; tex('assets/ring.webp', (t) => ringTex = t);
const ringObjs = new Map();
function ringMesh(rr) {
  const g = new THREE.Group(), R2 = rr * 1.15;
  if (ringTex) g.add(new THREE.Mesh(new THREE.PlaneGeometry(R2 * 2.3, R2 * 2.3), new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, side: THREE.DoubleSide, depthWrite: false, fog: false })));
  else g.add(new THREE.Mesh(new THREE.TorusGeometry(R2, .9, 10, 40), new THREE.MeshBasicMaterial({ color: 0xffd34a, fog: false })));
  g.add(new THREE.Mesh(new THREE.RingGeometry(R2 * 1.05, R2 * 1.5, 40), new THREE.MeshBasicMaterial({ color: 0xffe680, transparent: true, opacity: .35, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false, fog: false })));
  scene.add(g); return g;
}
// 날개 끝 바람 자국
function ribbon() { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(60 * 2 * 3), 3)); const idx = []; for (let i = 0; i < 59; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } geo.setIndex(idx); const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x6fd8ff, transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false })); m.frustumCulled = false; scene.add(m); return { m, pts: [] }; }
const trails = [ribbon(), ribbon()];
const NP = 220, sp = new Float32Array(NP * 3); const speedPts = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(sp, 3)), new THREE.PointsMaterial({ color: 0xffffff, size: .35, transparent: true, opacity: 0, depthWrite: false })); speedPts.frustumCulled = false; scene.add(speedPts);
for (let i = 0; i < NP; i++) { sp[i * 3] = (Math.random() - .5) * 40; sp[i * 3 + 1] = (Math.random() - .5) * 26; sp[i * 3 + 2] = -Math.random() * 80; }

// ---------- 조작 ----------
let f = null, state = 'title', ctl = null, inTurn = 0, inPitch = -0.14, bank = 0, launchT = 0, rocketHold = false, revived = false;
const keys = {}; addEventListener('keydown', (e) => { keys[e.code] = 1; if (e.code === 'Space') rocketHold = true; }); addEventListener('keyup', (e) => { keys[e.code] = 0; if (e.code === 'Space') rocketHold = false; });
$('c').addEventListener('pointerdown', (e) => { if (state !== 'fly' && state !== 'launch') return; ctl = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0 }; const j = $('joy'); j.style.left = e.clientX + 'px'; j.style.top = e.clientY + 'px'; j.style.display = 'block'; $('joyK').style.transform = ''; });
addEventListener('pointermove', (e) => { if (!ctl || e.pointerId !== ctl.id) return; let dx = e.clientX - ctl.x, dy = e.clientY - ctl.y; const d = Math.hypot(dx, dy), m = 55; if (d > m) { dx *= m / d; dy *= m / d; } ctl.dx = dx / m; ctl.dy = dy / m; $('joyK').style.transform = `translate(${dx}px,${dy}px)`; });
const endCtl = (e) => { if (ctl && e.pointerId === ctl.id) { ctl = null; $('joy').style.display = 'none'; } }; addEventListener('pointerup', endCtl); addEventListener('pointercancel', endCtl);
const rb = $('rocket');
rb.addEventListener('pointerdown', (e) => { e.stopPropagation(); rocketHold = true; rb.setPointerCapture(e.pointerId); });
rb.addEventListener('pointerup', () => rocketHold = false); rb.addEventListener('pointercancel', () => rocketHold = false);

// ---------- 화면 전환 ----------
const show = (id) => { for (const s of document.querySelectorAll('.scr')) s.classList.toggle('on', s.id === id); };
function titleInfo() { $('tCoins').textContent = `🪙 ${fmt(st.coins)} · 최고 ${fmt(st.best)}m`; $('bFlyAd').hidden = !AD.enabled || !(st.lv.rocket > 0) && st.flights < 1; }
function hudVisible(v) { for (const id of ['prog', 'hint']) $(id).style.visibility = v ? '' : 'hidden'; document.querySelector('.hud').style.visibility = v ? '' : 'hidden'; document.querySelector('.bar').style.visibility = v ? '' : 'hidden'; }
function start(adFuel) {
  C.terrainSeed(Math.floor(Math.random() * 1e6)); buildTerrain(); setGliderTex();
  f = C.newFlight(st, { adFuel }); placeCliff(f.st.startY); revived = false;
  state = 'launch'; launchT = 0; curReg = 0; setSky(0); ctl = null; rocketHold = false;
  for (const t of trails) t.pts = []; for (const [, o] of ringObjs) scene.remove(o); ringObjs.clear(); for (const [, ms] of coinObjs) ms.forEach((m) => scene.remove(m)); coinObjs.clear();
  show(''); hudVisible(true); $('hint').style.opacity = 1; rb.hidden = !(f.fuelMax > 0); buildProg();
  camPos.set(0, f.st.startY + 6, 30);
}
function buildProg() { const p = $('prog'); p.querySelectorAll('b,em').forEach((x) => x.remove()); for (const r of C.REGIONS.slice(1)) { const b = document.createElement('b'), em = document.createElement('em'); const x = r.from / C.GOAL * 100; b.style.left = x + '%'; em.style.left = Math.min(94, x) + '%'; em.textContent = ['', '🏔', '🌊', '🏝'][C.REGIONS.indexOf(r)]; p.append(b, em); } if (st.best > 0) { const b = document.createElement('b'); b.style.left = Math.min(100, st.best / C.GOAL * 100) + '%'; b.style.background = '#ff5a3c'; b.title = '최고 기록'; p.append(b); } }
$('bFly').onclick = () => start(false);
$('bFlyAd').onclick = (e) => showAd(e.currentTarget, () => { e.currentTarget.disabled = false; e.currentTarget.textContent = '📺 로켓 연료 +3초 달고 날기'; start(true); });
$('bHangar').onclick = () => openHangar('up');
$('hBack').onclick = () => { show('sTitle'); titleInfo(); };
$('hFly').onclick = () => start(false);

function landed() {
  state = 'land'; ctl = null; $('joy').style.display = 'none'; rocketHold = false;
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
    el.innerHTML = `<div class="ic"><img src="assets/g${i}.webp" alt=""></div><div class="tx"><b>${g.name}</b><small>활공력 +${Math.round((1 / g.drag - 1) * 100)}% · ${g.desc}</small></div><button class="${own ? 'own' : ''}" ${!own && st.coins < g.price ? 'disabled' : ''}>${sel ? '타는 중' : own ? '타기' : '🪙 ' + fmt(g.price)}</button>`;
    el.querySelector('button').onclick = () => { if (sel) return; if (!own) { if (st.coins < g.price) return; st.coins -= g.price; st.owned.push(g.id); toast(`🪂 ${g.name} 구매!`); } st.glider = g.id; save(); setGliderTex(); openHangar('gl'); };
    L.append(el);
  });
}

// ---------- 루프 ----------
const camPos = v3(0, 206, 30), camLook = v3(0, 200, -40);
let goalT = 0, gS = null;
let last = performance.now(), T = 0, bannerT = 0;
function loop(now) { requestAnimationFrame(loop); const dt = Math.min(.05, (now - last) / 1000); last = now; if (!MANUAL) tick(dt); }
function banner(t, s) { const b = $('banner'); b.innerHTML = `${t}<small>${s || ''}</small>`; b.style.opacity = 1; clearTimeout(bannerT); bannerT = setTimeout(() => b.style.opacity = 0, 2400); }
function confetti() { const box = document.createElement('div'); box.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:6;overflow:hidden'; document.body.append(box);
  for (let i = 0; i < 90; i++) { const c = document.createElement('i'), x = Math.random() * 100, dx = (Math.random() - .5) * 40, rot = Math.random() * 720; c.style.cssText = `position:absolute;left:${x}%;top:-20px;width:${6 + Math.random() * 6}px;height:${10 + Math.random() * 8}px;background:${['#ffd34a', '#ff6a5a', '#5ad1ff', '#7be07b', '#ff9ad8', '#fff'][i % 6]};border-radius:2px;transition:transform ${2 + Math.random() * 1.5}s cubic-bezier(.2,.6,.4,1),opacity 1s ${2.2 + Math.random()}s;`;
    box.append(c); requestAnimationFrame(() => requestAnimationFrame(() => { c.style.transform = `translate(${dx}vw, ${100 + Math.random() * 20}vh) rotate(${rot}deg)`; c.style.opacity = 0; })); }
  setTimeout(() => box.remove(), 4500); }
function pop(t) { const p = $('pop'); p.textContent = t; p.classList.remove('go'); void p.offsetWidth; p.classList.add('go'); }
let lastGot = 0, lastPicked = 0;
function tick(dt, noRender) {
  T += dt;
  let tx = ctl ? ctl.dx : 0, ty = ctl ? ctl.dy : 0; if (keys.ArrowLeft || keys.KeyA) tx = -1; if (keys.ArrowRight || keys.KeyD) tx = 1; if (keys.ArrowUp || keys.KeyW) ty = -1; if (keys.ArrowDown || keys.KeyS) ty = 1;
  inTurn += (tx - inTurn) * Math.min(1, dt * 6); inPitch = -0.14 + (-ty) * (ty < 0 ? 0.48 : 0.5);
  if (f && state === 'launch') { launchT += dt; f.d = RAMP_D + Math.min(1, launchT / 1.4) ** 2 * -RAMP_D; f.y = f.st.startY + 1 + (f.d - RAMP_D) * .11; if (launchT >= 1.4) { f.d = 0; f.y = f.st.startY + 4; state = 'fly'; lastGot = 0; lastPicked = 0; } }
  else if (f && state === 'fly') {
    C.step(f, { pitch: inPitch, turn: inTurn, rocket: rocketHold }, dt * C.PACE);
    if (f.t > (st.tut ? 4 : 9)) $('hint').style.opacity = 0;
    if (f.got > lastGot) { pop(`⭕ 링 통과! 상승!`); lastGot = f.got; }
    if (f.picked > lastPicked) { lastPicked = f.picked; }
    if (f.bounces && f.bounces > (f._b || 0)) { f._b = f.bounces; pop('🛡️ 튕겨 올랐다!'); }
    const reg = Math.min(2, C.regionAt(f.d)); if (reg !== curReg) { curReg = reg; setSky(reg); banner(C.REGIONS[reg].name, `${fmt(C.REGIONS[reg].from)} m 돌파!`); }
    if (f.over && f.goal) { state = 'goal'; goalT = 0; gS = { d: f.d, y: f.y, lat: f.lat || 0, yaw: f.yaw || 0 }; ctl = null; $('joy').style.display = 'none'; rocketHold = false; }
    else if (f.over) landed();
  }  else if (f && state === 'goal') {   // 🏁 결승선 통과 → 하늘 섬 착륙장으로 자동 비행
    goalT += dt; const k = Math.min(1, goalT / 2.6), e = k * k * (3 - 2 * k);
    f.d = gS.d + (C.ISLE.d - 70 - gS.d) * e; f.y = gS.y + (C.ISLE.top + 3 - gS.y) * e + Math.sin(k * Math.PI) * 25; f.lat = gS.lat * (1 - e); f.yaw = gS.yaw * (1 - e); f.a = (1 - k) * 0.25 - 0.05;
    if (goalT > 0.2 && !gS.party) { gS.party = true; banner('🏁 GOAL!', '하늘 섬에 도착했어요!'); confetti(); }
    if (goalT > 3.8 && !gS.done) { gS.done = true; result(); }
  }

  const d = f ? f.d : RAMP_D + 10, y = f ? f.y : 206, lat = f ? f.lat : 0, yaw = f ? f.yaw : 0, a = f ? f.a : 0;
  const fw = v3(Math.sin(yaw), 0, -Math.cos(yaw)), right = v3(Math.cos(yaw), 0, Math.sin(yaw));
  const gpos = v3(lat, y, -d); glider.position.copy(gpos);
  bank += ((state === 'fly' ? inTurn : 0) * 0.55 - bank) * Math.min(1, dt * 5); gMat.rotation = -bank;
  // 로켓 불꽃
  const on = f && f.rocketOn && state === 'fly'; flame.visible = !!on;
  if (on) { flame.position.copy(gpos).addScaledVector(fw, -3).add(v3(0, -.5, 0)); flame.lookAt(gpos.clone().addScaledVector(fw, -20)); flame.rotateX(Math.PI / 2); flame.scale.set(1, .8 + Math.random() * .5, 1); }
  if (f) { rb.style.setProperty('--f', (f.fuelMax ? f.fuel / f.fuelMax * 100 : 0) + '%'); rb.classList.toggle('on', !!on); rb.classList.toggle('empty', f.fuel <= 0); }
  // 카메라
  const back = 17 + (f ? Math.max(0, f.v - 25) * .12 : 0);
  // 비스듬한 뷰: 카메라를 오른쪽 위 뒤에 두고, 글라이더는 화면 왼쪽 아래 → 앞 경로(링·코인)가 가운데에 잘 보임
  const want = gpos.clone().addScaledVector(fw, -back).addScaledVector(right, cam.aspect < 1 ? 4.5 : 7.5).add(v3(0, 9.5 - a * 6, 0));
  camPos.lerp(want, Math.min(1, dt * 5)); cam.position.copy(camPos);
  camLook.lerp(gpos.clone().addScaledVector(fw, 70).addScaledVector(right, cam.aspect < 1 ? 1 : 3).add(v3(0, a * 25 - 1, 0)), Math.min(1, dt * 6)); cam.lookAt(camLook); cam.rotateZ(-bank * .35);
  { const base = cam.aspect < 1 ? 74 : 60, want = base + (f && state === 'fly' ? Math.min(16, Math.max(0, f.v - 22) * .45) + (f.boostT > 0 || f.rocketOn ? 6 : 0) : 0); if (Math.abs(cam.fov - want) > .05) { cam.fov += (want - cam.fov) * Math.min(1, dt * 3); cam.updateProjectionMatrix(); } }
  sky.position.set(cam.position.x, 700, cam.position.z);
  // 링 · 코인
  if (f) {
    for (const r of f.rings) { if (!ringObjs.has(r)) { const o = ringMesh(f.st.ringR); o.position.set(r.lat, r.y, -r.d); o.rotation.y = -r.yaw; ringObjs.set(r, o); } const o = ringObjs.get(r); o.children[o.children.length - 1].material.opacity = .25 + .15 * Math.sin(T * 6); if (r.hit) { r.ht = (r.ht || 0) + dt; o.scale.setScalar(1 + r.ht * 3); o.traverse((m) => { if (m.material) { m.material.transparent = true; m.material.opacity = Math.max(0, .9 - r.ht * 2); } }); } }
    for (const [r, o] of ringObjs) if (!f.rings.includes(r)) { scene.remove(o); ringObjs.delete(r); }
    const nr = f.rings.find((r) => !r.hit && !r.miss && r.d > f.d), ra = $('ringAim');
    if (nr && state === 'fly') { const p = v3(nr.lat, nr.y, -nr.d).project(cam); if (p.z < 1) { ra.style.display = 'block'; ra.style.left = Math.max(20, Math.min(innerWidth - 20, (p.x + 1) / 2 * innerWidth)) + 'px'; ra.style.top = Math.max(90, Math.min(innerHeight - 90, (1 - p.y) / 2 * innerHeight)) + 'px'; } else ra.style.display = 'none'; } else ra.style.display = 'none';
    for (const c of f.coinRows) { if (!coinObjs.has(c)) { const ms = []; for (let i = 0; i < c.n; i++) { const m = new THREE.Mesh(coinGeo, coinMat); const p = C.coinPos(c, i); m.position.set(p.lat, p.y, -p.d); scene.add(m); ms.push(m); } coinObjs.set(c, ms); }
      coinObjs.get(c).forEach((m, i) => { if (c.got & (1 << i)) { if (m.visible) { m.scale.multiplyScalar(1.2); m.position.y += dt * 20; if (m.scale.x > 2.5) m.visible = false; } } else m.rotation.y += dt * 3; }); }
    for (const [c, ms] of coinObjs) if (!f.coinRows.includes(c)) { ms.forEach((m) => scene.remove(m)); coinObjs.delete(c); }
  }
  // 날개 끝 리본
  if (f && state === 'fly') {
    const boost = f.boostT > 0 || f.liftT > 0 || f.rocketOn;
    trails.forEach((t, k) => { const tip = gpos.clone().addScaledVector(right, (k ? 1 : -1) * 4.6).add(v3(0, 1.2 + (k ? -1 : 1) * bank * 2.5, 0)); t.pts.unshift(tip); if (t.pts.length > 60) t.pts.pop(); while (t.pts.length > 2 && t.pts[t.pts.length - 1].distanceTo(tip) > 13) t.pts.pop(); t.m.material.color.set(boost ? 0xffe066 : 0x6fd8ff);
      const pa = t.m.geometry.attributes.position; for (let i = 0; i < 60; i++) { const p = t.pts[Math.min(i, t.pts.length - 1)]; const w = .22 * (1 - i / 60); pa.setXYZ(i * 2, p.x, p.y + w, p.z); pa.setXYZ(i * 2 + 1, p.x, p.y - w, p.z); } pa.needsUpdate = true; });
  }
  const sv = f ? Math.max(0, (f.v - 28) / 30) + (f.boostT > 0 || f.rocketOn ? .6 : 0) : 0; speedPts.material.opacity = Math.min(.8, sv);
  speedPts.position.copy(cam.position); speedPts.quaternion.copy(cam.quaternion);
  for (let i = 0; i < NP; i++) { sp[i * 3 + 2] += dt * (f ? f.v : 0) * 1.4; if (sp[i * 3 + 2] > 0) { sp[i * 3 + 2] = -80; sp[i * 3] = (Math.random() - .5) * 40; sp[i * 3 + 1] = (Math.random() - .5) * 26; } } speedPts.geometry.attributes.position.needsUpdate = true;
  waterTex.offset.y = T * 0.02;
  if (f) {
    $('dist').textContent = `${fmt(Math.max(0, Math.min(C.GOAL, f.d)))} m`; $('alt').textContent = Math.max(0, Math.round(f.y - C.ground(Math.max(0, f.d), f.lat))); $('rings').textContent = f.got; $('cn').textContent = f.picked;
    $('spd').textContent = `${Math.round(f.v * 3.6 * C.PACE)} km/h`; $('vbar').style.width = Math.min(100, f.v / C.VMAX * 100) + '%'; $('vb').className = 'b' + (f.boostT > 0 || f.rocketOn ? ' boost' : '');
    $('stall').style.opacity = f.stall > .2 ? 1 : 0; const pr = Math.max(0, Math.min(1, f.d / C.GOAL)); $('progI').style.width = pr * 100 + '%'; $('progMe').style.left = pr * 100 + '%';
  }
  if (!noRender) R.render(scene, cam);
}
// 대기 화면: 점프대에 서 있는 모습
placeCliff(200); C.terrainSeed(1); buildTerrain(); setGliderTex(); hudVisible(false); titleInfo();
requestAnimationFrame(loop);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
if (TEST) window.__gl = { get st() { return st; }, set st(v) { st = v; }, get f() { return f; }, get state() { return state; }, start, tick, C, set ctl(v) { ctl = v; }, set rocket(v) { rocketHold = v; }, openHangar, result };
