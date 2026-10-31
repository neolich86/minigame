// 미니게임천국 게임 카탈로그 — 포털 목록·플레이 페이지·랭킹이 모두 이 데이터를 기준으로 동작한다.
import type { Lang } from "./i18n";

export type Genre = "board" | "action" | "racing" | "strategy" | "casual";

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
  format?: "number" | "time" | "won" | "level" | "roundtime" | "daily";
  /* daily: 점수 = 날짜(YYYYMMDD, 한국 시간)×1,000,000 + (999,999 − (이동×1000 + 초)) — 오늘 기록만 랭킹에 보인다 */
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
  /** 온라인 대기실에서 방장이 고르는 설정 (게임에는 net:init 의 options 로 전달) */
  roomOptions?: { key: string; label: { ko: string; en: string }; values: number[]; def: number; unit?: { ko: string; en: string }; note?: { ko: string; en: string } }[];
  /** 좌석 색 (팀전이면 같은 팀끼리 같은 색) */
  seatColors?: string[];
  /** 2:2 팀전 — 좌석 0·2 vs 1·3 */
  teams?: boolean;
  /** 로그인 사용자의 게임 데이터를 계정에 저장 (bridge.js MGH.save → game_saves / game-files) */
  saves?: boolean;
  /** 포털 목록·사이트맵·추천에서 숨김 (주소로 직접 들어가면 열림) */
  hidden?: boolean;
  /** 구글 플레이에 앱으로도 출시됨 — 패키지 이름 (웹 화면에 "앱으로 받기" 버튼) */
  playStore?: string;
}

export const playStoreUrl = (pkg: string) => `https://play.google.com/store/apps/details?id=${encodeURIComponent(pkg)}`;

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
    id: "holdem",
    title: { ko: "텍사스 홀덤", en: "Texas Hold'em" },
    desc: {
      ko: "2~6명이 겨루는 텍사스 홀덤 토너먼트. 친구와 온라인 대전(내 카드는 암호화되어 나만 보여요) 또는 AI와 대결, 블라인드가 오르고 마지막 1명이 우승",
      en: "A 2–6 player Texas Hold'em tournament — play friends online (your cards are encrypted so only you can see them) or take on AI. Blinds rise; last player standing wins",
    },
    genre: "board",
    thumb: "/thumbs/holdem.jpg",
    src: "/games/holdem/index.html",
    online: true,
    onlinePlayers: [2, 3, 4, 5, 6],
  },
  {
    id: "racing",
    title: { ko: "서킷 메이커", en: "Circuit Maker" },
    desc: {
      ko: "트랙을 직접 만들고 달리는 3D 레이싱. 맵·랩 수·인원수를 골라 AI와 대결하거나, 최대 8명이 친구와 온라인으로 함께 달려요",
      en: "A 3D racer where you build the track — pick a map, laps and racers to take on AI, or race up to 8 friends online",
    },
    genre: "racing",
    thumb: "/thumbs/racing.jpg",
    src: "/games/racing/index.html",
    online: true,
    onlinePlayers: [2, 3, 4, 5, 6, 7, 8],
    roomOptions: [
      {
        key: "laps",
        label: { ko: "랩 수", en: "Laps" },
        values: [1, 2, 3, 4, 5, 7, 9],
        def: 3,
        unit: { ko: "랩", en: "" },
        note: { ko: "맵과 차는 게임이 시작되면 고를 수 있어요 (방장이 맵 선택)", en: "Track and cars are picked once the game starts (host picks the track)" },
      },
    ],
    seatColors: ["#e8453c", "#2f7fe0", "#f0a020", "#e6e0d0", "#3fae5a", "#8e5bd9", "#20c0c8", "#ff70b0"],
    saves: true, // 내가 만든 맵을 계정에 저장
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
    id: "my-room",
    kind: "app",
    title: { ko: "마이룸", en: "My Room" },
    desc: {
      ko: "도트 감성 미니룸 꾸미기 — 벽지·바닥·가구를 고르고 내 캐릭터를 꾸며 방에 세워 보세요",
      en: "Decorate a cozy pixel mini room — pick wallpaper, floors and furniture and dress up your character",
    },
    genre: "casual",
    thumb: "/thumbs/my-room.jpg",
    src: "/games/my-room/index.html",
    saves: true, // 방 꾸미기·캐릭터를 계정에 저장
  },
  {
    id: "potion-atelier",
    title: { ko: "포션 공방", en: "Potion Atelier" },
    desc: {
      ko: "병 속 물약을 붓고 섞어 손님이 주문한 포션을 만드는 퍼즐 가게. 빨강과 파랑을 섞으면 보라! 적게 움직일수록 별과 골드를 더 받아요",
      en: "A puzzle shop where you pour and mix liquids to brew the potions customers order — red and blue make purple!",
    },
    genre: "casual",
    thumb: "/thumbs/potion-atelier.jpg",
    src: "/games/potion-atelier/index.html",
    saves: true, // 골드·평판·장식을 계정에 저장
    // playStore: "kr.minigame.potion", // 구글 플레이 출시 승인 뒤 주석 해제 (웹에 "앱으로 받기" 버튼)
    boards: [
      { id: "potion-daily", label: { ko: "오늘의 포션", en: "Daily Potion" }, unit: { ko: "", en: "" }, format: "daily" },
      { id: "potion-rep", label: { ko: "공방 평판", en: "Shop fame" }, unit: { ko: "⭐", en: "⭐" }, vs: { label: { ko: "평판", en: "fame" }, question: { ko: "누구 공방이 더 유명할까?", en: "Whose shop is more famous?" } } },
    ],
  },
  {
    id: "dragon-ranch",
    title: { ko: "드래곤 목장", en: "Dragon Ranch" },
    desc: {
      ko: "둥지를 짓고 알을 부화시켜 용을 키우는 작은 목장. 밭에서 먹이를 길러 용을 키우고, 두 용을 짝지어 새로운 용을 도감에 모아 보세요",
      en: "A tiny ranch for raising dragons — hatch eggs, grow feed, and pair dragons to discover new species",
    },
    genre: "casual",
    thumb: "/thumbs/dragon-ranch.jpg",
    src: "/games/dragon-ranch/index.html",
    saves: true, // 목장·용을 계정에 저장
    hidden: true, // 시험판 — 주소로만 열림
  },
  {
    id: "dongne-note",
    kind: "app",
    title: { ko: "동네쪽지", en: "Neighborhood Notes" },
    desc: {
      ko: "지도에서 장소를 골라 동물 친구와 함께 쪽지를 남기고, 이웃들의 이야기에 좋아요·댓글을 다는 동네 지도 (쪽지는 7일 뒤 사라져요)",
      en: "Leave notes on places around Korea with your animal avatar, and like or comment on your neighbors' notes — notes vanish after 7 days",
    },
    genre: "casual",
    thumb: "/thumbs/dongne-note.jpg",
    src: "/games/dongne-note/index.html",
    saves: true, // 로그인 상태 전달 + MGH.rpc (src/lib/gameRpc.ts)
  },
  {
    id: "cathedral",
    kind: "app",
    title: { ko: "온라인 명상", en: "Online Meditation" },
    desc: {
      ko: "성당 · 온라인 성당. 파이프오르간 소리를 듣고, 기도하고, 잠깐 쉬어가는 공간입니다. 卍 절로 바꾸면 관음보살상 앞에서 목탁과 염불 소리가 흘러요.",
      en: "An online cathedral and temple — listen to the pipe organ or the moktak and chanting, pray, and take a quiet moment.",
    },
    genre: "casual",
    thumb: "/thumbs/cathedral.jpg",
    src: "/games/cathedral/index.html",
  },
  {
    id: "explore-map",
    kind: "app",
    title: { ko: "동네 정복", en: "Town Conquest" },
    desc: {
      ko: "지하철역·버스정류장에서 체크인해 안개를 걷고 우리 동네를 정복하는 위치 기반 땅따먹기 (서울·인천·경기)",
      en: "Check in at real subway stations and bus stops to clear the fog and conquer your neighborhood (Seoul metro area)",
    },
    genre: "casual",
    thumb: "/thumbs/town-conquest.jpg",
    src: "/games/explore-map/index.html",
    saves: true, // 체크인한 정류장 목록을 계정에 저장
    boards: [{ id: "explore-map", label: { ko: "밝힌 칸", en: "Cells revealed" }, unit: { ko: "칸", en: " cells" }, vs: { label: { ko: "탐험", en: "exploration" }, question: { ko: "누가 더 넓게 탐험하나?", en: "Who explores more?" } } }],
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
    id: "roulette",
    title: { ko: "룰렛", en: "Roulette" },
    desc: {
      ko: "0이 하나뿐인 유럽식 룰렛. 100만 원으로 시작해 숫자·색·홀짝에 칩을 걸고 휠을 돌려 최고 잔액 랭킹에 도전",
      en: "Single-zero European roulette — start with ₩1,000,000, bet on numbers, colors or odd/even and chase the peak-balance leaderboard",
    },
    genre: "casual",
    thumb: "/thumbs/roulette.jpg",
    src: "/games/roulette/index.html",
    saves: true, // 지갑(잔액)을 계정에 저장 — 계정끼리 잔액이 섞이지 않게
    boards: [{ id: "roulette", label: { ko: "최고 잔액", en: "Peak balance" }, unit: { ko: "", en: "" }, format: "won", vs: { label: { ko: "최고 잔액", en: "peak balance" }, question: { ko: "누가 더 크게 따나?", en: "Who wins bigger?" } } }],
  },
  {
    id: "baccarat",
    title: { ko: "바카라", en: "Baccarat" },
    desc: {
      ko: "8덱 정통 바카라. 플레이어·뱅커·타이·페어에 베팅하고 빅로드·본매·중국점 출목표로 흐름을 읽으며 최고 잔액 랭킹에 도전",
      en: "Classic 8-deck baccarat — bet Player, Banker, Tie or Pairs, read the big road, bead plate and derived roads, and chase the peak-balance leaderboard",
    },
    genre: "casual",
    thumb: "/thumbs/baccarat.jpg",
    src: "/games/baccarat/index.html",
    saves: true, // 지갑(잔액)을 계정에 저장 — 계정끼리 잔액이 섞이지 않게
    boards: [{ id: "baccarat", label: { ko: "최고 잔액", en: "Peak balance" }, unit: { ko: "", en: "" }, format: "won", vs: { label: { ko: "최고 잔액", en: "peak balance" }, question: { ko: "누가 더 크게 따나?", en: "Who wins bigger?" } } }],
  },
  {
    id: "blackjack",
    title: { ko: "블랙잭", en: "Blackjack" },
    desc: {
      ko: "6덱 정통 블랙잭. 히트·스탠드·더블·스플릿·서렌더·보험, 블랙잭은 3:2. 기본 전략 힌트를 켜고 100만 원으로 최고 잔액 랭킹에 도전",
      en: "Classic 6-deck blackjack — hit, stand, double, split, surrender and insurance, blackjack pays 3:2. Turn on basic-strategy hints and chase the peak-balance leaderboard",
    },
    genre: "casual",
    thumb: "/thumbs/blackjack.jpg",
    src: "/games/blackjack/index.html",
    saves: true, // 지갑(잔액)·진행 중인 핸드를 계정에 저장
    boards: [{ id: "blackjack", label: { ko: "최고 잔액", en: "Peak balance" }, unit: { ko: "", en: "" }, format: "won", vs: { label: { ko: "최고 잔액", en: "peak balance" }, question: { ko: "누가 더 크게 따나?", en: "Who wins bigger?" } } }],
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
    id: "book-pick",
    kind: "tool",
    title: { ko: "오늘 뭐 읽지?", en: "What to Read Today" },
    desc: {
      ko: "장르·소재·분위기·시기 키워드를 고르면 어울리는 책을 뽑아 주는 책 추천 도구",
      en: "Pick genres, themes, moods and eras — get a book that fits",
    },
    genre: "casual",
    thumb: "/thumbs/book-pick.jpg",
    src: "/games/book-pick/index.html",
    hidden: true, // 정보나루 카탈로그 연결 전 (지금은 예시 책 목록)
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
      ko: "다녀온 나라와 도시를 세계지도에 원하는 색으로 칠하고, 장소마다 사진과 방문 날짜를 남기는 여행 기록. 카카오·이메일 로그인으로 어디서든 이어 보고 SNS 공유 이미지도 만들어요",
      en: "Color the countries and cities you've visited on a world map and pin one photo to each place. Log in to keep it in your account and make a share image for social media",
    },
    genre: "casual",
    thumb: "/thumbs/passport-map.jpg?v=5",
    src: "/games/passport-map/index.html",
    saves: true,
    playStore: "kr.minigame.passportmap",
  },
  {
    id: "tarot",
    kind: "app",
    title: { ko: "타로 운세", en: "Tarot Reading" },
    desc: {
      ko: "고민을 고르고 섞인 메이저 아르카나 22장 중에서 직접 카드를 뽑아 보는 타로 — 올해 운세·애정·재회·금전·사업·직장·학업·인간관계",
      en: "Pick what's on your mind and draw from the 22 Major Arcana yourself — year ahead, love, reunion, money, business, career, study and relationships",
    },
    genre: "casual",
    thumb: "/thumbs/tarot.jpg?v=2",
    src: "/games/tarot/index.html",
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
    saves: true, // 앱(/archer-app)에서 로그인 상태를 받고 로그인 창을 띄우기 위해 (게임 데이터를 저장하지는 않음)
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

export const GENRES: Genre[] = ["board", "action", "racing", "strategy", "casual"];

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
    case "daily": {
      const day = Math.floor(score / 1000000);
      const rest = 999999 - (score % 1000000);
      const mv = Math.floor(rest / 1000), sec = rest % 1000;
      const t = `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
      const past = day !== kstDayKey() ? (lang === "ko" ? " (지난 기록)" : " (past)") : "";
      return (lang === "ko" ? `${mv}수 · ` : `${mv} moves · `) + t + past;
    }
    default: {
      const u = board.unit[lang];
      return score.toLocaleString(lang === "ko" ? "ko-KR" : "en-US") + (u ? ` ${u}` : "");
    }
  }
}

/** 한국 시간 기준 오늘 (YYYYMMDD) — 오늘의 퍼즐 랭킹용 */
export function kstDayKey(now = Date.now()): number {
  const d = new Date(now + 9 * 3600e3);
  return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}
