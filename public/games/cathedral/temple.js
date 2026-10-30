// 절 모드 — 나무 마루와 방석, 정면 불상, 천장을 채운 연등, 목탁과 염불 소리
import * as THREE from 'three';

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

export function buildTemple(scene, { FLOOR, CX, ALTAR_Z, woodMap }) {
  const G = new THREE.Group(); G.visible = false; scene.add(G);
  // 나무 마루
  const maru = woodMap.clone(); maru.repeat.set(12, 10); maru.rotation = Math.PI / 2; maru.needsUpdate = true;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(25, 34), new THREE.MeshStandardMaterial({ map: maru, color: 0xb07a4a, roughness: .55 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(CX, FLOOR + .03, -4); G.add(floor);
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
  const S = 1.75; const bud = buddha(gold); bud.position.set(CX, FLOOR + 1.0, ALTAR_Z - .8); bud.scale.setScalar(S); G.add(bud);
  const halo = new THREE.Mesh(new THREE.CircleGeometry(2.6, 48), new THREE.MeshBasicMaterial({ map: haloTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.position.set(CX, FLOOR + 1.0 + 4.0 * S, ALTAR_Z - 1.9); halo.scale.setScalar(S / 1.15); G.add(halo);
  const body = new THREE.Mesh(new THREE.CircleGeometry(3.6, 48), halo.material.clone()); body.material.opacity = .55;
  body.position.set(CX, FLOOR + 1.0 + 2.6 * S, ALTAR_Z - 2.0); body.scale.set(S / 1.15, 1.25 * S / 1.15, 1); G.add(body);
  const spot = new THREE.SpotLight(0xffd9a0, 55, 34, .55, .6, 1.4); spot.position.set(CX, FLOOR + 11, ALTAR_Z + 9); spot.target = bud; G.add(spot);
  const fill = new THREE.PointLight(0xffb070, 10, 10, 1.6); fill.position.set(CX, FLOOR + 3, ALTAR_Z + 2.5); G.add(fill);
  // 불단 앞 작은 상
  const table = new THREE.Mesh(new THREE.BoxGeometry(2.4, .55, .8), new THREE.MeshStandardMaterial({ color: 0x4a1a10, roughness: .5 }));
  table.position.set(CX, FLOOR + .28, ALTAR_Z + 2.4); G.add(table);

  // 연등 — 천장 아래를 가득 채운 알록달록한 연꽃 등
  const lgeo = new THREE.LatheGeometry([[0, -.32], [.18, -.3], [.3, -.18], [.34, 0], [.3, .16], [.2, .27], [.08, .32], [0, .33]].map(([x, y]) => new THREE.Vector2(x, y)), 18);
  const lmat = new THREE.MeshBasicMaterial({ map: petalTex() });
  const spots = [];
  for (let z = 11; z > -32; z -= 1.15) for (let x = CX - 5.2; x <= CX + 5.21; x += 1.15) {
    if (z < -14 && Math.abs(x - CX) < 4.6) continue; // 불상 머리 위는 비움
    spots.push([x + (Math.random() - .5) * .3, z + (Math.random() - .5) * .3]);
  }
  for (let z = 10; z > -8; z -= 1.6) for (const ax of [-3.5, 14.5]) for (const dx of [-1.2, 0, 1.2]) spots.push([ax + dx, z]); // 측랑에도
  const N = spots.length;
  const lan = new THREE.InstancedMesh(lgeo, lmat, N), col = new THREE.Color(), m4 = new THREE.Matrix4();
  const linePos = new Float32Array(N * 6), meta = [];
  spots.forEach(([x, z], i) => {
    const y = FLOOR + 7.2 + Math.random() * 3.2 + Math.sin(x * .7 + z * .4) * .4;
    meta.push({ x, y, z, ph: Math.random() * 6 });
    m4.makeTranslation(x, y, z); lan.setMatrixAt(i, m4);
    col.setHex(LOTUS_COLS[Math.floor(Math.random() * LOTUS_COLS.length)]).multiplyScalar(1.5); lan.setColorAt(i, col);
    linePos.set([x, y + .33, z, x, FLOOR + 17, z], i * 6);
  });
  G.add(lan);
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  G.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x3a2a1c, transparent: true, opacity: .5 })));
  // 꼬리 술
  const tail = new THREE.InstancedMesh(new THREE.CylinderGeometry(.02, .05, .35, 6), new THREE.MeshBasicMaterial({ color: 0xffe9a0 }), N);
  meta.forEach((p, i) => { m4.makeTranslation(p.x, p.y - .5, p.z); tail.setMatrixAt(i, m4); }); G.add(tail);
  // 연등 빛이 아래로 번지도록 색 점광원 몇 개
  [[0xff6a8a, -2], [0xffc040, -10], [0x7ab0ff, -16], [0xff8040, 4]].forEach(([c, z]) => { const l = new THREE.PointLight(c, 8, 16, 1.6); l.position.set(CX, FLOOR + 7, z); G.add(l); });

  function update(t) {
    for (let i = 0; i < N; i++) { const p = meta[i], s = Math.sin(t * .6 + p.ph) * .025; m4.makeRotationZ(s).setPosition(p.x, p.y, p.z); lan.setMatrixAt(i, m4); }
    lan.instanceMatrix.needsUpdate = true;
    halo.rotation.z = t * .03;
  }
  return { group: G, slots, update };
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
