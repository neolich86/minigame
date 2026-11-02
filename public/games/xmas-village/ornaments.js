// 소원 장식 16종 — 전부 코드로 만든 로우폴리 3D. 크기는 대략 지름 1 기준.
import * as THREE from 'three';

export const ORNAMENTS = [
  { id: 'ball', name: '방울', open: true, col: 0xd9dde8 },
  { id: 'star', name: '별', open: true, col: 0xffe6a0 },
  { id: 'flake', name: '눈꽃', open: true, col: 0xe8f4ff },
  { id: 'heart', name: '하트', open: true, col: 0xff8f9e },
  { id: 'bell', name: '종', open: true, col: 0xf0b048 },
  { id: 'house', name: '작은 집', open: true, col: 0xb06a48 },
  { id: 'sock', name: '양말', open: true, col: 0xd8303a },
  { id: 'moon', name: '달', open: true, col: 0xffeaa8 },
  { id: 'gift', name: '선물상자', open: false, col: 0xffc34a },
  { id: 'lantern', name: '등불', open: false, col: 0xffb35a },
  { id: 'ginger', name: '진저맨', open: false, col: 0xb8743c },
  { id: 'angel', name: '천사', open: false, col: 0xfff3d6 },
  { id: 'sleigh', name: '썰매', open: false, col: 0xc8303a },
  { id: 'deer', name: '루돌프', open: false, col: 0x9a6a44 },
  { id: 'candle', name: '촛불', open: false, col: 0xfff0d8 },
  { id: 'gold', name: '황금별', open: false, col: 0xffcf3a },
];
export const ORN = Object.fromEntries(ORNAMENTS.map((o) => [o.id, o]));

const ext = (shape, depth = .22) => { const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: .05, bevelSize: .05, bevelSegments: 2, curveSegments: 10 }); g.center(); return g; };
function starShape(r1 = .55, r0 = .24, n = 5) { const s = new THREE.Shape(); for (let i = 0; i < n * 2; i++) { const r = i % 2 ? r0 : r1, a = i / (n * 2) * Math.PI * 2 + Math.PI / 2; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } s.closePath(); return s; }
function heartShape() { const s = new THREE.Shape(); s.moveTo(0, -.5); s.bezierCurveTo(-.75, 0, -.4, .6, 0, .25); s.bezierCurveTo(.4, .6, .75, 0, 0, -.5); return s; }

const cache = {};
function geo(id) {
  if (cache[id]) return cache[id];
  let parts; // [geometry, colorKey('main'|'sub'|'gold'|'white'|'dark'), x, y, z, rx]
  const cap = () => [new THREE.CylinderGeometry(.09, .09, .1, 10), 'gold', 0, 0, 0];
  switch (id) {
    case 'ball': parts = [[new THREE.SphereGeometry(.42, 20, 14), 'main', 0, -.42, 0], [new THREE.CylinderGeometry(.09, .09, .1, 10), 'gold', 0, .02, 0]]; break;
    case 'star': parts = [[ext(starShape()), 'main', 0, -.5, 0]]; break;
    case 'gold': parts = [[ext(starShape(.62, .26)), 'main', 0, -.55, 0], [ext(starShape(.3, .13)), 'white', 0, -.55, .1]]; break;
    case 'heart': parts = [[ext(heartShape()), 'main', 0, -.45, 0]]; break;
    case 'flake': { const b = new THREE.BoxGeometry(.9, .08, .08); parts = [0, 1, 2].map((i) => { const g = b.clone(); g.rotateZ(i * Math.PI / 3); return [g, 'main', 0, -.5, 0]; });
      for (let i = 0; i < 6; i++) { const t = new THREE.BoxGeometry(.22, .06, .06); t.rotateZ(i * Math.PI / 3 + Math.PI / 4); const a = i * Math.PI / 3; t.translate(Math.cos(a) * .3, Math.sin(a) * .3, 0); parts.push([t, 'main', 0, -.5, 0]); }
      const t2 = []; for (let i = 0; i < 6; i++) { const t = new THREE.BoxGeometry(.22, .06, .06); t.rotateZ(i * Math.PI / 3 - Math.PI / 4); const a = i * Math.PI / 3; t.translate(Math.cos(a) * .3, Math.sin(a) * .3, 0); t2.push([t, 'main', 0, -.5, 0]); } parts.push(...t2); break; }
    case 'bell': { const pts = []; for (let i = 0; i <= 12; i++) { const y = i / 12; pts.push(new THREE.Vector2(.12 + .3 * Math.pow(y, 1.6) + (y > .9 ? (y - .9) * 1.2 : 0), -y * .75)); }
      parts = [[new THREE.LatheGeometry(pts, 18), 'main', 0, 0, 0], [new THREE.SphereGeometry(.09, 10, 8), 'dark', 0, -.78, 0], [ext(heartShape(), .05).scale(.35, .35, .35), 'sub', 0, -.08, .05]]; break; }
    case 'house': { const r = new THREE.Shape(); r.moveTo(-.42, 0); r.lineTo(.42, 0); r.lineTo(0, .34); r.closePath();
      parts = [[new THREE.BoxGeometry(.6, .45, .4), 'main', 0, -.62, 0], [ext(r, .45), 'white', 0, -.28, 0], [new THREE.PlaneGeometry(.16, .16), 'glow', -.14, -.6, .21], [new THREE.PlaneGeometry(.12, .22), 'dark', .13, -.73, .21]]; break; }
    case 'sock': { const s = new THREE.Shape(); s.moveTo(-.2, 0); s.lineTo(.12, 0); s.lineTo(.12, -.5); s.quadraticCurveTo(.12, -.62, .3, -.66); s.quadraticCurveTo(.48, -.72, .44, -.86); s.lineTo(-.06, -.86); s.quadraticCurveTo(-.22, -.84, -.2, -.6); s.closePath();
      parts = [[new THREE.ExtrudeGeometry(s, { depth: .2, bevelEnabled: true, bevelSize: .04, bevelThickness: .04, bevelSegments: 2 }).translate(0, 0, -.1), 'main', 0, 0, 0], [new THREE.BoxGeometry(.42, .14, .3), 'white', -.04, -.04, 0]]; break; }
    case 'moon': { const s = new THREE.Shape(); s.absarc(0, 0, .45, Math.PI * .35, Math.PI * 1.65, false); s.absarc(.2, 0, .36, Math.PI * 1.5, Math.PI * .5, true);
      parts = [[ext(s), 'main', 0, -.5, 0]]; break; }
    case 'gift': parts = [[new THREE.BoxGeometry(.6, .5, .5), 'main', 0, -.4, 0], [new THREE.BoxGeometry(.64, .1, .54), 'sub', 0, -.4, 0], [new THREE.BoxGeometry(.1, .54, .54), 'sub', 0, -.4, 0], [new THREE.TorusGeometry(.1, .035, 6, 12), 'sub', -.08, -.1, 0], [new THREE.TorusGeometry(.1, .035, 6, 12), 'sub', .08, -.1, 0]]; break;
    case 'lantern': parts = [[new THREE.CylinderGeometry(.2, .26, .5, 6), 'glow', 0, -.45, 0], [new THREE.ConeGeometry(.3, .2, 6), 'dark', 0, -.12, 0], [new THREE.CylinderGeometry(.27, .27, .06, 6), 'dark', 0, -.72, 0]]; break;
    case 'ginger': { const s = new THREE.Shape(); s.absarc(0, .28, .18, 0, Math.PI * 2, false);
      const b = new THREE.Shape(); b.moveTo(-.12, .12); b.lineTo(-.38, .02); b.lineTo(-.34, -.08); b.lineTo(-.12, -.02); b.lineTo(-.24, -.42); b.lineTo(-.12, -.46); b.lineTo(0, -.18); b.lineTo(.12, -.46); b.lineTo(.24, -.42); b.lineTo(.12, -.02); b.lineTo(.34, -.08); b.lineTo(.38, .02); b.lineTo(.12, .12); b.closePath();
      parts = [[ext(s, .14), 'main', 0, -.24, 0], [ext(b, .14), 'main', 0, -.6, 0], [new THREE.SphereGeometry(.035, 6, 4), 'white', -.06, -.2, .14], [new THREE.SphereGeometry(.035, 6, 4), 'white', .06, -.2, .14], [new THREE.SphereGeometry(.04, 6, 4), 'sub', 0, -.48, .14], [new THREE.SphereGeometry(.04, 6, 4), 'sub', 0, -.6, .14]]; break; }
    case 'angel': parts = [[new THREE.ConeGeometry(.3, .6, 14), 'main', 0, -.55, 0], [new THREE.SphereGeometry(.14, 12, 10), 'main', 0, -.18, 0], [new THREE.TorusGeometry(.12, .025, 6, 16), 'gold', 0, -.02, 0, Math.PI / 2], [new THREE.SphereGeometry(.22, 10, 8).scale(1.2, .7, .3), 'white', -.24, -.4, -.08], [new THREE.SphereGeometry(.22, 10, 8).scale(1.2, .7, .3), 'white', .24, -.4, -.08]]; break;
    case 'sleigh': { const s = new THREE.Shape(); s.moveTo(-.4, 0); s.lineTo(.3, 0); s.quadraticCurveTo(.5, 0, .5, .25); s.lineTo(.36, .25); s.lineTo(.3, .1); s.lineTo(-.3, .1); s.lineTo(-.4, .35); s.lineTo(-.48, .35); s.closePath();
      parts = [[ext(s, .32), 'main', 0, -.5, 0], [new THREE.BoxGeometry(.9, .04, .04), 'gold', 0, -.66, .14], [new THREE.BoxGeometry(.9, .04, .04), 'gold', 0, -.66, -.14]]; break; }
    case 'deer': parts = [[new THREE.SphereGeometry(.3, 14, 10).scale(1, 1.1, .9), 'main', 0, -.45, 0], [new THREE.SphereGeometry(.09, 10, 8), 'sub', 0, -.55, .27], [new THREE.SphereGeometry(.04, 6, 4), 'dark', -.1, -.36, .24], [new THREE.SphereGeometry(.04, 6, 4), 'dark', .1, -.36, .24],
      [new THREE.CylinderGeometry(.025, .03, .3, 5).rotateZ(.5), 'dark', -.2, -.08, 0], [new THREE.CylinderGeometry(.025, .03, .3, 5).rotateZ(-.5), 'dark', .2, -.08, 0]]; break;
    case 'candle': parts = [[new THREE.CylinderGeometry(.12, .12, .55, 12), 'main', 0, -.55, 0], [new THREE.ConeGeometry(.07, .2, 8), 'glow', 0, -.18, 0], [new THREE.CylinderGeometry(.22, .18, .06, 12), 'gold', 0, -.84, 0]]; break;
    default: parts = [[new THREE.SphereGeometry(.4, 12, 10), 'main', 0, -.4, 0]];
  }
  parts = parts.map((p) => { const g = p[0].clone ? p[0] : p[0]; if (p[5]) g.rotateX(p[5]); g.translate(p[2], p[3], p[4]); return [g, p[1]]; });
  return (cache[id] = parts);
}

const matCache = new Map();
function mat(key, color, glow) {
  const k = key + color + glow; if (matCache.has(k)) return matCache.get(k);
  const c = new THREE.Color(color);
  const base = { main: c, sub: new THREE.Color(0xd23a3a), gold: new THREE.Color(0xe0b050), white: new THREE.Color(0xfaf6ee), dark: new THREE.Color(0x3a2a22), glow: new THREE.Color(0xffd27a) }[key];
  const em = key === 'glow' ? 2.4 : key === 'dark' ? 0 : glow * (key === 'main' ? 1 : .5);
  const m = new THREE.MeshStandardMaterial({ color: base, emissive: key === 'glow' ? 0xffb347 : base, emissiveIntensity: em, roughness: .45, metalness: key === 'gold' ? .5 : .1 });
  matCache.set(k, m); return m;
}

// 장식 하나 (매다는 끈 포함). glow: 자체 발광 세기
export function makeOrnament(id, color, glow = 1.1) {
  const o = ORN[id] || ORNAMENTS[0];
  const g = new THREE.Group();
  for (const [gm, key] of geo(o.id)) { const m = new THREE.Mesh(gm, mat(key, color ?? o.col, glow)); g.add(m); }
  const thread = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .3, 4), mat('gold', 0, 0)); thread.position.y = .15; g.add(thread);
  return g;
}

// 고르기 그리드용 썸네일
export function ornamentThumbs(size = 96) {
  const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  r.setSize(size, size); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping;
  const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xffffff, 0x445066, 1.6)); const dl = new THREE.DirectionalLight(0xffffff, 2.2); dl.position.set(1, 2, 3); sc.add(dl);
  const cam = new THREE.PerspectiveCamera(30, 1, .1, 20); cam.position.set(0, -.45, 2.6); cam.lookAt(0, -.45, 0);
  const out = {};
  for (const o of ORNAMENTS) { const m = makeOrnament(o.id, o.col, .25); m.rotation.y = .35; sc.add(m); r.render(sc, cam); out[o.id] = r.domElement.toDataURL(); sc.remove(m); }
  r.dispose(); r.forceContextLoss();
  return out;
}
