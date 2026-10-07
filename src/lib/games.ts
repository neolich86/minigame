// 미니게임천국 게임 카탈로그 — 포털 목록·플레이 페이지·랭킹이 모두 이 데이터를 기준으로 동작한다.
import type { Lang } from "./i18n";

export type Genre = "board" | "action" | "strategy" | "casual";

/** 사이트 안의 큰 구분 — 게임(/play) · 추첨·도구(/tools) · 서비스(/apps) */
export type Kind = "game" | "tool" | "app";
export const KINDS: Kind[] = ["game", "tool", "app"];
export const KIND_BASE: Record<Kind, string> = { game: "/play", tool: "/tools", app: "/apps" };
/** 구분별 목록 페이지 주소 (게임은 홈) */
export const KIND_INDEX: Record<Kind, string> = { game: "/", tool: "/tools", app: "/apps" };

/** 랭킹 보드 하나. 한 게임에 보드가 여러 개일 수 있다 (예: 세계도시 타이핑 한타/영타). */
export interface Board {
  id: string; // DB game_id 로 저장되는 값 — supabase/migrations 의 ranked_boards 와 반드시 일치
  label: { ko: string; en: string };
  unit: { ko: string; en: string };
  /** 점수 표시 포맷 — roundtime: 점수 = 라운드×1,000,000 + (999,999−초) */
  format?: "number" | "time" | "won" | "level" | "roundtime";
  /** roundtime 에서 이 라운드를 넘으면 '클리어'로 표시 */
  maxRound?: number;
  /** 친구에게 도전하기 — 경쟁 방식 문구 (도전장 페이지·미리보기 이미지) */
  vs?: {
    label: { ko: string; en: string }; // "내 생존" 의 '생존' 처럼 기록 이름
    question: { ko: string; en: string }; // "누가 오래 버티나?"
    unit?: { ko: string; en: string }; // 도전장에서는 이 단위로 표시 (예: 타·WPM)
  };
}

export interface Game {
  id: string;
  title: { ko: string; en: string };
  desc: { ko: string; en: string };
  genre: Genre;
  /** 기본 game — 추첨기 같은 도구는 tool, 로그인해 쓰는 개인 서비스는 app */
  kind?: Kind;
  thumb: string;
  /** public/games/<id>/index.html 로 서빙되는 정적 게임 */
  src: string;
  boards?: Board[];
  /** 로그인 사용자끼리 온라인 대전 가능 (포털 내 방 시스템) */
  online?: boolean;
  /** 온라인 방에서 고를 수 있는 인원 (기본 2·3·4) */
  onlinePlayers?: number[];
  /** 좌석 색 (팀전이면 같은 팀끼리 같은 색) */
  seatColors?: string[];
  /** 2:2 팀전 — 좌석 0·2 vs 1·3 */
  teams?: boolean;
  /** 로그인 사용자의 게임 데이터를 계정에 저장 (bridge.js MGH.save → game_saves / game-files) */
  saves?: boolean;
  /** 포털 목록·사이트맵·추천에서 숨김 (주소로 직접 들어가면 열림) */
  hidden?: boolean;
}

/** 숨긴 게임까지 포함한 전체 목록 — 주소로 찾을 때만 쓴다 */
const CATALOG: Game[] = [
  {
    id: "catan",
    title: { ko: "헥사 아일랜드", en: "Hexa Isle" },
    desc: {
      ko: "육각형 타일 섬을 개척하는 전략 보드게임. 친구와 온라인 대전, 또는 AI 최대 3명과 겨뤄 10점을 먼저 모으면 승리",
      en: "A strategy board game of settling a hex-tile island — play online with friends or against up to 3 AI. First to 10 points wins",
    },
    genre: "board",
    thumb: "/thumbs/catan.jpg",
    src: "/games/catan/index.html",
    online: true,
  },
  {
    id: "lexio",
    title: { ko: "타일러쉬", en: "Tile Rush" },
    desc: {
      ko: "손패의 숫자 타일을 먼저 털어내면 이기는 대전 게임. 친구와 온라인 대전, 또는 AI와 대결. 페어·조합 대응 전략이 핵심",
      en: "Be the first to shed every number tile in your hand — play online with friends or against AI. Countering combos is the key",
    },
    genre: "board",
    thumb: "/thumbs/lexio.jpg",
    src: "/games/lexio/index.html",
    online: true,
  },
  {
    id: "dragon-call",
    title: { ko: "드래곤 콜", en: "Dragon Call" },
    desc: {
      ko: "2:2 팀전 클라이밍 카드게임. 콜 선언·카드 교환·폭탄, 용과 봉황으로 1000점을 먼저 넘기면 승리. 친구와 온라인 대전 또는 AI와 대결",
      en: "A 2-vs-2 team climbing card game — calls, card passing, bombs, the Dragon and the Phoenix. First team to 1,000 wins. Play online with friends or against AI",
    },
    genre: "board",
    thumb: "/thumbs/dragon-call.jpg",
    src: "/games/dragon-call/index.html",
    online: true,
    onlinePlayers: [4],
    seatColors: ["#e0573e", "#3d8bd9", "#e0573e", "#3d8bd9"],
    teams: true,
  },
  {
    id: "world-typing",
    title: { ko: "세계도시 타이핑", en: "World City Typing" },
    desc: {
      ko: "실제 지도 위 235개 도시 이름을 빠르게 타이핑해서 맞히는 게임",
      en: "Type the names of 235 real cities on a live map as fast as you can",
    },
    genre: "casual",
    thumb: "/thumbs/world-typing.jpg",
    src: "/games/world-typing/index.html",
    boards: [
      { id: "world-typing-kr", label: { ko: "한타", en: "Korean" }, unit: { ko: "점", en: "pts" }, vs: { label: { ko: "기록", en: "record" }, question: { ko: "누가 더 빠른가?", en: "Who's faster?" }, unit: { ko: "타", en: " CPM" } } },
      { id: "world-typing-en", label: { ko: "영타", en: "English" }, unit: { ko: "점", en: "pts" }, vs: { label: { ko: "기록", en: "record" }, question: { ko: "누가 더 빠른가?", en: "Who's faster?" }, unit: { ko: " WPM", en: " WPM" } } },
    ],
  },
  {
    id: "weapon",
    title: { ko: "무기 강화", en: "Weapon Enhance" },
    desc: {
      ko: "검을 Lv.1부터 100까지 강화하는 확률형 게임, 실패하면 유지되고 파괴되면 초기화됩니다",
      en: "Enhance your weapon from Lv.1 to Lv.100 — fail and it stays, break and it resets",
    },
    genre: "casual",
    thumb: "/thumbs/weapon.jpg",
    src: "/games/weapon/index.html",
    boards: [{ id: "weapon", label: { ko: "최고 강화", en: "Best level" }, unit: { ko: "", en: "" }, format: "level", vs: { label: { ko: "강화", en: "level" }, question: { ko: "누가 더 높이 강화하나?", en: "Who can enhance higher?" } } }],
  },
  {
    id: "oripa",
    title: { ko: "오리파 시뮬레이터", en: "Oripa Simulator" },
    desc: {
      ko: "실제 온라인 카드 뽑기(오리파)를 체험하는 포켓몬/원피스 카드 시뮬레이터",
      en: "A Pokémon / One Piece card-pack opening simulator based on real online 'oripa' draws",
    },
    genre: "casual",
    thumb: "/thumbs/oripa.jpg",
    src: "/games/oripa/index.html",
    boards: [{ id: "oripa", label: { ko: "최고 자금", en: "Peak funds" }, unit: { ko: "", en: "" }, format: "won", vs: { label: { ko: "최고 자산", en: "peak funds" }, question: { ko: "누가 더 부자가 되나?", en: "Who gets richer?" } } }],
  },
  {
    id: "lotto",
    kind: "tool",
    title: { ko: "로또 번호 추첨기", en: "Lotto Number Picker" },
    desc: {
      ko: "1개부터 5개까지 원하는 만큼 로또 번호를 뽑고 포함·제외 조건도 설정하는 추첨기",
      en: "Draw 1 to 5 sets of lotto numbers at once, with include/exclude number filters",
    },
    genre: "casual",
    thumb: "/thumbs/lotto.jpg",
    src: "/games/lotto/index.html",
  },
  {
    id: "pinball",
    kind: "tool",
    title: { ko: "핀볼 추첨기", en: "Pinball Lottery Machine" },
    desc: {
      ko: "참가 공을 입력하고 회전하는 핀볼 맵을 굴려 도착 순서로 당첨을 가리는 추첨기",
      en: "Drop entries onto a rotating pinball map — arrival order decides the winners",
    },
    genre: "casual",
    thumb: "/thumbs/pinball.jpg",
    src: "/games/pinball/index.html",
  },
  {
    id: "my-post-2026",
    kind: "app",
    title: { ko: "My Post 2026", en: "My Post 2026" },
    desc: {
      ko: "올해 좋아요를 가장 많이 받은 게시물 BEST 9와 월별 좋아요·골든 타임을 한 장으로 정리하는 연말 피드 리포트 (오픈 준비 중, 샘플 미리보기)",
      en: "A year-in-review feed report: your 9 most-liked posts of the year, monthly likes and best posting times (coming soon, sample preview)",
    },
    genre: "casual",
    thumb: "/thumbs/my-post-2026.jpg",
    src: "/games/my-post-2026/index.html",
    hidden: true, // 인스타 프로페셔널 계정 + 메타 앱 심사가 필요해 개인용으로만 둠
  },
  {
    id: "sports-forecast",
    kind: "app",
    title: { ko: "스포츠 승부 예측", en: "Sports Forecast" },
    desc: {
      ko: "프리미어리그·라리가·챔스 등 유럽 축구 경기의 승·무·패 확률과 예상 스코어, 리그 우승·강등 확률을 통계 모델로 계산해요. 적중률도 공개합니다",
      en: "Win, draw and loss probabilities, likely scores and title/relegation odds for Europe's top football leagues, from a statistical model with a public track record",
    },
    genre: "casual",
    thumb: "/thumbs/sports-forecast.jpg",
    src: "/apps/sports-forecast", // 정적 게임이 아닌 Next 페이지 (app/apps/sports-forecast)
  },
  {
    id: "passport-map",
    kind: "app",
    title: { ko: "Passport Map", en: "Passport Map" },
    desc: {
      ko: "다녀온 나라와 도시를 세계지도에 원하는 색으로 칠하고, 장소마다 사진 1장을 남기는 여행 지도. 로그인하면 계정에 저장되고 SNS 공유 이미지도 만들 수 있어요",
      en: "Color the countries and cities you've visited on a world map and pin one photo to each place. Log in to keep it in your account and make a share image for social media",
    },
    genre: "casual",
    thumb: "/thumbs/passport-map.jpg?v=2",
    src: "/games/passport-map/index.html",
    saves: true,
  },
  {
    id: "raiden",
    title: { ko: "스카이 스트라이크", en: "Sky Strike" },
    desc: {
      ko: "보스전이 있는 세로 스크롤 전투기 슈팅 게임, 레이저와 폭탄으로 화면을 정리",
      en: "A vertical-scroll shooter with boss battles — clear the screen with lasers and bombs",
    },
    genre: "action",
    thumb: "/thumbs/raiden.jpg",
    src: "/games/raiden/index.html",
    boards: [{ id: "raiden", label: { ko: "점수", en: "Score" }, unit: { ko: "점", en: "pts" }, vs: { label: { ko: "점수", en: "score" }, question: { ko: "점수 대결", en: "Score battle" } } }],
  },
  {
    id: "archer",
    title: { ko: "궁수 서바이버", en: "Archer Survivor" },
    desc: {
      ko: "몰려오는 몬스터 무리를 뚫고 스킬을 성장시키는 뱀서류 로그라이크",
      en: "A Vampire-Survivors-style roguelike — fight through hordes and grow your skills",
    },
    genre: "action",
    thumb: "/thumbs/archer.jpg",
    src: "/games/archer/index.html",
    boards: [{ id: "archer", label: { ko: "생존 시간", en: "Survival" }, unit: { ko: "", en: "" }, format: "time", vs: { label: { ko: "생존", en: "survival" }, question: { ko: "누가 오래 버티나?", en: "Who survives longer?" } } }],
  },
  {
    id: "random-td",
    title: { ko: "랜덤 타워 디펜스", en: "Random Tower Defense" },
    desc: {
      ko: "9단계 희귀도의 가챠형 타워를 뽑아 조합하는 방치형 타워 디펜스",
      en: "An idle tower defense — gacha-pull towers across 9 rarity tiers and combine them",
    },
    genre: "strategy",
    thumb: "/thumbs/random-td.jpg",
    src: "/games/random-td/index.html",
    boards: [{ id: "random-td", label: { ko: "도달 라운드", en: "Round reached" }, unit: { ko: "", en: "" }, format: "roundtime" }],
  },
  {
    id: "element-td",
    title: { ko: "Element Siege", en: "Element Siege" },
    desc: {
      ko: "불·얼음·자연 속성을 조합해 웨이브를 막는 아이소메트릭 타워 디펜스",
      en: "An isometric tower defense — combine Fire, Ice and Nature to hold the line",
    },
    genre: "strategy",
    thumb: "/thumbs/element-td.jpg",
    src: "/games/element-td/index.html",
    boards: [{ id: "element-td", label: { ko: "도달 라운드", en: "Round reached" }, unit: { ko: "", en: "" }, format: "roundtime", maxRound: 50 }],
  },
];

/** 포털에 보이는 모든 항목 (게임·도구·서비스) */
export const GAMES: Game[] = CATALOG.filter((g) => !g.hidden);

export function kindOf(g: Game): Kind {
  return g.kind ?? "game";
}
/** 구분별로 보이는 항목 */
export function itemsOf(kind: Kind): Game[] {
  return GAMES.filter((g) => kindOf(g) === kind);
}
/** 항목 자체 페이지 주소 — /play/<id> · /tools/<id> · /apps/<id> */
export function itemPath(g: Game): string {
  return `${KIND_BASE[kindOf(g)]}/${g.id}`;
}
/** 목록에서 눌렀을 때 가는 주소 — 온라인 게임은 로비 */
export function entryPath(g: Game): string {
  return g.online ? `/online/${g.id}` : itemPath(g);
}

export const GENRES: Genre[] = ["board", "action", "strategy", "casual"];

export function gameById(id: string): Game | undefined {
  return CATALOG.find((g) => g.id === id);
}

export function boardById(id: string): { game: Game; board: Board } | undefined {
  for (const game of GAMES) {
    const board = game.boards?.find((b) => b.id === id);
    if (board) return { game, board };
  }
  return undefined;
}

export const ALL_BOARDS = GAMES.flatMap((g) => (g.boards ?? []).map((b) => ({ game: g, board: b })));

/** 도전장에서 보여줄 기록 (vs.unit 이 있으면 그 단위로) */
export function formatVs(board: Board, score: number, lang: Lang): string {
  const u = board.vs?.unit?.[lang];
  if (u !== undefined) return score.toLocaleString(lang === "ko" ? "ko-KR" : "en-US") + u;
  return formatScore(board, score, lang);
}

export function formatScore(board: Board, score: number, lang: Lang): string {
  switch (board.format) {
    case "time": {
      const m = Math.floor(score / 60);
      const s = Math.floor(score % 60);
      return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    case "won":
      return "₩" + score.toLocaleString("ko-KR");
    case "level":
      return `Lv.${score}`;
    case "roundtime": {
      const round = Math.floor(score / 1000000);
      const sec = 999999 - (score % 1000000);
      const t = `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
      if (board.maxRound && round > board.maxRound) return (lang === "ko" ? "클리어 · " : "Clear · ") + t;
      return (lang === "ko" ? `${round}라운드 · ` : `Round ${round} · `) + t;
    }
    default: {
      const u = board.unit[lang];
      return score.toLocaleString(lang === "ko" ? "ko-KR" : "en-US") + (u ? ` ${u}` : "");
    }
  }
}
