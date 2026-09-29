/* 헥사 아일랜드 — 영어 사전
 * 게임 상태(기록 등)는 한국어로 만들어져 온라인 방의 모든 참가자에게 똑같이 전달되고,
 * 각 참가자의 화면에서 자기 언어로 바꿔 보여준다. 그래서 이름(<b>)이 끼어 있는 문장은
 * CATAN_TR 이 HTML 단위로 통째로 번역하고, 나머지 글자는 공용 사전(MGH.dict)이 번역한다. */
(function () {
  var RES = { "나무": "Lumber", "흙": "Brick", "양털": "Wool", "밀": "Grain", "광석": "Ore" };
  var TER = { "숲": "Forest", "언덕": "Hills", "초원": "Pasture", "밭": "Fields", "산": "Mountains", "사막": "Desert" };
  var DEV = { "기사": "Knight", "도로 건설": "Road Building", "풍년": "Year of Plenty", "독점": "Monopoly", "승리점수": "Victory Point" };
  var RKEYS = "나무|흙|양털|밀|광석";
  function res(s) {
    return String(s)
      .replace(new RegExp("(" + RKEYS + ")(\\d+)", "g"), function (_, r, n) { return n + " " + RES[r]; })
      .replace(new RegExp("(" + RKEYS + ")", "g"), function (_, r) { return RES[r]; });
  }
  var N = '(<b style="color:[^"]*">[\\s\\S]*?</b>)';
  var B = "<b>([\\s\\S]*?)</b>";
  function R(src, flags) { return new RegExp(src, flags || ""); }

  // HTML 문장 단위 번역 (기록 · 진행 메시지 · 교역 제안)
  var HTML = [
    [R("^" + N + "가 최장 교역로\\((\\d+)\\)를 차지했습니다\\. \\+2점$"), "$1 takes Longest Road ($2). +2 VP"],
    [R("^" + N + "가 최대 기사력\\(기사 (\\d+)\\)을 차지했습니다\\. \\+2점$"), "$1 takes Largest Army ($2 knights). +2 VP"],
    [R("^" + N + " 정착지 건설$"), "$1 built a settlement"],
    [R("^" + N + " 도시 건설$"), "$1 built a city"],
    [R("^" + N + " 도로 건설$"), "$1 built a road"],
    [R("^" + N + " 발전카드 구입$"), "$1 bought a development card"],
    [R("^" + N + " (\\d):1 교역 — ([\\s\\S]*)$"), function (_, n, r, t) { return n + " traded " + r + ":1 — " + res(t); }],
    [R("^" + B + " 카드를 뽑았습니다\\. 다음 턴부터 사용할 수 있습니다\\.$"), function (_, d) { return "You drew <b>" + (DEV[d] || d) + "</b>. You can play it from your next turn."; }],
    [R("^" + N + " 자원 (\\d+)장 버림$"), "$1 discarded $2 cards"],
    [R("^" + N + " 자리를 AI가 이어받습니다\\.$"), "The AI takes over $1's seat."],
    [R("^" + N + " 님이 돌아왔습니다\\.$"), "$1 is back."],
    [R("^<b>(\\d)인 게임</b> — 먼저 10점에 닿는 개척자가 승리합니다\\.$"), "<b>$1-player game</b> — the first settler to reach 10 points wins."],
    [R("^" + N + " 시작 자원 ([\\s\\S]*)$"), function (_, n, t) { return n + " starting resources: " + res(t); }],
    [R("^" + N + " 주사위 <b>(\\d+)</b> \\((\\d)\\+(\\d)\\)$"), "$1 rolled <b>$2</b> ($3+$4)"],
    [R("^" + N + " \\+([\\s\\S]*)$"), function (_, n, t) { return n + " +" + res(t).replace(/ (?=\d)/g, ", "); }],
    [R("^" + N + "가 도적을 (\\S+?)\\(([\\d-]+)\\)\\(으\\)로 옮겼습니다\\.$"), function (_, n, t, x) { return n + " moved the robber to " + (TER[t] || t) + " (" + x + ")."; }],
    [R("^도적을 (\\S+?)\\(([\\d-]+)\\)\\(으\\)로 옮겼습니다\\.$"), function (_, t, x) { return "Moved the robber to " + (TER[t] || t) + " (" + x + ")."; }],
    [R("^" + N + "가 " + N + "에게서 자원 1장을 훔쳤습니다(?: — (\\S+))?\\.$"), function (_, a, b, r) { return a + " stole a card from " + b + (r ? " — " + res(r) : "") + "."; }],
    [R("^" + N + "에게 훔칠 자원이 없습니다\\.$"), "$1 has nothing to steal."],
    [R("^" + N + "가 " + N + "에게서 자원 1장을 빼앗았습니다\\.$"), "$1 stole a card from $2."],
    [R("^" + N + "에게서 <b>(\\S+)</b> 1장을 빼앗았습니다\\.$"), function (_, n, r) { return "You stole 1 <b>" + res(r) + "</b> from " + n + "."; }],
    [R("^" + N + " (기사|도로 건설|풍년|독점|승리점수) 카드 사용$"), function (_, n, d) { return n + " played " + DEV[d]; }],
    [R("^" + N + "가 <b>(\\S+)</b>를 독점해 (\\d+)장을 가져갔습니다\\.$"), function (_, n, r, k) { return n + " monopolized <b>" + res(r) + "</b> and took " + k + " cards."; }],
    [R("^" + N + "가 풍년으로 ([\\s\\S]*)를 받았습니다\\.$"), function (_, n, t) { return n + " took " + res(t).split(" ").join(", ") + " with Year of Plenty."; }],
    [R("^" + N + "가 무료 도로를 놓았습니다\\.$"), "$1 placed free roads."],
    [R("^" + N + " 도로 건설 카드 사용 — 도로 2개 무료$"), "$1 played Road Building — 2 free roads"],
    [R("^" + N + " 풍년 카드 사용 — ([\\s\\S]*) 획득$"), function (_, n, t) { return n + " played Year of Plenty — got " + res(t).split(" ").join(", "); }],
    [R("^" + N + " 독점 카드 사용 — <b>(\\S+)</b> (\\d+)장 확보$"), function (_, n, r, k) { return n + " played Monopoly — took " + k + " <b>" + res(r) + "</b>"; }],
    [R("^" + N + " 은행 교역 — ([\\s\\S]*) → ([\\s\\S]*)$"), function (_, n, a, b) { return n + " traded with the bank — " + res(a) + " → " + res(b); }],
    [R("^" + N + " 교역 제안 — ([\\s\\S]*) 주고 ([\\s\\S]*) 받기$"), function (_, n, a, b) { return n + " offers " + res(a) + " for " + res(b); }],
    [R("^" + N + " ↔ " + N + " 교역 — ([\\s\\S]*) 주고 ([\\s\\S]*) 받음$"), function (_, n, m, a, b) { return n + " ↔ " + m + " traded — gave " + res(a) + ", got " + res(b); }],
    // 진행 메시지
    [R("^" + B + "가 10점을 달성했습니다\\.$"), "<b>$1</b> reached 10 points."],
    [R("^" + B + "가 버릴 자원을 고르는 중…$"), "<b>$1</b> is choosing cards to discard…"],
    [R("^" + B + "가 고르는 중…$"), "<b>$1</b> is choosing…"],
    [R("^" + B + "가 정착지를 고르는 중…$"), "<b>$1</b> is choosing a settlement spot…"],
    [R("^" + B + "가 도로를 놓는 중…$"), "<b>$1</b> is placing a road…"],
    [R("^" + B + "의 차례입니다…$"), "It's <b>$1</b>'s turn…"],
    [R("^" + B + "가 생각 중…$"), "<b>$1</b> is thinking…"],
    [R("^" + B + "가 진행 중…$"), "<b>$1</b> is playing…"],
    [R("^주사위 <b>(\\d+)</b> · 건설·교역 후 턴을 넘기세요\\.$"), "Rolled <b>$1</b> · build and trade, then end your turn."],
    // 교역 제안 받기 (모달 안 문장)
    [R(N + "가 <b>([^<]*)</b>를 주고, 당신의 <b>([^<]*)</b>를 원합니다\\.", "g"), function (_, n, a, b) { return n + " offers <b>" + res(a) + "</b> for your <b>" + res(b) + "</b>."; }],
  ];

  if (MGH.lang === "en") {
    window.CATAN_TR = function (html) {
      if (!/[가-힣]/.test(html)) return html;
      for (var i = 0; i < HTML.length; i++) {
        var re = HTML[i][0];
        re.lastIndex = 0;
        if (re.test(html)) {
          re.lastIndex = 0;
          return html.replace(re, HTML[i][1]);
        }
      }
      return html;
    };
  }

  var exact = {
    "헥사 아일랜드": "Hexa Isle",
    "10점 선취 · 정식 규칙": "First to 10 · full rules",
    "테마": "Theme", "규칙": "Rules", "새 게임": "New game",
    "게임을 시작합니다.": "Starting the game.",
    "주사위 굴리기": "Roll dice",
    "점수판": "Scoreboard",
    "내 자원": "My resources",
    "내 발전카드": "My development cards",
    "행동": "Actions",
    "도로": "Road", "정착지": "Settlement", "도시": "City", "발전카드": "Dev card",
    "나무1 흙1": "1 Lumber 1 Brick",
    "나무1 흙1 양털1 밀1": "1 Lumber 1 Brick 1 Wool 1 Grain",
    "밀2 광석3": "2 Grain 3 Ore",
    "양털1 밀1 광석1": "1 Wool 1 Grain 1 Ore",
    "교역": "Trade",
    "은행 · 항구 · 다른 개척자에게 제안": "Bank · harbors · offer to other settlers",
    "기록": "Log",
    "기사": "Knight", "도로 건설": "Road Building", "풍년": "Year of Plenty", "독점": "Monopoly", "승리점수": "Victory Point",
    "도적을 옮기고 자원 1장을 훔칩니다. 3장 이상이면 최대 기사력(2점).": "Move the robber and steal a card. Play 3+ for Largest Army (2 VP).",
    "도로 2개를 무료로 놓습니다.": "Place 2 roads for free.",
    "은행에서 원하는 자원 2장을 가져옵니다.": "Take any 2 resources from the bank.",
    "자원 1종을 지정해 모든 상대에게서 전부 빼앗습니다.": "Name a resource — every opponent hands you all of it.",
    "숨겨진 승리점수 1점. 자동으로 계산됩니다.": "A hidden victory point. Counted automatically.",
    "이번 턴에 산 카드는 다음 턴부터 사용할 수 있습니다": "Cards bought this turn can be played from your next turn",
    "라헬": "Rahel", "도르": "Dor", "벤야민": "Benjamin",
    "나": "You", "나 승리": "You win",
    "라헬 AI": "Rahel AI", "도르 AI": "Dor AI", "벤야민 AI": "Benjamin AI",
    "그 자원이 없습니다": "doesn't have those resources",
    "좋은 거래군요": "good deal",
    "손해입니다": "bad deal",
    "조금 부족하네요": "not quite enough",
    "수락": "accept", "거절": "decline",
    "(나)": "(you)", "접속 끊김": "offline",
    "점": "VP", "공개": "public",
    "아직 없습니다.": "None yet.",
    "게임 종료": "Game over",
    "나의 차례": "Your turn",
    "선택 취소": "Cancel",
    "기다리는 중": "Waiting",
    "턴 종료": "End turn",
    "진행 중": "In progress",
    "진행 중…": "In progress…",
    "시작 정착지를 놓을 자리를 고르세요.": "Choose where to place your starting settlement.",
    "방금 놓은 정착지에 붙는 도로를 고르세요.": "Choose a road next to the settlement you just placed.",
    "주사위를 굴려 생산을 시작하세요.": "Roll the dice to produce resources.",
    "정착지를 놓을 교차점을 고르세요.": "Choose an intersection for your settlement.",
    "도시로 키울 정착지를 고르세요.": "Choose a settlement to upgrade to a city.",
    "숨겨진 승리점수 카드를 뽑았습니다. +1점": "You drew a hidden Victory Point card. +1 VP",
    "방장이 게임을 준비하는 중…": "The host is setting up the game…",
    "온라인 방에 연결하는 중…": "Connecting to the online room…",
    "정착지 2곳과 도로 2개를 번갈아 놓습니다. 두 번째 정착지는 시작 자원을 줍니다.": "Take turns placing 2 settlements and 2 roads. Your second settlement gives starting resources.",
    "초기 배치가 끝났습니다. 첫 턴을 시작합니다.": "Setup complete. The first turn begins.",
    "정착지에 이어지는 도로를 놓으세요.": "Place a road connected to your settlement.",
    "아무도 생산하지 못했습니다.": "Nobody produced anything.",
    "7! 손패가 8장 이상이면 절반을 버립니다.": "7! Anyone holding 8+ cards discards half.",
    "도적을 옮길 타일을 고르세요.": "Choose a tile to move the robber to.",
    "훔칠 상대가 없습니다.": "Nobody to steal from.",
    "도로를 놓을 변을 고르세요.": "Choose an edge for your road.",
    "놓을 수 있는 도로가 없습니다.": "There's nowhere to place a road.",
    "몇 명이 섬에 갑니까?": "How many settlers are going?",
    "당신 한 명과 AI 개척자들이 겨룹니다. 사람이 적을수록 자원 경쟁이 덜하고 게임이 빨리 끝납니다.": "You play against AI settlers. Fewer players means less competition and a shorter game.",
    "2인 · AI 1명": "2 players · 1 AI", "3인 · AI 2명": "3 players · 2 AI", "4인 · AI 3명": "4 players · 3 AI",
    "정식 규칙 — 발전카드 25장, 항구 9곳, 최장 교역로·최대 기사력 포함.": "Full rules — 25 development cards, 9 harbors, Longest Road and Largest Army.",
    "친구와 함께 하려면 포털의": "To play with friends, create a room in the portal's",
    "온라인 대전": "Online match",
    "에서 방을 만드세요.": ".",
    "시작하기": "Start",
    "규칙 요약": "Rules summary",
    "헥사 아일랜드에서 이기는 법": "How to win on Hexa Isle",
    "10점": "10 VP",
    "에 먼저 닿으면 승리합니다. 정착지 1점, 도시 2점, 숨은 승리점수 카드 1점, 최장 교역로 2점, 최대 기사력 2점.": " — reach it first to win. Settlement 1, city 2, hidden VP card 1, Longest Road 2, Largest Army 2.",
    "턴 순서": "Turn order",
    "— 주사위를 굴려 생산 → 건설·교역 → 턴 종료. 굴린 숫자의 타일에 접한 정착지는 1장, 도시는 2장을 받습니다. 도적이 올라간 타일은 생산하지 않습니다.": "— roll to produce → build and trade → end turn. Settlements on tiles with the rolled number get 1 card, cities get 2. The robber's tile produces nothing.",
    "7이 나오면": "On a 7",
    "손패가 8장 이상인 사람은 절반을 버리고, 굴린 사람이 도적을 옮긴 뒤 그 타일에 접한 상대 하나에게서 자원 1장을 훔칩니다.": ", anyone with 8+ cards discards half, then the roller moves the robber and steals a card from an opponent on that tile.",
    "건설 비용": "Building costs",
    "— 도로: 나무1 흙1 · 정착지: 나무1 흙1 양털1 밀1 · 도시: 밀2 광석3 · 발전카드: 양털1 밀1 광석1.": "— Road: 1 Lumber 1 Brick · Settlement: 1 Lumber 1 Brick 1 Wool 1 Grain · City: 2 Grain 3 Ore · Dev card: 1 Wool 1 Grain 1 Ore.",
    "거리 규칙": "Distance rule",
    "— 정착지는 다른 정착지·도시와 한 칸 이상 떨어져야 하고, 자기 도로에 이어져야 합니다.": "— settlements must be at least two edges from any other building and connect to your own road.",
    "— 은행과는 같은 자원 4장을 아무 1장으로. 항구를 낀 정착지가 있으면 3:1 또는 해당 자원 2:1. 다른 개척자에게는 원하는 조합을 제안할 수 있습니다.": "— trade 4 of a kind with the bank for any 1. A harbor settlement gives 3:1 or 2:1 for its resource. You can offer any deal to other settlers.",
    "— 산 턴에는 쓸 수 없습니다(승리점수 카드는 자동 계산). 한 턴에 한 장만 사용합니다.": "— can't be played the turn you buy them (VP cards count automatically). One per turn.",
    "닫기": "Close",
    "주사위 7": "Rolled a 7",
    "버리기": "Discard",
    "도적": "Robber",
    "누구에게서 훔칠까요?": "Who do you steal from?",
    "교역 제안": "Trade offer",
    "요청한 자원이 부족해 수락할 수 없습니다.": "You don't have the requested resources.",
    "은행에서 자원 2장": "2 resources from the bank",
    "원하는 자원을 두 번 고르세요. 같은 자원을 두 번 골라도 됩니다.": "Pick a resource twice. You can pick the same one twice.",
    "어떤 자원을 쓸어올까요?": "Which resource do you want to sweep up?",
    "고른 자원을 모든 상대가 전부 내놓습니다.": "Every opponent hands over all of it.",
    "교환": "Trade",
    "무엇을 주고 무엇을 받을까요?": "What will you give and get?",
    "내가 주는 것": "I give",
    "내가 받는 것": "I get",
    "제안 취소": "Cancel offer",
    "개척자들에게 제안": "Offer to settlers",
    "은행·항구와 교환": "Trade with bank / harbor",
    "응답 기다리는 중…": "waiting for reply…",
    "판 살펴보기": "View board",
    "섬은 당신의 것입니다.": "The island is yours.",
    "다음 판에서 되갚아 줍시다.": "Let's get them back next game.",
    "최장 교역로 2": "Longest Road 2",
    "최대 기사력 2": "Largest Army 2",
    "아무거나": "Any",
    "헥사 아일랜드 게임판": "Hexa Isle board",
  };
  for (var r in RES) exact[r] = RES[r];
  for (var t in TER) exact[t] = TER[t];

  MGH.dict({
    exact: exact,
    patterns: [
      [/^(.+)의 차례$/, "$1's turn"],
      [/^손패 (\d+)$/, "Hand $1"],
      [/^도로 (\d+)$/, "Roads $1"],
      [/^최장 (\d+)$/, "Road $1"],
      [/^기사 (\d+)$/, "Knights $1"],
      [/^발전 (\d+)$/, "Dev $1"],
      [/^발전카드 (\d+)$/, "Dev cards $1"],
      [/^(\d+)장$/, "$1 cards"],
      [/^(\d+)장 · 7 위험$/, "$1 cards · 7 danger"],
      [/^(\d+) · 대기$/, "$1 · waiting"],
      [/^정착지 (\d+) · 도시 (\d+) · 도로 (\d+)$/, "Settlements $1 · Cities $2 · Roads $3"],
      [/^무료 도로를 놓으세요 \(남은 (\d+)개\)$/, "Place a free road ($1 left)"],
      [/^자원 (\d+)장을 버려야 합니다$/, "You must discard $1 cards"],
      [/^손패가 (\d+)장이라 절반을 잃습니다\. 버릴 카드를 고르세요\.$/, "You hold $1 cards, so you lose half. Choose what to discard."],
      [/^보유 (\d+)$/, "have $1"],
      [/^선택 (\d+) \/ (\d+)$/, "Selected $1 / $2"],
      [/^([\s\S]+) · (\d+)장$/, "$1 · $2 cards"],
      [/^([\s\S]+)의 제안$/, "$1's offer"],
      [/^고른 카드 — 없음$/, "Picked — none"],
      [/^고른 카드 — ([\s\S]+)$/, function (_, s) { return "Picked — " + res(s); }],
      [/^내 교역 비율 — ([\s\S]+)$/, function (_, s) { return "My trade rates — " + res(s); }],
      [/^(수락|거절) — ([\s\S]+)$/, function (_, a, b) { return (a === "수락" ? "Accepts" : "Declines") + " — " + (exact[b] || b); }],
      [/^게임 종료 · (\d+)턴$/, "Game over · turn $1"],
      [/^([\s\S]+) 승리$/, "$1 wins"],
      [/^(\d+)점$/, "$1 VP"],
      [/^([\s\S]*=)$/, function (_, s) {
        return s.replace(/건물/g, "Buildings").replace(/카드/g, "Cards").replace(/최장 교역로/g, "Longest Road").replace(/최대 기사력/g, "Largest Army");
      }],
    ],
    frags: [["라헬", "Rahel"], ["벤야민", "Benjamin"], ["도르", "Dor"], ["나무", "Lumber"], ["양털", "Wool"], ["광석", "Ore"], ["흙", "Brick"], ["밀", "Grain"]],
  });
})();
