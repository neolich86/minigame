// 스포츠 승부 예측 — 팀 표시 (한국어 이름 사전, 약자 + 색 배지)
// 구단 엠블럼은 상표 문제로 쓰지 않는다. 대신 약자(TLA)와 구단 대표색으로 배지를 만든다.

/** 이름 비교용 정규화: 소문자, 악센트 제거, 구단 접미사 제거 */
export function normName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.'’&]/g, " ")
    .replace(/\b(fc|cf|afc|sc|ac|ss|ssc|as|ud|rcd|ca|sv|vfl|vfb|tsg|1|fk|club|de|football|calcio|futbol|hotspur|and)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// 영문 이름(정규화 전 형태로 적어도 됨) → 한국어. 사전에 없으면 영문 그대로 표시한다.
const KO_RAW: Record<string, string> = {
  // 프리미어리그 / 챔피언십
  "Arsenal": "아스널", "Aston Villa": "애스턴 빌라", "Bournemouth": "본머스", "Brentford": "브렌트퍼드",
  "Brighton Hove Albion": "브라이턴", "Brighton": "브라이턴", "Burnley": "번리", "Chelsea": "첼시",
  "Crystal Palace": "크리스탈 팰리스", "Everton": "에버턴", "Fulham": "풀럼", "Leeds United": "리즈",
  "Leicester City": "레스터", "Liverpool": "리버풀", "Luton Town": "루턴", "Manchester City": "맨시티",
  "Man City": "맨시티", "Manchester United": "맨유", "Man United": "맨유", "Newcastle United": "뉴캐슬",
  "Newcastle": "뉴캐슬", "Nottingham Forest": "노팅엄", "Nottingham": "노팅엄", "Sheffield United": "셰필드 유나이티드",
  "Southampton": "사우샘프턴", "Sunderland": "선덜랜드", "Tottenham": "토트넘", "Tottenham Hotspur": "토트넘",
  "West Ham United": "웨스트햄", "West Ham": "웨스트햄", "Wolverhampton Wanderers": "울버햄튼", "Wolverhampton": "울버햄튼",
  "Ipswich Town": "입스위치", "Norwich City": "노리치", "Watford": "왓퍼드", "West Bromwich Albion": "웨스트브롬",
  "Middlesbrough": "미들즈브러", "Coventry City": "코번트리", "Stoke City": "스토크", "Swansea City": "스완지",
  "Hull City": "헐 시티", "Birmingham City": "버밍엄", "Queens Park Rangers": "QPR", "Blackburn Rovers": "블랙번",
  "Sheffield Wednesday": "셰필드 웬즈데이", "Cardiff City": "카디프", "Bristol City": "브리스톨 시티",
  "Millwall": "밀월", "Preston North End": "프레스턴", "Derby County": "더비", "Portsmouth": "포츠머스",
  "Plymouth Argyle": "플리머스", "Oxford United": "옥스퍼드", "Wrexham": "렉섬",
  // 라리가
  "Barcelona": "바르셀로나", "Barça": "바르셀로나", "Real Madrid": "레알 마드리드", "Atletico Madrid": "아틀레티코",
  "Club Atletico de Madrid": "아틀레티코", "Atleti": "아틀레티코", "Sevilla": "세비야", "Real Betis": "레알 베티스",
  "Real Betis Balompie": "레알 베티스", "Villarreal": "비야레알", "Real Sociedad": "레알 소시에다드",
  "Real Sociedad de Futbol": "레알 소시에다드", "Athletic Club": "아틀레틱 빌바오", "Athletic": "아틀레틱 빌바오",
  "Valencia": "발렌시아", "Girona": "지로나", "Celta": "셀타 비고", "RC Celta de Vigo": "셀타 비고",
  "Osasuna": "오사수나", "CA Osasuna": "오사수나", "Getafe": "헤타페", "Rayo Vallecano": "라요 바예카노",
  "Rayo Vallecano de Madrid": "라요 바예카노", "Mallorca": "마요르카", "RCD Mallorca": "마요르카",
  "Las Palmas": "라스팔마스", "UD Las Palmas": "라스팔마스", "Alaves": "알라베스", "Deportivo Alaves": "알라베스",
  "Espanyol": "에스파뇰", "RCD Espanyol de Barcelona": "에스파뇰", "Leganes": "레가네스", "Valladolid": "바야돌리드",
  "Real Valladolid": "바야돌리드", "Elche": "엘체", "Levante": "레반테", "Real Oviedo": "오비에도",
  // 분데스리가
  "Bayern Munchen": "바이에른 뮌헨", "Bayern": "바이에른 뮌헨", "FC Bayern München": "바이에른 뮌헨",
  "Borussia Dortmund": "도르트문트", "Dortmund": "도르트문트", "Bayer 04 Leverkusen": "레버쿠젠", "Leverkusen": "레버쿠젠",
  "RB Leipzig": "라이프치히", "Leipzig": "라이프치히", "VfB Stuttgart": "슈투트가르트", "Stuttgart": "슈투트가르트",
  "Eintracht Frankfurt": "프랑크푸르트", "Frankfurt": "프랑크푸르트", "SC Freiburg": "프라이부르크", "Freiburg": "프라이부르크",
  "VfL Wolfsburg": "볼프스부르크", "Wolfsburg": "볼프스부르크", "Borussia Monchengladbach": "묀헨글라트바흐",
  "M'gladbach": "묀헨글라트바흐", "TSG 1899 Hoffenheim": "호펜하임", "Hoffenheim": "호펜하임",
  "1. FC Union Berlin": "우니온 베를린", "Union Berlin": "우니온 베를린", "SV Werder Bremen": "베르더 브레멘",
  "Bremen": "베르더 브레멘", "1. FSV Mainz 05": "마인츠", "Mainz": "마인츠", "FC Augsburg": "아우크스부르크",
  "Augsburg": "아우크스부르크", "1. FC Heidenheim 1846": "하이덴하임", "Heidenheim": "하이덴하임",
  "VfL Bochum 1848": "보훔", "Bochum": "보훔", "FC St. Pauli 1910": "장크트파울리", "St. Pauli": "장크트파울리",
  "Holstein Kiel": "홀슈타인 킬", "1. FC Köln": "쾰른", "Köln": "쾰른", "Hamburger SV": "함부르크", "HSV": "함부르크",
  "SV Darmstadt 98": "다름슈타트",
  // 세리에A
  "FC Internazionale Milano": "인테르", "Inter": "인테르", "AC Milan": "AC 밀란", "Milan": "AC 밀란",
  "Juventus": "유벤투스", "SSC Napoli": "나폴리", "Napoli": "나폴리", "AS Roma": "AS 로마", "Roma": "AS 로마",
  "SS Lazio": "라치오", "Lazio": "라치오", "Atalanta BC": "아탈란타", "Atalanta": "아탈란타", "ACF Fiorentina": "피오렌티나",
  "Fiorentina": "피오렌티나", "Bologna FC 1909": "볼로냐", "Bologna": "볼로냐", "Torino": "토리노", "Udinese Calcio": "우디네세",
  "Udinese": "우디네세", "Genoa CFC": "제노아", "Genoa": "제노아", "Como 1907": "코모", "Como": "코모",
  "Cagliari Calcio": "칼리아리", "Cagliari": "칼리아리", "Hellas Verona": "베로나", "Verona": "베로나",
  "US Lecce": "레체", "Lecce": "레체", "Parma Calcio 1913": "파르마", "Parma": "파르마", "Empoli": "엠폴리",
  "AC Monza": "몬차", "Monza": "몬차", "Venezia": "베네치아", "US Sassuolo Calcio": "사수올로", "Sassuolo": "사수올로",
  "US Cremonese": "크레모네세", "Pisa": "피사", "Frosinone": "프로시노네", "Salernitana": "살레르니타나",
  // 리그1
  "Paris Saint-Germain": "파리 생제르맹", "PSG": "파리 생제르맹", "Olympique de Marseille": "마르세유", "Marseille": "마르세유",
  "AS Monaco": "모나코", "Monaco": "모나코", "Olympique Lyonnais": "리옹", "Lyon": "리옹", "Lille OSC": "릴",
  "Lille": "릴", "OGC Nice": "니스", "Nice": "니스", "RC Lens": "랑스", "Lens": "랑스", "Stade Rennais FC 1901": "렌",
  "Rennes": "렌", "Stade Brestois 29": "브레스트", "Brest": "브레스트", "RC Strasbourg Alsace": "스트라스부르",
  "Strasbourg": "스트라스부르", "Toulouse": "툴루즈", "FC Nantes": "낭트", "Nantes": "낭트", "Montpellier HSC": "몽펠리에",
  "Stade de Reims": "랭스", "Reims": "랭스", "AJ Auxerre": "오세르", "Auxerre": "오세르", "Angers SCO": "앙제",
  "Le Havre AC": "르아브르", "Le Havre": "르아브르", "AS Saint-Étienne": "생테티엔", "Saint-Étienne": "생테티엔",
  "FC Lorient": "로리앙", "Lorient": "로리앙", "Paris FC": "파리 FC", "FC Metz": "메스", "Metz": "메스",
  // 포르투갈 / 네덜란드
  "SL Benfica": "벤피카", "Benfica": "벤피카", "FC Porto": "포르투", "Porto": "포르투", "Sporting CP": "스포르팅",
  "Sporting Clube de Portugal": "스포르팅", "Sporting": "스포르팅", "SC Braga": "브라가", "Braga": "브라가",
  "Vitória SC": "비토리아 기마랑이스", "AFC Ajax": "아약스", "Ajax": "아약스", "PSV": "PSV", "PSV Eindhoven": "PSV",
  "Feyenoord Rotterdam": "페예노르트", "Feyenoord": "페예노르트", "AZ": "AZ 알크마르", "AZ Alkmaar": "AZ 알크마르",
  "FC Twente '65": "트벤테", "Twente": "트벤테", "FC Utrecht": "위트레흐트", "Utrecht": "위트레흐트",
  // 챔스 단골 기타
  "Celtic FC": "셀틱", "Celtic": "셀틱", "Club Brugge KV": "클럽 브뤼헤", "Club Brugge": "클럽 브뤼헤",
  "FK Crvena Zvezda": "츠르베나 즈베즈다", "Galatasaray SK": "갈라타사라이", "Galatasaray": "갈라타사라이",
  "Fenerbahçe SK": "페네르바흐체", "FC Shakhtar Donetsk": "샤흐타르", "Red Bull Salzburg": "잘츠부르크",
  "FC Red Bull Salzburg": "잘츠부르크", "Sturm Graz": "슈투름 그라츠", "SK Slavia Praha": "슬라비아 프라하",
  "AC Sparta Praha": "스파르타 프라하", "GNK Dinamo Zagreb": "디나모 자그레브", "BSC Young Boys": "영 보이스",
  "Olympiacos FC": "올림피아코스", "FC København": "코펜하겐", "Bodø/Glimt": "보되/글림트",
};

const KO = new Map<string, string>();
for (const [k, v] of Object.entries(KO_RAW)) KO.set(normName(k), v);

export interface TeamInfo {
  id: number;
  name: string;
  short_name: string | null;
  tla: string | null;
  club_colors?: string | null;
  name_ko?: string | null;
}

/** 화면 표시 이름 — 한국어는 DB name_ko > 사전 > 영문 짧은 이름 */
export function teamName(t: Pick<TeamInfo, "name" | "short_name" | "name_ko">, lang: "ko" | "en"): string {
  const en = t.short_name || t.name;
  if (lang === "en") return en;
  return t.name_ko || KO.get(normName(t.name)) || (t.short_name ? KO.get(normName(t.short_name)) : undefined) || en;
}

export function teamTla(t: Pick<TeamInfo, "tla" | "short_name" | "name">): string {
  if (t.tla) return t.tla.slice(0, 3).toUpperCase();
  const n = (t.short_name || t.name).replace(/[^A-Za-z]/g, "");
  return n.slice(0, 3).toUpperCase() || "???";
}

/* ───────────── 색 배지 ───────────── */

const COLOR_WORDS: [RegExp, string][] = [
  [/sky ?blue|light ?blue|celeste/, "#6cabdd"],
  [/navy|dark ?blue|marine/, "#1d2c5e"],
  [/royal ?blue/, "#1f4fbf"],
  [/claret|maroon|burgundy|bordeaux|garnet|grenat/, "#7a1f3d"],
  [/crimson|scarlet/, "#c8102e"],
  [/red|rouge|rojo|rosso/, "#d71f2b"],
  [/blue|azul|bleu|azzurro/, "#1b5fbf"],
  [/dark ?green/, "#145c38"],
  [/green|verde|vert/, "#1f8a4c"],
  [/gold|amber/, "#d4a017"],
  [/yellow|amarillo|jaune|giallo/, "#f2c618"],
  [/orange|naranja/, "#f07d00"],
  [/purple|violet|viola/, "#5b2c8f"],
  [/pink|rosa/, "#e86aa6"],
  [/black|negro|noir|nero/, "#16181d"],
  [/white|blanco|blanc|bianco/, "#f4f4f4"],
  [/grey|gray|silver/, "#9aa3ad"],
  [/brown/, "#6b4423"],
];

const FALLBACK = ["#d64545", "#2f6fd6", "#1f9a5a", "#d18a12", "#7a4fd1", "#c2427f", "#127f8c", "#5a6b80", "#b5542b", "#3e8e2f", "#8c3fa0", "#2a5aa8"];

function wordColor(w: string): string | null {
  const s = w.toLowerCase();
  for (const [re, c] of COLOR_WORDS) if (re.test(s)) return c;
  return null;
}

function lum(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

/** 배지 색: { bg, fg, ring } — 대표색 첫째가 배경, 둘째가 테두리, 글자는 대비가 큰 색 */
export function badgeColors(t: Pick<TeamInfo, "id" | "club_colors">): { bg: string; fg: string; ring: string } {
  const parts = (t.club_colors ?? "").split(/\s*[\/,&-]\s*|\s+and\s+/i).map(wordColor).filter((x): x is string => !!x);
  const bg = parts[0] ?? FALLBACK[Math.abs(t.id) % FALLBACK.length];
  let ring = parts.find((c) => c !== bg) ?? bg;
  // 흰 글자와 검은 글자 중 대비가 큰 쪽
  const L = lum(bg);
  const fg = (1.05) / (L + 0.05) >= (L + 0.05) / (lum("#111418") + 0.05) ? "#ffffff" : "#111418";
  if (ring === bg) ring = fg === "#ffffff" ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.35)";
  return { bg, fg, ring };
}
