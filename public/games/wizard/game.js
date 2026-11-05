// 마법사 키우기 — 1인칭 필드 서바이벌
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { bolt3d, glowBall, groundRing, vortexMat, voidCore, dotT } from './fx3d.js';

const $ = (id) => document.getElementById(id);
const Q = new URLSearchParams(location.search);
const TEST = Q.has('test');
const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ============================================================ 렌더러
const renderer = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: false, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
let DPR = Q.has('hd') ? devicePixelRatio : Math.min(devicePixelRatio || 1, 1.5);
let W = innerWidth, H = innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, W / H, .05, 400);
camera.rotation.order = 'YXZ';
const vm = new THREE.Scene();
const vmCam = new THREE.PerspectiveCamera(50, W / H, .01, 10);
let composer, bloom, useBloom = true;
const ov = $('ov'), og = ov.getContext('2d');
function resize() {
  W = innerWidth; H = innerHeight;
  renderer.setPixelRatio(DPR); renderer.setSize(W, H, false);
  $('gl').style.width = W + 'px'; $('gl').style.height = H + 'px';
  camera.aspect = vmCam.aspect = W / H;
  camera.fov = H > W ? 74 : 62; camera.updateProjectionMatrix(); vmCam.updateProjectionMatrix();
  if (composer) { composer.setPixelRatio(DPR); composer.setSize(W, H); bloom.resolution.set(W / 2, H / 2); }
  ov.width = W * DPR; ov.height = H * DPR; ov.style.width = W + 'px'; ov.style.height = H + 'px';
  placeStaff();
}
addEventListener('resize', resize);

// 하늘 · 빛
scene.add(new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { a: { value: new THREE.Color(0x3d6fc4) }, b: { value: new THREE.Color(0x8cb8ec) }, c: { value: new THREE.Color(0xffdca8) } },
  vertexShader: 'varying vec3 p;void main(){p=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: 'uniform vec3 a,b,c;varying vec3 p;void main(){float h=p.y;vec3 col=h>0.12?mix(b,a,smoothstep(.12,.6,h)):mix(c,b,smoothstep(-.02,.12,h));gl_FragColor=vec4(col,1.);}',
})));
scene.fog = new THREE.Fog(0xcfe0ea, 34, 110);
scene.add(new THREE.HemisphereLight(0xdfeaff, 0x4a5a3a, 1.25));
const sun = new THREE.DirectionalLight(0xfff0d0, 1.8); sun.position.set(-30, 40, -60); scene.add(sun);
scene.add(new THREE.AmbientLight(0xffffff, .55));
vm.add(new THREE.HemisphereLight(0xeef2ff, 0x404050, 1.6));
{ const s = new THREE.DirectionalLight(0xfff2e0, 1.6); s.position.set(-1, 2, 1); vm.add(s); }

// 풀밭
let seed = 31; const srnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
{
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#7ec04e'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 260; i++) {
    const x = srnd() * 256, y = srnd() * 256, r = 6 + srnd() * 22; g.fillStyle = ['#8ccc58', '#73b545', '#93d260'][(srnd() * 3) | 0] + '88';
    for (const dx of [-256, 0, 256]) for (const dy of [-256, 0, 256]) { g.beginPath(); g.ellipse(x + dx, y + dy, r, r * .7, 0, 0, 7); g.fill(); }
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(30, 30); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshLambertMaterial({ map: t })); gr.rotation.x = -Math.PI / 2; scene.add(gr);
}
const ARENA = 27; // 플레이어가 다닐 수 있는 반경

// ============================================================ 에셋
const TL = new THREE.TextureLoader();
const near = (t) => { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace; return t; };
const FX = {};
async function loadFx(n) { const [m, t] = await Promise.all([fetch(`assets/fx/${n}.json`).then((r) => r.json()), TL.loadAsync(`assets/fx/${n}.png`)]); FX[n] = { m, t: near(t) }; }
async function loadStrip(n, fw, pv, dur = 70, grid) {
  const t = near(await TL.loadAsync(`assets/fx/${n}.png`)); const h = grid ? grid : t.image.height; const cols = Math.floor(t.image.width / fw), rows = Math.floor(t.image.height / h);
  const f = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) f.push([c * fw, r * h, f.length, dur]);
  FX[n] = { t, m: { w: fw, h, pv: pv || [fw / 2, h / 2], f } };
}
const MON = {};
async function loadMon(k) { MON[k] = near(await TL.loadAsync(`assets/mon/${k}.png`)); }
const NAT = {};
async function loadNature() {
  const L = new GLTFLoader();
  const names = ['Tree_1_A', 'Tree_1_B', 'Tree_2_A', 'Tree_2_C', 'Tree_3_A', 'Tree_4_A', 'Tree_4_B', 'Tree_Bare_1_A', 'Bush_1_A', 'Bush_2_C', 'Bush_4_A', 'Rock_1_A', 'Rock_1_E', 'Rock_2_B', 'Rock_3_A', 'Rock_3_E', 'Grass_1_A', 'Grass_2_A', 'Grass_2_C'];
  await Promise.all(names.map(async (n) => { const g = await L.loadAsync(`assets/n/${n}_Color1.gltf`); let mesh; g.scene.traverse((o) => { if (o.isMesh && !mesh) mesh = o; }); NAT[n] = { geo: mesh.geometry, mat: mesh.material }; }));
}
let staff, crystalLocal = v3(0, 1.18, 0), staffBase = { p: v3(), r: new THREE.Euler() };
async function loadStaff() {
  const gl = await new GLTFLoader().loadAsync('assets/w/staff_B.gltf');
  staff = new THREE.Group(); staff.add(gl.scene);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,210,150,.95)'); gr.addColorStop(.35, 'rgba(255,140,60,.45)'); gr.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  glow.scale.setScalar(.9); glow.position.copy(crystalLocal); staff.add(glow); staff.userData.glow = glow;
  const pl = new THREE.PointLight(0xffa060, 2, 2); pl.position.copy(crystalLocal); staff.add(pl);
  staff.scale.setScalar(.185); vm.add(staff); placeStaff();
}
function placeStaff() {
  if (!staff) return; const port = H > W;
  staffBase.p.set(port ? .17 : .3, port ? -.36 : -.3, -.7); staffBase.r.set(-.5, .4, .28);
  staff.position.copy(staffBase.p); staff.rotation.copy(staffBase.r);
}
// 마나 보호막 (Pipoya HEX Shield) — 화면 앞에 잠깐 비치는 육각 보호막
let hexSprite;

// ============================================================ 숲
const OBST = []; // [x, z, 반경, 'tree'|'rock']
function plant(n, list) {
  if (!list.length) return; const { geo, mat } = NAT[n];
  const im = new THREE.InstancedMesh(geo, mat, list.length); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  list.forEach(([x, z, sc, ry], i) => { e.set(0, ry, 0); q.setFromEuler(e); m4.compose(v3(x, 0, z), q, v3(sc, sc, sc)); im.setMatrixAt(i, m4); });
  scene.add(im);
}
function buildForest() {
  seed = 77; const pick = (a) => a[(srnd() * a.length) | 0];
  const B = {}; const put = (n, x, z, sc) => { (B[n] = B[n] || []).push([x, z, sc, srnd() * 6.28]); };
  const trees = ['Tree_1_A', 'Tree_1_B', 'Tree_2_A', 'Tree_2_C', 'Tree_3_A', 'Tree_4_A', 'Tree_4_B'];
  for (let i = 0; i < 460; i++) { const a = srnd() * 6.283, r = 31 + srnd() * 60; put(srnd() < .05 ? 'Tree_Bare_1_A' : pick(trees), Math.cos(a) * r, Math.sin(a) * r, 1.5 + srnd() * .9); if (r < 48) OBST.push([Math.cos(a) * r, Math.sin(a) * r, 0, 'tree']); }
  for (let i = 0; i < 22; i++) {
    const a = srnd() * 6.283, r = 9 + srnd() * 16, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (OBST.some((o) => o[2] && Math.hypot(o[0] - x, o[1] - z) < 6)) continue;
    const n = pick(['Rock_1_E', 'Rock_3_E', 'Bush_2_C', 'Rock_2_B', 'Tree_3_A', 'Rock_1_E']); const sc = 1.3 + srnd(); put(n, x, z, sc);
    OBST.push([x, z, n.startsWith('Tree') ? .8 : n.startsWith('Bush') ? .9 * sc : .55 * sc, n.startsWith('Tree') ? 'tree' : 'rock']);
  }
  for (let i = 0; i < 700; i++) { const a = srnd() * 6.283, r = 3 + srnd() * 45; put(pick(['Grass_1_A', 'Grass_2_A', 'Grass_2_C', 'Bush_1_A']), Math.cos(a) * r, Math.sin(a) * r, .7 + srnd() * .6); }
  for (const n in B) plant(n, B[n]);
}

// ============================================================ 스프라이트 이펙트
function fxSprite(n, pos, k, o = {}) {
  const { m, t } = FX[n]; const tex = t.clone(); tex.needsUpdate = true;
  tex.repeat.set(m.w / t.image.width, m.h / t.image.height);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending, rotation: o.rot || 0, opacity: o.op ?? 1 });
  const s = new THREE.Sprite(mat); const pv = o.pv || m.pv; s.center.set(pv[0] / m.w, 1 - pv[1] / m.h);
  s.scale.set(m.w * k * (o.sx || 1), m.h * k, 1); s.position.copy(pos); s.renderOrder = o.ro || 5; scene.add(s); return s;
}
function setFrame(s, n, i) { const { m, t } = FX[n]; const f = m.f[clamp(i, 0, m.f.length - 1)]; s.material.map.offset.set(f[0] / t.image.width, 1 - (f[1] + m.h) / t.image.height); }
function killSprite(s) { scene.remove(s); s.material.map.dispose(); s.material.dispose(); }
// 프레임 애니메이션 → effects 목록에 들어감
function anim(n, pos, k, o = {}) {
  const s = fxSprite(n, pos, k, o); const d = FX[n].m.f.map((f) => f[3] * (o.speed || 1) / 1000); const tot = d.reduce((a, b) => a + b, 0);
  let t = -(o.delay || 0) + (o.skip || 0); s.visible = false;
  const fx = { s, update(dt) {
    t += dt; if (t < 0) return true; if (o.follow) s.position.copy(o.follow());
    if (t >= tot) { if (o.loop && (!o.until || t < o.until)) t %= tot; else { killSprite(s); return false; } }
    let tt = t, i = 0; while (i < d.length - 1 && tt >= d[i]) { tt -= d[i]; i++; } setFrame(s, n, i); s.visible = true; return true;
  }, kill() { killSprite(s); } };
  effects.push(fx); return fx;
}
function fxIcon(n, frame) {
  const { m, t } = FX[n]; const f = m.f[Math.min(frame, m.f.length - 1)]; const s = Math.max(m.w, m.h), q = document.createElement('canvas'); q.width = q.height = s;
  q.getContext('2d').drawImage(t.image, f[0], f[1], m.w, m.h, (s - m.w) / 2, (s - m.h) / 2, m.w, m.h); return q;
}

// ============================================================ 소리 (간단한 합성음)
let AC; const sfxVol = .5; let lastSfx = {};
function audio() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch { } } if (AC && AC.state === 'suspended') AC.resume(); }
function noiseBuf() { const b = AC.createBuffer(1, AC.sampleRate * .6, AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
let NB;
function sfx(kind) {
  if (!AC || AC.state !== 'running') return; const now = AC.currentTime; if (lastSfx[kind] && now - lastSfx[kind] < .05) return; lastSfx[kind] = now;
  NB = NB || noiseBuf(); const g = AC.createGain(); g.connect(AC.destination);
  const noise = (dur, f0, f1, vol, type = 'lowpass') => { const s = AC.createBufferSource(); s.buffer = NB; const f = AC.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(f0, now); f.frequency.exponentialRampToValueAtTime(f1, now + dur); s.connect(f); f.connect(g); g.gain.setValueAtTime(vol * sfxVol, now); g.gain.exponentialRampToValueAtTime(.001, now + dur); s.start(now); s.stop(now + dur); };
  const tone = (dur, f0, f1, vol, type = 'sine', at = 0) => { const o = AC.createOscillator(), gg = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f0, now + at); o.frequency.exponentialRampToValueAtTime(f1, now + at + dur); gg.gain.setValueAtTime(vol * sfxVol, now + at); gg.gain.exponentialRampToValueAtTime(.001, now + at + dur); o.connect(gg); gg.connect(AC.destination); o.start(now + at); o.stop(now + at + dur); };
  if (kind === 'cast') noise(.18, 1800, 300, .12);
  else if (kind === 'boom') noise(.35, 900, 80, .3);
  else if (kind === 'big') { noise(.8, 600, 40, .5); tone(.5, 90, 30, .3, 'sine'); }
  else if (kind === 'zap') { noise(.25, 6000, 1500, .22, 'highpass'); tone(.12, 900, 200, .08, 'square'); }
  else if (kind === 'frost') noise(.4, 5000, 2000, .18, 'bandpass');
  else if (kind === 'hole') tone(1.2, 220, 40, .25, 'sawtooth');
  else if (kind === 'hurt') tone(.15, 200, 80, .2, 'square');
  else if (kind === 'gem') tone(.06, 1400, 1800, .05, 'sine');
  else if (kind === 'lvl') [523, 659, 784, 1046].forEach((f, i) => tone(.18, f, f, .15, 'triangle', i * .07));
  else if (kind === 'dash') noise(.2, 3000, 600, .15, 'bandpass');
  else if (kind === 'shield') tone(.25, 1200, 600, .12, 'triangle');
  else if (kind === 'boss') { tone(1.2, 70, 50, .4, 'sawtooth'); noise(1, 300, 60, .3); }
}

// ============================================================ 게임 데이터
const MTYPES = [ // 궁수 키우기 몬스터 (t = 등장 시각 초)
  { k: 'mon1', t: 0, hp: 11, spd: 40, dmg: 7, xp: 2, size: 60, name: '초록 슬라임' },
  { k: 'mon9', t: 25, hp: 10, spd: 47, dmg: 7, xp: 2, size: 58, name: '파랑 슬라임' },
  { k: 'mon2', t: 55, hp: 9, spd: 80, dmg: 6, xp: 2, size: 58, name: '박쥐', fly: 1.6 },
  { k: 'mon11', t: 85, hp: 8, spd: 92, dmg: 6, xp: 2, size: 52, name: '꿀벌', fly: 1.4 },
  { k: 'mon7', t: 115, hp: 17, spd: 44, dmg: 9, xp: 3, size: 58, name: '새싹이' },
  { k: 'mon5', t: 145, hp: 21, spd: 38, dmg: 9, xp: 3, size: 58, name: '버섯' },
  { k: 'mon12', t: 175, hp: 19, spd: 52, dmg: 10, xp: 3, size: 58, name: '붉은 눈알' },
  { k: 'mon8', t: 205, hp: 24, spd: 98, dmg: 13, xp: 4, size: 62, name: '멧돼지' },
  { k: 'mon3', t: 235, hp: 28, spd: 54, dmg: 12, xp: 4, size: 62, name: '스켈레톤' },
  { k: 'mon6', t: 265, hp: 26, spd: 62, dmg: 13, xp: 4, size: 58, name: '임프' },
  { k: 'mon15', t: 295, hp: 32, spd: 35, dmg: 14, xp: 5, size: 58, name: '가시성게' },
  { k: 'mon13', t: 325, hp: 28, spd: 88, dmg: 13, xp: 5, size: 56, name: '날개눈알', fly: 1.5 },
  { k: 'mon10', t: 355, hp: 44, spd: 50, dmg: 17, xp: 7, size: 62, name: '저승사자' },
  { k: 'mon4', t: 385, hp: 38, spd: 60, dmg: 16, xp: 6, size: 60, name: '망령', fly: .6 },
  { k: 'mon14', t: 415, hp: 98, spd: 29, dmg: 22, xp: 12, size: 90, name: '바위골렘' },
];
const BOSSES = [
  { k: 'boss1', name: '고대 정령목', hp: 1100, spd: 70, dmg: 18 },
  { k: 'boss2', name: '심연의 마신', hp: 1900, spd: 84, dmg: 22 },
  { k: 'boss3', name: '설원의 폭군', hp: 2900, spd: 66, dmg: 24 },
  { k: 'boss4', name: '탐욕의 미믹', hp: 4200, spd: 74, dmg: 27 },
  { k: 'boss5', name: '홍염의 아룡', hp: 6000, spd: 78, dmg: 30 },
];
const BOSS_EVERY = 180;

// 스킬 정의 — kind: fb(파이어볼 강화) · auto(자동 발동) · pass(생존·패시브)
const R = { n: '일반', r: '희귀', e: '영웅', l: '전설' };
const SKILLS = [
  { id: 'aspd', kind: 'fb', rar: 'r', max: 10, name: '연속 시전', ic: ['mp-firebomb', 7], desc: (l) => `파이어볼 공격 속도 +18% (현재 +${Math.round((1.18 ** l - 1) * 100)}%)` },
  { id: 'dmg', kind: 'fb', rar: 'r', max: 10, name: '화력 증폭', ic: ['fireball-impact', 9], desc: (l) => `공격력 +20% (현재 +${Math.round((1.2 ** l - 1) * 100)}%)` },
  { id: 'multi', kind: 'fb', rar: 'e', max: 6, name: '다중 파이어볼', ic: ['fireball-impact', 2], desc: (l) => `파이어볼을 하나 더 발사 (총 ${1 + l}발)` },
  { id: 'pierce', kind: 'fb', rar: 'e', max: 5, name: '관통 화염', ic: ['fireball-impact', 1], desc: (l) => `파이어볼이 적 ${l}명을 관통` },
  { id: 'aoe', kind: 'fb', rar: 'e', max: 6, name: '폭염구', ic: ['boom-d', 4], desc: (l) => `명중하면 범위 폭발 (반경 ${(1.6 + l * .4).toFixed(1)}m)` },
  { id: 'burn', kind: 'fb', rar: 'n', max: 5, name: '화상', ic: ['ground-flames', 6], desc: (l) => `맞은 적이 3초 동안 불탐 (초당 공격력의 ${l * 25}%)` },
  { id: 'bounce', kind: 'fb', rar: 'l', max: 5, name: '튕기는 불꽃', ic: ['mp-spark', 3], desc: (l) => `명중 후 다른 적에게 ${l}번 튕김` },
  { id: 'crit', kind: 'fb', rar: 'e', max: 6, name: '급소 간파', ic: ['crit-hit', 3], desc: (l) => `치명타 확률 ${l * 10}% (피해 2.2배)` },
  { id: 'chain', kind: 'auto', rar: 'l', max: 5, name: '연쇄 번개', ic: ['mp-lightning', 5], desc: (l) => `${(3 - l * .2).toFixed(1)}초마다 번개가 적 ${2 + l}명에게 튕김` },
  { id: 'strike', kind: 'auto', rar: 'l', max: 5, name: '낙뢰', ic: ['mp-lightning', 6], desc: (l) => `3.5초마다 벼락 ${l}줄기가 적에게 내리꽂힘` },
  { id: 'frost', kind: 'auto', rar: 'l', max: 5, name: '서리 폭발', ic: ['ice-spike', 9], desc: (l) => `${(7 - l * .4).toFixed(1)}초마다 주변 얼음 폭발, ${(1.2 + l * .3).toFixed(1)}초 빙결` },
  { id: 'blizzard', kind: 'auto', rar: 'l', max: 5, name: '눈보라', ic: ['blizzard', 6], desc: (l) => `9초마다 적 무리에 눈보라 (반경 ${(4 + l * .6).toFixed(1)}m, 둔화)` },
  { id: 'meteor', kind: 'auto', rar: 'l', max: 5, name: '메테오', ic: ['meteor-strike', 8], desc: (l) => `${12 - l}초마다 거대한 운석 ${l}개 낙하` },
  { id: 'pillar', kind: 'auto', rar: 'l', max: 5, name: '불기둥', ic: ['fire-pillar', 10], desc: (l) => `7초마다 적 무리에 불기둥 ${1 + Math.floor(l / 2)}개` },
  { id: 'hole', kind: 'auto', rar: 'l', max: 5, name: '블랙홀', ic: ['mp-darkbolt', 6], desc: (l) => `${13 - l}초마다 블랙홀 — 적을 빨아들인 뒤 폭발` },
  { id: 'whirl', kind: 'auto', rar: 'e', max: 5, name: '회오리', ic: ['whirlwind', 6], desc: (l) => `7초마다 회오리 ${l}개가 적을 밀쳐내며 이동` },
  { id: 'shield', kind: 'pass', rar: 'l', max: 5, name: '마나 보호막', ic: ['hexshield', 8], desc: (l) => `피해를 먼저 막는 보호막 ${l * 25} (맞지 않으면 다시 차오름)` },
  { id: 'blink', kind: 'pass', rar: 'e', max: 5, name: '순간이동', ic: ['level-up', 6], desc: (l) => `대시가 순간이동으로 (${(6 + l * .8).toFixed(1)}m, 쿨 ${(4 - l * .4).toFixed(1)}초)` },
  { id: 'maxhp', kind: 'pass', rar: 'r', max: 10, name: '강인한 육체', ic: ['level-up', 12], desc: (l) => `최대 체력 +30, 즉시 회복 (${100 + l * 30})` },
  { id: 'regen', kind: 'pass', rar: 'r', max: 6, name: '재생', ic: ['level-up', 9], desc: (l) => `초당 체력 ${(l * .6).toFixed(1)} 회복` },
  { id: 'move', kind: 'pass', rar: 'n', max: 5, name: '바람걸음', ic: ['whirlwind', 3], desc: (l) => `이동 속도 +8% (현재 +${Math.round((1.08 ** l - 1) * 100)}%)` },
  { id: 'magnet', kind: 'pass', rar: 'n', max: 5, name: '수정 자석', ic: ['mp-spark', 2], desc: () => '경험치 흡수 범위 +35%' },
  { id: 'xpup', kind: 'pass', rar: 'r', max: 5, name: '현자의 통찰', ic: ['level-up', 4], desc: (l) => `경험치 획득 +20% (현재 +${Math.round((1.2 ** l - 1) * 100)}%)` },
];
const SK = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
const MAX_AUTO = 5;

// ============================================================ 상태
let state = 'title';
let P, G, S, CD, enemies, shots, gems, effects, nums, zones;
function newGame() {
  for (const e of enemies || []) removeEnemy(e, true);
  for (const s of shots || []) killShot(s);
  for (const g of gems || []) scene.remove(g.s);
  for (const f of effects || []) f.kill && f.kill();
  P = { x: 0, z: 0, yaw: 0, pitch: -.08, hp: 100, maxHp: 100, shield: 0, shieldT: 0, lv: 1, xp: 0, need: 6, inv: 0, fireT: .3, dashT: 0, bob: 0, kick: 0, vx: 0, vz: 0 };
  G = { t: 0, kills: 0, bossKills: 0, spawnAcc: 0, nextBoss: BOSS_EVERY, bossIdx: 0, boss: null, nextHorde: 50, rerolls: 1, pendingLv: 0, shake: 0, hint: 0, over: false };
  S = {}; CD = {}; enemies = []; shots = []; gems = []; effects = []; nums = []; zones = [];
  camera.position.set(0, 1.9, 0);
  buildSkillBar(); updateHUD(true);
}
const lv = (id) => S[id] || 0;
const atk = () => 12 * 1.2 ** lv('dmg');
const fireRate = () => 1.7 * 1.18 ** lv('aspd');
const moveSpd = () => 5.2 * 1.08 ** lv('move');
const magnetR = () => 3.4 * (1 + .35 * lv('magnet'));
const shieldMax = () => lv('shield') * 25;
const dashCd = () => lv('blink') ? 4 - lv('blink') * .4 : 4;

// ============================================================ 적
const shadowT = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'); g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(16, 16, 14, 8, 0, 0, 7); g.fill(); return new THREE.CanvasTexture(c); })();
const shadowGeo = new THREE.PlaneGeometry(1, 1); const shadowMat = new THREE.MeshBasicMaterial({ map: shadowT, transparent: true, depthWrite: false });
function spawnEnemy(type, ang, dist, boss) {
  const x = P.x + Math.sin(ang) * dist, z = P.z - Math.cos(ang) * dist;
  const t = MON[type.k], asp = t.image.width / t.image.height;
  const h = boss ? 5.2 : type.size / 38;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, alphaTest: .3 }));
  s.center.set(.5, 0); s.scale.set(h * asp, h, 1); s.position.set(x, type.fly || 0, z); scene.add(s);
  const sh = new THREE.Mesh(shadowGeo, shadowMat); sh.rotation.x = -Math.PI / 2; sh.scale.set(h * asp * .9, h * .45, 1); sh.position.set(x, .03, z); scene.add(sh);
  const hpMul = boss ? 1 + G.t / 400 : 1 + G.t / 110 + (G.t / 300) ** 2;
  const e = { type, s, sh, x, z, y: type.fly || 0, h, w: h * asp, r: boss ? 1.8 : Math.max(.45, h * asp * .35), hp: type.hp * hpMul, maxHp: type.hp * hpMul, spd: type.spd / 22 * (boss ? 1 : rand(.9, 1.1)), dmg: type.dmg, xp: type.xp || 0,
    boss: !!boss, flash: 0, frozen: 0, slow: 0, burn: 0, burnDps: 0, hitCd: 0, kx: 0, kz: 0, pull: null, dead: false };
  enemies.push(e); return e;
}
function removeEnemy(e, silent) { scene.remove(e.s); scene.remove(e.sh); e.s.material.dispose(); e.dead = true; }
function pickType() {
  const av = MTYPES.filter((m) => G.t >= m.t); const w = av.map((m, i) => 1 + i * .6 + (G.t - m.t < 40 ? 2 : 0));
  let r = Math.random() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < av.length; i++) { r -= w[i]; if (r <= 0) return av[i]; } return av[av.length - 1];
}
function spawnBoss() {
  const b = BOSSES[G.bossIdx % BOSSES.length]; const loop = Math.floor(G.bossIdx / BOSSES.length);
  const type = { ...b, hp: b.hp * (1 + loop * 1.5), xp: 0, size: 190 };
  const ang = P.yaw + Math.PI + rand(-.8, .8); const e = spawnEnemy(type, -ang, 30, true); G.boss = e; G.bossIdx++;
  $('bossNm').textContent = '☠ ' + b.name; $('bossBox').classList.add('on');
  banner(`☠ ${b.name} 출현`, '미니맵의 노란 표시를 확인하세요'); sfx('boss'); G.shake = .5;
}
function hit(e, dmg, o = {}) {
  if (e.dead) return; let crit = false;
  if (o.canCrit !== false && Math.random() < lv('crit') * .1) { dmg *= 2.2; crit = true; }
  e.hp -= dmg; e.flash = .1;
  if (o.kb && !e.boss) { e.kx += o.kb[0]; e.kz += o.kb[1]; }
  if (nums.length < 40) nums.push({ x: e.x + rand(-.3, .3), y: e.y + e.h * .9, z: e.z, t: 0, txt: Math.round(dmg), c: crit ? '#ffd43b' : o.col || '#fff', big: crit || e.boss && dmg > 60 });
  if (e.hp <= 0) killEnemy(e);
}
function killEnemy(e) {
  if (e.dead) return; G.kills++; removeEnemy(e);
  anim('hit-spark', v3(e.x, e.y + e.h * .4, e.z), .03, { add: true, ro: 9 });
  if (e.boss) {
    G.bossKills++; G.boss = null; $('bossBox').classList.remove('on');
    anim('big-explosion', v3(e.x, 0, e.z), .1, { ro: 9 }); sfx('big'); G.shake = .6;
    for (let i = 0; i < 40; i++) dropGem(e.x + rand(-3, 3), e.z + rand(-3, 3), 6);
    P.hp = Math.min(P.maxHp, P.hp + P.maxHp * .3); banner('보스 처치!', '체력 30% 회복');
  } else dropGem(e.x, e.z, e.xp);
}
// 경험치 수정
const gemT = (() => { const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d'); g.fillStyle = '#000'; g.beginPath(); g.moveTo(8, 0); g.lineTo(15, 8); g.lineTo(8, 16); g.lineTo(1, 8); g.fill(); g.fillStyle = '#5ff0ff'; g.beginPath(); g.moveTo(8, 2); g.lineTo(13, 8); g.lineTo(8, 14); g.lineTo(3, 8); g.fill(); g.fillStyle = '#d8ffff'; g.fillRect(6, 5, 2, 4); const t = new THREE.CanvasTexture(c); return near(t); })();
const gemMat = new THREE.SpriteMaterial({ map: gemT, transparent: true, alphaTest: .3 });
function dropGem(x, z, v) {
  if (gems.length > 130) { gainXp(v); return; }
  const s = new THREE.Sprite(gemMat); s.scale.setScalar(.38 + Math.min(.3, v * .03)); s.position.set(x, .4, z); scene.add(s);
  gems.push({ s, x, z, v, pull: false, sp: 0, ph: Math.random() * 6 });
}
function gainXp(v) {
  P.xp += v * 1.2 ** lv('xpup');
  while (P.xp >= P.need) { P.xp -= P.need; P.lv++; P.need = Math.round(5 + P.lv * 3 + P.lv * P.lv * .24); G.pendingLv++; }
}

// ============================================================ 파이어볼
const fbMats = { o: new THREE.SpriteMaterial({ map: dotT, color: 0xff7a20, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }), w: new THREE.SpriteMaterial({ map: dotT, color: 0xfff0c0, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }) };
const trailMat = new THREE.SpriteMaterial({ map: dotT, color: 0xff5a10, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
const trails = [];
function shoot(from, dir, o = {}) {
  const g = new THREE.Group(); const a = new THREE.Sprite(fbMats.o); a.scale.setScalar(1.1); const b = new THREE.Sprite(fbMats.w); b.scale.setScalar(.5); g.add(a, b); g.position.copy(from); scene.add(g);
  shots.push({ g, p: from.clone(), d: dir.clone().normalize(), sp: 26, life: 1.6, pierce: lv('pierce'), bounce: o.bounce ?? lv('bounce'), hitSet: new Set(o.skip ? [o.skip] : []) });
}
function killShot(s) { scene.remove(s.g); }
function crystalWorld() { // 지팡이 수정 위치 → 월드 좌표 (발사 지점)
  if (!staff) return camera.position.clone();
  const cw = crystalLocal.clone().applyMatrix4(staff.matrixWorld); const ndc = cw.project(vmCam);
  return v3(ndc.x, ndc.y, .5).unproject(camera).sub(camera.position).normalize().multiplyScalar(1.4).add(camera.position);
}
function aimDir() { return v3(-Math.sin(P.yaw) * Math.cos(P.pitch), Math.sin(P.pitch), -Math.cos(P.yaw) * Math.cos(P.pitch)); }
function targets(maxN) {
  const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw); const list = [];
  for (const e of enemies) {
    if (e.dead) continue; const dx = e.x - P.x, dz = e.z - P.z, d = Math.hypot(dx, dz); if (d > 32 || d < .3) continue;
    const ang = Math.acos(clamp((dx * fx + dz * fz) / d, -1, 1)); if (ang > .62) continue;
    list.push({ e, sc: ang * 12 + d * .35 - (e.boss ? 4 : 0) });
  }
  list.sort((a, b) => a.sc - b.sc); return list.slice(0, maxN).map((x) => x.e);
}
let locked = false;
function fireballs() {
  const n = 1 + lv('multi'); const tg = targets(n); const from = crystalWorld(); locked = tg.length > 0;
  for (let i = 0; i < n; i++) {
    let dir;
    if (tg.length) { const e = tg[i % tg.length]; dir = v3(e.x, e.y + e.h * .5, e.z).sub(from); if (i >= tg.length) dir.applyAxisAngle(v3(0, 1, 0), (i - tg.length + 1) * .12 * (i % 2 ? 1 : -1)); }
    else { dir = aimDir(); if (i) dir.applyAxisAngle(v3(0, 1, 0), Math.ceil(i / 2) * .12 * (i % 2 ? 1 : -1)); }
    shoot(from, dir);
  }
  P.kick = 1; sfx('cast');
  if (staff) staff.userData.glow.scale.setScalar(1.4);
}
function explodeAt(p, r, dmg, skip) {
  anim('boom-d', v3(p.x, 0, p.z), .022 + r * .009, { ro: 9 }); sfx('boom');
  for (const e of enemies) if (!e.dead && e !== skip && Math.hypot(e.x - p.x, e.z - p.z) < r + e.r * .5) hit(e, dmg, { col: '#ffb070' });
}
function updateShots(dt) {
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i]; s.life -= dt; const step = s.sp * dt; s.p.addScaledVector(s.d, step); s.g.position.copy(s.p);
    if (Math.random() < .9) { const t = new THREE.Sprite(trailMat); t.position.copy(s.p); t.scale.setScalar(.55); scene.add(t); trails.push({ s: t, life: .25 }); }
    let done = s.life <= 0 || s.p.y < -.2;
    for (const e of enemies) {
      if (e.dead || s.hitSet.has(e)) continue;
      const dx = e.x - s.p.x, dz = e.z - s.p.z; if (dx * dx + dz * dz > (e.r + .45) ** 2) continue; if (s.p.y < e.y - .3 || s.p.y > e.y + e.h + .3) continue;
      s.hitSet.add(e); const d = atk();
      hit(e, d, { kb: [s.d.x * .6, s.d.z * .6] });
      if (lv('burn')) { e.burn = 3; e.burnDps = d * .25 * lv('burn'); }
      anim('mp-firebomb', v3(s.p.x, s.p.y - .6, s.p.z), .03, { ro: 9, skip: .28, pv: [32, 54] });
      if (lv('aoe')) explodeAt(s.p, 1.6 + lv('aoe') * .4, d * .6, e);
      if (s.bounce > 0) {
        let best = null, bd = 9; for (const o of enemies) { if (o.dead || s.hitSet.has(o) || o === e) continue; const dd = Math.hypot(o.x - e.x, o.z - e.z); if (dd < bd) { bd = dd; best = o; } }
        if (best) { const from = v3(e.x, e.y + e.h * .5, e.z); shoot(from, v3(best.x, best.y + best.h * .5, best.z).sub(from), { bounce: s.bounce - 1, skip: e }); }
      }
      if (s.pierce > 0) s.pierce--; else { done = true; break; }
    }
    if (done) { killShot(s); shots.splice(i, 1); }
  }
  for (let i = trails.length - 1; i >= 0; i--) { const t = trails[i]; t.life -= dt; t.s.scale.setScalar(Math.max(.01, t.life * 2.2)); if (t.life <= 0) { scene.remove(t.s); trails.splice(i, 1); } }
}

// ============================================================ 자동 발동 마법
const snowMat = new THREE.SpriteMaterial({ map: dotT, color: 0xffffff, transparent: true, depthWrite: false });
function nearestEnemies(x, z, r, n = 99) { return enemies.filter((e) => !e.dead && Math.hypot(e.x - x, e.z - z) < r).sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z)).slice(0, n); }
function densest(r, range) { // 적이 가장 많이 모인 곳
  let best = null, bc = 0; for (const e of enemies) { if (e.dead || Math.hypot(e.x - P.x, e.z - P.z) > range) continue; let c = 0; for (const o of enemies) if (!o.dead && Math.hypot(o.x - e.x, o.z - e.z) < r) c++; if (e.boss) c += 3; if (c > bc) { bc = c; best = e; } }
  return best;
}
function inArea(x, z, r, fn) { for (const e of enemies) if (!e.dead && Math.hypot(e.x - x, e.z - z) < r + e.r * .5) fn(e); }
const CASTS = {
  chain: { cd: (l) => 3 - l * .2, cast(l) {
    const first = nearestEnemies(P.x, P.z, 16, 1)[0]; if (!first) return false;
    const chain = [first]; let cur = first; for (let i = 0; i < 1 + l; i++) { const nx = enemies.filter((o) => !o.dead && !chain.includes(o) && Math.hypot(o.x - cur.x, o.z - cur.z) < 7.5).sort((a, b) => Math.hypot(a.x - cur.x, a.z - cur.z) - Math.hypot(b.x - cur.x, b.z - cur.z))[0]; if (!nx) break; chain.push(nx); cur = nx; }
    const c0 = v3(first.x, first.y + first.h * .5, first.z); const pts = [crystalWorld().lerp(c0, .45)].concat(chain.map((e) => v3(e.x, e.y + e.h * .5, e.z))); const dmg = atk() * 1.3;
    pts.slice(0, -1).forEach((a, i) => {
      const b = bolt3d(scene, a, pts[i + 1], { r: i ? .06 : .025, amp: i ? .45 : .15, freq: .9, mode: 1 }); let t = -i * .07, done = false;
      effects.push({ update(dt) { t += dt; if (t < 0) { b.set(0, 0); return true; } if (!done) { done = true; const e = chain[i]; if (!e.dead) { hit(e, dmg, { col: '#bfe9ff' }); e.flash = .25; } anim('mp-spark', pts[i + 1], .06, { add: true, ro: 10 }); } b.set(t, (Math.floor(t / .04) % 3 ? 1 : .5) * clamp(1 - (t - .3) / .2, 0, 1), Math.floor(t / .05) * 1.3 + i); if (t > .5) { b.dispose(); return false; } return true; }, kill() { b.dispose(); } });
    });
    sfx('zap'); return true;
  } },
  strike: { cd: () => 3.5, cast(l) {
    const pool = enemies.filter((e) => !e.dead && Math.hypot(e.x - P.x, e.z - P.z) < 24); if (!pool.length) return false;
    for (let i = 0; i < l; i++) {
      const e = pool[(Math.random() * pool.length) | 0]; const x = e.x, z = e.z; const t0 = i * .18;
      const top = v3(x + 2, 30, z - 3), bot = v3(x, 0, z);
      const b = bolt3d(scene, top, bot, { r: .1, taper: .7, amp: .7, freq: .35, mode: 0 }), b2 = bolt3d(scene, top.clone().add(v3(-1.5, 0, 1)), bot, { r: .05, taper: .6, amp: .9, freq: .5, mode: 0 });
      const ring = groundRing(scene, bot, 6, 0xffffff, 0x00d7ff), gl = glowBall(scene, v3(x, .6, z), .6, 0xffffff, 0x00b0ff, 2.5);
      let t = -t0, done = false;
      effects.push({ update(dt) { t += dt; const u = t; if (u < 0) { b.set(0, 0); b2.set(0, 0); ring.set(0, 0); gl.set(0); return true; }
        if (!done) { done = true; inArea(x, z, 2.4, (o) => hit(o, atk() * 2.2, { col: '#bfe9ff' })); anim('mp-lightning', v3(x, 0, z), .045, { add: true, ro: 9, pv: [32, 124] }); sfx('zap'); G.shake = Math.max(G.shake, .12); }
        const fl = u < .32 ? (Math.floor(u / .05) % 2 ? .65 : 1) * (1 - u / .32 * .5) : 0; b.set(u, fl, Math.floor(u / .06) * 1.7 + i); b2.set(u, fl * .8, Math.floor(u / .05) * 2.3 + i);
        ring.set(u * 1.4, u < .6 ? 1 - u / .6 : 0); gl.set(u < .45 ? 1 - u / .45 : 0, 1 + u * 2);
        if (u > .65) { this.kill(); return false; } return true; }, kill() { b.dispose(); b2.dispose(); ring.dispose(); gl.dispose(); } });
    }
    return true;
  } },
  frost: { cd: (l) => 7 - l * .4, cast(l) {
    const r = 4.5 + l * .6; if (!nearestEnemies(P.x, P.z, r + 1, 1).length) return false;
    const n = 14; for (let i = 0; i < n; i++) { const a = i / n * 6.283, rr = r * .85; anim('ice-spike', v3(P.x + Math.cos(a) * rr, 0, P.z + Math.sin(a) * rr), .012 + r * .0012, { ro: 7, skip: .3 }); }
    const ring = groundRing(scene, v3(P.x, 0, P.z), r * 2.4, 0xe8fbff, 0x40b0ff); let t = 0;
    effects.push({ update(dt) { t += dt; ring.set(t * 1.6, t < .6 ? 1 - t / .6 : 0); if (t > .6) { ring.dispose(); return false; } return true; }, kill() { ring.dispose(); } });
    inArea(P.x, P.z, r, (e) => { hit(e, atk(), { col: '#bfe9ff' }); if (!e.boss) e.frozen = Math.max(e.frozen, 1.2 + l * .3); else e.slow = 2; });
    sfx('frost'); return true;
  } },
  blizzard: { cd: () => 9, cast(l) {
    // 눈보라: 시야를 가리지 않게 — 바닥의 얼음 영역 + 작은 눈송이 + 가장자리에만 옅은 바람
    const c = densest(5, 18); if (!c) return false; const x = c.x, z = c.z, r = 4 + l * .6; let t = 0, tick = 0;
    const frost = new THREE.Mesh(new THREE.CircleGeometry(r, 40), new THREE.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0, depthWrite: false }));
    frost.rotation.x = -Math.PI / 2; frost.position.set(x, .05, z); scene.add(frost);
    const edge = new THREE.Mesh(new THREE.RingGeometry(r * .94, r, 48), new THREE.MeshBasicMaterial({ color: 0xe8f6ff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    edge.rotation.x = -Math.PI / 2; edge.position.set(x, .06, z); scene.add(edge);
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + Math.random() * .4, bx = x + Math.cos(a) * r * .85, bz = z + Math.sin(a) * r * .85; if (Math.hypot(bx - P.x, bz - P.z) < 6) continue; anim('blizzard', v3(bx, 0, bz), .028, { ro: 8, loop: true, until: 3.5, delay: i * .06, op: .5, pv: [40, 52] }); }
    const flakes = Array.from({ length: 70 }, () => { const sp = new THREE.Sprite(snowMat); sp.scale.setScalar(rand(.1, .2)); scene.add(sp); return { sp, a: Math.random() * 6.28, rr: Math.sqrt(Math.random()) * r, y: Math.random() * 4, v: rand(1.2, 2.4), w: rand(1.5, 3) * (Math.random() < .5 ? -1 : 1) }; });
    effects.push({ update(dt) {
      t += dt; tick -= dt; const fade = t < .3 ? t / .3 : t > 3.2 ? Math.max(0, (3.5 - t) / .3) : 1;
      frost.material.opacity = .28 * fade; edge.material.opacity = .55 * fade;
      for (const f of flakes) { f.y -= f.v * dt; if (f.y < 0) f.y += 4; f.a += f.w * dt / Math.max(1, f.rr); f.sp.position.set(x + Math.cos(f.a) * f.rr, f.y, z + Math.sin(f.a) * f.rr); f.sp.material.opacity = fade; }
      if (tick <= 0) { tick = .5; inArea(x, z, r, (e) => { hit(e, atk() * .5 * (1 + .25 * l) * .5, { col: '#d8f2ff', canCrit: false }); e.slow = Math.max(e.slow, .6); }); }
      if (t > 3.5) { this.kill(); return false; } return true;
    }, kill() { for (const m of [frost, edge]) { scene.remove(m); m.geometry.dispose(); m.material.dispose(); } flakes.forEach((f) => scene.remove(f.sp)); } });
    sfx('frost'); return true;
  } },
  meteor: { cd: (l) => 12 - l, cast(l) {
    const pool = enemies.filter((e) => !e.dead && Math.hypot(e.x - P.x, e.z - P.z) < 26 && Math.hypot(e.x - P.x, e.z - P.z) > 5); if (!pool.length) return false;
    for (let i = 0; i < l; i++) {
      const e = i === 0 ? densest(5, 26) || pool[0] : pool[(Math.random() * pool.length) | 0]; const x = e.x + rand(-1, 1), z = e.z + rand(-1, 1), d0 = i * .35;
      anim('meteor-strike', v3(x, 0, z), .2, { ro: 9, delay: d0 });
      let t = -d0, boom = false; const IMP = .42;
      const ring = groundRing(scene, v3(x, 0, z), 16, 0xfff0b0, 0xff5a10);
      const scorch = new THREE.Mesh(new THREE.CircleGeometry(5, 32), new THREE.MeshBasicMaterial({ color: 0x1a0d08, transparent: true, opacity: 0, depthWrite: false })); scorch.rotation.x = -Math.PI / 2; scorch.position.set(x, .05, z); scene.add(scorch);
      effects.push({ update(dt) { t += dt; const u = t - IMP; ring.set(Math.max(0, u) * 1.6, u > 0 && u < .7 ? 1 - u / .7 : 0);
        if (u > 0 && !boom) { boom = true; anim('big-explosion', v3(x, 0, z + .5), .12, { ro: 10 }); for (let k = 0; k < 4; k++) anim('mp-firebomb', v3(x + rand(-4, 4), 0, z + rand(-3, 3)), .08, { ro: 10, pv: [32, 54], skip: .28, delay: .08 + k * .06 }); inArea(x, z, 5, (o) => hit(o, atk() * 4, { col: '#ffb070', kb: [(o.x - x) * .4, (o.z - z) * .4] })); sfx('big'); G.shake = Math.max(G.shake, .35); }
        scorch.material.opacity = u > 0 ? Math.min(.5, u * 3) * clamp((3 - u) / 1, 0, 1) : 0;
        if (u > 3) { this.kill(); return false; } return true; }, kill() { ring.dispose(); scene.remove(scorch); scorch.geometry.dispose(); scorch.material.dispose(); } });
    }
    return true;
  } },
  pillar: { cd: () => 7, cast(l) {
    const n = 1 + Math.floor(l / 2); const pool = enemies.filter((e) => !e.dead && Math.hypot(e.x - P.x, e.z - P.z) < 20); if (!pool.length) return false;
    const first = densest(4, 20) || pool[0];
    for (let i = 0; i < n; i++) {
      const e = i ? pool[(Math.random() * pool.length) | 0] : first; const x = e.x, z = e.z, t0 = i * .18;
      anim('fire-pillar', v3(x, 0, z), .12, { ro: 9, speed: .8, delay: t0 }); anim('mp-firebomb', v3(x, 0, z), .06, { ro: 10, pv: [32, 54], skip: .28, delay: t0 });
      const ring = groundRing(scene, v3(x, 0, z), 7, 0xfff0b0, 0xff4a10); let t = -t0, tick = 0;
      effects.push({ update(dt) { t += dt; if (t < 0) { ring.set(0, 0); return true; } ring.set(t * 1.2, t < .6 ? 1 - t / .6 : 0); tick -= dt; if (tick <= 0 && t < 1.3) { tick = .22; inArea(x, z, 2.6, (o) => hit(o, atk() * .45 * (1 + .2 * l), { col: '#ffb070', canCrit: false })); } if (t > 1.5) { ring.dispose(); return false; } return true; }, kill() { ring.dispose(); } });
    }
    sfx('boom'); return true;
  } },
  hole: { cd: (l) => 13 - l, cast(l) {
    const c = densest(6, 20); if (!c) return false; const C = v3(c.x, 2.2, c.z); let t = 0, popped = false;
    const disc = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), vortexMat(0xc06bff, 0x3a0a6a, 1.6)); disc.rotation.x = -Math.PI / 2; disc.position.set(C.x, .08, C.z); scene.add(disc);
    const aura = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), vortexMat(0xb070ff, 0x4a0890, .8)); aura.position.copy(C); scene.add(aura);
    const ball = glowBall(scene, C, 1.5, 0xc080ff, 0x5a10b0, 1.5); ball.b.renderOrder = 15; const core = voidCore(scene, C, 1.15);
    const parts = Array.from({ length: 40 }, (_, i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotT, color: i % 3 ? 0x9040e0 : 0xd0a0ff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); s.scale.setScalar(rand(.25, .55)); scene.add(s); return { s, a: Math.random() * 6.28, r0: rand(3, 9), ph: Math.random(), y: Math.random() * 3 }; });
    sfx('hole');
    effects.push({ update(dt) {
      t += dt; const grow = Math.min(1, t / .4), end = t > 1.9 ? Math.max(0, 1 - (t - 1.9) / .3) : 1, sc = grow * end;
      for (const m of [disc, aura]) { m.material.uniforms.uT.value = t * (m === disc ? 1.6 : 2.2); m.material.uniforms.uA.value = sc; }
      disc.scale.setScalar(.3 + .7 * grow); aura.lookAt(camera.position); aura.scale.setScalar(Math.max(.01, sc));
      ball.set(sc * .55, Math.max(.01, sc)); core.set(sc, Math.max(.01, sc));
      if (t < 1.9) inArea(C.x, C.z, 9, (e) => { if (!e.boss) e.pull = C; });
      parts.forEach((p) => { const u = (t * .7 + p.ph) % 1, r = p.r0 * (1 - u), a = p.a + u * 5; p.s.position.set(C.x + Math.cos(a) * r, C.y - 1.4 + p.y * (1 - u), C.z + Math.sin(a) * r * .8); p.s.material.opacity = Math.min(1, u * 3) * end; });
      if (t > 1.85 && !popped) { popped = true; for (let i = 0; i < 5; i++) anim('mp-darkbolt', C.clone().add(v3(Math.cos(i * 1.3) * 2.4, -2.2, Math.sin(i * 1.3) * 1.5)), .06, { add: true, ro: 10, pv: [32, 84], delay: i * .05 }); anim('void-implosion', v3(C.x, 0, C.z), .1, { ro: 10 }); inArea(C.x, C.z, 4.5, (e) => hit(e, atk() * 3.5 * (1 + .3 * l), { col: '#e0b0ff' })); sfx('big'); }
      if (t > 2.3) { this.kill(); return false; } return true;
    }, kill() { scene.remove(disc); scene.remove(aura); disc.material.dispose(); aura.material.dispose(); disc.geometry.dispose(); aura.geometry.dispose(); ball.dispose(); core.dispose(); parts.forEach((p) => { scene.remove(p.s); p.s.material.dispose(); }); } });
    return true;
  } },
  whirl: { cd: () => 7, cast(l) {
    for (let i = 0; i < l; i++) {
      const a = P.yaw + (i - (l - 1) / 2) * .9 + rand(-.2, .2); let x = P.x, z = P.z; const vx = -Math.sin(a) * 6, vz = -Math.cos(a) * 6; let t = 0, tick = 0;
      const sp = anim('whirlwind', v3(x, 0, z), .06, { ro: 9, loop: true, until: 3.6, follow: () => v3(x, 0, z) });
      effects.push({ update(dt) { t += dt; x += vx * dt; z += vz * dt; tick -= dt; if (tick <= 0) { tick = .3; inArea(x, z, 1.8, (e) => hit(e, atk() * .8, { col: '#e8ffe0', canCrit: false, kb: [(e.x - x) * 1.2, (e.z - z) * 1.2] })); } return t < 3.6; } });
    }
    sfx('dash'); return true;
  } },
};

// ============================================================ 입력
const keys = {};
addEventListener('keydown', (e) => { keys[e.code] = true; if (e.code === 'Space') { e.preventDefault(); dash(); } if (e.code === 'KeyP' || e.code === 'Escape') togglePause(); audio(); });
addEventListener('keyup', (e) => { keys[e.code] = false; });
let joy = null, look = null, testMove = null; const joyEl = $('joy'), joyK = $('joyK');
const touchUI = matchMedia('(pointer:coarse)').matches;
$('gl').addEventListener('pointerdown', (e) => {
  audio(); if (state !== 'play') return;
  if (e.pointerType !== 'mouse' && e.clientX < W * .45 && !joy) {
    joy = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0 }; joyEl.style.left = e.clientX + 'px'; joyEl.style.top = e.clientY + 'px'; joyEl.className = 'joy on'; joyK.style.transform = '';
  } else if (!look) look = { id: e.pointerId, x: e.clientX, y: e.clientY };
  $('gl').setPointerCapture(e.pointerId);
});
$('gl').addEventListener('pointermove', (e) => {
  if (joy && e.pointerId === joy.id) { let dx = e.clientX - joy.x, dy = e.clientY - joy.y; const d = Math.hypot(dx, dy), m = 46; if (d > m) { dx *= m / d; dy *= m / d; } joy.dx = dx / m; joy.dy = dy / m; joyK.style.transform = `translate(${dx}px,${dy}px)`; }
  else if (look && e.pointerId === look.id) { const sx = e.pointerType === 'mouse' ? .005 : .0075; P.yaw -= (e.clientX - look.x) * sx; P.pitch = clamp(P.pitch - (e.clientY - look.y) * sx * .7, -.7, .45); look.x = e.clientX; look.y = e.clientY; }
});
const endPtr = (e) => { if (joy && e.pointerId === joy.id) { joy = null; joyEl.className = touchUI ? 'joy idle' : 'joy'; placeIdleJoy(); } if (look && e.pointerId === look.id) look = null; };
$('gl').addEventListener('pointerup', endPtr); $('gl').addEventListener('pointercancel', endPtr);
function placeIdleJoy() { if (touchUI) { joyEl.style.left = '80px'; joyEl.style.top = (H - 230) + 'px'; } }
$('bDash').addEventListener('pointerdown', (e) => { e.stopPropagation(); audio(); dash(); });
$('bPause').addEventListener('pointerdown', (e) => { e.stopPropagation(); togglePause(); });
function dash() {
  if (state !== 'play' || P.dashT > 0) return; let mx = 0, mz = 0; const mv = moveInput(); if (mv[0] || mv[1]) { mx = mv[0]; mz = mv[1]; } else { mx = 0; mz = -1; }
  const c = Math.cos(P.yaw), s = Math.sin(P.yaw); const wx = mx * c + mz * s, wz = -mx * s + mz * c; const len = Math.hypot(wx, wz) || 1;
  const dist = lv('blink') ? 6 + lv('blink') * .8 : 4.5;
  if (lv('blink')) anim('level-up', v3(P.x, 0, P.z), .03, { ro: 9, add: true });
  moveTo(P.x + wx / len * dist, P.z + wz / len * dist, true); P.inv = .35; P.dashT = dashCd(); sfx('dash');
}
function moveInput() {
  let x = 0, z = 0;
  if (keys.KeyW || keys.ArrowUp) z -= 1; if (keys.KeyS || keys.ArrowDown) z += 1; if (keys.KeyA || keys.ArrowLeft) x -= 1; if (keys.KeyD || keys.ArrowRight) x += 1;
  if (joy) { x += joy.dx; z += joy.dy; }
  if (testMove) { x += testMove[0]; z += testMove[1]; }
  const l = Math.hypot(x, z); if (l > 1) { x /= l; z /= l; } return [x, z];
}
function moveTo(nx, nz, teleport) {
  const steps = teleport ? 8 : 1;
  for (let i = 0; i < steps; i++) {
    let x = P.x + (nx - P.x) / (steps - i), z = P.z + (nz - P.z) / (steps - i);
    for (const o of OBST) { if (!o[2]) continue; const dx = x - o[0], dz = z - o[1], d = Math.hypot(dx, dz), m = o[2] + .5; if (d < m) { x = o[0] + dx / d * m; z = o[1] + dz / d * m; } }
    const r = Math.hypot(x, z); if (r > ARENA) { x *= ARENA / r; z *= ARENA / r; if (state === 'play') edgeNote(); }
    P.x = x; P.z = z;
  }
}

// ============================================================ 화면 (HUD)
function edgeNote() { const n = $('edgeNote'); n.classList.add('on'); clearTimeout(edgeNote.t); edgeNote.t = setTimeout(() => n.classList.remove('on'), 1400); }
function banner(t, sub = '') { const b = $('banner'); b.innerHTML = `${t}${sub ? `<small>${sub}</small>` : ''}`; b.classList.add('on'); clearTimeout(banner.t); banner.t = setTimeout(() => b.classList.remove('on'), 2400); }
function hint(t) { const h = $('hint'); h.textContent = t; h.classList.add('on'); clearTimeout(hint.t); hint.t = setTimeout(() => h.classList.remove('on'), 2600); }
function autoOwned() { return SKILLS.filter((s) => s.kind === 'auto' && S[s.id]); }
function buildSkillBar() {
  const own = autoOwned(); const el = $('skills'); el.innerHTML = '';
  const slots = [{ fb: true }].concat(own, Array(Math.max(0, MAX_AUTO - own.length)).fill(null));
  slots.forEach((s) => {
    const d = document.createElement('div'); d.className = 'sk' + (s && !s.fb && s.rar === 'l' ? ' o' : '') + (s ? '' : ' empty');
    if (s) { const c = document.createElement('canvas'); const src = s.fb ? fxIcon('fireball-impact', 2) : fxIcon(...s.ic); c.width = src.width; c.height = src.height; c.getContext('2d').drawImage(src, 0, 0); d.appendChild(c);
      d.insertAdjacentHTML('beforeend', `<em class="sh">${s.fb ? 'Lv' + (1 + lv('dmg') + lv('aspd')) : 'Lv' + lv(s.id)}</em>` + (s.fb ? '' : `<div class="cd" style="--c:100%"></div>`)); d.dataset.id = s.fb ? '' : s.id; }
    else d.innerHTML = '<span style="font-size:18px;color:#888">+</span>';
    el.appendChild(d);
  });
  $('dashTxt').innerHTML = lv('blink') ? '순간<br>이동' : '대시';
}
let hudT = 0, mmT = 0;
function updateHUD(force) {
  $('lvTxt').textContent = 'Lv.' + P.lv; $('tmTxt').textContent = fmtTime(G.t); $('killTxt').textContent = G.kills;
  $('bossTxt').innerHTML = G.bossKills ? `☠ ${G.bossKills}` : '';
  const tot = P.maxHp + shieldMax(); const hb = $('hpBar');
  hb.style.setProperty('--v', (P.hp / tot * 100).toFixed(1) + '%'); hb.style.setProperty('--s', ((P.hp + P.shield) / tot * 100).toFixed(1) + '%');
  $('hpTxt').textContent = `${Math.ceil(P.hp)} / ${P.maxHp}` + (shieldMax() ? ` (보호막 ${Math.floor(P.shield)})` : '');
  $('xpBar').style.setProperty('--v', (P.xp / P.need * 100).toFixed(1) + '%'); $('xpTxt').textContent = `${Math.floor(P.xp)} / ${P.need}`;
  if (G.boss) { const p = Math.max(0, G.boss.hp / G.boss.maxHp * 100); $('bossBar').style.setProperty('--v', p + '%'); $('bossPct').textContent = Math.ceil(p) + '%'; }
  $('dashCd').style.setProperty('--c', (100 - P.dashT / dashCd() * 100) + '%');
  document.querySelectorAll('#skills .sk[data-id]').forEach((d) => { const id = d.dataset.id; if (!id) return; const c = CASTS[id].cd(lv(id)); d.querySelector('.cd').style.setProperty('--c', (100 - clamp((CD[id] || 0) / c, 0, 1) * 100) + '%'); });
  $('mmLb').textContent = '적 ' + enemies.length;
  $('cross').className = 'cross' + (locked ? ' lock' : '');
  edges();
}
function rel(x, z) { const c = Math.cos(P.yaw), s = Math.sin(P.yaw), dx = x - P.x, dz = z - P.z; return [dx * c - dz * s, -(dx * s + dz * c)]; }
const RANGE = 36;
function drawMinimap() {
  const cv = $('mm'), g = cv.getContext('2d'), C = 112, R0 = 112, k = (R0 - 4) / RANGE;
  g.setTransform(cv.width / 224, 0, 0, cv.width / 224, 0, 0); g.clearRect(0, 0, 224, 224); g.save(); g.beginPath(); g.arc(C, C, R0 - 4, 0, 7); g.clip();
  g.fillStyle = 'rgba(28,52,30,.85)'; g.fillRect(0, 0, 224, 224);
  { const [cx, cy] = rel(0, 0); g.fillStyle = 'rgba(120,180,90,.35)'; g.beginPath(); g.arc(C + cx * k, C - cy * k, ARENA * k, 0, 7); g.fill(); }
  for (const o of OBST) { const [rx, ry] = rel(o[0], o[1]); if (Math.abs(rx) > RANGE || Math.abs(ry) > RANGE) continue; g.fillStyle = o[3] === 'tree' ? '#2f6a34' : '#8a8f99'; g.beginPath(); g.arc(C + rx * k, C - ry * k, o[3] === 'tree' ? 5 : 4, 0, 7); g.fill(); }
  const hf = Math.atan(Math.tan(camera.fov * Math.PI / 360) * camera.aspect);
  const gr = g.createRadialGradient(C, C, 0, C, C, R0); gr.addColorStop(0, 'rgba(255,255,220,.38)'); gr.addColorStop(1, 'rgba(255,255,220,0)');
  g.fillStyle = gr; g.beginPath(); g.moveTo(C, C); g.arc(C, C, R0, -Math.PI / 2 - hf, -Math.PI / 2 + hf); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 2; for (const r of [.33, .66]) { g.beginPath(); g.arc(C, C, R0 * r, 0, 7); g.stroke(); }
  for (const e of enemies) {
    if (e.dead) continue; let [rx, ry] = rel(e.x, e.z); const d = Math.hypot(rx, ry), far = d > RANGE - 2; if (far) { rx *= (RANGE - 2) / d; ry *= (RANGE - 2) / d; }
    const x = C + rx * k, y = C - ry * k;
    if (e.boss) { g.fillStyle = 'rgba(255,170,0,.35)'; g.beginPath(); g.arc(x, y, 18, 0, 7); g.fill(); g.fillStyle = '#ffb020'; g.strokeStyle = '#000'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 10, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#000'; g.font = '700 13px G'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('☠', x, y + 1); continue; }
    if (far) { const a = Math.atan2(y - C, x - C); g.fillStyle = '#ff3b2f'; g.beginPath(); g.moveTo(x + Math.cos(a) * 8, y + Math.sin(a) * 8); g.lineTo(x + Math.cos(a + 2.4) * 6, y + Math.sin(a + 2.4) * 6); g.lineTo(x + Math.cos(a - 2.4) * 6, y + Math.sin(a - 2.4) * 6); g.fill(); continue; }
    g.fillStyle = '#000'; g.beginPath(); g.arc(x, y, 5.5, 0, 7); g.fill(); g.fillStyle = d < 6 ? '#ff1f1f' : '#ff4b3e'; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill();
  }
  g.restore();
  g.strokeStyle = '#000'; g.lineWidth = 6; g.beginPath(); g.arc(C, C, R0 - 4, 0, 7); g.stroke();
  g.strokeStyle = '#e0b45a'; g.lineWidth = 3; g.beginPath(); g.arc(C, C, R0 - 5, 0, 7); g.stroke();
  g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 3; g.beginPath(); g.moveTo(C, C - 10); g.lineTo(C + 7, C + 7); g.lineTo(C, C + 3); g.lineTo(C - 7, C + 7); g.closePath(); g.stroke(); g.fill();
}
function edges() {
  const hf = Math.atan(Math.tan(camera.fov * Math.PI / 360) * camera.aspect);
  const side = { l: { n: 0, a: 0, big: 0 }, r: { n: 0, a: 0, big: 0 } };
  for (const e of enemies) { if (e.dead) continue; const [rx, ry] = rel(e.x, e.z); if (Math.hypot(rx, ry) > 26) continue; const a = Math.atan2(rx, ry); if (Math.abs(a) < hf * .95) continue; const S2 = a < 0 ? side.l : side.r; S2.n++; S2.a += Math.abs(a); if (e.boss) S2.big = 1; }
  $('edges').innerHTML = ['l', 'r'].map((k) => { const S2 = side[k]; if (!S2.n) return ''; const a = S2.a / S2.n; const y = 32 + Math.min(1, (a - hf) / (Math.PI - hf)) * 28;
    return `<div class="edge ${k} ${S2.big ? 'big' : ''} sh" style="--y:${y}%"><i></i>${S2.big ? '보스' : '×' + S2.n}</div>`; }).join('');
}
// 데미지 숫자 · 적 체력바 (2D 오버레이)
const tmpV = v3();
function drawOverlay(dt) {
  og.setTransform(DPR, 0, 0, DPR, 0, 0); og.clearRect(0, 0, W, H);
  og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round';
  for (const e of enemies) {
    if (e.dead || e.boss || e.hp >= e.maxHp) continue; const d = Math.hypot(e.x - P.x, e.z - P.z); if (d > 20) continue;
    tmpV.set(e.x, e.y + e.h + .25, e.z).project(camera); if (tmpV.z > 1) continue; const x = (tmpV.x + 1) / 2 * W, y = (1 - tmpV.y) / 2 * H, w = Math.max(16, 520 / d);
    og.fillStyle = '#000'; og.fillRect(x - w / 2 - 1, y - 1, w + 2, 6); og.fillStyle = '#4a0a0a'; og.fillRect(x - w / 2, y, w, 4); og.fillStyle = '#ff4b3e'; og.fillRect(x - w / 2, y, w * Math.max(0, e.hp / e.maxHp), 4);
  }
  for (let i = nums.length - 1; i >= 0; i--) {
    const n = nums[i]; n.t += dt; if (n.t > .7) { nums.splice(i, 1); continue; }
    tmpV.set(n.x, n.y + n.t * 1.2, n.z).project(camera); if (tmpV.z > 1) continue; const x = (tmpV.x + 1) / 2 * W, y = (1 - tmpV.y) / 2 * H;
    og.globalAlpha = n.t > .45 ? 1 - (n.t - .45) / .25 : 1; og.font = `700 ${n.big ? 22 : 15}px G`; og.lineWidth = 4; og.strokeStyle = '#000'; og.strokeText(n.txt, x, y); og.fillStyle = n.c; og.fillText(n.txt, x, y);
  }
  og.globalAlpha = 1;
}

// ============================================================ 레벨업
function rarW(r) { return { n: 40, r: 30, e: 18, l: 10 }[r]; }
function offers() {
  const own = autoOwned().length;
  const pool = SKILLS.filter((s) => lv(s.id) < s.max && !(s.kind === 'auto' && !S[s.id] && own >= MAX_AUTO));
  const out = []; while (out.length < 3 && pool.length) { let tot = pool.reduce((a, s) => a + rarW(s.rar) * (s.kind === 'auto' && !S[s.id] && P.lv < 4 ? 1.6 : 1), 0), r = Math.random() * tot; let i = 0; for (; i < pool.length; i++) { r -= rarW(pool[i].rar) * (pool[i].kind === 'auto' && !S[pool[i].id] && P.lv < 4 ? 1.6 : 1); if (r <= 0) break; } out.push(pool.splice(Math.min(i, pool.length - 1), 1)[0]); }
  return out;
}
function showLevelUp() {
  state = 'level'; sfx('lvl'); const L = $('sLevel'); const opts = offers();
  const stars = (n, max) => Array.from({ length: Math.min(max, 10) }, (_, i) => `<img class="px ${i < n ? '' : 'off'}" src="assets/ui/star.png" alt="">`).join('');
  const kindTxt = { fb: '파이어볼', auto: '자동 마법', pass: '패시브' };
  L.innerHTML = `<canvas id="lvfx" class="px"></canvas><h2 class="sh">LEVEL UP!</h2><p class="s sh">Lv.${P.lv} — 마법을 하나 고르세요</p>
    <div class="cards">${opts.length ? opts.map((s, i) => `<div class="card ${s.rar === 'l' ? 'l' : s.rar === 'e' ? 'e' : ''}" data-i="${i}"><div class="ic"><canvas></canvas></div><div><h3 class="sh">${s.name} ${lv(s.id) ? '' : '<span class="tag n">NEW</span>'}<span class="tag ${s.rar === 'l' ? 'l' : ''}">${R[s.rar]} · ${kindTxt[s.kind]}</span></h3><div class="st">${stars(lv(s.id) + 1, s.max)}</div><p>${s.desc(lv(s.id) + 1)}</p></div></div>`).join('')
      : `<div class="card" data-i="-1"><div><h3 class="sh">체력 회복</h3><p>모든 마법을 다 익혔어요. 체력을 모두 회복합니다.</p></div></div>`}</div>
    ${G.rerolls > 0 && opts.length ? `<button class="btn g" id="bReroll">🎲 다시 뽑기 (${G.rerolls}회)</button>` : ''}`;
  L.querySelectorAll('.card').forEach((c) => {
    const i = +c.dataset.i; if (i >= 0) { const cv = c.querySelector('canvas'); const src = fxIcon(...opts[i].ic); cv.width = src.width; cv.height = src.height; cv.getContext('2d').drawImage(src, 0, 0); }
    c.addEventListener('click', () => { if (i >= 0) take(opts[i]); else P.hp = P.maxHp; G.pendingLv--; L.classList.remove('on'); if (G.pendingLv > 0) showLevelUp(); else state = 'play'; });
  });
  const rr = $('bReroll'); if (rr) rr.onclick = () => { G.rerolls--; showLevelUp(); };
  const lc = $('lvfx'); const src = fxIcon('level-up', 6); lc.width = src.width; lc.height = src.height; lc.getContext('2d').drawImage(src, 0, 0);
  L.classList.add('on');
}
function take(s) {
  S[s.id] = lv(s.id) + 1;
  if (s.id === 'maxhp') { P.maxHp += 30; P.hp = Math.min(P.maxHp, P.hp + 30); }
  if (s.id === 'shield') P.shield = shieldMax();
  if (s.kind === 'auto' && CD[s.id] == null) CD[s.id] = 1;
  buildSkillBar();
}

// ============================================================ 피해 · 보호막
function damagePlayer(d) {
  if (P.inv > 0 || G.over) return; P.inv = .3; P.shieldT = 3;
  if (P.shield > 0) { const a = Math.min(P.shield, d); P.shield -= a; d -= a; showHex(); sfx('shield'); }
  if (d > 0) { P.hp -= d; sfx('hurt'); $('vign').style.opacity = 1; setTimeout(() => $('vign').style.opacity = 0, 160); G.shake = Math.max(G.shake, .15); }
  if (P.hp <= 0) { P.hp = 0; gameOver(); }
}
let hexT = 0;
function showHex() { if (hexT > -.8) return; hexT = .45; $('shieldfx').style.opacity = 1; setTimeout(() => $('shieldfx').style.opacity = 0, 200); }

// ============================================================ 업데이트
function update(dt) {
  G.t += dt;
  // 이동
  const [mx, mz] = moveInput(); const c = Math.cos(P.yaw), s = Math.sin(P.yaw); const sp = moveSpd();
  const wx = (mx * c + mz * s) * sp, wz = (-mx * s + mz * c) * sp; if (mx || mz) moveTo(P.x + wx * dt, P.z + wz * dt); P.bob += Math.hypot(mx, mz) * dt * 9;
  if (keys.KeyQ) P.yaw += dt * 2.4; if (keys.KeyE) P.yaw -= dt * 2.4;
  P.inv -= dt; P.dashT = Math.max(0, P.dashT - dt);
  // 재생 · 보호막
  if (lv('regen')) P.hp = Math.min(P.maxHp, P.hp + lv('regen') * .6 * dt);
  P.shieldT -= dt; if (shieldMax() && P.shieldT <= 0) P.shield = Math.min(shieldMax(), P.shield + shieldMax() * .25 * dt);
  // 파이어볼
  P.fireT -= dt; if (P.fireT <= 0) { P.fireT = 1 / fireRate(); fireballs(); }
  updateShots(dt);
  // 자동 마법
  for (const s of autoOwned()) { CD[s.id] = (CD[s.id] ?? 1) - dt; if (CD[s.id] <= 0) { const ok = CASTS[s.id].cast(lv(s.id)); CD[s.id] = ok ? CASTS[s.id].cd(lv(s.id)) : .5; } }
  // 스폰
  const rate = Math.min(7, .75 + G.t / 45 + (G.t / 220) ** 2); G.spawnAcc += dt * rate;
  while (G.spawnAcc >= 1) { G.spawnAcc--; if (enemies.length < 150) spawnEnemy(pickType(), rand(0, 6.283), rand(24, 32)); }
  if (G.t >= G.nextHorde) {
    G.nextHorde += 45; const a = rand(0, 6.283); const n = 10 + Math.floor(G.t / 20); const ty = pickType();
    for (let i = 0; i < n && enemies.length < 170; i++) spawnEnemy(ty, a + rand(-.35, .35), rand(26, 33));
    const [rx, ry] = rel(P.x + Math.sin(a) * 30, P.z - Math.cos(a) * 30); const ang = Math.atan2(rx, ry) * 180 / Math.PI;
    const dir = Math.abs(ang) < 35 ? '앞쪽' : Math.abs(ang) > 140 ? '뒤쪽' : ang < 0 ? (ang < -90 ? '왼쪽 뒤' : '왼쪽') : (ang > 90 ? '오른쪽 뒤' : '오른쪽');
    hint(`⚠ ${dir}에서 ${n}마리 무리 접근!`);
  }
  if (G.t >= G.nextBoss) { G.nextBoss += BOSS_EVERY; spawnBoss(); }
  // 적 — 시야(화면) 밖에 있으면 아주 느리게, 보이면 정상 속도
  const fwx = -Math.sin(P.yaw), fwz = -Math.cos(P.yaw), viewCos = Math.cos(Math.atan(Math.tan(camera.fov * Math.PI / 360) * camera.aspect) + .08);
  for (const e of enemies) {
    if (e.dead) continue;
    e.flash -= dt; e.frozen -= dt; e.slow -= dt; e.hitCd -= dt;
    if (e.burn > 0) { e.burn -= dt; e.burnAcc = (e.burnAcc || 0) + dt; if (e.burnAcc >= .5) { e.burnAcc = 0; hit(e, e.burnDps * .5, { col: '#ff9a5a', canCrit: false }); if (e.dead) continue; } }
    const dx = P.x - e.x, dz = P.z - e.z, d = Math.hypot(dx, dz) || 1;
    const seen = (-dx * fwx - dz * fwz) / d > viewCos; e.seen = seen;
    let sp = e.spd * (e.slow > 0 ? .45 : 1) * (e.frozen > 0 ? 0 : 1) * (seen ? 1 : .18);
    if (e.pull) { const px = e.pull.x - e.x, pz = e.pull.z - e.z, pd = Math.hypot(px, pz); if (pd > .6) { e.x += px / pd * Math.min(pd, 7 * dt); e.z += pz / pd * Math.min(pd, 7 * dt); } e.pull = null; sp = 0; }
    if (d > e.r + .55) { e.x += dx / d * sp * dt; e.z += dz / d * sp * dt; }
    else if (e.hitCd <= 0 && e.frozen <= 0) { e.hitCd = .8; damagePlayer(e.dmg); }
    e.x += e.kx * dt * 6; e.z += e.kz * dt * 6; e.kx *= .82; e.kz *= .82;
    e.s.position.set(e.x, e.y + (e.type.fly ? Math.sin(G.t * 4 + e.x) * .15 : 0), e.z); e.sh.position.set(e.x, .03, e.z);
    e.s.material.color.set(e.flash > 0 ? 0xff8080 : e.frozen > 0 ? 0x8fd8ff : e.slow > 0 ? 0xc0e4ff : e.burn > 0 ? 0xffc0a0 : 0xffffff);
  }
  // 겹침 풀기 (가벼운 밀어내기)
  for (let i = 0; i < enemies.length; i++) { const a = enemies[i]; if (a.dead) continue; for (let j = i + 1; j < Math.min(enemies.length, i + 14); j++) { const b = enemies[j]; if (b.dead) continue; const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz), m = (a.r + b.r) * .7; if (d < m && d > .001) { const p = (m - d) / 2 / d; if (!a.boss) { a.x -= dx * p; a.z -= dz * p; } if (!b.boss) { b.x += dx * p; b.z += dz * p; } } } }
  for (let i = enemies.length - 1; i >= 0; i--) if (enemies[i].dead) enemies.splice(i, 1);
  // 수정
  const mr = magnetR();
  for (let i = gems.length - 1; i >= 0; i--) {
    const g = gems[i]; const dx = P.x - g.x, dz = P.z - g.z, d = Math.hypot(dx, dz);
    if (d < mr) g.pull = true; if (g.pull) { g.sp = Math.min(22, g.sp + dt * 30); g.x += dx / d * g.sp * dt; g.z += dz / d * g.sp * dt; }
    g.s.position.set(g.x, .35 + Math.sin(G.t * 4 + g.ph) * .08, g.z);
    if (d < .7) { gainXp(g.v); scene.remove(g.s); gems.splice(i, 1); sfx('gem'); }
  }
  // 이펙트
  for (let i = effects.length - 1; i >= 0; i--) if (!effects[i].update(dt)) effects.splice(i, 1);
  if (G.pendingLv > 0 && state === 'play') showLevelUp();
}

// ============================================================ 카메라 · 그리기
let last = performance.now(), fpsAcc = 0, fpsN = 0, qualityChecked = false;
let frozen = false;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(.05, (now - last) / 1000); last = now;
  if (frozen) return;
  if (state === 'play') update(dt);
  else if (state === 'title' || state === 'over') { P.yaw += dt * .08; }
  drawFrame(dt);
}
function drawFrame(dt) {
  // 카메라
  G && (G.shake = Math.max(0, G.shake - dt));
  const sh = G ? G.shake : 0;
  camera.position.set(P.x + (Math.random() - .5) * sh * .6, 1.9 + Math.sin(P.bob) * .04 + (Math.random() - .5) * sh * .4, P.z);
  camera.rotation.set(P.pitch, P.yaw, 0);
  // 지팡이 흔들림 · 반동
  if (staff) {
    P.kick = Math.max(0, P.kick - dt * 6);
    staff.position.set(staffBase.p.x + Math.cos(P.bob * .5) * .012, staffBase.p.y + Math.abs(Math.sin(P.bob * .5)) * .012 - P.kick * .03, staffBase.p.z + P.kick * .035);
    staff.rotation.set(staffBase.r.x - P.kick * .12, staffBase.r.y, staffBase.r.z);
    const gl = staff.userData.glow; gl.scale.setScalar(Math.max(.9, gl.scale.x - dt * 3));
  }
  if (hexSprite) { hexT -= dt; hexSprite.visible = hexT > 0; if (hexT > 0) { const i = Math.floor((.45 - hexT) / .45 * 12) + 4; const { m, t } = FX.hexshield; const f = m.f[clamp(i, 0, m.f.length - 1)]; hexSprite.material.map.offset.set(f[0] / t.image.width, 1 - (f[1] + m.h) / t.image.height); } }
  if (state !== 'title' || composer) render();
  if (state === 'play') {
    drawOverlay(dt); hudT -= dt; if (hudT <= 0) { hudT = .1; updateHUD(); } mmT -= dt; if (mmT <= 0) { mmT = .1; drawMinimap(); }
    if (!qualityChecked && !TEST && G.t > 2) { fpsAcc += dt; fpsN++; if (fpsN >= 90) { qualityChecked = true; if (fpsAcc / fpsN > 1 / 38) { useBloom = false; DPR = 1; resize(); } } }
  }
}
// 테스트용: 멈춘 채로 n 스텝 진행 후 한 장 그리기
function stepDraw(n, dt = 1 / 30) { for (let i = 0; i < n; i++) { if (state === 'play' || state === 'sim') update(dt); } hudT = 0; mmT = 0; drawFrame(dt); }
function render() {
  renderer.autoClear = true;
  if (useBloom && composer) composer.render(); else renderer.render(scene, camera);
  renderer.autoClear = false; renderer.clearDepth(); renderer.render(vm, vmCam);
}

// ============================================================ 보상형 광고 (구글 플레이 앱에서만 — AdMob)
// 광고 단위 ID 는 웹에 있으니 바꿀 때 앱을 다시 빌드할 필요 없음. (앱 ID 는 android-wizard 의 AndroidManifest.xml)
const AD_UNIT_REWARD = 'ca-app-pub-9826307769121956/7687366324'; // AdMob '마법사 키우기 이어하기' (보상형)
const AdBridge = (function () {
  const cap = (function () { try { if (window.Capacitor) return window.Capacitor; } catch { } try { if (window.parent && window.parent !== window) return window.parent.Capacitor; } catch { } return undefined; })();
  const native = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const fake = !native && /[?&]testads=1/.test(location.search || '');
  const AM = native && ((cap.Plugins && cap.Plugins.AdMob) || (cap.registerPlugin && cap.registerPlugin('AdMob')));
  let ready = fake, loading = false, rewarded = false, pending = null, inited = false;
  const settle = (ok) => { if (pending) { const r = pending; pending = null; r(ok); } };
  async function load() { if (!AM || loading || ready) return; loading = true; try { await AM.prepareRewardVideoAd({ adId: AD_UNIT_REWARD }); ready = true; } catch { ready = false; } loading = false; }
  async function init() {
    if (!AM || inited) return; inited = true;
    try {
      AM.addListener('onRewardedVideoAdReward', () => { rewarded = true; });
      AM.addListener('onRewardedVideoAdDismissed', () => { ready = false; settle(rewarded); setTimeout(load, 500); });
      AM.addListener('onRewardedVideoAdFailedToShow', () => { ready = false; settle(false); setTimeout(load, 3000); });
      AM.addListener('onRewardedVideoAdLoaded', () => { ready = true; });
      AM.addListener('onRewardedVideoAdFailedToLoad', () => { ready = false; loading = false; setTimeout(load, 15000); });
      await AM.initialize({});
      try { const info = await AM.requestConsentInfo(); if (info && info.isConsentFormAvailable && info.status === 'REQUIRED') await AM.showConsentForm(); } catch { }
    } catch { }
    load();
  }
  return {
    init, preload: load, available() { return (native || fake) && ready; },
    show() { return new Promise((res) => { if (fake) { setTimeout(() => res(true), 400); return; } if (!AM || !ready) { res(false); return; } rewarded = false; pending = res; AM.showRewardVideoAd().catch(() => settle(false)); setTimeout(() => settle(false), 120000); }); },
  };
})();
AdBridge.init();
function setReviveUI() {
  const b = $('bRevive'); $('reviveMsg').style.display = 'none'; b.disabled = false; b.textContent = '📺 광고 보고 이어하기 (1회)';
  b.style.display = AdBridge.available() && !G.revived ? '' : 'none';
}
$('bRevive').onclick = async () => {
  const b = $('bRevive'); if (b.disabled || !G.over || G.revived) return;
  b.disabled = true; b.textContent = '광고 불러오는 중…';
  const ok = await AdBridge.show();
  if (ok) { revive(); AdBridge.preload(); }
  else { b.style.display = 'none'; const m = $('reviveMsg'); m.textContent = '광고를 끝까지 보지 않았거나 불러오지 못했어요.'; m.style.display = ''; AdBridge.preload(); }
};
function revive() {
  G.revived = true; G.over = false; P.hp = Math.ceil(P.maxHp * .5); P.shield = shieldMax(); P.inv = 3;
  for (const e of enemies) { const dx = e.x - P.x, dz = e.z - P.z, d = Math.hypot(dx, dz) || 1; if (d < 12) { const k = e.boss ? 1 : 5; e.kx += dx / d * k; e.kz += dz / d * k; e.frozen = Math.max(e.frozen, e.boss ? 0 : 1.5); } }
  anim('level-up', v3(P.x, 0, P.z - 2), .05, { ro: 9, add: true });
  $('sOver').classList.remove('on'); $('hud').classList.add('on'); state = 'play'; last = performance.now();
  banner('이어하기!', '3초 동안 무적'); sfx('lvl');
}

// ============================================================ 흐름
function togglePause() {
  if (state === 'play') { state = 'pause'; renderPauseSkills(); $('sPause').classList.add('on'); }
  else if (state === 'pause') { state = 'play'; $('sPause').classList.remove('on'); last = performance.now(); }
}
function renderPauseSkills() {
  const own = SKILLS.filter((s) => S[s.id]);
  $('pauseSkills').innerHTML = own.length ? own.map((s) => `<div class="card" style="padding:6px 10px;cursor:default"><div><h3 class="sh" style="font-size:13px">${s.name} <span class="tag">Lv ${S[s.id]}</span></h3></div></div>`).join('') : '<p class="s sh">아직 배운 마법이 없어요</p>';
}
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') togglePause(); if (AC) { if (document.hidden) AC.suspend(); else AC.resume(); } });
$('bResume').onclick = togglePause;
$('bQuit').onclick = () => { $('sPause').classList.remove('on'); toTitle(); };
$('bStart').onclick = start; $('bRetry').onclick = start;
// 로그인 (포털 · 앱 안에서만) — 랭킹 기록용
let authed = false;
if (window.MGH && MGH.embedded && MGH.save) {
  const sync = () => { $('bLogin').style.display = authed ? 'none' : ''; };
  if (MGH.save.onAuth) MGH.save.onAuth((u) => { authed = !!u; sync(); });
  if (MGH.save.user) { try { const u = MGH.save.user(); if (u !== undefined) { authed = !!u; sync(); } } catch { } }
  $('bLogin').onclick = () => MGH.save.login && MGH.save.login();
}
function bestRec() { try { return +localStorage.getItem('wizard:best') || 0; } catch { return 0; } }
function toTitle() { state = 'title'; $('hud').classList.remove('on'); $('sOver').classList.remove('on'); $('sTitle').classList.add('on'); og.clearRect(0, 0, ov.width, ov.height); showBest(); }
function showBest() { const b = bestRec(); $('bestTxt').textContent = b ? `최고 기록 ${fmtTime(b)}` : ''; }
function start() {
  audio(); newGame(); state = 'play'; last = performance.now();
  $('sTitle').classList.remove('on'); $('sOver').classList.remove('on'); $('hud').classList.add('on');
  joyEl.className = touchUI ? 'joy idle' : 'joy'; placeIdleJoy();
  banner('사냥 시작!', '공격은 자동 — 몬스터를 피해 다니세요');
}
function gameOver() {
  if (G.over) return; G.over = true; state = 'over';
  const secs = Math.floor(G.t);
  if (window.MGH && MGH.submitScore && secs >= 10) MGH.submitScore('wizard', secs, { lv: P.lv, kills: G.kills, boss: G.bossKills });
  const prev = bestRec(); if (secs > prev) try { localStorage.setItem('wizard:best', secs); } catch { }
  $('oTime').textContent = fmtTime(secs); $('oLv').textContent = P.lv; $('oKill').textContent = G.kills; $('oBoss').textContent = G.bossKills;
  $('overSub').textContent = G.bossKills ? `보스 ${G.bossKills}체를 쓰러뜨렸다. 다음엔 더 멀리.` : '보스의 그림자조차 보지 못했다.';
  $('oBest').textContent = secs > prev ? '🏆 새 최고 기록!' : `최고 기록 ${fmtTime(Math.max(prev, secs))}`;
  const sb = $('bShare'); sb.style.display = 'none';
  if (window.MGH && MGH.result && secs >= 10) {
    sb.style.display = ''; sb.onclick = () => MGH.result.open({ board: 'wizard', score: secs, fmt: (s) => fmtTime(s), game: '마법사 키우기', icon: '🧙', accent: '#ff8a3c', label: '내 생존', friend: '친구', question: '누가 오래 버티나?', sub: `LV ${P.lv} · 처치 ${G.kills}${G.bossKills ? ` · 보스 ${G.bossKills}` : ''}`, meta: { lv: P.lv, kills: G.kills, boss: G.bossKills }, shareText: `🧙 마법사 키우기 ${fmtTime(secs)} 생존! 누가 더 오래 버티나 대결하자` });
  }
  setReviveUI();
  setTimeout(() => { $('hud').classList.remove('on'); og.clearRect(0, 0, ov.width, ov.height); $('sOver').classList.add('on'); }, 700);
}

// ============================================================ 시작
(async function boot() {
  resize(); P = { x: 0, z: 0, yaw: 0, pitch: -.08, bob: 0, kick: 0 }; G = { shake: 0 };
  const prog = (t) => { $('loadTxt').textContent = t; };
  try {
    prog('불러오는 중… 이펙트');
    await Promise.all([
      ...['fireball-impact', 'hit-spark', 'crit-hit', 'ice-spike', 'blizzard', 'meteor-strike', 'big-explosion', 'fire-pillar', 'ground-flames', 'void-implosion', 'whirlwind', 'level-up'].map(loadFx),
      loadStrip('mp-lightning', 64, [32, 124]), loadStrip('mp-darkbolt', 64, [32, 84]), loadStrip('mp-firebomb', 64, [32, 54]), loadStrip('mp-spark', 32, [16, 16]), loadStrip('boom-d', 128, [64, 100], 80), loadStrip('hexshield', 192, [96, 96], 60, 192),
      ...MTYPES.map((m) => loadMon(m.k)), ...BOSSES.map((b) => loadMon(b.k)),
      document.fonts.load('16px G'), document.fonts.load('700 16px G'),
    ]);
    prog('불러오는 중… 숲'); await Promise.all([loadNature(), loadStaff()]);
  } catch (e) { prog('불러오기 실패 — 새로고침 해주세요'); console.error(e); return; }
  buildForest();
  { const { m, t } = FX.hexshield; const tex = t.clone(); tex.needsUpdate = true; tex.repeat.set(m.w / t.image.width, m.h / t.image.height); hexSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: .3, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false })); hexSprite.position.set(0, 0, -.6); hexSprite.scale.setScalar(1.3); hexSprite.visible = false; vm.add(hexSprite); }
  composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), .6, .45, .9); composer.addPass(bloom); composer.addPass(new OutputPass());
  resize(); enemies = []; shots = []; gems = []; effects = []; nums = [];
  // 타이틀 배경용 몬스터 몇 마리
  G = { t: 0, shake: 0 }; P = { x: 0, z: 0, yaw: 0, pitch: -.05, bob: 0, kick: 0 };
  for (let i = 0; i < 10; i++) spawnEnemy(MTYPES[i % 6], rand(0, 6.28), rand(9, 22));
  $('bStart').disabled = false; $('bStart').textContent = '사냥 시작'; showBest();
  requestAnimationFrame(frame);
  if (TEST) window.__wz = { get P() { return P; }, get G() { return G; }, get S() { return S; }, get enemies() { return enemies; }, start, take: (id) => take(SK[id]), setMove: (m) => testMove = m, spawnBoss, CASTSX: CASTS, freeze: (f) => frozen = f, stepDraw, get CD() { return CD; }, hurt: (d) => damagePlayer(d), SK, setState: (s) => state = s, get state() { return state; }, CASTS, update };
})();
