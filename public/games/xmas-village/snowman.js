// 눈사람 아바타 — 코드로 만든 3D. 모자·목도리·단추·손에 든 것을 고를 수 있다.
import * as THREE from 'three';

export const HATS = [
  { id: 'top', name: '실크햇' }, { id: 'beanie', name: '털모자' }, { id: 'santa', name: '산타모자' },
  { id: 'earmuff', name: '귀마개' }, { id: 'crown', name: '왕관' }, { id: 'none', name: '없음' },
];
export const COLORS = [0xd94a4a, 0x3aa86b, 0x4a8ad9, 0xf2c14e, 0xe07ab0, 0x8a5cd6, 0xf28a3a, 0x40c4c4, 0x2b2b33, 0xf4f4f4];
export const HOLDS = [{ id: 'none', name: '없음' }, { id: 'gift', name: '선물' }, { id: 'cane', name: '사탕지팡이' }, { id: 'lantern', name: '랜턴' }];

const ADJ = ['씩씩한', '포근한', '반짝이는', '수줍은', '용감한', '느긋한', '말랑한', '다정한', '졸린', '신나는', '보송한', '똑똑한', '엉뚱한', '따끈한', '새하얀', '행복한'];
const NOUN = ['털모자', '장갑', '목도리', '눈송이', '썰매', '루돌프', '진저쿠키', '코코아', '벙어리장갑', '눈덩이', '양말', '종소리', '별사탕', '군고구마', '붕어빵', '귤'];
export const randomName = () => `${ADJ[Math.floor(Math.random() * ADJ.length)]} ${NOUN[Math.floor(Math.random() * NOUN.length)]}`;
export function randomLook() {
  const c = () => COLORS[Math.floor(Math.random() * 8)];
  return { hat: HATS[Math.floor(Math.random() * 5)].id, hatC: c(), scarf: c(), btn: [0x2b2b33, 0xd94a4a, 0x4a8ad9][Math.floor(Math.random() * 3)], hold: 'none' };
}

const snowM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .6, emissive: 0x5a6280, emissiveIntensity: .5 });
const coalM = new THREE.MeshStandardMaterial({ color: 0x15151a, roughness: .6 });
const carrotM = new THREE.MeshStandardMaterial({ color: 0xff7a1a, roughness: .6 });
const stickM = new THREE.MeshStandardMaterial({ color: 0x4a3020, roughness: .9 });
const whiteM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .8 });
const goldM = new THREE.MeshStandardMaterial({ color: 0xe8b84a, roughness: .35, metalness: .6 });
const M = (c, extra) => new THREE.MeshStandardMaterial({ color: c, roughness: .7, ...extra });
const G = {
  b1: new THREE.SphereGeometry(.5, 22, 16), b2: new THREE.SphereGeometry(.34, 22, 16), eye: new THREE.SphereGeometry(.04, 8, 6),
  nose: new THREE.ConeGeometry(.05, .26, 8).rotateX(Math.PI / 2), scarf: new THREE.TorusGeometry(.28, .075, 8, 22).rotateX(Math.PI / 2),
  tail: new THREE.BoxGeometry(.12, .34, .05), arm: new THREE.CylinderGeometry(.025, .018, .62, 5).translate(0, .31, 0), // 어깨(아래 끝)를 축으로 돈다 btn: new THREE.SphereGeometry(.045, 8, 6),
};

export function makeSnowman(look) {
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body); // 걸을 때 통통 튀는 부분
  const add = (geo, m, x, y, z, parent = body) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; parent.add(o); return o; };
  add(G.b1, snowM, 0, .46, 0); add(G.b2, snowM, 0, 1.12, 0);
  add(G.eye, coalM, -.11, 1.2, .3); add(G.eye, coalM, .11, 1.2, .3); add(G.nose, carrotM, 0, 1.12, .43);
  for (const [x, y] of [[-.13, 1.04], [-.05, 1.0], [.05, 1.0], [.13, 1.04]]) add(G.eye, coalM, x, y, .31).scale.setScalar(.55); // 숯 입
  const sm = M(look.scarf); add(G.scarf, sm, 0, .86, 0); const tail = add(G.tail, sm, .16, .7, .22); tail.rotation.z = .2;
  for (const y of [.62, .4, .2]) add(G.btn, M(look.btn), 0, y, .47 - (.62 - y) * .05);
  const armL = add(G.arm, stickM, -.24, .86, 0); armL.rotation.z = 1.05; const armR = add(G.arm, stickM, .24, .86, 0); armR.rotation.z = -1.05;
  // 모자
  const hm = M(look.hatC);
  const hat = new THREE.Group(); hat.position.y = 1.38; body.add(hat);
  if (look.hat === 'top') { add(new THREE.CylinderGeometry(.2, .2, .38, 18), M(0x1d1d24), 0, .2, 0, hat); add(new THREE.CylinderGeometry(.33, .33, .04, 18), M(0x1d1d24), 0, .02, 0, hat); add(new THREE.CylinderGeometry(.205, .205, .08, 18), hm, 0, .08, 0, hat); }
  else if (look.hat === 'beanie') { add(new THREE.SphereGeometry(.3, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), hm, 0, -.04, 0, hat); add(new THREE.TorusGeometry(.28, .06, 8, 18).rotateX(Math.PI / 2), hm, 0, -.03, 0, hat); add(new THREE.SphereGeometry(.09, 10, 8), whiteM, 0, .3, 0, hat); }
  else if (look.hat === 'santa') { const c = add(new THREE.ConeGeometry(.28, .55, 16), M(0xc8202a), .05, .26, 0, hat); c.rotation.z = -.35; add(new THREE.TorusGeometry(.27, .065, 8, 18).rotateX(Math.PI / 2), whiteM, 0, 0, 0, hat); add(new THREE.SphereGeometry(.08, 10, 8), whiteM, .26, .46, 0, hat); }
  else if (look.hat === 'earmuff') { add(new THREE.TorusGeometry(.33, .025, 6, 20, Math.PI), M(0x444), 0, -.1, 0, hat); add(new THREE.SphereGeometry(.12, 12, 10), hm, -.33, -.14, 0, hat); add(new THREE.SphereGeometry(.12, 12, 10), hm, .33, -.14, 0, hat); }
  else if (look.hat === 'crown') { const c = add(new THREE.CylinderGeometry(.22, .2, .14, 10, 1, true), goldM, 0, .03, 0, hat); c.material.side = THREE.DoubleSide; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; add(new THREE.ConeGeometry(.05, .14, 4), goldM, Math.cos(a) * .2, .16, Math.sin(a) * .2, hat); } add(new THREE.SphereGeometry(.045, 8, 6), M(0xd94a4a, { emissive: 0x801010 }), 0, .04, .21, hat); }
  // 손에 든 것
  if (look.hold === 'gift') { add(new THREE.BoxGeometry(.28, .24, .24), M(0xd94a4a), .78, .74, .12); add(new THREE.BoxGeometry(.3, .05, .26), M(0xf2c14e), .78, .74, .12); }
  else if (look.hold === 'cane') { const c = add(new THREE.TorusGeometry(.08, .025, 6, 12, Math.PI), M(0xffffff), .82, 1.02, .1); add(new THREE.CylinderGeometry(.025, .025, .5, 6), M(0xd94a4a), .74, .78, .1); c.rotation.z = 0; }
  else if (look.hold === 'lantern') { add(new THREE.CylinderGeometry(.08, .1, .2, 6), M(0xffd27a, { emissive: 0xffa040, emissiveIntensity: 2.5 }), .8, .7, .1); add(new THREE.ConeGeometry(.12, .08, 6), M(0x222), .8, .84, .1); }
  body.scale.setScalar(1.3);
  const blob = new THREE.Mesh(new THREE.CircleGeometry(.75, 20), new THREE.MeshBasicMaterial({ color: 0x0a1030, transparent: true, opacity: .35, depthWrite: false })); blob.rotation.x = -Math.PI / 2; blob.position.y = .02; root.add(blob);
  root.userData = { body, armL, armR, hat, ph: Math.random() * 10 };
  return root;
}

// 걷기·대기·손 흔들기 동작
export function animateSnowman(s, t, moving, wave = 0) {
  const u = s.userData; const k = t * 9 + u.ph;
  u.body.position.y = moving ? Math.abs(Math.sin(k)) * .14 : Math.sin(t * 1.6 + u.ph) * .01;
  u.body.rotation.z = moving ? Math.sin(k) * .06 : 0;
  u.armL.rotation.z = 1.05 + (moving ? Math.sin(k) * .25 : 0);
  u.armR.rotation.z = wave > 0 ? -.35 + Math.sin(t * 12) * .4 : -1.05 - (moving ? Math.sin(k) * .25 : 0);
}

// 머리 위 이름표 (캔버스 스프라이트)
export function nameTag(text, me = false) {
  const c = document.createElement('canvas'); const x = c.getContext('2d'); const F = 'bold 30px Pretendard, "Apple SD Gothic Neo", system-ui, sans-serif';
  x.font = F; const w = Math.ceil(x.measureText(text).width) + 36; c.width = w; c.height = 50;
  x.font = F; x.fillStyle = me ? 'rgba(255,214,120,.92)' : 'rgba(20,26,48,.72)'; x.beginPath(); x.roundRect(0, 0, w, 50, 25); x.fill();
  x.fillStyle = me ? '#2a1a00' : '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, 27);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false, transparent: true, fog: false }));
  s.scale.set(w / 50 * .42, .42, 1); s.position.y = 2.9; s.renderOrder = 10;
  return s;
}
