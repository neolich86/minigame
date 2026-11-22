// 미사일 배틀 — 규칙·물리·AI (DOM 없음, node 에서도 돌아감)
// 왼쪽 = 내 기지(0), 오른쪽 = 적 기지(1). 차례로 한 발씩 쏜다.
// 미사일이 하늘의 배수 구역(x2, x5, +10 …)을 지나면 그 수만큼 늘어난다. 상대 기지 체력을 0으로 만들면 승리.

export const W = 2600, H = 1500, G = 620, VMAX = 1250;
export const BASE_W = 230, BASE_H = 170;
export const MAX_LIVE = 360;      // 화면에 실제로 그리는 미사일 수 상한 (넘으면 한 발이 여러 발 몫을 맡는다)

// ---------- 난수 ----------
export function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// ---------- 스테이지 ----------
// n: 1부터. 언덕 높이·배수 구역 배치·적 체력·적 조준 실력이 스테이지마다 달라진다.
export function makeStage(n) {
  // 양쪽이 비슷하게 유리한 배치가 나올 때까지 다시 만든다 (한쪽만 큰 배수를 쉽게 노리면 불공평)
  let st = null;
  for (let tr = 0; tr < 8; tr++) { st = makeStageTry(n, tr); if (st.ratio > 0.55 && st.ratio < 1.8) break; }
  return st;
}
function makeStageTry(n, tr) {
  const r = rng(n * 7919 + 13 + tr * 104729);
  const hill = 520 + Math.min(420, n * 28) + r() * 120;        // 가운데 언덕 높이(바닥에서)
  const hillW = 330 + r() * 120;
  const floor = 1300;                                            // 기지가 놓인 바닥 높이(y)
  // 지형: 0..W 를 10px 간격으로 높이를 미리 계산
  const ground = new Float32Array(Math.ceil(W / 10) + 1);
  const bumps = [];
  for (let i = 0; i < 3; i++) bumps.push({ x: 600 + r() * 1400, h: 40 + r() * 90, w: 140 + r() * 160 });
  for (let i = 0; i < ground.length; i++) {
    const x = i * 10; let y = floor;
    const d = (x - W / 2) / hillW; y -= hill * Math.exp(-d * d * 1.6) * (1 + 0.18 * Math.sin(x * 0.011));
    for (const b of bumps) { const e = (x - b.x) / b.w; y -= b.h * Math.exp(-e * e); }
    // 기지 자리는 평평하게
    if (x < 420 || x > W - 420) y = floor;
    else if (x < 560) y = floor + (y - floor) * ((x - 420) / 140);
    else if (x > W - 560) y = floor + (y - floor) * ((W - 420 - x) / 140);
    ground[i] = y;
  }
  // 배수 구역: 왼쪽·오른쪽에서 쏴도 쓸 수 있게 대체로 좌우 대칭, 위아래로 천천히 움직이는 것도 있다
  const gates = [];
  const kinds = n < 3 ? [['x', 2], ['x', 3], ['x', 5], ['+', 10]] : n < 7 ? [['x', 2], ['x', 3], ['x', 5], ['x', 10], ['+', 20], ['÷', 2]] : [['x', 2], ['x', 3], ['x', 5], ['x', 10], ['+', 30], ['÷', 2], ['x', 20]];
  const pick = () => kinds[Math.floor(r() * kinds.length)];
  const pairs = 2 + Math.min(2, Math.floor(n / 3));
  for (let i = 0; i < pairs; i++) {
    const [op, v] = pick(), x = 620 + r() * 520, y = 260 + r() * 620, h = 150 + r() * 70, move = n >= 2 && r() < 0.45 ? 60 + r() * 120 : 0, sp = 0.6 + r() * 0.8, ph = r() * 6.28;
    gates.push({ x, y, w: 44, h, op, v, move, sp, ph });
    gates.push({ x: W - x - 44, y, w: 44, h, op, v, move, sp, ph: ph + 1.4 });
  }
  // 언덕 꼭대기 위 큰 구역 하나 (쏠 각도가 높아야 지난다)
  const top = H - (floor - hill) > 0 ? floor - hill : 200;
  gates.push({ x: W / 2 - 22, y: Math.max(80, top - 360 - r() * 140), w: 44, h: 170, op: 'x', v: n < 4 ? 10 : n < 8 ? 20 : 30, move: 70, sp: 0.5 + r() * 0.4, ph: r() * 6.28 });
  const st = { n, ground, floor, gates, hill, bases: [{ x: 150, side: 0, hp: 1, max: 1 }, { x: W - 150 - BASE_W, side: 1, hp: 1, max: 1 }], aiErr: Math.max(0.035, 0.15 - n * 0.01) };
  // 체력은 '잘 쏜 한 발'의 피해에 맞춘다: 적 기지는 잘 쏜 한 발로 약 4~6번, 내 기지는 그보다 넉넉하게
  // 실제로(미사일이 갈라지는 것까지) 쏴 본 피해로 맞춘다: 궤적이 좋은 조준 몇 개를 여러 시점에 쏴서 평균
  const best = (side) => {
    const cands = [];
    for (let a = 18; a <= 82; a += 2) for (let p = 0.45; p <= 1.0001; p += 0.025) { const r = trace(st, side, a, p, 1); if (r.hit) cands.push({ a, p, w: r.w }); }
    if (!cands.length) return 1;
    cands.sort((x, y) => y.w - x.w); const top = cands.slice(0, 4), res = [];
    for (const c of top) for (const t0 of [0, 1.7, 3.4]) res.push(simShot(st, side, c.a, c.p, t0));
    res.sort((x, y) => y - x); const k = Math.max(1, Math.floor(res.length / 2)); return Math.max(1, res.slice(0, k).reduce((x, y) => x + y, 0) / k);
  };
  const b0 = best(0), b1 = best(1); st.ratio = b1 / b0;
  const shots = 2.6 + Math.min(1.6, n * 0.12), eHp = Math.max(30, Math.round(b0 * shots)), mHp = Math.max(30, Math.round(b1 * (shots + (n <= 3 ? 3 : n <= 8 ? 2.2 : 1.5))));
  st.bases[0].hp = st.bases[0].max = mHp; st.bases[1].hp = st.bases[1].max = eHp;
  return st;
}

export function groundY(st, x) { if (x <= 0) return st.ground[0]; if (x >= W) return st.ground[st.ground.length - 1]; const i = x / 10, a = Math.floor(i), t = i - a; return st.ground[a] * (1 - t) + st.ground[Math.min(st.ground.length - 1, a + 1)] * t; }
export function gateY(g, t) { return g.y + (g.move ? Math.sin(t * g.sp + g.ph) * g.move : 0); }
export function launchPoint(st, side) { const b = st.bases[side]; return { x: b.x + BASE_W / 2 + (side ? -40 : 40), y: st.floor - BASE_H - 30 }; }
// angle: 0..90 (도), 0 = 수평. power: 0..1. 왼쪽 기지는 오른쪽으로, 오른쪽 기지는 왼쪽으로 쏜다.
export function launchVel(side, angle, power) { const a = angle * Math.PI / 180, v = VMAX * (0.35 + 0.65 * power); return { vx: (side ? -1 : 1) * Math.cos(a) * v, vy: -Math.sin(a) * v }; }

// 한 발을 실제로 쏴 보고 상대 기지에 들어간 피해를 돌려준다 (스테이지 체력 맞추기용)
export function simShot(st, side, angle, power, t0) {
  const tmp = { ...st, bases: st.bases.map((b) => ({ ...b, hp: 1e12, max: 1e12 })) };
  const m = { st: tmp, t: t0, missiles: [], side: 0, flying: false, total: 0, peak: 0, hits: [0, 0], events: [], over: -1, shot: 0, seq: 0 };
  fire(m, side, angle, power); let i = 0; while (m.flying && i++ < 900) step(m, 1 / 60);
  return m.hits[side ? 0 : 1];
}

// ---------- 한 판 ----------
export function newMatch(n) { return { st: makeStage(n), t: 0, missiles: [], side: 0, flying: false, total: 0, peak: 0, hits: [0, 0], events: [], over: -1, shot: 0, seq: 0 }; }

export function fire(m, side, angle, power) {
  const p = launchPoint(m.st, side), v = launchVel(side, angle, power);
  m.missiles = [{ id: ++m.seq, x: p.x, y: p.y, vx: v.vx, vy: v.vy, w: 1, side, passed: 0, born: m.t, dead: false }];
  m.flying = true; m.side = side; m.total = 1; m.peak = 1; m.hits = [0, 0]; m.shot++;
  m.events.push({ type: 'launch', side, x: p.x, y: p.y });
}

function applyGate(m, ms, g, gi) {
  ms.passed |= (1 << gi);
  let add = 0;
  if (g.op === 'x') add = ms.w * (g.v - 1);
  else if (g.op === '+') add = g.v;
  else if (g.op === '÷') { const keep = Math.max(1, Math.round(ms.w / g.v)); m.total -= ms.w - keep; ms.w = keep; m.events.push({ type: 'gate', x: ms.x, y: ms.y, g: gi, op: g.op, v: g.v }); return; }
  if (add <= 0) return;
  m.total += add; m.peak = Math.max(m.peak, m.total);
  // 새로 생긴 몫을 몇 발로 나눠 그릴지 (상한 MAX_LIVE)
  const live = m.missiles.filter((o) => !o.dead).length;
  const room = Math.max(0, MAX_LIVE - live), bodies = Math.min(room, Math.round(add));
  if (bodies <= 0) { ms.w += add; }
  else {
    const per = add / bodies;
    for (let k = 0; k < bodies; k++) {
      const sp = Math.hypot(ms.vx, ms.vy), a = Math.atan2(ms.vy, ms.vx) + (Math.random() - 0.5) * 0.16, s = sp * (0.93 + Math.random() * 0.12);
      m.missiles.push({ id: ++m.seq, x: ms.x + (Math.random() - 0.5) * 10, y: ms.y + (Math.random() - 0.5) * g.h * 0.6, vx: Math.cos(a) * s, vy: Math.sin(a) * s, w: per, side: ms.side, passed: ms.passed, born: m.t, dead: false });
    }
  }
  m.events.push({ type: 'gate', x: ms.x, y: ms.y, g: gi, op: g.op, v: g.v });
}

export function step(m, dt) {
  m.t += dt;
  if (!m.flying) return;
  const st = m.st;
  for (const ms of m.missiles) {
    if (ms.dead) continue;
    const ox = ms.x, oy = ms.y;
    ms.vy += G * dt; ms.x += ms.vx * dt; ms.y += ms.vy * dt;
    // 배수 구역 통과 (선분이 구역의 세로 막대를 가로지르면)
    for (let gi = 0; gi < st.gates.length; gi++) {
      if (ms.passed & (1 << gi)) continue;
      const g = st.gates[gi], gx = g.x + g.w / 2;
      if ((ox - gx) * (ms.x - gx) > 0) continue;
      const k = (gx - ox) / ((ms.x - ox) || 1e-6), yy = oy + (ms.y - oy) * k, gy = gateY(g, m.t);
      if (yy >= gy && yy <= gy + g.h) applyGate(m, ms, g, gi);
    }
    // 기지 명중
    for (const b of st.bases) {
      if (b.side === ms.side) continue;
      if (ms.x > b.x && ms.x < b.x + BASE_W && ms.y > st.floor - BASE_H && ms.y < st.floor) {
        ms.dead = true; const dmg = ms.w; b.hp = Math.max(0, b.hp - dmg); m.hits[b.side] += dmg;
        m.events.push({ type: 'hit', x: ms.x, y: ms.y, side: b.side, dmg }); break;
      }
    }
    if (ms.dead) continue;
    // 땅·화면 밖
    if (ms.y >= groundY(st, ms.x)) { ms.dead = true; m.events.push({ type: 'boom', x: ms.x, y: groundY(st, ms.x), w: ms.w }); }
    else if (ms.x < -200 || ms.x > W + 200 || ms.y > H + 200) ms.dead = true;
  }
  if (m.missiles.length > MAX_LIVE * 2) m.missiles = m.missiles.filter((o) => !o.dead);
  if (!m.missiles.some((o) => !o.dead)) {
    m.flying = false;
    const [a, b] = st.bases;
    m.events.push({ type: 'land', side: m.side, dmg: m.hits[m.side ? 0 : 1], peak: m.peak });
    if (b.hp <= 0) m.over = 0; else if (a.hp <= 0) m.over = 1;
  }
}

// ---------- 적 조준 ----------
// 여러 각도·세기로 한 발짜리 궤적을 미리 그려 보고, 지나는 배수 구역의 효과를 계산해 가장 아픈 것을 고른다. 실력만큼 오차를 섞는다.
export function trace(st, side, angle, power, t0, maxT = 6) {
  const p = launchPoint(st, side), v = launchVel(side, angle, power);
  let x = p.x, y = p.y, vx = v.vx, vy = v.vy, t = t0, w = 1, passed = 0; const dt = 1 / 60;
  for (let i = 0; i < maxT * 60; i++) {
    const ox = x, oy = y; vy += G * dt; x += vx * dt; y += vy * dt; t += dt;
    for (let gi = 0; gi < st.gates.length; gi++) {
      if (passed & (1 << gi)) continue; const g = st.gates[gi], gx = g.x + g.w / 2;
      if ((ox - gx) * (x - gx) > 0) continue; const yy = oy + (y - oy) * ((gx - ox) / ((x - ox) || 1e-6)), gy = gateY(g, t);
      if (yy >= gy && yy <= gy + g.h) { passed |= 1 << gi; w = g.op === 'x' ? w * g.v : g.op === '+' ? w + g.v : Math.max(1, Math.round(w / g.v)); }
    }
    const b = st.bases[side ? 0 : 1];
    if (x > b.x && x < b.x + BASE_W && y > st.floor - BASE_H && y < st.floor) return { hit: true, w, x, y, t };
    if (y >= groundY(st, x) || x < -200 || x > W + 200) return { hit: false, w, x, y, t, miss: Math.abs(x - (b.x + BASE_W / 2)) };
  }
  return { hit: false, w, x, y, t, miss: 9999 };
}
export function aiShot(m, rnd = Math.random) {
  const st = m.st; let best = null;
  for (let a = 18; a <= 82; a += 2) for (let p = 0.45; p <= 1.0001; p += 0.025) {
    const r = trace(st, 1, a, p, m.t + 0.9);
    const score = r.hit ? r.w * 100 : -r.miss + r.w;     // 맞히는 것이 우선, 그다음 많이 늘어나는 것
    if (!best || score > best.score) best = { a, p, score, r };
  }
  const e = st.aiErr;
  return { angle: best.a + (rnd() - 0.5) * 2 * e * 40, power: Math.min(1, Math.max(0.3, best.p + (rnd() - 0.5) * 2 * e)) };
}
