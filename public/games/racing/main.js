// 서킷 메이커 — 렌더링 · 화면 · 에디터 · 온라인
import * as THREE from "three";
import { GLTFLoader } from "./vendor/jsm/GLTFLoader.js";
import { T, ROAD_HW, PIECES, DECOS, isRoad, traceTrack, sanitizeMap, encodeMap, decodeMap, cellsOf, levelsOf, footprint, pillarsOf, MAX_LEVEL, LH } from "./track.js?v=3";
import { builtinMaps, BLANK } from "./maps.js?v=3";
import { World, CARS, carById, DIFFS, VMAX } from "./sim.js?v=3";

const MG = window.MGH || null;
const KO = MG ? MG.L("ko", "en") === "ko" : /^ko/i.test(navigator.language || "");
const L = (ko, en) => (KO ? ko : en);
const $ = (id) => document.getElementById(id);
const Q = new URLSearchParams(location.search);
const ONLINE = Q.get("online") === "1";
const TOUCH = matchMedia("(pointer:coarse)").matches;
if (TOUCH) document.body.classList.add("touch");
const SEAT_COLORS = ["#e8453c", "#2f7fe0", "#f0a020", "#e6e0d0", "#3fae5a", "#8e5bd9", "#20c0c8", "#ff70b0"];
const DPR = Math.min(window.devicePixelRatio || 1, TOUCH ? 1.5 : 2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fmt = (t) => {
  if (t == null || !isFinite(t)) return "—";
  const m = Math.floor(t / 60), s = t - m * 60;
  return m + ":" + (s < 10 ? "0" : "") + s.toFixed(2);
};
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
function toast(msg, ms = 2200) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

// ───────────────────────── 에셋 ─────────────────────────
const RK = ["roadRampLongCurvedWall", "roadStraightBridgeMid", "roadCornerBridgeSmall", "roadCornerBridgeLarge", "roadCornerBridgeLarger", "roadStraight", "roadCornerSmall", "roadCornerLarge", "roadCornerLarger", "roadCornerSmallBorder", "roadCornerLargeBorder", "roadCornerLargerBorder", "roadCornerLargeBorderInner", "roadCornerLargerBorderInner", "treeLarge", "treeSmall", "grandStand", "grandStandCovered", "tent", "lightPostLarge", "billboard", "pitsGarage", "pitsOffice", "bannerTowerRed", "bannerTowerGreen", "barrierRed", "barrierWhite", "fenceStraight", "flagCheckers", "overhead", "overheadLights", "radarEquipment", "pylon"];
const TOY = ["item-box", "item-cone", "tree-pine", "tree", "gate-finish"];
const DECO_MODEL = {
  treeLarge: "rk/treeLarge", treeSmall: "rk/treeSmall", pine: "toy/tree-pine", tree: "toy/tree",
  grandStand: "rk/grandStand", grandStandCovered: "rk/grandStandCovered", tent: "rk/tent",
  pitsGarage: "rk/pitsGarage", pitsOffice: "rk/pitsOffice", billboard: "rk/billboard", lightPost: "rk/lightPostLarge",
  bannerRed: "rk/bannerTowerRed", bannerGreen: "rk/bannerTowerGreen", radar: "rk/radarEquipment", fence: "rk/fenceStraight",
  cone: "toy/item-cone", boost: "toy/item-box",
};
const TOY_SCALE = 4.6; // 토이 키트 1단위 ≈ 4.6m (차 길이 기준)
const CAR_LEN = 3.7;
const ROAD_Y = 0.12;
const MODELS = {};
const loader = new GLTFLoader();

async function loadAssets(onProgress) {
  const list = [
    ...RK.map((n) => ["rk/" + n, "assets/rk/" + n + ".glb"]),
    ...TOY.map((n) => ["toy/" + n, "assets/toy/" + n + ".glb"]),
    ...CARS.map((c) => [c.kit + "/" + c.file, "assets/" + c.kit + "/" + c.file + ".glb"]),
  ];
  let done = 0;
  await Promise.all(list.map(async ([key, url]) => {
    const g = await loader.loadAsync(url);
    g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    g.scene.updateMatrixWorld(true);
    MODELS[key] = { scene: g.scene, box: new THREE.Box3().setFromObject(g.scene) };
    done++;
    onProgress(done / list.length);
  }));
}

const THEMES = {
  grass: { ground: 0x79b85a, sky: 0x9fd4f5, fog: 0xbfe2f7, edge: 0x82c062, label: "🌿" },
  sand: { ground: 0xdcbc82, sky: 0xf4d9a8, fog: 0xf3dfb8, edge: 0xd2ad6e, label: "🏜" },
  snow: { ground: 0xeef3f8, sky: 0xc9dcec, fog: 0xdde8f2, edge: 0xe2eaf2, label: "❄" },
};
const themeMats = {};
function themeEdgeMat(theme) {
  const th = THEMES[theme];
  if (!th.edge) return null;
  if (!themeMats[theme]) themeMats[theme] = new THREE.MeshStandardMaterial({ color: th.edge, roughness: 1 });
  return themeMats[theme];
}

/** 모델 복제. opts.grass: 'grass' 재질을 테마 색으로 교체, opts.ghost: 반투명 */
function cloneModel(key, opts = {}) {
  const m = MODELS[key];
  const o = m.scene.clone(true);
  if (opts.flat) o.traverse((c) => { if (c.isMesh) c.castShadow = false; });
  if (opts.grass || opts.ghost) {
    o.traverse((c) => {
      if (!c.isMesh) return;
      const mats = Array.isArray(c.material) ? c.material : [c.material];
      const out = mats.map((mt) => {
        let r = mt;
        if (opts.grass && mt.name === "grass") r = opts.grass;
        if (opts.ghost) { r = r.clone(); r.transparent = true; r.opacity = 0.55; r.depthWrite = false; }
        return r;
      });
      c.material = Array.isArray(c.material) ? out : out[0];
      if (opts.ghost) c.castShadow = false;
    });
  }
  return o;
}

/** 도로 조각 모델: bbox 최대 모서리를 발자국 (k,k)에 맞추고 발자국 중심으로 회전 */
/**
 * 도로 조각 모델: bbox 최대 모서리를 발자국 (W,L)에 맞추고 발자국 중심으로 회전.
 * top: 이 높이(칸 단위)에 모델 윗면을 맞춘다 (높은 층). 없으면 바닥을 땅에 둔다.
 */
function placeRoadModel(key, x, y, W, L, r, opts, top) {
  const m = MODELS[key];
  const inner = cloneModel(key, opts);
  const iy = top !== undefined ? top - m.box.max.y : -m.box.min.y - 0.01;
  inner.position.set(W / 2 - m.box.max.x, iy, L / 2 - m.box.max.z);
  const piv = new THREE.Group();
  piv.add(inner);
  piv.rotation.y = -r * Math.PI / 2;
  piv.scale.setScalar(T);
  const [fw, fl] = (r & 1) ? [L, W] : [W, L];
  piv.position.set((x + fw / 2) * T, 0, (y + fl / 2) * T);
  return piv;
}

let checkerTex = null;
function checker() {
  if (checkerTex) return checkerTex;
  const c = document.createElement("canvas");
  c.width = 64; c.height = 16;
  const g = c.getContext("2d");
  for (let i = 0; i < 16; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? "#111" : "#fff"; g.fillRect(i * 4, j * 4, 4, 4); }
  checkerTex = new THREE.CanvasTexture(c);
  checkerTex.colorSpace = THREE.SRGBColorSpace;
  checkerTex.magFilter = THREE.NearestFilter;
  return checkerTex;
}
let roadColor = null;
function roadMat() {
  if (!roadColor) {
    MODELS["rk/roadStraight"].scene.traverse((o) => { if (o.isMesh && o.material.name === "road") roadColor = o.material; });
  }
  return roadColor;
}

/** 배치 하나(도로/장식)의 3D 오브젝트 */
function makeTileObj(p, theme, ghost) {
  const grass = ghost ? null : themeEdgeMat(theme);
  const h = p.h | 0;
  const opts = { grass, ghost, flat: h === 0 };
  if (isRoad(p.t)) {
    const { w: W, l: Lw } = PIECES[p.t];
    const k = W;
    const top = h > 0 ? 0.01 + h * 0.5 : undefined; // 높은 층 윗면 (칸 단위)
    const g = new THREE.Group();
    if (p.t === "straight" || p.t === "start") g.add(placeRoadModel(h ? "rk/roadStraightBridgeMid" : "rk/roadStraight", p.x, p.y, 1, 1, p.r, opts, top));
    if (p.t === "ramp") {
      const o = placeRoadModel("rk/roadRampLongCurvedWall", p.x, p.y, 1, 2, p.r, opts);
      o.position.y = h * LH;
      g.add(o);
    }
    if (p.t === "cross") {
      const mat = ghost ? new THREE.MeshBasicMaterial({ color: 0x777777, transparent: true, opacity: 0.55 }) : roadMat();
      if (h) {
        const deck = new THREE.Mesh(new THREE.BoxGeometry(T, 0.13 * T, T), mat);
        deck.position.set((p.x + 0.5) * T, top * T - 0.065 * T, (p.y + 0.5) * T);
        deck.castShadow = deck.receiveShadow = true;
        g.add(deck);
      } else {
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(T, T), mat);
        pl.rotation.x = -Math.PI / 2;
        pl.position.set((p.x + 0.5) * T, ROAD_Y - 0.02, (p.y + 0.5) * T);
        pl.receiveShadow = true;
        g.add(pl);
      }
    }
    if (p.t[0] === "c" && p.t !== "cross") {
      const nm = { c1: "Small", c2: "Large", c3: "Larger" }[p.t];
      if (h) g.add(placeRoadModel("rk/roadCornerBridge" + nm, p.x, p.y, k, k, p.r, opts, top));
      else {
        g.add(placeRoadModel("rk/roadCorner" + nm, p.x, p.y, k, k, p.r, opts));
        g.add(placeRoadModel("rk/roadCorner" + nm + "Border", p.x, p.y, k, k, p.r, opts));
        if (k > 1) g.add(placeRoadModel("rk/roadCorner" + nm + "BorderInner", p.x, p.y, k, k, p.r, opts));
      }
    }
    if (p.t === "start") {
      const piv = new THREE.Group();
      piv.position.set((p.x + 0.5) * T, h * LH, (p.y + 0.5) * T);
      piv.rotation.y = -p.r * Math.PI / 2;
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_HW * 2, 1.6), new THREE.MeshBasicMaterial({ map: checker(), transparent: !!ghost, opacity: ghost ? 0.6 : 1 }));
      strip.rotation.x = -Math.PI / 2;
      strip.position.y = ROAD_Y + 0.02;
      piv.add(strip);
      const oh = cloneModel("rk/overheadLights", opts);
      const b = MODELS["rk/overheadLights"].box;
      oh.position.set(-(b.min.x + b.max.x) / 2 * T, 0, -(b.min.z + b.max.z) / 2 * T);
      oh.scale.setScalar(T);
      piv.add(oh);
      g.add(piv);
    }
    g.userData.tile = p;
    return g;
  }
  const key = DECO_MODEL[p.t];
  if (!key) return null;
  const m = MODELS[key];
  const o = cloneModel(key, { ghost });
  const toy = key.startsWith("toy/");
  let s = toy ? TOY_SCALE : T;
  if (p.t === "pine" || p.t === "tree") s = TOY_SCALE * 2.1;
  if (p.t === "boost") s = TOY_SCALE * 0.95;
  o.position.set(-(m.box.min.x + m.box.max.x) / 2, -m.box.min.y, -(m.box.min.z + m.box.max.z) / 2);
  const piv = new THREE.Group();
  const inner = new THREE.Group();
  inner.add(o);
  inner.scale.setScalar(s);
  piv.add(inner);
  piv.rotation.y = -p.r * Math.PI / 2;
  piv.position.set((p.x + 0.5) * T, p.t === "boost" ? 0.8 : 0, (p.y + 0.5) * T);
  piv.userData.tile = p;
  if (p.t === "boost") piv.userData.boost = true;
  return piv;
}

function makeFence(map) {
  const g = new THREE.Group();
  const m = MODELS["rk/fenceStraight"];
  const cx = (m.box.min.x + m.box.max.x) / 2, cz = (m.box.min.z + m.box.max.z) / 2;
  const add = (x, z, rot) => {
    const o = cloneModel("rk/fenceStraight");
    o.position.set(-cx, -m.box.min.y, -cz);
    const h = new THREE.Group();
    h.add(o);
    h.scale.setScalar(T);
    h.position.set(x, 0, z);
    h.rotation.y = rot;
    g.add(h);
  };
  const W = map.w * T, H = map.h * T;
  for (let i = 0; i < map.w; i++) { add((i + 0.5) * T, 0, 0); add((i + 0.5) * T, H, 0); }
  for (let j = 0; j < map.h; j++) { add(0, (j + 0.5) * T, Math.PI / 2); add(W, (j + 0.5) * T, Math.PI / 2); }
  return g;
}

// ───────────────────────── 3D 장면 ─────────────────────────
const canvas = $("gl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: DPR < 2, powerPreference: "high-performance" });
renderer.setPixelRatio(DPR);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, 1, 0.5, 1200);
const ortho = new THREE.OrthographicCamera(-50, 50, 50, -50, 1, 1000);
const hemi = new THREE.HemisphereLight(0xffffff, 0x6d7a5a, 1.6);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.castShadow = true;
sun.shadow.mapSize.set(TOUCH ? 1024 : 2048, TOUCH ? 1024 : 2048);
const SH = 70;
Object.assign(sun.shadow.camera, { left: -SH, right: SH, top: SH, bottom: -SH, near: 1, far: 400 });
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.05;
scene.add(sun, sun.target);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x79b85a, roughness: 1 });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
let mapRoot = null; // 현재 맵 그룹

function applyTheme(theme) {
  const th = THEMES[theme] || THEMES.grass;
  groundMat.color.setHex(th.ground);
  scene.background = new THREE.Color(th.sky);
  scene.fog = new THREE.Fog(th.fog, 160, 520);
}

function sunFollow(x, z) {
  sun.position.set(x + 60, 120, z + 40);
  sun.target.position.set(x, 0, z);
}

function buildMap(map, withFence = true) {
  if (mapRoot) { scene.remove(mapRoot); disposeTree(mapRoot); }
  mapRoot = new THREE.Group();
  applyTheme(map.theme);
  const W = map.w * T, H = map.h * T;
  ground.scale.set(W + 600, H + 600, 1);
  ground.position.set(W / 2, -0.15, H / 2); // 도로 조각의 아스팔트 면이 y≈0 이라 땅은 조금 아래
  const objs = new Map();
  for (const p of map.tiles) {
    const o = makeTileObj(p, map.theme);
    if (o) { mapRoot.add(o); objs.set(p, o); }
  }
  if (withFence) mapRoot.add(makeFence(map));
  mapRoot.add(makePillars(map));
  scene.add(mapRoot);
  return objs;
}

let pillarMat = null;
function makePillars(map) {
  const g = new THREE.Group();
  g.userData.pillars = true;
  if (!pillarMat) {
    MODELS["rk/roadStraightBridgeMid"].scene.traverse((o) => { if (o.isMesh && !pillarMat && /grey|white/i.test(o.material.name)) pillarMat = o.material; });
    pillarMat = pillarMat || new THREE.MeshStandardMaterial({ color: 0xd8d4cc });
  }
  for (const q of pillarsOf(map)) {
    const hgt = q.top - 1.3;
    if (hgt < 0.5) continue;
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.6, hgt, 1.6), pillarMat);
    m.position.set(q.x, hgt / 2, q.z);
    m.castShadow = m.receiveShadow = true;
    g.add(m);
  }
  return g;
}
function disposeTree(o) {
  o.traverse((c) => { if (c.isMesh && c.geometry && c.geometry.type === "PlaneGeometry") c.geometry.dispose(); });
}

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  if (ED.on) edFitCam(false);
}
addEventListener("resize", resize);

// ───────────────────────── 차 모델 ─────────────────────────
function makeCar(def, color, name) {
  const key = def.kit + "/" + def.file;
  const m = MODELS[key];
  const o = cloneModel(key);
  const len = m.box.max.z - m.box.min.z, hgt = m.box.max.y - m.box.min.y, wid = m.box.max.x - m.box.min.x;
  // 길이 기준으로 맞추되 키 큰 차(카트·몬스터 트럭)는 높이·폭으로 제한
  const s = Math.min(CAR_LEN / len, 2.0 / hgt, 1.9 / wid);
  o.position.set(-(m.box.min.x + m.box.max.x) / 2, -m.box.min.y, -(m.box.min.z + m.box.max.z) / 2);
  const mid = new THREE.Group();
  mid.add(o);
  mid.scale.setScalar(s);
  if (def.kit === "toy") mid.rotation.y = Math.PI; // 토이 키트 차는 −z 가 앞
  const root = new THREE.Group();
  root.add(mid);
  const wheels = [];
  o.traverse((c) => {
    const n = (c.name || "").toLowerCase();
    if (n.startsWith("wheel")) wheels.push({ o: c, front: /front|-f[lr]$/.test(n) });
  });
  root.userData.wheels = wheels;
  if (name) {
    const tag = nameTag(name, color);
    tag.position.y = 3.2;
    root.add(tag);
    root.userData.tag = tag;
  }
  // 바닥 색 표시(자리 색)
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.9, 2.3, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  root.add(ring);
  return root;
}
function nameTag(text, color) {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 64;
  const g = c.getContext("2d");
  g.font = "bold 30px system-ui, sans-serif";
  const w = Math.min(240, g.measureText(text).width + 30);
  g.fillStyle = "rgba(18,22,34,.78)";
  g.beginPath(); g.roundRect((256 - w) / 2, 8, w, 46, 14); g.fill();
  g.fillStyle = color;
  g.fillRect((256 - w) / 2 + 10, 24, 10, 14);
  g.fillStyle = "#fff";
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(text, 128 + 8, 32, w - 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  sp.scale.set(3.4, 0.85, 1);
  sp.renderOrder = 5;
  return sp;
}

// 썸네일 (차·장식·도로 조각) — 작은 별도 렌더러
const thumbs = {};
function makeThumbs() {
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setSize(160, 110);
  const sc = new THREE.Scene();
  sc.add(new THREE.HemisphereLight(0xffffff, 0x556070, 2));
  const dl = new THREE.DirectionalLight(0xffffff, 2); dl.position.set(3, 6, 4); sc.add(dl);
  const cam = new THREE.PerspectiveCamera(30, 160 / 110, 0.1, 500);
  const shoot = (obj, top) => {
    sc.add(obj);
    const b = new THREE.Box3().setFromObject(obj);
    const c = b.getCenter(new THREE.Vector3());
    const sz = b.getSize(new THREE.Vector3());
    const R = Math.max(sz.x, sz.z, sz.y * 1.2) * (top ? 1.55 : 1.45);
    if (top) { cam.position.set(c.x + 0.001, c.y + R * 1.6, c.z + R * 0.35); }
    else cam.position.set(c.x + R * 0.95, c.y + R * 0.75, c.z + R * 1.05);
    cam.lookAt(c);
    r.render(sc, cam);
    sc.remove(obj);
    return r.domElement.toDataURL();
  };
  for (const c of CARS) { const o = makeCar(c, "#fff"); o.remove(o.children[o.children.length - 1]); o.rotation.y = Math.PI / 2 + 0.5; thumbs["car:" + c.id] = shoot(o); }
  for (const t of Object.keys(PIECES)) thumbs["p:" + t] = shoot(makeTileObj({ t, x: 0, y: 0, r: t === "ramp" ? 1 : 0 }, "grass"), t !== "ramp");
  for (const t of Object.keys(DECOS)) thumbs["p:" + t] = shoot(makeTileObj({ t, x: 0, y: 0, r: 0 }, "grass"));
  r.dispose();
}

// ───────────────────────── 맵 저장소 ─────────────────────────
const BUILTIN = builtinMaps().map((m) => ({ ...m, name: m.name[KO ? "ko" : "en"], builtin: true }));
const MAPS_KEY = "cm.maps.v1";
let myMaps = lsGet(MAPS_KEY, { maps: [] }).maps || [];
let cloudAt = null, cloudUser = null;
function saveLocal() { lsSet(MAPS_KEY, { maps: myMaps }); }
function mergeMaps(a, b) {
  const by = new Map();
  for (const m of [...a, ...b]) { const p = by.get(m.id); if (!p || (m.at || 0) > (p.at || 0)) by.set(m.id, m); }
  return [...by.values()].filter((m) => !m.del).sort((x, y) => (y.at || 0) - (x.at || 0));
}
async function cloudSync() {
  if (!MG || !MG.save || !cloudUser) return;
  try {
    const res = await MG.save.store({ maps: myMaps.slice(0, 60) }, cloudAt || undefined);
    if (res && res.conflict) {
      myMaps = mergeMaps(myMaps, (res.data && res.data.maps) || []);
      cloudAt = res.updatedAt;
      saveLocal();
      const r2 = await MG.save.store({ maps: myMaps.slice(0, 60) }, cloudAt);
      if (r2 && r2.updatedAt) cloudAt = r2.updatedAt;
    } else if (res && res.updatedAt) cloudAt = res.updatedAt;
  } catch (e) { /* 오프라인 등 — 브라우저 저장은 됨 */ }
}
if (MG && MG.save && !ONLINE) {
  MG.save.onAuth(async (user) => {
    cloudUser = user || null;
    if (!user) return;
    try {
      const res = await MG.save.load();
      if (res) { cloudAt = res.updatedAt; myMaps = mergeMaps(myMaps, (res.data && res.data.maps) || []); saveLocal(); }
      await cloudSync();
      if (!$("scSetup").hidden) renderMapList();
    } catch {}
  });
}
function upsertMyMap(map) {
  const id = map.id && !map.builtin ? map.id : "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const clean = sanitizeMap(map);
  const entry = { id, at: Date.now(), map: clean, valid: traceTrack(clean).ok };
  myMaps = [entry, ...myMaps.filter((m) => m.id !== id)];
  saveLocal();
  cloudSync();
  return id;
}
function allMaps() {
  return [...BUILTIN.map((m) => ({ id: m.id, map: m, builtin: true, valid: true })), ...myMaps.map((e) => ({ id: e.id, map: { ...e.map, id: e.id }, valid: e.valid }))];
}

// 2D 미리보기 (맵 카드 · 미니맵)
function drawMapPreview(cv, map, track) {
  const g = cv.getContext("2d");
  const W = cv.width, H = cv.height;
  g.clearRect(0, 0, W, H);
  const th = THEMES[map.theme] || THEMES.grass;
  const s = Math.min(W / map.w, H / map.h) * 0.94;
  const ox = (W - map.w * s) / 2, oy = (H - map.h * s) / 2;
  g.fillStyle = "#" + th.ground.toString(16).padStart(6, "0");
  g.fillRect(ox, oy, map.w * s, map.h * s);
  for (const p of map.tiles) {
    if (isRoad(p.t)) continue;
    g.fillStyle = p.t === "boost" ? "#ffcc33" : /tree|pine/i.test(p.t) ? "#2f7a3a" : "#c95a4a";
    const r = p.t === "boost" ? 0.22 : 0.3;
    g.fillRect(ox + (p.x + 0.5 - r) * s, oy + (p.y + 0.5 - r) * s, r * 2 * s, r * 2 * s);
  }
  const tr = track || traceTrack(map);
  if (tr.ok) {
    g.strokeStyle = "#555b66";
    g.lineWidth = Math.max(2, s * 0.8);
    g.lineJoin = "round";
    g.beginPath();
    tr.pts.forEach((p, i) => { const x = ox + (p.x / T) * s, y = oy + (p.z / T) * s; i ? g.lineTo(x, y) : g.moveTo(x, y); });
    g.closePath();
    g.stroke();
    // 다리(높은 곳)는 위에 한 번 더 — 아래 길과 겹치는 곳이 보이게
    const hiSeg = (lw, col) => {
      g.strokeStyle = col; g.lineWidth = lw; g.lineCap = "butt";
      let on = false;
      g.beginPath();
      tr.pts.forEach((p) => {
        const x = ox + (p.x / T) * s, y = oy + (p.z / T) * s;
        if ((p.y || 0) > 1) { on ? g.lineTo(x, y) : g.moveTo(x, y); on = true; } else on = false;
      });
      g.stroke();
    };
    if (tr.pts.some((p) => (p.y || 0) > 1)) { hiSeg(Math.max(4, s * 1.15), "#20242c"); hiSeg(Math.max(2, s * 0.8), "#8a909c"); }
    const st = tr.start;
    g.fillStyle = "#fff";
    g.beginPath(); g.arc(ox + (st.x / T) * s, oy + (st.z / T) * s, Math.max(2.5, s * 0.3), 0, 7); g.fill();
  } else {
    for (const p of map.tiles) if (isRoad(p.t)) for (const [cx, cy] of cellsOf(p)) { g.fillStyle = "#666b75"; g.fillRect(ox + cx * s + 1, oy + cy * s + 1, s - 2, s - 2); }
  }
  return { s, ox, oy };
}

// ───────────────────────── 화면 전환 ─────────────────────────
const SCREENS = ["scMenu", "scSetup", "scPause", "scResult", "scCode"];
function show(id) {
  for (const s of SCREENS) $(s).hidden = s !== id;
}

function staticText() {
  $("menuSub").textContent = L("트랙을 만들고, 친구·AI와 달려요", "Build a track. Race friends or AI.");
  $("mRace").textContent = "🏁 " + L("레이스", "Race");
  $("mEdit").textContent = "🛠 " + L("맵 에디터", "Track Editor");
  $("mOnline").textContent = "🌐 " + L("친구와 온라인 대전", "Race friends online");
  $("setBack").textContent = L("← 뒤로", "← Back");
  $("lbMap").textContent = L("맵", "TRACK");
  $("lbLaps").textContent = L("랩 수", "LAPS");
  $("lbRacers").textContent = L("인원 (나 + AI)", "RACERS (you + AI)");
  $("lbDiff").textContent = L("AI 난이도", "AI LEVEL");
  $("lbCar").textContent = L("내 차", "YOUR CAR");
  $("pTitle").textContent = L("일시정지", "Paused");
  $("pResume").textContent = L("계속하기", "Resume");
  $("pRestart").textContent = L("다시 시작", "Restart");
  $("rMenu").textContent = L("메뉴", "Menu");
  $("rAgain").textContent = L("다시 달리기", "Race again");
  $("rShare").textContent = L("친구에게 공유하기", "Share with friends");
  $("cClose").textContent = L("닫기", "Close");
  $("cCopy").textContent = L("복사", "Copy");
  $("cLoad").textContent = L("이 코드 불러오기", "Load this code");
  $("eNew").lastChild.textContent = " " + L("새 맵", "New");
  $("eCode").lastChild.textContent = " " + L("공유 코드", "Share code");
  $("eSave").lastChild.textContent = " " + L("저장", "Save");
  $("eTest").lastChild.textContent = " " + L("시험 주행", "Test drive");
  $("eNew").title = L("새 맵", "New"); $("eCode").title = L("공유 코드", "Share code"); $("eSave").title = L("저장", "Save"); $("eTest").title = L("시험 주행", "Test drive");
  $("eName").placeholder = L("맵 이름", "Track name");
  $("eLvL").textContent = L("높이", "LEVEL");
  $("eUp").title = L("한 층 위 편집 (PageUp)", "Edit level above (PageUp)");
  $("eDn").title = L("한 층 아래 편집 (PageDown)", "Edit level below (PageDown)");
  $("hHint").textContent = L("←→ 조향 · ↑ 가속 · ↓ 브레이크/후진 · R 코스 복귀 · Esc 일시정지", "←→ steer · ↑ gas · ↓ brake · R reset · Esc pause");
  if (!MG) $("mOnline").hidden = true;
}

// ───────────────────────── 레이스 설정 ─────────────────────────
const prefs = lsGet("cm.prefs", { laps: 3, racers: 6, diff: "normal", car: "race", map: "oval" });
const SET = { mapId: prefs.map, laps: prefs.laps, racers: prefs.racers, diff: prefs.diff, car: prefs.car };
function savePrefs() { lsSet("cm.prefs", { laps: SET.laps, racers: SET.racers, diff: SET.diff, car: SET.car, map: SET.mapId }); }

function stepper(el, get, set, min, max) {
  const [m, b, p] = el.children;
  const upd = () => (b.textContent = get());
  m.onclick = () => { set(Math.max(min(), get() - 1)); upd(); };
  p.onclick = () => { set(Math.min(max(), get() + 1)); upd(); };
  upd();
  return upd;
}

function renderMapList() {
  const box = $("mapList");
  box.innerHTML = "";
  const list = allMaps();
  if (!list.some((m) => m.id === SET.mapId && m.valid)) SET.mapId = list[0].id;
  const canEdit = !ONLINE;
  for (const m of list) {
    const b = document.createElement("button");
    b.className = "mapc" + (m.id === SET.mapId ? " on" : "");
    const cv = document.createElement("canvas");
    cv.width = 200; cv.height = 150;
    b.appendChild(cv);
    const nm = document.createElement("b");
    nm.textContent = (m.builtin ? "⭐ " : "") + (m.map.name || L("이름 없음", "Untitled"));
    b.appendChild(nm);
    const sm = document.createElement("small");
    const tr = traceTrack(m.map);
    sm.textContent = tr.ok ? `${(tr.L / 1000).toFixed(2)} km · ${m.map.w}×${m.map.h}` : L("미완성 코스", "Unfinished");
    b.appendChild(sm);
    drawMapPreview(cv, m.map, tr);
    if (!tr.ok) b.style.opacity = 0.55;
    b.onclick = () => {
      if (!tr.ok) { if (canEdit) openEditor(m.map, m.builtin); return; }
      SET.mapId = m.id;
      renderMapList();
      if (ONLINE && NET.role === "host") hostSet({ map: m.map, mapId: m.id });
    };
    if (canEdit) {
      const ed = document.createElement("button");
      ed.className = "x";
      ed.style.right = m.builtin ? "4px" : "32px";
      ed.textContent = "✏";
      ed.title = L("편집", "Edit");
      ed.onclick = (e) => { e.stopPropagation(); openEditor(m.map, m.builtin); };
      b.appendChild(ed);
      if (!m.builtin) {
        const x = document.createElement("button");
        x.className = "x";
        x.textContent = "✕";
        x.onclick = (e) => {
          e.stopPropagation();
          if (!confirm(L(`'${m.map.name}' 맵을 지울까요?`, `Delete '${m.map.name}'?`))) return;
          myMaps = myMaps.filter((q) => q.id !== m.id);
          saveLocal(); cloudSync(); renderMapList();
        };
        b.appendChild(x);
      }
    }
    box.appendChild(b);
  }
  if (!ONLINE) {
    const nb = document.createElement("button");
    nb.className = "mapc";
    nb.style.display = "flex"; nb.style.alignItems = "center"; nb.style.justifyContent = "center"; nb.style.minHeight = "120px"; nb.style.fontWeight = "800";
    nb.textContent = "＋ " + L("새 맵 만들기", "New track");
    nb.onclick = () => openEditor(null);
    box.appendChild(nb);
  }
}

function renderCars(onPick) {
  const box = $("carList");
  box.innerHTML = "";
  for (const c of CARS) {
    const b = document.createElement("button");
    b.className = "carc" + (c.id === SET.car ? " on" : "");
    b.innerHTML = `<img src="${thumbs["car:" + c.id]}" alt=""><b>${c.name[KO ? "ko" : "en"]}</b><div class="bars"><span>${L("속도", "SPD")}</span><span class="bar"><i style="width:${c.s * 20}%"></i></span><span>${L("가속", "ACC")}</span><span class="bar"><i style="width:${c.a * 20}%"></i></span><span>${L("핸들", "HDL")}</span><span class="bar"><i style="width:${c.h * 20}%"></i></span></div>`;
    b.onclick = () => { SET.car = c.id; savePrefs(); renderCars(onPick); onPick && onPick(c.id); };
    box.appendChild(b);
  }
}

function openSetup() {
  stopRace();
  ED.on = false;
  $("ed").hidden = true;
  $("hud").hidden = true;
  $("touch").hidden = true;
  show("scSetup");
  $("setTitle").textContent = L("레이스 설정", "Race setup");
  $("setPlayers").hidden = true;
  $("wRacers").hidden = false;
  $("wDiff").hidden = false;
  $("setBack").hidden = false;
  $("setGo").textContent = "🏁 " + L("출발!", "Start!");
  $("setGo").disabled = false;
  $("setNote").textContent = "";
  stepper($("stLaps"), () => SET.laps, (v) => { SET.laps = v; savePrefs(); }, () => 1, () => 9);
  stepper($("stRacers"), () => SET.racers, (v) => { SET.racers = v; savePrefs(); }, () => 1, () => 8);
  const seg = $("segDiff");
  seg.innerHTML = "";
  for (const [k, ko, en] of [["easy", "쉬움", "Easy"], ["normal", "보통", "Normal"], ["hard", "어려움", "Hard"]]) {
    const b = document.createElement("button");
    b.textContent = L(ko, en);
    b.className = SET.diff === k ? "on" : "";
    b.onclick = () => { SET.diff = k; savePrefs(); [...seg.children].forEach((x) => (x.className = x === b ? "on" : "")); };
    seg.appendChild(b);
  }
  renderMapList();
  renderCars();
  $("setGo").onclick = () => {
    const m = allMaps().find((x) => x.id === SET.mapId);
    if (!m || !m.valid) return;
    savePrefs();
    startSingle({ map: m.map, laps: SET.laps, racers: SET.racers, diff: SET.diff, car: SET.car, mapId: m.id });
  };
  $("setBack").onclick = () => { show("scMenu"); idleCam(); };
  idleCam();
}

// 메뉴 뒤 배경: 첫 맵을 천천히 돌며 보여 준다
let idleT = 0;
function idleCam() {
  MODE = "idle";
  const m = allMaps().find((x) => x.id === SET.mapId) || allMaps()[0];
  if (!mapRoot || mapRoot.userData.id !== m.id) {
    buildMap(m.map);
    mapRoot.userData.id = m.id;
    mapRoot.userData.map = m.map;
  }
}

// ───────────────────────── 레이스 ─────────────────────────
let MODE = "idle"; // idle | race | editor
let R = null; // 현재 레이스
const keys = {};
const touchIn = { l: 0, r: 0, g: 0, b: 0 };

function makeRace(cfg) {
  const map = sanitizeMap(cfg.map);
  const track = traceTrack(map);
  if (!track.ok) { toast(L("코스가 완성되지 않았어요", "Track is not a closed loop")); return null; }
  const world = new World(map, track, cfg.laps);
  buildMap(map);
  mapRoot.userData.id = cfg.mapId || "race";
  const race = {
    cfg, map, track, world, phase: "intro", t: 0, cd: 3.4, mySeat: cfg.mySeat ?? 0, meshes: new Map(), boostObjs: [],
    endT: null, finishedShown: false, camPos: new THREE.Vector3(), camLook: new THREE.Vector3(), camInit: false, sendT: 0, results: null,
  };
  mapRoot.traverse((o) => { if (o.userData && o.userData.boost) race.boostObjs.push(o); });
  // 미니맵 배경
  const mini = document.createElement("canvas");
  mini.width = mini.height = 300;
  race.miniGeo = drawMapPreview(mini, map, track);
  race.miniBg = mini;
  return race;
}

function addRaceCar(race, o) {
  const car = race.world.addCar(o);
  car.color = SEAT_COLORS[car.seat % SEAT_COLORS.length];
  const mesh = makeCar(carById(car.car), car.color, o.kind === "human" && car.seat === race.mySeat ? null : o.name);
  scene.add(mesh);
  race.meshes.set(car, mesh);
  car.mesh = mesh;
  car.snaps = [];
  return car;
}

function pickAiCars(n, avoid) {
  const pool = CARS.map((c) => c.id).filter((id) => id !== avoid);
  for (let i = pool.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return Array.from({ length: n }, (_, i) => pool[i % pool.length]);
}

function startSingle(cfg) {
  stopRace();
  const race = makeRace({ ...cfg, mySeat: 0 });
  if (!race) return;
  R = race;
  const n = Math.max(1, Math.min(8, cfg.racers));
  const meSlot = Math.min(n - 1, Math.floor(n / 2));
  const ais = pickAiCars(n - 1, cfg.car);
  let ai = 0;
  const slots = [];
  for (let s = 0; s < n; s++) slots.push(s);
  // 좌석 0 = 나. 그리드 순서: AI 를 앞뒤로 섞고 나는 가운데
  const order = [];
  for (let s = 0; s < n; s++) if (s !== meSlot) order.push(s);
  addRaceCar(race, { seat: 0, slot: meSlot, car: cfg.car, kind: "human", name: L("나", "You") });
  const d = DIFFS[cfg.diff] || DIFFS.normal;
  order.forEach((slot, i) => {
    addRaceCar(race, { seat: i + 1, slot, car: ais[ai++], kind: "ai", name: "AI " + (i + 1), ai: { ...d, skill: d.skill * (0.97 + Math.random() * 0.05) }, lane: Math.random() * 2 - 1 });
  });
  beginRace();
}

function beginRace() {
  MODE = "race";
  show(null);
  $("ed").hidden = true;
  ED.on = false;
  $("hud").hidden = false;
  $("touch").hidden = !TOUCH;
  $("hWrong").hidden = true;
  R.phase = "intro";
  R.t = 0;
  audio.start();
  lastFrame = performance.now();
}

function stopRace() {
  if (!R) return;
  for (const m of R.meshes.values()) scene.remove(m);
  R = null;
  audio.stop();
}

function myCar() { return R && R.world.cars.find((c) => c.seat === R.mySeat); }

function readInput() {
  const l = keys.ArrowLeft || keys.KeyA || touchIn.l, r = keys.ArrowRight || keys.KeyD || touchIn.r;
  const g = keys.ArrowUp || keys.KeyW || touchIn.g, b = keys.ArrowDown || keys.KeyS || touchIn.b || keys.Space;
  // 좌표계: 각도가 커지면 오른쪽(+x → +z)으로 돈다
  return { thr: (g ? 1 : 0) - (b ? 1 : 0), steer: (r ? 1 : 0) - (l ? 1 : 0) };
}

function raceTick(dt) {
  const race = R;
  const w = race.world;
  race.t += dt;
  if (race.phase === "intro") {
    race.cd -= dt;
    const n = Math.ceil(race.cd);
    if (n !== race.lastN) {
      race.lastN = n;
      if (n <= 3 && n >= 1) { msg(String(n)); audio.beep(440, 0.15); }
    }
    if (race.cd <= 0) {
      race.phase = "race";
      msg("GO!", 900);
      audio.beep(880, 0.35);
    }
  } else {
    const inputs = {};
    const me = myCar();
    if (me && me.kind === "human" && !me.finished) inputs[me.seat] = readInput();
    // 고정 시간 단계
    race.acc = (race.acc || 0) + Math.min(dt, 0.1);
    const STEP = 1 / 60;
    while (race.acc >= STEP) { w.step(STEP, inputs); race.acc -= STEP; }
    for (const c of w.cars) if (c.kind === "remote") interpRemote(race, c);
    if (me) {
      if (me.lapEvent) {
        me.lapEvent = false;
        if (!me.finished) {
          const left = w.laps - me.lapsDone;
          msg(left === 1 ? L("마지막 랩!", "FINAL LAP!") : `LAP ${me.lapsDone + 1}/${w.laps}`, 1300, true);
          audio.beep(660, 0.12);
        }
      }
      if (me.gotBoost) { me.gotBoost = false; audio.boost(); }
      if (me.bump) { audio.thud(me.bump); me.bump = 0; }
      if (me.finished && !race.finishedShown) {
        race.finishedShown = true;
        const pos = w.ranking().indexOf(me) + 1;
        msg(`FINISH! ${pos}${ord(pos)}`, 3000, true);
        audio.fanfare(pos === 1);
        race.endT = race.t + (ONLINE ? 4 : 5);
      }
      $("hWrong").hidden = !(me.wrongT > 1 && !me.finished);
      $("hWrong").textContent = L("⚠ 역주행 중", "⚠ WRONG WAY");
    }
    if (ONLINE) netRaceTick(dt);
    else if (race.endT !== null && race.t > race.endT && !race.results) finishSingle();
  }
  // 회전하는 부스트 박스
  w.boosts.forEach((b, i) => { const o = race.boostObjs[i]; if (o) { o.rotation.y += dt * 2; o.visible = b.off <= 0; o.position.y = 0.8 + Math.sin(race.t * 3 + i) * 0.25; } });
  updateCarMeshes(race, dt);
  updateCamera(race, dt);
  updateHud(race);
  const me = myCar();
  if (me) audio.engine(me.speed / VMAX, me.thr, me.boostT > 0);
}

function ord(n) { return KO ? L("위", "") : ["th", "st", "nd", "rd"][n % 10 > 3 || ((n / 10) | 0) === 1 ? 0 : n % 10]; }

function updateCarMeshes(race, dt) {
  for (const [car, mesh] of race.meshes) {
    mesh.position.set(car.x, ROAD_Y + (car.y || 0), car.z);
    mesh.rotation.order = "YXZ";
    mesh.rotation.y = Math.PI / 2 - car.a;
    mesh.rotation.x = -(car.pitch || 0);
    const v = car.kind === "remote" ? car.vf || 0 : car.vx * Math.cos(car.a) + car.vz * Math.sin(car.a);
    car.spin = (car.spin || 0) + v * dt * 1.4;
    for (const wh of mesh.userData.wheels) {
      wh.o.rotation.x = car.spin;
      if (wh.front) wh.o.rotation.y = -(car.steer || 0) * 0.45;
    }
    // 부스트 중 살짝 들림, 충돌 흔들림
    mesh.position.y = ROAD_Y + (car.y || 0) + (car.boostT > 0 ? 0.08 : 0);
    if (mesh.userData.tag) mesh.userData.tag.visible = car.seat !== race.mySeat;
  }
}

const tmpV = new THREE.Vector3();
function updateCamera(race, dt) {
  const me = myCar() || race.world.cars[0];
  if (!me) return;
  const fx = Math.cos(me.a), fz = Math.sin(me.a);
  const sp = me.speed || 0;
  const back = 9.5 + sp * 0.06, up = 4.2 + sp * 0.02;
  const cy = me.y || 0;
  race.camY = race.camY === undefined ? cy : race.camY + (cy - race.camY) * Math.min(1, dt * 5);
  const want = tmpV.set(me.x - fx * back, up + race.camY, me.z - fz * back);
  const look = new THREE.Vector3(me.x + fx * 7, 1.2 + cy, me.z + fz * 7);
  if (race.phase === "intro") {
    // 출발 전: 위에서 내려오며 차 뒤로
    const k = Math.max(0, Math.min(1, 1 - (race.cd - 0.6) / 2.8));
    const e = k * k * (3 - 2 * k);
    const hi = new THREE.Vector3(me.x - fx * 30, 34 + cy, me.z - fz * 30 + 8);
    want.lerpVectors(hi, want.clone(), e);
    race.camPos.copy(want);
    race.camLook.copy(look);
    race.camInit = true;
  } else if (me.finished) {
    // 완주 후: 천천히 차 주위를 돈다
    const a = race.t * 0.4;
    want.set(me.x + Math.cos(a) * 14, 6 + cy, me.z + Math.sin(a) * 14);
    race.camPos.lerp(want, 1 - Math.exp(-dt * 2));
    race.camLook.lerp(new THREE.Vector3(me.x, 1 + cy, me.z), 1 - Math.exp(-dt * 4));
  } else {
    const k = 1 - Math.exp(-dt * 6);
    race.camPos.lerp(want, k);
    race.camLook.lerp(look, 1 - Math.exp(-dt * 10));
  }
  camera.position.copy(race.camPos);
  camera.lookAt(race.camLook);
  // 세로 화면은 좌우가 좁아 보이지 않게 시야각을 넓힌다
  const fov = 62 + Math.max(0, 1 - camera.aspect) * 30 + Math.min(1, sp / VMAX) * 6 + (me.boostT > 0 ? 8 : 0);
  camera.fov += (fov - camera.fov) * Math.min(1, dt * 4);
  camera.updateProjectionMatrix();
  sunFollow(me.x, me.z);
}

let msgTimer = 0;
function msg(text, ms = 800, small = false) {
  const el = $("hMsg");
  el.textContent = text;
  el.className = small ? "small" : "";
  el.hidden = false;
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => (el.hidden = true), ms);
}

function updateHud(race) {
  const w = race.world;
  const me = myCar();
  const rank = w.ranking();
  if (me) {
    const pos = rank.indexOf(me) + 1;
    $("hPos").innerHTML = `${pos}<small>${KO ? "위" : ord(pos)} / ${w.cars.length}</small>`;
    $("hLap").textContent = `LAP ${Math.min(w.laps, me.lapsDone + 1)}/${w.laps}`;
    const t = race.phase === "intro" ? 0 : me.finished ? me.finishTime : w.time;
    $("hTime").firstChild.textContent = fmt(t);
    $("hBest").textContent = me.best ? "BEST " + fmt(me.best) : "";
    $("hSpeed").innerHTML = `${Math.round(me.speed * 5)}<small> km/h</small>`;
  }
  const off = (NET.offline || []);
  $("hList").innerHTML = rank.map((c, i) => `<div class="${c === me ? "me" : ""}"><span>${i + 1}</span><i style="background:${c.color}"></i>${esc(c.name)}${c.finished ? " 🏁" : ""}${off.includes(c.seat) ? " 📴" : ""}</div>`).join("");
  // 미니맵
  const cv = $("mini"), g = cv.getContext("2d");
  g.clearRect(0, 0, 300, 300);
  g.globalAlpha = 0.9;
  g.drawImage(race.miniBg, 0, 0);
  g.globalAlpha = 1;
  const { s, ox, oy } = race.miniGeo;
  for (const c of [...w.cars].reverse()) {
    g.fillStyle = c.color;
    g.strokeStyle = c === me ? "#fff" : "#000";
    g.lineWidth = c === me ? 4 : 2;
    g.beginPath();
    g.arc(ox + (c.x / T) * s, oy + (c.z / T) * s, c === me ? 9 : 7, 0, 7);
    g.fill(); g.stroke();
  }
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** 아직 못 들어온 차의 예상 기록 */
function estFinish(w, c) {
  if (c.finished) return c.finishTime;
  const total = w.laps * w.track.L;
  const avg = Math.max(8, c.P / Math.max(1, w.time));
  return w.time + Math.max(0, total - c.P) / avg;
}

function finishSingle() {
  const race = R;
  const w = race.world;
  const rows = w.cars.map((c) => ({ c, t: estFinish(w, c), est: !c.finished })).sort((a, b) => a.t - b.t);
  race.results = rows;
  const me = myCar();
  const pos = rows.findIndex((r) => r.c === me) + 1;
  // 개인 기록
  if (!race.cfg.test) {
    const key = "cm.best." + (race.cfg.mapId || "x") + "." + w.laps;
    const prev = lsGet(key, null);
    if (me.finished && (prev === null || me.finishTime < prev)) { lsSet(key, me.finishTime); race.newBest = true; }
    race.pb = lsGet(key, null);
  }
  showResults(rows.map((r) => ({ name: r.c.name, color: r.c.color, car: r.c.car, t: r.t, est: r.est, best: r.c.best, me: r.c === me })), pos);
}

function showResults(rows, pos) {
  show("scResult");
  $("touch").hidden = true;
  $("rTitle").textContent = (pos === 1 ? "🏆 " : "🏁 ") + L(`${pos}위로 완주!`, `You finished ${pos}${ord(pos)}!`);
  const th = `<tr><th>#</th><th>${L("드라이버", "Driver")}</th><th>${L("차", "Car")}</th><th>${L("기록", "Time")}</th><th>${L("베스트 랩", "Best lap")}</th></tr>`;
  $("rTable").innerHTML = th + rows.map((r, i) => `<tr class="${r.me ? "me" : ""}"><td>${i + 1}</td><td><i style="display:inline-block;width:9px;height:9px;border-radius:3px;background:${r.color};margin-right:6px"></i>${esc(r.name)}</td><td class="muted">${esc(carById(r.car).name[KO ? "ko" : "en"])}</td><td class="n">${r.t == null ? "DNF" : (r.est ? "≈" : "") + fmt(r.t)}</td><td class="n">${fmt(r.best)}</td></tr>`).join("") +
    (R && R.pb != null ? `<tr><td colspan="5" class="muted" style="border:0;padding-top:10px">${R.newBest ? "✨ " + L("새 개인 기록! ", "New personal best! ") : ""}${L("이 맵·랩 수 내 최고 기록", "Your best on this track")}: <b>${fmt(R.pb)}</b></td></tr>` : "");
  const test = R && R.cfg.test;
  $("rAgain").textContent = test ? L("다시 시험 주행", "Test again") : L("다시 달리기", "Race again");
  $("rMenu").textContent = test ? L("에디터로", "Back to editor") : ONLINE ? L("결과 닫기", "Close") : L("메뉴", "Menu");
  $("rAgain").hidden = ONLINE;
  $("rShare").hidden = true;
  $("rMenu").onclick = () => {
    if (ONLINE) { show(null); return; }
    if (test) { const c = R.cfg; stopRace(); openEditor(c.editMap, false, true); return; }
    stopRace(); openSetup();
  };
  $("rAgain").onclick = () => { const c = R.cfg; stopRace(); startSingle(c); };
}

// ───────────────────────── 입력 ─────────────────────────
addEventListener("keydown", (e) => {
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
  keys[e.code] = true;
  if (MODE === "race" && R) {
    if (e.code === "KeyR") resetMe();
    if (e.code === "Escape" || e.code === "KeyP") togglePause();
    if (e.code.startsWith("Arrow") || e.code === "Space") e.preventDefault();
  }
  if (MODE === "editor") edKey(e);
});
addEventListener("keyup", (e) => { keys[e.code] = false; });
addEventListener("blur", () => { for (const k in keys) keys[k] = false; });
function resetMe() {
  const me = myCar();
  if (me && R.phase === "race" && !me.finished && me.kind === "human") R.world.respawn(me);
}
function bindTouch(id, k) {
  const el = $(id);
  const on = (e) => { e.preventDefault(); touchIn[k] = 1; el.classList.add("on"); };
  const off = (e) => { e.preventDefault(); touchIn[k] = 0; el.classList.remove("on"); };
  el.addEventListener("pointerdown", on);
  el.addEventListener("pointerup", off);
  el.addEventListener("pointercancel", off);
  el.addEventListener("pointerleave", off);
}
bindTouch("tL", "l"); bindTouch("tR", "r"); bindTouch("tG", "g"); bindTouch("tB", "b");
$("tReset").onclick = resetMe;
let paused = false;
function togglePause() {
  if (ONLINE) return; // 온라인은 멈출 수 없음
  paused = !paused;
  if (paused) {
    show("scPause");
    $("pQuit").textContent = R && R.cfg.test ? L("에디터로", "Back to editor") : L("메뉴로", "Quit to menu");
  } else { show(null); lastFrame = performance.now(); }
}
$("bPause").onclick = () => (ONLINE ? null : togglePause());
$("pResume").onclick = () => togglePause();
$("pRestart").onclick = () => { paused = false; const c = R.cfg; stopRace(); startSingle(c); };
$("pQuit").onclick = () => {
  paused = false;
  const c = R && R.cfg;
  stopRace();
  if (c && c.test) openEditor(c.editMap, false, true); else openSetup();
};

// ───────────────────────── 소리 ─────────────────────────
const audio = (() => {
  let ctx = null, osc = null, osc2 = null, gain = null, filt = null;
  let muted = lsGet("cm.mute", false);
  const btn = $("bMute");
  const upd = () => (btn.textContent = muted ? "🔇" : "🔊");
  upd();
  btn.onclick = () => { muted = !muted; lsSet("cm.mute", muted); upd(); if (gain) gain.gain.value = 0; };
  function ensure() {
    if (ctx) return ctx;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
    return ctx;
  }
  function tone(f, d, type = "square", vol = 0.12, slide) {
    if (muted || !ensure()) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f;
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, ctx.currentTime + d);
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + d);
    o.connect(g).connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + d + 0.02);
  }
  return {
    start() {
      if (!ensure()) return;
      if (ctx.state === "suspended") ctx.resume();
      if (osc) return;
      osc = ctx.createOscillator(); osc2 = ctx.createOscillator();
      osc.type = "sawtooth"; osc2.type = "square";
      filt = ctx.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.value = 700;
      gain = ctx.createGain(); gain.gain.value = 0;
      osc.connect(filt); osc2.connect(filt); filt.connect(gain).connect(ctx.destination);
      osc.start(); osc2.start();
    },
    stop() { if (osc) { try { osc.stop(); osc2.stop(); } catch {} osc = osc2 = null; } },
    engine(k, thr, boost) {
      if (!osc) return;
      const f = 48 + k * 150 + (boost ? 30 : 0);
      osc.frequency.setTargetAtTime(f, ctx.currentTime, 0.05);
      osc2.frequency.setTargetAtTime(f * 0.5, ctx.currentTime, 0.05);
      gain.gain.setTargetAtTime(muted ? 0 : 0.035 + (thr > 0 ? 0.03 : 0) + k * 0.02, ctx.currentTime, 0.1);
    },
    beep(f, d) { tone(f, d, "square", 0.1); },
    boost() { tone(300, 0.5, "sawtooth", 0.08, 900); },
    thud(k) { tone(90, 0.15, "triangle", 0.12 * Math.min(1, k + 0.3)); },
    fanfare(win) { [523, 659, 784, win ? 1046 : 659].forEach((f, i) => setTimeout(() => tone(f, 0.22, "square", 0.08), i * 150)); },
    unlock() { if (ensure() && ctx.state === "suspended") ctx.resume(); },
  };
})();
addEventListener("pointerdown", () => audio.unlock(), { once: true });

// ───────────────────────── 에디터 ─────────────────────────
const ED = { on: false, map: null, brush: "straight", rot: 0, erase: false, pan: false, objs: new Map(), hist: [], ghost: null, ghostKey: "", hover: null, dirty: false, zoom: 60, cx: 0, cz: 0, errBox: null, tab: "road", srcId: null, lv: 0 };
const PAL = {
  road: ["straight", "start", "c1", "c2", "c3", "cross", "ramp"],
  deco: ["boost", "treeLarge", "treeSmall", "pine", "tree", "grandStand", "grandStandCovered", "tent", "pitsGarage", "pitsOffice", "billboard", "lightPost", "bannerRed", "bannerGreen", "radar", "fence", "cone"],
};
const PNAME = {
  straight: ["직선", "Straight"], start: ["출발선", "Start"], c1: ["코너 S", "Corner S"], c2: ["코너 M", "Corner M"], c3: ["코너 L", "Corner L"], cross: ["교차로", "Crossing"], ramp: ["오르막", "Ramp"],
  boost: ["부스트", "Boost"], treeLarge: ["큰 나무", "Tree"], treeSmall: ["작은 나무", "Small tree"], pine: ["소나무", "Pine"], tree: ["둥근 나무", "Round tree"],
  grandStand: ["관중석", "Stand"], grandStandCovered: ["지붕 관중석", "Covered stand"], tent: ["텐트", "Tent"], pitsGarage: ["피트 차고", "Garage"], pitsOffice: ["피트 건물", "Pit office"],
  billboard: ["광고판", "Billboard"], lightPost: ["조명탑", "Lights"], bannerRed: ["빨간 배너", "Red banner"], bannerGreen: ["초록 배너", "Green banner"], radar: ["레이더", "Radar"], fence: ["펜스", "Fence"], cone: ["콘", "Cone"],
};
const ERRS = {
  noStart: ["출발선을 하나 놓아 주세요", "Place a start line"],
  multiStart: ["출발선은 하나만 놓을 수 있어요", "Only one start line allowed"],
  open: ["코스가 끊겨 있어요 (빨간 칸)", "Track is open here (red)"],
  mismatch: ["도로 방향이 맞지 않아요 (빨간 칸)", "Pieces don't connect (red)"],
  reverse: ["출발선 방향과 반대로 돌아와요 — 출발선을 돌려 보세요", "Loop returns backwards — rotate the start line"],
  broken: ["연결이 맞지 않아요", "Broken connection"],
  loop: ["출발선으로 돌아오지 않는 고리가 있어요", "Loop doesn't return to the start"],
  overlap: ["조각이 겹쳐 있어요", "Pieces overlap"],
  outside: ["맵 밖으로 나간 조각이 있어요", "A piece is outside the map"],
  level: ["높이가 맞지 않아요 (빨간 칸) — 오르막으로 이어 주세요", "Heights don't match (red) — connect them with a ramp"],
  tooHigh: ["2층보다 높이 쌓을 수 없어요", "Can't build higher than level 2"],
};

function openEditor(map, fromBuiltin, keepState) {
  stopRace();
  MODE = "editor";
  ED.on = true;
  show(null);
  $("hud").hidden = true;
  $("touch").hidden = true;
  $("ed").hidden = false;
  if (!keepState || !ED.map) {
    if (map) {
      ED.map = JSON.parse(JSON.stringify(sanitizeMap(map)));
      ED.srcId = fromBuiltin ? null : map.id || null;
      if (fromBuiltin) ED.map.name = (map.name || "") + L(" 복사본", " copy");
    } else {
      const d = lsGet("cm.draft", null);
      ED.map = d && d.map ? sanitizeMap(d.map) : { ...BLANK(), name: "" };
      ED.srcId = d ? d.srcId || null : null;
    }
    ED.hist = [];
    ED.dirty = false;
    ED.lv = 0;
  }
  $("eName").value = ED.map.name || "";
  edPalette();
  edToolsUI();
  edRebuild();
  edFitCam(true);
  edValidate();
}

function edRebuild() {
  ED.objs = buildMap(ED.map, true);
  mapRoot.userData.id = "editor";
  for (const [p, o] of ED.objs) edFade(p, o);
  edLevelUI();
  // 격자
  const m = ED.map;
  const pts = [];
  for (let i = 0; i <= m.w; i++) pts.push(i * T, 0.3, 0, i * T, 0.3, m.h * T);
  for (let j = 0; j <= m.h; j++) pts.push(0, 0.3, j * T, m.w * T, 0.3, j * T);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  const grid = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 }));
  mapRoot.add(grid);
  ED.errBox = new THREE.Mesh(new THREE.BoxGeometry(T, 1, T), new THREE.MeshBasicMaterial({ color: 0xff3344, transparent: true, opacity: 0.45, depthWrite: false }));
  ED.errBox.visible = false;
  mapRoot.add(ED.errBox);
  ED.ghostKey = "";
  edGhost();
  $("eW").children[1].textContent = m.w;
  $("eH").children[1].textContent = m.h;
  const seg = $("eTheme");
  seg.innerHTML = "";
  for (const k of Object.keys(THEMES)) {
    const b = document.createElement("button");
    b.textContent = THEMES[k].label;
    b.className = m.theme === k ? "on" : "";
    b.onclick = () => { if (m.theme === k) return; edPush(); m.theme = k; edRebuild(); edChanged(); };
    seg.appendChild(b);
  }
}

function edFitCam(reset) {
  const tb = ($("edTop").offsetHeight || 56) + 6;
  $("edStatus").style.top = tb + "px";
  $("edSide").style.top = tb + 40 + "px";
  const m = ED.map;
  const W = m.w * T, H = m.h * T;
  const vw = innerWidth, vh = innerHeight;
  const topPx = $("edTop").offsetHeight || 56, botPx = $("edPal").offsetHeight || 110;
  const usable = Math.max(100, vh - topPx - botPx - 20);
  if (reset) {
    // 화면에 맵 전체가 들어오게
    ED.zoom = Math.max(W / vw * vh, H / usable * vh) * 0.54;
    ED.cx = W / 2;
    ED.cz = H / 2 + ((botPx - topPx) / 2 / vh) * ED.zoom * 2;
  }
  const a = vw / vh;
  ortho.left = -ED.zoom * a; ortho.right = ED.zoom * a; ortho.top = ED.zoom; ortho.bottom = -ED.zoom;
  ortho.position.set(ED.cx, 300, ED.cz);
  ortho.up.set(0, 0, -1);
  ortho.lookAt(ED.cx, 0, ED.cz);
  ortho.updateProjectionMatrix();
  sunFollow(ED.cx, ED.cz);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -Math.max(SH, ED.zoom * a * 1.2);
  sun.shadow.camera.right = sun.shadow.camera.top = Math.max(SH, ED.zoom * a * 1.2);
  sun.shadow.camera.updateProjectionMatrix();
}

function edPalette() {
  const tabs = $("edTabs");
  tabs.innerHTML = "";
  for (const [k, ko, en] of [["road", "도로", "Road"], ["deco", "장식", "Decor"]]) {
    const b = document.createElement("button");
    b.textContent = L(ko, en);
    b.className = ED.tab === k ? "on" : "";
    b.onclick = () => { ED.tab = k; edPalette(); };
    tabs.appendChild(b);
  }
  const box = $("edItems");
  box.innerHTML = "";
  for (const t of PAL[ED.tab]) {
    const b = document.createElement("button");
    b.className = "pi" + (ED.brush === t && !ED.erase && !ED.pan ? " on" : "");
    b.innerHTML = `<img src="${thumbs["p:" + t]}" alt=""><span>${PNAME[t][KO ? 0 : 1]}</span>`;
    b.onclick = () => { ED.brush = t; ED.erase = false; ED.pan = false; edPalette(); edToolsUI(); edGhost(); };
    box.appendChild(b);
  }
}
function edToolsUI() {
  $("eErase").className = ED.erase ? "on" : "";
  $("ePan").className = ED.pan ? "on" : "";
}

function brushLevel(t) {
  if (!isRoad(t)) return 0;
  return t === "ramp" ? Math.min(ED.lv, MAX_LEVEL - 1) : ED.lv;
}
function edGhost() {
  const key = ED.erase || ED.pan ? "" : ED.brush + ":" + ED.rot + ":" + brushLevel(ED.brush);
  if (key !== ED.ghostKey) {
    if (ED.ghost) mapRoot.remove(ED.ghost);
    ED.ghost = key ? makeTileObj({ t: ED.brush, x: 0, y: 0, r: ED.rot, h: brushLevel(ED.brush) }, ED.map.theme, true) : null;
    if (ED.ghost) { ED.ghost.userData.base = ED.ghost.position.clone(); mapRoot.add(ED.ghost); }
    ED.ghostKey = key;
  }
  if (!ED.ghost) return;
  const h = ED.hover;
  ED.ghost.visible = !!h;
  if (h) {
    // 만들 때 (0,0) 기준이므로 칸만큼 옮긴다
    ED.ghost.position.copy(ED.ghost.userData.base).add(new THREE.Vector3(h.x * T, 0.15, h.y * T));
  }
}

const ray = new THREE.Raycaster();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function edCell(ev) {
  const r = canvas.getBoundingClientRect();
  const v = new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(v, ortho);
  const p = new THREE.Vector3();
  if (!ray.ray.intersectPlane(plane, p)) return null;
  return { x: Math.floor(p.x / T), y: Math.floor(p.z / T), wx: p.x, wz: p.z };
}

/** 브러시 발자국 [가로, 세로] (회전 반영) */
function fpOf(t, r) { return isRoad(t) ? footprint({ t, r }) : [1, 1]; }
function anchorOf(cell, t, r) { const [fw, fl] = fpOf(t, r); return { x: cell.x - Math.floor((fw - 1) / 2), y: cell.y - Math.floor((fl - 1) / 2) }; }
function edPush() {
  ED.hist.push(JSON.stringify(ED.map));
  if (ED.hist.length > 60) ED.hist.shift();
}
function edChanged() {
  ED.dirty = true;
  ED.map.name = $("eName").value.trim();
  lsSet("cm.draft", { map: ED.map, srcId: ED.srcId });
  edValidate();
}

function edAt(x, y, lv) {
  return ED.map.tiles.filter((p) => levelsOf(p).includes(lv) && cellsOf(p).some(([cx, cy]) => cx === x && cy === y));
}

function edApply(cell, drag) {
  const m = ED.map;
  if (ED.erase) {
    let hit = edAt(cell.x, cell.y, ED.lv);
    // 이 높이에 없으면 아무 높이의 조각이라도 (위에서부터)
    if (!hit.length) hit = ED.map.tiles.filter((p) => cellsOf(p).some(([cx, cy]) => cx === cell.x && cy === cell.y)).sort((a, b) => (b.h | 0) - (a.h | 0)).slice(0, 1);
    if (!hit.length) return;
    if (!drag || !ED.strokePushed) { edPush(); ED.strokePushed = true; }
    // 장식이 있으면 장식 먼저 지운다
    const victim = hit.find((p) => !isRoad(p.t)) || hit[0];
    edRemove(victim);
    edChanged();
    return;
  }
  // 큰 조각은 마우스 칸이 가운데쯤 오게
  const { x: ax, y: ay } = anchorOf(cell, ED.brush, ED.rot);
  const [fw, fl] = fpOf(ED.brush, ED.rot);
  if (ax < 0 || ay < 0 || ax + fw > m.w || ay + fl > m.h) return;
  const np = { t: ED.brush, x: ax, y: ay, r: ED.rot };
  const bl = brushLevel(ED.brush);
  if (bl) np.h = bl;
  const same = m.tiles.find((p) => p.t === np.t && p.x === ax && p.y === ay && (p.h | 0) === bl);
  if (same) {
    if (drag) return;
    // 같은 조각을 다시 누르면 회전
    edPush();
    ED.rot = (same.r + 1) & 3;
    np.r = ED.rot;
    edRemove(same);
    const nf = fpOf(np.t, np.r);
    if (np.x + nf[0] > m.w || np.y + nf[1] > m.h) { np.x = Math.min(np.x, m.w - nf[0]); np.y = Math.min(np.y, m.h - nf[1]); }
    edAdd(np);
    edGhost();
    edChanged();
    return;
  }
  const cells = new Set(cellsOf(np).map(([a, b]) => a + "," + b));
  const lvs = levelsOf(np);
  const road = isRoad(np.t);
  const over = m.tiles.filter((p) => {
    if (!cellsOf(p).some(([a, b]) => cells.has(a + "," + b))) return false;
    if (!levelsOf(p).some((l) => lvs.includes(l))) return false; // 다른 높이는 겹쳐도 된다 (다리 아래)
    // 부스트 박스는 도로 위에 둘 수 있다
    if (np.t === "boost" && isRoad(p.t)) return false;
    if (p.t === "boost" && road) return false;
    return true;
  });
  if (drag && over.some((p) => p.t === np.t)) return;
  if (!drag || !ED.strokePushed) { edPush(); ED.strokePushed = true; }
  for (const p of over) edRemove(p);
  edAdd(np);
  edChanged();
}
function edAdd(p) {
  ED.map.tiles.push(p);
  const o = makeTileObj(p, ED.map.theme);
  if (o) { mapRoot.add(o); ED.objs.set(p, o); edFade(p, o); }
  if (isRoad(p.t)) edPillars();
}
function edRemove(p) {
  ED.map.tiles = ED.map.tiles.filter((q) => q !== p);
  const o = ED.objs.get(p);
  if (o) { mapRoot.remove(o); ED.objs.delete(p); }
  if (isRoad(p.t)) edPillars();
}
/** 지금 편집 중인 높이보다 위에 있는 조각은 흐리게 (아래가 보이게) */
function edFade(p, o) {
  if (!isRoad(p.t) || levelsOf(p)[0] <= ED.lv) return;
  o.traverse((c) => {
    if (!c.isMesh) return;
    const mats = (Array.isArray(c.material) ? c.material : [c.material]).map((m) => { const x = m.clone(); x.transparent = true; x.opacity = 0.28; x.depthWrite = false; return x; });
    c.material = Array.isArray(c.material) ? mats : mats[0];
    c.castShadow = false;
  });
}
function edPillars() {
  const old = mapRoot.children.find((c) => c.userData.pillars);
  if (old) mapRoot.remove(old);
  mapRoot.add(makePillars(ED.map));
}
function edLevelUI() {
  $("eLv").textContent = ED.lv;
  $("eUp").disabled = ED.lv >= MAX_LEVEL;
  $("eDn").disabled = ED.lv <= 0;
}
function edSetLevel(lv) {
  lv = Math.max(0, Math.min(MAX_LEVEL, lv));
  if (lv === ED.lv) return;
  ED.lv = lv;
  ED.ghostKey = "";
  edRebuild();
  edValidate();
  toast(lv === 0 ? L("땅 높이 편집", "Editing ground level") : L(`높이 ${lv} 편집 — 다리·고가 도로를 놓아요`, `Editing level ${lv} — place bridges`), 1400);
}

function edValidate() {
  const r = traceTrack(ED.map);
  const st = $("edStatus");
  if (r.ok) {
    st.innerHTML = `<span class="okc">✓ ${L("코스 완성", "Track OK")}</span> · ${L("1랩", "Lap")} ${Math.round(r.L)}m · ${L("높이", "Level")} ${ED.lv}`;
    ED.errBox.visible = false;
  } else {
    const e = ERRS[r.err] || [r.err, r.err];
    st.innerHTML = `<span class="err">${e[KO ? 0 : 1]}</span> · ${L("높이", "Level")} ${ED.lv}`;
    if (r.cell) {
      ED.errBox.visible = true;
      ED.errBox.position.set((r.cell[0] + 0.5) * T, 0.6, (r.cell[1] + 0.5) * T);
    } else ED.errBox.visible = false;
  }
  $("eTest").disabled = !r.ok;
  return r;
}

let edPtr = null;
canvas.addEventListener("pointerdown", (e) => {
  if (MODE !== "editor") return;
  canvas.setPointerCapture(e.pointerId);
  const pan = ED.pan || e.button === 1 || e.button === 2 || keys.Space;
  edPtr = { id: e.pointerId, x: e.clientX, y: e.clientY, pan, cx: ED.cx, cz: ED.cz, moved: false };
  ED.strokePushed = false;
  if (!pan) { const c = edCell(e); if (c) edApply(c, false); edPtr.last = c && c.x + "," + c.y; }
});
canvas.addEventListener("pointermove", (e) => {
  if (MODE !== "editor") return;
  const c = edCell(e);
  ED.hover = c && c.x >= 0 && c.y >= 0 && c.x < ED.map.w && c.y < ED.map.h ? anchorOf(c, ED.brush, ED.rot) : null;
  if (e.pointerType === "touch" && !edPtr) ED.hover = null;
  edGhost();
  if (!edPtr || edPtr.id !== e.pointerId) return;
  if (edPtr.pan) {
    const r = canvas.getBoundingClientRect();
    const k = (ED.zoom * 2) / r.height;
    ED.cx = edPtr.cx - (e.clientX - edPtr.x) * k;
    ED.cz = edPtr.cz - (e.clientY - edPtr.y) * k;
    edFitCam(false);
  } else if (c) {
    const key = c.x + "," + c.y;
    // 직선·장식·지우개는 끌어서 칠하기
    if (key !== edPtr.last && (ED.erase || ED.brush === "straight" || !isRoad(ED.brush))) { edApply(c, true); edPtr.last = key; }
  }
});
const edUp = (e) => { if (edPtr && edPtr.id === e.pointerId) edPtr = null; if (e.pointerType === "touch") { ED.hover = null; edGhost(); } };
canvas.addEventListener("pointerup", edUp);
canvas.addEventListener("pointercancel", edUp);
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("wheel", (e) => {
  if (MODE !== "editor") return;
  e.preventDefault();
  edZoom(e.deltaY > 0 ? 1.12 : 1 / 1.12);
}, { passive: false });
function edZoom(f) { ED.zoom = Math.max(20, Math.min(400, ED.zoom * f)); edFitCam(false); }

function edKey(e) {
  if (e.code === "KeyR") { ED.rot = (ED.rot + 1) & 3; edGhost(); }
  if (e.code === "KeyE") { ED.erase = !ED.erase; ED.pan = false; edToolsUI(); edPalette(); edGhost(); }
  if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ") { e.preventDefault(); edUndo(); }
  if (e.code === "PageUp" || e.code === "BracketRight") edSetLevel(ED.lv + 1);
  if (e.code === "PageDown" || e.code === "BracketLeft") edSetLevel(ED.lv - 1);
}
function edUndo() {
  const s = ED.hist.pop();
  if (!s) return;
  ED.map = JSON.parse(s);
  $("eName").value = ED.map.name || "";
  edRebuild();
  edChanged();
}
$("eRot").onclick = () => { ED.rot = (ED.rot + 1) & 3; edGhost(); };
$("eErase").onclick = () => { ED.erase = !ED.erase; ED.pan = false; edToolsUI(); edPalette(); edGhost(); };
$("ePan").onclick = () => { ED.pan = !ED.pan; ED.erase = false; edToolsUI(); edPalette(); edGhost(); };
$("eZin").onclick = () => edZoom(1 / 1.25);
$("eZout").onclick = () => edZoom(1.25);
$("eUndo").onclick = edUndo;
$("eUp").onclick = () => edSetLevel(ED.lv + 1);
$("eDn").onclick = () => edSetLevel(ED.lv - 1);
$("eName").addEventListener("input", () => { ED.map.name = $("eName").value.trim(); lsSet("cm.draft", { map: ED.map, srcId: ED.srcId }); ED.dirty = true; });
function edResize(dw, dh) {
  const m = ED.map;
  const nw = Math.max(6, Math.min(32, m.w + dw)), nh = Math.max(6, Math.min(32, m.h + dh));
  if (nw === m.w && nh === m.h) return;
  const cut = m.tiles.filter((p) => cellsOf(p).some(([x, y]) => x >= nw || y >= nh));
  if (cut.length && !confirm(L(`바깥쪽 조각 ${cut.length}개가 지워져요. 계속할까요?`, `${cut.length} pieces outside will be removed. Continue?`))) return;
  edPush();
  m.tiles = m.tiles.filter((p) => !cut.includes(p));
  m.w = nw; m.h = nh;
  edRebuild();
  edFitCam(true);
  edChanged();
}
$("eW").children[0].onclick = () => edResize(-1, 0);
$("eW").children[2].onclick = () => edResize(1, 0);
$("eH").children[0].onclick = () => edResize(0, -1);
$("eH").children[2].onclick = () => edResize(0, 1);
$("eBack").onclick = () => {
  if (ED.dirty && !confirm(L("저장하지 않은 변경이 있어요. 나갈까요? (초안은 이 기기에 남아요)", "Unsaved changes. Leave? (Draft is kept on this device)"))) return;
  ED.on = false;
  $("ed").hidden = true;
  MODE = "idle";
  openSetup();
};
$("eNew").onclick = () => {
  if (ED.dirty && !confirm(L("지금 맵을 지우고 새로 시작할까요?", "Discard this track and start a new one?"))) return;
  ED.map = { ...BLANK(), name: "" };
  ED.srcId = null;
  ED.hist = [];
  $("eName").value = "";
  edRebuild(); edFitCam(true); edChanged(); ED.dirty = false;
};
$("eSave").onclick = () => {
  let name = $("eName").value.trim();
  if (!name) {
    name = prompt(L("맵 이름을 정해 주세요", "Name your track"), L("나의 서킷", "My Circuit")) || "";
    name = name.trim().slice(0, 24);
    if (!name) return;
    $("eName").value = name;
  }
  ED.map.name = name;
  const id = upsertMyMap({ ...ED.map, id: ED.srcId });
  ED.srcId = id;
  ED.dirty = false;
  lsSet("cm.draft", { map: ED.map, srcId: id });
  SET.mapId = id;
  savePrefs();
  const ok = traceTrack(ED.map).ok;
  toast(ok ? L("저장했어요! 레이스 설정에서 고를 수 있어요", "Saved! Pick it in race setup") : L("저장했어요 (코스가 완성되면 달릴 수 있어요)", "Saved (finish the loop to race it)"));
};
$("eTest").onclick = () => {
  const r = edValidate();
  if (!r.ok) return;
  ED.map.name = $("eName").value.trim();
  const editMap = JSON.parse(JSON.stringify(ED.map));
  startSingle({ map: editMap, laps: 1, racers: 4, diff: "normal", car: SET.car, test: true, editMap, mapId: "test" });
};
$("eCode").onclick = () => {
  show("scCode");
  $("cTitle").textContent = L("공유 코드", "Share code");
  $("cDesc").textContent = L("이 코드를 친구에게 보내면 같은 맵을 불러올 수 있어요. 받은 코드를 붙여 넣고 '불러오기'를 누르세요.", "Send this code to a friend so they can load the same track. Paste a code you got and press Load.");
  ED.map.name = $("eName").value.trim();
  $("cText").value = encodeMap(sanitizeMap(ED.map));
};
$("cClose").onclick = () => show(null);
$("cCopy").onclick = async () => {
  try { await navigator.clipboard.writeText($("cText").value); toast(L("복사했어요", "Copied")); }
  catch { $("cText").select(); document.execCommand("copy"); toast(L("복사했어요", "Copied")); }
};
$("cLoad").onclick = () => {
  const m = decodeMap($("cText").value);
  if (!m) { toast(L("올바른 코드가 아니에요", "Invalid code")); return; }
  edPush();
  ED.map = m;
  ED.srcId = null;
  $("eName").value = m.name || "";
  show(null);
  edRebuild(); edFitCam(true); edChanged();
  toast(L("맵을 불러왔어요 — 저장하면 내 맵에 추가돼요", "Loaded — save to add it to your tracks"));
};

// ───────────────────────── 온라인 ─────────────────────────
const NET = { role: null, mySeat: 0, players: [], st: null, ver: 0, offline: [], firstFin: null, done: false, pendingPose: false };

function hostSet(patch) {
  NET.st = { ...NET.st, ...patch };
  NET.ver++;
  MG.net.send({ type: "net:state", ver: NET.ver, state: NET.st, turn: NET.st.race || 0, winner: NET.st.ph === "done" ? NET.st.winner : null });
  if (!R) renderOnlineSetup();
}

function onlineInit(m) {
  NET.role = m.role;
  NET.mySeat = m.mySeat;
  NET.players = m.players || [];
  NET.ver = m.ver || 0;
  if (m.role === "host") {
    let st = m.state;
    const first = allMaps().find((x) => x.id === SET.mapId && x.valid) || allMaps()[0];
    const base = { ph: "setup", map: first.map, mapId: first.id, laps: SET.laps, cars: {}, race: 0 };
    if (!st) st = base;
    else if (st.ph !== "setup") { toast(L("방장이 바뀌어 대기 화면으로 돌아왔어요", "Host changed — back to the lobby")); st = { ...st, ph: "setup", res: null }; }
    st.cars = st.cars || {};
    st.cars[NET.mySeat] = st.cars[NET.mySeat] || SET.car;
    // AI 자리 차 미리 정하기
    const aiCars = pickAiCars(8, null);
    NET.players.forEach((p, i) => { if (p.ai && !st.cars[i]) st.cars[i] = aiCars[i]; });
    NET.st = st;
    hostSet({});
  } else {
    if (m.state) applyState(m.state, m.ver);
    else renderOnlineSetup();
    MG.net.send({ type: "net:intent", intent: { t: "car", car: SET.car } });
  }
}

function applyState(st, ver) {
  if (ver !== undefined && ver < NET.ver && NET.st) return;
  if (ver !== undefined) NET.ver = ver;
  const prev = NET.st;
  NET.st = st;
  if (st.ph === "race" && (!R || R.raceId !== st.race)) {
    startOnline(!prev || prev.ph !== "race" ? false : true);
  } else if (st.ph === "done" && st.res && (!R || !R.results)) {
    onlineResults(st);
  } else if (st.ph === "setup") {
    if (R) stopRace();
    renderOnlineSetup();
  }
}

function renderOnlineSetup() {
  if (R && R.phase !== "done") return;
  const st = NET.st;
  if (!st) return;
  MODE = "idle";
  show("scSetup");
  $("hud").hidden = true;
  $("touch").hidden = true;
  $("setTitle").textContent = L("온라인 레이스", "Online race");
  $("setBack").hidden = true;
  $("wRacers").hidden = true;
  $("wDiff").hidden = true;
  const pl = $("setPlayers");
  pl.hidden = false;
  pl.innerHTML = `<h3>${L("참가자", "RACERS")} (${NET.players.length})</h3><div class="plist">` + NET.players.map((p, i) => {
    const car = st.cars && st.cars[i];
    return `<div><i style="background:${SEAT_COLORS[i]}"></i>${esc(p.ai ? "AI" : p.name)}${i === NET.mySeat ? ` (${L("나", "you")})` : ""}${(NET.offline || []).includes(i) ? " 📴" : ""}<small>${car ? esc(carById(car).name[KO ? "ko" : "en"]) : L("차 고르는 중…", "choosing…")}</small></div>`;
  }).join("") + "</div>";
  const host = NET.role === "host";
  if (host) {
    SET.mapId = st.mapId;
    $("lbMap").textContent = L("맵 (방장이 고름)", "TRACK (host picks)");
    renderMapList();
    stepper($("stLaps"), () => SET.laps, (v) => { SET.laps = v; savePrefs(); hostSet({ laps: v }); }, () => 1, () => 9);
    $("setGo").textContent = "🏁 " + L("출발!", "Start!");
    $("setGo").disabled = false;
    $("setNote").textContent = "";
    $("setGo").onclick = () => {
      const cars = { ...st.cars };
      const aiCars = pickAiCars(8, null);
      NET.players.forEach((p, i) => { if (!cars[i]) cars[i] = aiCars[i]; });
      NET.firstFin = null;
      NET.done = false;
      hostSet({ ph: "race", race: (st.race || 0) + 1, cars, laps: SET.laps, res: null });
      startOnline(false);
    };
  } else {
    $("lbMap").textContent = L("맵 (방장이 고름)", "TRACK (host picks)");
    const box = $("mapList");
    box.innerHTML = "";
    const b = document.createElement("div");
    b.className = "mapc on";
    const cv = document.createElement("canvas");
    cv.width = 200; cv.height = 150;
    b.appendChild(cv);
    const nm = document.createElement("b");
    nm.textContent = st.map.name || "";
    b.appendChild(nm);
    drawMapPreview(cv, sanitizeMap(st.map));
    box.appendChild(b);
    const keep = document.createElement("button");
    keep.className = "mapc";
    keep.style.display = "flex"; keep.style.alignItems = "center"; keep.style.justifyContent = "center"; keep.style.fontWeight = "800"; keep.style.fontSize = "13px";
    keep.textContent = "💾 " + L("이 맵 내 맵에 저장", "Save this track");
    keep.onclick = () => { upsertMyMap({ ...st.map, id: null }); toast(L("내 맵에 저장했어요", "Saved to your tracks")); };
    if (!BUILTIN.some((m) => m.id === st.mapId)) box.appendChild(keep);
    $("stLaps").children[1].textContent = st.laps;
    $("stLaps").children[0].onclick = $("stLaps").children[2].onclick = null;
    $("setGo").textContent = L("방장이 출발하기를 기다리는 중…", "Waiting for host to start…");
    $("setGo").disabled = true;
    $("setNote").textContent = "";
  }
  renderCars((car) => {
    if (host) hostSet({ cars: { ...NET.st.cars, [NET.mySeat]: car } });
    else MG.net.send({ type: "net:intent", intent: { t: "car", car } });
  });
  if (!mapRoot || mapRoot.userData.id !== "online:" + st.mapId) {
    buildMap(sanitizeMap(st.map));
    mapRoot.userData.id = "online:" + st.mapId;
    mapRoot.userData.map = sanitizeMap(st.map);
  }
}

function startOnline(rejoin) {
  const st = NET.st;
  stopRace();
  const race = makeRace({ map: st.map, laps: st.laps, mapId: st.mapId, mySeat: NET.mySeat });
  if (!race) return;
  R = race;
  race.raceId = st.race;
  NET.players.forEach((p, i) => {
    let kind = "remote";
    if (i === NET.mySeat) kind = "human";
    else if (NET.role === "host" && p.ai) kind = "ai";
    addRaceCar(race, { seat: i, slot: i, car: (st.cars && st.cars[i]) || "race", kind, name: p.ai ? "AI " + (i + 1) : p.name, ai: { ...DIFFS.normal }, lane: ((i * 0.37) % 1) * 2 - 1 });
  });
  // 레이스 도중 다시 들어온 경우: 방장이 보내는 내 차 위치를 받으면 이어서 달린다
  NET.pendingPose = rejoin;
  if (rejoin) { race.cd = 0.01; }
  beginRace();
}

// 원격 차 보간 (약 150ms 뒤 시점)
function interpRemote(race, c) {
  const snaps = c.snaps;
  if (!snaps.length) return;
  const tt = performance.now() - 150;
  let a = snaps[0], b = snaps[snaps.length - 1];
  for (let i = snaps.length - 1; i >= 0; i--) if (snaps[i].t <= tt) { a = snaps[i]; b = snaps[i + 1] || snaps[i]; break; }
  const k = b.t > a.t ? Math.max(0, Math.min(1.2, (tt - a.t) / (b.t - a.t))) : 0;
  c.x = a.x + (b.x - a.x) * k;
  c.z = a.z + (b.z - a.z) * k;
  c.y = a.y + (b.y - a.y) * k;
  c.pitch = b.pitch;
  let da = b.a - a.a;
  while (da > Math.PI) da -= 2 * Math.PI;
  while (da < -Math.PI) da += 2 * Math.PI;
  c.a = a.a + da * k;
  c.vf = b.v;
  c.speed = Math.abs(b.v);
  c.vx = Math.cos(c.a) * c.vf; c.vz = Math.sin(c.a) * c.vf;
  c.P = b.P;
  c.lapsDone = b.lap;
  c.boostT = b.boost ? 0.1 : 0;
  if (b.fin >= 0 && !c.finished) { c.finished = true; c.finishTime = b.fin; }
  while (snaps.length > 2 && snaps[1].t < tt) snaps.shift();
}

function packCar(c) {
  const vf = c.vx * Math.cos(c.a) + c.vz * Math.sin(c.a);
  return [c.seat, +c.x.toFixed(2), +c.z.toFixed(2), +c.a.toFixed(3), +vf.toFixed(1), +c.P.toFixed(1), c.lapsDone, c.finished ? +c.finishTime.toFixed(3) : -1, c.boostT > 0 ? 1 : 0, c.best ? +c.best.toFixed(3) : 0, +(c.y || 0).toFixed(2), +(c.pitch || 0).toFixed(3)];
}

function onPeer(m) {
  if (!R || !m.data || m.data.r !== R.raceId) return;
  const now = performance.now();
  for (const e of m.data.c || []) {
    const [seat, x, z, a, v, P, lap, fin, boost, best, y, pitch] = e;
    // 다른 사람이 보낸 자기 차 외의 자리는 방장만 믿는다
    if (seat !== m.seat && !m.host) continue;
    const c = R.world.cars.find((q) => q.seat === seat);
    if (!c) continue;
    if (seat === R.mySeat) {
      if (NET.pendingPose && m.host) {
        Object.assign(c, { x, z, y: y || 0, a, vx: Math.cos(a) * v, vz: Math.sin(a) * v, P, lapsDone: lap });
        const g = R.world.nearest(c, true);
        c.idx = g.i; c.lastGood = g.i;
        NET.pendingPose = false;
      }
      continue;
    }
    if (c.kind !== "remote") continue;
    c.snaps.push({ t: now, x, z, a, v, P, lap, fin, boost, y: y || 0, pitch: pitch || 0 });
    if (best) c.best = best;
    if (c.snaps.length > 30) c.snaps.shift();
  }
}

function netRaceTick(dt) {
  const race = R;
  if (race.phase !== "race") return;
  race.sendT -= dt;
  if (race.sendT <= 0) {
    race.sendT = 0.125;
    const mine = race.world.cars.filter((c) => c.seat === race.mySeat || (NET.role === "host" && c.kind === "ai"));
    if (!NET.pendingPose) MG.net.send({ type: "net:peer", data: { r: race.raceId, c: mine.map(packCar) } });
    else MG.net.send({ type: "net:peer", data: { r: race.raceId, c: [] } });
  }
  if (NET.role !== "host" || NET.done) return;
  const w = race.world;
  const fins = w.cars.filter((c) => c.finished);
  if (fins.length && NET.firstFin === null) NET.firstFin = race.t;
  const humans = w.cars.filter((c) => !(NET.players[c.seat] || {}).ai);
  const allHumans = humans.every((c) => c.finished || (NET.offline || []).includes(c.seat));
  const timeout = NET.firstFin !== null && race.t - NET.firstFin > 30;
  if ((allHumans && humans.length) || w.cars.every((c) => c.finished) || timeout) {
    NET.done = true;
    setTimeout(() => {
      if (!R || R !== race) return;
      const rows = w.cars.map((c) => ({ seat: c.seat, t: c.finished ? c.finishTime : null, est: c.finished ? null : estFinish(w, c), best: c.best || null, car: c.car }))
        .sort((a, b) => (a.t ?? a.est + 1e4) - (b.t ?? b.est + 1e4));
      const places = new Array(w.cars.length).fill(0);
      rows.forEach((r, i) => (places[r.seat] = i + 1));
      hostSet({ ph: "done", res: rows, winner: rows[0].seat });
      MG.net.send({ type: "net:finished", winner: rows[0].seat, scores: places, turn: race.raceId });
      onlineResults(NET.st);
    }, 1500);
  }
}

function onlineResults(st) {
  if (!R) return;
  R.results = st.res;
  R.phase = "done";
  const rows = st.res.map((r) => {
    const p = NET.players[r.seat] || {};
    return { name: p.ai ? "AI " + (r.seat + 1) : p.name || "?", color: SEAT_COLORS[r.seat], car: r.car, t: r.t ?? null, est: false, best: r.best, me: r.seat === NET.mySeat };
  });
  const pos = st.res.findIndex((r) => r.seat === NET.mySeat) + 1;
  // 결과를 보여 주되 레이스 화면(차들)은 계속 그린다
  setTimeout(() => showResults(rows, pos), 600);
}

if (ONLINE && MG) {
  MG.net.on((m) => {
    if (m.type === "net:init") onlineInit(m);
    else if (m.type === "net:state") { if (NET.role !== "host") applyState(m.state, m.ver); }
    else if (m.type === "net:intent" && NET.role === "host") {
      const it = m.intent || {};
      if (it.t === "car" && CARS.some((c) => c.id === it.car) && NET.st) {
        if (NET.st.ph === "setup") hostSet({ cars: { ...NET.st.cars, [m.seat]: it.car } });
      }
    } else if (m.type === "net:peer") onPeer(m);
    else if (m.type === "net:setAI" && NET.role === "host") {
      if (NET.players[m.seat]) NET.players[m.seat].ai = m.ai;
      if (R) {
        const c = R.world.cars.find((q) => q.seat === m.seat);
        if (c && c.seat !== NET.mySeat) {
          if (m.ai) { c.kind = "ai"; c.ai = { ...DIFFS.normal }; const g = R.world.nearest(c, true); c.idx = g.i; c.lastGood = g.i; }
          else { c.kind = "remote"; c.snaps = []; }
        }
      }
      if (!R) renderOnlineSetup();
    } else if (m.type === "net:presence") {
      NET.offline = m.offline || [];
      if (!R) renderOnlineSetup();
    } else if (m.type === "net:requestState" && NET.role === "host" && NET.st) hostSet({});
  });
}

// ───────────────────────── 메인 루프 ─────────────────────────
let lastFrame = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  if (window.__freeze) return;
  if (MODE === "race" && R && !paused) raceTick(dt);
  else if (MODE === "editor") {
    renderer.render(scene, ortho);
    return;
  } else if (MODE === "idle" && mapRoot) {
    idleT += dt;
    const m = mapRoot.userData.map;
    if (m) {
      const cx = (m.w * T) / 2, cz = (m.h * T) / 2, rad = Math.max(m.w, m.h) * T * 0.75;
      camera.position.set(cx + Math.cos(idleT * 0.08) * rad, rad * 0.55, cz + Math.sin(idleT * 0.08) * rad);
      camera.lookAt(cx, 0, cz);
      camera.fov = 55; camera.updateProjectionMatrix();
      sunFollow(cx, cz);
      sun.shadow.camera.left = sun.shadow.camera.bottom = -rad;
      sun.shadow.camera.right = sun.shadow.camera.top = rad;
      sun.shadow.camera.updateProjectionMatrix();
    }
  }
  if (MODE === "race") {
    if (sun.shadow.camera.right !== SH) {
      Object.assign(sun.shadow.camera, { left: -SH, right: SH, top: SH, bottom: -SH });
      sun.shadow.camera.updateProjectionMatrix();
    }
  }
  renderer.render(scene, camera);
}

// ───────────────────────── 시작 ─────────────────────────
async function boot() {
  staticText();
  resize();
  try {
    await loadAssets((k) => { $("ldBar").style.width = Math.round(k * 100) + "%"; });
  } catch (e) {
    $("ldTxt").textContent = L("불러오기 실패 — 새로고침해 주세요", "Failed to load — please reload");
    console.error(e);
    return;
  }
  makeThumbs();
  $("loading").hidden = true;
  requestAnimationFrame(frame);
  $("mRace").onclick = () => openSetup();
  $("mEdit").onclick = () => openEditor(null);
  $("mOnline").onclick = () => { try { window.top.location.href = "/online/racing"; } catch { location.href = "/online/racing"; } };
  if (ONLINE && MG) {
    $("setGo").disabled = true;
    MG.net.send({ type: "net:ready" });
    show("scSetup");
    $("setTitle").textContent = L("연결 중…", "Connecting…");
    idleCam();
  } else {
    show("scMenu");
    idleCam();
    const code = Q.get("map");
    if (code) { const m = decodeMap(code); if (m) { openEditor(m, false); toast(L("공유받은 맵을 열었어요", "Opened a shared track")); } }
  }
  window.__cm = { dbg: { scene, THREE, camera, renderer, ortho, frame: () => renderer.render(scene, camera) }, sim(sec, inp) { for (let i = 0; i < sec * 30; i++) { if (inp) Object.assign(keys, inp); raceTick(1 / 30); } }, startSingle, openEditor, openSetup, get R() { return R; }, get ED() { return ED; }, allMaps, NET, onPeer, applyState, onlineInit, myCar, keys, touchIn };
}
boot();
