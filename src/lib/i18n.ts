// 포털 UI 다국어 — 한국어 브라우저면 ko, 그 외는 en. 사용자가 직접 바꾸면 쿠키/로컬스토리지에 저장.
// 게임(iframe)들은 public/mgh/bridge.js 가 같은 키(mgh:lang)를 읽어 동일한 언어로 맞춘다.

export type Lang = "ko" | "en";
export const LANGS: Lang[] = ["ko", "en"];
export const LANG_COOKIE = "mgh_lang";
export const LANG_STORAGE = "mgh:lang";

/** Accept-Language / navigator.languages 목록에서 언어 결정 — 한국어가 하나라도 최우선이면 ko */
export function pickLang(list: readonly string[] | string | null | undefined): Lang {
  const arr = Array.isArray(list)
    ? list
    : String(list ?? "")
        .split(",")
        .map((s) => s.split(";")[0].trim())
        .filter(Boolean);
  for (const l of arr) {
    const low = l.toLowerCase();
    if (low.startsWith("ko")) return "ko";
    if (low.startsWith("en")) return "en";
  }
  return "en";
}

export function normLang(v: unknown): Lang | null {
  return v === "ko" || v === "en" ? v : null;
}

const ko = {
  siteName: "미니 게임 천국",
  eyebrow: "MINI GAME COLLECTION",
  subtitle: "직접 만든 브라우저 게임을 한곳에 모았습니다. 로그인하면 랭킹에 기록이 남고, 친구와 온라인 대전도 할 수 있어요.",
  metaDescription:
    "타이핑, 슈팅, 타워디펜스, 카드게임, 보드게임까지 직접 제작한 브라우저 게임 모음. 랭킹 경쟁과 온라인 대전을 설치 없이 바로 즐기세요.",
  filterAll: "전체",
  genre_board: "보드게임",
  genre_action: "액션",
  genre_strategy: "전략",
  genre_casual: "캐주얼",
  viewList: "리스트형",
  viewGrid: "썸네일형",
  play: "▶ PLAY",
  badgeOnline: "온라인 대전",
  badgeRanking: "랭킹",
  footer: "© 제임스웹 · 개인 제작 브라우저 게임 모음",
  gamesUnit: "GAMES",
  navRanking: "랭킹",
  navLogin: "로그인",
  navLogout: "로그아웃",
  navMe: "내 정보",
  back: "← 게임 목록",
  // 로그인
  loginTitle: "로그인",
  loginSub: "로그인하면 랭킹 기록과 온라인 대전을 이용할 수 있어요.",
  withKakao: "카카오로 시작하기",
  orEmail: "또는 이메일로",
  email: "이메일",
  password: "비밀번호",
  passwordNew: "새 비밀번호 (6자 이상)",
  nickname: "닉네임",
  signIn: "로그인",
  signUp: "회원가입",
  toSignUp: "계정이 없나요? 회원가입",
  toSignIn: "이미 계정이 있나요? 로그인",
  forgot: "비밀번호를 잊었어요",
  sendReset: "재설정 메일 보내기",
  resetSent: "비밀번호 재설정 메일을 보냈어요. 메일함을 확인해 주세요.",
  signUpSent: "인증 메일을 보냈어요. 메일의 링크를 누르면 가입이 완료됩니다.",
  resetTitle: "새 비밀번호 설정",
  resetDone: "비밀번호를 변경했어요.",
  save: "저장",
  saved: "저장했어요",
  cancel: "취소",
  serverMissing: "서버 설정(Supabase 환경변수)이 아직 없어 로그인 기능이 꺼져 있어요. 게임은 그대로 플레이할 수 있어요.",
  // 내 정보
  meTitle: "내 정보",
  myRecords: "내 기록",
  noRecords: "아직 기록이 없어요. 랭킹 게임을 플레이해 보세요!",
  loginNeeded: "로그인이 필요해요.",
  // 랭킹
  rankingTitle: "랭킹",
  rankingSub: "게임별 최고 기록 순위",
  rank: "순위",
  player: "플레이어",
  record: "기록",
  myBest: "내 최고 기록",
  myRank: "내 순위",
  noRanking: "아직 등록된 기록이 없어요. 첫 번째 주인공이 되어 보세요!",
  loginToRank: "로그인하면 기록이 랭킹에 등록돼요",
  newRecord: "새 기록! 랭킹에 등록했어요",
  submitted: "기록 등록",
  submitFail: "기록 등록에 실패했어요",
  fullRanking: "전체 랭킹 보기",
  showRanking: "랭킹",
  hideRanking: "닫기",
  // 온라인
  onlinePlay: "온라인 대전",
  soloPlay: "혼자 하기 (AI 대전)",
  lobbyTitle: "온라인 대전",
  lobbySub: "방을 만들고 코드를 친구에게 알려주세요. 빈 자리는 AI로 채울 수 있어요.",
  createRoom: "방 만들기",
  joinRoom: "참가",
  roomCode: "방 코드",
  players: "인원",
  playersN: "{n}인",
  roomCodeLabel: "방 코드",
  copy: "복사",
  copied: "복사됨",
  seat: "자리",
  emptySeat: "빈 자리",
  fillAI: "AI로 채우기",
  removeSeat: "비우기",
  host: "방장",
  you: "나",
  ready: "준비 완료",
  notReady: "준비",
  waitingReady: "대기 중",
  startGame: "게임 시작",
  leave: "나가기",
  needAllReady: "모든 플레이어가 준비하면 방장이 시작할 수 있어요.",
  needFull: "빈 자리를 채워야 시작할 수 있어요.",
  hostDisconnected: "방장의 연결이 끊겼어요. 방장이 돌아오면 이어서 진행돼요.",
  offline: "접속 끊김",
  replaceAI: "AI로 대체",
  gameOver: "게임 종료",
  backToLobby: "로비로",
  myRooms: "진행 중인 내 방",
  deleteRoom: "방 삭제",
  deleteConfirm: "이 방을 삭제할까요? 참가자 모두 방에서 나가게 되고, 진행 중인 게임도 끝나요.",
  roomDeleted: "방이 삭제되었어요.",
  enter: "입장",
  // 오류
  err_room_not_found: "존재하지 않는 방 코드예요.",
  err_room_already_started: "이미 시작된 방이에요.",
  err_room_full: "방이 가득 찼어요.",
  err_not_host: "방장만 할 수 있어요.",
  err_seat_taken: "이미 채워진 자리예요.",
  err_not_all_ready: "아직 모두 준비하지 않았어요.",
  err_seats_not_full: "빈 자리가 있어요.",
  err_invalid_nickname: "닉네임은 1~12자로 입력해 주세요.",
  err_rate_limited: "너무 자주 등록하고 있어요. 잠시 후 다시 시도해 주세요.",
  err_invalid_score: "올바르지 않은 기록이에요.",
  err_network: "네트워크에 연결할 수 없어요.",
  err_generic: "문제가 생겼어요. 잠시 후 다시 시도해 주세요.",
  err_invalid_credentials: "이메일 또는 비밀번호가 올바르지 않아요.",
  err_email_not_confirmed: "메일 인증이 아직 끝나지 않았어요. 받은 메일의 링크를 눌러 주세요.",
  err_user_exists: "이미 가입된 이메일이에요.",
  err_weak_password: "비밀번호는 6자 이상이어야 해요.",
};

type Dict = typeof ko;
export type MsgKey = keyof Dict;

const en: Dict = {
  siteName: "Mini Game Heaven",
  eyebrow: "MINI GAME COLLECTION",
  subtitle: "Browser games I built myself, all in one place. Sign in to post your scores to the leaderboards and play online with friends.",
  metaDescription:
    "A collection of hand-made browser games — typing, shooters, tower defense, card and board games. Compete on leaderboards and play online, no install needed.",
  filterAll: "All",
  genre_board: "Board",
  genre_action: "Action",
  genre_strategy: "Strategy",
  genre_casual: "Casual",
  viewList: "List",
  viewGrid: "Grid",
  play: "▶ PLAY",
  badgeOnline: "Online",
  badgeRanking: "Ranked",
  footer: "© JamesWeb · A personal collection of browser games",
  gamesUnit: "GAMES",
  navRanking: "Rankings",
  navLogin: "Sign in",
  navLogout: "Sign out",
  navMe: "My page",
  back: "← All games",
  loginTitle: "Sign in",
  loginSub: "Sign in to save your records to the leaderboards and play online.",
  withKakao: "Continue with Kakao",
  orEmail: "or with email",
  email: "Email",
  password: "Password",
  passwordNew: "New password (6+ characters)",
  nickname: "Nickname",
  signIn: "Sign in",
  signUp: "Create account",
  toSignUp: "No account yet? Sign up",
  toSignIn: "Already have an account? Sign in",
  forgot: "Forgot password?",
  sendReset: "Send reset email",
  resetSent: "We sent a password reset email. Please check your inbox.",
  signUpSent: "We sent a confirmation email. Click the link in it to finish signing up.",
  resetTitle: "Set a new password",
  resetDone: "Your password has been changed.",
  save: "Save",
  saved: "Saved",
  cancel: "Cancel",
  serverMissing: "Server settings (Supabase env vars) are missing, so sign-in is disabled. You can still play every game.",
  meTitle: "My page",
  myRecords: "My records",
  noRecords: "No records yet. Try a ranked game!",
  loginNeeded: "Please sign in first.",
  rankingTitle: "Rankings",
  rankingSub: "Top records for each game",
  rank: "Rank",
  player: "Player",
  record: "Record",
  myBest: "My best",
  myRank: "My rank",
  noRanking: "No records yet. Be the first!",
  loginToRank: "Sign in to put your records on the leaderboard",
  newRecord: "New record! Posted to the leaderboard",
  submitted: "Record posted",
  submitFail: "Couldn't post your record",
  fullRanking: "View full rankings",
  showRanking: "Ranking",
  hideRanking: "Close",
  onlinePlay: "Play online",
  soloPlay: "Play solo (vs AI)",
  lobbyTitle: "Online match",
  lobbySub: "Create a room and share the code with friends. Empty seats can be filled with AI.",
  createRoom: "Create room",
  joinRoom: "Join",
  roomCode: "Room code",
  players: "Players",
  playersN: "{n} players",
  roomCodeLabel: "Room code",
  copy: "Copy",
  copied: "Copied",
  seat: "Seat",
  emptySeat: "Empty seat",
  fillAI: "Fill with AI",
  removeSeat: "Clear",
  host: "Host",
  you: "You",
  ready: "Ready",
  notReady: "Ready up",
  waitingReady: "Not ready",
  startGame: "Start game",
  leave: "Leave",
  needAllReady: "The host can start once everyone is ready.",
  needFull: "Fill every seat to start.",
  hostDisconnected: "The host disconnected. The game will continue when they return.",
  offline: "Offline",
  replaceAI: "Replace with AI",
  gameOver: "Game over",
  backToLobby: "Back to lobby",
  myRooms: "My active rooms",
  deleteRoom: "Delete room",
  deleteConfirm: "Delete this room? Everyone will be removed and any game in progress will end.",
  roomDeleted: "This room has been deleted.",
  enter: "Enter",
  err_room_not_found: "That room code doesn't exist.",
  err_room_already_started: "That game has already started.",
  err_room_full: "The room is full.",
  err_not_host: "Only the host can do that.",
  err_seat_taken: "That seat is already taken.",
  err_not_all_ready: "Not everyone is ready yet.",
  err_seats_not_full: "There are empty seats.",
  err_invalid_nickname: "Nicknames must be 1–12 characters.",
  err_rate_limited: "You're submitting too often. Try again in a moment.",
  err_invalid_score: "That record isn't valid.",
  err_network: "Can't reach the network.",
  err_generic: "Something went wrong. Please try again.",
  err_invalid_credentials: "Wrong email or password.",
  err_email_not_confirmed: "Your email isn't confirmed yet. Click the link in the email we sent.",
  err_user_exists: "That email is already registered.",
  err_weak_password: "Passwords must be at least 6 characters.",
};

export const DICT: Record<Lang, Dict> = { ko, en };

export function translate(lang: Lang, key: MsgKey, vars?: Record<string, string | number>): string {
  let s = DICT[lang][key] ?? DICT.ko[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

/** Supabase/RPC 오류를 사용자 문구 키로 */
export function errorKey(e: unknown): MsgKey {
  const m =
    e instanceof Error
      ? e.message
      : typeof e === "object" && e && "message" in e
        ? String((e as { message: unknown }).message)
        : String(e);
  const codes = [
    "room_not_found",
    "room_already_started",
    "room_full",
    "not_host",
    "seat_taken",
    "not_all_ready",
    "seats_not_full",
    "invalid_nickname",
    "rate_limited",
    "invalid_score",
  ] as const;
  for (const c of codes) if (m.includes(c)) return `err_${c}` as MsgKey;
  if (/invalid login credentials/i.test(m)) return "err_invalid_credentials";
  if (/email not confirmed/i.test(m)) return "err_email_not_confirmed";
  if (/already registered|already been registered|user_already_exists/i.test(m)) return "err_user_exists";
  if (/password should be at least|weak_password/i.test(m)) return "err_weak_password";
  if (/Failed to fetch|NetworkError/i.test(m)) return "err_network";
  return "err_generic";
}
