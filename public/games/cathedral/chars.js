// 8방향 픽셀 캐릭터 (elie automata 에셋) — 3D 공간에 빌보드 스프라이트로 세우고, 카메라에서 본 방향에 맞는 줄을 고른다.
import * as THREE from 'three';

const DIRS = 8; // atlas 줄 순서: south, south-east, east, north-east, north, north-west, west, south-west
const loader = new THREE.TextureLoader();
const cache = new Map();
function atlas(file) {
  if (!cache.has(file)) {
    const t = loader.load('chars/' + file);
    t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
    cache.set(file, t);
  }
  return cache.get(file);
}
export async function loadCharMeta() {
  const r = await fetch('chars/chars.json');
  const list = await r.json();
  await Promise.all(list.flatMap((c) => Object.values(c.anims).map((a) => new Promise((res) => { const t = atlas(a.file); if (t.image) res(); else { const img = new Image(); img.onload = res; img.onerror = res; img.src = 'chars/' + a.file; } }))));
  return list;
}
// 소개 화면용 정면 썸네일
export function thumb(meta, size = 64) {
  const a = meta.anims.idle, c = document.createElement('canvas'); c.width = c.height = size;
  const img = new Image(); img.src = 'chars/' + a.file;
  img.onload = () => { const g = c.getContext('2d'); g.imageSmoothingEnabled = false; const k = Math.min(size / a.cw, size / a.ch); g.drawImage(img, 0, 0, a.cw, a.ch, (size - a.cw * k) / 2, size - a.ch * k, a.cw * k, a.ch * k); };
  return c;
}

const tmp = new THREE.Vector3();
export class Actor {
  constructor(meta, scene, { height = 1.7, tint = 0xa89e94 } = {}) {
    this.meta = meta; this.face = Math.PI; this.anim = 'idle'; this.t = Math.random() * 10;
    this.px = height / meta.anims.idle.ch; // 1픽셀 = 몇 m
    this.mat = new THREE.SpriteMaterial({ color: tint, transparent: true, alphaTest: .35, depthWrite: true });
    this.sprite = new THREE.Sprite(this.mat);
    this.sprite.center.set(.5, 0);
    this.textures = {};
    for (const [k, a] of Object.entries(meta.anims)) { const t = atlas(a.file).clone(); t.repeat.set(1 / a.n, 1 / DIRS); this.textures[k] = t; }
    this.setAnim('idle');
    scene.add(this.sprite);
  }
  get pos() { return this.sprite.position; }
  setAnim(k) {
    if (!this.meta.anims[k]) k = 'idle';
    if (this.anim === k && this.mat.map) return;
    this.anim = k; const a = this.meta.anims[k];
    this.mat.map = this.textures[k]; this.mat.needsUpdate = true;
    this.sprite.scale.set(a.cw * this.px, a.ch * this.px, 1);
  }
  update(dt, camera, moving = false) {
    this.setAnim(moving ? 'walk' : 'idle');
    const a = this.meta.anims[this.anim];
    // 걷기 동작이 없는 캐릭터는 대기 동작을 빠르게 돌리고 살짝 통통 튀게
    const speed = moving && this.anim === 'idle' ? 2.2 : 1;
    this.t += dt * a.fps * speed;
    const frame = Math.floor(this.t) % a.n;
    // 카메라 → 캐릭터 방향 기준으로 캐릭터가 어느 쪽을 보는지
    tmp.copy(this.pos).sub(camera.position); tmp.y = 0; tmp.normalize();
    const fx = Math.sin(this.face), fz = Math.cos(this.face);
    const ff = fx * tmp.x + fz * tmp.z, fr = fx * -tmp.z + fz * tmp.x;
    const ang = Math.atan2(fr, -ff);
    const row = ((Math.round(ang / (Math.PI / 4)) % DIRS) + DIRS) % DIRS;
    const t = this.mat.map; t.offset.set(frame / a.n, 1 - (row + 1) / DIRS);
    this.sprite.position.y = this.baseY + (moving && this.anim === 'idle' ? Math.abs(Math.sin(this.t * .9)) * .05 : 0);
  }
  place(x, y, z, face) { this.sprite.position.set(x, y, z); this.baseY = y; if (face !== undefined) this.face = face; }
  remove(scene) { scene.remove(this.sprite); }
}
