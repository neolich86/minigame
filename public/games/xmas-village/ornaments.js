// 소원 장식 14종 — 사용자가 준 그림(assets/orn/*.webp)을 트리에 매다는 스프라이트로 쓴다.
import * as THREE from 'three';

export const ORNAMENTS = [
  // 처음부터 쓸 수 있는 8종
  { id: 'redball', name: '빨간 방울', open: true },
  { id: 'star', name: '별', open: true },
  { id: 'flake', name: '눈꽃', open: true },
  { id: 'bell', name: '종', open: true },
  { id: 'sock', name: '양말', open: true },
  { id: 'tree', name: '작은 트리', open: true },
  { id: 'gift', name: '선물상자', open: true },
  { id: 'cane', name: '사탕지팡이', open: true },
  // 출석 보상 6종 (2~7일차)
  { id: 'santahat', name: '산타모자', open: false },
  { id: 'holly', name: '호랑가시나무', open: false },
  { id: 'wreath', name: '리스', open: false },
  { id: 'blueball', name: '눈꽃 방울', open: false },
  { id: 'goldcane', name: '황금 지팡이', open: false },
  { id: 'goldball', name: '황금별 방울', open: false },
];
export const ORN = Object.fromEntries(ORNAMENTS.map((o) => [o.id, o]));
export const ornUrl = (id) => `assets/orn/${ORN[id] ? id : 'star'}.webp`;

const loader = new THREE.TextureLoader();
const mats = {};
function mat(id) {
  if (!mats[id]) {
    const t = loader.load(ornUrl(id)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    // 밤 장면에 어울리게 살짝 낮춘 밝기 (블룸으로 은은하게 빛난다)
    mats[id] = new THREE.SpriteMaterial({ map: t, color: 0xf0f0f0, transparent: true, alphaTest: .08, depthWrite: true });
  }
  return mats[id];
}
const threadM = new THREE.MeshBasicMaterial({ color: 0xd8b060 });
const threadG = new THREE.CylinderGeometry(.008, .008, .3, 4);

// 장식 하나: 가지(위쪽 끝)에 매달린 그림 + 짧은 끈. 크기는 대략 지름 1.2
export function makeOrnament(id) {
  const g = new THREE.Group();
  const s = new THREE.Sprite(mat(ORN[id] ? id : 'star')); s.center.set(.5, 1); s.scale.set(1.2, 1.2, 1); s.position.y = .02; g.add(s);
  const th = new THREE.Mesh(threadG, threadM); th.position.y = .15; g.add(th);
  return g;
}

// 고르기 그리드 · 목록 · 카드에 쓰는 그림 주소
export function ornamentThumbs() { return Object.fromEntries(ORNAMENTS.map((o) => [o.id, ornUrl(o.id)])); }
