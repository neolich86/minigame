// 성을 지켜라 — 3D 헥스 타워 디펜스 (KayKit 헥스 맵 · Tiny Swords 군대 · KayKit 모험가 영웅)
import * as THREE from 'three';
import { GLTFLoader } from '/games/wizard/vendor/jsm/GLTFLoader.js';
import { mergeGeometries } from '/games/wizard/vendor/jsm/BufferGeometryUtils.js';
import * as C from './core.js';

const $ = (id) => document.getElementById(id);
const Q = new URLSearchParams(location.search), TEST = Q.has('test');
const MG = window.MGH || null;
const LS = 'castle-defense-v1';
const rand = (a, b) => a + Math.random() * (b - a);

// ---------- 렌더러 ----------
const cv = $('cv');
const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: TEST });
renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x232838);
scene.fog = new THREE.Fog(0x232838, 60, 120);
const camera = new THREE.PerspectiveCamera(32, 1, .5, 300);
scene.add(new THREE.HemisphereLight(0xdff2ff, 0x5a7a3a, 1.5));
const sun = new THREE.DirectionalLight(0xfff1d6, 2.4); sun.position.set(-12, 24, 14); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 18, bottom: -18, near: 1, far: 70 }); sun.shadow.bias = -.0006;
scene.add(sun);
const ov = $('ov'), og = ov.getContext('2d');
let VW = 1, VH = 1, DPR = 1;
function resize() {
  VW = innerWidth; VH = innerHeight; DPR = Math.min(2, devicePixelRatio || 1);
  renderer.setSize(VW, VH, false); ov.width = VW * DPR; ov.height = VH * DPR;
  camera.aspect = VW / VH;
  // 맵 전체(폭 22·깊이 26)가 위 HUD와 아래 메뉴 사이에 들어오도록 거리 조절
  const tilt = THREE.MathUtils.degToRad(46), vf = THREE.MathUtils.degToRad(camera.fov);
  const hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
  const dW = 9.6 / Math.tan(hf / 2), dH = 14 / Math.tan(vf / 2);
  const d = Math.max(dW, dH, 24);
  camera.position.set(0, Math.sin(tilt) * d, Math.cos(tilt) * d + 2.2); camera.lookAt(0, 0, 2.2);
  camera.updateProjectionMatrix();
  scene.fog.near = d + 8; scene.fog.far = d + 60;
}
addEventListener('resize', resize);

// ---------- 불러오기 ----------
const loader = new GLTFLoader();
const loadG = (u) => new Promise((res, rej) => loader.load(u, res, undefined, rej));
const HEX_NAMES = 'hex_grass hex_water hex_road_A hex_road_B hex_road_C hex_road_M hex_coast_A building_castle_blue building_tower_A_blue building_tower_B_blue building_tower_base_blue building_tower_catapult_blue building_church_blue building_archeryrange_blue building_barracks_blue building_destroyed building_home_A_red building_home_B_red tent flag_red flag_blue trees_A_large trees_A_medium trees_B_large trees_B_medium trees_A_small tree_single_A tree_single_B mountain_A_grass_trees mountain_B_grass mountain_C mountain_A hills_A_trees hills_B hill_single_A rock_single_A rock_single_C rock_single_E cloud_big cloud_small barrel crate_A_big sack projectile_catapult weaponrack target fence_wood_straight wall_straight waterlily_A waterplant_A resource_stone resource_lumber hex_grass_bottom wall_straight_gate wall_corner_A_outside wall_corner_B_outside building_tower_A_red building_watermill_blue building_windmill_blue mountain_B mountain_C_grass_trees hills_B_trees'.split(' ');
const WEAPONS = ['sword', 'shield', 'axe', 'staff', 'bow', 'dagger', 'arrow', 'book', 'shield2'];
const M = {}, W = {};
let UNITS = null, unitTex = null, FXT = {}, ANIMS = [];
async function loadAll(onp) {
  let done = 0; const tick = () => onp(++done / 7);
  const [hex, wep, ag, am, uj, ut] = await Promise.all([
    loadG('assets/hex.glb').then((g) => (tick(), g)), loadG('assets/weapons.glb').then((g) => (tick(), g)),
    loadG('assets/heroes/anim_general.glb').then((g) => (tick(), g)), loadG('assets/heroes/anim_move.glb').then((g) => (tick(), g)),
    fetch('assets/units.json').then((r) => r.json()).then((j) => (tick(), j)),
    new THREE.TextureLoader().loadAsync('assets/units.png').then((t) => (tick(), t)),
  ]);
  hex.scenes.forEach((s, i) => { M[HEX_NAMES[i]] = s; s.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); });
  wep.scenes.forEach((s, i) => (W[WEAPONS[i]] = s));
  ANIMS = [...ag.animations, ...am.animations];
  UNITS = uj; unitTex = ut; ut.colorSpace = THREE.SRGBColorSpace; ut.magFilter = THREE.NearestFilter; ut.minFilter = THREE.NearestFilter; ut.generateMipmaps = false;
  const tl = new THREE.TextureLoader();
  for (const [k, n] of [['explosion', 8], ['fire', 8], ['dust', 8]]) { const t = await tl.loadAsync(`assets/fx/${k}.png`); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; FXT[k] = { t, n }; }
  FXT.arrow = await tl.loadAsync('assets/fx/enemy_arrow.png'); FXT.arrow.colorSpace = THREE.SRGBColorSpace;
  tick();
}
const clone = (n) => M[n].clone(true);

// ---------- 맵 ----------
const MAP = C.buildMap();
const world = new THREE.Group(); scene.add(world);
const dyn = new THREE.Group(); scene.add(dyn);
let pathPts = [], castlePos = null, spawnPos = null;
const slots = new Map(); // key -> {t, x, z, tower}
const TH = new Map(); // 타일 윗면 높이
const tileH = (q, r) => TH.get(C.key(q, r)) || 0;
function buildWorld() {
  const statics = [];
  const place = (name, x, z, rot = 0, s = 1, y = 0) => { const o = clone(name); o.position.set(x, y, z); o.rotation.y = rot; o.scale.setScalar(s); statics.push(o); return o; };
  const rot6 = (rng) => Math.floor(rng() * 6) * Math.PI / 3;
  // 땅 타일: 윗면이 h 인 기둥 (두께 1짜리 타일을 아래로 쌓아 옆면이 보이게)
  const ground = (name, x, z, h, rot = 0, floor = -1) => { place(name, x, z, rot, 1, h); for (let y = h - 1; y > floor + .01; y -= 1) place('hex_grass_bottom', x, z, 0, 1, y); };
  const rng = mulberry(11);
  const [lq0, lr0] = MAP.path[MAP.path.length - 1];
  const castleNb = new Set([[-1, 0], [1, 0], [-1, 1], [0, 1]].map(([dq, dr]) => C.key(lq0 + dq, lr0 + dr)));
  const wallRow = lr0 - 1;
  // 1) 높이 정하기 — 길·타워 자리는 평지, 길에서 멀수록 언덕·절벽
  for (const t of MAP.tiles) {
    let h = 0; const k = rng();
    if (t.road || t.slot || castleNb.has(C.key(t.q, t.r)) || t.r === wallRow) h = 0;
    else if (t.rr >= C.ROWS) h = -.2;               // 앞쪽 바다
    else if (t.rr < 0) h = k < .5 ? 1.5 : 1;         // 뒤쪽 산맥
    else if (!t.inside) h = k < .4 ? 1 : .5;         // 양옆 숲 언덕
    else if (t.near >= 3) h = k < .45 ? 1 : .5;
    else if (t.near === 2) h = k < .3 ? .5 : 0;
    TH.set(C.key(t.q, t.r), h);
  }
  for (const t of MAP.tiles) {
    const [x, z] = C.axToWorld(t.q, t.r); t.x = x; t.z = z;
    const h = tileH(t.q, t.r); t.h = h;
    const floor = t.inside ? -1 : -2; // 가장자리는 두껍게 (판 옆면)
    if (t.road) {
      const rd = t.road, last = rd.i === MAP.path.length - 1;
      if (last) { ground('hex_grass', x, z, 0, 0, floor); continue; }
      if (rd.i === 0) { ground('hex_road_M', x, z, 0, rotFor([3], [rd.outD]), floor); continue; }
      const e = rd.inD, o = rd.outD, diff = ((o - e) % 6 + 6) % 6;
      const [type, base] = diff === 3 ? ['hex_road_A', [3, 0]] : diff === 2 || diff === 4 ? ['hex_road_B', [3, 1]] : ['hex_road_C', [3, 2]];
      ground(type, x, z, 0, rotFor(base, [e, o]), floor);
      if (t.r === wallRow) { const g = place('wall_straight_gate', x, z, 0, 1, 0); }
      continue;
    }
    if (h < 0) { // 바다
      ground('hex_water', x, z, 0, 0, -2);
      if (rng() < .25) place(rng() < .5 ? 'waterlily_A' : 'waterplant_A', x + rand(-.4, .4), z + rand(-.4, .4), rng() * 6, 1, -.2);
      continue;
    }
    ground('hex_grass', x, z, h, 0, floor);
    if (t.r === wallRow) { place('wall_straight', x, z, 0, 1, h); continue; }
    if (castleNb.has(C.key(t.q, t.r))) continue;
    if (t.slot) {
      const s = { t, x, z, tower: null, lv: 0 };
      const base = new THREE.Group(); const bm = clone('building_tower_base_blue'); bm.scale.setScalar(.7); base.add(bm);
      const rg = new THREE.Mesh(new THREE.RingGeometry(.62, .78, 6, 1, Math.PI / 6), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: .75, depthWrite: false })); rg.rotation.x = -Math.PI / 2; rg.position.y = .05; base.add(rg); base.userData.ring = rg;
      base.position.set(x, 0, z); dyn.add(base); s.base = base;
      slots.set(C.key(t.q, t.r), s); continue;
    }
    const k = rng();
    if (t.rr < 0) { place(k < .35 ? 'mountain_A' : k < .6 ? 'mountain_B' : k < .8 ? 'mountain_C_grass_trees' : 'mountain_A_grass_trees', x, z, rot6(rng), 1, h); continue; }
    if (!t.inside) { place(k < .45 ? 'trees_A_large' : k < .75 ? 'trees_B_large' : k < .9 ? 'hills_B_trees' : 'mountain_C', x, z, rot6(rng), 1, h); continue; }
    if (t.near >= 3) { if (k < .6) place(k < .25 ? 'trees_A_large' : k < .4 ? 'trees_B_medium' : k < .5 ? 'hills_A_trees' : 'mountain_A_grass_trees', x, z, rot6(rng), 1, h); else if (k < .7) place('rock_single_E', x + .2, z - .2, rng() * 6, 1, h); else if (k < .76) place('building_windmill_blue', x, z, rot6(rng), 1, h); }
    else if (t.near === 2) { if (k < .3) place(k < .15 ? 'trees_A_small' : 'tree_single_B', x + rand(-.3, .3), z, rng() * 6, 1, h); else if (k < .42) place('rock_single_A', x + .3, z, rng() * 6, 1, h); }
    else if (k < .22) place(k < .1 ? 'tree_single_A' : 'rock_single_C', x + rand(-.5, .5), z + rand(-.4, .4), rng() * 6, .9, h);
  }
  // 성 · 성안 마을
  const [lq, lr] = MAP.path[MAP.path.length - 1], [cx, cz] = C.axToWorld(lq, lr);
  castlePos = new THREE.Vector3(cx, 0, cz);
  place('building_castle_blue', cx, cz, Math.PI);
  place('flag_blue', cx + .8, cz + .6, 0, 1.2);
  for (const [dq, dr, n] of [[-1, 0, 'building_home_A_red'], [1, 0, 'building_church_blue'], [-1, 1, 'building_barracks_blue'], [0, 1, 'building_archeryrange_blue']]) {
    const t = MAP.tiles.find((u) => u.q === lq + dq && u.r === lr + dr); if (t && !t.road && !t.slot) { t.deco = true; place(n, t.x, t.z, Math.PI); }
  }
  // 적 진영
  const [sq, sr] = MAP.path[0], [sx0, sz0] = C.axToWorld(sq, sr);
  spawnPos = new THREE.Vector3(sx0, 0, sz0 - 1.2);
  place('tent', sx0 - 1.3, sz0 - .4, .5, .9); place('tent', sx0 + 1.4, sz0 - .3, -.6, .9); place('flag_red', sx0 - .7, sz0 + .3, 0, 1.1); place('flag_red', sx0 + .7, sz0 + .3, 0, 1.1);
  pathPts = [spawnPos.clone(), ...MAP.path.map(([q, r]) => { const [x, z] = C.axToWorld(q, r); return new THREE.Vector3(x, 0, z); })];
  for (let i = 0; i < 4; i++) { const c = clone(i % 2 ? 'cloud_big' : 'cloud_small'); c.position.set((i % 2 ? 1 : -1) * rand(12.5, 15), rand(3.5, 5), rand(-14, 12)); c.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } }); c.userData.v = rand(.2, .5); clouds.push(c); scene.add(c); }
  mergeStatic(statics);
}
const clouds = [];
function rotFor(base, want) {
  // base 방향 집합을 k*60° 돌려 want 와 같게 (three.js y축 + 회전 = 화면에서 반시계)
  for (let k = 0; k < 6; k++) { const rot = base.map((d) => (d + k) % 6).sort().join(), w = [...want].sort().join(); if (rot === w) return k * Math.PI / 3; }
  return 0;
}
function mergeStatic(objs) {
  // 같은 재질끼리 하나의 메시로 합쳐 그리기 횟수를 줄임 (속성은 모두 float 로 다시 만듦)
  const byMat = new Map(), f32 = (a) => { const n = a.itemSize, out = new Float32Array(a.count * n); for (let i = 0; i < a.count; i++) for (let j = 0; j < n; j++) out[i * n + j] = a.getComponent(i, j); return new THREE.BufferAttribute(out, n); };
  for (const o of objs) {
    o.updateMatrixWorld(true);
    o.traverse((m) => {
      if (!m.isMesh) return;
      const src = m.geometry, g = new THREE.BufferGeometry();
      for (const n of ['position', 'normal', 'uv']) if (src.attributes[n]) g.setAttribute(n, f32(src.attributes[n]));
      g.setIndex(src.index ? Array.from(src.index.array) : [...Array(src.attributes.position.count).keys()]);
      g.applyMatrix4(m.matrixWorld);
      const k = m.material.uuid; if (!byMat.has(k)) byMat.set(k, { mat: m.material, gs: [] }); byMat.get(k).gs.push(g);
    });
  }
  for (const { mat, gs } of byMat.values()) { const g = mergeGeometries(gs, false); if (!g) continue; const mesh = new THREE.Mesh(g, mat); mesh.castShadow = true; mesh.receiveShadow = true; world.add(mesh); }
}
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- 상태 ----------
let G = null; // 게임 상태
const enemies = [], towers = [], shots = [], fxs = [], texts = [];
let hero = null;
function newGame(heroId) {
  for (const e of enemies) dyn.remove(e.spr); enemies.length = 0;
  for (const t of towers) dyn.remove(t.obj); towers.length = 0;
  for (const s of slots.values()) { s.tower = null; s.base.visible = true; }
  for (const s of shots) s.obj && dyn.remove(s.obj); shots.length = 0;
  G = { gold: 180, lives: 20, wave: 0, state: 'build', next: 0, queue: [], spawnT: 0, t: 0, speed: 1, heroId, kills: 0, over: false, auto: false, waveBonus: 0 };
  spawnHero(heroId);
  selSlot = null; closeMenu(); updHud(true);
}

// ---------- 적 ----------
function makeEnemy(type, col) {
  const E = C.ENEMY[type], T = C.TIER[col], u = UNITS.u[col + '_' + type];
  const tex = unitTex.clone(); tex.needsUpdate = false; tex.repeat.set(u.w / UNITS.W, u.h / UNITS.H);
  const mat = new THREE.SpriteMaterial({ map: tex, alphaTest: .5, transparent: false });
  const spr = new THREE.Sprite(mat);
  const size = E.size * (T.size || 1) * 2.1, px = 82;
  spr.scale.set(u.w / px * size, u.h / px * size, 1); spr.center.set(u.ax / u.w, 1 - u.ay / u.h);
  spr.renderOrder = 2; dyn.add(spr);
  const hp = E.hp * T.hp * C.waveHp(G.wave);
  const e = { type, col, E, u, spr, tex, size, hp, max: hp, d: 0, seg: 0, lat: rand(-.38, .38), pos: pathPts[0].clone(), spd: E.spd * rand(.92, 1.08), slow: 0, slowT: 0, stun: 0, frame: rand(0, 6), atkT: 0, cd: rand(.5, 1.2), face: 1, gold: Math.round(E.gold * T.gold), boss: col === 'black', hitT: 0, fighting: false, poison: 0 };
  e.pos.x += e.lat * .4; setFrame(e, 'run', 0); spr.position.copy(e.pos);
  enemies.push(e); return e;
}
function setFrame(e, anim, f) {
  const L = e.u[anim], fr = L[Math.floor(f) % L.length], tx = e.tex;
  const rw = e.u.w / UNITS.W, rh = e.u.h / UNITS.H;
  tx.repeat.set(e.face > 0 ? rw : -rw, rh);
  tx.offset.set(e.face > 0 ? fr[0] / UNITS.W : (fr[0] + e.u.w) / UNITS.W, 1 - (fr[1] + e.u.h) / UNITS.H);
  tx.flipY = true;
}
const segLen = [];
function pathInfo() { segLen.length = 0; for (let i = 0; i < pathPts.length - 1; i++) segLen.push(pathPts[i].distanceTo(pathPts[i + 1])); }
function enemyStep(e, dt) {
  const spd = e.spd * (e.slowT > 0 ? 1 - e.slow : 1) * (e.stun > 0 ? 0 : 1);
  e.slowT = Math.max(0, e.slowT - dt); e.stun = Math.max(0, e.stun - dt); e.hitT = Math.max(0, e.hitT - dt);
  if (e.poison > 0) { e.poison -= dt; damage(e, e.poisonD * dt, null, true); if (e.dead) return; }
  // 영웅과 붙으면 멈춰서 싸움 (근접) / 궁수는 사거리 안이면 쏨
  const hd = hero && hero.alive ? e.pos.distanceTo(hero.pos) : 99;
  const melee = hd < 1.05, shoot = e.E.ranged && hd < e.E.ranged && hero.alive;
  e.fighting = melee || shoot;
  if (e.fighting && e.stun <= 0) {
    e.cd -= dt; e.face = hero.pos.x >= e.pos.x ? 1 : -1;
    if (e.cd <= 0) { e.cd = e.E.ranged ? 1.6 : 1.1; e.atkT = .5; if (e.E.ranged && !melee) enemyArrow(e); else hurtHero(e.E.dmg * (e.boss ? 3 : 1) * (e.col === 'purple' ? 1.6 : 1)); }
  } else if (spd > 0) {
    let move = spd * dt;
    while (move > 0 && e.seg < pathPts.length - 1) {
      const a = pathPts[e.seg], b = pathPts[e.seg + 1], L = segLen[e.seg], left = L - e.d;
      if (move < left) { e.d += move; move = 0; } else { move -= left; e.seg++; e.d = 0; }
    }
    if (e.seg >= pathPts.length - 1) { leak(e); return; }
    const a = pathPts[e.seg], b = pathPts[e.seg + 1], t = e.d / segLen[e.seg];
    const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1;
    // 길 폭 안에서 좌우로 조금씩 퍼져서 걷기
    e.pos.set(a.x + dx * t - dz / l * e.lat * .45, 0, a.z + dz * t + dx / l * e.lat * .45);
    if (Math.abs(dx) > .2) e.face = dx > 0 ? 1 : -1;
  }
  // 수도승: 주변 회복
  if (e.E.heal && e.stun <= 0) { e.healT = (e.healT || 0) - dt; if (e.healT <= 0) { e.healT = 3; let did = false; for (const o of enemies) if (o !== e && !o.dead && o.hp < o.max && o.pos.distanceTo(e.pos) < 2.2) { o.hp = Math.min(o.max, o.hp + o.max * .18); did = true; } if (did) { e.atkT = 1; addFx('dust', e.pos, .9, 0xa0ffa0); } } }
  // 그림
  e.atkT = Math.max(0, e.atkT - dt);
  e.frame += dt * (e.atkT > 0 ? 10 : 9) * (spd > 0 || e.atkT > 0 ? 1 : .3);
  setFrame(e, e.atkT > 0 ? 'atk' : 'run', e.frame);
  e.spr.position.copy(e.pos);
  const c = e.stun > 0 ? 0x9aa0b0 : e.slowT > 0 ? 0x9fd0ff : e.poison > 0 ? 0xb8ff9a : e.hitT > 0 ? 0xffb0b0 : 0xffffff;
  e.spr.material.color.setHex(c);
}
function leak(e) {
  e.dead = true; dyn.remove(e.spr); e.tex.dispose(); e.spr.material.dispose();
  G.lives = Math.max(0, G.lives - (e.boss ? 5 : 1)); shake = .35; flash('#ff3030');
  floatText(castlePos, `-${e.boss ? 5 : 1} ♥`, '#ff6a6a', 1.3);
  if (G.lives <= 0) endGame(false);
}
function damage(e, d, src, quiet) {
  if (e.dead) return;
  d *= 1 - (e.E.armor || 0) * (src === 'magic' ? 0 : 1);
  e.hp -= d; e.hitT = .12;
  if (!quiet) floatText(e.pos, Math.round(d), src === 'hero' ? '#ffe36a' : src === 'skill' ? '#ff9a4a' : '#ffffff', e.boss ? 1.1 : .85);
  if (e.hp <= 0) {
    e.dead = true; G.gold += e.gold; G.kills++; dyn.remove(e.spr); e.tex.dispose(); e.spr.material.dispose();
    floatText(e.pos, `+${e.gold}`, '#ffd34a', .9, 1);
    addFx('dust', e.pos, e.boss ? 2 : 1.1);
    if (hero && hero.alive) gainXp(e.boss ? 60 : e.col === 'purple' ? 8 : 4);
  }
}

// ---------- 타워 ----------
function buildTower(slot, type) {
  const T = C.TOWERS[type]; if (G.gold < T.cost[0]) return;
  G.gold -= T.cost[0];
  slot.base.visible = false;
  const obj = clone(T.model); obj.position.set(slot.x, 0, slot.z); obj.scale.setScalar(.95); dyn.add(obj);
  const tw = { slot, type, lv: 0, obj, cd: .3, x: slot.x, z: slot.z, aim: 0 };
  slot.tower = tw; towers.push(tw); addFx('dust', obj.position, 2.2); sfxPop(obj);
  updHud(true);
}
function upgradeTower(tw) {
  const T = C.TOWERS[tw.type]; if (tw.lv >= 2) return; const c = T.cost[tw.lv + 1]; if (G.gold < c) return;
  G.gold -= c; tw.lv++;
  tw.obj.scale.setScalar(.95 + tw.lv * .12);
  if (tw.lv === 1) { const f = clone('flag_blue'); f.position.set(.35, 0, .3); f.scale.setScalar(.8); tw.obj.add(f); }
  if (tw.lv === 2) { const ring = new THREE.Mesh(new THREE.RingGeometry(.75, .95, 6), new THREE.MeshBasicMaterial({ color: 0xffd34a, transparent: true, opacity: .8, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = .03; tw.obj.add(ring); }
  addFx('dust', tw.obj.position, 2.4); sfxPop(tw.obj); updHud(true);
}
function sellTower(tw) {
  G.gold += C.sellValue(tw.type, tw.lv); dyn.remove(tw.obj); towers.splice(towers.indexOf(tw), 1); tw.slot.tower = null; tw.slot.base.visible = true; addFx('dust', tw.obj.position, 2); updHud(true);
}
function towerStep(tw, dt) {
  const T = C.TOWERS[tw.type], range = T.range[tw.lv];
  tw.cd -= dt; if (tw.cd > 0) return;
  // 성에 가장 가까운(가장 앞선) 적
  let best = null, bp = -1;
  for (const e of enemies) { if (e.dead) continue; const dx = e.pos.x - tw.x, dz = e.pos.z - tw.z; if (dx * dx + dz * dz > range * range) continue; const p = e.seg + e.d / (segLen[e.seg] || 1); if (p > bp) { bp = p; best = e; } }
  if (!best) { tw.cd = .1; return; }
  tw.cd = T.rate[tw.lv];
  const from = new THREE.Vector3(tw.x, tw.type === 'cannon' ? 1.4 : 2.1 + tw.lv * .2, tw.z);
  fire(tw.type === 'archer' ? 'arrow' : tw.type === 'cannon' ? 'rock' : 'magic', from, best, T.dmg[tw.lv], { splash: T.splash && T.splash[tw.lv], slow: T.slow && T.slow[tw.lv], src: tw.type === 'magic' ? 'magic' : 'tower' });
  if (tw.type === 'cannon') { tw.obj.rotation.y = Math.atan2(best.pos.x - tw.x, best.pos.z - tw.z); }
}

// ---------- 투사체 ----------
const magicTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(190,140,255,.95)'); gr.addColorStop(1, 'rgba(120,60,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
function fire(kind, from, target, dmg, o = {}) {
  let obj;
  if (kind === 'arrow' || kind === 'harrow') { obj = W.arrow.clone(true); obj.scale.setScalar(kind === 'harrow' ? 1.1 : 1.3); }
  else if (kind === 'rock') { obj = clone('projectile_catapult'); obj.scale.setScalar(1.4); }
  else { obj = new THREE.Sprite(new THREE.SpriteMaterial({ map: magicTex, color: o.color || 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); obj.scale.setScalar(o.big ? 1.4 : .8); }
  obj.position.copy(from); dyn.add(obj);
  const to = target.pos ? target.pos.clone() : target.clone();
  const dist = from.distanceTo(to), dur = kind === 'rock' ? .9 : Math.max(.15, dist / (kind === 'magic' ? 9 : 16));
  shots.push({ kind, obj, from: from.clone(), target, to, t: 0, dur, dmg, o, arc: kind === 'rock' ? 2.5 : kind === 'magic' ? .4 : .6 });
}
function shotStep(s, dt) {
  s.t += dt; const u = Math.min(1, s.t / s.dur);
  if (s.target.pos && !s.target.dead) s.to.copy(s.target.pos);
  const p = new THREE.Vector3().lerpVectors(s.from, new THREE.Vector3(s.to.x, .55, s.to.z), u); p.y += Math.sin(u * Math.PI) * s.arc;
  if (s.kind === 'arrow' || s.kind === 'harrow') { s.obj.lookAt(p.clone().add(p.clone().sub(s.obj.position))); s.obj.rotateX(Math.PI / 2); }
  if (s.kind === 'rock') s.obj.rotation.x += dt * 8;
  s.obj.position.copy(p);
  if (u >= 1) {
    dyn.remove(s.obj);
    if (s.o.splash) { addFx('explosion', s.to, 1.6 * s.o.splash); for (const e of enemies) if (!e.dead && e.pos.distanceTo(s.to) < s.o.splash) damage(e, s.dmg * (e === s.target ? 1 : .7), s.o.src); shake = Math.max(shake, .08); }
    else if (s.target.pos && !s.target.dead) { damage(s.target, s.dmg, s.o.src); if (s.o.slow) { s.target.slow = s.o.slow; s.target.slowT = 1.8; } if (s.kind === 'magic') addFx('dust', s.to, .7, 0xc0a0ff); }
    return true;
  }
}
function enemyArrow(e) {
  const obj = new THREE.Sprite(new THREE.SpriteMaterial({ map: FXT.arrow, transparent: true })); obj.scale.setScalar(.5);
  obj.position.set(e.pos.x, .7, e.pos.z); dyn.add(obj);
  shots.push({ kind: 'earrow', obj, from: obj.position.clone(), target: hero, to: hero.pos.clone(), t: 0, dur: .4, dmg: e.E.dmg * (e.col === 'purple' ? 1.6 : 1), o: {}, arc: .5, enemy: true });
}

// ---------- 영웅 ----------
let mixer = null;
async function spawnHero(id) {
  if (hero && hero.obj) dyn.remove(hero.obj);
  const H = C.HEROES[id];
  const g = await loadG(`assets/heroes/${id}.glb`);
  const obj = g.scene; obj.scale.setScalar(1.3);
  obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
  const bone = (n) => { let b = null; obj.traverse((o) => { if (o.name === n) b = o; }); return b; };
  const attach = (w, n) => { if (!w) return; const m = W[{ sword: 'sword', shield: 'shield', axe: 'axe', staff: 'staff', book: 'book', bow: 'bow', dagger: 'dagger' }[w]].clone(true); bone(n)?.add(m); };
  attach(H.r, 'handslotr'); attach(H.l, 'handslotl');
  dyn.add(obj);
  mixer = new THREE.AnimationMixer(obj);
  const act = {}; for (const c of ANIMS) act[c.name] = mixer.clipAction(c);
  for (const n of ['Throw', 'Use_Item', 'Interact', 'Hit_A', 'Death_A', 'Spawn_Ground']) if (act[n]) { act[n].setLoop(THREE.LoopOnce); act[n].clampWhenFinished = true; }
  const ring = new THREE.Mesh(new THREE.RingGeometry(.42, .52, 32), new THREE.MeshBasicMaterial({ color: 0x5ae0ff, transparent: true, opacity: .8 })); ring.rotation.x = -Math.PI / 2; ring.position.y = .04; dyn.add(ring);
  const start = castlePos.clone().add(new THREE.Vector3(0, 0, -1.8));
  hero = { id, H, obj, act, cur: null, pos: start.clone(), target: null, alive: true, hp: H.hp, max: H.hp, cd: 0, lv: 1, xp: 0, sk: [2, 4], buff: { guard: 0, rage: 0 }, respawn: 0, ring, face: Math.PI, busyT: 0 };
  obj.position.copy(hero.pos); obj.rotation.y = Math.PI;
  $('hImg').src = `assets/heroes/${id}.png`; $('hName').textContent = H.name;
  play('Spawn_Ground', .1); setTimeout(() => hero && hero.alive && play('Idle_A'), 900);
  updHud(true);
}
function play(n, fade = .15) {
  const a = hero.act[n]; if (!a || hero.cur === n && a.loop !== THREE.LoopOnce) return;
  const prev = hero.act[hero.cur]; a.reset().setEffectiveWeight(1).play(); if (prev && prev !== a) prev.crossFadeTo(a, fade, false); hero.cur = n;
}
const heroStat = () => ({ atk: hero.H.atk * (1 + (hero.lv - 1) * .12), max: hero.H.hp * (1 + (hero.lv - 1) * .1) });
function gainXp(x) { hero.xp += x; while (hero.xp >= C.heroXp(hero.lv) && hero.lv < 20) { hero.xp -= C.heroXp(hero.lv); hero.lv++; const st = heroStat(); hero.max = st.max; hero.hp = Math.min(hero.max, hero.hp + hero.max * .3); floatText(hero.pos, `레벨 ${hero.lv}!`, '#7ae0ff', 1.2, 1.5); addFx('dust', hero.pos, 1.6, 0x7ae0ff); } updHud(); }
function hurtHero(d) {
  if (!hero || !hero.alive) return;
  d *= hero.buff.guard > 0 ? .3 : 1; hero.hp -= d; floatText(hero.pos, `-${Math.round(d)}`, '#ff7a7a', .8);
  if (hero.busyT <= 0 && Math.random() < .25) { play('Hit_A', .05); hero.busyT = .35; }
  if (hero.hp <= 0) { hero.hp = 0; hero.alive = false; hero.respawn = 10; play('Death_A', .05); floatText(hero.pos, '영웅 쓰러짐… 10초 뒤 부활', '#ffb0b0', 1, 2); }
}
function heroStep(dt) {
  const h = hero; if (!h) return;
  h.busyT = Math.max(0, h.busyT - dt); h.buff.guard = Math.max(0, h.buff.guard - dt); h.buff.rage = Math.max(0, h.buff.rage - dt);
  h.sk = h.sk.map((c) => Math.max(0, c - dt));
  h.ring.position.set(h.pos.x, .04, h.pos.z); h.ring.material.color.setHex(h.buff.guard > 0 ? 0xffd34a : h.buff.rage > 0 ? 0xff5a3a : 0x5ae0ff);
  if (!h.alive) {
    h.respawn -= dt; if (h.respawn <= 0) { h.alive = true; h.hp = h.max; h.pos.copy(castlePos).add(new THREE.Vector3(0, 0, -1.8)); h.obj.position.copy(h.pos); h.target = null; play('Spawn_Ground', .05); h.busyT = .9; }
    return;
  }
  h.hp = Math.min(h.max, h.hp + h.max * .015 * dt); // 천천히 회복
  // 이동
  let moving = false;
  if (h.target) {
    const dx = h.target.x - h.pos.x, dz = h.target.z - h.pos.z, d = Math.hypot(dx, dz);
    if (d < .08) h.target = null;
    else { const s = Math.min(d, h.H.spd * dt); h.pos.x += dx / d * s; h.pos.z += dz / d * s; h.face = Math.atan2(dx, dz); moving = true; }
  }
  // 공격
  h.cd -= dt * (h.buff.rage > 0 ? 2 : 1);
  let tgt = null, td = 1e9;
  for (const e of enemies) { if (e.dead) continue; const d = e.pos.distanceTo(h.pos); if (d < td) { td = d; tgt = e; } }
  if (!moving && tgt && td <= h.H.range + .15 && h.cd <= 0 && h.busyT <= 0) {
    h.cd = h.H.rate; h.face = Math.atan2(tgt.pos.x - h.pos.x, tgt.pos.z - h.pos.z);
    play('Throw', .05); h.busyT = .3;
    const atk = heroStat().atk;
    if (h.H.bolt) fire('magic', h.pos.clone().setY(1), tgt, atk, { src: 'hero', color: 0x9fe8ff });
    else if (h.H.arrow) fire('harrow', h.pos.clone().setY(.9), tgt, atk, { src: 'hero' });
    else setTimeout(() => { if (!tgt.dead) { damage(tgt, atk, 'hero'); addFx('dust', tgt.pos, .6, 0xffffff); } }, 160);
  }
  if (h.busyT <= 0) play(moving ? 'Running_A' : 'Idle_A');
  { const [hq, hr] = C.worldToAx(h.pos.x, h.pos.z); const ty = Math.max(0, tileH(hq, hr)); h.pos.y += (ty - h.pos.y) * Math.min(1, dt * 10); }
  h.obj.position.copy(h.pos);
  const dr = ((h.face - h.obj.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI; h.obj.rotation.y += dr * Math.min(1, dt * 12);
}
function bestCluster(r, maxD) {
  // 영웅 근처에서 적이 가장 많이 모인 곳
  let best = null, bn = 0;
  for (const e of enemies) { if (e.dead || e.pos.distanceTo(hero.pos) > maxD) continue; let n = 0; for (const o of enemies) if (!o.dead && o.pos.distanceTo(e.pos) < r) n++; if (n > bn) { bn = n; best = e.pos.clone(); } }
  return best;
}
function castSkill(i) {
  const h = hero; if (!h || !h.alive || h.sk[i] > 0) return;
  const S = h.H.s[i], atk = heroStat().atk; let ok = true;
  const near = (p, r) => enemies.filter((e) => !e.dead && e.pos.distanceTo(p) < r);
  switch (S.id) {
    case 'spin': near(h.pos, 2).forEach((e) => damage(e, atk * 3.2, 'skill')); ring(h.pos, 2, 0xffffff); break;
    case 'guard': h.buff.guard = 6; near(h.pos, 2.2).forEach((e) => (e.stun = 2)); ring(h.pos, 2.2, 0xffd34a); break;
    case 'slam': near(h.pos, 2.6).forEach((e) => { damage(e, atk * 2.8, 'skill'); e.stun = 1.5; }); addFx('explosion', h.pos, 3); ring(h.pos, 2.6, 0xff9a4a); shake = .4; break;
    case 'rage': h.buff.rage = 8; addFx('fire', h.pos, 1.6); break;
    case 'meteor': { const p = bestCluster(1.8, 7); if (!p) { ok = false; break; } const m = clone('projectile_catapult'); m.scale.setScalar(4); m.position.set(p.x - 3, 9, p.z - 3); dyn.add(m); shots.push({ kind: 'meteor', obj: m, from: m.position.clone(), target: p, to: p.clone(), t: 0, dur: .8, dmg: atk * 6, o: { splash: 2.2, src: 'skill' }, arc: 0 }); break; }
    case 'frost': near(h.pos, 2.8).forEach((e) => { e.stun = 2.5; damage(e, atk * 1.2, 'skill'); }); ring(h.pos, 2.8, 0x9fe8ff); break;
    case 'rain': { const p = bestCluster(1.8, 7); if (!p) { ok = false; break; } for (let k = 0; k < 14; k++) setTimeout(() => { const q = p.clone().add(new THREE.Vector3(rand(-1.4, 1.4), 0, rand(-1.4, 1.4))); fire('harrow', q.clone().setY(6), q, 0, {}); setTimeout(() => near(q, .8).forEach((e) => damage(e, atk * 1.1, 'skill')), 380); }, k * 60); break; }
    case 'pierce': { const t = enemies.filter((e) => !e.dead).sort((a, b) => a.pos.distanceTo(h.pos) - b.pos.distanceTo(h.pos))[0]; if (!t) { ok = false; break; } const dir = t.pos.clone().sub(h.pos).setY(0).normalize(); for (const e of enemies) { if (e.dead) continue; const v = e.pos.clone().sub(h.pos); const along = v.dot(dir); const side = v.clone().sub(dir.clone().multiplyScalar(along)).length(); if (along > 0 && along < 8 && side < .7) damage(e, atk * 5, 'skill'); } fire('harrow', h.pos.clone().setY(.9), h.pos.clone().add(dir.multiplyScalar(8)), 0, {}); break; }
    case 'shadow': { const ts = enemies.filter((e) => !e.dead && e.pos.distanceTo(h.pos) < 4.5).slice(0, 5); if (!ts.length) { ok = false; break; } ts.forEach((e, k) => setTimeout(() => { if (!e.dead) { damage(e, atk * 3.5, 'skill'); addFx('dust', e.pos, 1.2, 0x8a6aff); } }, k * 90)); break; }
    case 'poison': { const p = h.pos.clone(); for (let k = 0; k < 6; k++) setTimeout(() => near(p, 2.4).forEach((e) => { e.poison = 1.2; e.poisonD = atk * .9; }), k * 1000); ring(p, 2.4, 0x9aff6a); addFx('dust', p, 3, 0x9aff6a); break; }
  }
  if (!ok) { toast('근처에 적이 없어요'); return; }
  h.sk[i] = S.cd; play('Use_Item', .05); h.busyT = .45;
  floatText(h.pos, S.name + '!', '#ffffff', 1.1, 1.3);
}
function ring(p, r, color) {
  const m = new THREE.Mesh(new THREE.RingGeometry(r * .85, r, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .9, side: THREE.DoubleSide, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(p.x, .08, p.z); dyn.add(m); fxs.push({ mesh: m, t: 0, dur: .5, ring: true });
}

// ---------- 이펙트 (Tiny Swords 파티클) ----------
function addFx(k, p, s = 1, color = 0xffffff) {
  const F = FXT[k]; if (!F) return; const t = F.t.clone(); t.repeat.set(1 / F.n, 1);
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, color, transparent: true, depthWrite: false }));
  spr.scale.setScalar(s); spr.position.set(p.x, (p.y || 0) + s * .35, p.z); spr.renderOrder = 5; dyn.add(spr);
  fxs.push({ spr, t: 0, n: F.n, dur: F.n * .07, tex: t });
}
function fxStep(f, dt) {
  f.t += dt;
  if (f.ring) { const u = f.t / f.dur; f.mesh.scale.setScalar(.6 + u * .5); f.mesh.material.opacity = .9 * (1 - u); if (u >= 1) { dyn.remove(f.mesh); f.mesh.geometry.dispose(); return true; } return; }
  const i = Math.floor(f.t / f.dur * f.n); if (i >= f.n) { dyn.remove(f.spr); f.tex.dispose(); f.spr.material.dispose(); return true; }
  f.tex.offset.x = i / f.n;
}
const sfxPop = (o) => { o.userData.pop = .3; };

// ---------- 글자 (2D 오버레이) ----------
const tmpV = new THREE.Vector3();
function floatText(p, s, col, sz = 1, life = 1) { texts.push({ p: p.clone(), s: String(s), col, sz, t: 0, life: .9 * life, dy: 0 }); if (texts.length > 80) texts.shift(); }
function proj(p, y = 0) { tmpV.set(p.x, y, p.z).project(camera); return [(tmpV.x + 1) / 2 * VW, (1 - tmpV.y) / 2 * VH]; }
function drawOverlay(dt) {
  og.setTransform(DPR, 0, 0, DPR, 0, 0); og.clearRect(0, 0, VW, VH);
  // 적 체력바
  for (const e of enemies) {
    if (e.dead || e.hp >= e.max) continue;
    const [x, y] = proj(e.pos, e.spr.scale.y * .78), w = e.boss ? 40 : 24;
    og.fillStyle = '#000'; og.fillRect(x - w / 2 - 1, y - 1, w + 2, 6); og.fillStyle = '#5a1010'; og.fillRect(x - w / 2, y, w, 4);
    og.fillStyle = e.boss ? '#ff8a3a' : '#ff4a3a'; og.fillRect(x - w / 2, y, w * Math.max(0, e.hp / e.max), 4);
  }
  // 영웅 체력바
  if (hero && hero.alive) { const [x, y] = proj(hero.pos, 2.95), w = 34; og.fillStyle = '#000'; og.fillRect(x - w / 2 - 1, y - 1, w + 2, 7); og.fillStyle = '#103a10'; og.fillRect(x - w / 2, y, w, 5); og.fillStyle = hero.buff.guard > 0 ? '#ffd34a' : '#4be06a'; og.fillRect(x - w / 2, y, w * hero.hp / hero.max, 5); }
  if (hero && !hero.alive) { const [x, y] = proj(castlePos, 2.6); og.font = '700 13px G'; og.textAlign = 'center'; og.lineWidth = 3; og.strokeStyle = '#000'; const s = `영웅 부활 ${Math.ceil(hero.respawn)}초`; og.strokeText(s, x, y); og.fillStyle = '#ffd34a'; og.fillText(s, x, y); }
  // 떠오르는 글자
  og.textAlign = 'center'; og.lineJoin = 'round';
  for (let i = texts.length - 1; i >= 0; i--) {
    const t = texts[i]; t.t += dt; if (t.t > t.life) { texts.splice(i, 1); continue; }
    const [x, y] = proj(t.p, 1.1); const yy = y - t.t * 34;
    og.globalAlpha = Math.min(1, (t.life - t.t) / .3); og.font = `700 ${Math.round(14 * t.sz)}px G`; og.lineWidth = 3.5; og.strokeStyle = '#000'; og.strokeText(t.s, x, yy); og.fillStyle = t.col; og.fillText(t.s, x, yy);
  }
  og.globalAlpha = 1;
}

// ---------- 웨이브 ----------
function startWave() {
  if (G.state === 'wave' || G.over) return;
  G.wave++; G.state = 'wave';
  const early = Math.max(0, Math.round(G.next)); if (G.wave > 1 && early > 0) { G.gold += early; floatText(spawnPos, `빨리 시작 +${early}`, '#ffd34a', 1, 1.4); }
  G.queue = [];
  let t = 0;
  for (const [type, col, n, gap] of C.waveGroups(G.wave)) { for (let i = 0; i < n; i++) { G.queue.push({ t, type, col }); t += gap; } t += 1.5; }
  G.queue.sort((a, b) => a.t - b.t); G.spawnT = 0;
  banner(G.wave % 5 === 0 ? `웨이브 ${G.wave} · 대장 출현!` : `웨이브 ${G.wave}`);
  updHud(true);
}
function waveStep(dt) {
  if (G.state === 'wave') {
    G.spawnT += dt;
    while (G.queue.length && G.queue[0].t <= G.spawnT) { const q = G.queue.shift(); makeEnemy(q.type, q.col); }
    if (!G.queue.length && !enemies.some((e) => !e.dead)) {
      const bonus = 20 + G.wave * 4; G.gold += bonus;
      if (G.wave >= C.WAVES) return endGame(true);
      G.state = 'build'; G.next = 20; banner(`웨이브 ${G.wave} 막아냄! +${bonus}골드`); updHud(true);
    }
  } else if (G.state === 'build' && G.wave > 0) {
    G.next -= dt; if (G.next <= 0) startWave();
  }
}
function endGame(win) {
  G.over = true; G.state = 'over';
  const stars = win ? (G.lives >= 18 ? 3 : G.lives >= 10 ? 2 : 1) : 0;
  let best = {}; try { best = JSON.parse(localStorage.getItem(LS) || '{}'); } catch (e) { }
  const prev = best[G.heroId] || { wave: 0, stars: 0 };
  best[G.heroId] = { wave: Math.max(prev.wave, win ? C.WAVES : G.wave - 1), stars: Math.max(prev.stars, stars) };
  try { localStorage.setItem(LS, JSON.stringify(best)); } catch (e) { }
  setTimeout(() => {
    $('end').hidden = false;
    $('endT').textContent = win ? '성을 지켜냈어요!' : '성이 무너졌어요…';
    $('endS').innerHTML = win ? `<div class="stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>남은 생명 ${G.lives} · 처치 ${G.kills}` : `웨이브 ${G.wave}까지 버텼어요 · 처치 ${G.kills}`;
  }, 900);
}

// ---------- 화면 HUD ----------
let hudT = 0;
function updHud(force) {
  if (!G) return;
  $('gold').textContent = G.gold; $('lives').textContent = G.lives; $('wave').textContent = `${Math.max(1, G.wave)}/${C.WAVES}`;
  const nb = $('nextBtn');
  nb.hidden = G.state === 'wave' || G.over;
  nb.innerHTML = G.wave === 0 ? '⚔️ 전투 시작' : `다음 웨이브 ▶ <small>${Math.ceil(G.next)}초 · +${Math.max(0, Math.round(G.next))}골드</small>`;
  if (hero) {
    $('hLv').textContent = 'Lv.' + hero.lv; $('hHp').style.width = (hero.hp / hero.max * 100) + '%'; $('hXp').style.width = (hero.xp / C.heroXp(hero.lv) * 100) + '%';
    hero.H.s.forEach((s, i) => { const b = $('sk' + i); b.querySelector('b').textContent = s.name; const c = hero.sk[i]; b.style.setProperty('--c', (c / s.cd * 100) + '%'); b.querySelector('em').textContent = c > 0 ? Math.ceil(c) : ''; b.classList.toggle('off', c > 0 || !hero.alive); });
  }
  if (selSlot) renderMenu();
}
function banner(s) { const b = $('banner'); b.textContent = s; b.classList.remove('on'); void b.offsetWidth; b.classList.add('on'); }
let toastT = null; function toast(s) { const e = $('toast'); e.textContent = s; e.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('on'), 1600); }
function flash(c) { const f = $('flash'); f.style.background = c; f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }

// ---------- 터치: 타워 자리 / 영웅 이동 ----------
let selSlot = null;
const rc = new THREE.Raycaster(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const rangeRing = new THREE.Mesh(new THREE.RingGeometry(.96, 1, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .7, depthWrite: false, side: THREE.DoubleSide }));
rangeRing.rotation.x = -Math.PI / 2; rangeRing.position.y = .06; rangeRing.visible = false; scene.add(rangeRing);
const moveMark = new THREE.Mesh(new THREE.RingGeometry(.25, .35, 24), new THREE.MeshBasicMaterial({ color: 0x5ae0ff, transparent: true, opacity: .9, depthWrite: false })); moveMark.rotation.x = -Math.PI / 2; moveMark.visible = false; scene.add(moveMark);
cv.addEventListener('pointerdown', (ev) => {
  if (!G || G.over) return;
  const p = new THREE.Vector2(ev.clientX / VW * 2 - 1, -(ev.clientY / VH) * 2 + 1); rc.setFromCamera(p, camera);
  const hit = new THREE.Vector3(); if (!rc.ray.intersectPlane(ground, hit)) return;
  const [q, r] = C.worldToAx(hit.x, hit.z), s = slots.get(C.key(q, r));
  if (s && Math.hypot(hit.x - s.x, hit.z - s.z) < 1.05) { selSlot = s; renderMenu(); return; }
  if (selSlot) { closeMenu(); return; }
  // 맵 안쪽이면 영웅 이동
  const t = MAP.tiles.find((u) => u.q === q && u.r === r);
  if (!t || !t.inside || !hero || !hero.alive) return;
  hero.target = new THREE.Vector3(hit.x, 0, hit.z); moveMark.position.set(hit.x, .07, hit.z); moveMark.visible = true; moveMark.userData.t = .6;
});
function renderMenu() {
  const s = selSlot, m = $('menu'); if (!s) return;
  const [x, y] = proj(new THREE.Vector3(s.x, 0, s.z), 1.2);
  m.hidden = false; m.style.left = Math.max(110, Math.min(VW - 110, x)) + 'px'; m.style.top = Math.max(90, Math.min(VH - 230, y)) + 'px';
  let html = '';
  if (!s.tower) {
    html = Object.entries(C.TOWERS).map(([k, T]) => `<button data-b="${k}" ${G.gold < T.cost[0] ? 'class="no"' : ''}><i class="ti ti-${k}"></i><b>${T.name}</b><small>🪙${T.cost[0]}</small></button>`).join('');
    const T0 = C.TOWERS.archer; rangeRing.scale.setScalar(T0.range[0]);
  } else {
    const tw = s.tower, T = C.TOWERS[tw.type];
    html = `<div class="mt"><b>${T.name} ${'★'.repeat(tw.lv + 1)}</b><small>${T.desc}<br>피해 ${T.dmg[tw.lv]} · 사거리 ${T.range[tw.lv]}</small></div>` +
      (tw.lv < 2 ? `<button data-u="1" ${G.gold < T.cost[tw.lv + 1] ? 'class="no"' : ''}><i class="ti">⬆️</i><b>강화</b><small>🪙${T.cost[tw.lv + 1]}</small></button>` : '<button class="no"><b>최고 단계</b></button>') +
      `<button data-s="1"><i class="ti">💰</i><b>팔기</b><small>+${C.sellValue(tw.type, tw.lv)}</small></button>`;
    rangeRing.scale.setScalar(T.range[tw.lv]);
  }
  if (m.dataset.h !== html) { m.innerHTML = html; m.dataset.h = html; bindMenu(); }
  rangeRing.position.set(s.x, .06, s.z); rangeRing.visible = true;
}
function bindMenu() {
  const m = $('menu');
  m.querySelectorAll('[data-b]').forEach((b) => (b.onpointerdown = (e) => { e.stopPropagation(); const T = C.TOWERS[b.dataset.b]; if (G.gold < T.cost[0]) { toast('골드가 부족해요'); return; } buildTower(selSlot, b.dataset.b); closeMenu(); }));
  m.querySelectorAll('[data-b]').forEach((b) => (b.onpointerenter = () => { rangeRing.scale.setScalar(C.TOWERS[b.dataset.b].range[0]); }));
  m.querySelectorAll('[data-u]').forEach((b) => (b.onpointerdown = (e) => { e.stopPropagation(); const tw = selSlot.tower, T = C.TOWERS[tw.type]; if (G.gold < T.cost[tw.lv + 1]) { toast('골드가 부족해요'); return; } upgradeTower(tw); closeMenu(); }));
  m.querySelectorAll('[data-s]').forEach((b) => (b.onpointerdown = (e) => { e.stopPropagation(); sellTower(selSlot.tower); closeMenu(); }));
}
function closeMenu() { selSlot = null; $('menu').hidden = true; $('menu').dataset.h = ''; rangeRing.visible = false; }
$('nextBtn').onclick = () => startWave();
$('sk0').onclick = () => castSkill(0); $('sk1').onclick = () => castSkill(1);
$('spd').onclick = () => { G.speed = G.speed === 1 ? 2 : 1; $('spd').textContent = G.speed === 1 ? '▶ x1' : '▶▶ x2'; };
$('again').onclick = () => { $('end').hidden = true; showPick(); };

// ---------- 영웅 선택 ----------
let pickId = 'Knight';
function showPick() {
  $('pick').hidden = false; $('hud').hidden = true;
  let best = {}; try { best = JSON.parse(localStorage.getItem(LS) || '{}'); } catch (e) { }
  $('heroes').innerHTML = C.HERO_IDS.map((id) => { const H = C.HEROES[id], b = best[id]; return `<button class="hc ${id === pickId ? 'on' : ''}" data-h="${id}"><img src="assets/heroes/${id}.png" alt=""><b>${H.name}</b><small>${H.role}</small>${b ? `<em>${'★'.repeat(b.stars)}${b.stars ? '' : `W${b.wave}`}</em>` : ''}</button>`; }).join('');
  $('heroes').querySelectorAll('.hc').forEach((b) => (b.onclick = () => { pickId = b.dataset.h; showPick(); }));
  const H = C.HEROES[pickId];
  $('hInfo').innerHTML = `<b>${H.name}</b> · ${H.role}<br>${H.s.map((s) => `<span>${s.name}</span> ${s.d}`).join('<br>')}`;
}
$('go').onclick = () => { $('pick').hidden = true; $('hud').hidden = false; newGame(pickId); };

// ---------- 루프 ----------
let shake = 0, last = performance.now();
function loop(now) {
  let dt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now;
  if (G && !G.over && !(TEST && window.__cd.frozen)) {
    update(dt * G.speed);
    hudT -= dt; if (hudT <= 0) { hudT = .15; updHud(); }
  } else if (mixer) mixer.update(dt);
  afterUpdate(dt, now);
}
function update(sdt) {
  {
    G.t += sdt;
    waveStep(sdt);
    for (const e of enemies) if (!e.dead) enemyStep(e, sdt);
    for (let i = enemies.length - 1; i >= 0; i--) if (enemies[i].dead) enemies.splice(i, 1);
    for (const t of towers) towerStep(t, sdt);
    heroStep(sdt);
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i];
      if (s.enemy) { s.t += sdt; const u = Math.min(1, s.t / s.dur); s.obj.position.lerpVectors(s.from, new THREE.Vector3(hero.pos.x, .7, hero.pos.z), u); if (u >= 1) { dyn.remove(s.obj); hurtHero(s.dmg); shots.splice(i, 1); } continue; }
      if (shotStep(s, sdt)) shots.splice(i, 1);
    }
    if (mixer) mixer.update(sdt);
  }
}
function afterUpdate(dt, now) {
  for (let i = fxs.length - 1; i >= 0; i--) if (fxStep(fxs[i], dt)) fxs.splice(i, 1);
  for (const s of slots.values()) if (s.base.visible) s.base.userData.ring.material.opacity = .45 + .35 * Math.sin(now / 300);
  for (const c of clouds) { c.position.z += c.userData.v * dt; if (c.position.z > 14) c.position.z = -16; }
  for (const t of towers) if (t.obj.userData.pop > 0) { t.obj.userData.pop -= dt; t.obj.position.y = Math.sin(t.obj.userData.pop / .3 * Math.PI) * .25; }
  if (moveMark.visible) { moveMark.userData.t -= dt; moveMark.material.opacity = Math.max(0, moveMark.userData.t / .6); if (moveMark.userData.t <= 0) moveMark.visible = false; }
  if (shake > 0) { shake -= dt; camera.position.x += (Math.random() - .5) * shake * .6; }
  renderer.render(scene, camera);
  if (shake > 0) camera.position.x = 0;
  drawOverlay(dt);
  requestAnimationFrame(loop);
}

(async () => {
  resize();
  try { await document.fonts.load('16px G'); } catch (e) { }
  await loadAll((p) => ($('loadBar').style.width = (p * 100) + '%'));
  buildWorld(); pathInfo();
  $('load').hidden = true; showPick();
  requestAnimationFrame((t) => { last = t; loop(t); });
  if (TEST) window.__cd = { C, get G() { return G; }, get hero() { return hero; }, enemies, towers, slots, frozen: false, update, startWave, buildTower, upgradeTower, castSkill, newGame, camera, scene, makeEnemy };
})();
