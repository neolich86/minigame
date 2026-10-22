// 서킷 메이커 — 트랙 조각 정의 · 코스 추적 · 중심선 계산 (렌더링 없음, Node 에서도 테스트 가능)
// 좌표: 격자 칸 (cx, cy), 월드 x = cx*T, z = cy*T. 방향 N=0(−z) E=1(+x) S=2(+z) W=3(−x)

export const T = 12; // 1칸 = 12m
export const ROAD_HW = 0.42 * T; // 도로 반폭 (이 밖은 잔디)
export const DX = [0, 1, 0, -1];
export const DY = [-1, 0, 1, 0];

/** 도로 조각 — k: 차지하는 칸 (k×k), 회전 전 기준 */
export const PIECES = {
  straight: { k: 1 },
  start: { k: 1 },
  cross: { k: 1 },
  c1: { k: 1 },
  c2: { k: 2 },
  c3: { k: 3 },
};
export const isRoad = (t) => t in PIECES;

/** 장식 — r: 충돌 반지름(칸 단위, 0이면 통과), k: 차지 칸 */
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

// 회전: 화면(위에서 본, y 아래) 기준 시계방향 90°×r. 발자국 k 안에서 (x,y) → (k−y, x)
function rotPt(x, y, k, r) {
  for (let i = 0; i < r; i++) [x, y] = [k - y, x];
  return [x, y];
}
const rotDir = (d, r) => (d + r) % 4;

/** 회전 전 기준 포트(칸, 바깥 방향)와 경로 */
function baseShape(type) {
  const k = PIECES[type].k;
  if (type === "straight" || type === "start") {
    return { k, ports: [[0, 0, 0], [0, 0, 2]], paths: [{ a: 1, b: 0, f: (t) => [0.5, 1 - t], len: 1 }] };
  }
  if (type === "cross") {
    return {
      k,
      ports: [[0, 0, 0], [0, 0, 1], [0, 0, 2], [0, 0, 3]],
      paths: [
        { a: 2, b: 0, f: (t) => [0.5, 1 - t], len: 1 },
        { a: 3, b: 1, f: (t) => [t, 0.5], len: 1 },
      ],
    };
  }
  // 코너: 중심 (k,k), 반지름 k−0.5. 아래쪽(왼쪽 칸 S) ↔ 오른쪽(위 칸 E)
  const R = k - 0.5;
  return {
    k,
    ports: [[0, k - 1, 2], [k - 1, 0, 1]],
    paths: [{ a: 0, b: 1, f: (t) => { const ang = Math.PI + t * Math.PI / 2; return [k + R * Math.cos(ang), k + R * Math.sin(ang)]; }, len: (Math.PI / 2) * R, R }],
  };
}

/** 배치된 조각의 실제 포트·경로 (격자 좌표) */
export function pieceShape(p) {
  const b = baseShape(p.t);
  const k = b.k, r = p.r & 3;
  const ports = b.ports.map(([cx, cy, d]) => {
    // 칸 중심을 회전
    const [x, y] = rotPt(cx + 0.5, cy + 0.5, k, r);
    return { cx: p.x + Math.floor(x), cy: p.y + Math.floor(y), d: rotDir(d, r) };
  });
  const paths = b.paths.map((q) => ({
    a: q.a, b: q.b, len: q.len, R: q.R,
    f: (t) => { const [x, y] = q.f(t); const [rx, ry] = rotPt(x, y, k, r); return [p.x + rx, p.y + ry]; },
  }));
  return { k, ports, paths };
}

/** 조각이 차지하는 칸들 */
export function cellsOf(p) {
  const k = (PIECES[p.t] || DECOS[p.t] || {}).k || 1;
  const out = [];
  for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) out.push([p.x + i, p.y + j]);
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
    for (const [cx, cy] of cellsOf(p)) {
      if (cx < 0 || cy < 0 || cx >= map.w || cy >= map.h) return { ok: false, err: "outside", cell: [cx, cy] };
      const key = cx + "," + cy;
      if (occ.has(key)) return { ok: false, err: "overlap", cell: [cx, cy] };
      occ.set(key, p);
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
      const [x, y] = path.f(fwd ? t : 1 - t);
      pts.push({ x: x * T, z: y * T, piece: tiles.indexOf(piece) });
    }
    const port = sh.ports[exit];
    const nx = port.cx + DX[port.d], ny = port.cy + DY[port.d];
    const need = (port.d + 2) % 4;
    if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h) return { ok: false, err: "open", cell: [port.cx, port.cy] };
    const q = occ.get(nx + "," + ny);
    if (!q) return { ok: false, err: "open", cell: [port.cx, port.cy] };
    const qs = shapes.get(q);
    const ei = qs.ports.findIndex((pp) => pp.cx === nx && pp.cy === ny && pp.d === need);
    if (ei < 0) return { ok: false, err: "mismatch", cell: [nx, ny] };
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
    .map((p) => ({ t: p.t, x: p.x | 0, y: p.y | 0, r: (p.r | 0) & 3 }));
  return { v: 1, name: String(m.name || "").slice(0, 24) || "My Track", w, h, theme: m.theme === "sand" || m.theme === "snow" ? m.theme : "grass", tiles };
}

// 공유 코드: JSON → base64url (짧게: 조각을 "t,x,y,r" 문자열로)
const CODE_T = ["straight", "start", "cross", "c1", "c2", "c3", ...Object.keys(DECOS)];
export function encodeMap(m) {
  const body = m.tiles.map((p) => CODE_T.indexOf(p.t).toString(36) + "." + p.x.toString(36) + "." + p.y.toString(36) + "." + p.r).join("_");
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
    const tiles = o.b ? o.b.split("_").map((t) => { const [a, x, y, r] = t.split("."); return { t: CODE_T[parseInt(a, 36)], x: parseInt(x, 36), y: parseInt(y, 36), r: +r }; }) : [];
    return sanitizeMap({ name: o.n, w: o.w, h: o.h, theme: o.e, tiles });
  } catch {
    return null;
  }
}
