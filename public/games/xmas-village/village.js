// 크리스마스 소원 마을 — 장면 만들기 (하늘·산·숲·집·가로등·캠프파이어·트리·울타리)
// 트리·전구 줄·벨 울타리·발자국: goryana Christmas Assets (CC0). 나머지는 코드로 만든다.
import * as THREE from 'three';

export const TREE_H = 16, FENCE_R = 8.5, WORLD_R = 33;
export const SPAWN = { x: 0, z: 29, f: Math.PI };
export const FIRE = new THREE.Vector3(-13, 0, 7);
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

function canvasTex(w, h, draw, srgb = true) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; }
export const glowTex = canvasTex(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); }, false);

export function buildSky(scene) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { t: { value: 0 } },
    vertexShader: `varying vec3 vd; void main(){ vd = position; vec4 p = projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position = p.xyww; }`,
    fragmentShader: `varying vec3 vd; uniform float t;
    float h(vec3 p){ p=fract(p*.3183099+.1); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
    float n(vec3 x){ vec3 i=floor(x),f=fract(x); f=f*f*(3.-2.*f);
      return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
    float fbm(vec3 p){ float a=.5,s=0.; for(int i=0;i<5;i++){ s+=a*n(p); p*=2.03; a*=.5; } return s; }
    void main(){
      vec3 d = normalize(vd); float y = d.y;
      vec3 col = mix(vec3(.11,.12,.27), vec3(.015,.02,.06), smoothstep(-.05,.6,y));
      col += vec3(.2,.13,.24)*exp(-max(y,0.)*6.);
      vec3 ax = normalize(vec3(.55,.3,.78));
      float band = exp(-pow(dot(d,ax)/.18,2.)) * smoothstep(-.05,.25,y);
      float neb = fbm(d*6.)*fbm(d*13.+3.);
      col += band*(vec3(.32,.28,.46)*neb*1.7 + vec3(.06,.05,.1));
      col -= band*vec3(.05)*smoothstep(.45,.7,fbm(d*9.+7.));
      // 녹색 오로라: 북쪽(-z) 하늘에 일렁이는 커튼
      float az = atan(d.x, -d.z);
      float base = .16 + .07*sin(az*2.3 + t*.04) + .04*sin(az*5.1 - t*.07);
      float hgt = y - base;
      float curtain = smoothstep(-.015, .03, hgt) * exp(-max(hgt,0.)*5.5);
      float streak = .35 + .65*pow(n(vec3(az*38., t*.25, 1.)), 2.);
      float wave = .5 + .5*fbm(vec3(az*4. + t*.03, hgt*3., t*.02));
      float side = smoothstep(.15, -.45, d.z);
      float aur = curtain * streak * wave * side;
      col += aur * mix(vec3(.08,.95,.45), vec3(.35,.25,.85), smoothstep(.05,.3,hgt)) * .85;
      col += side * exp(-abs(hgt)*14.) * vec3(.02,.12,.06) * wave;
      vec3 g = d*420.; vec3 c = floor(g); float r = h(c);
      float star = step(.984 - band*.025, r) * smoothstep(.55,.0,length(fract(g)-.5));
      col += star*(.55+.45*sin(t*2.2+r*90.))*mix(vec3(.8,.85,1.),vec3(1.,.9,.75),h(c+1.))*1.6*smoothstep(-.02,.12,y);
      vec3 g2 = d*150.; vec3 c2 = floor(g2); float r2 = h(c2+5.);
      col += step(.9965,r2)*smoothstep(.45,.0,length(fract(g2)-.5))*(1.6+.8*sin(t*1.3+r2*50.))*smoothstep(0.,.15,y);
      gl_FragColor = vec4(col,1.);
    }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 48, 24), mat); sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);
  // 달
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 18, 64, 64, 64); g.addColorStop(0, 'rgba(255,250,235,1)'); g.addColorStop(.3, 'rgba(255,245,220,.9)'); g.addColorStop(.36, 'rgba(200,210,255,.25)'); g.addColorStop(1, 'rgba(160,170,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); }), fog: false, depthWrite: false, transparent: true }));
  moon.position.set(-160, 190, -260); moon.scale.set(70, 70, 1); scene.add(moon);
  return mat;
}

function ground(scene) {
  const tex = canvasTex(256, 256, (x) => { x.fillStyle = '#fff'; x.fillRect(0, 0, 256, 256); for (let i = 0; i < 4500; i++) { const v = 222 + Math.random() * 33; x.fillStyle = `rgb(${v},${v},${Math.min(255, v + 6)})`; x.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); } });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(50, 50);
  const g = new THREE.RingGeometry(0, 170, 96, 40); g.rotateX(-Math.PI / 2); // 반지름 방향으로도 잘게 나눠야 바깥 언덕만 솟는다
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z); if (r > 38) p.setY(i, Math.min(9, Math.pow((r - 38) / 40, 2) * 9) + Math.sin(x * .08 + z * .05) * 1.2 * Math.min(1, (r - 38) / 20)); }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xc9d3ea, map: tex, roughness: .82 }));
  m.receiveShadow = true; m.name = 'ground'; scene.add(m); return m;
}
export const groundY = (x, z) => { const r = Math.hypot(x, z); return r > 38 ? Math.min(9, Math.pow((r - 38) / 40, 2) * 9) : 0; };

function mountains(scene) {
  const rock = new THREE.MeshStandardMaterial({ color: 0x2c3758, roughness: 1, flatShading: true }), cap = new THREE.MeshStandardMaterial({ color: 0xc9d4ee, roughness: 1, flatShading: true });
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2 + .2, r = 160 + (i % 3) * 22, h = 42 + (i * 37 % 34);
    const m = new THREE.Mesh(new THREE.ConeGeometry(h * 1.1, h, 7), rock); m.position.set(Math.cos(a) * r, h / 2 - 4, Math.sin(a) * r); m.rotation.y = i; scene.add(m);
    const c = new THREE.Mesh(new THREE.ConeGeometry(h * .38, h * .35, 7), cap); c.position.copy(m.position); c.position.y = h - 4 - h * .175 + .3; c.rotation.y = i; scene.add(c);
  }
}

function forest(scene) {
  const green = new THREE.MeshStandardMaterial({ color: 0x1d3a35, roughness: .9, flatShading: true }), snow = new THREE.MeshStandardMaterial({ color: 0xe8eefc, roughness: .9, flatShading: true });
  const parts = [[new THREE.ConeGeometry(1.6, 3.2, 8), 1.6, green], [new THREE.ConeGeometry(1.2, 2.6, 8), 3.2, green], [new THREE.ConeGeometry(.8, 2, 8), 4.6, snow], [new THREE.CylinderGeometry(.2, .25, 1, 6), .3, new THREE.MeshStandardMaterial({ color: 0x3a2618 })]];
  const pts = [];
  while (pts.length < 240) { const a = rnd() * Math.PI * 2, r = 37 + rnd() * 50; pts.push([Math.cos(a) * r, Math.sin(a) * r, .9 + rnd() * 1.4]); }
  for (let i = 0; i < 22; i++) { const a = rnd() * Math.PI * 2, r = 30.5 + rnd() * 4; pts.push([Math.cos(a) * r, Math.sin(a) * r, .6 + rnd() * .5]); } // 마을 가장자리 작은 나무
  const ims = parts.map(([g, , m]) => { const im = new THREE.InstancedMesh(g, m, pts.length); im.castShadow = true; scene.add(im); return im; });
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3();
  pts.forEach(([x, z, sc], k) => { if (Math.abs(Math.atan2(z, x) - Math.PI / 2) < .12 && Math.hypot(x, z) < 45) { x += 6; } const yb = groundY(x, z); parts.forEach(([, y], j) => { s.setScalar(sc); M.compose(new THREE.Vector3(x, yb + y * sc, z), q, s); ims[j].setMatrixAt(k, M); }); });
}

const winOn = new THREE.MeshStandardMaterial({ color: 0xffd38a, emissive: 0xffb347, emissiveIntensity: 2.2 });
const winOff = new THREE.MeshStandardMaterial({ color: 0x1c2234, roughness: .4 });
function house(scene, x, z, ry, w, d, lit, wallCol, roofCol, colliders, pools, windows) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry;
  const box = (geo, m, px, py, pz, cast = true) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = cast; o.receiveShadow = true; g.add(o); return o; };
  const wallM = new THREE.MeshStandardMaterial({ color: wallCol, roughness: .9, emissive: wallCol, emissiveIntensity: .12 });
  box(new THREE.BoxGeometry(w, 3.4, d), wallM, 0, 1.7, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(new THREE.BoxGeometry(.28, 3.4, .28), new THREE.MeshStandardMaterial({ color: 0x4a3326 }), sx * (w / 2 - .1), 1.7, sz * (d / 2 - .1));
  const sh = new THREE.Shape(); sh.moveTo(-w / 2 - .5, 0); sh.lineTo(w / 2 + .5, 0); sh.lineTo(0, 2.3); sh.closePath();
  const rg = new THREE.ExtrudeGeometry(sh, { depth: d + 1, bevelEnabled: false }); rg.translate(0, 0, -(d + 1) / 2); box(rg, new THREE.MeshStandardMaterial({ color: roofCol, roughness: .9 }), 0, 3.4, 0);
  const sh2 = new THREE.Shape(); sh2.moveTo(-w / 2 - .62, -.05); sh2.lineTo(w / 2 + .62, -.05); sh2.lineTo(0, 2.42); sh2.closePath();
  const sg = new THREE.ExtrudeGeometry(sh2, { depth: d + 1.1, bevelEnabled: true, bevelSize: .14, bevelThickness: .14, bevelSegments: 2 }); sg.translate(0, 0, -(d + 1.1) / 2);
  box(sg, new THREE.MeshStandardMaterial({ color: 0xf2f6ff, roughness: .8 }), 0, 3.5, 0);
  box(new THREE.BoxGeometry(.7, 1.8, .7), new THREE.MeshStandardMaterial({ color: 0x6b4a40 }), w * .25, 5, -d * .2);
  box(new THREE.BoxGeometry(.85, .25, .85), new THREE.MeshStandardMaterial({ color: 0xf2f6ff }), w * .25, 5.95, -d * .2);
  // 현관: 문 + 작은 지붕 + 화환
  box(new THREE.BoxGeometry(1.05, 2, .12), new THREE.MeshStandardMaterial({ color: 0x5a2e1c }), 0, 1, d / 2 + .04);
  const porch = box(new THREE.BoxGeometry(1.7, .12, .9), new THREE.MeshStandardMaterial({ color: 0xf2f6ff }), 0, 2.35, d / 2 + .4); porch.rotation.x = .2;
  const wreath = box(new THREE.TorusGeometry(.2, .07, 6, 14), new THREE.MeshStandardMaterial({ color: 0x2f6a3a }), 0, 1.55, d / 2 + .13, false);
  box(new THREE.SphereGeometry(.05, 6, 4), new THREE.MeshStandardMaterial({ color: 0xd0202a, emissive: 0x501010 }), 0, 1.36, d / 2 + .17, false);
  // 창문 (불 켜진 창은 바닥에 빛 웅덩이)
  [-w / 2 + .95, w / 2 - .95].forEach((wx, i) => {
    box(new THREE.BoxGeometry(1.1, 1.1, .1), new THREE.MeshStandardMaterial({ color: 0x3d2a20 }), wx, 2, d / 2 + .02, false);
    const gl = box(new THREE.PlaneGeometry(.88, .88), lit[i] ? winOn : winOff, wx, 2, d / 2 + .08, false);
    box(new THREE.BoxGeometry(.06, .88, .02), new THREE.MeshStandardMaterial({ color: 0x3d2a20 }), wx, 2, d / 2 + .1, false);
    box(new THREE.BoxGeometry(.88, .06, .02), new THREE.MeshStandardMaterial({ color: 0x3d2a20 }), wx, 2, d / 2 + .1, false);
    box(new THREE.BoxGeometry(1.2, .12, .3), new THREE.MeshStandardMaterial({ color: 0xf2f6ff }), wx, 1.42, d / 2 + .12, false);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.2), new THREE.MeshBasicMaterial({ map: glowTex, color: 0xffa040, transparent: true, opacity: lit[i] ? .5 : 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(wx, .03, d / 2 + 1.1); g.add(pool);
    windows.push({ gl, pool, on: !!lit[i] });
  });
  // 뒤쪽 창 (바깥에서 봐도 집처럼)
  [-w / 4, w / 4].forEach((wx, i) => { box(new THREE.BoxGeometry(.9, .9, .1), new THREE.MeshStandardMaterial({ color: 0x3d2a20 }), wx, 2, -d / 2 - .02, false); const gl = box(new THREE.PlaneGeometry(.72, .72), lit[(i + 1) % 2] ? winOn : winOff, wx, 2, -d / 2 - .08, false); gl.rotation.y = Math.PI; });
  // 처마 전구
  const bulbG = new THREE.SphereGeometry(.07, 6, 4);
  for (let i = 0; i <= 12; i++) { const b = new THREE.Mesh(bulbG, new THREE.MeshBasicMaterial({ color: new THREE.Color([0xffe0a0, 0xff7070, 0x90ffb0, 0xa0c8ff][i % 4]).multiplyScalar(1.8) })); b.position.set(-w / 2 - .45 + (w + .9) * i / 12, 3.32 - Math.sin(i / 12 * Math.PI) * .16, d / 2 + .56); g.add(b); }
  scene.add(g);
  colliders.push({ box: true, x, z, ry, hw: w / 2 + .45, hd: d / 2 + .35 });
}

function lamp(scene, x, z, pools) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const iron = new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: .5, metalness: .6 });
  const p = new THREE.Mesh(new THREE.CylinderGeometry(.07, .11, 3.4, 8), iron); p.position.y = 1.7; p.castShadow = true; g.add(p);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(.22, .3, .45, 4), new THREE.MeshStandardMaterial({ color: 0xffe2a8, emissive: 0xffc56a, emissiveIntensity: 2.4 })); head.position.y = 3.55; g.add(head);
  const capM = new THREE.Mesh(new THREE.ConeGeometry(.36, .25, 4), iron); capM.position.y = 3.9; g.add(capM);
  const capS = new THREE.Mesh(new THREE.ConeGeometry(.3, .12, 4), new THREE.MeshStandardMaterial({ color: 0xf2f6ff })); capS.position.y = 4.04; g.add(capS);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffb860, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false })); halo.position.y = 3.55; halo.scale.set(2.2, 2.2, 1); g.add(halo);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshBasicMaterial({ map: glowTex, color: 0xffa850, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false }));
  pool.rotation.x = -Math.PI / 2; pool.position.y = .03; g.add(pool);
  scene.add(g); pools.push(pool);
}

function campfire(scene, colliders) {
  const g = new THREE.Group(); g.position.copy(FIRE); scene.add(g);
  const wood = new THREE.MeshStandardMaterial({ color: 0x4a2e1e, roughness: 1 });
  for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.12, .14, 1.4, 6), wood); l.rotation.z = Math.PI / 2 - .5; l.rotation.y = i / 6 * Math.PI * 2; l.position.y = .35; g.add(l); }
  const stones = new THREE.MeshStandardMaterial({ color: 0x5a5f6a, roughness: 1, flatShading: true });
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, s = new THREE.Mesh(new THREE.DodecahedronGeometry(.22), stones); s.position.set(Math.cos(a) * .95, .12, Math.sin(a) * .95); s.rotation.set(i, i * 2, 0); g.add(s); }
  const ember = new THREE.Mesh(new THREE.CircleGeometry(.75, 16), new THREE.MeshBasicMaterial({ color: 0xff6a20 })); ember.rotation.x = -Math.PI / 2; ember.position.y = .06; g.add(ember);
  // 불꽃: 여러 장의 부드러운 불꽃 스프라이트가 흔들린다
  const flameTex = canvasTex(64, 128, (x) => { const gr = x.createRadialGradient(32, 92, 2, 32, 80, 40); gr.addColorStop(0, 'rgba(255,250,210,1)'); gr.addColorStop(.3, 'rgba(255,190,70,.95)'); gr.addColorStop(.7, 'rgba(255,90,20,.6)'); gr.addColorStop(1, 'rgba(255,60,10,0)'); x.fillStyle = gr; x.beginPath(); x.ellipse(32, 80, 26, 46, 0, 0, 7); x.fill(); });
  const flames = [];
  for (let i = 0; i < 7; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .8 })); s.position.set((rnd() - .5) * .5, .7, (rnd() - .5) * .5); g.add(s); flames.push({ s, ph: rnd() * 10, k: .7 + rnd() * .5 }); }
  const light = new THREE.PointLight(0xff8a2a, 40, 14, 1.7); light.position.y = 1.4; g.add(light);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: glowTex, color: 0xff7a30, transparent: true, opacity: .32, blending: THREE.AdditiveBlending, depthWrite: false })); pool.rotation.x = -Math.PI / 2; pool.position.y = .04; g.add(pool);
  // 둘레 통나무 의자 (앉는 자리)
  const seats = [];
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2 + .3, bx = Math.cos(a) * 2.7, bz = Math.sin(a) * 2.7;
    const b = new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, 1.7, 10), wood); b.rotation.z = Math.PI / 2; b.rotation.y = -a + Math.PI / 2; b.position.set(bx, .28, bz); b.castShadow = true; g.add(b);
    const sn = new THREE.Mesh(new THREE.CapsuleGeometry(.14, 1.2, 4, 8), new THREE.MeshStandardMaterial({ color: 0xf2f6ff })); sn.rotation.z = Math.PI / 2; sn.rotation.y = -a + Math.PI / 2; sn.scale.set(1, 1, .5); sn.position.set(bx * 1.03, .52, bz * 1.03); g.add(sn);
    for (const off of [-.45, .45]) { const ox = -Math.sin(a) * off, oz = Math.cos(a) * off; seats.push({ x: FIRE.x + bx + ox, z: FIRE.z + bz + oz, f: Math.atan2(-bx, -bz), taken: null }); }
  }
  colliders.push({ x: FIRE.x, z: FIRE.z, r: 1.3 });
  return { flames, light, seats };
}

function archAndSign(scene, colliders) {
  // 입구 아치 "WISH · 도착" (사탕 지팡이 기둥)
  const stripe = canvasTex(64, 256, (x) => { x.fillStyle = '#fff'; x.fillRect(0, 0, 64, 256); x.fillStyle = '#d32b3a'; for (let i = -4; i < 16; i++) { x.beginPath(); x.moveTo(0, i * 24); x.lineTo(64, i * 24 + 24); x.lineTo(64, i * 24 + 36); x.lineTo(0, i * 24 + 12); x.fill(); } });
  const caneM = new THREE.MeshStandardMaterial({ map: stripe, roughness: .4 });
  const AZ = 38.5;
  for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.17, .17, 4.2, 14), caneM); p.position.set(sx * 2.6, 2.1, AZ); p.castShadow = true; scene.add(p); const top = new THREE.Mesh(new THREE.SphereGeometry(.24, 12, 10), new THREE.MeshStandardMaterial({ color: 0xffe08a, emissive: 0xffb040, emissiveIntensity: 1.6 })); top.position.set(sx * 2.6, 4.35, AZ); scene.add(top); colliders.push({ x: sx * 2.6, z: AZ, r: .35 }); }
  const sign = canvasTex(512, 96, (x) => { x.fillStyle = '#7a1a22'; x.beginPath(); x.roundRect(0, 0, 512, 96, 22); x.fill(); x.strokeStyle = '#ffd88a'; x.lineWidth = 6; x.beginPath(); x.roundRect(5, 5, 502, 86, 18); x.stroke(); x.fillStyle = '#fff2d0'; x.font = 'bold 48px Pretendard, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('WISH · 소원 마을', 256, 52); });
  const board = new THREE.Mesh(new THREE.BoxGeometry(5.6, 1.05, .14), [0, 0, 0, 0, 1, 1].map((i) => (i ? new THREE.MeshStandardMaterial({ map: sign, emissive: 0x401010, emissiveMap: sign, emissiveIntensity: .6 }) : new THREE.MeshStandardMaterial({ color: 0x5a1218 }))));
  board.position.set(0, 3.75, AZ); scene.add(board);
  // 트리 옆 게시판
  const note = canvasTex(320, 240, (x) => { x.fillStyle = '#3a2a20'; x.fillRect(0, 0, 320, 240); x.fillStyle = '#f6ecd8'; x.fillRect(12, 12, 296, 216); x.fillStyle = '#5a2a20'; x.font = 'bold 30px Pretendard, system-ui, sans-serif'; x.textAlign = 'center'; x.fillText('🎄 소원 마을 안내', 160, 54);
    x.font = '22px Pretendard, system-ui, sans-serif'; x.fillStyle = '#3a2a20'; ['트리 가까이에서 소원을 걸어요', '장식을 누르면 소원을 읽어요', '매일 오후 8시 점등식', '서로 따뜻한 말만 남겨요'].forEach((t, i) => x.fillText(t, 160, 100 + i * 34)); });
  const nb = new THREE.Group(); nb.position.set(6.2, 0, 11.2); nb.rotation.y = -.45; scene.add(nb);
  const pm = new THREE.MeshStandardMaterial({ color: 0x3a2a20 });
  for (const sx of [-.75, .75]) { const p = new THREE.Mesh(new THREE.BoxGeometry(.12, 2.2, .12), pm); p.position.set(sx, 1.1, 0); nb.add(p); }
  const nbd = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), new THREE.MeshStandardMaterial({ map: note, emissive: 0xffffff, emissiveMap: note, emissiveIntensity: .25 })); nbd.position.set(0, 1.6, .07); nb.add(nbd);
  const nbs = new THREE.Mesh(new THREE.BoxGeometry(1.8, .12, .3), new THREE.MeshStandardMaterial({ color: 0xf2f6ff })); nbs.position.y = 2.25; nb.add(nbs);
  colliders.push({ x: 6.2, z: 11.2, r: .9 });
}

function fitHeight(obj, h) { const b = new THREE.Box3().setFromObject(obj); obj.scale.setScalar(h / (b.max.y - b.min.y)); const b2 = new THREE.Box3().setFromObject(obj); obj.position.x -= (b2.min.x + b2.max.x) / 2; obj.position.z -= (b2.min.z + b2.max.z) / 2; obj.position.y -= b2.min.y; const w = new THREE.Group(); w.add(obj); return w; }
function tune(root, fn) { root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; [].concat(o.material).forEach((m) => { m.metalness = Math.min(m.metalness, .3); fn && fn(m, o); }); } }); }

export async function buildVillage(scene, loader, onProgress) {
  const colliders = [], pools = [], windows = [];
  const skyMat = buildSky(scene);
  scene.add(new THREE.HemisphereLight(0x6a80c0, 0x2a3048, .95));
  const moonL = new THREE.DirectionalLight(0x9fb4ff, .55); moonL.position.set(-30, 50, 20); moonL.castShadow = true;
  moonL.shadow.mapSize.set(2048, 2048); Object.assign(moonL.shadow.camera, { left: -36, right: 36, top: 36, bottom: -36, far: 140 }); moonL.shadow.bias = -.0005; scene.add(moonL);
  const treeGlow = new THREE.PointLight(0xffc070, 45, 24, 1.8); treeGlow.position.set(0, 4, 7); scene.add(treeGlow);
  ground(scene); mountains(scene); forest(scene);
  // 집: 트리를 둘러싼 고리, 입구(남쪽) 비움
  const H = 12; let hi = 0;
  for (let i = 0; i < H; i++) {
    const a = i / H * Math.PI * 2 + .26; const ca = Math.atan2(Math.sin(a), Math.cos(a)); if (Math.abs(ca - Math.PI / 2) < .5) continue;
    if (Math.hypot(Math.cos(a) * 25 - FIRE.x, Math.sin(a) * 25 - FIRE.z) < 13) continue; // 캠프파이어 자리
    const r = 24.5 + (i % 2) * 2.5, x = Math.cos(a) * r, z = Math.sin(a) * r;
    const lit = [[1, 0], [0, 0], [1, 1], [0, 1], [0, 0], [1, 0], [0, 1], [1, 1], [0, 0], [1, 0], [0, 1], [1, 1]][hi++];
    house(scene, x, z, Math.atan2(-x, -z), 5 + (i % 3), 4.4 + (i % 2), lit, [0x8a6a55, 0x7d5d4c, 0x96755d, 0x6e5a72][i % 4], [0x5a2f2a, 0x2f3f5a, 0x5a2f2a, 0x3a5a3f][i % 4], colliders, pools, windows);
  }
  // 가로등 7개: 광장 둘레 5 + 입구 길 2 (엇갈리게)
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + Math.PI / 2 + Math.PI / 5; const x = Math.cos(a) * 15, z = Math.sin(a) * 15; lamp(scene, x, z, pools); colliders.push({ x, z, r: .3 }); }
  for (const [x, z] of [[-3.4, 20], [3.4, 26]]) { lamp(scene, x, z, pools); colliders.push({ x, z, r: .3 }); }
  const fire = campfire(scene, colliders);
  archAndSign(scene, colliders);

  // 업로드 에셋
  const names = ['christmas_tree', 'decorative_lights', 'fence_with_bells', 'foot_steps'];
  let done = 0;
  const [tree, lights, fence, steps] = await Promise.all(names.map((n) => loader.loadAsync(`assets/${n}.glb`).then((g) => { onProgress && onProgress(++done / names.length); return g.scene; })));
  const treeLights = [];
  tune(tree, (m) => { if (m.name === 'lights') { m.emissive = new THREE.Color(0xffd890); m.emissiveIntensity = 2.2; treeLights.push(m); } if (m.name === 'tree') { m.color.setRGB(.035, .11, .07); m.roughness = .85; } });
  const T = fitHeight(tree, TREE_H); scene.add(T);
  colliders.push({ x: 0, z: 0, r: FENCE_R + .5 });
  // 꼭대기 큰 별
  const starS = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? .45 : 1, a = i / 10 * Math.PI * 2 + Math.PI / 2; i ? starS.lineTo(Math.cos(a) * r, Math.sin(a) * r) : starS.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const topStar = new THREE.Mesh(new THREE.ExtrudeGeometry(starS, { depth: .3, bevelEnabled: true, bevelSize: .06, bevelThickness: .06 }).center(), new THREE.MeshStandardMaterial({ color: 0xfff1b0, emissive: 0xffd760, emissiveIntensity: 3 }));
  topStar.scale.setScalar(.9); topStar.position.set(0, TREE_H + .5, 0); scene.add(topStar);
  const topHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffd070, transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false })); topHalo.position.copy(topStar.position); topHalo.scale.set(6, 6, 1); scene.add(topHalo);
  // 트리 둘레 원형 벨 울타리 (남쪽은 트리로 들어가는 틈)
  tune(fence);
  { const b = new THREE.Box3().setFromObject(fence); const len = (b.max.z - b.min.z) * 1.6 / (b.max.y - b.min.y); const n = Math.round(2 * Math.PI * FENCE_R / len);
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const f = fitHeight(fence.clone(), 1.6); f.position.set(Math.cos(a) * FENCE_R, 0, Math.sin(a) * FENCE_R); f.rotation.y = -a; scene.add(f); } }
  // 전구 줄: 광장 바깥쪽 길목
  tune(lights, (m) => { if (m.name.startsWith('lights')) { m.emissive = new THREE.Color(0xffe7b0); m.emissiveIntensity = 2.4; } });
  [[-20, 13, 1.0], [20, 13, -1.0], [0, -21, Math.PI], [-17, -14, 2.3], [17, -14, -2.3]].forEach(([x, z, r]) => { const l = fitHeight(lights.clone(), 4.2); l.position.set(x, 0, z); l.rotation.y = r; scene.add(l); });
  // 눈 위 발자국
  steps.traverse((o) => { if (o.isMesh) { o.material = new THREE.MeshStandardMaterial({ color: 0xb9c6e2, roughness: 1 }); o.receiveShadow = true; } });
  [[1.5, 24, -1.5], [-1, 17, -1.6], [-7, 12, .7], [-10, 9.5, .5], [9, 16, 2.3], [12, -11, .4]].forEach(([x, z, r]) => { const s = steps.clone(); s.scale.setScalar(1.15); s.position.set(x, .01, z); s.rotation.y = r; scene.add(s); });

  // 소원 장식 자리: 트리 원뿔 표면을 나선으로 (아래가 넓고 위가 좁다)
  const slots = [];
  const GA = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < 320; i++) {
    const v = (i + .5) / 320, y = 2.3 + Math.pow(v, .85) * 11.6;
    const rr = (1 - (y - 1) / 15.5) * 6.4 + .25;
    const a = i * GA;
    slots.push({ x: Math.cos(a) * rr, y, z: Math.sin(a) * rr, a });
  }
  // 아래쪽부터 고르게 채우도록 섞기 (같은 높이에 몰리지 않게)
  slots.sort((p, q) => ((p.y * 7.3) % 1) - ((q.y * 7.3) % 1));

  // 내리는 눈
  const SN = 3000, sp = new Float32Array(SN * 3);
  for (let i = 0; i < SN; i++) { sp[i * 3] = (Math.random() - .5) * 70; sp[i * 3 + 1] = Math.random() * 28; sp[i * 3 + 2] = (Math.random() - .5) * 70; }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const snow = new THREE.Points(sg, new THREE.PointsMaterial({ size: .2, map: glowTex, transparent: true, depthWrite: false, color: 0xe6eeff, opacity: .9 }));
  snow.frustumCulled = false; scene.add(snow);

  // 창문 불빛이 가끔 켜지고 꺼진다
  let nextWin = 8;
  function update(t, dt, camPos) {
    skyMat.uniforms.t.value = t;
    const k = 1 + .14 * Math.sin(t * 9.1) + .08 * Math.sin(t * 23.7);
    fire.light.intensity = 28 * k;
    fire.flames.forEach((f, i) => { const s = f.k * (1 + .25 * Math.sin(t * 8 + f.ph) + .12 * Math.sin(t * 19 + f.ph)); f.s.scale.set(.7 * s, 1.45 * s, 1); f.s.position.y = .5 + .7 * s * .5; f.s.material.opacity = .55 + .15 * Math.sin(t * 11 + f.ph); });
    treeLights.forEach((m) => { m.emissiveIntensity = 2 + .5 * Math.sin(t * 1.3); });
    topHalo.material.opacity = .6 + .15 * Math.sin(t * 1.7);
    topStar.rotation.y = Math.sin(t * .5) * .4;
    if (t > nextWin) { nextWin = t + 20 + Math.random() * 40; const w = windows[Math.floor(Math.random() * windows.length)]; w.on = !w.on; w.gl.material = w.on ? winOn : winOff; w.pool.material.opacity = w.on ? .5 : 0; }
    const a = snow.geometry.attributes.position, cx = camPos.x, cz = camPos.z;
    for (let i = 0; i < SN; i++) {
      let y = a.getY(i) - dt * (1 + (i % 7) * .12), x = a.getX(i) + Math.sin(t * .7 + i) * dt * .3, z = a.getZ(i);
      if (y < 0) y += 28;
      if (x - cx > 35) x -= 70; else if (x - cx < -35) x += 70;
      if (z - cz > 35) z -= 70; else if (z - cz < -35) z += 70;
      a.setXYZ(i, x, y, z);
    }
    a.needsUpdate = true;
  }
  return { colliders, slots, seats: fire.seats, update, treeTop: topStar.position.clone() };
}

// 걸을 수 있는지 (마을 안 · 집·울타리·가로등 피하기)
export function walkable(colliders, x, z, rad = .45) {
  if (Math.hypot(x, z) > WORLD_R) return false;
  for (const c of colliders) {
    if (c.box) { const dx = x - c.x, dz = z - c.z, cs = Math.cos(c.ry), sn = Math.sin(c.ry); const lx = dx * cs - dz * sn, lz = dx * sn + dz * cs; if (Math.abs(lx) < c.hw + rad * .5 && Math.abs(lz) < c.hd + rad * .5) return false; }
    else if (Math.hypot(x - c.x, z - c.z) < c.r + rad) return false;
  }
  return true;
}
