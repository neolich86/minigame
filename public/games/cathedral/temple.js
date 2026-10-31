// 절 모드 — 나무 마루와 방석, 정면 불상, 천장을 채운 연등, 목탁과 염불 소리
import * as THREE from 'three';
import { GLTFLoader } from './vendor/jsm/GLTFLoader.js';
import { MeshoptDecoder } from './vendor/jsm/libs/meshopt_decoder.module.js';

const LOTUS_COLS = [0xff5a8a, 0xff3b4e, 0xffc23d, 0x5fd37a, 0x4aa8ff, 0xb46bff, 0xff8a3d, 0xff7bd5, 0xfff07a];

function petalTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 128);
  // 꽃잎 줄 (세로 둘레 방향) — 위쪽 끝은 밝게, 사이사이 진한 선
  for (let row = 0; row < 4; row++) for (let i = 0; i < 12; i++) {
    const x = i * 256 / 12 + (row % 2) * 256 / 24, y = 128 - row * 30;
    const gr = g.createLinearGradient(0, y, 0, y - 44); gr.addColorStop(0, 'rgb(150,150,150)'); gr.addColorStop(.7, 'rgb(235,235,235)'); gr.addColorStop(1, '#fff');
    g.fillStyle = gr; g.beginPath(); g.moveTo(x - 11, y); g.quadraticCurveTo(x - 12, y - 30, x, y - 46); g.quadraticCurveTo(x + 12, y - 30, x + 11, y); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(90,90,90,.6)'; g.lineWidth = 1.5; g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; return t;
}

function haloTex() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'), m = 256;
  const gr = g.createRadialGradient(m, m, 40, m, m, 250); gr.addColorStop(0, 'rgba(255,230,150,.95)'); gr.addColorStop(.45, 'rgba(255,190,80,.55)'); gr.addColorStop(.75, 'rgba(255,150,40,.35)'); gr.addColorStop(1, 'rgba(255,120,20,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(m, m, 250, 0, 7); g.fill();
  g.strokeStyle = 'rgba(255,240,190,.9)'; g.lineWidth = 6; for (const r of [120, 170]) { g.beginPath(); g.arc(m, m, r, 0, 7); g.stroke(); }
  // 불꽃 무늬 테두리
  g.fillStyle = 'rgba(255,210,120,.8)';
  for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; g.save(); g.translate(m + Math.cos(a) * 205, m + Math.sin(a) * 205); g.rotate(a + Math.PI / 2); g.beginPath(); g.moveTo(-10, 12); g.quadraticCurveTo(-8, -10, 0, -26); g.quadraticCurveTo(8, -10, 10, 12); g.fill(); g.restore(); }
  return new THREE.CanvasTexture(c);
}

// 결가부좌한 불상 (도형을 쌓아 만든 단순한 형태)
function buddha(gold) {
  const B = new THREE.Group();
  const M = (geo, x, y, z, sx = 1, sy = 1, sz = 1, mat = gold) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); B.add(m); return m; };
  // 연꽃 대좌
  const redM = new THREE.MeshStandardMaterial({ color: 0x8a1c14, roughness: .6 });
  M(new THREE.CylinderGeometry(1.9, 2.1, .5, 40), 0, .25, 0, 1, 1, 1, redM);
  M(new THREE.CylinderGeometry(1.7, 1.9, .3, 40), 0, .65, 0);
  for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 16; i++) {
    const a = (i + ring * .5) / 16 * Math.PI * 2, r = 1.75 - ring * .25;
    const p = M(new THREE.SphereGeometry(.42, 12, 8), Math.cos(a) * r, .95 + ring * .18, Math.sin(a) * r, .55, 1, .3);
    p.rotation.y = -a + Math.PI / 2; p.rotation.x = -.35;
  }
  // 다리 (가부좌)
  M(new THREE.SphereGeometry(1, 32, 16), 0, 1.45, .25, 1.35, .42, .85);
  // 몸통 · 어깨 · 가사
  M(new THREE.CylinderGeometry(.62, .9, 1.6, 28), 0, 2.4, 0);
  M(new THREE.SphereGeometry(.68, 24, 16), 0, 3.15, 0, 1.3, .55, .85);
  // 팔 (무릎 위로 모은 손)
  for (const s of [-1, 1]) {
    const up = M(new THREE.CapsuleGeometry(.22, .8, 6, 12), s * .88, 2.65, .05); up.rotation.z = s * .25;
    const lo = M(new THREE.CapsuleGeometry(.2, .65, 6, 12), s * .5, 1.95, .45); lo.rotation.z = s * 1.2; lo.rotation.y = s * .4;
  }
  M(new THREE.SphereGeometry(.3, 16, 12), 0, 1.86, .62, 1.3, .55, .9); // 선정인 손
  // 목 · 머리 · 육계 · 귀
  M(new THREE.CylinderGeometry(.24, .28, .35, 16), 0, 3.5, 0);
  M(new THREE.SphereGeometry(.55, 32, 24), 0, 4.05, .02, 1, 1.12, 1);
  const hair = new THREE.MeshStandardMaterial({ color: 0x2b3a5a, roughness: .7, metalness: .2 });
  M(new THREE.SphereGeometry(.57, 32, 16, 0, Math.PI * 2, 0, Math.PI * .45), 0, 4.12, -.02, 1, 1.12, 1, hair);
  M(new THREE.SphereGeometry(.3, 20, 14), 0, 4.62, -.04, 1, .8, 1, hair);
  for (const s of [-1, 1]) M(new THREE.CapsuleGeometry(.08, .45, 4, 8), s * .56, 3.95, 0, 1, 1, .6);
  const face = new THREE.MeshBasicMaterial({ color: 0x5a3a10 });
  for (const s of [-1, 1]) { const e = M(new THREE.CapsuleGeometry(.018, .14, 4, 8), s * .19, 4.1, .54, 1, 1, 1, face); e.rotation.z = Math.PI / 2; }
  M(new THREE.SphereGeometry(.035, 8, 8), 0, 4.25, .56, 1, 1, 1, face); // 백호
  return B;
}


// ───────── 법당 건물 (대웅전 내부) ─────────
function cv(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
// 단청 보: 녹색 몸통 + 양 끝 머리초(동심 꽃무늬) + 가운데 금문
const dancheongTex = () => cv(1024, 128, (g, w, h) => {
  g.fillStyle = '#2f7d62'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1d4f8a'; g.fillRect(0, 0, w, 10); g.fillRect(0, h - 10, w, 10);
  g.fillStyle = '#f4ecd8'; g.fillRect(0, 10, w, 3); g.fillRect(0, h - 13, w, 3);
  const flower = (cx) => {
    const R = [[56, '#c8352b'], [46, '#f4ecd8'], [40, '#1d4f8a'], [30, '#f2b632'], [22, '#c8352b'], [12, '#f4ecd8']];
    for (const [r, c] of R) { g.fillStyle = c; g.beginPath(); g.ellipse(cx, h / 2, r * .9, r * .95, 0, 0, 7); g.fill(); }
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; g.fillStyle = k % 2 ? '#e86a3a' : '#7ac4a0'; g.beginPath(); g.ellipse(cx + Math.cos(a) * 60, h / 2 + Math.sin(a) * 40, 12, 7, a, 0, 7); g.fill(); }
  };
  for (const cx of [70, w - 70]) { g.fillStyle = '#1d4f8a'; g.fillRect(cx - 70, 13, 140, h - 26); flower(cx); }
  for (const x of [150, 160, w - 160, w - 150]) { g.fillStyle = x % 20 ? '#c8352b' : '#f4ecd8'; g.fillRect(x - 3, 13, 6, h - 26); }
  g.strokeStyle = '#f2b632'; g.lineWidth = 3; g.strokeRect(w / 2 - 120, 30, 240, h - 60);
  g.fillStyle = '#c8352b'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(w / 2 - 100 + i * 40, h / 2, 9, 0, 7); g.fill(); }
});
// 우물천장: 녹색 반자틀 + 가운데 연꽃
const ceilingTex = () => cv(256, 256, (g, w) => {
  g.fillStyle = '#25644e'; g.fillRect(0, 0, w, w);
  g.fillStyle = '#c8352b'; for (const [x, y] of [[0, 0], [w, 0], [0, w], [w, w]]) { g.beginPath(); g.arc(x, y, 22, 0, 7); g.fill(); }
  g.fillStyle = '#1d4f8a'; g.fillRect(26, 26, w - 52, w - 52);
  g.strokeStyle = '#f2b632'; g.lineWidth = 4; g.strokeRect(34, 34, w - 68, w - 68);
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; g.fillStyle = k % 2 ? '#f08aa8' : '#f6c2d0'; g.beginPath(); g.ellipse(w / 2 + Math.cos(a) * 40, w / 2 + Math.sin(a) * 40, 34, 15, a, 0, 7); g.fill(); }
  g.fillStyle = '#f2b632'; g.beginPath(); g.arc(w / 2, w / 2, 20, 0, 7); g.fill();
  g.fillStyle = '#c8352b'; g.beginPath(); g.arc(w / 2, w / 2, 9, 0, 7); g.fill();
});
// 꽃살문: 한지에 비친 빛 + 빗살 격자 + 테두리
const latticeTex = () => cv(256, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#fff3d2'); gr.addColorStop(1, '#f3d9a0'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#6a3a1e'; g.lineWidth = 7;
  for (let d = -h; d < w + h; d += 34) { g.beginPath(); g.moveTo(d, 0); g.lineTo(d + h, h); g.stroke(); g.beginPath(); g.moveTo(d, h); g.lineTo(d + h, 0); g.stroke(); }
  g.lineWidth = 4; for (let y = 0; y < h; y += 34) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.fillStyle = '#5a2a14'; g.fillRect(0, 0, w, 18); g.fillRect(0, h - 18, w, 18); g.fillRect(0, 0, 18, h); g.fillRect(w - 18, 0, 18, h); g.fillRect(0, h * .62, w, 22);
  g.fillStyle = '#6a3a1e'; g.fillRect(18, h * .62 + 22, w - 36, h * .38 - 40); // 아래 궁창판
  g.strokeStyle = '#c8352b'; g.lineWidth = 3; g.strokeRect(34, h * .62 + 36, w - 68, h * .38 - 68);
});
// 후불벽: 붉은 바탕 + 금빛 구름 + 테두리
const backTex = () => cv(512, 512, (g, w, h) => {
  g.fillStyle = '#7a1a14'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#e0a83a'; g.lineWidth = 12; g.strokeRect(14, 14, w - 28, h - 28); g.lineWidth = 4; g.strokeRect(36, 36, w - 72, h - 72);
  g.strokeStyle = 'rgba(240,190,90,.55)'; g.lineWidth = 5;
  for (let i = 0; i < 14; i++) { const x = 70 + (i * 97) % (w - 140), y = 80 + (i * 61) % (h - 160); for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x + k * 22, y, 14 + k * 4, Math.PI, 0); g.stroke(); } }
});

function buildHall(G, FLOOR, CX, TZ) {
  const X0 = CX - 10, X1 = CX + 10, Z0 = 12.6, Z1 = TZ - 4.5, H = 10, POST = 7.4;
  const W = X1 - X0, D = Z0 - Z1;
  const plaster = new THREE.MeshStandardMaterial({ color: 0xe8dcc4, roughness: .95 });
  const red = new THREE.MeshStandardMaterial({ color: 0x8a2a1c, roughness: .6 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x5a2e18, roughness: .7 });
  const dTex = dancheongTex(), dM = new THREE.MeshStandardMaterial({ map: dTex, roughness: .7 });
  const lat = latticeTex(), latM = new THREE.MeshStandardMaterial({ map: lat, emissive: 0xffe2a8, emissiveMap: lat, emissiveIntensity: .55, roughness: .9, side: THREE.DoubleSide });
  const add = (geo, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; G.add(m); return m; };
  // 벽: 아래 머름(나무) · 문 · 위 회벽
  const sides = [ // [가운데x, 가운데z, 길이, 회전]
    [CX, Z0, W, Math.PI], [X0, (Z0 + Z1) / 2, D, Math.PI / 2], [X1, (Z0 + Z1) / 2, D, -Math.PI / 2],
  ];
  const sunWins = { left: [], right: [], back: [], front: [] };
  for (const [cx, cz, len, ry] of sides) {
    const n = Math.round(len / 2.5), seg = len / n;
    add(new THREE.BoxGeometry(len, .7, .25), wood, cx, FLOOR + .35, cz, ry);
    add(new THREE.BoxGeometry(len, H - 4.1, .25), plaster, cx, FLOOR + 4.1 + (H - 4.1) / 2, cz, ry);
    const dir = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry);
    for (let i = 0; i < n; i++) {
      const o = -len / 2 + seg * (i + .5), x = cx + dir.x * o, z = cz + dir.z * o;
      add(new THREE.PlaneGeometry(seg - .12, 3.4), latM, x, FLOOR + .7 + 1.7, z, ry);
      add(new THREE.BoxGeometry(.14, 3.4, .3), wood, x + dir.x * seg / 2, FLOOR + 2.4, z + dir.z * seg / 2, ry);
      const w = { x, y: FLOOR + 2.4, z };
      if (cz === Z0) sunWins.back.push(w); else if (cx === X0) sunWins.left.push(w); else sunWins.right.push(w);
    }
    add(new THREE.BoxGeometry(len, .5, .4), dM, cx, FLOOR + 4.1, cz, ry); // 창방
  }
  // 뒤쪽(불상 뒤) 후불벽 + 위쪽 광창
  add(new THREE.BoxGeometry(W, H, .3), plaster, CX, FLOOR + H / 2, Z1);
  add(new THREE.PlaneGeometry(9, 7.2), new THREE.MeshStandardMaterial({ map: backTex(), roughness: .8 }), CX, FLOOR + 4.6, Z1 + .2);
  for (const s of [-1, 1]) { add(new THREE.PlaneGeometry(2.6, 1.4), latM, CX + s * 6.8, FLOOR + 8.3, Z1 + .2); sunWins.front.push({ x: CX + s * 6.8, y: FLOOR + 8.3, z: Z1 + .3 }); }
  // 기둥 (안쪽 고주 두 줄 + 벽 기둥)
  const colGeo = new THREE.CylinderGeometry(.3, .34, POST, 20), baseGeo = new THREE.CylinderGeometry(.48, .55, .3, 8);
  const stone = new THREE.MeshStandardMaterial({ color: 0x8a8478, roughness: .9 });
  const posts = [];
  for (let z = Z0 - 2.6; z > Z1 + 2; z -= 4.8) for (const x of [CX - 6.2, CX + 6.2]) posts.push([x, z]);
  for (const [x, z] of posts) { add(colGeo, red, x, FLOOR + POST / 2, z); add(baseGeo, stone, x, FLOOR + .15, z); }
  // 보 (기둥 줄을 따라) · 대들보 (가로)
  for (const x of [CX - 6.2, CX + 6.2]) add(new THREE.BoxGeometry(.55, .7, D), dM, x, FLOOR + POST + .2, (Z0 + Z1) / 2, Math.PI / 2).rotation.y = 0;
  const zs = [...new Set(posts.map((p) => p[1]))];
  for (const z of zs) { const b = add(new THREE.BoxGeometry(W, .8, .6), dM, CX, FLOOR + POST + .7, z); b.rotation.y = 0; }
  // 천장: 가운데는 높은 우물천장, 양쪽은 조금 낮게
  const cT = ceilingTex(); cT.wrapS = cT.wrapT = THREE.RepeatWrapping;
  const ceilMid = cT.clone(); ceilMid.repeat.set(12.4 / 1.6, D / 1.6); ceilMid.needsUpdate = true;
  const cm = add(new THREE.PlaneGeometry(12.4, D), new THREE.MeshStandardMaterial({ map: ceilMid, roughness: .85, emissive: 0x111111 }), CX, FLOOR + H, (Z0 + Z1) / 2); cm.rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) {
    const sm = cT.clone(); sm.repeat.set(3.8 / 1.6, D / 1.6); sm.needsUpdate = true;
    const m = add(new THREE.PlaneGeometry(3.8, D), new THREE.MeshStandardMaterial({ map: sm, roughness: .85 }), CX + s * 8.1, FLOOR + POST + 1.1, (Z0 + Z1) / 2); m.rotation.x = Math.PI / 2;
    add(new THREE.BoxGeometry(.3, H - POST - 1.1, D), plaster, CX + s * 6.2, FLOOR + (H + POST + 1.1) / 2, (Z0 + Z1) / 2);
  }
  // 조명: 한지문으로 들어오는 은은한 빛
  const amb = new THREE.HemisphereLight(0xfff0d8, 0x6a4028, .9); G.add(amb);
  for (const z of [8, 0, -8]) { const l = new THREE.PointLight(0xffd8a8, 9, 16, 1.6); l.position.set(CX, FLOOR + 6, z); G.add(l); }
  // 걷기 격자에 넣을 벽·기둥
  const navMark = (nav) => {
    nav.segment(X0, Z0, X1, Z0); nav.segment(X0, Z1, X1, Z1); nav.segment(X0, Z0, X0, Z1); nav.segment(X1, Z0, X1, Z1);
    for (const [x, z] of posts) nav.box(x, z, .4, .4);
  };
  return { sunWins, navMark, bounds: { X0, X1, Z0, Z1, H } };
}

export function buildTemple(scene, { FLOOR, CX, woodMap }) {
  const G = new THREE.Group(); G.visible = false; scene.add(G);
  const ALTAR_Z = -12.5; // 법당 안 불상 자리
  const HALL = buildHall(G, FLOOR, CX, ALTAR_Z);
  // 나무 마루
  const maru = woodMap.clone(); maru.repeat.set(12, 10); maru.rotation = Math.PI / 2; maru.needsUpdate = true;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20.4, 30), new THREE.MeshStandardMaterial({ map: maru, color: 0xb07a4a, roughness: .55 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(CX, FLOOR + .03, -2.2); G.add(floor);
  // 방석 (가운데 통로를 두고 양쪽에 줄지어)
  const slots = [];
  const cushionCols = [0x8a1f2e, 0x5b2a7a, 0x7a3a12, 0x1f4a7a];
  const cGeo = new THREE.CylinderGeometry(.33, .36, .1, 28), rimGeo = new THREE.TorusGeometry(.33, .035, 8, 28);
  for (let z = 9.6, row = 0; z > -6; z -= 1.3, row++) for (const s of [-1, 1]) for (let k = 0; k < 4; k++) {
    const x = CX + s * (1.4 + k * 1.05);
    const col = cushionCols[(row + (s > 0 ? 1 : 0)) % cushionCols.length];
    const c = new THREE.Mesh(cGeo, new THREE.MeshStandardMaterial({ color: col, roughness: .9 })); c.position.set(x, FLOOR + .08, z); G.add(c);
    const rim = new THREE.Mesh(rimGeo, new THREE.MeshStandardMaterial({ color: 0xd8a640, roughness: .5, metalness: .3 })); rim.rotation.x = Math.PI / 2; rim.position.set(x, FLOOR + .13, z); G.add(rim);
    slots.push({ x, z, taken: null });
  }
  // 불단과 불상
  const gold = new THREE.MeshStandardMaterial({ color: 0xe0a83a, metalness: .85, roughness: .32, emissive: 0x1a1004 });
  const dais = new THREE.Mesh(new THREE.BoxGeometry(8.5, 1.0, 5.5), new THREE.MeshStandardMaterial({ color: 0x6a1410, roughness: .6 }));
  dais.position.set(CX, FLOOR + .5, ALTAR_Z - .5); G.add(dais);
  // 관음보살상 (cgtrader 모델을 줄이고 압축한 assets/guanyin.glb) — 받는 동안은 단순한 불상을 대신 세워 둔다
  const S = 1.3; const bud = new THREE.Group(); bud.position.set(CX, FLOOR + 1.0, ALTAR_Z - .8); G.add(bud);
  const stand = buddha(gold); stand.scale.setScalar(S); bud.add(stand);
  const STATUE_H = 6.4; // 연꽃 대좌 포함 높이 (m)
  new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync('assets/guanyin.glb').then((g) => {
    const m = g.scene; m.rotation.x = -Math.PI / 2; // 모델은 Z 축이 위
    m.traverse((o) => { if (o.isMesh) { o.material = gold; o.frustumCulled = false; } });
    m.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(m), k = STATUE_H / (box.max.y - box.min.y);
    m.scale.setScalar(k); m.updateMatrixWorld(true);
    const b2 = new THREE.Box3().setFromObject(m), c = b2.getCenter(new THREE.Vector3());
    m.position.set(-c.x, -b2.min.y, -c.z);
    bud.remove(stand); bud.add(m);
    halo.position.y = FLOOR + 1.0 + STATUE_H - .75; halo.scale.setScalar(1.05);
    body.position.y = FLOOR + 1.0 + STATUE_H * .5; body.scale.set(1.1, 1.45, 1);
  }).catch((e) => console.warn('statue', e));
  const halo = new THREE.Mesh(new THREE.CircleGeometry(2.6, 48), new THREE.MeshBasicMaterial({ map: haloTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.position.set(CX, FLOOR + 1.0 + 4.0 * S, ALTAR_Z - 1.9); halo.scale.setScalar(S / 1.15); G.add(halo);
  const body = new THREE.Mesh(new THREE.CircleGeometry(3.6, 48), halo.material.clone()); body.material.opacity = .55;
  body.position.set(CX, FLOOR + 1.0 + 2.6 * S, ALTAR_Z - 2.0); body.scale.set(S / 1.15, 1.25 * S / 1.15, 1); G.add(body);
  const spot = new THREE.SpotLight(0xffd9a0, 55, 34, .55, .6, 1.4); spot.position.set(CX, FLOOR + 8.5, ALTAR_Z + 8); spot.target = bud; G.add(spot);
  const fill = new THREE.PointLight(0xffb070, 10, 10, 1.6); fill.position.set(CX, FLOOR + 3, ALTAR_Z + 2.5); G.add(fill);
  // 불단 앞 작은 상
  const table = new THREE.Mesh(new THREE.BoxGeometry(2.4, .55, .8), new THREE.MeshStandardMaterial({ color: 0x4a1a10, roughness: .5 }));
  table.position.set(CX, FLOOR + .28, ALTAR_Z + 2.4); G.add(table);

  // 연등 — 천장 아래를 가득 채운 알록달록한 연꽃 등
  const lgeo = new THREE.LatheGeometry([[0, -.32], [.18, -.3], [.3, -.18], [.34, 0], [.3, .16], [.2, .27], [.08, .32], [0, .33]].map(([x, y]) => new THREE.Vector2(x, y)), 18);
  const lmat = new THREE.MeshBasicMaterial({ map: petalTex() });
  const spots = [];
  for (let z = 11.3; z > ALTAR_Z - 3; z -= 1.1) for (let x = CX - 8.8; x <= CX + 8.81; x += 1.1) {
    if (z < ALTAR_Z + 6 && Math.abs(x - CX) < 4.4) continue; // 불상 머리 위는 비움
    if (Math.abs(Math.abs(x - CX) - 6.2) < .5) continue; // 기둥 자리 // 불상 머리 위는 비움
    spots.push([x + (Math.random() - .5) * .3, z + (Math.random() - .5) * .3]);
  }
  const N = spots.length;
  const lan = new THREE.InstancedMesh(lgeo, lmat, N), col = new THREE.Color(), m4 = new THREE.Matrix4();
  const linePos = new Float32Array(N * 6), meta = [];
  spots.forEach(([x, z], i) => {
    const hi = Math.abs(x - CX) < 6 ? 8.6 : 6.8; const y = FLOOR + hi - 1.4 - Math.random() * 2.2;
    meta.push({ x, y, z, ph: Math.random() * 6 });
    m4.makeTranslation(x, y, z); lan.setMatrixAt(i, m4);
    col.setHex(LOTUS_COLS[Math.floor(Math.random() * LOTUS_COLS.length)]).multiplyScalar(1.5); lan.setColorAt(i, col);
    linePos.set([x, y + .33, z, x, FLOOR + (Math.abs(x - CX) < 6 ? 10 : 8.5), z], i * 6);
  });
  G.add(lan);
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  G.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x3a2a1c, transparent: true, opacity: .5 })));
  // 꼬리 술
  const tail = new THREE.InstancedMesh(new THREE.CylinderGeometry(.02, .05, .35, 6), new THREE.MeshBasicMaterial({ color: 0xffe9a0 }), N);
  meta.forEach((p, i) => { m4.makeTranslation(p.x, p.y - .5, p.z); tail.setMatrixAt(i, m4); }); G.add(tail);
  // 연등 빛이 아래로 번지도록 색 점광원 몇 개
  [[0xff6a8a, -2], [0xffc040, -8], [0x7ab0ff, 4], [0xff8040, 9]].forEach(([c, z]) => { const l = new THREE.PointLight(c, 6, 12, 1.6); l.position.set(CX, FLOOR + 6.5, z); G.add(l); });

  function update(t) {
    for (let i = 0; i < N; i++) { const p = meta[i], s = Math.sin(t * .6 + p.ph) * .025; m4.makeRotationZ(s).setPosition(p.x, p.y, p.z); lan.setMatrixAt(i, m4); }
    lan.instanceMatrix.needsUpdate = true;
    halo.rotation.z = t * .03;
  }
  return { group: G, slots, update, sunWins: HALL.sunWins, navMark: HALL.navMark, ALTAR_Z, bounds: HALL.bounds };
}

// ───────── 목탁과 염불 (브라우저에서 합성) ─────────
const VOWEL = { a: [800, 1150, 2900], u: [350, 700, 2500], i: [300, 2100, 2900], o: [450, 800, 2830], ul: [400, 750, 2500] };
// 나 무 아 미 타 불 — 한 박에 한 음절, 목탁과 함께
const CHANT = [['a', 0], ['u', 0], ['a', 0], ['i', 0], ['a', 0], ['ul', -2]];
export function templeAudio(ac, out) {
  const bus = ac.createGain(); bus.gain.value = 0; bus.connect(out);
  const noiseBuf = ac.createBuffer(1, ac.sampleRate * .05, ac.sampleRate); const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  function moktak(t, v = 1) {
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(620, t); o.frequency.exponentialRampToValueAtTime(470, t + .08);
    const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.55 * v, t + .003); g.gain.exponentialRampToValueAtTime(.001, t + .22);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + .25);
    const n = ac.createBufferSource(); n.buffer = noiseBuf; const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 6;
    const ng = ac.createGain(); ng.gain.setValueAtTime(.5 * v, t); ng.gain.exponentialRampToValueAtTime(.001, t + .04);
    n.connect(bp); bp.connect(ng); ng.connect(bus); n.start(t);
  }
  function bowl(t) { // 경쇠·풍경 같은 맑은 울림
    [[1, .12], [2.71, .05], [5.4, .02]].forEach(([k, a]) => { const o = ac.createOscillator(); o.frequency.value = 523 * k; const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + .01); g.gain.exponentialRampToValueAtTime(.0005, t + 7); o.connect(g); g.connect(bus); o.start(t); o.stop(t + 7.2); });
  }
  function syllable(t, dur, vow, semi) {
    const f0 = 110 * Math.pow(2, semi / 12), F = VOWEL[vow];
    const env = ac.createGain(); env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(.32, t + .07); env.gain.setValueAtTime(.32, t + dur * .7); env.gain.linearRampToValueAtTime(0, t + dur * .98);
    const mix = ac.createGain(); mix.gain.value = 1;
    for (const det of [-6, 5]) { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f0; o.detune.value = det; o.connect(mix); o.start(t); o.stop(t + dur); }
    F.forEach((f, i) => { const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 9 - i * 2; const g = ac.createGain(); g.gain.value = [1, .55, .22][i]; mix.connect(bp); bp.connect(g); g.connect(env); });
    if (vow === 'ul') { const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(2000, t); lp.frequency.linearRampToValueAtTime(500, t + dur); env.connect(lp); lp.connect(bus); }
    else env.connect(bus);
  }
  const BEAT = .78; let next = 0, n = 0;
  return {
    bus,
    schedule(active) {
      if (!active) { next = 0; return; }
      if (!next) next = ac.currentTime + .3;
      while (next < ac.currentTime + 4) {
        const k = n % CHANT.length, phrase = Math.floor(n / CHANT.length);
        moktak(next, k === 0 ? 1 : .8);
        if (phrase % 4 !== 3) syllable(next + .02, BEAT * (k === CHANT.length - 1 ? 1.6 : .95), CHANT[k][0], CHANT[k][1]);
        if (k === 0 && phrase % 4 === 0) bowl(next);
        next += k === CHANT.length - 1 ? BEAT * 2 : BEAT; n++;
      }
    },
  };
}
