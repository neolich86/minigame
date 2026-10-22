// 서킷 메이커 — 주행 물리 · 랩 판정 · AI (렌더링 없음)
import { T, ROAD_HW, DECOS, cellsOf, pillarsOf } from "./track.js?v=3";

export const VMAX = 36; // m/s (화면 표시는 ×5 km/h)
const ACC = 17, BRAKE = 36, COAST = 4, VREV = 9;
const GRASS_VMAX = 13;
const STEER_RATE = 2.5;
export const CAR_R = 1.3;

/** 고를 수 있는 차 — s/a/h: 최고속도·가속·핸들링 (1~5), 합은 비슷하게 */
export const CARS = [
  { id: "race", kit: "car", file: "race", name: { ko: "레이스카", en: "Racer" }, s: 5, a: 3, h: 3 },
  { id: "race-future", kit: "car", file: "race-future", name: { ko: "퓨처 GT", en: "Future GT" }, s: 5, a: 4, h: 2 },
  { id: "sedan-sports", kit: "car", file: "sedan-sports", name: { ko: "스포츠 세단", en: "Sports Sedan" }, s: 4, a: 3, h: 4 },
  { id: "hatchback-sports", kit: "car", file: "hatchback-sports", name: { ko: "핫해치", en: "Hot Hatch" }, s: 3, a: 4, h: 4 },
  { id: "police", kit: "car", file: "police", name: { ko: "경찰차", en: "Police" }, s: 4, a: 4, h: 3 },
  { id: "taxi", kit: "car", file: "taxi", name: { ko: "택시", en: "Taxi" }, s: 3, a: 3, h: 5 },
  { id: "kart", kit: "car", file: "kart-ooli", name: { ko: "카트", en: "Kart" }, s: 2, a: 5, h: 5 },
  { id: "ambulance", kit: "car", file: "ambulance", name: { ko: "구급차", en: "Ambulance" }, s: 4, a: 5, h: 2 },
  { id: "toy-racer", kit: "toy", file: "vehicle-racer", name: { ko: "토이 레이서", en: "Toy Racer" }, s: 4, a: 4, h: 3 },
  { id: "speedster", kit: "toy", file: "vehicle-speedster", name: { ko: "스피드스터", en: "Speedster" }, s: 5, a: 2, h: 4 },
  { id: "dragster", kit: "toy", file: "vehicle-drag-racer", name: { ko: "드래그 레이서", en: "Dragster" }, s: 5, a: 5, h: 1 },
  { id: "monster", kit: "toy", file: "vehicle-monster-truck", name: { ko: "몬스터 트럭", en: "Monster Truck" }, s: 3, a: 4, h: 4 },
  { id: "vintage", kit: "toy", file: "vehicle-vintage-racer", name: { ko: "빈티지 레이서", en: "Vintage Racer" }, s: 3, a: 3, h: 5 },
];
export const carById = (id) => CARS.find((c) => c.id === id) || CARS[0];
function carMul(def) {
  return { v: 0.95 + 0.02 * def.s, a: 0.88 + 0.06 * def.a, h: 0.9 + 0.05 * def.h };
}

/** 속도 v 에서 낼 수 있는 최대 회전 각속도 */
export function yawMax(v, h = 1) {
  const av = Math.abs(v);
  return STEER_RATE * h * Math.min(1, av / 6) * (1 - 0.32 * Math.min(1, av / VMAX));
}

export const DIFFS = {
  easy: { skill: 0.76, corner: 0.76 },
  normal: { skill: 0.88, corner: 0.89 },
  hard: { skill: 0.98, corner: 0.98 },
};

export class World {
  constructor(map, track, laps) {
    this.map = map;
    this.track = track;
    this.laps = laps;
    this.cars = [];
    this.time = 0; // 출발 후 경과 (초)
    this.solids = [];
    this.boosts = [];
    for (const p of map.tiles) {
      const d = DECOS[p.t];
      if (!d) continue;
      const k = d.k || 1;
      // 긴 장식은 칸마다 원 하나
      const cells = cellsOf(p);
      if (p.t === "boost") { this.boosts.push({ x: (p.x + 0.5) * T, z: (p.y + 0.5) * T, off: 0 }); continue; }
      if (!d.r) continue;
      for (const [cx, cy] of k > 1 ? cells : [[p.x, p.y]]) this.solids.push({ x: (cx + 0.5) * T, z: (cy + 0.5) * T, r: d.r * T, box: !!d.box });
    }
    // 높은 도로를 받치는 기둥 (땅 위 차만 부딪힘)
    for (const q of pillarsOf(map)) this.solids.push({ x: q.x, z: q.z, r: 0.9, box: false });
    this.buildSpeedProfile();
  }

  buildSpeedProfile() {
    const { pts, N } = this.track;
    const lim = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      // 앞뒤로 곡률 최댓값
      let k = 0;
      for (let j = -2; j <= 2; j++) k = Math.max(k, Math.abs(pts[(i + j + N) % N].k));
      let v = VMAX;
      if (k > 1e-4) {
        v = 0;
        for (let t = 2; t <= VMAX; t += 0.5) if (t * k <= yawMax(t) * 0.86) v = t;
        v = Math.max(v, 5);
      }
      lim[i] = v;
    }
    // 제동 거리 반영 (뒤로 두 바퀴)
    const dec = 26;
    for (let pass = 0; pass < 2; pass++)
      for (let i = N - 1; i >= 0; i--) {
        const nx = lim[(i + 1) % N];
        const ds = pts[i].ds;
        lim[i] = Math.min(lim[i], Math.sqrt(nx * nx + 2 * dec * ds));
      }
    this.vprof = lim;
  }

  /** 출발 그리드 i번 자리 */
  gridSlot(i) {
    const { pts, N } = this.track;
    const row = Math.floor(i / 2), col = i % 2;
    const back = 7 + row * 6.5 + col * 2.2;
    let idx = 0, acc = 0;
    // 0번 점에서 뒤로 back 만큼
    idx = N;
    while (acc < back) { idx--; acc += pts[((idx % N) + N) % N].ds; }
    idx = ((idx % N) + N) % N;
    const p = pts[idx];
    const nx = -p.tz, nz = p.tx;
    const lat = (col ? 1 : -1) * 2.1;
    return { x: p.x + nx * lat, z: p.z + nz * lat, y: p.y || 0, a: Math.atan2(p.tz, p.tx), idx, P: -acc };
  }

  addCar(o) {
    const slot = this.gridSlot(o.slot ?? this.cars.length);
    const def = carById(o.car);
    const car = {
      seat: o.seat ?? this.cars.length,
      name: o.name || "",
      car: def.id,
      mul: carMul(def),
      kind: o.kind || "ai", // human | ai | remote
      x: slot.x, z: slot.z, y: slot.y, pitch: 0, a: slot.a, vx: 0, vz: 0, steer: 0, thr: 0,
      idx: slot.idx, P: slot.P, lapsDone: 0, lapStart: 0, lapTimes: [], best: null,
      finished: false, finishTime: null, boostT: 0, offroad: false, wrongT: 0, stuckT: 0, revT: 0,
      lane: o.lane ?? 0, laneT: Math.random() * 10, ai: o.ai || null, lostT: 0, lastGood: slot.idx,
      speed: 0,
    };
    this.cars.push(car);
    return car;
  }

  /** 가장 가까운 중심선 점 (idx 주변 창, 못 찾으면 전체) */
  nearest(car, wide) {
    const { pts, N } = this.track;
    let best = car.idx, bd = Infinity;
    const scan = (from, to) => {
      for (let j = from; j <= to; j++) {
        const i = ((car.idx + j) % N + N) % N;
        const p = pts[i];
        let d = (p.x - car.x) ** 2 + (p.z - car.z) ** 2;
        // 전체 탐색에서는 높이가 다른 층(다리 위/아래)을 고르지 않도록
        if (wide) d += ((p.y || 0) - (car.y || 0)) ** 2 * 16;
        if (d < bd) { bd = d; best = i; }
      }
    };
    if (wide) scan(0, N - 1); else scan(-14, 30);
    return { i: best, d: Math.sqrt(bd) };
  }

  updateProgress(car) {
    const { pts, N, L } = this.track;
    let { i, d } = this.nearest(car, false);
    if (d > ROAD_HW + 6) {
      // 창 안에서 못 찾음 → 전체 탐색. 멀리 건너뛴 경우 진행 거리는 인정하지 않음
      const g = this.nearest(car, true);
      if (g.d < ROAD_HW) {
        car.idx = g.i;
        car.lostT = 0;
        car.lastGood = g.i;
      }
      car.lat = g.d;
      car.offroad = true;
      return;
    }
    let ds = pts[i].s - pts[car.idx].s;
    if (ds > L / 2) ds -= L;
    if (ds < -L / 2) ds += L;
    car.P += ds;
    car.idx = i;
    const p = pts[i];
    // 중심선에서의 옆 거리 (부호)
    car.lat = (car.x - p.x) * -p.tz + (car.z - p.z) * p.tx;
    if (p.wall) {
      // 다리·오르막: 난간 밖으로 못 나간다
      const lim = ROAD_HW - CAR_R * 0.7;
      if (Math.abs(car.lat) > lim) {
        const nx = -p.tz, nz = p.tx, sg = Math.sign(car.lat);
        const over = car.lat - sg * lim;
        car.x -= nx * over; car.z -= nz * over;
        const vn = car.vx * nx + car.vz * nz;
        if (vn * sg > 0) { car.vx -= nx * vn * 1.3; car.vz -= nz * vn * 1.3; car.vx *= 0.92; car.vz *= 0.92; car.bump = Math.min(1, Math.abs(vn) / 8); }
        car.lat = sg * lim;
      }
      car.offroad = false;
    } else car.offroad = Math.abs(car.lat) > ROAD_HW;
    // 높이 · 기울기 (중심선 기준)
    const q = pts[(i + 1) % N];
    const u = Math.max(0, Math.min(1, ((car.x - p.x) * p.tx + (car.z - p.z) * p.tz) / (p.ds || 1)));
    car.y = (p.y || 0) + ((q.y || 0) - (p.y || 0)) * u;
    const ya = pts[(i - 2 + N) % N].y || 0, yb = pts[(i + 2) % N].y || 0;
    const fwd = Math.cos(car.a) * p.tx + Math.sin(car.a) * p.tz;
    car.pitch = Math.atan((yb - ya) / 4) * fwd;
    if (!car.offroad) car.lastGood = i;
  }

  respawn(car) {
    const { pts, N } = this.track;
    const i = car.lastGood ?? car.idx;
    const p = pts[i];
    const q = pts[(i + 3) % N];
    car.x = p.x; car.z = p.z; car.y = p.y || 0; car.a = Math.atan2(q.z - p.z, q.x - p.x);
    car.vx = car.vz = 0; car.steer = 0; car.idx = i; car.stuckT = 0; car.revT = 0;
    car.respawnT = 1.2; // 잠깐 다른 차와 부딪히지 않음
  }

  /** 입력 → 물리 (내가 계산하는 차만) */
  drive(car, inp, dt) {
    const m = car.mul;
    const fx = Math.cos(car.a), fz = Math.sin(car.a);
    const rx = -fz, rz = fx;
    let vf = car.vx * fx + car.vz * fz;
    let vl = car.vx * rx + car.vz * rz;
    const boost = car.boostT > 0;
    let vmax = (car.offroad ? GRASS_VMAX : VMAX * m.v) * (boost ? 1.32 : 1) * (inp.cap || 1);
    const thr = inp.thr;
    if (thr > 0) {
      if (vf < vmax) vf += thr * ACC * m.a * (boost ? 1.8 : 1) * Math.max(0.15, 1 - vf / vmax) * dt;
    } else if (thr < 0) {
      if (vf > 0.5) vf = Math.max(0, vf + thr * BRAKE * dt);
      else vf = Math.max(-VREV, vf + thr * ACC * 0.6 * dt);
    } else {
      vf -= Math.sign(vf) * Math.min(Math.abs(vf), COAST * dt);
    }
    if (vf > vmax) vf -= (vf - vmax) * (car.offroad ? 2.2 : 1.2) * dt;
    const grip = car.offroad ? 5 : 9.5;
    vl *= Math.exp(-grip * dt);
    // 조향 (입력을 부드럽게)
    const ts = Math.max(-1, Math.min(1, inp.steer));
    car.steer += (ts - car.steer) * Math.min(1, dt * 9);
    const yaw = car.steer * yawMax(vf, m.h) * Math.sign(vf || 1);
    car.a += yaw * dt;
    const nfx = Math.cos(car.a), nfz = Math.sin(car.a);
    car.vx = nfx * vf + -nfz * vl;
    car.vz = nfz * vf + nfx * vl;
    car.x += car.vx * dt;
    car.z += car.vz * dt;
    car.thr = thr;
    if (car.boostT > 0) car.boostT -= dt;
  }

  collide(dt) {
    const W = this.map.w * T, H = this.map.h * T;
    const local = this.cars.filter((c) => c.kind !== "remote");
    for (const c of local) {
      // 맵 가장자리
      const r = CAR_R;
      if (c.x < r) { c.x = r; c.vx = Math.abs(c.vx) * 0.3; }
      if (c.z < r) { c.z = r; c.vz = Math.abs(c.vz) * 0.3; }
      if (c.x > W - r) { c.x = W - r; c.vx = -Math.abs(c.vx) * 0.3; }
      if (c.z > H - r) { c.z = H - r; c.vz = -Math.abs(c.vz) * 0.3; }
      // 장식물·기둥 (땅 위에서만)
      if ((c.y || 0) > 1.5) continue;
      for (const s of this.solids) {
        const dx = c.x - s.x, dz = c.z - s.z;
        const rr = s.r + r;
        if (Math.abs(dx) > rr || Math.abs(dz) > rr) continue;
        let nx, nz, pen;
        if (s.box) {
          // 정사각 상자
          const ox = rr - Math.abs(dx), oz = rr - Math.abs(dz);
          if (ox < oz) { nx = Math.sign(dx) || 1; nz = 0; pen = ox; } else { nx = 0; nz = Math.sign(dz) || 1; pen = oz; }
        } else {
          const d = Math.hypot(dx, dz);
          if (d >= rr) continue;
          nx = dx / (d || 1); nz = dz / (d || 1); pen = rr - d;
        }
        c.x += nx * pen; c.z += nz * pen;
        const vn = c.vx * nx + c.vz * nz;
        if (vn < 0) { c.vx -= vn * nx * 1.4; c.vz -= vn * nz * 1.4; c.vx *= 0.8; c.vz *= 0.8; c.bump = 1; }
      }
    }
    // 차끼리
    for (let i = 0; i < this.cars.length; i++) for (let j = i + 1; j < this.cars.length; j++) {
      const a = this.cars[i], b = this.cars[j];
      if (a.kind === "remote" && b.kind === "remote") continue;
      if (a.respawnT > 0 || b.respawnT > 0 || a.finishedHidden || b.finishedHidden) continue;
      if (Math.abs((a.y || 0) - (b.y || 0)) > 2.5) continue; // 다리 위·아래는 부딪히지 않음
      const dx = b.x - a.x, dz = b.z - a.z;
      const d = Math.hypot(dx, dz);
      const rr = CAR_R * 2;
      if (d >= rr || d === 0) continue;
      const nx = dx / d, nz = dz / d, pen = rr - d;
      const am = a.kind === "remote" ? 0 : b.kind === "remote" ? 1 : 0.5;
      const bm = a.kind === "remote" ? 1 : b.kind === "remote" ? 0 : 0.5;
      a.x -= nx * pen * am; a.z -= nz * pen * am;
      b.x += nx * pen * bm; b.z += nz * pen * bm;
      const rv = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
      if (rv < 0) {
        const imp = -rv * 0.6;
        a.vx -= nx * imp * am * 2; a.vz -= nz * imp * am * 2;
        b.vx += nx * imp * bm * 2; b.vz += nz * imp * bm * 2;
        a.bump = b.bump = Math.min(1, imp / 6);
      }
    }
  }

  pickups(dt) {
    for (const b of this.boosts) if (b.off > 0) b.off -= dt;
    for (const c of this.cars) {
      if (c.kind === "remote") continue;
      for (const b of this.boosts) {
        if (b.off > 0) continue;
        if ((c.y || 0) < 1.5 && (c.x - b.x) ** 2 + (c.z - b.z) ** 2 < 3.2 * 3.2) { b.off = 5; c.boostT = 1.6; c.gotBoost = true; }
      }
    }
  }

  /** 랩·완주 판정 */
  laps_(car) {
    const L = this.track.L;
    const done = Math.max(0, Math.floor(car.P / L));
    while (car.lapsDone < done && !car.finished) {
      car.lapsDone++;
      const t = this.time - car.lapStart;
      car.lapTimes.push(t);
      car.lapStart = this.time;
      if (car.best === null || t < car.best) car.best = t;
      car.lapEvent = true;
      if (car.lapsDone >= this.laps) { car.finished = true; car.finishTime = this.time; }
    }
  }

  step(dt, inputs) {
    this.time += dt;
    for (const car of this.cars) {
      if (car.kind === "remote") continue;
      if (car.respawnT > 0) car.respawnT -= dt;
      let inp;
      if (car.finished) inp = car.kind === "human" ? { thr: 0, steer: 0 } : aiControl(this, car, dt, 0.6);
      else if (car.kind === "ai") inp = aiControl(this, car, dt);
      else inp = inputs[car.seat] || { thr: 0, steer: 0 };
      this.drive(car, inp, dt);
    }
    this.collide(dt);
    this.pickups(dt);
    for (const car of this.cars) {
      if (car.kind === "remote") continue;
      this.updateProgress(car);
      if (!car.finished) this.laps_(car);
      car.speed = Math.hypot(car.vx, car.vz);
      // 역주행
      const p = this.track.pts[car.idx];
      const fwd = Math.cos(car.a) * p.tx + Math.sin(car.a) * p.tz;
      const vdot = car.vx * p.tx + car.vz * p.tz;
      car.wrongT = vdot < -2 && fwd < -0.2 ? car.wrongT + dt : 0;
    }
  }

  /** 순위: 완주 시간 → 진행 거리 */
  ranking() {
    return [...this.cars].sort((a, b) => {
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.P - a.P;
    });
  }
}

/** AI 조종 — 반환 {thr, steer} */
export function aiControl(w, car, dt, slow) {
  const { pts, N } = w.track;
  const ai = car.ai || { skill: 0.9, corner: 0.9 };
  const v = car.vx * Math.cos(car.a) + car.vz * Math.sin(car.a);
  // 막힘 처리
  if (car.revT > 0) {
    car.revT -= dt;
    const p = pts[(car.idx + 6) % N];
    const ang = angDiff(Math.atan2(p.z - car.z, p.x - car.x), car.a);
    return { thr: -1, steer: -Math.sign(ang) };
  }
  if (Math.abs(v) < 1.5 && w.time > 1) {
    car.stuckT += dt;
    if (car.stuckT > 1.6) { car.stuckT = 0; car.revT = 1.0; car.stuckN = (car.stuckN || 0) + 1; if (car.stuckN >= 3) { car.stuckN = 0; w.respawn(car); } }
  } else { car.stuckT = 0; if (Math.abs(v) > 8) car.stuckN = 0; }
  if (car.offroad && Math.abs(car.lat || 0) > ROAD_HW + 12) { car.lostT = (car.lostT || 0) + dt; if (car.lostT > 3) { car.lostT = 0; w.respawn(car); } }

  // 라인: 천천히 바뀌는 옆 위치 + 앞차 피하기
  car.laneT += dt;
  let lane = car.lane * ROAD_HW * 0.55 + Math.sin(car.laneT * 0.23 + car.seat) * 0.8;
  const fx = Math.cos(car.a), fz = Math.sin(car.a);
  for (const o of w.cars) {
    if (o === car) continue;
    const dx = o.x - car.x, dz = o.z - car.z;
    const fwd = dx * fx + dz * fz;
    if (fwd < 0 || fwd > 9) continue;
    const side = dx * -fz + dz * fx;
    if (Math.abs(side) < 2.6) { lane += side > 0 ? -2.4 : 2.4; break; }
  }
  lane = Math.max(-ROAD_HW + 1.6, Math.min(ROAD_HW - 1.6, lane));
  const look = Math.round(Math.max(6, Math.min(20, 5 + Math.abs(v) * 0.42)));
  const tp = pts[(car.idx + look) % N];
  const tx = tp.x + -tp.tz * lane, tz = tp.z + tp.tx * lane;
  const ang = angDiff(Math.atan2(tz - car.z, tx - car.x), car.a);
  const steer = Math.max(-1, Math.min(1, ang * 2.6));
  // 목표 속도
  let vt = Infinity;
  for (let j = 0; j < 4; j++) vt = Math.min(vt, w.vprof[(car.idx + 2 + j * 3) % N]);
  vt = Math.min(VMAX * car.mul.v * ai.skill, vt * ai.corner * (0.92 + 0.08 * car.mul.h));
  if (slow) vt *= slow;
  if (ai.rubber) vt *= ai.rubber;
  let thr = v < vt - 0.5 ? 1 : v > vt + 1.5 ? -0.7 : 0.3;
  if (Math.abs(ang) > 1.2 && v > 8) thr = -0.5;
  return { thr, steer };
}

export function angDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}
