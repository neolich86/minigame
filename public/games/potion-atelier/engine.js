/* 포션 공방 — 퍼즐 엔진 (규칙 · 판 생성 · 최단 풀이)
 * 병 = 문자열 (아래 → 위), 칸 하나 = 글자 하나.
 * 기본색 R(빨강) B(파랑) Y(노랑) / 섞은 색 P(보라) O(주황) G(초록) / X(탁한 갈색, 실패 액체)
 * 브라우저에서는 window.PotionEngine, node 에서는 module.exports.
 */
(function (root) {
  'use strict';
  const CAP = 4;
  const BASE = ['R', 'B', 'Y'];
  const MIXED = ['P', 'O', 'G'];
  const MIX = { RB: 'P', BR: 'P', RY: 'O', YR: 'O', BY: 'G', YB: 'G' };
  const RECIPE = { P: ['R', 'B'], O: ['R', 'Y'], G: ['B', 'Y'] };

  function mix(a, b) { return a === b ? a : MIX[a + b] || 'X'; }
  const top = (t) => t[t.length - 1];
  function run(t) { if (!t) return 0; const c = top(t); let n = 0; for (let i = t.length - 1; i >= 0 && t[i] === c; i--) n++; return n; }
  const uniform = (t) => t.length > 0 && run(t) === t.length;

  /** from → to 로 붓기. 못 부으면 null, 부으면 { tubes, mixed, amount } */
  function pour(tubes, from, to, cap = CAP) {
    if (from === to) return null;
    const a = tubes[from], b = tubes[to];
    if (!a || b.length >= cap) return null;
    const c = top(a), n = run(a), k = Math.min(n, cap - b.length);
    let nb, mixed = null;
    if (!b.length || top(b) === c) nb = b + c.repeat(k);
    else {
      const m = run(b), r = mix(c, top(b));
      nb = b.slice(0, b.length - m) + r.repeat(m + k);
      mixed = r;
    }
    const out = tubes.slice();
    out[from] = a.slice(0, a.length - k);
    out[to] = nb;
    return { tubes: out, mixed, amount: k };
  }
  /** 맨 위 덩어리를 버림통에 버리기 */
  function trash(tubes, from) {
    const a = tubes[from];
    if (!a) return null;
    const out = tubes.slice();
    out[from] = a.slice(0, a.length - run(a));
    return { tubes: out, amount: run(a) };
  }
  /** 주문 { P:2, G:1 } 을 채웠는지 — 꽉 찬 한 색 병의 개수로 센다 */
  function fulfilled(tubes, order, cap = CAP) {
    const have = {};
    for (const t of tubes) if (t.length === cap && uniform(t) && t[0] !== 'X') have[t[0]] = (have[t[0]] || 0) + 1;
    for (const k in order) if ((have[k] || 0) < order[k]) return false;
    return true;
  }
  /** 이미 주문을 채운 병 (화면에서 반짝이게) */
  function doneTubes(tubes, order, cap = CAP) {
    const left = Object.assign({}, order), out = [];
    tubes.forEach((t, i) => { if (t.length === cap && uniform(t) && left[t[0]] > 0) { left[t[0]]--; out.push(i); } });
    return out;
  }

  /* ── 최단 풀이 (너비 우선 탐색). 병 순서는 상관없으므로 정렬한 문자열을 상태 키로 쓴다 ── */
  const key = (tubes) => tubes.slice().sort().join('|');
  function moves(tubes, cap) {
    const out = [];
    for (let i = 0; i < tubes.length; i++) {
      const a = tubes[i];
      if (!a) continue;
      const uni = uniform(a);
      let emptyDone = false;
      for (let j = 0; j < tubes.length; j++) {
        if (i === j) continue;
        const b = tubes[j];
        if (b.length >= cap) continue;
        if (!b.length) { if (uni || emptyDone) continue; emptyDone = true; } // 빈 병은 하나만 시도
        const r = pour(tubes, i, j, cap);
        if (r) out.push({ type: 'pour', from: i, to: j, tubes: r.tubes });
      }
      const t = trash(tubes, i);
      if (t) out.push({ type: 'trash', from: i, tubes: t.tubes });
    }
    return out;
  }
  /** 최단 이동 수와 첫 수. budget 을 넘으면 null */
  function solve(start, order, { cap = CAP, budget = 150000, maxDepth = 30 } = {}) {
    if (fulfilled(start, order, cap)) return { depth: 0, path: [] };
    const seen = new Map([[key(start), null]]);
    let frontier = [{ tubes: start, path: [] }];
    let nodes = 0;
    for (let d = 1; d <= maxDepth && frontier.length; d++) {
      const next = [];
      for (const s of frontier) {
        for (const mv of moves(s.tubes, cap)) {
          const k = key(mv.tubes);
          if (seen.has(k)) continue;
          seen.set(k, 1);
          const path = s.path.concat([{ type: mv.type, from: mv.from, to: mv.to }]);
          if (fulfilled(mv.tubes, order, cap)) return { depth: d, path, nodes };
          if (++nodes > budget) return null;
          next.push({ tubes: mv.tubes, path });
        }
      }
      frontier = next;
    }
    return null;
  }

  /** 큰 판용: 가중 A* (최단은 아니지만 빠르게 짧은 풀이를 찾는다) */
  function heur(tubes, order, cap) {
    const left = Object.assign({}, order); let h = 0;
    for (const t of tubes) if (t.length === cap && uniform(t) && left[t[0]] > 0) left[t[0]]--;
    for (const k in left) h += left[k] * 2;
    for (const t of tubes) { if (!t) continue; let segs = 1; for (let i = 1; i < t.length; i++) if (t[i] !== t[i - 1]) segs++; h += segs - 1; if (t.includes('X')) h += 1; }
    return h;
  }
  function solveFast(start, order, { cap = CAP, budget = 60000, w = 1.6 } = {}) {
    if (fulfilled(start, order, cap)) return { depth: 0, path: [] };
    const heap = []; // [f, g, id]
    const nodes = [{ tubes: start, g: 0, parent: -1, mv: null }];
    const best = new Map([[key(start), 0]]);
    const push = (f, id) => { heap.push([f, id]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const popMin = () => { const top0 = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r2 = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r2 < heap.length && heap[r2][0] < heap[m][0]) m = r2; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top0; };
    push(w * heur(start, order, cap), 0);
    let count = 0;
    while (heap.length) {
      const [, id] = popMin(); const n = nodes[id];
      if (fulfilled(n.tubes, order, cap)) {
        const path = []; let cur = id; while (nodes[cur].parent >= 0) { path.unshift(nodes[cur].mv); cur = nodes[cur].parent; }
        return { depth: n.g, path, approx: true };
      }
      if (++count > budget) return null;
      for (const mv of moves(n.tubes, cap)) {
        const k = key(mv.tubes), g = n.g + 1;
        if (best.has(k) && best.get(k) <= g) continue;
        best.set(k, g);
        nodes.push({ tubes: mv.tubes, g, parent: id, mv: { type: mv.type, from: mv.from, to: mv.to } });
        push(g + w * heur(mv.tubes, order, cap), nodes.length - 1);
      }
    }
    return null;
  }
  /** 정확한 최단을 먼저 조금 찾아보고, 넘치면 빠른 풀이로 */
  function solveAny(tubes, order, { exactBudget = 30000, fastBudget = 50000 } = {}) {
    return solve(tubes, order, { budget: exactBudget }) || solveFast(tubes, order, { budget: fastBudget });
  }

  /* ── 판 만들기 ── */
  function rng(seed) {
    let a = seed >>> 0;
    return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  function shuffle(r, a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  /** 평판 단계별 주문 모양 */
  const TIERS = [
    { targets: [['base']], empties: 2, minOpt: 3, maxOpt: 10 },
    { targets: [['mixed']], empties: 2, minOpt: 3, maxOpt: 12 },
    { targets: [['mixed', 'base'], ['mixed', 'mixed']], empties: 2, minOpt: 5, maxOpt: 16 },
    { targets: [['mixed', 'mixed', 'base'], ['mixed', 'mixed']], empties: 2, minOpt: 7, maxOpt: 20 },
    { targets: [['mixed', 'mixed', 'base'], ['mixed', 'mixed', 'mixed']], empties: 2, minOpt: 9, maxOpt: 24 },
  ];

  /** seed 와 단계로 판 하나. { tubes, order, opt, seed } */
  function makeLevel(seed, tier, { extraTubes = 0, budget = 25000 } = {}) {
    const T = TIERS[Math.max(0, Math.min(TIERS.length - 1, tier))];
    for (let attempt = 0; attempt < 40; attempt++) {
      const r = rng(seed * 7919 + attempt * 104729 + tier);
      const shape = pick(r, T.targets);
      const order = {}, units = { R: 0, B: 0, Y: 0 };
      const usedMixed = [];
      for (const kind of shape) {
        if (kind === 'base') {
          const c = pick(r, BASE); order[c] = (order[c] || 0) + 1; units[c] += CAP;
        } else {
          let m = pick(r, MIXED);
          if (usedMixed.includes(m) && r() < 0.6) m = pick(r, MIXED.filter((x) => !usedMixed.includes(x)).concat(m));
          usedMixed.push(m);
          order[m] = (order[m] || 0) + 1;
          const [a, b] = RECIPE[m], split = r() < 0.7 ? 2 : 1; // 2+2 또는 1+3
          units[a] += split; units[b] += CAP - split;
        }
      }
      // 방해용 다른 색 + 4의 배수 맞추기
      let total = units.R + units.B + units.Y;
      const filler = pick(r, BASE);
      units[filler] += CAP; total += CAP;
      while (total % CAP) { units[pick(r, BASE)]++; total++; }
      const bag = [];
      for (const c of BASE) for (let i = 0; i < units[c]; i++) bag.push(c);
      shuffle(r, bag);
      const tubes = [];
      for (let i = 0; i < bag.length; i += CAP) tubes.push(bag.slice(i, i + CAP).join(''));
      if (tubes.some((t) => uniform(t))) continue; // 처음부터 다 된 병은 없게
      for (let i = 0; i < T.empties + extraTubes; i++) tubes.push('');
      if (fulfilled(tubes, order)) continue;
      const sol = solveAny(tubes, order, { exactBudget: budget, fastBudget: budget });
      if (!sol) continue;
      if (sol.depth < T.minOpt || sol.depth > T.maxOpt) continue;
      return { tubes, order, opt: sol.depth, seed, tier };
    }
    // 마지막 수단: 한 단계 쉬운 판
    if (tier > 0) return makeLevel(seed + 1, tier - 1, { extraTubes, budget });
    return null;
  }

  const api = { CAP, BASE, MIXED, RECIPE, mix, top, run, uniform, pour, trash, fulfilled, doneTubes, solve, solveFast, solveAny, makeLevel, rng, TIERS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PotionEngine = api;
  // 웹 워커로 불렸을 때: 판 만들기·힌트를 화면 멈춤 없이 계산
  if (typeof window === 'undefined' && typeof self !== 'undefined' && typeof importScripts === 'function') {
    self.onmessage = (e) => {
      const d = e.data || {};
      if (d.cmd === 'level') self.postMessage({ id: d.id, level: makeLevel(d.seed, d.tier, { extraTubes: d.extraTubes || 0 }) });
      else if (d.cmd === 'hint') self.postMessage({ id: d.id, sol: solveAny(d.tubes, d.order, { exactBudget: 20000, fastBudget: 40000 }) });
    };
  }
})(typeof window !== 'undefined' ? window : globalThis);
