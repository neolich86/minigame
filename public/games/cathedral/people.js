// 사람들 — Kenney Mini Characters (CC0) 3D 모델. 대기·걷기·앉기 동작.
import * as THREE from 'three';
import { GLTFLoader } from './vendor/jsm/GLTFLoader.js';
import { clone as skClone } from './vendor/jsm/SkeletonUtils.js';

export const PEOPLE = [
  { id: 'character-female-a', name: '하나' }, { id: 'character-female-b', name: '소라' }, { id: 'character-female-c', name: '미나' },
  { id: 'character-female-d', name: '유진' }, { id: 'character-female-e', name: '다은' }, { id: 'character-female-f', name: '세아' },
  { id: 'character-male-a', name: '준' }, { id: 'character-male-b', name: '도윤' }, { id: 'character-male-c', name: '민호' },
  { id: 'character-male-d', name: '태오' }, { id: 'character-male-e', name: '시우' }, { id: 'character-male-f', name: '건' },
];
const HEIGHT = 1.55;
const loader = new GLTFLoader();
const models = new Map();
export function loadPerson(id) {
  if (!models.has(id)) models.set(id, loader.loadAsync(`people/${id}.glb`).then((g) => {
    g.scene.traverse((o) => { if (o.isMesh) { o.frustumCulled = false; o.material.metalness = 0; o.material.roughness = .85; o.material.emissive = new THREE.Color(0x2a2018); } });
    const box = new THREE.Box3().setFromObject(g.scene);
    return { scene: g.scene, clips: g.animations, scale: HEIGHT / (box.max.y - box.min.y) };
  }));
  return models.get(id);
}
export const loadAllPeople = () => Promise.all(PEOPLE.map((p) => loadPerson(p.id)));

export class Actor {
  constructor(model, scene, meta) {
    this.meta = meta; this.scene = scene; this.face = Math.PI; this.state = '';
    this.obj = skClone(model.scene); this.obj.scale.setScalar(model.scale);
    this.mixer = new THREE.AnimationMixer(this.obj);
    this.actions = {};
    for (const c of model.clips) this.actions[c.name] = this.mixer.clipAction(c);
    scene.add(this.obj);
    this.play('idle', 0);
    this.mixer.update(Math.random() * 3);
  }
  get pos() { return this.obj.position; }
  get visible() { return this.obj.visible; }
  set visible(v) { this.obj.visible = v; }
  play(name, fade = .25) {
    if (this.state === name || !this.actions[name]) return;
    const next = this.actions[name], prev = this.actions[this.state];
    next.reset().play();
    if (prev && fade) next.crossFadeFrom(prev, fade, false); else if (prev) prev.stop();
    this.state = name;
  }
  place(x, y, z, face) { this.obj.position.set(x, y, z); if (face !== undefined) this.face = face; this.obj.rotation.y = this.face; }
  update(dt, moving = false) {
    if (this.state !== 'sit') this.play(moving ? 'walk' : 'idle');
    this.obj.rotation.y = this.face;
    this.mixer.update(dt);
  }
  sit() { this.play('sit', .2); }
  dispose() { this.scene.remove(this.obj); this.mixer.stopAllAction(); }
}

// 고르기 메뉴용 썸네일 (작은 렌더러로 한 번씩 찍어 둔다)
export async function makeThumbs(size = 96) {
  await loadAllPeople();
  const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  r.setSize(size, size); r.outputColorSpace = THREE.SRGBColorSpace;
  const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xffffff, 0x886655, 2.2)); const dl = new THREE.DirectionalLight(0xffffff, 1.6); dl.position.set(1, 2, 3); sc.add(dl);
  const cam = new THREE.PerspectiveCamera(30, 1, .1, 20); cam.position.set(0, HEIGHT * .62, 3.1); cam.lookAt(0, HEIGHT * .5, 0);
  const out = {};
  for (const p of PEOPLE) {
    const a = new Actor(await loadPerson(p.id), sc, p); a.place(0, 0, 0, .35); a.update(.6);
    r.render(sc, cam); out[p.id] = r.domElement.toDataURL(); a.dispose();
  }
  r.dispose(); r.forceContextLoss();
  return out;
}
