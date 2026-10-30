// 게임별 공략 팁과 자주 묻는 질문 — 게임 페이지 아래 소개 영역에 들어가는 직접 쓴 본문.
// (애드센스 '가치 있는 콘텐츠' 기준: 게임 화면만 있는 페이지가 되지 않도록, 플레이에 실제로 도움이 되는 글을 둔다)
import type { Lang } from "./i18n";

export interface Guide {
  tips: string[];
  faq: { q: string; a: string }[];
}

export const GUIDES: Record<string, Record<Lang, Guide>> = {
  catan: {
    ko: {
      tips: [
        "첫 정착지는 6·8처럼 자주 나오는 숫자 타일이 겹치는 교차점에 두세요. 주사위 두 개의 합은 7 다음으로 6과 8이 가장 자주 나옵니다.",
        "나무·흙은 초반 도로와 정착지에, 밀·광석은 중반 이후 도시와 발전카드에 필요해요. 시작 위치에서 두 그룹을 고르게 확보하면 교역에 덜 의존합니다.",
        "손패가 8장 이상이면 7이 나왔을 때 절반을 버려야 해요. 자원을 쌓아두지 말고 그 턴에 쓰거나 교역하세요.",
        "같은 자원이 많이 나오는 위치라면 그 자원의 2:1 항구 근처에 정착지를 지어 은행 교역 효율을 높이세요.",
      ],
      faq: [
        { q: "혼자서도 할 수 있나요?", a: "네. 로그인하지 않아도 AI 1~3명과 바로 플레이할 수 있어요." },
        { q: "친구와 하려면 어떻게 하나요?", a: "로그인 후 온라인 대전에서 방을 만들고 방 코드를 친구에게 보내면 됩니다. 2~4인까지 가능하고 빈 자리는 AI로 채울 수 있어요." },
        { q: "게임 도중 나가면 어떻게 되나요?", a: "나간 자리는 AI가 대신 이어서 하고, 다시 들어오면 그 자리로 돌아갈 수 있어요." },
      ],
    },
    en: {
      tips: [
        "Place your first settlements where 6 and 8 tiles meet — after 7, they are the most common sums of two dice.",
        "Lumber and brick fuel early roads and settlements; grain and ore matter later for cities and cards. Try to cover both groups at the start.",
        "With 8+ cards you lose half when a 7 is rolled, so spend or trade instead of hoarding.",
        "If one resource dominates your production, build near its 2:1 harbor to trade it efficiently.",
      ],
      faq: [
        { q: "Can I play alone?", a: "Yes — play against 1–3 AI opponents without signing in." },
        { q: "How do I play with friends?", a: "Sign in, create a room in Online play and share the room code. 2–4 players, with AI filling empty seats." },
        { q: "What if someone leaves mid-game?", a: "AI takes over their seat, and they can rejoin and take it back." },
      ],
    },
  },
  lexio: {
    ko: {
      tips: [
        "낮은 싱글 타일은 상대가 아무도 받을 수 없을 때 빨리 처리하세요. 마지막까지 남으면 점수를 크게 잃습니다.",
        "스트레이트·플러시 같은 5장 조합은 한 번에 손패를 많이 줄여요. 큰 조합을 깨서 낱장으로 내기 전에 한 번 더 생각해 보세요.",
        "모두 패스하면 마지막에 낸 사람이 새로 시작해요. 확실히 이길 수 있는 높은 조합은 아껴 두었다가 선을 잡는 데 쓰세요.",
      ],
      faq: [
        { q: "몇 명이 할 수 있나요?", a: "온라인 대전은 3~5인, 혼자라면 AI 3명과 연습할 수 있어요." },
        { q: "다른 사람 패가 보일 수 있나요?", a: "아니요. 규칙 판정을 서버가 해서 다른 사람의 손패는 절대 전송되지 않아요." },
        { q: "점수는 어떻게 계산하나요?", a: "누군가 손패를 다 털면 라운드가 끝나고, 남은 타일 수에 따라 점수를 주고받습니다." },
      ],
    },
    en: {
      tips: [
        "Shed low singles when nobody can beat them — leftovers cost a lot at round end.",
        "Five-tile combos (straights, flushes) empty your hand fast. Think twice before breaking them into singles.",
        "When everyone passes, the last player leads. Save a sure-winning high combo to grab the lead.",
      ],
      faq: [
        { q: "How many players?", a: "3–5 online, or practice solo against 3 AI." },
        { q: "Can others see my tiles?", a: "No. The server judges the rules, so other hands are never sent to your browser." },
        { q: "How is scoring done?", a: "When someone empties their hand the round ends and points move based on tiles left." },
      ],
    },
  },
  "dragon-call": {
    ko: {
      tips: [
        "그랜드 콜(±200)은 처음 8장에 용·봉황이나 폭탄이 있을 때만 노려보세요. 실패하면 팀 점수가 크게 깎입니다.",
        "파트너가 선을 잡고 있으면 굳이 더 높은 카드로 끊지 마세요. 개 카드로 파트너에게 선을 넘기는 것도 좋은 방법이에요.",
        "5·10·K가 들어 있는 트릭은 점수가 크니, 상대가 가져가려 할 때 폭탄으로 끊어내는 것을 고려하세요.",
        "한 팀이 1·2등으로 모두 나가면 원투 200점이에요. 파트너가 먼저 나가면 남은 사람은 빠르게 손패를 줄이세요.",
      ],
      faq: [
        { q: "몇 명이서 하나요?", a: "4명이 2:2 팀으로 겨룹니다. 혼자라면 AI 파트너와 함께 AI 2명과 대결할 수 있어요." },
        { q: "폭탄은 언제 낼 수 있나요?", a: "포카드·스트레이트 플러시 폭탄은 자기 차례가 아니어도 언제든 낼 수 있어요." },
        { q: "몇 점을 먼저 내면 이기나요?", a: "한 팀이 먼저 1,000점을 넘기면 승리합니다." },
      ],
    },
    en: {
      tips: [
        "Only go for a Grand Call (±200) with the Dragon, Phoenix or a bomb in your first 8 cards — failing costs a lot.",
        "Don't overtake your partner's lead; use the Dog to pass the lead to them.",
        "Tricks with 5s, 10s and Ks are valuable — consider bombing when opponents are about to take one.",
        "A one-two finish scores 200. If your partner goes out first, shed your hand quickly.",
      ],
      faq: [
        { q: "How many players?", a: "Four, in 2-vs-2 teams. Solo, you team with an AI partner against 2 AI." },
        { q: "When can I play a bomb?", a: "Four-of-a-kind and straight-flush bombs can be played at any time, even out of turn." },
        { q: "What's the winning score?", a: "The first team past 1,000 points wins." },
      ],
    },
  },
  holdem: {
    ko: {
      tips: [
        "처음 두 장이 강할 때(높은 페어, A-K 같은 높은 카드)만 적극적으로 들어가고, 약한 패는 일찍 버리는 게 토너먼트에서 오래 살아남는 기본이에요.",
        "콜할지 고민될 때는 팟 오즈를 보세요. 콜 금액 ÷ (팟 + 콜 금액)보다 내가 이길 확률이 높으면 장기적으로 이득입니다.",
        "블라인드가 오를수록 칩이 줄어드는 속도가 빨라져요. 칩이 빅 블라인드의 10배 이하로 줄면 기다리기보다 좋은 패에서 올인으로 승부를 거는 편이 낫습니다.",
        "딜러 버튼에 가까운 자리(늦게 행동하는 자리)일수록 상대 행동을 보고 결정할 수 있어 더 많은 패로 참여할 수 있어요.",
      ],
      faq: [
        { q: "실제 돈이 드나요?", a: "아니요. 게임 안의 칩만 쓰는 무료 게임이에요. 칩은 현금으로 바꾸거나 충전할 수 없습니다." },
        { q: "친구와 하려면 어떻게 하나요?", a: "로그인 후 온라인 대전에서 방을 만들고 방 코드를 친구에게 보내면 돼요. 2~6명까지 가능하고 빈 자리는 AI로 채울 수 있어요." },
        { q: "다른 사람이 내 카드를 볼 수 없나요?", a: "온라인에서는 내 카드를 내 브라우저만 풀 수 있는 키로 암호화해서 보내기 때문에 다른 참가자는 볼 수 없어요. 다만 카드를 나눠 주는 방장 브라우저는 기술적으로 모든 카드를 알고 있으니 믿을 수 있는 친구끼리 즐겨 주세요." },
        { q: "차례에 아무것도 안 하면 어떻게 되나요?", a: "온라인에서는 30초가 지나면 자동으로 체크(체크할 수 없으면 폴드)돼요. 접속이 끊긴 사람은 더 빨리 넘어갑니다." },
      ],
    },
    en: {
      tips: [
        "Play strong starting hands (big pairs, A-K and other high cards) aggressively and let weak ones go early — that's how you last in a tournament.",
        "When unsure about a call, check the pot odds: if your chance to win beats call ÷ (pot + call), the call pays off in the long run.",
        "Rising blinds eat your stack faster and faster. Once you're under about 10 big blinds, look for a good hand to go all-in rather than waiting.",
        "Seats closer to the button act later and see what others do first, so you can play more hands there.",
      ],
      faq: [
        { q: "Does it use real money?", a: "No. Chips are play money only — they can't be bought or cashed out." },
        { q: "How do I play with friends?", a: "Sign in, create a room in Online and send the room code. 2–6 players; empty seats can be filled with AI." },
        { q: "Can others see my cards?", a: "Online, your cards are encrypted with a key only your browser holds, so other players can't see them. The host's browser deals the cards, so it technically knows every card — play with people you trust." },
        { q: "What if I don't act?", a: "Online, after 30 seconds you automatically check (or fold if you can't check). Disconnected players are skipped faster." },
      ],
    },
  },
  "random-td": {
    ko: {
      tips: [
        "초반에는 골드를 아끼지 말고 타워를 여러 번 뽑아 같은 타워를 합치는 데 집중하세요. 등급이 오를수록 공격력이 크게 뛰어요.",
        "불·번개·물·독 속성을 섞어 두면 한 종류에 강한 몬스터가 나와도 버틸 수 있어요.",
        "보스 라운드 직전에는 합치기를 미리 끝내 가장 높은 등급 타워를 갖춰 두세요.",
        "배속을 높이면 빨리 진행되지만, 위험할 때는 1배속으로 바꿔 상황을 보며 합치세요.",
      ],
      faq: [
        { q: "방치형인가요?", a: "네. 라운드가 60초마다 자동으로 넘어가서 틀어두기만 해도 진행돼요." },
        { q: "랭킹은 어떻게 매겨지나요?", a: "도달한 라운드가 높을수록, 같은 라운드면 걸린 시간이 짧을수록 높은 순위예요." },
        { q: "저장한 게임을 불러오면 랭킹에 올라가나요?", a: "불러온 게임은 공정성을 위해 랭킹에 기록되지 않아요." },
      ],
    },
    en: {
      tips: [
        "Spend gold early — roll often and merge duplicates. Each tier jumps damage a lot.",
        "Mix fire, lightning, water and poison so resistant monsters don't break your defense.",
        "Finish merges before boss rounds so your best towers are ready.",
        "Higher speed is faster, but drop to 1x when things get tight.",
      ],
      faq: [
        { q: "Is it idle?", a: "Yes — rounds advance every 60 seconds on their own." },
        { q: "How is the leaderboard ranked?", a: "By round reached; ties go to the faster time." },
        { q: "Do loaded saves count?", a: "No, loaded games are not ranked, to keep it fair." },
      ],
    },
  },
  "element-td": {
    ko: {
      tips: [
        "불은 단일 대상 피해, 얼음은 감속, 자연은 지속 피해에 강해요. 경로가 꺾이는 곳에 얼음 타워를 두면 다른 타워가 때릴 시간이 늘어납니다.",
        "새 타워를 늘리기보다 핵심 타워를 업그레이드하는 편이 대부분 효율적이에요.",
        "10라운드마다 보스가 나와요. 보스 직전 라운드에는 업그레이드할 골드를 남겨 두세요.",
        "타워는 3×3 칸 블록의 36자리에만 지을 수 있어요. 몬스터가 네 모서리 블록을 한 바퀴씩 돌기 때문에, 가운데 줄 블록의 자리는 여러 구간을 동시에 공격할 수 있어 특히 좋아요.",
      ],
      faq: [
        { q: "몇 라운드까지 있나요?", a: "50라운드를 모두 막으면 클리어입니다." },
        { q: "아이템은 어디서 얻나요?", a: "몬스터가 떨어뜨리는 아이템을 타워에 장착해 능력을 올릴 수 있어요." },
        { q: "랭킹 기준은?", a: "도달 라운드가 높을수록, 같으면 클리어 시간이 짧을수록 높아요." },
      ],
    },
    en: {
      tips: [
        "Fire hits single targets hard, ice slows, nature deals damage over time. Ice at path corners buys time for others.",
        "Upgrading core towers usually beats building many new ones.",
        "A boss appears every 10 rounds — keep gold for upgrades right before.",
        "Towers go on the 36 spots inside the 3×3 blocks. Monsters circle each corner block, so spots in the middle blocks can hit several stretches of the path.",
      ],
      faq: [
        { q: "How many rounds?", a: "Survive all 50 rounds to clear." },
        { q: "Where do items come from?", a: "Monsters drop items you can equip on towers." },
        { q: "How is ranking decided?", a: "Higher round first, then faster clear time." },
      ],
    },
  },
  archer: {
    ko: {
      tips: [
        "멈춰 서 있지 말고 몬스터 무리를 크게 원을 그리며 돌아 한쪽으로 모으세요. 자동 공격이 모인 적을 더 많이 맞힙니다.",
        "초반에는 멀티샷·관통처럼 화살 수와 범위를 늘리는 스킬이 생존에 가장 도움이 돼요.",
        "3분마다 보스가 나와요. 보스 직전에는 경험치를 모아 레벨업 스킬을 하나 더 확보해 두세요.",
        "운석 낙하·블랙홀 같은 광역 스킬은 몬스터가 많아지는 후반에 효과가 커요.",
      ],
      faq: [
        { q: "공격은 어떻게 하나요?", a: "공격은 자동이에요. 이동만 하면서 몬스터를 피하고 경험치를 모으면 됩니다." },
        { q: "모바일에서도 되나요?", a: "네. 화면을 끌어서 이동할 수 있어요." },
        { q: "랭킹 기준은 무엇인가요?", a: "살아남은 시간(10초 이상)이 랭킹에 기록돼요." },
      ],
    },
    en: {
      tips: [
        "Keep moving in wide circles to bunch enemies together — auto-attacks hit more of them.",
        "Early on, Multishot and Pierce help survival the most.",
        "A boss arrives every 3 minutes — bank XP for one more skill before it.",
        "Area skills like Meteor and Black Hole shine late when hordes grow.",
      ],
      faq: [
        { q: "How do I attack?", a: "Attacks are automatic — just move, dodge and collect XP." },
        { q: "Does it work on mobile?", a: "Yes, drag on the screen to move." },
        { q: "What does the leaderboard track?", a: "Survival time (10 seconds or more)." },
      ],
    },
  },
  raiden: {
    ko: {
      tips: [
        "같은 색 파워업을 계속 먹으면 그 무기가 강해져요. 색을 자주 바꾸면 화력이 잘 오르지 않습니다.",
        "탄이 화면을 덮기 직전에 폭탄(X)을 쓰면 적 탄을 지우고 위기를 넘길 수 있어요. 아끼다 격추되는 것보다 낫습니다.",
        "보스전에서는 화면 아래쪽에서 좌우로 짧게 움직이며 탄 사이 틈을 노리세요.",
      ],
      faq: [
        { q: "조작법은?", a: "방향키·WASD 또는 화면 드래그로 이동하고, X키로 폭탄을 씁니다." },
        { q: "기체마다 차이가 있나요?", a: "6종의 기체가 있고 각각 무기 성격이 달라요. 마음에 드는 기체로 출격하세요." },
        { q: "점수는 어떻게 올리나요?", a: "적을 격추하고 스테이지 보스를 이기면 보너스 점수를 받아요." },
      ],
    },
    en: {
      tips: [
        "Keep collecting the same-color power-up to level that weapon; switching colors slows your growth.",
        "Bomb (X) just before bullets cover the screen — it clears them. Better than dying with bombs in stock.",
        "In boss fights stay low and make short left-right moves through gaps.",
      ],
      faq: [
        { q: "Controls?", a: "Arrows/WASD or drag to move, X to bomb." },
        { q: "Do ships differ?", a: "There are 6 ships with different weapons — pick your favorite." },
        { q: "How do I score more?", a: "Destroy enemies and beat stage bosses for bonuses." },
      ],
    },
  },
  lotto: {
    ko: {
      tips: [
        "로또 6/45의 1등 확률은 약 814만분의 1이에요. 어떤 번호 조합이든 확률은 같으니 재미로 즐기세요.",
        "생일 날짜(1~31)만 고르는 사람이 많아서, 32 이상 번호를 섞으면 당첨되더라도 당첨금을 나눌 사람이 적어질 수 있어요.",
        "포함 번호는 모든 게임에 들어가고 제외 번호는 절대 나오지 않아요. 고정 번호가 있다면 포함으로 지정하세요.",
      ],
      faq: [
        { q: "추첨 결과가 실제 로또와 관련 있나요?", a: "아니요. 매번 무작위로 뽑는 번호 생성기이며 실제 당첨 번호를 예측하지 않아요." },
        { q: "한 번에 몇 게임까지 뽑을 수 있나요?", a: "1게임부터 5게임까지 고를 수 있어요." },
        { q: "번호를 저장할 수 있나요?", a: "뽑은 번호는 복사 버튼으로 바로 복사해 메모나 메신저에 붙여 넣을 수 있어요." },
      ],
    },
    en: {
      tips: [
        "The odds of a 6/45 jackpot are about 1 in 8.1 million — every combination is equally likely, so play for fun.",
        "Many people pick birthdays (1–31); mixing in 32+ may mean fewer people to share a prize with.",
        "Included numbers appear in every set and excluded ones never do — pin your fixed numbers as included.",
      ],
      faq: [
        { q: "Does it predict real draws?", a: "No — it's a random number generator, not a prediction." },
        { q: "How many sets at once?", a: "From 1 to 5." },
        { q: "Can I save numbers?", a: "Use the copy button to paste them anywhere." },
      ],
    },
  },
  pinball: {
    ko: {
      tips: [
        "공 개수로 확률을 조절할 수 있어요. 예를 들어 a10, b5면 a가 b보다 두 배 많은 공으로 참가합니다.",
        "맵마다 장애물 배치가 달라서 결과가 바뀌어요. 같은 참가자라도 맵을 바꿔 여러 번 해 보세요.",
        "벌칙 정하기라면 '마지막 도착'을, 경품 추첨이라면 '첫 도착'을 당첨 조건으로 쓰면 자연스러워요.",
      ],
      faq: [
        { q: "몇 명까지 넣을 수 있나요?", a: "이름과 공 개수를 쉼표로 이어서 여러 명을 넣을 수 있고, 전체 공은 최대 160개예요." },
        { q: "결과가 조작되나요?", a: "아니요. 공이 물리 엔진으로 굴러가며 도착 순서가 그대로 결과가 됩니다." },
        { q: "도중에 맵을 바꾸면?", a: "진행 중이던 추첨은 초기화되고 새 맵으로 다시 준비돼요." },
      ],
    },
    en: {
      tips: [
        "Ball counts set the odds — with a10, b5, 'a' has twice as many balls as 'b'.",
        "Each map has different obstacles, so try a few maps.",
        "Use 'last to arrive' for penalties and 'first to arrive' for prizes.",
      ],
      faq: [
        { q: "How many entries?", a: "Add names with ball counts separated by commas; up to 160 balls in total." },
        { q: "Is it rigged?", a: "No — balls roll with a physics engine and arrival order is the result." },
        { q: "What if I switch maps mid-draw?", a: "The draw resets and the new map is ready." },
      ],
    },
  },
  tarot: {
    ko: {
      tips: [
        "카드를 고르기 전에 고민을 한 문장으로 떠올려 보세요. '그 사람과 잘 될까?'처럼 구체적일수록 해석이 와닿아요.",
        "역방향 카드는 나쁜 카드가 아니라 그 기운이 막혀 있거나 지나친 상태예요. 조심할 부분을 알려 주는 신호로 읽어 보세요.",
        "세 장 뽑기에서는 과거→현재→미래로 이어지는 흐름을 함께 보세요. 종합 메시지가 세 장을 하나로 묶어 줘요.",
        "같은 고민을 연달아 다시 뽑기보다는 처음 나온 카드의 조언을 며칠 동안 기억해 보는 걸 추천해요.",
      ],
      faq: [
        { q: "정말 무료인가요?", a: "네. 회원가입이나 결제 없이 몇 번이든 볼 수 있어요." },
        { q: "카드는 어떻게 정해지나요?", a: "카드를 섞을 때 22장의 순서와 정·역방향이 무작위로 정해지고, 내가 고른 자리의 카드가 결과가 돼요." },
        { q: "친구에게 결과를 보낼 수 있나요?", a: "결과 화면의 [결과 공유하기]에서 카카오톡, 링크 복사, 스토리용 이미지 저장을 할 수 있어요. 링크를 받은 친구는 내 결과를 보고 바로 자기 카드를 뽑아 볼 수 있어요." },
        { q: "해석을 믿어도 되나요?", a: "타로는 재미와 생각 정리를 위한 참고용이에요. 중요한 결정은 스스로 판단하세요." },
      ],
    },
    en: {
      tips: [
        "Put your question into one sentence before drawing — the more specific, the more the reading will resonate.",
        "Reversed cards aren't bad cards; they show energy that's blocked or overdone. Read them as gentle warnings.",
        "In three-card readings, follow the flow from past to present to future — the overall message ties them together.",
        "Rather than redrawing the same question, try keeping the first card's advice in mind for a few days.",
      ],
      faq: [
        { q: "Is it free?", a: "Yes — no sign-up or payment, as many times as you like." },
        { q: "How are the cards chosen?", a: "When the deck is shuffled, the order and upright/reversed state of all 22 cards are randomized, and the card in the spot you pick is your result." },
        { q: "Can I send my result to friends?", a: "Use Share on the result screen to send it via KakaoTalk, copy a link or save a story image. Friends can open it and draw their own cards." },
        { q: "Should I trust the reading?", a: "Tarot is for fun and reflection. Make important decisions with your own judgment." },
      ],
    },
  },
  "passport-map": {
    ko: {
      tips: [
        "나라마다 다른 색을 쓰면 여행 시기나 동행을 구분할 수 있어요. 예를 들어 가족 여행은 파랑, 출장은 회색처럼 정해 보세요.",
        "도시에 사진 1장과 한 줄 메모를 남기면, 나중에 지도에 마우스를 올렸을 때 그때 기억이 바로 떠올라요.",
        "공유 이미지는 정사각·세로·가로 비율을 고를 수 있어요. 인스타그램 피드는 정사각, 스토리는 세로가 잘 맞아요.",
      ],
      faq: [
        { q: "로그인해야 하나요?", a: "카카오톡이나 이메일로 로그인하면 지도가 계정에 저장되어 어느 기기에서든 이어서 볼 수 있어요." },
        { q: "친구에게 지도를 보여줄 수 있나요?", a: "내 지도 링크를 만들면 링크를 받은 사람이 볼 수 있고, 언제든 공개를 중지할 수 있어요." },
        { q: "사진은 어디에 저장되나요?", a: "내 계정 전용 저장소에 저장되며, 공유 링크를 만들 때만 공개용 사본이 생겨요." },
      ],
    },
    en: {
      tips: [
        "Use different colors per country to mark trip types — e.g., blue for family trips, gray for business.",
        "Add a photo and a one-line note per city to bring back the memory on hover.",
        "Share images come in square, portrait and landscape — square suits feeds, portrait suits stories.",
      ],
      faq: [
        { q: "Do I need to sign in?", a: "Sign in with Kakao or email to keep your map in your account across devices." },
        { q: "Can friends see my map?", a: "Create a map link to share it, and stop sharing anytime." },
        { q: "Where are photos stored?", a: "In private storage for your account; a public copy is made only when you share a link." },
      ],
    },
  },
  "potion-atelier": {
    ko: {
      tips: [
        "주문한 색이 섞은 색(보라·주황·초록)이면, 재료 두 색을 먼저 각자 모아 두고 마지막에 한 번에 부으면 이동을 아낄 수 있어요.",
        "섞은 색 위에 또 다른 색을 부으면 탁한 물이 돼요. 실수했다면 되돌리기를 먼저 써 보세요.",
        "빈 병은 아껴 두세요. 빈 병이 하나 남아 있으면 거의 언제든 정리할 수 있어요.",
        "오늘의 포션은 모두 같은 판이에요. 되돌리기는 이동 수에 들어가지 않으니 여러 번 시도해 최단 수에 도전해 보세요.",
      ],
      faq: [
        { q: "게임이 끝나나요?", a: "아니요. 손님을 계속 받으며 공방을 키우는 게임이에요. 모든 판은 반드시 풀 수 있게 만들어져요." },
        { q: "랭킹은 어떻게 정해지나요?", a: "오늘의 포션은 적은 이동 수(같으면 빠른 시간), 공방 평판은 쌓인 ⭐ 순이에요. 로그인하면 자동으로 올라가요." },
        { q: "진행이 저장되나요?", a: "이 기기에 자동 저장되고, 로그인하면 계정에도 저장돼 다른 기기에서 이어서 할 수 있어요." },
      ],
    },
    en: {
      tips: [
        "For mixed orders (purple, orange, green), gather each base color first and pour them together at the end to save moves.",
        "Pouring another color onto a mixed color makes muddy water — undo right away if that happens.",
        "Keep an empty bottle free; with one spare you can almost always sort things out.",
        "Undo doesn't count as a move in the Daily Potion, so retry freely to hit the shortest solution.",
      ],
      faq: [
        { q: "Does the game end?", a: "No — keep serving customers and growing your shop. Every puzzle is guaranteed solvable." },
        { q: "How are rankings decided?", a: "Daily Potion ranks by fewest moves (then time); Shop fame by total stars. Sign in to be ranked." },
      ],
    },
  },
  "my-room": {
    ko: {
      tips: [
        "컴퓨터·노트북·스탠드·화분 같은 작은 소품은 책상이나 탁자 위로 끌어다 놓으면 그 위에 올라가요.",
        "벽걸이(창문·액자·시계·선반)는 왼쪽 벽과 오른쪽 벽 어디에나 걸 수 있어요. ↔ 버튼을 누르면 반대쪽 벽으로 옮겨져요.",
        "가구가 겹쳐서 뒤에 가려지면 ⬆ 앞으로 버튼으로 살짝 앞으로 당겨 보세요.",
        "같은 가구도 🎨 버튼으로 색을 바꿀 수 있어요. 방 분위기에 맞춰 색을 맞춰 보세요.",
      ],
      faq: [
        { q: "꾸민 방이 저장되나요?", a: "이 브라우저에 자동 저장되고, 로그인하면 계정에도 저장돼 다른 기기에서도 이어서 꾸밀 수 있어요." },
        { q: "사진첩·방명록도 있나요?", a: "지금은 미니룸과 캐릭터 꾸미기부터 열었고, 사진첩·게시글·방명록은 차례로 추가할 예정이에요." },
        { q: "돈이 드나요?", a: "아니요. 모든 가구와 꾸미기 아이템은 무료예요." },
      ],
    },
    en: {
      tips: [
        "Drag small items like computers, lamps and plants onto a desk or table to set them on top.",
        "Wall items can hang on either wall — Turn moves them to the other side.",
        "If something hides behind another piece, use Front to pull it forward.",
      ],
      faq: [
        { q: "Is my room saved?", a: "It saves in this browser automatically, and to your account when you sign in." },
        { q: "Are photo albums and a guestbook coming?", a: "Yes — the mini room and character come first, the rest will follow." },
      ],
    },
  },
  cathedral: {
    ko: {
      tips: [
        "의자 근처로 가면 🪑 앉기 버튼이 밝아져요. 컴퓨터에서는 E 키나 스페이스로도 앉고 일어날 수 있어요.",
        "앉은 채로 25초 동안 가만히 있으면 시선이 저절로 천천히 성당을 둘러봐요.",
        "☀️ 햇빛 방향을 바꾸면 빛이 들어오는 창과 바닥의 빛 얼룩이 달라져요.",
        "봉헌 촛대는 장의자 맨 앞 오른쪽에 있어요. 걸어가서 가까이 보면 촛불이 하나씩 밝아지는 게 보여요.",
      ],
      faq: [
        { q: "오르간 소리가 안 나요.", a: "브라우저 정책상 화면을 한 번 누르거나 키를 눌러야 소리가 시작돼요. 그래도 안 나면 🎹 오르간 버튼이 켜져 있는지, 기기 소리가 꺼져 있지 않은지 확인해 주세요." },
        { q: "파이프오르간 음악은 어떤 곡인가요?", a: "저작권 걱정이 없도록 브라우저 안에서 직접 합성하는 자작 화음 진행이에요. 녹음된 음원이 아니라서 데이터도 거의 쓰지 않아요." },
        { q: "특정 종교만을 위한 곳인가요?", a: "누구나 쉬어 가는 공간이에요. 기도하셔도 좋고, 그냥 빛과 소리를 즐기며 멍하니 쉬어 가셔도 좋아요." },
        { q: "회원가입이 필요한가요?", a: "아니요. 접속하면 바로 들어가고, 내가 고른 캐릭터와 햇빛 방향은 이 기기에 기억돼요." },
      ],
    },
    en: {
      tips: [
        "Near a pew the 🪑 button lights up — or press E / Space.",
        "Stay still for 25 seconds while seated and your gaze drifts around the cathedral.",
        "Change ☀️ sunlight to see different windows and light pools.",
      ],
      faq: [
        { q: "I can't hear the organ.", a: "Browsers need one tap or key press before sound can start. Also check the 🎹 button and your device volume." },
        { q: "What is the organ music?", a: "A slow chord progression synthesized live in your browser — original and copyright-free." },
        { q: "Do I need an account?", a: "No. Your character and sunlight choice are remembered on this device." },
      ],
    },
  },
  "dongne-note": {
    ko: {
      tips: [
        "장소 이름으로 검색해서 남기면 쪽지에 장소 이름이 함께 붙어요. 지도에서 직접 고르면 동네 이름만 표시돼요.",
        "다른 사람이 좋아요를 누르면 6시간, 댓글을 달면 12시간 더 남아요. 반응이 많은 쪽지는 보라색 빛기둥이 올라와요.",
        "📅 버튼으로 오늘 · 3일 · 전체 쪽지를 골라 볼 수 있어요.",
        "만료가 가까운 쪽지일수록 아이콘이 흐려져요. 사라지기 전에 좋아요로 살려 주세요!",
      ],
      faq: [
        { q: "내 위치가 다른 사람에게 보이나요?", a: "아니요. 동네쪽지는 GPS를 쓰지 않아요. 쪽지는 내가 검색하거나 지도에서 고른 장소에만 남고, 지도에서 직접 고른 곳은 약 100m 단위로 표시돼요." },
        { q: "쪽지는 언제 사라지나요?", a: "기본 7일이에요. 다른 사람의 좋아요 1개마다 6시간, 댓글 단 사람 1명마다 12시간 늘어나고 최대 30일까지 남아요." },
        { q: "쪽지를 남기려면 로그인해야 하나요?", a: "구경은 로그인 없이 돼요. 쪽지·좋아요·댓글은 카카오나 이메일로 로그인한 뒤 할 수 있어요." },
        { q: "이상한 쪽지를 봤어요.", a: "쪽지의 ⋯ 메뉴에서 신고해 주세요. 여러 명이 신고하면 바로 숨겨지고 운영자가 확인해요." },
      ],
    },
    en: {
      tips: [
        "Search a place by name and its name is attached to your note; picking on the map shows only the area name.",
        "Each like adds 6 hours and each commenter 12 hours. Popular notes glow with a purple beam.",
        "Use 📅 to show today's, 3-day or all notes.",
      ],
      faq: [
        { q: "Is my location shown?", a: "No. GPS is never used — notes only go where you put them, and spots picked on the map are rounded to about 100m." },
        { q: "When do notes disappear?", a: "After 7 days, extended by likes (+6h) and comments (+12h), up to 30 days." },
        { q: "Do I need an account?", a: "Browsing is free. Writing, likes and comments need a Kakao or email login." },
      ],
    },
  },
  "explore-map": {
    ko: {
      tips: [
        "환승역은 반경 1.5km가 한 번에 열려요. 그날 첫 체크인은 1.5배라서, 하루의 첫 체크인을 환승역에서 하면 가장 넓게 밝힐 수 있어요.",
        "지하에서는 GPS가 잘 안 잡혀요. 역 출구로 나와서 체크인하면 훨씬 정확해요.",
        "버스로 이동할 때는 내린 정류장에서 체크인하세요. 정류장은 하나하나가 작은 대신 개수가 많아서 길을 따라 띠처럼 이어져요.",
        "외곽 정류장(주변 600m 안에 정류장이 3개 이하)은 반경 800m가 열려서 탐험률 올리기에 좋아요.",
        "화면을 켜 두고 걸으면 지나간 길 주변 약 100m가 계속 밝혀져요. 차나 지하철처럼 빠르게 이동할 때는 밝혀지지 않아요.",
      ],
      faq: [
        { q: "집에서도 체크인할 수 있나요?", a: "아니요. 실제로 지하철역 300m, 버스정류장 150m 안에 있어야 체크인 버튼이 켜져요." },
        { q: "앱을 닫아도 기록되나요?", a: "웹 게임이라 페이지가 열려 있을 때만 위치를 사용해요. 정확한 좌표나 시간별 경로는 저장하지 않고, 체크인한 정류장과 밝힌 칸(약 100m 단위)만 저장합니다." },
        { q: "어느 지역에서 할 수 있나요?", a: "1단계로 서울·인천·경기에서 할 수 있고, 광역시와 전국으로 넓혀 갈 예정이에요." },
        { q: "뱃지는 어떻게 모으나요?", a: "체크인 횟수(10·50·100·300·500·1,000회), 지하철역·환승역·버스정류장 수, 방문한 시·군·구, 밝힌 칸 수로 뱃지를 받아요. 같은 정류장은 하루 한 번씩 체크인 횟수에 들어가요." },
        { q: "정류장이 안 보이거나 위치가 틀려요.", a: "정류장 정보는 OpenStreetMap 데이터를 사용해요. 빠진 곳이 있으면 문의하기로 알려 주세요." },
      ],
    },
    en: {
      tips: [
        "Transfer stations reveal 1.5km, and the day's first check-in counts 1.5× — start your day at one.",
        "GPS is weak underground; check in after leaving the station exit.",
        "Outskirts bus stops reveal 800m; walking with the page open also reveals about 100m around your path.",
      ],
      faq: [
        { q: "Can I check in from home?", a: "No. You must be within 300m of a station or 150m of a bus stop." },
        { q: "Does it record with the page closed?", a: "No, location is only used while the page is open. Only checked-in stops and revealed cells (about 100m) are saved — never exact coordinates or timestamps of your route." },
        { q: "Where can I play?", a: "Stage 1 covers Seoul, Incheon and Gyeonggi; more regions will follow." },
      ],
    },
  },
  weapon: {
    ko: {
      tips: [
        "레벨이 오를수록 성공 확률은 낮아지고 파괴 확률은 높아져요. 강화 확률 표를 보고 위험 구간에서는 한 번 더 생각하세요.",
        "무기마다 확률이 달라요. 활은 공격력이 낮은 대신 파괴율이 낮아 높은 레벨을 노리기에 안정적입니다.",
        "실패는 레벨이 유지되고, 파괴되면 Lv.1로 돌아가요. 자동 강화는 파괴되면 멈추니 틀어두고 결과를 확인하세요.",
        "Lv.50 이상에서 파괴되면 기록 카드가 떠요. 친구에게 도전장을 보내 누가 더 높이 강화하는지 겨뤄 보세요.",
      ],
      faq: [
        { q: "최대 레벨은?", a: "Lv.100이 최고 단계예요." },
        { q: "단축키가 있나요?", a: "Space 키로 강화할 수 있어요." },
        { q: "랭킹에는 무엇이 기록되나요?", a: "로그인하면 지금까지 도달한 최고 강화 레벨이 기록돼요." },
      ],
    },
    en: {
      tips: [
        "Success odds drop and break odds rise as you level — check the odds before risky tiers.",
        "Each weapon has different odds. The bow has low attack but a low break rate, making high levels steadier.",
        "Failing keeps your level; breaking resets to Lv.1. Auto-enhance stops when the weapon breaks.",
        "Breaking at Lv.50+ shows a record card — challenge a friend to beat it.",
      ],
      faq: [
        { q: "Max level?", a: "Lv.100." },
        { q: "Shortcut?", a: "Press Space to enhance." },
        { q: "What's ranked?", a: "Your best enhancement level when signed in." },
      ],
    },
  },
  oripa: {
    ko: {
      tips: [
        "봉투는 한 장에 20,000원이고 시작 자금은 500,000원이에요. 자금이 20,000원 아래로 떨어지면 파산이니 되팔기로 자금을 관리하세요.",
        "되팔기 회수율은 EASY 80%, NORMAL 65%, HARD 50%로 난이도가 오를수록 낮아져요. 높은 난이도에서는 카드를 아껴 파는 판단이 중요합니다.",
        "1등(S) 카드를 뽑으면 다음 난이도로 올라가요. 남은 봉투 수가 줄수록 1등이 남아 있을 확률이 올라갑니다.",
        "도감은 파산해도 유지돼요. 포켓몬·원피스 카드를 모두 모아 보세요.",
      ],
      faq: [
        { q: "오리파가 뭔가요?", a: "정해진 장수의 봉투 안에 등급별 카드가 들어 있고, 봉투를 골라 카드를 뽑는 일본식 카드 뽑기예요. 실제 돈은 들지 않는 시뮬레이터입니다." },
        { q: "카드 시세는 실제 가격인가요?", a: "등급은 실제 PSA10 시세를 참고해 나눴지만, 게임 속 금액은 게임 밸런스용 가치예요." },
        { q: "랭킹 기준은?", a: "로그인하면 도달한 최고 자금이 기록돼요." },
      ],
    },
    en: {
      tips: [
        "Envelopes cost ₩20,000 and you start with ₩500,000. Fall below ₩20,000 and you go bankrupt — manage cash by selling back.",
        "Sell-back rates drop by difficulty: EASY 80%, NORMAL 65%, HARD 50%.",
        "Pulling the #1 (S) card moves you up a difficulty. Fewer envelopes left means better odds the S card remains.",
        "Your collection survives bankruptcy — try to complete Pokémon and One Piece.",
      ],
      faq: [
        { q: "What is oripa?", a: "A Japanese-style card draw where envelopes hold graded cards. This simulator uses no real money." },
        { q: "Are prices real?", a: "Tiers reference real PSA10 prices, but in-game values are for balance." },
        { q: "What's ranked?", a: "Your peak funds when signed in." },
      ],
    },
  },
  roulette: {
    ko: {
      tips: [
        "모든 베팅의 기대값은 같아요. 싱글 제로 룰렛은 어떤 칸에 걸어도 하우스 엣지가 2.7%(37분의 1)입니다. 고르는 건 '얼마나 자주, 얼마나 크게 이길지'의 차이예요.",
        "레드/블랙·홀짝처럼 1:1 베팅은 이길 확률이 48.6%로 잔액이 천천히 움직이고, 스트레이트(35:1)는 2.7% 확률로 한 번에 크게 움직입니다.",
        "최고 잔액이 랭킹 기록이라, 크게 불렸다면 그 순간 기록이 남아요. 다 잃어도 100만 원으로 다시 시작할 수 있습니다.",
        "숫자 사이 선을 누르면 스플릿(17:1), 네 칸이 만나는 점은 코너(8:1), 숫자판 가장자리는 스트리트(11:1)·식스 라인(5:1)이에요.",
      ],
      faq: [
        { q: "실제 돈이 드나요?", a: "아니요. 게임 안의 가상 금액만 쓰는 무료 게임이에요. 현금으로 바꾸거나 충전할 수 없습니다." },
        { q: "0이 나오면 어떻게 되나요?", a: "0을 포함한 베팅(0 스트레이트·0 스플릿·트리오·퍼스트 포)만 이기고 나머지는 모두 집니다. 레드/블랙 같은 바깥 베팅도 집니다." },
        { q: "랭킹은 어떻게 등록되나요?", a: "로그인한 상태에서 잔액이 100만 원 이상이면 스핀할 때마다 최고 잔액이 자동으로 기록돼요." },
        { q: "결과는 조작되지 않나요?", a: "브라우저의 암호학적 난수로 37칸 중 하나를 같은 확률로 뽑습니다. 이전 결과는 다음 결과에 영향을 주지 않아요." },
      ],
    },
    en: {
      tips: [
        "Every bet has the same expected value. In single-zero roulette the house edge is 2.7% (1 in 37) wherever you bet — you only choose how often and how big you win.",
        "Even-money bets like red/black win 48.6% of the time and move your balance slowly; a straight-up bet (35:1) hits 2.7% of the time and moves it a lot.",
        "The leaderboard keeps your peak balance, so a big run is recorded the moment it happens. Lose everything and you can start again with ₩1,000,000.",
        "Tap a line between numbers for a split (17:1), an intersection for a corner (8:1), and the outer edge of the grid for streets (11:1) and six lines (5:1).",
      ],
      faq: [
        { q: "Does it use real money?", a: "No. It's a free game with play money only — nothing can be bought or cashed out." },
        { q: "What happens when 0 hits?", a: "Only bets covering 0 win (0 straight, 0 splits, trios, first four). Everything else loses, including red/black." },
        { q: "How does the leaderboard work?", a: "When signed in, your peak balance is recorded on every spin while your balance is ₩1,000,000 or more." },
        { q: "Is it fair?", a: "Each spin draws one of 37 pockets with equal probability using the browser's cryptographic random generator. Past spins don't affect the next one." },
      ],
    },
  },
  baccarat: {
    ko: {
      tips: [
        "기대값만 보면 뱅커가 가장 유리해요. 하우스 엣지는 뱅커 1.06%, 플레이어 1.24%, 타이 14.4%, 페어 10.4%입니다.",
        "뱅커가 이기는 확률(45.9%)이 플레이어(44.6%)보다 높아서 뱅커 승에는 5% 커미션을 뗍니다. 타이(9.5%)가 나오면 플레이어·뱅커 베팅은 돌려받아요.",
        "출목표는 지난 결과의 기록입니다. 흐름을 보는 재미는 있지만 카드는 매번 남은 슈에서 새로 뽑히므로 다음 결과를 정해 주지는 않아요.",
        "빅로드에서 같은 쪽이 아래로 길게 이어지면 '줄', 한 칸씩 번갈아 나오면 '퐁당'이라고 불러요. 중국점은 이런 모양이 반복되는지(빨강) 깨지는지(파랑)를 보여 줍니다.",
      ],
      faq: [
        { q: "실제 돈이 드나요?", a: "아니요. 게임 안의 가상 금액만 쓰는 무료 게임이에요. 현금으로 바꾸거나 충전할 수 없습니다." },
        { q: "세 번째 카드는 왜 받거나 안 받나요?", a: "바카라는 세 번째 카드 규칙이 정해져 있어 자동으로 진행돼요. 규칙 버튼에서 표를 확인할 수 있습니다." },
        { q: "출목표는 언제 초기화되나요?", a: "8덱 슈에서 남은 카드가 52장 이하가 되면 새 슈로 바뀌고 출목표도 새로 시작해요." },
        { q: "B?·P? 표시는 무엇인가요?", a: "다음 판에 뱅커나 플레이어가 이기면 빅아이보이·스몰로드·바퀴벌레에 어떤 표시가 찍힐지 미리 보여 주는 칸이에요." },
      ],
    },
    en: {
      tips: [
        "By expected value Banker is the best bet: the house edge is 1.06% on Banker, 1.24% on Player, 14.4% on Tie and 10.4% on Pairs.",
        "Banker wins more often (45.9% vs 44.6%), which is why Banker wins pay a 5% commission. On a tie (9.5%) Player and Banker bets are returned.",
        "The roads are a record of the past. They're fun to follow, but every card is drawn from what's left in the shoe, so they don't decide the next hand.",
        "A long column on the big road is a streak; single cells alternating is a 'ping-pong'. The derived roads show whether such shapes keep repeating (red) or break (blue).",
      ],
      faq: [
        { q: "Does it use real money?", a: "No. It's a free game with play money only — nothing can be bought or cashed out." },
        { q: "Why does a side draw a third card?", a: "Baccarat has a fixed third-card tableau, so draws happen automatically. The Rules button lists it." },
        { q: "When do the roads reset?", a: "When 52 or fewer cards are left in the 8-deck shoe, a new shoe comes in and the roads start over." },
        { q: "What are B? and P?", a: "They preview the mark each derived road would get if Banker or Player wins the next hand." },
      ],
    },
  },
  blackjack: {
    ko: {
      tips: [
        "기본 전략대로만 해도 하우스 엣지가 약 0.4%까지 내려가요. 💡 힌트를 켜면 지금 상황에서 기본 전략이 추천하는 버튼이 빛나요.",
        "딜러 업카드가 2~6이면 딜러가 버스트할 확률이 높아요. 이때는 12~16에서도 멈추고(딜러 2·3 상대 12는 히트), 더블 기회를 노리세요.",
        "A·A와 8·8은 항상 스플릿, 10·10과 5·5는 스플릿하지 않는 게 기본이에요. 5·5는 합 10으로 보고 더블을 노리세요.",
        "보험은 딜러가 블랙잭일 확률(약 31%)보다 배당이 불리해서 기본 전략에서는 받지 않아요.",
      ],
      faq: [
        { q: "실제 돈이 드나요?", a: "아니요. 게임 안의 가상 금액만 쓰는 무료 게임이에요. 현금으로 바꾸거나 충전할 수 없습니다." },
        { q: "딜러는 언제 카드를 더 받나요?", a: "16 이하면 반드시 받고, 소프트 17(A가 11로 세어진 17)을 포함해 17 이상이면 멈춰요." },
        { q: "게임 도중에 새로고침하면요?", a: "진행 중인 핸드가 그대로 저장돼 있어서 같은 카드로 이어서 할 수 있어요. 결과도 카드가 펼쳐지기 전에 정해지므로 새로고침으로 바뀌지 않아요." },
        { q: "랭킹은 어떻게 등록되나요?", a: "로그인한 상태에서 잔액이 100만 원 이상이면 핸드가 끝날 때마다 최고 잔액이 자동으로 기록돼요." },
      ],
    },
    en: {
      tips: [
        "Following basic strategy brings the house edge down to about 0.4%. Turn on 💡 Hint and the recommended button lights up.",
        "When the dealer shows 2–6 they bust often — stand on 12–16 (hit 12 against a 2 or 3) and look for doubles.",
        "Always split aces and eights; never split tens or fives — treat 5-5 as a 10 and double.",
        "Insurance pays less than the dealer's real chance of blackjack (about 31%), so basic strategy never takes it.",
      ],
      faq: [
        { q: "Does it use real money?", a: "No. It's a free game with play money only — nothing can be bought or cashed out." },
        { q: "When does the dealer draw?", a: "The dealer must hit 16 or less and stands on all 17s, including soft 17." },
        { q: "What if I reload mid-hand?", a: "The hand in progress is saved, so you continue with the same cards. Results are fixed before the cards are revealed, so reloading can't change them." },
        { q: "How does the leaderboard work?", a: "When signed in, your peak balance is recorded after each hand while your balance is ₩1,000,000 or more." },
      ],
    },
  },
  racing: {
    ko: {
      tips: [
        "코너 앞에서 미리 ↓로 살짝 속도를 줄이고, 코너 안쪽을 스치듯 돌아 나오면서 다시 가속하면 기록이 확 줄어요.",
        "잔디로 나가면 최고 속도가 크게 떨어져요. 많이 벗어났으면 R(휴대폰은 ↺)로 코스에 복귀하는 게 빨라요.",
        "노란 부스트 박스를 지나면 1.6초 동안 빨라져요. 박스는 5초 뒤 다시 생겨요.",
        "작은 코너(S)는 아주 급해서 속도를 많이 줄여야 해요. 맵을 만들 때 큰 코너(M·L)를 섞으면 시원하게 달리는 코스가 돼요.",
      ],
      faq: [
        { q: "맵은 어떻게 만드나요?", a: "메뉴의 '맵 에디터'에서 도로 조각을 골라 격자에 놓으세요. 같은 조각을 다시 누르거나 R 키로 회전해요. 출발선에서 시작해 다시 출발선으로 돌아오면 '코스 완성'이 뜨고, 저장하면 레이스 설정에서 고를 수 있어요." },
        { q: "다리나 고가도로처럼 위아래로 쌓을 수 있나요?", a: "네. 에디터 오른쪽 ▲▼로 편집할 높이(0~2)를 고르고, 도로 탭의 '오르막'으로 한 층씩 올라가요. 높은 층에 놓은 도로는 기둥이 자동으로 생기고, 그 아래로 다른 길이 지나갈 수 있어요. 높이가 다른 길끼리는 반드시 오르막으로 이어야 해요." },
        { q: "만든 맵을 친구에게 보낼 수 있나요?", a: "에디터의 '공유 코드'를 눌러 코드를 복사해 보내면, 친구가 같은 창에 붙여 넣고 '불러오기'로 열 수 있어요. 온라인 방에서는 방장이 고른 맵이 모두에게 자동으로 전달돼요." },
        { q: "친구와 같이 하려면?", a: "'친구와 온라인 대전'에서 방을 만들고 초대 링크를 보내세요. 2~8명까지, 빈자리는 AI로 채울 수 있어요. 방장이 맵과 랩 수를 고르고 출발해요." },
        { q: "만든 맵은 어디에 저장되나요?", a: "이 기기 브라우저에 저장되고, 로그인하면 계정에도 저장돼 다른 기기에서도 쓸 수 있어요." },
      ],
    },
    en: {
      tips: [
        "Brake a little before corners, clip the inside and get back on the gas on the way out — it saves a lot of time.",
        "Grass cuts your top speed hard. If you go far off track, press R (↺ on phones) to reset.",
        "Yellow boost boxes give you 1.6 seconds of extra speed and respawn after 5 seconds.",
        "Small (S) corners are very tight. Mixing in M and L corners makes a faster, flowing track.",
      ],
      faq: [
        { q: "How do I build a track?", a: "Open the Track Editor, pick road pieces and place them on the grid. Tap a piece again or press R to rotate. When the loop returns to the start line you'll see 'Track OK' — save it and pick it in race setup." },
        { q: "Can I stack roads, like bridges and flyovers?", a: "Yes. Use ▲▼ on the right of the editor to pick the level you're editing (0–2) and the Ramp piece to climb one level. Raised roads get pillars automatically and other roads can pass underneath. Roads at different heights must be joined with a ramp." },
        { q: "Can I send my track to a friend?", a: "Press 'Share code' in the editor and send the code. Your friend pastes it in the same window and presses Load. In online rooms, the host's track is sent to everyone automatically." },
        { q: "How do I race friends?", a: "Open 'Race friends online', create a room and share the invite link. 2–8 players; empty seats can be filled with AI. The host picks the track and laps and starts the race." },
        { q: "Where are my tracks saved?", a: "In this browser, and in your account when you're signed in so you can use them on other devices." },
      ],
    },
  },
  "world-typing": {
    ko: {
      tips: [
        "속도보다 정확도를 먼저 챙기세요. 랭킹 점수는 타수에 정확도를 곱한 값이라, 오타가 많으면 빨라도 점수가 낮아져요.",
        "도시 이름이 화면에 나오면 끝까지 한 번 읽고 치기 시작하면 중간에 틀리는 일이 줄어요.",
        "한타는 받침이 많은 도시에서 실수가 잦아요. 받침을 확실히 친 뒤 다음 글자로 넘어가세요.",
        "영타 모드는 악센트 없이 입력해도 정답으로 인정돼요(예: São Paulo → Sao Paulo).",
      ],
      faq: [
        { q: "도시는 몇 개인가요?", a: "실제 지도 위 235개 도시가 나와요. 한글 이름과 영어 이름 모드를 고를 수 있어요." },
        { q: "랭킹에 올라가려면?", a: "25개 이상 완주하면 정확도를 반영한 타수(한타)나 WPM(영타)이 기록돼요." },
        { q: "모바일에서도 되나요?", a: "네. 휴대폰 키보드로 입력할 수 있어요." },
      ],
    },
    en: {
      tips: [
        "Accuracy first — the ranking score multiplies speed by accuracy, so typos hurt even when fast.",
        "Read the whole city name before you start typing.",
        "In English mode accents are optional (São Paulo → Sao Paulo).",
      ],
      faq: [
        { q: "How many cities?", a: "235 real cities, in Korean or English mode." },
        { q: "How do I get ranked?", a: "Finish 25+ cities; your accuracy-weighted speed is recorded." },
        { q: "Mobile?", a: "Yes, type with your phone keyboard." },
      ],
    },
  },
};
