/* 랜덤 타워 디펜스 — 자체 다국어가 놓친 정적 문구 보완 */
MGH.dict({ exact: {
  "준비 중...": "Loading...", "📊 확률표": "📊 Odds", "💾 세이브/로드": "💾 Save/Load", "세이브 / 로드": "Save / Load",
  "현재 상태 저장": "Save current state", "코드 생성하기": "Generate code", "복사": "Copy", "코드로 불러오기": "Load from code",
  "불러오기": "Load", "등급별 뽑기 확률": "Pull odds by grade", "뽑기 1회 비용: 10G": "Cost per pull: 10G", "타워 정보": "Tower info",
  "판매하기": "Sell", "🎲 랜덤 타워 뽑기 (10G)": "🎲 Random tower pull (10G)", "언덕이 함락되었습니다.": "The hill has fallen.",
  "다시 시작": "Restart", "세이브 코드 붙여넣기": "Paste save code",
}, patterns: [[/^(일반|레어|고대|유물) 판매\((\d+)\)$/, function (_, g, n) { return ({ "일반": "Sell common", "레어": "Sell rare", "고대": "Sell ancient", "유물": "Sell relic" })[g] + " (" + n + ")"; }]] });
