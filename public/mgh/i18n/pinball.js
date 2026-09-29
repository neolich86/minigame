/* 핀볼 추첨기 — 영어 사전 */
MGH.dict({
  exact: {
    "핀볼 추첨기": "Pinball Lottery Machine",
    "이름과 개수를 붙여서 입력하세요": "Type a name followed by a count",
    "참가 공 입력 (예: a10, b5, c7, d3)": "Enter balls (e.g. a10, b5, c7, d3)",
    "당첨 조건": "Winning rule",
    "첫 도착": "First to arrive",
    "마지막 도착": "Last to arrive",
    "핀볼 맵": "Pinball map",
    "맵 1 · 클래식": "Map 1 · Classic",
    "맵 2 · 깔때기": "Map 2 · Funnel",
    "맵 3 · 로터 필드": "Map 3 · Rotor Field",
    "▶ 추첨 시작": "▶ Start Draw",
    "↺ 초기화": "↺ Reset",
    "맵은 3배 긴 트랙이며, 창을 확대해 보여드리니 브라우저 스크롤로 위아래를 살펴보며 진행 상황을 확인하세요. 결승 게이트 바로 위에는 360도로 회전하며 게이트에 닿는 장애물이 진입을 방해합니다.":
      "The map is a track three times taller than the window — scroll up and down to follow the action. Right above the finish gate, a 360° spinning obstacle sweeps the entrance.",
    "도착 순서": "Arrival order",
    "추첨 시작 시": "Once the draw starts,",
    "순서대로 표시됩니다": "balls appear here in order",
    "공 입력을 확인해주세요. 예: a10, b5, c7, d3": "Please check your ball entries. e.g. a10, b5, c7, d3",
    "공 개수가 너무 많습니다 (최대 160개). 개수를 줄여주세요.": "Too many balls (max 160). Please enter fewer.",
    "추첨을 시작하면 결승선을 통과한 순서대로 여기에 표시됩니다.": "Once the draw starts, balls are listed here in the order they cross the finish line.",
  },
  patterns: [
    [/^🏆 당첨: ([\s\S]*) \((첫 번째 도착|마지막 도착)\)$/, (m, n, k) => `🏆 Winner: ${n} (${k === "첫 번째 도착" ? "first to arrive" : "last to arrive"})`],
  ],
});
