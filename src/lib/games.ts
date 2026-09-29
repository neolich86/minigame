// 미니게임천국 게임 카탈로그 — 포털 목록·플레이 페이지·랭킹이 모두 이 데이터를 기준으로 동작한다.
import type { Lang } from "./i18n";

export type Genre = "board" | "action" | "strategy" | "casual";

/** 랭킹 보드 하나. 한 게임에 보드가 여러 개일 수 있다 (예: 세계도시 타이핑 한타/영타). */
export interface Board {
  id: string; // DB game_id 로 저장되는 값 — supabase/migrations 의 ranked_boards 와 반드시 일치
  label: { ko: string; en: string };
  unit: { ko: string; en: string };
  /** 점수 표시 포맷 */
  format?: "number" | "time" | "won" | "level";
}

export interface Game {
  id: string;
  title: { ko: string; en: string };
  desc: { ko: string; en: string };
  genre: Genre;
  thumb: string;
  /** public/games/<id>/index.html 로 서빙되는 정적 게임 */
  src: string;
  boards?: Board[];
  /** 로그인 사용자끼리 온라인 대전 가능 (포털 내 방 시스템) */
  online?: boolean;
}

export const GAMES: Game[] = [
  {
    id: "catan",
    title: { ko: "카탄 섬 개척기", en: "Settlers of Catan" },
    desc: {
      ko: "친구와 온라인 대전, 또는 AI 최대 3명과 겨루는 정식 규칙 카탄. 10점을 먼저 모으면 승리",
      en: "Full-rule Catan — play online with friends or against up to 3 AI. First to 10 points wins",
    },
    genre: "board",
    thumb: "/thumbs/catan.jpg",
    src: "/games/catan/index.html",
    online: true,
  },
  {
    id: "lexio",
    title: { ko: "LEXIO", en: "LEXIO" },
    desc: {
      ko: "AI 3인과 겨루는 한국식 카드 게임 렉시오, 페어·조합 대응 전략이 핵심",
      en: "A Korean climbing card game against 3 AI — countering pairs and combos is the key",
    },
    genre: "board",
    thumb: "/thumbs/lexio.jpg",
    src: "/games/lexio/index.html",
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
      { id: "world-typing-kr", label: { ko: "한타", en: "Korean" }, unit: { ko: "타", en: "CPM" } },
      { id: "world-typing-en", label: { ko: "영타", en: "English" }, unit: { ko: "WPM", en: "WPM" } },
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
    boards: [{ id: "weapon", label: { ko: "최고 강화", en: "Best level" }, unit: { ko: "", en: "" }, format: "level" }],
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
    boards: [{ id: "oripa", label: { ko: "최고 자금", en: "Peak funds" }, unit: { ko: "", en: "" }, format: "won" }],
  },
  {
    id: "lotto",
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
    id: "raiden",
    title: { ko: "라이덴 슈팅", en: "Raiden Shooter" },
    desc: {
      ko: "보스전이 있는 세로 스크롤 전투기 슈팅 게임, 레이저와 폭탄으로 화면을 정리",
      en: "A vertical-scroll shooter with boss battles — clear the screen with lasers and bombs",
    },
    genre: "action",
    thumb: "/thumbs/raiden.jpg",
    src: "/games/raiden/index.html",
    boards: [{ id: "raiden", label: { ko: "점수", en: "Score" }, unit: { ko: "점", en: "pts" } }],
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
    boards: [{ id: "archer", label: { ko: "생존 시간", en: "Survival" }, unit: { ko: "", en: "" }, format: "time" }],
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
  },
];

export const GENRES: Genre[] = ["board", "action", "strategy", "casual"];

export function gameById(id: string): Game | undefined {
  return GAMES.find((g) => g.id === id);
}

export function boardById(id: string): { game: Game; board: Board } | undefined {
  for (const game of GAMES) {
    const board = game.boards?.find((b) => b.id === id);
    if (board) return { game, board };
  }
  return undefined;
}

export const ALL_BOARDS = GAMES.flatMap((g) => (g.boards ?? []).map((b) => ({ game: g, board: b })));

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
    default: {
      const u = board.unit[lang];
      return score.toLocaleString(lang === "ko" ? "ko-KR" : "en-US") + (u ? ` ${u}` : "");
    }
  }
}
