// 서킷 메이커 — 트랙 조각 정의 · 코스 추적 · 중심선 계산 (렌더링 없음, Node 에서도 테스트 가능)
// 좌표: 격자 칸 (cx, cy), 월드 x = cx*T, z = cy*T. 방향 N=0(−z) E=1(+x) S=2(+z) W=3(−x)

export const T = 12; // 1칸 = 12m
export const ROAD_HW = 0.42 * T; // 도로 반폭 (이 밖은 잔디)
export const DX = [0, 1, 0, -1];
export const DY = [-1, 0, 1, 0];

/** 도로 조각 — w×l: 회전 전 기준 가로×세로 칸 */
export const PIECES = {
  straight: { w: 1, l: 1 },
  start: { w: 1, l: 1 },
  cross: { w: 1, l: 1 },
  c1: { w: 1, l: 1 },
  c2: { w: 2, l: 2 },
  c3: { w: 3, l: 3 },
  ramp: { w: 1, l: 2 }, // 한 층 오르막 (r=0 이면 북쪽으로 올라감)
};
export const isRoad = (t) => t in PIECES;
export const MAX_LEVEL = 2; // 0(땅) · 1 · 2층
export const LH = 0.5 * T; // 한 층 높이 (6m — 아래로 차가 지나갈 수 있음)

/** 장식 — r: 충돌 반지름(칸 단위, 0이면 통과) */
export const DECOS = {
  treeLarge: { r: 0.12 },
  treeSmall: { r: 0.1 },
  pine: { r: 0.14 },
  tree: { r: 0.14 },
  grandStand: { r: 0.45, box: true },
  grandStandCovered: { r: 0.45, box: true },
  tent: { r: 0.45, box: true },
  pitsGarage: { r: 0.45, box: true },
  pitsOffice: { r: 0.45, box: true },
  billboard: { r: 0.25 },
  lightPost: { r: 0.06 },
  bannerRed: { r: 0.08 },
  bannerGreen: { r: 0.08 },
  radar: { r: 0.2 },
  fence: { r: 0 },
  cone: { r: 0.05 },
  boost: { r: 0 }, // 부스트 박스 — 통과하며 획득
};

// 오르막 높이 곡선 (Kenney roadRampLongCurved 모양을 잰 값, 0→1)
const RAMP_Y = [0, 0.03, 0.088, 0.22, 0.35, 0.578, 0.73, 0.87, 0.94, 0.985, 1];
export function rampY(t) {
  const u = Math.max(0, Math.min(1, t)) * 10, i = Math.min(9, Math.floor(u));
  return RAMP_Y[i] + (RAMP_Y[i + 1] - RAMP_Y[i]) * (u - i);
}

// 회전: 화면(위에서 본, y 아래) 기준 시계방향 90°×r. W×H 발자국 안에서 (x,y) → (H−y, x), 발자국은 H×W 가 된다
function rotPt(x, y, W, H, r) {
  for (let i = 0; i < r; i++) { [x, y] = [H - y, x]; [W, H] = [H, W]; }
  return [x, y];
}
const rotDir = (d, r) => (d + r) % 4;

/** 회전 전 기준 포트 [칸x, 칸y, 바깥 방향, 높이(+층)] 와 경로 */
function baseShape(type) {
  const { w, l } = PIECES[type];
  if (type === "straight" || type === "start") {
    return { w, l, ports: [[0, 0, 0, 0], [0, 0, 2, 0]], paths: [{ a: 1, b: 0, f: (t) => [0.5, 1 - t], len: 1 }] };
  }
  if (type === "ramp") {
    return { w, l, ports: [[0, 0, 0, 1], [0, 1, 2, 0]], paths: [{ a: 1, b: 0, f: (t) => [0.5, 2 - 2 * t], len: 2, y: rampY }] };
  }
  if (type === "cross") {
    return {
      w, l,
      ports: [[0, 0, 0, 0], [0, 0, 1, 0], [0, 0, 2, 0], [0, 0, 3, 0]],
      paths: [
        { a: 2, b: 0, f: (t) => [0.5, 1 - t], len: 1 },
        { a: 3, b: 1, f: (t) => [t, 0.5], len: 1 },
      ],
    };
  }
  // 코너: 중심 (k,k), 반지름 k−0.5. 아래쪽(왼쪽 칸 S) ↔ 오른쪽(위 칸 E)
  const k = w, R = k - 0.5;
  return {
    w, l,
    ports: [[0, k - 1, 2, 0], [k - 1, 0, 1, 0]],
    paths: [{ a: 0, b: 1, f: (t) => { const ang = Math.PI + t * Math.PI / 2; return [k + R * Math.cos(ang), k + R * Math.sin(ang)]; }, len: (Math.PI / 2) * R, R }],
  };
}

/** 회전 후 발자국 크기 [가로, 세로] */
export function footprint(p) {
  const d = PIECES[p.t] || { w: 1, l: 1 };
  return (p.r & 1) ? [d.l, d.w] : [d.w, d.l];
}

/** 배치된 조각의 실제 포트·경로 (격자 좌표, 높이는 층 단위) */
export function pieceShape(p) {
  const b = baseShape(p.t);
  const r = p.r & 3, h = p.h | 0;
  const ports = b.ports.map(([cx, cy, d, lv]) => {
    const [x, y] = rotPt(cx + 0.5, cy + 0.5, b.w, b.l, r);
    return { cx: p.x + Math.floor(x), cy: p.y + Math.floor(y), d: rotDir(d, r), lv: h + lv };
  });
  const paths = b.paths.map((q) => ({
    a: q.a, b: q.b, len: q.len, R: q.R,
    f: (t) => { const [x, y] = q.f(t); const [rx, ry] = rotPt(x, y, b.w, b.l, r); return [p.x + rx, p.y + ry]; },
    y: (t) => h + (q.y ? q.y(t) : 0),
  }));
  return { ports, paths };
}

/** 조각이 차지하는 칸들 */
export function cellsOf(p) {
  const [w, l] = footprint(p);
  const out = [];
  for (let i = 0; i < w; i++) for (let j = 0; j < l; j++) out.push([p.x + i, p.y + j]);
  return out;
}
/** 조각이 차지하는 층들 (오르막은 두 층) */
export function levelsOf(p) {
  if (!isRoad(p.t)) return [0];
  const h = p.h | 0;
  return p.t === "ramp" ? [h, h + 1] : [h];
}
/** 땅 위에 떠 있는 조각 (가장자리에 난간 · 아래에 기둥) */
export const isElevated = (p) => isRoad(p.t) && ((p.h | 0) > 0 || p.t === "ramp");

/**
 * 높은 조각을 받치는 기둥 위치 (월드 좌표). 아래층에 도로가 있는 칸에는 세우지 않는다.
 * 땅에서 시작하는 오르막은 옆벽이 채워진 모델이라 기둥이 필요 없다.
 */
export function pillarsOf(map) {
  const roads = (map.tiles || []).filter((p) => isRoad(p.t));
  const occ = new Set();
  for (const p of roads) for (const [cx, cy] of cellsOf(p)) for (const lv of levelsOf(p)) occ.add(cx + "," + cy + "@" + lv);
  const out = [];
  for (const p of roads) {
    const h = p.h | 0;
    if (h < 1) continue;
    for (const q of pieceShape(p).paths) {
      const n = Math.max(1, Math.round(q.len));
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        const [x, y] = q.f(t);
        const cx = Math.floor(x), cy = Math.floor(y);
        let blocked = false;
        for (let lv = 0; lv < h; lv++) if (occ.has(cx + "," + cy + "@" + lv)) blocked = true;
        if (!blocked) out.push({ x: x * T, z: y * T, top: q.y(t) * LH });
      }
    }
  }
  return out;
}

/**
 * 출발선에서 코스를 따라가 닫힌 중심선을 만든다.
 * 반환: { ok:true, pts:[{x,z}], ... } 또는 { ok:false, err, cell }
 */
export function traceTrack(map) {
  const tiles = (map.tiles || []).filter((p) => isRoad(p.t));
  const starts = tiles.filter((p) => p.t === "start");
  if (starts.length === 0) return { ok: false, err: "noStart" };
  if (starts.length > 1) return { ok: false, err: "multiStart", cell: [starts[1].x, starts[1].y] };
  const occ = new Map();
  for (const p of tiles) {
    for (const lv of levelsOf(p)) if (lv > MAX_LEVEL) return { ok: false, err: "tooHigh", cell: [p.x, p.y] };
    for (const [cx, cy] of cellsOf(p)) {
      if (cx < 0 || cy < 0 || cx >= map.w || cy >= map.h) return { ok: false, err: "outside", cell: [cx, cy] };
      for (const lv of levelsOf(p)) {
        const key = cx + "," + cy + "@" + lv;
        if (occ.has(key)) return { ok: false, err: "overlap", cell: [cx, cy] };
        occ.set(key, p);
      }
    }
  }
  const shapes = new Map(tiles.map((p) => [p, pieceShape(p)]));
  const start = starts[0];
  const sShape = shapes.get(start);
  const pts = [];
  const used = new Set();
  let piece = start, entry = 1; // 출발선은 S 포트(1)로 들어와 N 포트(0)로 나간다
  const order = [];
  for (let guard = 0; guard < 5000; guard++) {
    const sh = shapes.get(piece);
    const pi = sh.paths.findIndex((q) => q.a === entry || q.b === entry);
    if (pi < 0) return { ok: false, err: "broken", cell: [piece.x, piece.y] };
    const path = sh.paths[pi];
    const key = tiles.indexOf(piece) + ":" + pi;
    if (used.has(key)) return { ok: false, err: "loop", cell: [piece.x, piece.y] };
    used.add(key);
    order.push(piece);
    const fwd = path.a === entry;
    const exit = fwd ? path.b : path.a;
    const n = Math.max(2, Math.round(path.len * T)); // 약 1m 간격
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const u = fwd ? t : 1 - t;
      const [x, y] = path.f(u);
      pts.push({ x: x * T, z: y * T, y: path.y(u) * LH, wall: isElevated(piece), piece: tiles.indexOf(piece) });
    }
    const port = sh.ports[exit];
    const nx = port.cx + DX[port.d], ny = port.cy + DY[port.d];
    const need = (port.d + 2) % 4;
    if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h) return { ok: false, err: "open", cell: [port.cx, port.cy] };
    const q = occ.get(nx + "," + ny + "@" + port.lv);
    if (!q) {
      // 같은 칸 다른 층에 도로가 있으면 높이가 안 맞는 것
      for (let lv = 0; lv <= MAX_LEVEL + 1; lv++) if (occ.has(nx + "," + ny + "@" + lv)) return { ok: false, err: "level", cell: [nx, ny] };
      return { ok: false, err: "open", cell: [port.cx, port.cy] };
    }
    const qs = shapes.get(q);
    const ei = qs.ports.findIndex((pp) => pp.cx === nx && pp.cy === ny && pp.d === need && pp.lv === port.lv);
    if (ei < 0) return { ok: false, err: qs.ports.some((pp) => pp.cx === nx && pp.cy === ny && pp.d === need) ? "level" : "mismatch", cell: [nx, ny] };
    if (q === start) {
      if (ei !== 1) return { ok: false, err: "reverse", cell: [nx, ny] };
      return finish(map, pts, start, sShape, tiles, order);
    }
    piece = q;
    entry = ei;
  }
  return { ok: false, err: "loop" };
}

function finish(map, raw, start, sShape, tiles, order) {
  // 출발선 칸 중심이 0번 점이 되도록 회전
  const [cx, cy] = sShape.paths[0].f(0.5);
  let best = 0, bd = Infinity;
  raw.forEach((p, i) => { const d = (p.x - cx * T) ** 2 + (p.z - cy * T) ** 2; if (d < bd) { bd = d; best = i; } });
  const pts = raw.slice(best).concat(raw.slice(0, best));
  const N = pts.length;
  let s = 0;
  for (let i = 0; i < N; i++) {
    const a = pts[i], b = pts[(i + 1) % N];
    a.s = s;
    a.ds = Math.hypot(b.x - a.x, b.z - a.z);
    a.tx = (b.x - a.x) / (a.ds || 1);
    a.tz = (b.z - a.z) / (a.ds || 1);
    s += a.ds;
  }
  const L = s;
  // 곡률 (앞뒤 3점 방향 차이)
  for (let i = 0; i < N; i++) {
    const a = pts[(i - 3 + N) % N], b = pts[(i + 3) % N];
    let da = Math.atan2(b.tz, b.tx) - Math.atan2(a.tz, a.tx);
    while (da > Math.PI) da -= 2 * Math.PI;
    while (da < -Math.PI) da += 2 * Math.PI;
    pts[i].k = da / 6; // 1m 당 회전각 (부호: 오른쪽 +)
  }
  const sp = sShape.paths[0];
  const [ax, ay] = sp.f(0), [bx, by] = sp.f(1);
  const dirx = bx - ax, dirz = by - ay;
  return {
    ok: true, pts, N, L,
    start: { x: cx * T, z: cy * T, dx: dirx, dz: dirz, piece: tiles.indexOf(start) },
    usedPieces: new Set(order),
  };
}

/** 지도 크기·조각 수 제한, 기본 정리 */
export function sanitizeMap(m) {
  if (!m || typeof m !== "object") return null;
  const w = Math.max(6, Math.min(32, m.w | 0)), h = Math.max(6, Math.min(32, m.h | 0));
  const tiles = (Array.isArray(m.tiles) ? m.tiles : [])
    .filter((p) => p && (isRoad(p.t) || p.t in DECOS))
    .slice(0, 600)
    .map((p) => {
      const o = { t: p.t, x: p.x | 0, y: p.y | 0, r: (p.r | 0) & 3 };
      const h = isRoad(p.t) ? Math.max(0, Math.min(p.t === "ramp" ? MAX_LEVEL - 1 : MAX_LEVEL, p.h | 0)) : 0;
      if (h) o.h = h;
      return o;
    });
  return { v: 1, name: String(m.name || "").slice(0, 24) || "My Track", w, h, theme: m.theme === "sand" || m.theme === "snow" ? m.theme : "grass", tiles };
}

// 공유 코드: JSON → base64url (짧게: 조각을 "t,x,y,r" 문자열로)
// 순서를 바꾸면 예전 코드가 깨지므로 새 종류는 맨 뒤에만 붙인다
const CODE_T = ["straight", "start", "cross", "c1", "c2", "c3", "treeLarge", "treeSmall", "pine", "tree", "grandStand", "grandStandCovered", "tent", "pitsGarage", "pitsOffice", "billboard", "lightPost", "bannerRed", "bannerGreen", "radar", "fence", "cone", "boost", "ramp"];
export function encodeMap(m) {
  const body = m.tiles.map((p) => CODE_T.indexOf(p.t).toString(36) + "." + p.x.toString(36) + "." + p.y.toString(36) + "." + p.r + (p.h ? "." + p.h : "")).join("_");
  const s = JSON.stringify({ n: m.name, w: m.w, h: m.h, e: m.theme, b: body });
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return "CM1" + btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function decodeMap(code) {
  try {
    code = String(code).trim();
    if (!code.startsWith("CM1")) return null;
    let b64 = code.slice(3).replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const bin = atob(b64);
    const s = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
    const o = JSON.parse(s);
    const tiles = o.b ? o.b.split("_").map((t) => { const [a, x, y, r, h] = t.split("."); return { t: CODE_T[parseInt(a, 36)], x: parseInt(x, 36), y: parseInt(y, 36), r: +r, h: +h || 0 }; }) : [];
    return sanitizeMap({ name: o.n, w: o.w, h: o.h, theme: o.e, tiles });
  } catch {
    return null;
  }
}
