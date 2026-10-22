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
    title: "미니 게임 천국 - 무료 웹게임 · 보드게임 · 추첨기 모음",
    description: "설치 없이 바로 하는 무료 웹게임 모음. 친구와 온라인 보드게임, 방치형·서바이벌 게임, 로또·핀볼 추첨기까지 즐기고 랭킹에 도전하세요.",
    keywords: [
      "게임", "무료 게임", "웹게임", "브라우저 게임", "미니게임", "온라인 게임",
      "보드게임", "온라인 보드게임", "boardgame", "board game",
      "방치형", "방치형 게임", "뱀서", "뱀서라이크", "서바이벌", "서바이벌 게임",
      "로또", "로또추천", "로또 번호 추천", "룰렛", "핀볼", "추첨기",
      "타워디펜스", "슈팅게임", "타자 연습", "강화 게임", "미니 게임 천국",
    ],
  },
  en: {
    title: "Mini Game Heaven - Free Browser Games & Pickers",
    description: "Free browser games, no install: online board games, idle and survivor games, lotto and pinball pickers, with leaderboards.",
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
  holdem: {
    ko: {
      title: "텍사스 홀덤 - 무료 온라인 홀덤 포커 토너먼트 (친구 대전·AI)",
      h1: "텍사스 홀덤 — 무료 온라인 포커 토너먼트",
      description: "설치 없이 바로 하는 무료 텍사스 홀덤. 친구와 2~6명 온라인 대전을 하거나 AI와 토너먼트를 즐기세요. 온라인에서는 내 카드가 암호화되어 나만 볼 수 있어요. 실제 돈은 쓰지 않아요.",
      keywords: ["홀덤", "텍사스 홀덤", "무료 홀덤", "온라인 홀덤", "포커", "홀덤 게임", "친구랑 홀덤", "홀덤 토너먼트", "보드게임", "무료 게임"],
      about: [
        "텍사스 홀덤은 각자 받은 카드 2장과 가운데 공용 카드 5장으로 가장 좋은 5장을 만드는 포커 게임입니다. 모두 같은 칩으로 시작해 블라인드가 점점 오르고, 칩을 모두 잃으면 탈락해 마지막 한 명이 우승하는 토너먼트 방식이에요.",
        "로그인하면 방을 만들어 친구와 2~6명이 온라인으로 대결할 수 있고, 빈 자리는 AI가 채웁니다. 온라인에서는 각자의 카드를 그 사람 브라우저만 풀 수 있게 암호화해서 보내요. 혼자 할 때는 AI 1~5명과 바로 플레이할 수 있습니다. 실제 돈은 오가지 않는 무료 게임이에요.",
      ],
      howTo: ["혼자 하기에서 AI 수·시작 칩·블라인드 속도를 고르거나, 온라인 대전에서 방을 만들어 코드를 공유합니다.", "차례가 오면 폴드·체크/콜·레이즈 중 하나를 고르세요. 레이즈 금액은 버튼(½팟·팟·올인)이나 슬라이더로 정해요.", "마지막까지 칩을 지키면 우승!"],
      tags: ["포커", "홀덤", "온라인 대전", "AI 대전", "무료"],
    },
    en: {
      title: "Texas Hold'em - Free Online Poker Tournament (Friends & AI)",
      h1: "Texas Hold'em — Free Online Poker Tournament",
      description: "Free Texas Hold'em in your browser. Play a 2–6 player tournament online with friends or against AI. Online, your hole cards are encrypted so only you can see them. No real money.",
      keywords: ["texas holdem", "holdem", "free poker", "online poker with friends", "poker tournament", "board game", "free game"],
      about: [
        "Texas Hold'em is the poker game where you make the best five-card hand from your two hole cards and five community cards. Everyone starts with the same stack, the blinds rise, and the last player with chips wins the tournament.",
        "Sign in to open a room and play 2–6 players online with friends — AI fills empty seats. Online, each player's cards are encrypted so only their own browser can read them. Or play solo against 1–5 AI opponents right away. No real money is involved.",
      ],
      howTo: ["Solo: pick the number of AI, starting stack and blind speed. Online: create a room and share the code.", "On your turn choose fold, check/call or raise — size raises with the ½ pot, pot and all-in buttons or the slider.", "Keep your chips to the end to win!"],
      tags: ["Poker", "Hold'em", "Online", "Vs AI", "Free"],
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
  tarot: {
    ko: {
      title: "타로 운세 - 무료 타로 카드 뽑기 · 애정운 재회운 금전운 올해 운세",
      h1: "타로 운세 — 고민을 고르고 카드를 직접 뽑는 무료 타로",
      description: "애정운·재회운·금전운·사업운·직장운·학업운·인간관계·올해 운세까지, 섞인 메이저 아르카나 22장 중에서 직접 카드를 뽑아 정방향·역방향 해석을 받아 보세요. 결과는 카카오톡으로 친구에게 공유할 수 있어요. 무료, 회원가입 없음.",
      keywords: ["타로", "무료 타로", "타로 운세", "타로 카드", "타로점", "애정운 타로", "재회운 타로", "금전운", "신년운세", "올해 운세", "오늘의 타로", "타로 카드 의미"],
      about: ["타로 운세는 고민을 고르면 메이저 아르카나 22장을 섞어 부채꼴로 펼쳐 주고, 마음이 가는 카드를 직접 골라 해석을 받아 보는 무료 타로 서비스입니다. 한 장으로 오늘의 메시지를 보거나, 세 장으로 과거·현재·미래의 흐름을 볼 수 있어요.", "카드마다 정방향과 역방향, 그리고 애정·재회·금전·사업·직장·학업·인간관계·올해 운세 여덟 가지 고민에 맞춘 해석을 직접 써 두었어요. 세 장을 뽑으면 역방향 개수와 카드 단계의 흐름으로 종합 메시지도 알려 드립니다. 결과는 링크·이미지로 친구에게 보낼 수 있어요."],
      howTo: ["궁금한 고민(애정운·금전운 등)과 한 장/세 장을 고릅니다.", "카드가 섞이면 부채꼴에서 마음이 가는 카드를 고릅니다. 휴대폰은 손가락으로 훑다가 손을 떼면 골라져요.", "[결과 보기]로 카드를 뒤집고 해석을 읽은 뒤, [결과 공유하기]로 친구에게 보내 보세요."],
      tags: ["타로", "운세", "애정운", "무료"],
    },
    en: {
      title: "Tarot Reading - Free Tarot Card Draw for Love, Money & the Year Ahead",
      h1: "Tarot Reading — Pick Your Question and Draw the Cards Yourself",
      description: "Choose love, reunion, money, business, career, study, relationships or the year ahead, then draw from the shuffled 22 Major Arcana for upright and reversed readings. Share your result with friends. Free, no sign-up.",
      keywords: ["tarot", "free tarot reading", "tarot card draw", "love tarot", "yes or no tarot", "tarot card meanings", "year ahead tarot", "past present future tarot"],
      about: ["Tarot Reading shuffles the 22 Major Arcana and fans them out so you can pick the cards that call to you. Draw one card for today's message or three for past, present and future.", "Each card has upright and reversed readings written for eight topics: love, reunion, money, business, career, study, relationships and the year ahead. Three-card readings add an overall message, and you can share the result as a link or image."],
      howTo: ["Choose a topic and one or three cards.", "Pick cards from the fan — on phones, slide your finger and lift on the card you want.", "Tap Reveal to turn them over, then share your reading with friends."],
      tags: ["Tarot", "Fortune", "Love", "Free"],
    },
  },
  "passport-map": {
    ko: {
      title: "Passport Map - 다녀온 나라 색칠하기 · 세계 여행 지도 만들기",
      h1: "Passport Map — 다녀온 나라와 도시를 색칠하는 여행 지도",
      description: "세계지도에서 다녀온 나라를 원하는 색으로 칠하고, 도시에 핀을 꽂고, 장소마다 여행 사진과 방문 날짜를 남기는 무료 여행 기록. 카카오·이메일 로그인으로 어디서든 이어 보고 인스타·X용 공유 이미지도 만들 수 있어요.",
      keywords: ["Passport Map", "여행 지도", "다녀온 나라", "세계지도 색칠", "여행 기록", "방문 국가", "세계 여행 지도", "여행 사진 지도", "visited countries"],
      about: ["Passport Map은 세계지도 위에 다녀온 나라를 색칠하고, 도시마다 핀을 찍어 나만의 여행 지도를 만드는 서비스입니다. 나라와 도시마다 사진 1장과 한 줄 메모를 남기면 지도에 마우스를 올렸을 때 사진이 떠요.", "다녀온 나라 수·도시 수·세계 몇 %를 다녀왔는지 한눈에 보이고, 정사각·세로·가로 비율의 공유 이미지로 SNS에 올릴 수 있어요. 카카오톡이나 이메일로 로그인하면 어느 기기에서든 같은 지도를 이어서 볼 수 있습니다."],
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
  "my-room": {
    ko: {
      title: "마이룸 - 도트 미니룸 꾸미기 · 캐릭터 꾸미기",
      h1: "마이룸 — 추억의 도트 미니룸 꾸미기",
      description: "그 시절 감성의 도트 미니룸을 무료로 꾸며 보세요. 벽지·바닥을 고르고 침대·책상·피아노·컴퓨터 같은 가구를 배치하고, 머리·옷·액세서리를 바꿔 내 캐릭터를 방에 세울 수 있어요.",
      keywords: ["미니룸", "미니룸 꾸미기", "방 꾸미기", "도트 방", "캐릭터 꾸미기", "아바타 꾸미기", "픽셀아트", "마이룸", "추억", "감성"],
      about: [
        "마이룸은 아이소메트릭(비스듬한 시점) 도트 그림으로 만든 나만의 작은 방이에요. 분홍 꽃·하늘 물방울·밤하늘 별 같은 벽지와 원목 마루·체크 타일·카펫 바닥을 고르고, 침대·소파·책상·책장·냉장고·피아노·TV·곰인형 등 30가지 넘는 가구와 소품을 원하는 자리에 놓을 수 있어요.",
        "캐릭터는 피부색, 머리 모양과 색, 눈, 상의·하의·신발 색, 안경·리본·모자·헤드폰 같은 액세서리를 바꿔 꾸미고, 말풍선 한마디도 달 수 있어요. 로그인하면 꾸민 방이 계정에 저장되고, 📷 버튼으로 방 사진을 저장할 수 있어요.",
      ],
      howTo: [
        "[가구] 탭에서 마음에 드는 가구의 [배치하기]를 눌러요.",
        "방 안의 가구나 캐릭터를 눌러 끌어서 옮기고, ↔ 돌리기 · 🎨 색 · 🗑 삭제 버튼으로 다듬어요.",
        "[벽지·바닥] 탭에서 방 분위기를 바꾸고, [캐릭터] 탭에서 내 캐릭터를 꾸며요.",
        "📷 버튼으로 방 사진을 저장해 친구에게 자랑해 보세요.",
      ],
      tags: ["미니룸", "꾸미기", "도트", "캐릭터", "감성", "무료"],
    },
    en: {
      title: "My Room - Pixel Mini Room & Avatar Maker",
      h1: "My Room — Decorate a Cozy Pixel Mini Room",
      description: "Decorate a nostalgic isometric pixel room for free: choose wallpaper and floors, place beds, desks, pianos and computers, and dress up your own character.",
      keywords: ["mini room", "room decorating game", "pixel room", "avatar maker", "isometric pixel art", "cozy game"],
      about: [
        "My Room is a tiny isometric pixel-art room of your own. Pick wallpapers and floors, then place 30+ pieces of furniture and decor — beds, sofas, desks, bookshelves, a fridge, a piano, a TV, teddy bears and more.",
        "Dress up your character's skin, hair, eyes, clothes and accessories and add a speech bubble. Sign in to keep your room in your account, and use 📷 to save a picture.",
      ],
      howTo: [
        "In Furniture, tap Place on anything you like.",
        "Drag furniture or your character around; use Turn, Color and Delete to fine-tune.",
        "Change the mood in Room and dress up in Character.",
        "Save a picture with 📷 and show it off.",
      ],
      tags: ["Mini room", "Decorating", "Pixel art", "Avatar", "Cozy", "Free"],
    },
  },
  "explore-map": {
    ko: {
      title: "동네 정복 - 지하철역·버스정류장 체크인 땅따먹기",
      h1: "동네 정복 — 체크인으로 실제 지도를 밝히는 땅따먹기",
      description: "지하철역과 버스정류장에서 체크인하면 안개가 걷히며 실제 지도가 밝혀지는 무료 탐험 게임. 서울·인천·경기 탐험률과 뱃지를 모아 보세요.",
      keywords: ["동네 정복", "탐험 지도", "위치 기반 게임", "체크인 게임", "땅따먹기", "지하철역", "버스정류장", "서울 탐험", "동네 탐험", "산책 게임", "무료 게임"],
      about: [
        "동네 정복은 실제로 가 본 곳만 밝혀지는 위치 기반 땅따먹기 게임입니다. 처음에는 서울·인천·경기 지도 전체가 안개로 덮여 있고, 지하철역이나 버스정류장 근처에서 체크인하면 그 주변이 육각형 칸 단위로 밝혀져요.",
        "지하철역은 반경 1km, 환승역은 1.5km, 버스정류장은 500m(외곽은 800m)가 한 번에 열리고, 그날 첫 체크인은 1.5배로 열립니다. 화면을 켜고 걸으면 지나간 길 주변도 밝혀져요. 출퇴근길, 산책, 여행에서 체크인을 모아 시·군·구별 탐험률을 올리고 뱃지를 모아 보세요.",
      ],
      howTo: [
        "[위치 켜고 탐험 시작]을 눌러 위치 사용을 허용합니다.",
        "지하철역 300m, 버스정류장 150m 안으로 가면 [주변 체크인] 목록에 체크인 버튼이 켜집니다.",
        "체크인하면 주변 안개가 걷히고, [탐험 기록]에서 지역별 탐험률을 볼 수 있어요.",
        "로그인하면 기록이 계정에 저장되고 밝힌 칸 수로 랭킹에 올라갑니다.",
      ],
      tags: ["위치기반", "탐험", "지하철", "버스", "수도권", "무료"],
    },
    en: {
      title: "Town Conquest - Check In at Real Stations to Conquer the Map",
      h1: "Town Conquest — Reveal a Real Map by Checking In",
      description: "A free location game: check in at real subway stations and bus stops to clear the fog. Raise your exploration rate across Seoul, Incheon and Gyeonggi.",
      keywords: ["town conquest", "explore map", "location game", "check-in game", "fog of war map", "Seoul subway", "bus stops", "walking game", "free game"],
      about: [
        "Town Conquest only reveals places you have actually been. The Seoul metro area starts covered in fog; check in near a subway station or bus stop and the area around it is revealed in hexagon cells.",
        "A station reveals 1km, a transfer station 1.5km and a bus stop 500m (800m in the outskirts); the first check-in of the day reveals 1.5×, and walking with the page open reveals your path. Collect check-ins on your commute, walks and trips to raise district exploration rates and earn badges.",
      ],
      howTo: [
        "Tap Start and allow location access.",
        "Within 300m of a station or 150m of a bus stop, the Check in button lights up in the Nearby list.",
        "Checking in clears the fog; see per-district progress in the Progress tab.",
        "Sign in to save to your account and rank by cells revealed.",
      ],
      tags: ["Location", "Exploration", "Subway", "Bus", "Seoul", "Free"],
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
  roulette: {
    ko: {
      title: "룰렛 게임 - 무료 유럽식 싱글 제로 룰렛 (카지노 게임)",
      h1: "룰렛 — 무료 카지노 룰렛 게임",
      description: "0이 하나뿐인 유럽식 룰렛을 설치 없이 무료로. 100만 원으로 시작해 스트레이트·스플릿·코너·레드/블랙에 칩을 걸고 최고 잔액 랭킹에 도전하세요. 실제 돈은 쓰지 않아요.",
      keywords: ["룰렛", "룰렛 게임", "카지노 룰렛", "유럽식 룰렛", "싱글 제로 룰렛", "카지노 게임", "무료 카지노", "룰렛 시뮬레이터", "무료 게임"],
      about: [
        "유럽식 룰렛은 0부터 36까지 37칸으로 이뤄져 있어요. 0이 두 개인 미국식보다 하우스 엣지가 2.7%로 낮습니다.",
        "100만 원이 주어지고 칩은 5만 원부터 걸 수 있어요. 잔액이 100만 원 이상이면 로그인한 계정의 최고 잔액이 랭킹에 기록됩니다. 칩을 다 잃으면 100만 원으로 다시 시작할 수 있어요. 실제 돈은 오가지 않는 무료 게임입니다.",
      ],
      howTo: ["칩 금액을 고릅니다.", "숫자·선·교차점이나 레드/블랙·홀짝 같은 칸을 눌러 칩을 올립니다.", "SPIN을 눌러 휠을 돌리고 결과를 확인하세요."],
      tags: ["카지노", "룰렛", "확률", "랭킹", "무료"],
    },
    en: {
      title: "Roulette - Free Single-Zero European Roulette Game",
      h1: "Roulette — Free Casino Roulette",
      description: "Play single-zero European roulette free in your browser. Start with ₩1,000,000, bet straight, split, corner or red/black and climb the peak-balance leaderboard. No real money.",
      keywords: ["roulette", "free roulette", "European roulette", "single zero roulette", "casino game", "roulette simulator", "free game"],
      about: [
        "European roulette has 37 pockets, 0 through 36. With a single zero the house edge is 2.7%, lower than double-zero American roulette.",
        "You start with ₩1,000,000 and chips start at ₩50,000. While your balance is ₩1,000,000 or more, signed-in players are ranked by peak balance. Go broke and you can start again. No real money is involved.",
      ],
      howTo: ["Pick a chip value.", "Tap a number, a line, an intersection or an outside bet like red/black.", "Press SPIN and watch where the ball lands."],
      tags: ["Casino", "Roulette", "Odds", "Leaderboard", "Free"],
    },
  },
  baccarat: {
    ko: {
      title: "바카라 게임 - 무료 8덱 정통 바카라 (출목표·중국점)",
      h1: "바카라 — 무료 카지노 바카라 게임",
      description: "8덱 슈로 진행하는 정통 바카라를 무료로. 플레이어·뱅커·타이·페어에 베팅하고 빅로드·본매·빅아이보이·스몰로드·바퀴벌레 출목표로 흐름을 확인하세요. 100만 원으로 시작해 최고 잔액 랭킹에 도전. 실제 돈은 쓰지 않아요.",
      keywords: ["바카라", "바카라 게임", "무료 바카라", "바카라 출목표", "빅로드", "중국점", "카지노 게임", "바카라 시뮬레이터", "무료 게임"],
      about: [
        "바카라는 플레이어와 뱅커 중 카드 합의 일의 자리가 9에 가까운 쪽을 맞히는 카지노 게임입니다. 세 번째 카드는 정해진 규칙에 따라 자동으로 받아요.",
        "실제 카지노처럼 빅로드·본매·중국점(빅아이보이·스몰로드·바퀴벌레) 출목표를 보여 주고, 다음에 뱅커나 플레이어가 나오면 어떻게 찍힐지도 미리 볼 수 있어요. 100만 원으로 시작하고 잔액이 100만 원 이상이면 로그인한 계정의 최고 잔액이 랭킹에 기록됩니다. 실제 돈은 오가지 않는 무료 게임이에요.",
      ],
      howTo: ["칩 금액을 고릅니다.", "플레이어·뱅커·타이·페어 칸을 눌러 칩을 올립니다.", "DEAL을 누르면 카드가 펼쳐지고 결과가 출목표에 기록됩니다."],
      tags: ["카지노", "바카라", "출목표", "랭킹", "무료"],
    },
    en: {
      title: "Baccarat - Free 8-Deck Baccarat with Big Road & Derived Roads",
      h1: "Baccarat — Free Casino Baccarat",
      description: "Play classic 8-deck punto banco free. Bet Player, Banker, Tie or Pairs and follow the big road, bead plate, big eye boy, small road and cockroach pig scoreboards. Start with ₩1,000,000 and chase the peak-balance leaderboard. No real money.",
      keywords: ["baccarat", "free baccarat", "baccarat big road", "baccarat roads", "punto banco", "casino game", "free game"],
      about: [
        "Baccarat asks you to pick the hand — Player or Banker — whose total ends closer to 9. Third cards are drawn automatically by the standard tableau.",
        "Like a real casino scoreboard it shows the big road, bead plate and the three derived roads, plus a preview of what a Banker or Player win would add. You start with ₩1,000,000; while your balance is ₩1,000,000 or more, signed-in players are ranked by peak balance. No real money is involved.",
      ],
      howTo: ["Pick a chip value.", "Tap Player, Banker, Tie or a Pair bet.", "Press DEAL — the cards are revealed and the result is added to the roads."],
      tags: ["Casino", "Baccarat", "Roads", "Leaderboard", "Free"],
    },
  },
  blackjack: {
    ko: {
      title: "블랙잭 게임 - 무료 6덱 정통 블랙잭 (기본 전략 힌트)",
      h1: "블랙잭 — 무료 카지노 블랙잭 게임",
      description: "설치 없이 바로 하는 무료 블랙잭. 히트·스탠드·더블·스플릿·서렌더·보험까지 정통 규칙, 블랙잭은 3:2. 기본 전략 힌트를 켜고 100만 원으로 최고 잔액 랭킹에 도전하세요. 실제 돈은 쓰지 않아요.",
      keywords: ["블랙잭", "블랙잭 게임", "무료 블랙잭", "블랙잭 기본 전략", "카지노 게임", "21", "블랙잭 연습", "무료 게임"],
      about: [
        "블랙잭은 카드 합이 21을 넘지 않으면서 딜러보다 21에 가깝게 만드는 카지노 게임입니다. 6덱 슈를 쓰고, 딜러는 소프트 17을 포함해 17 이상에서 멈추며, 처음 두 장이 A와 10이면 3:2를 받아요.",
        "더블, 최대 4핸드 스플릿, 서렌더, 보험을 모두 지원하고, 💡 힌트를 켜면 기본 전략이 추천하는 행동을 표시해 줘서 연습하기 좋아요. 100만 원으로 시작하고 잔액이 100만 원 이상이면 로그인한 계정의 최고 잔액이 랭킹에 기록됩니다. 실제 돈은 오가지 않는 무료 게임이에요.",
      ],
      howTo: ["칩을 눌러 베팅하고 DEAL을 누릅니다.", "히트·스탠드·더블·스플릿·서렌더 중 하나를 고르세요. 💡 힌트를 켜면 추천 행동이 표시돼요.", "딜러보다 21에 가까우면 승리, 처음 두 장이 블랙잭이면 3:2!"],
      tags: ["카지노", "블랙잭", "기본 전략", "랭킹", "무료"],
    },
    en: {
      title: "Blackjack - Free 6-Deck Blackjack with Basic Strategy Hints",
      h1: "Blackjack — Free Casino Blackjack",
      description: "Play classic blackjack free in your browser: hit, stand, double, split, surrender and insurance, blackjack pays 3:2. Turn on basic-strategy hints and chase the peak-balance leaderboard from ₩1,000,000. No real money.",
      keywords: ["blackjack", "free blackjack", "blackjack basic strategy", "21", "casino game", "free game"],
      about: [
        "Blackjack is the casino game where you try to beat the dealer by getting closer to 21 without going over. A six-deck shoe, the dealer stands on all 17s, and a natural pays 3:2.",
        "Double, split up to four hands, surrender and insurance are all in, and the 💡 hint shows the basic-strategy move so you can practise. Start with ₩1,000,000; while your balance is ₩1,000,000 or more, signed-in players are ranked by peak balance. No real money is involved.",
      ],
      howTo: ["Tap chips to bet and press DEAL.", "Hit, stand, double, split or surrender — turn on 💡 Hint to see the recommended move.", "Beat the dealer's total without busting; a two-card 21 pays 3:2!"],
      tags: ["Casino", "Blackjack", "Basic strategy", "Leaderboard", "Free"],
    },
  },
  racing: {
    ko: {
      title: "서킷 메이커 - 트랙을 만들고 친구와 달리는 3D 레이싱 게임",
      h1: "서킷 메이커 — 맵 만들기 3D 레이싱",
      description: "설치 없이 바로 하는 무료 3D 레이싱. 도로 조각을 이어 나만의 서킷을 만들고, 랩 수·인원수·맵을 골라 AI와 대결하거나 최대 8명이 친구와 온라인으로 함께 달려요. 만든 맵은 공유 코드로 친구에게 보낼 수 있어요.",
      keywords: ["레이싱 게임", "자동차 게임", "카트 게임", "맵 만들기", "트랙 에디터", "온라인 레이싱", "멀티플레이 레이싱", "3D 레이싱", "무료 게임"],
      about: [
        "서킷 메이커는 직선·코너·교차로 같은 도로 조각을 격자 위에 이어 붙여 나만의 레이싱 트랙을 만들고, 바로 그 트랙에서 달리는 3D 아케이드 레이싱 게임입니다. 출발선에서 출발해 다시 출발선으로 돌아오면 코스가 완성되고, 관중석·나무·부스트 박스로 꾸밀 수 있어요.",
        "레이스는 맵, 랩 수(1~9), 인원수(최대 8명)를 고르고 시작합니다. 혼자 할 때는 쉬움·보통·어려움 AI와 겨루고, 온라인 방을 만들면 친구와 실시간으로 함께 달려요. 레이싱카·카트·몬스터 트럭 등 13대의 차가 속도·가속·핸들링이 조금씩 달라요.",
      ],
      howTo: ["메뉴에서 '레이스'를 누르고 맵·랩 수·인원수·차를 고르세요.", "← → 로 조향, ↑ 가속, ↓ 브레이크. 휴대폰은 화면 버튼으로 조작해요. 코스를 벗어나면 R(↺)로 복귀!", "'맵 에디터'에서 도로 조각을 이어 출발선으로 돌아오는 코스를 만들고 저장하면 레이스에서 고를 수 있어요."],
      tags: ["레이싱", "맵 만들기", "온라인 대전", "AI 대전", "3D", "무료"],
    },
    en: {
      title: "Circuit Maker - Build a Track and Race Friends in 3D",
      h1: "Circuit Maker — 3D Racing with a Track Editor",
      description: "A free 3D racing game in your browser. Snap road pieces together to build your own circuit, then pick laps, racers and a track to race AI or up to 8 friends online. Share tracks with a code.",
      keywords: ["racing game", "car game", "track editor", "track builder", "online racing", "multiplayer racing", "3D racing", "free game"],
      about: [
        "Circuit Maker is a 3D arcade racer where you build the track yourself: snap straights, corners and crossings onto a grid, close the loop back to the start line, and dress it up with grandstands, trees and boost boxes.",
        "Choose a track, 1–9 laps and up to 8 racers. Play solo against Easy, Normal or Hard AI, or open an online room and race friends in real time. Thirteen cars — racers, karts, a monster truck and more — each trade off speed, acceleration and handling.",
      ],
      howTo: ["Press Race and choose a track, laps, racers and your car.", "Steer with ← →, ↑ to accelerate, ↓ to brake. On phones use the on-screen buttons. Off track? Press R (↺) to reset.", "In the Track Editor, connect road pieces into a loop that returns to the start line, save it, and race it."],
      tags: ["Racing", "Track editor", "Online", "AI", "3D", "Free"],
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
      { title: "온라인 보드게임", text: "친구와 방을 만들어 실시간으로 즐기는 무료 온라인 보드게임. 빈 자리는 AI가 채워 주고, 혼자서도 AI와 바로 대결할 수 있어요.", games: ["catan", "lexio", "dragon-call", "holdem"] },
      { title: "방치형 게임", text: "틀어두기만 해도 진행되는 방치형 타워디펜스와 자동 강화. 도달 라운드와 최고 레벨로 랭킹을 겨뤄보세요.", games: ["random-td", "weapon"] },
      { title: "뱀서 · 서바이벌", text: "몰려오는 몬스터 속에서 스킬을 골라 성장하는 뱀서류 서바이벌 로그라이크. 생존 시간 랭킹에 도전하세요.", games: ["archer"] },
      { title: "슈팅 · 타워디펜스", text: "아케이드 종스크롤 비행기 슈팅과 원소 조합 전략 타워디펜스.", games: ["raiden", "element-td"] },
      { title: "카드 뽑기 · 타자 연습", text: "포켓몬·원피스 카드 오리파 시뮬레이터와 세계 지도 타자 연습 게임.", games: ["oripa", "world-typing"] },
      { title: "카지노", text: "0이 하나뿐인 유럽식 룰렛, 출목표가 있는 8덱 바카라, 기본 전략 힌트가 있는 6덱 블랙잭. 100만 원으로 시작해 최고 잔액 랭킹에 도전하세요. 실제 돈은 쓰지 않아요.", games: ["roulette", "baccarat", "blackjack"] },
    ],
  },
  en: {
    heading: "What can you play?",
    items: [
      { title: "Online board games", text: "Free online board games to play live with friends. AI fills empty seats, and you can always play solo against AI.", games: ["catan", "lexio", "dragon-call", "holdem"] },
      { title: "Idle games", text: "Idle tower defense and auto-enhance games that keep going on their own. Compete on round and level leaderboards.", games: ["random-td", "weapon"] },
      { title: "Survivor-like · Survival", text: "A survivor-like roguelite — grow your skills amid endless hordes and chase the survival-time leaderboard.", games: ["archer"] },
      { title: "Shooter · Tower defense", text: "An arcade vertical shooter and an elemental strategy tower defense.", games: ["raiden", "element-td"] },
      { title: "Card pulls · Typing", text: "A Pokémon / One Piece oripa card-pull simulator and a world-map typing practice game.", games: ["oripa", "world-typing"] },
      { title: "Casino", text: "Single-zero European roulette, 8-deck baccarat with full scoreboards and 6-deck blackjack with basic-strategy hints — start with ₩1,000,000 and chase the peak-balance leaderboard. No real money.", games: ["roulette", "baccarat", "blackjack"] },
    ],
  },
};

/** 추첨·도구 / 서비스 목록 페이지 문구 (게임 목록은 홈이 맡는다) */
export const KIND_SEO: Record<"tool" | "app", Record<Lang, { heading: string; title: string; description: string; keywords: string[]; eyebrow: string; subtitle: string; about: string[] }>> = {
  tool: {
    ko: {
      heading: "추첨·도구",
      eyebrow: "DRAW & TOOLS",
      title: "무료 추첨기 모음 - 로또 번호 추천 · 핀볼 룰렛 추첨 · 사다리 대신 쓰는 랜덤 뽑기",
      description:
        "로또 6/45 번호 추천 생성기와 룰렛·돌림판 대신 쓰는 핀볼 추첨기. 설치 없이 바로 쓰는 무료 추첨 도구로 경품 추첨, 벌칙 정하기, 순서 정하기를 공정하게 해보세요.",
      keywords: ["추첨기", "로또", "로또추천", "로또 번호 추천", "로또 번호 생성기", "룰렛", "돌림판", "핀볼 추첨", "랜덤 뽑기", "경품 추첨", "벌칙 정하기", "사다리 타기 대신", "무료 추첨 사이트"],
      subtitle: "로또 번호를 뽑거나 모임에서 당첨자·순서를 정할 때 바로 쓰는 추첨 도구예요.",
      about: [
        "로또 번호 추첨기는 1~5게임을 한 번에 뽑고, 꼭 넣을 번호와 뺄 번호를 정할 수 있어요.",
        "핀볼 추첨기는 참가자 이름과 공 개수를 넣고 핀볼 맵에 굴려 도착 순서로 당첨을 가립니다. 룰렛·돌림판보다 보는 재미가 있어 모임 벌칙이나 경품 추첨에 좋아요.",
      ],
    },
    en: {
      heading: "Draw & Tools",
      eyebrow: "DRAW & TOOLS",
      title: "Free Random Draw Tools - Lotto Number Picker · Pinball Roulette Draw",
      description:
        "A 6/45 lotto number generator and a pinball draw machine that beats any roulette wheel. Free, no-install tools for prize draws, picking winners and deciding turns.",
      keywords: ["random picker", "lotto number generator", "lottery picker", "roulette", "spin the wheel", "pinball draw", "prize draw", "random name picker"],
      subtitle: "Quick tools for picking lotto numbers or drawing winners and turns with friends.",
      about: [
        "The lotto picker draws 1 to 5 sets at once, with numbers to always include or exclude.",
        "The pinball draw machine drops each entry onto a pinball map — arrival order decides the winners. More fun to watch than a roulette wheel.",
      ],
    },
  },
  app: {
    ko: {
      heading: "서비스",
      eyebrow: "MY SERVICES",
      title: "무료 웹 서비스 - 축구 승부 예측 · 여행 지도 만들기 Passport Map",
      description:
        "유럽 축구 경기의 승·무·패 확률을 계산하는 스포츠 승부 예측, 다녀온 나라와 도시를 세계지도에 칠하는 여행 지도 Passport Map 등 무료 웹 서비스 모음이에요.",
      keywords: ["축구 승부 예측", "축구 경기 예측", "여행 지도", "여행 지도 만들기", "세계지도 색칠", "다녀온 나라", "Passport Map", "무료 웹 서비스"],
      subtitle: "축구 경기 예측처럼 바로 쓰는 정보 서비스와, 로그인하면 내 기록이 계정에 쌓이는 개인 서비스예요.",
      about: [
        "스포츠 승부 예측은 프리미어리그·라리가·분데스리가·세리에A·리그1·챔피언스리그 경기의 승·무·패 확률과 예상 스코어, 리그 우승·강등 확률을 통계 모델로 계산해요. 예측은 킥오프 순간 잠기고 적중률을 그대로 공개합니다.",
        "Passport Map은 다녀온 나라와 도시를 원하는 색으로 칠하고, 장소마다 사진 1장을 남기는 여행 지도예요. 로그인하면 계정에 저장되고 SNS 공유 이미지도 만들 수 있어요.",
        "동네 정복은 서울·인천·경기 지도가 안개로 덮여 있고, 지하철역·버스정류장에서 체크인하거나 화면을 켜고 걸으면 그 주변이 밝혀지는 위치 기반 탐험 서비스예요. 동네별 탐험률과 뱃지를 모아 보세요.",
        "마이룸은 도트 감성 미니룸을 꾸미는 서비스예요. 벽지·바닥과 30가지 넘는 가구를 배치하고 내 캐릭터를 꾸며 방에 세울 수 있어요.",
      ],
    },
    en: {
      heading: "Services",
      eyebrow: "MY SERVICES",
      title: "Free Web Services - Football Forecasts · Passport Map Travel Map",
      description:
        "Free web services: Sports Forecast computes win/draw/loss probabilities for Europe's top football matches, and Passport Map lets you color the countries and cities you've visited.",
      keywords: ["football predictions", "match forecast", "travel map", "visited countries map", "world map coloring", "Passport Map"],
      subtitle: "Info services like football forecasts, plus personal services that save your records to your account.",
      about: [
        "Sports Forecast computes win, draw and loss probabilities, likely scores and title/relegation odds for the Premier League, La Liga, Bundesliga, Serie A, Ligue 1 and Champions League. Forecasts lock at kick-off and the track record is public.",
        "Passport Map lets you color the countries and cities you've visited and pin one photo to each place. Log in to keep it in your account and make a share image for social media.",
        "Town Conquest covers the Seoul metro area in fog; check in at subway stations and bus stops, or walk with the page open, to reveal it. Collect district exploration rates and badges.",
        "My Room lets you decorate a cozy pixel mini room with 30+ pieces of furniture and dress up your own character.",
      ],
    },
  },
};
