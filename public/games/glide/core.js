// 윈드 러너 — 비행 물리 · 링 · 강화 · 경제 (DOM 없음, node 에서도 돌아감)
// 좌표: d = 앞으로 간 거리(m), y = 고도(m), lat = 옆 위치(m)
export const G = 9.8, K0 = 0.0021, M0 = 210;   // 공기 저항 K·V², 유도 저항 M/V²
export const STALL = 9, VMAX = 75, GOAL = 10000;
export const PACE = 2.2;
export const ISLE = { d: GOAL + 300, top: 90, w: 520 };   // 도착 하늘 섬: 결승선(10km) 너머 300m, 윗면 고도 90m   // 화면 진행 배속 — 물리는 그대로, 시간이 1.5배 빨리 흐름 (화면 속도 표시도 ×PACE)
export const RING = { boost: 16, climb: 22, r: 9, startAlt: 140, fade: 900, gap: 0.1 };   // 멀리 갈수록 링 힘이 약해지고(fade) 간격이 넓어짐(gap)
export const ringFade = (d) => 1 / (1 + d / RING.fade);
export function tune(o) { Object.assign(RING, o.RING || {}); }

// ---------- 강화 · 글라이더 ----------
export const UPS = [
  { id: 'wing', name: '날개', icon: 0, base: 100, max: 15, desc: (l) => `공기 저항 ${Math.round((1 - Math.pow(0.94, l)) * 100)}% 감소` },
  { id: 'ramp', name: '점프대 높이', icon: 1, base: 150, max: 12, desc: (l) => `시작 고도 ${200 + l * 20}m` },
  { id: 'ringpow', name: '링 추진력', icon: 2, base: 120, max: 10, desc: (l) => `링 가속·상승 +${l * 12}%` },
  { id: 'magnet', name: '링 자석', icon: 3, base: 80, max: 10, desc: (l) => `링 판정 반경 ${(9 + l * 0.8).toFixed(1)}m` },
  { id: 'rocket', name: '로켓 부스터', icon: 4, base: 500, max: 10, desc: (l) => l ? `연료 ${(1.5 + (l - 1) * 0.6).toFixed(1)}초` : '버튼을 눌러 추진' },
  { id: 'armor', name: '기체 강도', icon: 5, base: 1500, max: 3, desc: (l) => `충돌해도 ${l}번 튕겨 오름` },
];
export const upCost = (s, k) => Math.round(UPS[k].base * Math.pow(1.6, s.lv[UPS[k].id] || 0));
export const GLIDERS = [
  { id: 'wood', name: '나무 글라이더', price: 0, drag: 1.00, desc: '처음 받은 손때 묻은 글라이더' },
  { id: 'cloth', name: '하늘 천 글라이더', price: 3000, drag: 0.85, desc: '가벼운 천 날개로 더 멀리' },
  { id: 'leather', name: '붉은 가죽 날개', price: 15000, drag: 0.72, ring: 1, desc: '링 판정 +1m' },
  { id: 'metal', name: '은빛 금속 날개', price: 60000, drag: 0.60, armor: 1, desc: '기체 강도 +1' },
  { id: 'dragon', name: '비취 용 날개', price: 250000, drag: 0.50, ringpow: 0.3, desc: '링 추진력 +30%' },
];
export const REGIONS = [
  { id: 'canyon', name: '붉은 협곡', from: 0 },
  { id: 'snow', name: '눈 덮인 산맥', from: 3000 },
  { id: 'sea', name: '푸른 바다', from: 6000 },
  { id: 'isle', name: '하늘 섬', from: GOAL },
];
export const regionAt = (d) => { let r = 0; for (let i = 0; i < REGIONS.length; i++) if (d >= REGIONS[i].from) r = i; return r; };

// 이번 판의 능력치
export function stats(s) {
  const L = (k) => s.lv[k] || 0, gl = GLIDERS.find((g) => g.id === s.glider) || GLIDERS[0];
  const drag = Math.pow(0.94, L('wing')) * gl.drag;
  return {
    K: K0 * drag, M: M0 * drag,
    startY: 200 + L('ramp') * 20,
    ringPow: 1 + L('ringpow') * 0.12 + (gl.ringpow || 0),
    ringR: RING.r + L('magnet') * 0.8 + (gl.ring || 0),
    fuel: L('rocket') ? 1.5 + (L('rocket') - 1) * 0.6 : 0,
    armor: L('armor') + (gl.armor || 0),
  };
}

// ---------- 지형 ----------
const mesas = [];
export function terrainSeed(seed) {
  mesas.length = 0; let s = seed >>> 0; const R = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let d = 500; d < GOAL - 300; d += 240 + R() * 480) {
    const reg = regionAt(d);
    mesas.push({ d, w: 60 + R() * 120, h: reg === 2 ? 25 + R() * 45 : 35 + R() * 80, lat: (R() - .5) * 280, reg });
  }
  return { mesas };
}
export const mesaList = () => mesas;
export function baseGround(d) { return regionAt(d) === 2 ? 0 : 6 * Math.sin(d * .013) + 4 * Math.sin(d * .031 + 1); }
export function ground(d, lat = 0, flat = false) {   // flat = 2D: 길 위(옆 위치가 가까운) 바위산만
  const reg = regionAt(d);
  let h = reg === 2 ? 0 : 6 * Math.sin(d * .013) + 4 * Math.sin(d * .031 + 1);
  for (const m of mesas) {
    if (Math.abs(d - m.d) > m.w || (flat ? Math.abs(m.lat) > m.w * .8 : Math.abs(lat - m.lat) > m.w * .8)) continue;
    const mh = flat ? m.h * 0.32 : m.h;   // 2D는 옆으로 못 피하니 바위산을 낮게 (보고 기수를 들면 넘을 수 있게)
    const t = Math.abs(d - m.d) / m.w; h = Math.max(h, t < .75 ? mh : mh * (1 - (t - .75) / .25));
  }
  return h;
}

// ---------- 비행 ----------
export function newFlight(s, opt = {}) {
  const st = stats(s);
  return { st, flat: !!opt.flat, rr: st.ringR * (opt.flat ? 1.3 : 1), d: 0, y: st.startY, lat: 0, v: 30, a: 0.12, yaw: 0, t: 0, liftT: 0, boostT: 0, rings: [], nextRing: 0, coinRows: [], nextCoin: 250, got: 0, picked: 0,
    fuel: st.fuel + (opt.adFuel ? 3 : 0), fuelMax: st.fuel + (opt.adFuel ? 3 : 0), rocketOn: false, armor: st.armor, bounces: 0, stall: 0, over: false, crashed: false, maxY: st.startY };
}
// input: { pitch: 목표 기수각, turn: -1~1, rocket: bool }
export function step(f, input, dt) {
  if (f.over) return;
  const st = f.st; f.t += dt;
  let target = input.pitch;
  if (f.liftT > 0) target = Math.max(target, 0.42);
  if (f.v < STALL) { target = Math.min(target, -0.55); f.stall = Math.min(1, f.stall + dt * 2); } else f.stall = Math.max(0, f.stall - dt);
  f.a += (target - f.a) * Math.min(1, dt * 2.6);
  const drag = st.K * f.v * f.v + st.M / Math.max(25, f.v * f.v);
  f.rocketOn = !!input.rocket && f.fuel > 0;
  let thrust = (f.boostT > 0 ? 14 : 0);
  if (f.rocketOn) { thrust += 22; f.fuel = Math.max(0, f.fuel - dt / PACE); }   // 연료는 실제 초 기준
  f.v += (-G * Math.sin(f.a) - drag + thrust) * dt;
  f.v = Math.max(4, Math.min(VMAX, f.v));
  f.boostT = Math.max(0, f.boostT - dt);
  if (!f.flat) f.yaw += (input.turn || 0) * 0.9 * dt * Math.min(1, f.v / 20);
  f.yaw = Math.max(-1.2, Math.min(1.2, f.yaw));
  const h = f.v * Math.cos(f.a);
  f.d += h * Math.cos(f.yaw) * dt; f.lat += h * Math.sin(f.yaw) * dt;
  f.y += f.v * Math.sin(f.a) * dt;
  if (f.rocketOn) f.y += 6 * dt;
  if (f.liftT > 0) { f.y += RING.climb * (f.ringE || 1) * (f.liftT / 1.8) * dt; f.liftT -= dt; }
  f.maxY = Math.max(f.maxY, f.y);
  // 링 만들기
  if (f.y < RING.startAlt && f.d > f.nextRing && f.d < GOAL - 200) {
    const ahead = 140 + f.v * 4;
    const rd = f.d + ahead * Math.cos(f.yaw), rl = f.flat ? 0 : f.lat + ahead * Math.sin(f.yaw) + (Math.random() - .5) * 50;
    const gr = ground(rd, rl, f.flat), ry = Math.max(gr + 14, f.y - ahead * 0.2 + (Math.random() - .6) * 24);
    if (gr > 8 && ry > f.y - 5) f.nextRing = f.d + 40;   // 바위산 위라 닿기 힘든 자리 → 조금 뒤에 다시
    else { f.rings.push({ d: rd, lat: rl, y: ry, yaw: f.yaw, hit: false, miss: false }); f.nextRing = rd + 90 + Math.random() * 120 + rd * RING.gap; }
  }
  for (const r of f.rings) {
    if (r.hit || r.miss) continue;
    const dd = f.d - r.d;
    if (Math.abs(dd) < Math.max(3, f.v * dt * 1.2)) {
      if (Math.hypot(f.y - r.y, f.lat - r.lat) < f.rr) {
        r.hit = true; f.got++; const e = st.ringPow * ringFade(r.d); f.ringE = e; f.v = Math.min(VMAX, f.v + RING.boost * e); f.boostT = 0.9; f.liftT = 1.8; f.a = Math.max(f.a, 0.3);
      }
    } else if (dd > 5) r.miss = true;
  }
  f.rings = f.rings.filter((r) => r.d > f.d - 150);
  // 하늘 코인: 지금 날아가는 방향·활강 경로 앞에 한 줄로 (지나간 줄은 지움)
  if (f.d > f.nextCoin && f.d < GOAL - 300) {
    const ahead = 110 + f.v * 3, slope = Math.min(0.25, Math.max(0.05, -Math.tan(Math.min(0, f.a)) || 0.12));
    const cd = f.d + ahead * Math.cos(f.yaw), cl = f.lat + ahead * Math.sin(f.yaw), cy = Math.max(ground(cd, cl, f.flat) + 10, f.y - ahead * slope);
    f.coinRows.push({ d: cd, lat: cl, y: cy, yaw: f.yaw, slope, flat: f.flat, n: 6 + Math.floor(Math.random() * 4), got: 0 });
    f.nextCoin = cd + 200 + Math.random() * 250;
  }
  for (const c of f.coinRows) for (let i = 0; i < c.n; i++) {
    if (c.got & (1 << i)) continue; const p = coinPos(c, i);
    if (Math.abs(p.d - f.d) < Math.max(3, f.v * dt * 1.2) && Math.hypot(f.y - p.y, f.lat - p.lat) < (4.5 + st.ringR * 0.25) * (f.flat ? 1.8 : 1)) { c.got |= 1 << i; f.picked++; }
  }
  f.coinRows = f.coinRows.filter((c) => coinPos(c, c.n - 1).d > f.d - 100);
  // 도착 / 충돌
  if (f.d >= GOAL) { f.over = true; f.goal = true; return; }
  const gh = ground(f.d, f.lat, f.flat);
  // 2D: 바위산에 부딪히면 끝나지 않고 속도를 잃으며 위로 튕김 (바닥에 닿아야 끝)
  if (f.flat && f.y <= gh && gh > baseGround(f.d) + 3 && gh - f.y < 12) {   // 윗부분을 스치면 튕김, 정면으로 박으면 끝
    f.y = gh + 2; f.v = Math.max(11, f.v * 0.5); f.a = 0.05; f.bumps = (f.bumps || 0) + 1; return; }
  if (f.y <= gh) {
    if (f.armor > 0) { f.armor--; f.bounces++; f.y = gh + 2; f.a = 0.35; f.liftT = 1.2; f.ringE = 1; f.v = Math.max(f.v, 24); return; }
    f.y = gh; f.over = true; f.crashed = true;
  }
}
// 코인 줄의 i번째 위치 (줄은 지나가는 방향으로 7m 간격, 활강 기울기만큼 내려감)
export function coinPos(c, i) { const s = i * 7, w = c.flat ? 0 : Math.sin(i * .9) * 2.5; return { d: c.d + s * Math.cos(c.yaw), lat: c.lat + s * Math.sin(c.yaw) + w, y: c.y - s * c.slope + (c.flat ? 0 : Math.cos(i * .9) * 1.5) }; }   // 3D는 살짝 물결치게 (뒤에서 봐도 줄로 보이게)
// 이어하기 (광고)
export function revive(f) { f.over = false; f.crashed = false; f.y += 60; f.v = Math.max(f.v, 28); f.a = 0.2; f.liftT = 1.2; }
// 판 정산
export function payout(f, best) {
  const dist = Math.floor(Math.max(0, Math.min(GOAL, f.d))), ringC = f.got * 25, coinC = f.picked * 5;
  let total = dist + ringC + coinC; const record = dist > best;
  if (record) total = Math.round(total * 1.2);
  return { dist, ringC, coinC, record, total };
}

// ---------- 저장 ----------
export function newSave() { return { v: 1, coins: 0, best: 0, lv: {}, owned: ['wood'], glider: 'wood', flights: 0, total: 0, goal: false, tut: 0, at: Date.now() }; }
