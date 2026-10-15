/* 텍사스 홀덤 — 규칙 엔진 + AI (DOM 없음, Node에서 테스트 가능)
 *
 * 카드: 0~51, 숫자 = c >> 2 (0=2 … 12=A), 무늬 = c & 3 (0♠ 1♥ 2♦ 3♣)
 * 상태 S 는 공개 정보만 담고, 덱·각자 카드는 S.secret = { deck, holes } 에 둔다.
 * (온라인에서 방장은 S.secret 을 빼고 보내며, 각자 카드는 본인만 풀 수 있게 따로 암호화한다)
 *
 * 토너먼트: 모두 같은 칩으로 시작, 정해진 핸드 수마다 블라인드가 오르고 마지막 1명이 우승.
 */
(function (root) {
  "use strict";
  const RANKS = "23456789TJQKA";
  const rankOf = (c) => c >> 2;
  const suitOf = (c) => c & 3;

  // 블라인드 단계 [SB, BB]
  const LEVELS = [
    [10, 20], [15, 30], [25, 50], [50, 100], [75, 150], [100, 200], [150, 300], [200, 400],
    [300, 600], [400, 800], [600, 1200], [800, 1600], [1000, 2000], [1500, 3000], [2000, 4000],
    [3000, 6000], [4000, 8000], [6000, 12000], [8000, 16000], [10000, 20000],
  ];
  const SPEEDS = { normal: 10, fast: 6, turbo: 4 }; // 블라인드가 오르는 핸드 수

  /* ───────── 족보 ───────── */
  // 점수 = 족보 등급 × 13^5 + 키커 5개 (큰 값이 이김)
  function sc5(cat, ks) { let v = cat; for (let i = 0; i < 5; i++) v = v * 13 + (ks[i] || 0); return v; }
  // 랭크 비트마스크에서 가장 높은 스트레이트의 꼭대기 (A-2-3-4-5 포함), 없으면 -1
  function stHigh(mask) {
    const m = (mask << 1) | ((mask >> 12) & 1);
    for (let h = 13; h >= 4; h--) if (((m >> (h - 4)) & 31) === 31) return h - 1;
    return -1;
  }
  /** 5~7장 중 가장 좋은 5장의 점수 {score, cat} */
  function evaluate(cards) {
    const rc = new Array(13).fill(0), sc = [0, 0, 0, 0], bySuit = [0, 0, 0, 0];
    let mask = 0;
    for (const c of cards) { const r = rankOf(c), s = suitOf(c); rc[r]++; sc[s]++; bySuit[s] |= 1 << r; mask |= 1 << r; }
    let f = -1; for (let s = 0; s < 4; s++) if (sc[s] >= 5) f = s;
    if (f >= 0) { const h = stHigh(bySuit[f]); if (h >= 0) return { score: sc5(8, [h]), cat: 8 }; }
    const quads = [], trips = [], pairs = [], singles = [];
    for (let r = 12; r >= 0; r--) {
      if (rc[r] === 4) quads.push(r); else if (rc[r] === 3) trips.push(r); else if (rc[r] === 2) pairs.push(r); else if (rc[r] === 1) singles.push(r);
    }
    const kick = (excl, n) => { const out = []; for (let r = 12; r >= 0 && out.length < n; r--) if (rc[r] && !excl.includes(r)) out.push(r); return out; };
    if (quads.length) return { score: sc5(7, [quads[0], ...kick([quads[0]], 1)]), cat: 7 };
    if (trips.length && (trips.length > 1 || pairs.length)) {
      const t = trips[0], p = Math.max(trips[1] ?? -1, pairs[0] ?? -1);
      return { score: sc5(6, [t, p]), cat: 6 };
    }
    if (f >= 0) { const ks = []; for (let r = 12; r >= 0 && ks.length < 5; r--) if (bySuit[f] & (1 << r)) ks.push(r); return { score: sc5(5, ks), cat: 5 }; }
    const st = stHigh(mask);
    if (st >= 0) return { score: sc5(4, [st]), cat: 4 };
    if (trips.length) return { score: sc5(3, [trips[0], ...kick([trips[0]], 2)]), cat: 3 };
    if (pairs.length >= 2) return { score: sc5(2, [pairs[0], pairs[1], ...kick([pairs[0], pairs[1]], 1)]), cat: 2 };
    if (pairs.length) return { score: sc5(1, [pairs[0], ...kick([pairs[0]], 3)]), cat: 1 };
    return { score: sc5(0, kick([], 5)), cat: 0 };
  }
  const CAT_KO = ["하이 카드", "원 페어", "투 페어", "트리플", "스트레이트", "플러시", "풀하우스", "포카드", "스트레이트 플러시"];
  const CAT_EN = ["High card", "One pair", "Two pair", "Three of a kind", "Straight", "Flush", "Full house", "Four of a kind", "Straight flush"];
  const RN_KO = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  function handName(ev, en) {
    const top = Math.floor(ev.score / Math.pow(13, 4)) % 13;
    if (ev.cat === 8 && top === 12) return en ? "Royal flush" : "로열 플러시";
    const base = (en ? CAT_EN : CAT_KO)[ev.cat];
    if (ev.cat === 1 || ev.cat === 3 || ev.cat === 7) return `${base} (${RN_KO[top]})`;
    if (ev.cat === 4 || ev.cat === 8) return `${base} (${RN_KO[top]}${en ? " high" : " 하이"})`;
    if (ev.cat === 0) return `${base} (${RN_KO[top]})`;
    return base;
  }

  /* ───────── 게임 ───────── */
  function shuffled(rng) {
    const d = []; for (let i = 0; i < 52; i++) d.push(i);
    for (let i = 51; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = d[i]; d[i] = d[j]; d[j] = t; }
    return d;
  }
  /** opts: {names, ai, stack, speed} */
  function newGame(opts, rng) {
    const n = opts.names.length;
    const S = {
      v: 1,
      gameId: Math.floor(rng() * 1e12).toString(36) + Date.now().toString(36),
      n,
      players: opts.names.map((name, i) => ({ name, ai: !!opts.ai[i], stack: opts.stack, bet: 0, total: 0, folded: false, allin: false, acted: false, out: false, place: 0, last: "" })),
      startStack: opts.stack,
      speed: opts.speed in SPEEDS ? opts.speed : "normal",
      handNo: 0, level: 0, sb: 0, bb: 0, dealer: -1, sbSeat: -1, bbSeat: -1,
      street: 0, board: [], curBet: 0, minRaise: 0, toAct: -1,
      phase: "betting", result: null, log: [], winner: -1, deadline: 0,
      secret: { deck: [], holes: [] },
    };
    S.dealer = Math.floor(rng() * n);
    startHand(S, rng, true);
    return S;
  }
  const alive = (S) => S.players.map((p, i) => (p.out ? -1 : i)).filter((i) => i >= 0);
  const nextOf = (S, from, pred) => { for (let k = 1; k <= S.n; k++) { const i = (from + k) % S.n; if (pred(S.players[i], i)) return i; } return -1; };
  const inHand = (p) => !p.out && !p.folded;
  const canAct = (p) => inHand(p) && !p.allin;
  function put(S, i, amt) {
    const p = S.players[i]; amt = Math.max(0, Math.min(amt, p.stack));
    p.stack -= amt; p.bet += amt; p.total += amt;
    if (p.stack === 0) p.allin = true;
    return amt;
  }
  function addLog(S, s) { S.log.push(s); if (S.log.length > 40) S.log.splice(0, S.log.length - 40); }

  function startHand(S, rng, first) {
    S.handNo++;
    S.level = Math.min(LEVELS.length - 1, Math.floor((S.handNo - 1) / SPEEDS[S.speed]));
    [S.sb, S.bb] = LEVELS[S.level];
    for (const p of S.players) { p.bet = 0; p.total = 0; p.folded = p.out; p.allin = false; p.acted = false; p.last = ""; }
    const al = alive(S);
    if (!first || S.players[S.dealer].out) S.dealer = nextOf(S, S.dealer, (p) => !p.out);
    if (al.length === 2) { S.sbSeat = S.dealer; S.bbSeat = nextOf(S, S.dealer, (p) => !p.out); }
    else { S.sbSeat = nextOf(S, S.dealer, (p) => !p.out); S.bbSeat = nextOf(S, S.sbSeat, (p) => !p.out); }
    put(S, S.sbSeat, S.sb); S.players[S.sbSeat].last = "SB";
    put(S, S.bbSeat, S.bb); S.players[S.bbSeat].last = "BB";
    const deck = shuffled(rng), holes = [];
    for (let i = 0; i < S.n; i++) holes.push([]);
    for (let r = 0; r < 2; r++) { let s = S.sbSeat; for (let k = 0; k < al.length; k++) { holes[s].push(deck.pop()); s = nextOf(S, s, (p) => !p.out); } }
    S.secret = { deck, holes, h: S.handNo };
    S.board = []; S.street = 0; S.curBet = S.bb; S.minRaise = S.bb; S.result = null; S.phase = "betting";
    S.toAct = al.length === 2 ? S.sbSeat : nextOf(S, S.bbSeat, canAct);
    addLog(S, { h: S.handNo, t: "hand", lv: S.level, sb: S.sb, bb: S.bb, d: S.dealer });
    if (S.toAct < 0 || !needsAction(S, S.toAct)) advance(S);
  }
  function needsAction(S, i) { const p = S.players[i]; return canAct(p) && (!p.acted || p.bet < S.curBet); }
  function othersCanAct(S, i) { return S.players.some((p, j) => j !== i && canAct(p)); }

  /** 지금 이 자리가 할 수 있는 행동 */
  function legal(S, i) {
    const p = S.players[i];
    if (S.phase !== "betting" || S.toAct !== i || !canAct(p)) return null;
    const toCall = Math.min(S.curBet - p.bet, p.stack);
    const maxTo = p.bet + p.stack;
    const canRaise = !p.acted && p.stack > toCall && othersCanAct(S, i);
    const minTo = Math.min(maxTo, S.curBet + S.minRaise);
    return { toCall, canCheck: toCall <= 0, canRaise, minTo, maxTo, pot: potTotal(S) };
  }
  const potTotal = (S) => S.players.reduce((s, p) => s + p.total, 0);

  /** 행동 적용. a = {t:'fold'|'check'|'call'|'raise', to}. 오류면 코드 문자열 */
  function act(S, i, a, rng) {
    const L = legal(S, i);
    if (!L) return "turn";
    const p = S.players[i];
    let note = "";
    if (a.t === "fold") { p.folded = true; note = "fold"; }
    else if (a.t === "check") { if (!L.canCheck) return "check"; note = "check"; }
    else if (a.t === "call") { if (L.toCall <= 0) note = "check"; else { put(S, i, L.toCall); note = p.allin ? "allin" : "call"; } }
    else if (a.t === "raise") {
      if (!L.canRaise) { return "raise"; }
      let to = Math.floor(Number(a.to) || 0);
      if (to >= L.maxTo) to = L.maxTo;
      if (to <= S.curBet) return "min";
      if (to < L.minTo) return "min";
      const inc = to - S.curBet, opened = S.curBet > 0;
      put(S, i, to - p.bet);
      if (inc >= S.minRaise) { S.minRaise = inc; for (const [j, q] of S.players.entries()) if (j !== i && canAct(q)) q.acted = false; }
      S.curBet = to;
      note = p.allin ? "allin" : opened ? "raise" : "bet";
    } else return "bad";
    p.acted = true;
    p.last = note;
    addLog(S, { h: S.handNo, t: note, s: i, to: p.bet, st: S.street });
    advance(S, rng);
    return null;
  }

  function advance(S) {
    const live = S.players.filter(inHand);
    if (live.length === 1) return award(S, S.players.indexOf(live[0]));
    if (S.toAct >= 0) {
      const nx = needsAction(S, S.toAct) ? S.toAct : nextOf(S, S.toAct, (p, j) => needsAction(S, j));
      if (nx >= 0) { S.toAct = nx; return; }
    }
    // 이번 스트리트 베팅 끝
    if (S.street >= 3) return showdown(S);
    const actors = S.players.filter(canAct).length;
    if (actors <= 1) { // 더 베팅할 사람이 없으면 남은 보드를 모두 깐다
      while (S.board.length < 5) dealBoard(S);
      S.street = 3;
      return showdown(S);
    }
    dealBoard(S);
    S.street++;
    for (const p of S.players) { p.bet = 0; p.acted = false; if (inHand(p) && !p.allin) p.last = ""; }
    S.curBet = 0; S.minRaise = S.bb;
    S.toAct = nextOf(S, S.dealer, canAct);
  }
  function dealBoard(S) {
    const d = S.secret.deck;
    d.pop(); // 번 카드
    if (S.board.length === 0) S.board.push(d.pop(), d.pop(), d.pop());
    else S.board.push(d.pop());
    addLog(S, { h: S.handNo, t: "board", b: S.board.slice() });
  }
  function award(S, w) {
    const amt = potTotal(S);
    S.players[w].stack += amt;
    S.result = { uncontested: w, pots: [{ amt, winners: [w], name: "" }], shown: {}, gains: gainsFrom(S, { [w]: amt }) };
    endHand(S);
  }
  function gainsFrom(S, wins) { return S.players.map((p, i) => (wins[i] || 0) - p.total); }

  /** 사이드 팟 나누기 → [{amt, elig:[seats]}] */
  function buildPots(S) {
    const levels = [...new Set(S.players.filter(inHand).map((p) => p.total))].filter((x) => x > 0).sort((a, b) => a - b);
    const pots = []; let prev = 0;
    for (const lv of levels) {
      let amt = 0; for (const p of S.players) amt += Math.max(0, Math.min(p.total, lv) - prev);
      const elig = S.players.map((p, i) => (inHand(p) && p.total >= lv ? i : -1)).filter((i) => i >= 0);
      if (pots.length && pots[pots.length - 1].elig.join() === elig.join()) pots[pots.length - 1].amt += amt;
      else pots.push({ amt, elig });
      prev = lv;
    }
    return pots;
  }
  function showdown(S) {
    const ev = {}, shown = {};
    for (const [i, p] of S.players.entries()) if (inHand(p)) { ev[i] = evaluate(S.secret.holes[i].concat(S.board)); shown[i] = S.secret.holes[i].slice(); }
    const wins = {}, pots = [];
    for (const pot of buildPots(S)) {
      let best = -1, ws = [];
      for (const i of pot.elig) { const s = ev[i].score; if (s > best) { best = s; ws = [i]; } else if (s === best) ws.push(i); }
      // 남는 칩은 딜러 왼쪽부터
      ws.sort((a, b) => ((a - S.dealer + S.n - 1) % S.n) - ((b - S.dealer + S.n - 1) % S.n));
      const share = Math.floor(pot.amt / ws.length); let rem = pot.amt - share * ws.length;
      for (const w of ws) { const g = share + (rem > 0 ? 1 : 0); if (rem > 0) rem--; wins[w] = (wins[w] || 0) + g; S.players[w].stack += g; }
      pots.push({ amt: pot.amt, winners: ws, name: ws.length ? ev[ws[0]] : null });
    }
    S.result = { uncontested: -1, pots: pots.map((p) => ({ amt: p.amt, winners: p.winners, cat: p.name ? p.name.cat : 0, score: p.name ? p.name.score : 0 })), shown, gains: gainsFrom(S, wins), evs: Object.fromEntries(Object.entries(ev).map(([k, v]) => [k, { cat: v.cat, score: v.score }])) };
    S.street = 4;
    endHand(S);
  }
  function endHand(S) {
    S.phase = "handEnd"; S.toAct = -1;
    for (const p of S.players) p.bet = 0;
    addLog(S, { h: S.handNo, t: "result", r: S.result });
  }
  /** 핸드가 끝난 뒤: 탈락 처리 → 우승자 결정 또는 다음 핸드 */
  function nextHand(S, rng) {
    if (S.phase !== "handEnd") return false;
    const busted = S.players.map((p, i) => ({ p, i })).filter((x) => !x.p.out && x.p.stack <= 0);
    const remaining = S.players.filter((p) => !p.out && p.stack > 0).length;
    // 같은 핸드에 여럿 탈락하면 핸드 시작 칩이 많았던 쪽이 더 높은 순위
    busted.sort((a, b) => b.p.total - a.p.total);
    busted.forEach((x, k) => { x.p.out = true; x.p.place = remaining + 1 + k; x.p.folded = true; });
    if (remaining <= 1) {
      const w = S.players.findIndex((p) => !p.out);
      S.players[w].place = 1; S.winner = w; S.phase = "over"; S.toAct = -1;
      addLog(S, { h: S.handNo, t: "over", w });
      return true;
    }
    startHand(S, rng, false);
    return true;
  }
  /** 방장이 바뀌어 카드를 복구할 수 없을 때: 이번 핸드를 무효로 하고 칩을 돌려준 뒤 새로 나눈다 */
  function voidHand(S, rng) {
    for (const p of S.players) { p.stack += p.total; p.total = 0; p.bet = 0; }
    S.handNo--; // 같은 블라인드 단계에서 다시
    addLog(S, { h: S.handNo + 1, t: "void" });
    startHand(S, rng, false);
    // startHand 가 딜러를 한 칸 옮기므로 그대로 둔다 (공정성에 영향 없음)
  }

  /* ───────── AI ───────── */
  /** 몬테카를로 승률 (상대 opp명, 무작위 패) */
  function equity(hole, board, opp, sims, rng) {
    const used = new Set(hole.concat(board));
    const rest = []; for (let c = 0; c < 52; c++) if (!used.has(c)) rest.push(c);
    let win = 0;
    const need = 5 - board.length;
    for (let s = 0; s < sims; s++) {
      // 필요한 장수만큼 부분 셔플
      const k = need + opp * 2;
      for (let i = 0; i < k; i++) { const j = i + Math.floor(rng() * (rest.length - i)); const t = rest[i]; rest[i] = rest[j]; rest[j] = t; }
      const b = board.concat(rest.slice(0, need));
      const me = evaluate(hole.concat(b)).score;
      let best = 0, ties = 0, lost = false;
      for (let o = 0; o < opp; o++) {
        const sc = evaluate([rest[need + o * 2], rest[need + o * 2 + 1]].concat(b)).score;
        if (sc > me) { lost = true; break; }
        if (sc === me) ties++;
        best = Math.max(best, sc);
      }
      if (!lost) win += 1 / (ties + 1);
    }
    return win / sims;
  }
  /** AI 결정 → 행동 */
  function aiDecide(S, i, rng) {
    const L = legal(S, i); if (!L) return null;
    const p = S.players[i], hole = S.secret.holes[i];
    const opp = Math.max(1, S.players.filter((q, j) => j !== i && inHand(q)).length);
    const eq = equity(hole, S.board, opp, S.street === 0 ? 220 : 320, rng);
    const pot = L.pot;
    const potOdds = L.toCall > 0 ? L.toCall / (pot + L.toCall) : 0;
    const fair = 1 / (opp + 1);
    const jit = (rng() - 0.5) * 0.08;
    const e = eq + jit;
    const stackBB = (p.stack + p.bet) / S.bb;
    const raiseTo = (x) => ({ t: "raise", to: Math.max(L.minTo, Math.min(L.maxTo, Math.round(x))) });
    const callOrCheck = () => (L.toCall > 0 ? { t: "call" } : { t: "check" });
    const foldOrCheck = () => (L.toCall > 0 ? { t: "fold" } : { t: "check" });
    // 짧은 스택: 올인 아니면 폴드
    if (S.street === 0 && stackBB <= 10) {
      if (e > fair + 0.08 + (L.toCall > S.bb ? 0.05 : 0)) return L.canRaise ? raiseTo(L.maxTo) : callOrCheck();
      return foldOrCheck();
    }
    const strong = e > fair + 0.28, good = e > fair + 0.12;
    if (strong && L.canRaise) {
      const size = L.toCall > 0 ? S.curBet * 2.5 + L.toCall : pot * (0.6 + rng() * 0.4) + p.bet;
      if (e > 0.85 && rng() < 0.3) return raiseTo(L.maxTo);
      return raiseTo(Math.max(size, S.curBet + S.minRaise));
    }
    if (good) {
      if (L.toCall === 0 && L.canRaise && rng() < 0.7) return raiseTo(p.bet + pot * (0.45 + rng() * 0.25));
      if (L.toCall > 0 && e > potOdds + 0.05) return { t: "call" };
      return callOrCheck();
    }
    if (L.toCall === 0) {
      // 가끔 블러프
      if (L.canRaise && opp <= 2 && S.street >= 1 && rng() < 0.12) return raiseTo(p.bet + pot * 0.5);
      return { t: "check" };
    }
    if (e > potOdds + 0.03 && L.toCall <= p.stack * 0.5) return { t: "call" };
    if (L.toCall <= S.bb && S.street === 0 && e > fair - 0.05) return { t: "call" };
    return { t: "fold" };
  }

  const H = { RANKS, LEVELS, SPEEDS, rankOf, suitOf, evaluate, handName, newGame, startHand, legal, act, nextHand, voidHand, potTotal, buildPots, equity, aiDecide, inHand, canAct };
  if (typeof module !== "undefined" && module.exports) module.exports = H; else root.HOLDEM = H;
})(typeof window !== "undefined" ? window : globalThis);
