/* 블랙잭 — 규칙 엔진 + 기본 전략 (DOM 없음, Node에서 테스트 가능)
 *
 * 카드: {r: 1~13 (1=A, 11=J, 12=Q, 13=K), s: 0~3}
 * 슈: 숫자별 남은 장수 배열 [_, A, 2, … K]. 뽑을 때마다 남은 카드 중 하나를 고른다 (순서를 미리 정하지 않음).
 *
 * 규칙: 6덱, 딜러 소프트 17 스탠드(S17), 블랙잭 3:2, 딜러 A·10에서 블랙잭 확인(피크),
 *       보험 2:1, 처음 두 장 더블, 스플릿 후 더블 가능, 최대 4핸드, 에이스 스플릿은 한 장씩만(재스플릿 없음),
 *       레이트 서렌더(처음 두 장, 스플릿 전), 스플릿 후 21은 블랙잭 아님.
 */
(function (root) {
  "use strict";
  const DECKS = 6, CUT = 78; // 남은 카드가 78장(1.5덱) 이하면 다음 판 전에 새 슈
  const MAX_HANDS = 4;
  const pts = (r) => (r === 1 ? 11 : r >= 10 ? 10 : r);

  function newShoe(decks) { const c = [0]; for (let r = 1; r <= 13; r++) c.push(4 * (decks || DECKS)); return c; }
  const shoeLeft = (c) => { let n = 0; for (let r = 1; r <= 13; r++) n += c[r]; return n; };
  function draw(shoe, rng) {
    let u = Math.floor(rng() * shoeLeft(shoe));
    for (let r = 1; r <= 13; r++) { if (u < shoe[r]) { shoe[r]--; return { r, s: Math.floor(rng() * 4) }; } u -= shoe[r]; }
    throw new Error("shoe_empty");
  }
  /** {t: 합계, soft: A를 11로 세고 있는지} */
  function value(cards) {
    let t = 0, aces = 0;
    for (const c of cards) { t += pts(c.r); if (c.r === 1) aces++; }
    while (t > 21 && aces) { t -= 10; aces--; }
    return { t, soft: aces > 0 };
  }
  const isBJ = (cards) => cards.length === 2 && value(cards).t === 21;

  /* ───────── 한 판 ───────── */
  function newHand(cards, bet, split, aces) { return { cards, bet, dbl: false, split: !!split, aces: !!aces, sur: false, done: false }; }

  /** 딜: 플레이어 → 딜러 업카드 → 플레이어 → 딜러 홀카드 */
  function startRound(shoe, bet, rng) {
    const p1 = draw(shoe, rng), d1 = draw(shoe, rng), p2 = draw(shoe, rng), d2 = draw(shoe, rng);
    const R = { bet, hands: [newHand([p1, p2], bet)], cur: 0, dealer: [d1, d2], ins: -1, phase: "play", out: null };
    if (d1.r === 1) { R.phase = "insurance"; return R; } // 딜러 A: 보험(플레이어 블랙잭이면 이븐 머니)부터
    afterPeek(R, shoe, rng);
    return R;
  }
  /** 보험 결정 (take=true면 베팅의 절반) */
  function insurance(R, take, shoe, rng) {
    if (R.phase !== "insurance") return 0;
    R.ins = take ? Math.floor(R.bet / 2) : 0;
    afterPeek(R, shoe, rng);
    return R.ins;
  }
  function afterPeek(R, shoe, rng) {
    if (isBJ(R.dealer) || isBJ(R.hands[0].cards)) { R.hands[0].done = true; finish(R, shoe, rng, false); return; }
    R.phase = "play";
    advance(R, shoe, rng);
  }

  /** 현재 핸드에서 할 수 있는 행동. cash = 더 걸 수 있는 돈 */
  function legal(R, cash) {
    if (R.phase !== "play") return null;
    const h = R.hands[R.cur];
    if (!h || h.done) return null;
    const two = h.cards.length === 2;
    return {
      hit: !h.aces,
      stand: true,
      double: two && !h.aces && cash >= h.bet,
      split: two && pts(h.cards[0].r) === pts(h.cards[1].r) && R.hands.length < MAX_HANDS && !h.aces && cash >= h.bet,
      surrender: two && R.hands.length === 1 && !h.split,
      needDouble: two && !h.aces && cash < h.bet, // 돈이 모자라 더블·스플릿을 못 하는 경우 표시용
    };
  }
  /** 행동 적용 → {err} 또는 {cost: 추가로 건 돈} */
  function act(R, a, shoe, rng, cash) {
    const L = legal(R, cash);
    if (!L) return { err: "phase" };
    if (!L[a]) return { err: a === "double" || a === "split" ? (cash < R.hands[R.cur].bet ? "cash" : "rule") : "rule" };
    const h = R.hands[R.cur];
    let cost = 0;
    if (a === "hit") {
      h.cards.push(draw(shoe, rng));
      if (value(h.cards).t >= 21) h.done = true;
    } else if (a === "stand") {
      h.done = true;
    } else if (a === "double") {
      cost = h.bet; h.bet *= 2; h.dbl = true;
      h.cards.push(draw(shoe, rng)); h.done = true;
    } else if (a === "split") {
      cost = h.bet;
      const aces = h.cards[0].r === 1;
      const second = newHand([h.cards[1]], h.bet, true, aces);
      h.cards = [h.cards[0]]; h.split = true; h.aces = aces;
      R.hands.splice(R.cur + 1, 0, second);
      h.cards.push(draw(shoe, rng));
      if (aces || value(h.cards).t === 21) h.done = true;
    } else if (a === "surrender") {
      h.sur = true; h.done = true;
    }
    advance(R, shoe, rng);
    return { cost };
  }
  function advance(R, shoe, rng) {
    while (R.cur < R.hands.length) {
      const h = R.hands[R.cur];
      if (!h.done && h.cards.length === 1) { // 스플릿한 두 번째 핸드: 차례가 오면 한 장 더
        h.cards.push(draw(shoe, rng));
        if (h.aces || value(h.cards).t === 21) h.done = true;
      }
      if (!h.done && value(h.cards).t >= 21) h.done = true;
      if (!h.done) return;
      R.cur++;
    }
    // 모든 핸드 끝 → 딜러
    const live = R.hands.some((h) => !h.sur && value(h.cards).t <= 21);
    finish(R, shoe, rng, live);
  }
  function finish(R, shoe, rng, dealerDraws) {
    if (dealerDraws) while (value(R.dealer).t < 17) R.dealer.push(draw(shoe, rng)); // 소프트 17 포함 17 이상 스탠드
    R.phase = "done"; R.cur = -1;
    const dv = value(R.dealer).t, dBJ = isBJ(R.dealer);
    let total = 0;
    const hands = R.hands.map((h) => {
      const pv = value(h.cards).t, bj = isBJ(h.cards) && !h.split;
      let res, ret;
      if (h.sur) { res = "sur"; ret = Math.floor(h.bet / 2); }
      else if (dBJ) { res = bj ? "push" : "lose"; ret = bj ? h.bet : 0; }
      else if (bj) { res = "bj"; ret = h.bet + Math.floor(h.bet * 1.5); }
      else if (pv > 21) { res = "bust"; ret = 0; }
      else if (dv > 21 || pv > dv) { res = "win"; ret = h.bet * 2; }
      else if (pv === dv) { res = "push"; ret = h.bet; }
      else { res = "lose"; ret = 0; }
      total += ret;
      return { res, ret };
    });
    const insRet = R.ins > 0 && dBJ ? R.ins * 3 : 0;
    total += insRet;
    const wager = R.hands.reduce((s, h) => s + h.bet, 0) + Math.max(0, R.ins);
    R.out = { hands, insRet, total, wager, net: total - wager, dBJ, dv };
  }

  /* ───────── 기본 전략 (6덱 · S17 · 스플릿 후 더블 · 레이트 서렌더) ───────── */
  function strategy(R, cash) {
    const L = legal(R, cash);
    if (!L) return null;
    const h = R.hands[R.cur], up = pts(R.dealer[0].r); // 2~11
    const v = value(h.cards), two = h.cards.length === 2;
    const D = (x) => (L.double ? "double" : x);
    // 서렌더
    if (L.surrender && !v.soft) {
      const pair8 = h.cards[0].r === h.cards[1].r && pts(h.cards[0].r) === 8;
      if (!pair8 && ((v.t === 16 && up >= 9) || (v.t === 15 && up === 10))) return "surrender";
    }
    // 스플릿
    if (two && L.split) {
      const p = pts(h.cards[0].r);
      const yes = p === 11 || p === 8 ||
        (p === 9 && up !== 7 && up < 10) ||
        ((p === 7 || p === 3 || p === 2) && up <= 7) ||
        (p === 6 && up <= 6) ||
        (p === 4 && (up === 5 || up === 6));
      if (yes) return "split";
    }
    if (v.soft && v.t <= 21) {
      const t = v.t;
      if (t >= 19) return "stand";
      if (t === 18) return up >= 3 && up <= 6 ? D("stand") : up >= 9 ? "hit" : "stand";
      if (t === 17) return up >= 3 && up <= 6 ? D("hit") : "hit";
      if (t >= 15) return up >= 4 && up <= 6 ? D("hit") : "hit";
      return up >= 5 && up <= 6 ? D("hit") : "hit";
    }
    const t = v.t;
    if (t >= 17) return "stand";
    if (t >= 13) return up <= 6 ? "stand" : "hit";
    if (t === 12) return up >= 4 && up <= 6 ? "stand" : "hit";
    if (t === 11) return up <= 10 ? D("hit") : "hit";
    if (t === 10) return up <= 9 ? D("hit") : "hit";
    if (t === 9) return up >= 3 && up <= 6 ? D("hit") : "hit";
    return "hit";
  }

  const BJ = { DECKS, CUT, MAX_HANDS, pts, newShoe, shoeLeft, draw, value, isBJ, startRound, insurance, legal, act, strategy };
  if (typeof module !== "undefined" && module.exports) module.exports = BJ; else root.BLACKJACK = BJ;
})(typeof window !== "undefined" ? window : globalThis);
