/* 드래곤 콜 — 규칙 엔진 + AI (DOM 없음, 방장/혼자 하기 브라우저와 Node 테스트에서 공용)
 * 카드 번호: 0..51 = 무늬(0..3)×13 + (숫자-2), 52 참새(1), 53 개, 54 봉황, 55 용
 * 좌석 0..3, 진행 순서 = 좌석 +1. 같은 팀 = 좌석 % 2 (0·2 vs 1·3)
 */
(function (root) {
  'use strict';
  const MJ = 52, DOG = 53, PH = 54, DR = 55;
  const rankOf = c => c < 52 ? c % 13 + 2 : c === MJ ? 1 : c === DR ? 15 : 0;
  const suitOf = c => c < 52 ? (c / 13) | 0 : -1;
  const ptsOf = c => c === DR ? 25 : c === PH ? -25 : c < 52 ? ({ 5: 5, 10: 10, 13: 10 })[rankOf(c)] || 0 : 0;
  const isBomb = c => !!c && (c.type === 'bomb4' || c.type === 'bombsf');
  const bombPow = c => c.type === 'bombsf' ? 100 + c.len * 20 + c.rank : c.rank;
  const sortKey = c => c === DOG ? 0 : c === MJ ? 1 : c === PH ? 15.2 : c === DR ? 16 : rankOf(c) + suitOf(c) * 0.01;
  const sortHand = h => h.slice().sort((a, b) => sortKey(a) - sortKey(b));
  const team = s => s % 2;
  const sumPts = cs => cs.reduce((a, c) => a + ptsOf(c), 0);
  const hasRank = (cards, r) => cards.some(c => c < 52 && rankOf(c) === r);

  /* ───────── 조합 판정 ───────── */
  function parseRanks(rs, cards, ph) {
    const n = rs.length, cnt = {};
    rs.forEach(r => { cnt[r] = (cnt[r] || 0) + 1; });
    const ks = Object.keys(cnt).map(Number).sort((a, b) => a - b), d = ks.length, out = [];
    const consec = ks.every((k, i) => i === 0 || k === ks[i - 1] + 1);
    if (d === 1) {
      const r = ks[0];
      if (n === 2 && r >= 2) out.push({ type: 'pair', len: 2, rank: r });
      else if (n === 3 && r >= 2) out.push({ type: 'triple', len: 3, rank: r });
      else if (n === 4 && !ph && r >= 2) out.push({ type: 'bomb4', len: 4, rank: r });
    }
    if (n === 5 && d === 2) {
      const [a, b] = ks;
      if (a >= 2 && cnt[a] === 3 && cnt[b] === 2) out.push({ type: 'fh', len: 5, rank: a });
      else if (a >= 2 && cnt[b] === 3 && cnt[a] === 2) out.push({ type: 'fh', len: 5, rank: b });
    }
    if (n >= 5 && d === n && consec) {
      const suits = cards.filter(c => c < 52).map(suitOf);
      if (!ph && !cards.includes(MJ) && suits.every(s => s === suits[0])) out.push({ type: 'bombsf', len: n, rank: ks[d - 1] });
      else out.push({ type: 'straight', len: n, rank: ks[d - 1] });
    }
    if (n >= 4 && n % 2 === 0 && d === n / 2 && consec && ks[0] >= 2 && ks.every(k => cnt[k] === 2)) out.push({ type: 'pairs', len: n, rank: ks[d - 1] });
    return out;
  }

  /** 고른 카드들로 만들 수 있는 모든 해석 (봉황 단독은 rank -1 = 아직 값 미정) */
  function interps(cards) {
    const n = cards.length;
    if (!n || new Set(cards).size !== n) return [];
    if (n === 1) {
      const c = cards[0];
      if (c === DOG) return [{ type: 'dog', len: 1, rank: 0, cards }];
      if (c === PH) return [{ type: 'single', len: 1, rank: -1, ph: true, cards }];
      return [{ type: 'single', len: 1, rank: rankOf(c), cards }];
    }
    if (cards.includes(DOG) || cards.includes(DR)) return [];
    const ph = cards.includes(PH), rs = cards.filter(c => c !== PH).map(rankOf);
    let out = [];
    if (!ph) out = parseRanks(rs, cards, false);
    else for (let s = 2; s <= 14; s++) out.push(...parseRanks(rs.concat(s), cards, true));
    const seen = new Set();
    return out.filter(o => { const k = o.type + o.len + ':' + o.rank; if (seen.has(k)) return false; seen.add(k); return true; })
      .map(o => ({ ...o, cards: cards.slice() }));
  }

  /** 봉황 단독의 값 = 직전 싱글 + 0.5 (선이면 1.5). 용 위에는 낼 수 없음 */
  function resolve(c, top) {
    if (c && c.type === 'single' && c.ph) {
      if (top && top.type === 'single') return top.rank >= 15 ? null : { ...c, rank: top.rank + 0.5 };
      return { ...c, rank: 1.5 };
    }
    return c;
  }

  function beats(c, top) {
    if (!c) return false;
    if (!top) return true;
    if (c.type === 'dog') return false;
    if (isBomb(c)) return !isBomb(top) || bombPow(c) > bombPow(top);
    if (isBomb(top)) return false;
    return c.type === top.type && c.len === top.len && c.rank > top.rank;
  }

  /** 고른 카드를 현재 판에 낼 때 가장 높은 해석 */
  function pickPlay(cards, top) {
    const list = interps(cards).map(c => resolve(c, top)).filter(c => c && beats(c, top));
    if (!list.length) return null;
    const v = c => isBomb(c) ? 1000 + bombPow(c) : c.rank;
    list.sort((a, b) => v(b) - v(a));
    return list[0];
  }

  /** 손패로 낼 수 있는 모든 조합 (대표 카드 조합 하나씩) */
  function allCombos(hand) {
    const by = {};
    for (let r = 1; r <= 14; r++) by[r] = [];
    hand.forEach(c => { if (c < 52 || c === MJ) by[rankOf(c)].push(c); });
    const ph = hand.includes(PH), out = [];
    const cnt = r => (r >= 1 && r <= 14 ? by[r].length : 0);
    for (const c of hand) {
      if (c === DOG) out.push({ type: 'dog', len: 1, rank: 0, cards: [c] });
      else if (c === PH) out.push({ type: 'single', len: 1, rank: -1, ph: true, cards: [c] });
      else out.push({ type: 'single', len: 1, rank: rankOf(c), cards: [c] });
    }
    for (let r = 2; r <= 14; r++) {
      const n = cnt(r), g = by[r];
      if (n >= 2) out.push({ type: 'pair', len: 2, rank: r, cards: g.slice(0, 2) });
      else if (n === 1 && ph) out.push({ type: 'pair', len: 2, rank: r, cards: [g[0], PH] });
      if (n >= 3) out.push({ type: 'triple', len: 3, rank: r, cards: g.slice(0, 3) });
      else if (n === 2 && ph) out.push({ type: 'triple', len: 3, rank: r, cards: [...g, PH] });
      if (n === 4) out.push({ type: 'bomb4', len: 4, rank: r, cards: g.slice() });
    }
    for (let t = 2; t <= 14; t++) for (let p = 2; p <= 14; p++) {
      if (p === t) continue;
      const nt = cnt(t), np = cnt(p);
      if (nt >= 3 && np >= 2) out.push({ type: 'fh', len: 5, rank: t, cards: [...by[t].slice(0, 3), ...by[p].slice(0, 2)] });
      else if (ph && nt >= 3 && np === 1) out.push({ type: 'fh', len: 5, rank: t, cards: [...by[t].slice(0, 3), by[p][0], PH] });
      else if (ph && nt === 2 && np >= 2 && t > p) out.push({ type: 'fh', len: 5, rank: t, cards: [...by[t], PH, ...by[p].slice(0, 2)] });
    }
    for (let s = 1; s <= 10; s++) {
      let miss = 0;
      for (let e = s; e <= 14; e++) {
        if (!cnt(e)) { if (e === 1 || !ph) break; miss++; if (miss > 1) break; }
        const len = e - s + 1;
        if (len >= 5) {
          const cards = [];
          for (let r = s; r <= e; r++) cards.push(cnt(r) ? by[r][0] : PH);
          // 같은 무늬로만 뽑혔으면 다른 무늬 한 장으로 바꿔 폭탄이 아닌 스트레이트로
          const nm = cards.filter(c => c < 52);
          if (nm.length === cards.length && nm.every(c => suitOf(c) === suitOf(nm[0]))) {
            const i = cards.findIndex(c => by[rankOf(c)].some(x => suitOf(x) !== suitOf(c)));
            if (i < 0) continue;
            cards[i] = by[rankOf(cards[i])].find(x => suitOf(x) !== suitOf(cards[i]));
          }
          out.push({ type: 'straight', len, rank: e, cards });
        }
      }
    }
    for (let su = 0; su < 4; su++) {
      const has = r => hand.includes(su * 13 + r - 2);
      for (let s = 2; s <= 10; s++) {
        if (!has(s)) continue;
        for (let e = s; e <= 14 && has(e); e++) {
          if (e - s + 1 >= 5) {
            const cards = [];
            for (let r = s; r <= e; r++) cards.push(su * 13 + r - 2);
            out.push({ type: 'bombsf', len: e - s + 1, rank: e, cards });
          }
        }
      }
    }
    for (let s = 2; s <= 13; s++) {
      let def = 0;
      for (let e = s; e <= 14; e++) {
        const n = cnt(e);
        if (n === 0) break;
        if (n === 1) { def++; if (def > (ph ? 1 : 0)) break; }
        if (e > s) {
          const cards = [];
          for (let r = s; r <= e; r++) {
            if (cnt(r) >= 2) cards.push(...by[r].slice(0, 2));
            else cards.push(by[r][0], PH);
          }
          out.push({ type: 'pairs', len: (e - s + 1) * 2, rank: e, cards });
        }
      }
    }
    return out;
  }

  function canFulfill(hand, top, w) {
    if (!w || !hasRank(hand, w)) return false;
    return allCombos(hand).some(c => c.type !== 'dog' && hasRank(c.cards, w) && beats(resolve(c, top), top));
  }

  /* ───────── 게임 상태 ───────── */
  function shuffle(a, rnd) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function newGame(names, ai, target) {
    const S = {
      v: 1, target: target || 1000, scores: [0, 0], round: 0,
      names: names.slice(), ai: ai.slice(), history: [], log: [], seq: 0, winnerTeam: null,
    };
    newRound(S);
    return S;
  }

  function newRound(S, rnd) {
    rnd = rnd || Math.random;
    const deck = shuffle(Array.from({ length: 56 }, (_, i) => i), rnd);
    S.round++;
    S.phase = 'grand';
    S.hands = [0, 1, 2, 3].map(s => deck.slice(s * 14, s * 14 + 14));
    S.grand = [null, null, null, null];
    S.calls = [0, 0, 0, 0];
    S.passSel = [null, null, null, null];
    S.received = [null, null, null, null];
    S.played = [false, false, false, false];
    S.out = [];
    S.won = [[], [], [], []];
    S.turn = -1;
    S.trick = null;
    S.wish = 0;
    S.pendingDragon = null;
    S.dbl = null;
    S.lastTrick = null;
    S.summary = null;
    S.last = null;
    S.seq++;
    log(S, `── ${S.round}라운드 ──`, `── Round ${S.round} ──`);
  }

  function log(S, ko, en) {
    S.log.push([ko, en]);
    if (S.log.length > 80) S.log.splice(0, S.log.length - 80);
  }

  const activeCount = S => S.hands.filter(h => h.length).length;
  function nextActive(S, s) {
    for (let i = 1; i <= 4; i++) { const t = (s + i) % 4; if (S.hands[t].length) return t; }
    return s;
  }

  const COMBO_NAME = {
    single: ['싱글', 'Single'], pair: ['페어', 'Pair'], triple: ['트리플', 'Triple'], fh: ['풀하우스', 'Full house'],
    straight: ['스트레이트', 'Straight'], pairs: ['연속 페어', 'Pair run'], bomb4: ['폭탄 · 포카드', 'Bomb · Four of a kind'],
    bombsf: ['폭탄 · 스트레이트 플러시', 'Bomb · Straight flush'], dog: ['개', 'Dog'],
  };
  function comboName(c, en) {
    const n = COMBO_NAME[c.type][en ? 1 : 0];
    return (c.type === 'straight' || c.type === 'pairs' || c.type === 'bombsf') ? `${n} (${c.len})` : n;
  }
  const RANK_LABEL = r => r === 11 ? 'J' : r === 12 ? 'Q' : r === 13 ? 'K' : r === 14 ? 'A' : String(r);
  function cardLabel(c, en) {
    if (c === MJ) return en ? 'Sparrow 1' : '참새 1';
    if (c === DOG) return en ? 'Dog' : '개';
    if (c === PH) return en ? 'Phoenix' : '봉황';
    if (c === DR) return en ? 'Dragon' : '용';
    return '♠♥♦♣'[suitOf(c)] + RANK_LABEL(rankOf(c));
  }

  /* ───────── 행동 검사 ───────── */
  function mustFulfill(S, seat) {
    return !!S.wish && S.turn === seat && canFulfill(S.hands[seat], S.trick ? S.trick.top : null, S.wish);
  }

  function checkPlay(S, seat, cards) {
    if (S.phase !== 'play' || S.pendingDragon !== null) return { err: 'phase' };
    const hand = S.hands[seat];
    if (!Array.isArray(cards) || !cards.length || new Set(cards).size !== cards.length || !cards.every(c => hand.includes(c))) return { err: 'cards' };
    const top = S.trick ? S.trick.top : null;
    const combo = pickPlay(cards, top);
    if (!combo) return { err: top ? 'weak' : 'invalid' };
    if (S.turn !== seat) {
      if (!isBomb(combo) || !S.trick) return { err: 'turn' };
    } else if (mustFulfill(S, seat) && !hasRank(cards, S.wish)) return { err: 'wish' };
    return { combo };
  }

  function checkPass(S, seat) {
    if (S.phase !== 'play' || S.pendingDragon !== null) return 'phase';
    if (S.turn !== seat) return 'turn';
    if (!S.trick) return 'lead';
    if (mustFulfill(S, seat)) return 'wish';
    return null;
  }

  const canCall = (S, seat) => (S.phase === 'pass' || S.phase === 'play' || (S.phase === 'grand' && S.grand[seat] === false))
    && S.calls[seat] === 0 && !S.played[seat];

  /* ───────── 행동 적용 (검사 통과 가정) ───────── */
  function doGrand(S, seat, yes) {
    if (S.phase !== 'grand' || S.grand[seat] !== null) return false;
    S.grand[seat] = !!yes;
    if (yes) { S.calls[seat] = 2; log(S, `${S.names[seat]}: 그랜드 콜!`, `${S.names[seat]}: Grand Call!`); }
    S.seq++;
    if (S.grand.every(g => g !== null)) { S.phase = 'pass'; S.seq++; }
    return true;
  }

  function doCall(S, seat) {
    if (!canCall(S, seat)) return false;
    S.calls[seat] = 1;
    S.seq++;
    log(S, `${S.names[seat]}: 콜!`, `${S.names[seat]}: Call!`);
    return true;
  }

  /** cards = [다음 사람에게, 짝꿍에게, 이전 사람에게] */
  function doExchange(S, seat, cards) {
    if (S.phase !== 'pass' || S.passSel[seat]) return false;
    if (!Array.isArray(cards) || cards.length !== 3 || new Set(cards).size !== 3 || !cards.every(c => S.hands[seat].includes(c))) return false;
    S.passSel[seat] = cards.slice();
    S.seq++;
    if (S.passSel.every(Boolean)) {
      const recv = [[], [], [], []];
      for (let s = 0; s < 4; s++) {
        S.hands[s] = S.hands[s].filter(c => !S.passSel[s].includes(c));
        S.passSel[s].forEach((c, i) => recv[(s + i + 1) % 4].push([s, c]));
      }
      for (let s = 0; s < 4; s++) { S.hands[s].push(...recv[s].map(x => x[1])); S.received[s] = recv[s]; }
      S.phase = 'play';
      S.turn = S.hands.findIndex(h => h.includes(MJ));
      S.trick = null;
      log(S, `카드 교환 완료 — ${S.names[S.turn]} 선`, `Cards exchanged — ${S.names[S.turn]} leads`);
    }
    return true;
  }

  function doPlay(S, seat, cards, wish) {
    const chk = checkPlay(S, seat, cards);
    if (chk.err) return chk.err;
    const combo = chk.combo, hand = S.hands[seat];
    S.hands[seat] = hand.filter(c => !cards.includes(c));
    S.played[seat] = true;
    if (!S.trick) { S.trick = { plays: [], top: null, winner: -1, passes: 0, passed: [], cards: [] }; S.lastTrick = null; }
    const t = S.trick;
    const play = { s: seat, type: combo.type, len: combo.len, rank: combo.rank, cards: sortHand(cards) };
    t.plays.push(play);
    t.top = play;
    t.winner = seat;
    t.passes = 0;
    t.passed = [];
    t.cards.push(...cards);
    S.seq++;
    S.last = { s: seat, k: isBomb(combo) ? 'bomb' : 'play', seq: S.seq };
    const out = cards.map(c => cardLabel(c, false)).join(' '), outEn = cards.map(c => cardLabel(c, true)).join(' ');
    log(S, `${S.names[seat]} ▸ ${comboName(combo)} ${out}`, `${S.names[seat]} ▸ ${comboName(combo, true)} ${outEn}`);
    if (S.wish && hasRank(cards, S.wish)) { log(S, `소원(${RANK_LABEL(S.wish)}) 이루어짐`, `Wish (${RANK_LABEL(S.wish)}) fulfilled`); S.wish = 0; }
    if (cards.includes(MJ) && wish >= 2 && wish <= 14) { S.wish = wish | 0; log(S, `${S.names[seat]}의 소원: ${RANK_LABEL(S.wish)}`, `${S.names[seat]} wishes for ${RANK_LABEL(S.wish)}`); }
    if (!S.hands[seat].length) {
      S.out.push(seat);
      log(S, `${S.names[seat]} ${S.out.length}등으로 나감`, `${S.names[seat]} is out (#${S.out.length})`);
    }
    if (S.out.length === 2 && team(S.out[0]) === team(S.out[1])) {
      S.dbl = team(S.out[0]);
      S.trick = null;
      endRound(S);
      return null;
    }
    if (combo.type === 'dog') {
      S.won[seat].push(...t.cards);
      S.lastTrick = { top: play, w: seat, to: (seat + 2) % 4, pts: 0, dog: true };
      S.trick = null;
      if (S.out.length >= 3) { endRound(S); return null; }
      const p = (seat + 2) % 4;
      S.turn = S.hands[p].length ? p : nextActive(S, p);
      return null;
    }
    if (S.out.length >= 3) { finishTrick(S, seat); return null; }
    S.turn = nextActive(S, seat);
    return null;
  }

  function doPass(S, seat) {
    const e = checkPass(S, seat);
    if (e) return e;
    const t = S.trick;
    t.passes++;
    t.passed.push(seat);
    S.seq++;
    S.last = { s: seat, k: 'pass', seq: S.seq };
    const need = [0, 1, 2, 3].filter(s => S.hands[s].length && s !== t.winner).length;
    if (t.passes >= need) finishTrick(S, t.winner);
    else S.turn = nextActive(S, seat);
    return null;
  }

  function finishTrick(S, w) {
    const t = S.trick;
    if (t.top.type === 'single' && t.top.cards[0] === DR) {
      S.pendingDragon = w;
      S.turn = -1;
      S.seq++;
      return;
    }
    S.won[w].push(...t.cards);
    log(S, `${S.names[w]} 트릭 획득 (${sumPts(t.cards)}점)`, `${S.names[w]} takes the trick (${sumPts(t.cards)} pts)`);
    afterTrick(S, w);
  }

  function afterTrick(S, w, to) {
    const t = S.trick;
    S.lastTrick = t ? { top: t.top, w, to: to === undefined ? w : to, pts: sumPts(t.cards) } : null;
    S.trick = null;
    S.seq++;
    if (S.out.length >= 3) { endRound(S); return; }
    S.turn = S.hands[w].length ? w : nextActive(S, w);
  }

  function doDragon(S, seat, to) {
    if (S.pendingDragon !== seat || ![0, 1, 2, 3].includes(to) || team(to) === team(seat)) return 'invalid';
    S.won[to].push(...S.trick.cards);
    log(S, `${S.names[seat]} → ${S.names[to]}에게 용 트릭 (${sumPts(S.trick.cards)}점)`, `${S.names[seat]} gives the Dragon trick to ${S.names[to]} (${sumPts(S.trick.cards)} pts)`);
    S.pendingDragon = null;
    afterTrick(S, seat, to);
    return null;
  }

  function endRound(S) {
    const pts = [0, 0], card = [0, 0], call = [0, 0];
    let last = -1, handPts = 0;
    if (S.dbl !== null) pts[S.dbl] += 200;
    else {
      last = [0, 1, 2, 3].find(s => !S.out.includes(s));
      if (last !== undefined && last >= 0) {
        handPts = sumPts(S.hands[last]);
        card[1 - team(last)] += handPts;
        S.won[S.out[0]].push(...S.won[last]);
        S.won[last] = [];
      } else last = -1;
      for (let s = 0; s < 4; s++) card[team(s)] += sumPts(S.won[s]);
      pts[0] += card[0]; pts[1] += card[1];
    }
    for (let s = 0; s < 4; s++) {
      if (!S.calls[s]) continue;
      const v = S.calls[s] === 2 ? 200 : 100, ok = S.out[0] === s;
      call[team(s)] += ok ? v : -v;
    }
    pts[0] += call[0]; pts[1] += call[1];
    S.scores[0] += pts[0]; S.scores[1] += pts[1];
    S.summary = { round: S.round, pts, card, call, dbl: S.dbl, out: S.out.slice(), calls: S.calls.slice(), last, handPts, scores: S.scores.slice() };
    S.history.push({ round: S.round, pts });
    S.turn = -1;
    S.trick = null;
    S.pendingDragon = null;
    S.seq++;
    log(S, `${S.round}라운드 결과 ${pts[0]} : ${pts[1]} (합계 ${S.scores[0]} : ${S.scores[1]})`,
      `Round ${S.round}: ${pts[0]} : ${pts[1]} (total ${S.scores[0]} : ${S.scores[1]})`);
    if (Math.max(S.scores[0], S.scores[1]) >= S.target && S.scores[0] !== S.scores[1]) {
      S.phase = 'over';
      S.winnerTeam = S.scores[0] > S.scores[1] ? 0 : 1;
    } else S.phase = 'roundEnd';
  }

  /* ───────── AI ───────── */
  // 손패를 비우는 데 필요한 대략의 턴 수 - 강한 카드 가치 (낮을수록 좋음)
  function handValue(hand) {
    if (!hand.length) return -20;
    const cnt = Array(15).fill(0);
    let mj = 0, ph = 0, dog = 0, dr = 0;
    for (const c of hand) {
      if (c < 52) cnt[rankOf(c)]++;
      else if (c === MJ) mj = 1; else if (c === PH) ph = 1; else if (c === DOG) dog = 1; else dr = 1;
    }
    let pieces = 0, bombs = 0;
    for (let r = 2; r <= 14; r++) if (cnt[r] === 4) { bombs++; cnt[r] = 0; }
    cnt[1] = mj;
    // 스트레이트: 낱장을 3장 이상 흡수할 때만 사용
    for (let guard = 0; guard < 3; guard++) {
      let best = null;
      for (let s = 1; s <= 10; s++) {
        let e = s;
        while (e <= 14 && cnt[e] > 0) e++;
        const len = e - s;
        if (len >= 5) {
          const singles = cnt.slice(s, e).filter(x => x === 1).length;
          if (singles >= 3 && (!best || singles > best.singles)) best = { s, e, singles };
        }
      }
      if (!best) break;
      for (let r = best.s; r < best.e; r++) cnt[r]--;
      pieces++;
    }
    let pairs = 0, triples = 0, singles = 0, lowSingles = 0;
    for (let r = 1; r <= 14; r++) {
      if (cnt[r] === 1) { singles++; if (r < 10) lowSingles++; }
      else if (cnt[r] === 2) pairs++;
      else if (cnt[r] >= 3) triples++;
    }
    pieces += singles + pairs + triples - Math.min(pairs, triples);
    // 연속 페어는 한 번에
    let run = 0;
    for (let r = 2; r <= 15; r++) {
      if (r <= 14 && cnt[r] === 2) run++;
      else { if (run >= 2) pieces -= run - 1; run = 0; }
    }
    if (ph && lowSingles) pieces -= 0.6;
    pieces += dog * 0.5 + dr + ph * 0.5 + bombs;
    const control = dr * 1.1 + ph * 0.8 + cnt[14] * 0.5 + bombs * 1.2;
    return pieces - control;
  }

  const without = (hand, cards) => hand.filter(c => !cards.includes(c));
  const HIGH = c => c === DR || c === PH || (c < 52 && rankOf(c) === 14);

  function aiStrength(hand) {
    let s = 0;
    const cnt = Array(15).fill(0);
    hand.forEach(c => { if (c < 52) cnt[rankOf(c)]++; });
    if (hand.includes(DR)) s += 2;
    if (hand.includes(PH)) s += 1.6;
    s += cnt[14] * 1 + cnt[13] * 0.35;
    for (let r = 2; r <= 14; r++) if (cnt[r] === 4) s += 2.2;
    return s;
  }

  function aiGrand(S, seat) {
    const h = S.hands[seat].slice(0, 8);
    return aiStrength(h) >= 5.4;
  }

  let CALL_T = 3;
  const AIP = [{ lg: 0.75, lgEnd: 1.2, pass: 3 }, { lg: 0.75, lgEnd: 1.2, pass: 3 }];
  function aiWantsCall(S, seat) {
    if (!canCall(S, seat) || S.hands[seat].length !== 14) return false;
    if (S.calls[(seat + 2) % 4]) return false;
    const h = S.hands[seat];
    return aiStrength(h) * 1.2 - handValue(h) >= CALL_T;
  }

  function aiExchange(S, seat) {
    const h = sortHand(S.hands[seat]);
    const cnt = {};
    h.forEach(c => { if (c < 52) cnt[rankOf(c)] = (cnt[rankOf(c)] || 0) + 1; });
    const bombRank = r => cnt[r] === 4;
    const partnerCalled = S.calls[(seat + 2) % 4] > 0, meCalled = S.calls[seat] > 0;
    // 짝꿍: 좋은 카드 한 장
    let toP;
    const pool = h.filter(c => !(c < 52 && bombRank(rankOf(c))));
    if (partnerCalled && pool.includes(DR)) toP = DR;
    else {
      const cands = pool.filter(c => c < 52 && !(meCalled && rankOf(c) === 14) && cnt[rankOf(c)] === 1);
      toP = cands.length ? cands[cands.length - 1] : pool.filter(c => c !== PH && c !== DR && c !== MJ && c !== DOG).pop();
      if (toP === undefined) toP = pool.find(c => c !== PH && c !== DR) ?? h[h.length - 1];
    }
    // 상대: 낮은 낱장 (개는 상대에게)
    const rest = h.filter(c => c !== toP && c !== PH && c !== DR && c !== MJ && !(c < 52 && bombRank(rankOf(c))));
    const lows = [];
    if (rest.includes(DOG)) lows.push(DOG);
    rest.filter(c => c < 52 && cnt[rankOf(c)] === 1 && rankOf(c) < 11).forEach(c => lows.push(c));
    rest.filter(c => c < 52).forEach(c => lows.push(c));
    h.forEach(c => lows.push(c));
    const pick = [];
    for (const c of lows) { if (c !== toP && !pick.includes(c)) pick.push(c); if (pick.length === 2) break; }
    return [pick[0], toP, pick[1]];
  }

  function trickPoints(S) { return S.trick ? sumPts(S.trick.cards) : 0; }
  function threat(S, seat) {
    return [1, 3].some(d => {
      const o = (seat + d) % 4, n = S.hands[o].length;
      return n > 0 && (n <= 3 || (S.calls[o] && n <= 6));
    });
  }

  function aiWish(hand) {
    for (let r = 14; r >= 2; r--) if (!hasRank(hand, r)) return r;
    return 0;
  }

  /** 차례인 AI의 행동: {t:'play', cards, wish} | {t:'pass'} */
  function aiTurn(S, seat) {
    const hand = S.hands[seat], top = S.trick ? S.trick.top : null;
    const partner = (seat + 2) % 4;
    const oblig = mustFulfill(S, seat);
    let combos = allCombos(hand).map(c => resolve(c, top)).filter(c => c && beats(c, top));
    if (oblig) combos = combos.filter(c => hasRank(c.cards, S.wish));
    const wishOf = cards => cards.includes(MJ) ? aiWish(without(hand, cards)) : 0;
    const finish = combos.find(c => c.cards.length === hand.length);
    if (finish) return { t: 'play', cards: finish.cards, wish: wishOf(finish.cards) };
    const base = handValue(hand), thr = threat(S, seat), pts = trickPoints(S);

    if (!top) {
      // 선: 개로 짝꿍에게 넘기기
      if (hand.includes(DOG) && S.hands[partner].length && !oblig) {
        const pv = S.calls[partner] ? -3 : (S.hands[partner].length < hand.length - 3 ? -0.5 : 0.6);
        if (pv < 0 || hand.length <= 3) return { t: 'play', cards: [DOG], wish: 0 };
      }
      let best = null, bs = Infinity;
      for (const c of combos) {
        if (c.type === 'dog') continue;
        if (isBomb(c) && combos.some(x => !isBomb(x) && x.type !== 'dog')) continue;
        let s = handValue(without(hand, c.cards)) + c.rank * 0.035;
        if (c.cards.includes(DR)) s += 1.3;
        if (c.type === 'single' && c.ph) s += 1.0;
        else if (c.cards.includes(PH)) s += 0.35;
        if (c.type === 'single' && c.rank === 14) s += 0.5;
        if (s < bs) { bs = s; best = c; }
      }
      if (!best) best = combos.find(c => c.type !== 'dog') || combos[0];
      return { t: 'play', cards: best.cards, wish: wishOf(best.cards) };
    }

    const winner = S.trick.winner;
    const partnerWins = team(winner) === team(seat);
    const normal = combos.filter(c => !isBomb(c));
    const bombs = combos.filter(isBomb);
    if (partnerWins && !oblig) return { t: 'pass' };
    let best = null, bs = Infinity;
    const endgame = hand.length <= 6;
    for (const c of normal) {
      let s = handValue(without(hand, c.cards)) - base;
      // 이 트릭을 가져가 선을 잡을 가능성 × 선의 가치
      const pWin = c.type === 'single'
        ? (c.rank >= 15 ? 1 : c.rank >= 14 ? 0.8 : Math.max(0, (c.rank - 7) / 10))
        : Math.min(1, 0.45 + c.rank / 30 + c.len / 20);
      s -= pWin * (endgame ? AIP[team(seat)].lgEnd : AIP[team(seat)].lg);
      if (c.cards.includes(DR)) s += (pts >= 15 || thr || S.calls[seat] || endgame) ? 0 : 0.5;
      if (c.type === 'single' && c.ph) s += thr || endgame ? 0 : 0.5;
      else if (c.cards.includes(PH)) s += 0.3;
      s += c.rank * 0.015;
      if (s < bs) { bs = s; best = c; }
    }
    const passScore = AIP[team(seat)].pass - (thr ? 1.2 : 0) - pts / 30 - (S.calls[seat] ? 0.4 : 0);
    if (best && (bs < passScore || oblig)) return { t: 'play', cards: best.cards, wish: wishOf(best.cards) };
    if (bombs.length && (thr || pts >= 20 || oblig)) {
      bombs.sort((a, b) => bombPow(a) - bombPow(b));
      const b = oblig ? bombs[0] : bombs[0];
      return { t: 'play', cards: b.cards, wish: 0 };
    }
    if (oblig && combos.length) return { t: 'play', cards: combos[0].cards, wish: wishOf(combos[0].cards) };
    return { t: 'pass' };
  }

  /** 차례가 아닐 때 끼어드는 폭탄 (없으면 null) */
  function aiInterruptBomb(S, seat) {
    if (S.phase !== 'play' || !S.trick || S.pendingDragon !== null || S.turn === seat || !S.hands[seat].length) return null;
    const w = S.trick.winner;
    if (team(w) === team(seat)) return null;
    const n = S.hands[w].length;
    const pts = trickPoints(S);
    const danger = (n > 0 && n <= 2) || (S.calls[w] && n <= 4) || pts >= 30 || (S.trick.top.cards[0] === DR && S.trick.top.type === 'single' && pts >= 20);
    if (!danger) return null;
    const bombs = allCombos(S.hands[seat]).filter(c => isBomb(c) && beats(c, S.trick.top)).sort((a, b) => bombPow(a) - bombPow(b));
    return bombs.length ? bombs[0].cards : null;
  }

  function aiDragon(S, seat) {
    const a = (seat + 1) % 4, b = (seat + 3) % 4;
    // 이미 나간 상대 또는 손패가 많은 상대에게 (트릭 점수를 쓸 기회가 적은 쪽)
    const ka = S.hands[a].length, kb = S.hands[b].length;
    if (S.calls[a] && !S.calls[b]) return b;
    if (S.calls[b] && !S.calls[a]) return a;
    return ka >= kb ? a : b;
  }

  /** AI 좌석들이 지금 할 수 있는 행동 하나를 적용. 적용했으면 true */
  function aiStep(S) {
    if (S.phase === 'grand') {
      for (let s = 0; s < 4; s++) if (S.ai[s] && S.grand[s] === null) { doGrand(S, s, aiGrand(S, s)); return true; }
      return false;
    }
    if (S.phase === 'pass') {
      for (let s = 0; s < 4; s++) if (S.ai[s] && aiWantsCall(S, s)) { doCall(S, s); return true; }
      for (let s = 0; s < 4; s++) if (S.ai[s] && !S.passSel[s]) { doExchange(S, s, aiExchange(S, s)); return true; }
      return false;
    }
    if (S.phase !== 'play') return false;
    if (S.pendingDragon !== null) {
      if (S.ai[S.pendingDragon]) { doDragon(S, S.pendingDragon, aiDragon(S, S.pendingDragon)); return true; }
      return false;
    }
    for (let s = 0; s < 4; s++) {
      if (!S.ai[s]) continue;
      const b = aiInterruptBomb(S, s);
      if (b && !checkPlay(S, s, b).err) { doPlay(S, s, b, 0); return true; }
    }
    const s = S.turn;
    if (s >= 0 && S.ai[s]) {
      if (aiWantsCall(S, s)) { doCall(S, s); return true; }
      const a = aiTurn(S, s);
      if (a.t === 'play') {
        const e = doPlay(S, s, a.cards, a.wish);
        if (!e) return true;
      }
      if (!doPass(S, s)) return true;
      // 비상: 규칙상 가능한 아무 행동
      const top = S.trick ? S.trick.top : null;
      const any = allCombos(S.hands[s]).map(c => resolve(c, top)).filter(c => c && beats(c, top) && !checkPlay(S, s, c.cards).err);
      if (any.length) { doPlay(S, s, any[0].cards, 0); return true; }
    }
    return false;
  }

  const api = {
    MJ, DOG, PH, DR, rankOf, suitOf, ptsOf, isBomb, bombPow, sortHand, team, sumPts, hasRank,
    interps, resolve, beats, pickPlay, allCombos, canFulfill, newGame, newRound, nextActive, activeCount,
    comboName, cardLabel, RANK_LABEL, mustFulfill, checkPlay, checkPass, canCall,
    doGrand, doCall, doExchange, doPlay, doPass, doDragon, endRound,
    handValue, aiStep, setCallT: v => { CALL_T = v; }, AIP, aiTurn, aiExchange, aiDragon, aiWish, aiInterruptBomb, aiGrand, aiWantsCall,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DC = api;
})(typeof window !== 'undefined' ? window : globalThis);
