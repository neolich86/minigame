// 검색 최적화(SEO)용 문구 — 페이지 제목·설명·키워드와, 게임 페이지 아래에 보이는 소개 글.
// 구글은 meta keywords 를 거의 보지 않으므로, 실제로 중요한 것은 제목(title)·설명(description)·본문 글·구조화 데이터다.
import type { Lang } from "./i18n";

export interface GameSeo {
  title: string; // <title> 앞부분 (뒤에 "| 미니 게임 천국" 이 붙음)
  h1: string;
  description: string;
  keywords: string[];
  about: string[];
  howTo: string[];
  tags: string[];
}

type SeoMap = Record<string, Record<Lang, GameSeo>>;

export const HOME_SEO: Record<Lang, { title: string; description: string; keywords: string[] }> = {
  ko: {
    title: "미니 게임 천국 - 무료 웹게임 모음 | 보드게임 · 방치형 · 뱀서 · 로또 추천 · 핀볼 룰렛",
    description:
      "설치 없이 바로 하는 무료 브라우저 게임 모음. 친구와 온라인 보드게임 대전, 방치형 랜덤 타워 디펜스, 뱀서류 서바이벌, 로또 번호 추천, 핀볼 룰렛 추첨기, 무기 강화까지 한곳에서 랭킹 경쟁하세요.",
    keywords: [
      "게임", "무료 게임", "웹게임", "브라우저 게임", "미니게임", "온라인 게임",
      "보드게임", "온라인 보드게임", "boardgame", "board game",
      "방치형", "방치형 게임", "뱀서", "뱀서라이크", "서바이벌", "서바이벌 게임",
      "로또", "로또추천", "로또 번호 추천", "룰렛", "핀볼", "추첨기",
      "타워디펜스", "슈팅게임", "타자 연습", "강화 게임", "미니 게임 천국",
    ],
  },
  en: {
    title: "Mini Game Heaven - Free Browser Games | Board Games, Idle, Survivor, Lotto Picker, Pinball Roulette",
    description:
      "Free browser games, no install needed: online multiplayer board games, idle tower defense, survivor-like roguelite, lotto number picker, pinball roulette and more — with leaderboards.",
    keywords: [
      "free games", "browser games", "web games", "mini games", "online games",
      "board game", "boardgame", "online board game", "multiplayer board game",
      "idle game", "idle tower defense", "survivor-like", "survival game", "roguelite",
      "lotto number generator", "lottery picker", "roulette", "pinball", "random picker",
      "tower defense", "shooter", "typing game",
    ],
  },
};

export const GAME_SEO: SeoMap = {
  catan: {
    ko: {
      title: "헥사 아일랜드 - 무료 온라인 보드게임 · 친구와 멀티플레이 전략 보드게임",
      h1: "헥사 아일랜드 — 무료 온라인 전략 보드게임",
      description:
        "육각형 타일 섬에서 자원을 모으고 교역해 마을과 도시를 세우는 무료 온라인 보드게임. 친구와 방을 만들어 2~4인 멀티플레이, 또는 AI와 바로 대결하세요.",
      keywords: ["보드게임", "온라인 보드게임", "무료 보드게임", "전략 보드게임", "멀티플레이 보드게임", "boardgame", "자원 교역 게임", "섬 개척 게임", "헥사 아일랜드", "2인 보드게임", "4인 보드게임"],
      about: [
        "헥사 아일랜드는 육각형 타일로 이루어진 섬에서 나무·흙·양털·밀·광석을 모아 도로와 정착지, 도시를 짓는 전략 보드게임입니다. 주사위가 굴러갈 때마다 자원이 생산되고, 다른 플레이어나 은행·항구와 교역하며 먼저 10점을 모으면 승리합니다.",
        "로그인하면 방 코드를 친구에게 보내 2~4인 온라인 대전을 할 수 있고, 빈 자리는 AI로 채울 수 있어요. 혼자라면 로그인 없이 AI 1~3명과 바로 플레이할 수 있습니다.",
      ],
      howTo: [
        "처음에 정착지 2곳과 도로 2개를 번갈아 놓습니다.",
        "매 턴 주사위를 굴리면, 나온 숫자의 타일에 붙은 정착지가 자원을 받습니다.",
        "자원으로 도로·정착지·도시·발전카드를 사고, 부족한 자원은 교역으로 구합니다.",
        "7이 나오면 도적이 움직이고, 손패가 많은 사람은 절반을 버립니다.",
        "정착지 1점, 도시 2점, 최장 교역로·최대 기사력 각 2점 — 10점을 먼저 모으면 승리!",
      ],
      tags: ["보드게임", "온라인 대전", "멀티플레이", "전략", "AI 대전", "무료"],
    },
    en: {
      title: "Hexa Isle - Free Online Board Game · Multiplayer Strategy Board Game",
      h1: "Hexa Isle — Free Online Strategy Board Game",
      description:
        "Gather resources, trade and build settlements and cities on a hex-tile island. Play this free online board game with 2–4 friends in multiplayer rooms, or against AI.",
      keywords: ["board game", "boardgame", "online board game", "free board game", "strategy board game", "multiplayer board game", "resource trading game", "hex board game", "Hexa Isle"],
      about: [
        "Hexa Isle is a strategy board game on an island of hexagonal tiles. Collect lumber, brick, wool, grain and ore, build roads, settlements and cities, and trade with other players, the bank or harbors. The first to 10 points wins.",
        "Sign in to create a room and invite friends for 2–4 player online matches — empty seats can be filled with AI. Or jump straight in against 1–3 AI opponents, no account needed.",
      ],
      howTo: [
        "Take turns placing 2 settlements and 2 roads.",
        "Each turn, roll the dice — settlements next to tiles with that number produce resources.",
        "Spend resources on roads, settlements, cities and development cards; trade for what you lack.",
        "On a 7 the robber moves and players holding 8+ cards discard half.",
        "Settlement 1 VP, city 2 VP, Longest Road and Largest Army 2 VP each — first to 10 wins!",
      ],
      tags: ["Board game", "Online multiplayer", "Strategy", "vs AI", "Free"],
    },
  },
  lexio: {
    ko: {
      title: "타일러쉬 - 무료 온라인 타일 보드게임 · 친구와 3~5인 멀티플레이",
      h1: "타일러쉬 — 친구와 즐기는 온라인 타일 보드게임",
      description:
        "손에 든 숫자 타일을 싱글·페어·트리플·5장 조합으로 내며 가장 먼저 털어내면 이기는 무료 온라인 보드게임. 친구와 3~5인 대전하거나 AI와 바로 플레이하세요.",
      keywords: ["보드게임", "온라인 보드게임", "타일 게임", "카드게임", "온라인 카드게임", "멀티플레이 카드게임", "boardgame", "타일러쉬", "3인 보드게임", "5인 보드게임", "클라이밍 카드게임"],
      about: [
        "타일러쉬는 숫자가 적힌 타일을 조합해 내며 손패를 먼저 모두 털어내는 사람이 이기는 클라이밍 보드게임입니다. 앞 사람보다 높은 싱글·페어·트리플, 또는 스트레이트·플러시·풀하우스 같은 5장 조합을 내야 해요.",
        "규칙 판정은 서버가 해서 다른 사람의 손패는 절대 보이지 않아요. 로그인 후 방을 만들어 친구와 3~5인 대전을 하거나, 로그인 없이 AI 3명과 연습할 수 있습니다.",
      ],
      howTo: [
        "필드가 비어 있으면 원하는 조합을 자유롭게 냅니다.",
        "다음 사람은 같은 장수로 더 높은 조합을 내거나 패스합니다.",
        "모두 패스하면 마지막에 낸 사람이 새로 시작합니다.",
        "누군가 손패를 다 털면 라운드 종료 — 남은 타일 수에 따라 점수를 주고받습니다.",
      ],
      tags: ["보드게임", "카드게임", "온라인 대전", "멀티플레이", "AI 대전", "무료"],
    },
    en: {
      title: "Tile Rush - Free Online Tile Board Game · 3–5 Player Multiplayer",
      h1: "Tile Rush — Online Tile Board Game with Friends",
      description:
        "Play number tiles as singles, pairs, triples or 5-tile combos and be the first to empty your hand. A free online climbing board game for 3–5 players, or play against AI.",
      keywords: ["board game", "boardgame", "online board game", "tile game", "card game", "online card game", "multiplayer card game", "climbing game", "shedding game", "Tile Rush"],
      about: [
        "Tile Rush is a climbing board game: play number tiles in singles, pairs, triples or 5-tile combos like straights, flushes and full houses, beating what's on the field. Empty your hand first to win the round.",
        "All rules are judged on the server, so nobody can peek at your hand. Sign in and create a room for 3–5 player matches with friends, or practice against 3 AI players without an account.",
      ],
      howTo: [
        "On an empty field, lead any combo you like.",
        "Following players must play a higher combo with the same number of tiles, or pass.",
        "When everyone passes, the last player to play leads again.",
        "When someone empties their hand the round ends — points move based on tiles left.",
      ],
      tags: ["Board game", "Card game", "Online multiplayer", "vs AI", "Free"],
    },
  },
  "dragon-call": {
    ko: {
      title: "드래곤 콜 - 무료 온라인 팀전 카드게임 · 친구와 4인 멀티플레이 클라이밍 카드게임",
      h1: "드래곤 콜 — 2:2 팀전 온라인 카드게임",
      description:
        "파트너와 한 팀이 되어 콜을 선언하고, 카드를 교환하고, 폭탄으로 판을 뒤집는 무료 온라인 클라이밍 카드게임. 친구와 4인 온라인 대전을 하거나 AI 파트너와 바로 플레이하세요.",
      keywords: ["카드게임", "온라인 카드게임", "팀전 카드게임", "4인 카드게임", "클라이밍 카드게임", "보드게임", "온라인 보드게임", "멀티플레이 카드게임", "boardgame", "드래곤 콜", "무료 카드게임"],
      about: [
        "드래곤 콜은 4명이 2:2로 팀을 이루어 겨루는 클라이밍 카드게임입니다. 앞 사람보다 높은 싱글·페어·트리플·풀하우스·스트레이트·연속 페어를 내며 손패를 먼저 털어내고, 가져온 트릭 속 5·10·K 카드로 점수를 모아 먼저 1,000점을 넘긴 팀이 승리해요.",
        "첫 카드를 내기 전 ‘콜’(±100)이나 8장만 보고 ‘그랜드 콜’(±200)을 선언해 크게 역전할 수 있고, 포카드·스트레이트 플러시 폭탄은 차례가 아니어도 언제든 끼어들 수 있습니다. 소원을 비는 참새, 파트너에게 선을 넘기는 개, 만능 카드 봉황, 가장 강한 용까지 네 장의 특수 카드가 판을 흔들어요.",
        "로그인하면 방 코드를 친구에게 보내 4인 온라인 대전을 하고, 빈 자리는 AI로 채울 수 있어요. 혼자라면 로그인 없이 AI 파트너와 함께 AI 2명과 바로 겨룰 수 있습니다.",
      ],
      howTo: [
        "8장을 먼저 보고 그랜드 콜 여부를 정한 뒤 나머지 6장을 받습니다.",
        "다음 사람·파트너·이전 사람에게 카드를 한 장씩 보냅니다.",
        "참새(1)를 가진 사람부터 조합을 내고, 다음 사람은 같은 종류의 더 높은 조합을 내거나 패스합니다.",
        "모두 패스하면 마지막에 낸 사람이 트릭을 가져가고 새로 선이 됩니다. 폭탄은 언제든 낼 수 있어요.",
        "5는 5점, 10·K는 10점, 용 25점, 봉황 −25점. 한 팀이 1·2등으로 나가면 원투 200점!",
      ],
      tags: ["카드게임", "팀전", "온라인 대전", "멀티플레이", "AI 대전", "무료"],
    },
    en: {
      title: "Dragon Call - Free Online Team Card Game · 4-Player Multiplayer Climbing Game",
      h1: "Dragon Call — 2-vs-2 Online Team Card Game",
      description:
        "Team up with a partner, make calls, pass cards and turn the table with bombs in this free online climbing card game. Play 4-player online matches with friends, or jump in with an AI partner.",
      keywords: ["card game", "online card game", "team card game", "4 player card game", "climbing card game", "partnership card game", "board game", "multiplayer card game", "Dragon Call", "free card game"],
      about: [
        "Dragon Call is a climbing card game for four players in two partnerships. Beat the table with higher singles, pairs, triples, full houses, straights or runs of pairs, shed your hand, and collect the 5s, 10s and Kings in your tricks. The first team past 1,000 points wins.",
        "Before your first card you can make a Call (±100), or a Grand Call (±200) after seeing just 8 cards. Bombs — four of a kind or a straight flush — can interrupt at any moment. Four special cards shake things up: the wishing Sparrow, the Dog that hands the lead to your partner, the wild Phoenix and the mighty Dragon.",
        "Sign in to create a room and invite friends for a 4-player online match — empty seats can be filled with AI. Or play right away with an AI partner against two AI opponents, no account needed.",
      ],
      howTo: [
        "See your first 8 cards and decide on a Grand Call, then take the last 6.",
        "Pass one card each to the next player, your partner and the previous player.",
        "The Sparrow (1) holder leads; others must play a higher combo of the same type, or pass.",
        "When everyone passes, the last player takes the trick and leads. Bombs can be played at any time.",
        "5s score 5, 10s and Kings 10, Dragon 25, Phoenix −25. Partners going out 1st and 2nd score a 200-point one-two!",
      ],
      tags: ["Card game", "Team play", "Online multiplayer", "vs AI", "Free"],
    },
  },
  "random-td": {
    ko: {
      title: "랜덤 타워 디펜스 - 무료 방치형 타워디펜스 게임 (랜타디)",
      h1: "랜덤 타워 디펜스 — 무료 방치형 가챠 타워디펜스",
      description:
        "골드로 랜덤 타워를 뽑고 같은 등급을 합쳐 9단계 희귀도까지 키우는 무료 방치형 타워디펜스. 몇 라운드까지 버티는지 랭킹으로 겨뤄보세요.",
      keywords: ["방치형", "방치형 게임", "방치형 타워디펜스", "랜덤 타워 디펜스", "랜타디", "타워디펜스", "가챠 게임", "무료 게임", "웹게임"],
      about: [
        "랜덤 타워 디펜스(랜타디)는 타워를 뽑기로 얻고 조합해 몰려오는 몬스터 웨이브를 막는 방치형 타워디펜스입니다. 일반부터 신화까지 9단계 희귀도의 불·번개·물·독 타워를 모아 보세요.",
        "라운드는 60초마다 자동으로 넘어가서 틀어두기만 해도 진행되는 방치형 게임이에요. 로그인하면 도달 라운드와 걸린 시간으로 랭킹이 기록됩니다.",
      ],
      howTo: ["골드로 랜덤 타워를 뽑습니다.", "타워를 합쳐 더 높은 등급을 만듭니다.", "언덕 체력이 0이 되기 전까지 최대한 오래 버티세요.", "배속(2x·4x)으로 빠르게 진행할 수 있어요."],
      tags: ["방치형", "타워디펜스", "가챠", "랭킹", "무료"],
    },
    en: {
      title: "Random Tower Defense - Free Idle Tower Defense Game",
      h1: "Random Tower Defense — Free Idle Gacha Tower Defense",
      description:
        "Pull random towers with gold, merge them up through 9 rarity tiers and hold off endless waves in this free idle tower defense game. Compete on the leaderboard.",
      keywords: ["idle game", "idle tower defense", "tower defense", "random tower defense", "gacha game", "free game", "browser game"],
      about: [
        "Random Tower Defense is an idle tower defense game where you pull towers at random and combine them to stop monster waves. Collect fire, lightning, water and poison towers across 9 rarity tiers.",
        "Rounds advance automatically every 60 seconds, so it keeps going even when you just leave it running. Signed-in players are ranked by round reached and time taken.",
      ],
      howTo: ["Spend gold to pull random towers.", "Merge towers to reach higher grades.", "Survive as long as you can before the hill falls.", "Use 2x/4x speed to play faster."],
      tags: ["Idle", "Tower defense", "Gacha", "Leaderboard", "Free"],
    },
  },
  "element-td": {
    ko: {
      title: "Element Siege - 무료 전략 타워디펜스 게임 (불·얼음·자연 원소)",
      h1: "Element Siege — 원소 조합 전략 타워디펜스",
      description:
        "불·얼음·자연 원소 타워로 50라운드 웨이브와 보스를 막아내는 무료 아이소메트릭 타워디펜스. 도달 라운드와 클리어 시간으로 랭킹을 겨루세요.",
      keywords: ["타워디펜스", "전략 게임", "타워 디펜스 게임", "무료 게임", "웹게임", "Element Siege"],
      about: ["불·얼음·자연 세 가지 원소 타워를 배치하고 업그레이드해 50라운드를 버티는 전략 타워디펜스입니다. 10라운드마다 강력한 보스가 등장해요.", "몬스터가 떨어뜨리는 아이템을 타워에 장착해 전략을 완성하고, 랭킹에서 더 높은 라운드와 빠른 클리어에 도전하세요."],
      howTo: ["원소 타워를 경로 옆에 건설합니다.", "타워를 업그레이드하고 아이템을 장착합니다.", "50라운드를 모두 막으면 승리!"],
      tags: ["타워디펜스", "전략", "랭킹", "무료"],
    },
    en: {
      title: "Element Siege - Free Strategy Tower Defense Game",
      h1: "Element Siege — Elemental Strategy Tower Defense",
      description: "Hold off 50 rounds of waves and bosses with fire, ice and nature towers in this free isometric tower defense game. Compete for the highest round and fastest clear.",
      keywords: ["tower defense", "strategy game", "free game", "browser game", "Element Siege"],
      about: ["Place and upgrade fire, ice and nature towers to survive 50 rounds. A powerful boss appears every 10 rounds.", "Equip items dropped by monsters, then climb the leaderboard with higher rounds and faster clears."],
      howTo: ["Build elemental towers along the path.", "Upgrade towers and equip items.", "Clear all 50 rounds to win!"],
      tags: ["Tower defense", "Strategy", "Leaderboard", "Free"],
    },
  },
  archer: {
    ko: {
      title: "궁수 서바이버 - 무료 뱀서 · 서바이벌 로그라이크 웹게임",
      h1: "궁수 서바이버 — 무료 뱀서류 서바이벌 게임",
      description:
        "사방에서 몰려오는 몬스터를 자동 사격으로 쓰러뜨리고 레벨업마다 스킬을 골라 성장하는 무료 뱀서라이크 서바이벌 게임. 생존 시간 랭킹에 도전하세요.",
      keywords: ["뱀서", "뱀서라이크", "뱀서류", "뱀파이어 서바이버 같은 게임", "서바이벌", "서바이벌 게임", "로그라이크", "로그라이트", "무료 게임", "웹게임"],
      about: [
        "궁수 서바이버는 뱀파이어 서바이버류(뱀서) 로그라이크입니다. 이동만 하면 화살이 자동으로 발사되고, 레벨업할 때마다 멀티샷·관통·운석 낙하·블랙홀 같은 스킬을 골라 강해져요.",
        "5분마다 강력한 보스가 등장하고, 몬스터는 시간이 갈수록 점점 늘어납니다. 로그인하면 생존 시간이 랭킹에 기록됩니다.",
      ],
      howTo: ["WASD·방향키 또는 화면을 끌어서 이동합니다.", "공격은 자동 — 몬스터를 피하며 경험치를 모으세요.", "레벨업마다 스킬 1개를 골라 조합을 만듭니다.", "최대한 오래 살아남으세요!"],
      tags: ["뱀서", "서바이벌", "로그라이크", "액션", "랭킹", "무료"],
    },
    en: {
      title: "Archer Survivor - Free Survivor-like Roguelite Browser Game",
      h1: "Archer Survivor — Free Survivor-like Survival Game",
      description: "Auto-fire at monster hordes from every side, pick skills on every level-up and survive as long as you can in this free survivor-like roguelite. Climb the survival-time leaderboard.",
      keywords: ["survivor-like", "vampire survivors like", "survival game", "roguelite", "roguelike", "bullet heaven", "free game", "browser game"],
      about: ["Archer Survivor is a survivor-like roguelite. Just move — arrows fire automatically — and choose skills like Multishot, Pierce, Meteor Fall and Black Hole each time you level up.", "A powerful boss appears every 5 minutes and the hordes keep growing. Signed-in players are ranked by survival time."],
      howTo: ["Move with WASD / arrow keys or drag on mobile.", "Attacks are automatic — dodge and collect XP.", "Pick one skill per level-up to build your combo.", "Survive as long as you can!"],
      tags: ["Survivor-like", "Survival", "Roguelite", "Action", "Leaderboard", "Free"],
    },
  },
  raiden: {
    ko: {
      title: "스카이 스트라이크 - 무료 종스크롤 비행기 슈팅게임",
      h1: "스카이 스트라이크 — 무료 종스크롤 슈팅게임",
      description: "레이저와 폭탄으로 적 편대와 보스를 격파하는 무료 아케이드 종스크롤 비행기 슈팅게임. 점수 랭킹에 도전하세요.",
      keywords: ["슈팅게임", "비행기 게임", "비행기 슈팅", "종스크롤 슈팅", "아케이드 게임", "탄막", "무료 게임", "웹게임"],
      about: ["스카이 스트라이크는 6종의 기체 중 하나를 골라 출격하는 아케이드 종스크롤 슈팅게임입니다. 같은 색 파워업을 계속 모으면 화력이 강해져요.", "스테이지마다 보스를 격파하고 점수를 쌓아 랭킹에 도전하세요."],
      howTo: ["방향키·WASD 또는 드래그로 이동합니다.", "파워업을 모아 무기를 강화합니다.", "X키로 폭탄을 써서 위기를 넘기세요."],
      tags: ["슈팅", "아케이드", "액션", "랭킹", "무료"],
    },
    en: {
      title: "Sky Strike - Free Vertical Scrolling Shooter Game",
      h1: "Sky Strike — Free Vertical Arcade Shooter",
      description: "Blast enemy squadrons and bosses with lasers and bombs in this free arcade vertical scrolling shooter. Climb the high-score leaderboard.",
      keywords: ["shooter", "shoot em up", "shmup", "vertical shooter", "arcade game", "plane game", "free game", "browser game"],
      about: ["Sky Strike is an arcade vertical shooter with 6 ships to choose from. Keep collecting the same color power-up to boost your firepower.", "Defeat the boss of every stage and rack up points for the leaderboard."],
      howTo: ["Move with arrow keys / WASD or drag.", "Collect power-ups to upgrade your weapon.", "Press X to drop a bomb when things get rough."],
      tags: ["Shooter", "Arcade", "Action", "Leaderboard", "Free"],
    },
  },
  lotto: {
    ko: {
      title: "로또 번호 추첨기 - 무료 로또 번호 추천 · 생성기 (6/45)",
      h1: "로또 번호 추첨기 — 무료 로또 번호 추천·생성",
      description: "로또 6/45 번호를 1~5게임까지 한 번에 뽑는 무료 로또 번호 생성기. 꼭 넣고 싶은 번호와 빼고 싶은 번호를 설정해 나만의 로또 추천 번호를 받아보세요.",
      keywords: ["로또", "로또추천", "로또 번호 추천", "로또 번호 생성기", "로또 번호 추첨기", "로또 자동 번호", "로또 6/45", "로또 번호 뽑기", "무료 로또 추천"],
      about: ["로또 번호 추첨기는 1부터 45까지 숫자 중 6개를 무작위로 뽑아 주는 무료 로또 번호 생성기입니다. 한 번에 최대 5게임까지 뽑을 수 있어요.", "번호를 눌러 포함(초록)·제외(빨강)를 지정하면, 포함 번호는 모든 게임에 들어가고 제외 번호는 절대 나오지 않습니다. 뽑은 번호는 바로 복사할 수 있어요."],
      howTo: ["뽑을 게임 수(1~5개)를 고릅니다.", "필요하면 포함·제외 번호를 지정합니다.", "[번호 뽑기]를 누르면 완료!"],
      tags: ["로또", "로또추천", "번호 생성기", "무료"],
    },
    en: {
      title: "Lotto Number Picker - Free Lottery Number Generator (6/45)",
      h1: "Lotto Number Picker — Free Lottery Number Generator",
      description: "Generate 1 to 5 sets of 6/45 lotto numbers at once. Set numbers to always include or exclude and get your own lucky picks — free.",
      keywords: ["lotto number generator", "lottery number picker", "random lottery numbers", "lotto 6/45", "lucky numbers", "free lotto picker"],
      about: ["Lotto Number Picker draws 6 random numbers from 1 to 45, up to 5 sets at a time.", "Tap numbers to include (green) or exclude (red) them — included numbers appear in every set and excluded ones never do. Copy your picks with one tap."],
      howTo: ["Choose how many sets (1–5).", "Optionally set include/exclude numbers.", "Press Draw Numbers — done!"],
      tags: ["Lotto", "Number generator", "Random", "Free"],
    },
  },
  pinball: {
    ko: {
      title: "핀볼 추첨기 - 무료 온라인 룰렛 · 돌림판 · 랜덤 뽑기",
      h1: "핀볼 추첨기 — 룰렛·돌림판 대신 쓰는 무료 추첨 게임",
      description: "참가자 이름과 공 개수를 넣고 물리 핀볼 맵에 떨어뜨려 도착 순서로 당첨자를 정하는 무료 온라인 추첨기. 룰렛·돌림판·사다리 타기·제비뽑기 대신 재미있게 뽑아보세요.",
      keywords: ["핀볼", "룰렛", "돌림판", "온라인 룰렛", "추첨기", "랜덤 뽑기", "제비뽑기", "사다리 타기", "당첨자 뽑기", "벌칙 정하기"],
      about: ["핀볼 추첨기는 참가자마다 공을 여러 개 넣고, 회전하는 장애물이 있는 핀볼 맵에 굴려 먼저(또는 마지막에) 도착한 공으로 당첨을 가리는 추첨 게임입니다.", "룰렛이나 돌림판처럼 운에 맡기되 보는 재미가 있어서, 모임 벌칙·순서 정하기·경품 추첨에 딱 좋아요."],
      howTo: ["a10, b5 처럼 이름과 공 개수를 입력합니다.", "첫 도착 / 마지막 도착 중 당첨 조건을 고릅니다.", "맵을 고르고 [추첨 시작]!"],
      tags: ["룰렛", "핀볼", "추첨", "랜덤 뽑기", "무료"],
    },
    en: {
      title: "Pinball Lottery Machine - Free Online Roulette & Random Picker",
      h1: "Pinball Lottery — a Fun Alternative to Roulette Wheels",
      description: "Enter names and ball counts, drop them onto a physics pinball map and let the arrival order pick the winner. A fun free alternative to roulette wheels and name pickers.",
      keywords: ["pinball", "roulette", "wheel of names", "random picker", "online roulette", "raffle picker", "random name picker", "lottery machine"],
      about: ["Give each entrant some balls, drop them onto a pinball map with spinning obstacles, and the first (or last) ball to arrive wins.", "As random as a roulette wheel but far more fun to watch — perfect for deciding turns, penalties or prize draws."],
      howTo: ["Enter names with ball counts, like a10, b5.", "Choose first-to-arrive or last-to-arrive.", "Pick a map and start the draw!"],
      tags: ["Roulette", "Pinball", "Random picker", "Free"],
    },
  },
  "passport-map": {
    ko: {
      title: "Passport Map - 다녀온 나라 색칠하기 · 세계 여행 지도 만들기",
      h1: "Passport Map — 다녀온 나라와 도시를 색칠하는 여행 지도",
      description: "세계지도에서 다녀온 나라를 원하는 색으로 칠하고, 도시에 핀을 꽂고, 장소마다 여행 사진 1장을 남기는 무료 여행 지도. 로그인하면 계정에 저장되고 인스타·X용 공유 이미지도 만들 수 있어요.",
      keywords: ["여행 지도", "다녀온 나라", "세계지도 색칠", "여행 기록", "방문 국가", "세계 여행 지도", "여행 사진 지도", "visited countries"],
      about: ["Passport Map은 세계지도 위에 다녀온 나라를 색칠하고, 도시마다 핀을 찍어 나만의 여행 지도를 만드는 서비스입니다. 나라와 도시마다 사진 1장과 한 줄 메모를 남기면 지도에 마우스를 올렸을 때 사진이 떠요.", "다녀온 나라 수·도시 수·세계 몇 %를 다녀왔는지 한눈에 보이고, 정사각·세로·가로 비율의 공유 이미지로 SNS에 올릴 수 있어요. 로그인하면 어느 기기에서든 같은 지도를 이어서 볼 수 있습니다."],
      howTo: ["지도에서 나라를 누르고 팔레트에서 색을 골라 칠합니다.", "추천 도시를 누르거나 [핀 찍기]로 다녀온 곳을 표시합니다.", "사진 1장과 메모를 올리고 [공유]로 이미지를 저장하세요."],
      tags: ["여행", "세계지도", "여행 기록", "무료"],
    },
    en: {
      title: "Passport Map - Color the Countries You've Visited on a World Map",
      h1: "Passport Map — Your Visited Countries & Cities on One Map",
      description: "Color the countries you've visited in any color, pin your cities and add one travel photo to each place. Log in to keep your map in your account and create a share image for Instagram or X. Free.",
      keywords: ["visited countries map", "travel map", "countries I've been to", "scratch map", "world travel map", "travel tracker", "travel photo map"],
      about: ["Passport Map lets you color in the countries you've visited and drop pins on cities to build your own travel map. Add one photo and a short note to each place, and the photo pops up when you hover over it.", "See how many countries and cities you've been to and what share of the world that is, then export a square, portrait or landscape share image. Log in to pick up the same map on any device."],
      howTo: ["Click a country and pick a color from the palette.", "Add suggested cities or use Drop pin to mark any place.", "Add a photo and note, then tap Share to save your image."],
      tags: ["Travel", "World map", "Travel log", "Free"],
    },
  },
  "my-post-2026": {
    ko: {
      title: "My Post 2026 - 올해의 베스트 나인 · 인스타 연말 결산 리포트",
      h1: "My Post 2026 — 올해 내 피드 BEST 9 결산",
      description: "올해 좋아요를 가장 많이 받은 게시물 BEST 9, 총 좋아요, 가장 인기 있었던 달, 골든 타임까지 한 번에 보는 연말 피드 결산 리포트. 지금은 샘플 계정으로 결과 화면을 미리 볼 수 있어요.",
      keywords: ["베스트나인", "베스트 9", "best nine", "인스타 결산", "인스타 연말 결산", "2026 베스트나인", "좋아요 순위", "피드 분석"],
      about: ["My Post 2026은 한 해 동안 올린 게시물을 좋아요 순으로 모아 BEST 9 격자로 보여주고, 총 좋아요·평균 좋아요·가장 인기 있었던 달·포맷별 반응·골든 타임을 인포그래픽으로 정리하는 연말 결산 리포트입니다.", "정식 오픈 후에는 인스타그램 계정으로 로그인해 내 리포트를 만들고, 스토리 이미지나 링크로 친구에게 공유할 수 있어요. 지금은 가상 계정 샘플로 결과 화면을 미리 볼 수 있습니다."],
      howTo: ["샘플 리포트를 위에서부터 스크롤해 봅니다.", "[친구 화면]을 눌러 공유받은 친구에게 보이는 화면을 확인합니다.", "[스토리 이미지 만들기]로 공유용 카드를 미리 봅니다."],
      tags: ["베스트나인", "연말 결산", "피드 분석", "무료"],
    },
    en: {
      title: "My Post 2026 - Your Best Nine & Year-in-Review Feed Report",
      h1: "My Post 2026 — Your Feed's Best Nine of the Year",
      description: "See your 9 most-liked posts of the year, total likes, most popular month and best posting time in one year-in-review report. Preview the result page with a sample account for now.",
      keywords: ["best nine", "best nine 2026", "year in review", "top 9 posts", "most liked posts", "feed recap", "feed analytics"],
      about: ["My Post 2026 collects the year's posts in order of likes into a Best Nine grid, then charts total and average likes, the most popular month, format performance and your golden posting time.", "After launch you'll sign in with your account to build your own report and share it as a story image or link. For now, preview the result page with a sample account."],
      howTo: ["Scroll through the sample report.", "Tap Friend view to see what a friend who opens your link sees.", "Tap the story image button to preview the share card."],
      tags: ["Best Nine", "Year in review", "Feed analytics", "Free"],
    },
  },
  weapon: {
    ko: {
      title: "무기 강화 - 무료 강화 시뮬레이터 게임 (Lv.100 도전)",
      h1: "무기 강화 — 무료 확률형 강화 게임",
      description: "검·대검·활·창을 Lv.1부터 Lv.100까지 강화하는 무료 확률형 강화 시뮬레이터. 실패하면 유지, 파괴되면 처음부터! 최고 강화 레벨 랭킹에 도전하세요.",
      keywords: ["강화 게임", "무기 강화", "강화 시뮬레이터", "확률 게임", "강화하기", "방치형", "무료 게임", "웹게임"],
      about: ["무기 강화는 강화 성공·실패·파괴 확률 속에서 무기를 최대 Lv.100까지 키우는 강화 게임입니다. 레벨이 오를수록 성공 확률은 낮아지고 파괴 위험은 커져요.", "자동 강화를 켜두면 방치형처럼 알아서 강화가 진행됩니다. 로그인하면 최고 강화 레벨이 랭킹에 기록돼요."],
      howTo: ["무기를 고릅니다.", "[강화하기] 또는 Space 키로 강화합니다.", "파괴되면 Lv.1부터 다시 — 어디까지 올릴 수 있을까요?"],
      tags: ["강화", "확률", "방치형", "랭킹", "무료"],
    },
    en: {
      title: "Weapon Enhance - Free Upgrade Simulator Game (Reach Lv.100)",
      h1: "Weapon Enhance — Free Upgrade Simulator",
      description: "Enhance a sword, great sword, bow or spear from Lv.1 to Lv.100. Fail and it stays, break and you start over! Free upgrade simulator with a best-level leaderboard.",
      keywords: ["upgrade game", "weapon enhance", "enhancement simulator", "chance game", "idle game", "free game", "browser game"],
      about: ["Push your weapon up to Lv.100 against success, fail and break odds — the higher you go, the lower the success rate and the bigger the risk.", "Turn on auto-enhance and it runs on its own like an idle game. Signed-in players are ranked by best level."],
      howTo: ["Pick a weapon.", "Press Enhance or Space.", "Break and you restart at Lv.1 — how high can you go?"],
      tags: ["Upgrade", "Chance", "Idle", "Leaderboard", "Free"],
    },
  },
  oripa: {
    ko: {
      title: "오리파 시뮬레이터 - 무료 포켓몬·원피스 카드 뽑기 시뮬레이터",
      h1: "오리파 시뮬레이터 — 무료 카드 뽑기 게임",
      description: "실제 온라인 오리파처럼 봉투를 열어 포켓몬·원피스 카드를 뽑고 되팔며 자금을 불리는 무료 카드 뽑기 시뮬레이터. 최고 자금 랭킹에 도전하세요.",
      keywords: ["오리파", "오리파 시뮬레이터", "카드 뽑기", "포켓몬 카드", "원피스 카드", "가챠 시뮬레이터", "카드깡", "무료 게임"],
      about: ["오리파 시뮬레이터는 100장 봉투 중에서 골라 뽑는 온라인 오리파를 그대로 체험하는 게임입니다. 1등 카드를 뽑으면 난이도가 올라가요.", "뽑은 카드는 도감에 모으거나 되팔아 자금을 불릴 수 있어요. 로그인하면 최고 자금이 랭킹에 기록됩니다."],
      howTo: ["시리즈(포켓몬/원피스)를 고릅니다.", "봉투를 골라 카드를 뽑습니다.", "카드를 되팔아 자금을 늘리세요."],
      tags: ["카드 뽑기", "가챠", "시뮬레이터", "랭킹", "무료"],
    },
    en: {
      title: "Oripa Simulator - Free Pokémon & One Piece Card Pull Simulator",
      h1: "Oripa Simulator — Free Card Pull Game",
      description: "Open envelopes like a real online oripa, pull Pokémon and One Piece cards, sell them back and grow your funds. Free card pull simulator with a leaderboard.",
      keywords: ["oripa", "card pull simulator", "pack opening", "Pokémon cards", "One Piece cards", "gacha simulator", "free game"],
      about: ["Oripa Simulator recreates online oripa draws — pick envelopes from a board of 100 and see what you get. Pull the top card and the difficulty goes up.", "Collect cards in your dex or sell them back to grow your funds. Signed-in players are ranked by peak funds."],
      howTo: ["Pick a series (Pokémon / One Piece).", "Choose envelopes to pull cards.", "Sell cards back to grow your funds."],
      tags: ["Card pull", "Gacha", "Simulator", "Leaderboard", "Free"],
    },
  },
  "world-typing": {
    ko: {
      title: "세계도시 타이핑 - 무료 타자 연습 게임 (한타·영타)",
      h1: "세계도시 타이핑 — 무료 타자 연습 게임",
      description: "실제 세계 지도를 여행하며 235개 도시 이름을 입력하는 무료 타자 연습 게임. 한타·영타 모드로 타수와 정확도를 측정하고 랭킹에 도전하세요.",
      keywords: ["타자 연습", "타이핑 게임", "한타 연습", "영타 연습", "타자 게임", "타자 속도 측정", "무료 게임", "웹게임"],
      about: ["세계도시 타이핑은 지도 위 도시 이름을 입력할 때마다 다음 목적지로 날아가는 타자 연습 게임입니다. 한타(한글 도시명)와 영타(영문 도시명) 모드를 지원해요.", "25개 이상 완주하면 정확도를 반영한 타수(CPM/WPM)가 랭킹에 기록됩니다."],
      howTo: ["한타/영타 모드와 도시 수를 고릅니다.", "화면의 도시 이름을 정확히 입력하고 Enter.", "모든 도시를 완주하면 기록이 나옵니다."],
      tags: ["타자 연습", "타이핑", "랭킹", "무료"],
    },
    en: {
      title: "World City Typing - Free Typing Practice Game",
      h1: "World City Typing — Free Typing Practice",
      description: "Travel a real world map by typing 235 city names. Measure your speed and accuracy in Korean or English mode and climb the leaderboard.",
      keywords: ["typing game", "typing practice", "typing test", "WPM test", "free game", "browser game"],
      about: ["Each city you type correctly flies you to the next destination on a live world map. Supports Korean and English city names.", "Finish 25+ cities and your accuracy-adjusted speed (CPM/WPM) goes on the leaderboard."],
      howTo: ["Pick Korean/English mode and how many cities.", "Type the city name exactly and press Enter.", "Finish every city to see your results."],
      tags: ["Typing", "Practice", "Leaderboard", "Free"],
    },
  },
};

/** 홈 화면 아래 장르 소개 (내부 링크 포함) */
export const HOME_SECTIONS: Record<Lang, { heading: string; items: { title: string; text: string; games: string[] }[] }> = {
  ko: {
    heading: "어떤 게임이 있나요?",
    items: [
      { title: "온라인 보드게임", text: "친구와 방을 만들어 실시간으로 즐기는 무료 온라인 보드게임. 빈 자리는 AI가 채워 주고, 혼자서도 AI와 바로 대결할 수 있어요.", games: ["catan", "lexio", "dragon-call"] },
      { title: "방치형 게임", text: "틀어두기만 해도 진행되는 방치형 타워디펜스와 자동 강화. 도달 라운드와 최고 레벨로 랭킹을 겨뤄보세요.", games: ["random-td", "weapon"] },
      { title: "뱀서 · 서바이벌", text: "몰려오는 몬스터 속에서 스킬을 골라 성장하는 뱀서류 서바이벌 로그라이크. 생존 시간 랭킹에 도전하세요.", games: ["archer"] },
      { title: "슈팅 · 타워디펜스", text: "아케이드 종스크롤 비행기 슈팅과 원소 조합 전략 타워디펜스.", games: ["raiden", "element-td"] },
      { title: "로또 추천 · 룰렛 추첨", text: "로또 6/45 번호 추천 생성기와, 룰렛·돌림판 대신 쓰는 핀볼 추첨기. 모임 벌칙 정하기나 경품 추첨에 좋아요.", games: ["lotto", "pinball"] },
      { title: "카드 뽑기 · 타자 연습", text: "포켓몬·원피스 카드 오리파 시뮬레이터와 세계 지도 타자 연습 게임.", games: ["oripa", "world-typing"] },
    ],
  },
  en: {
    heading: "What can you play?",
    items: [
      { title: "Online board games", text: "Free online board games to play live with friends. AI fills empty seats, and you can always play solo against AI.", games: ["catan", "lexio", "dragon-call"] },
      { title: "Idle games", text: "Idle tower defense and auto-enhance games that keep going on their own. Compete on round and level leaderboards.", games: ["random-td", "weapon"] },
      { title: "Survivor-like · Survival", text: "A survivor-like roguelite — grow your skills amid endless hordes and chase the survival-time leaderboard.", games: ["archer"] },
      { title: "Shooter · Tower defense", text: "An arcade vertical shooter and an elemental strategy tower defense.", games: ["raiden", "element-td"] },
      { title: "Lotto picker · Roulette draws", text: "A 6/45 lotto number generator, and a pinball draw machine that beats any roulette wheel for picking winners.", games: ["lotto", "pinball"] },
      { title: "Card pulls · Typing", text: "A Pokémon / One Piece oripa card-pull simulator and a world-map typing practice game.", games: ["oripa", "world-typing"] },
    ],
  },
};
