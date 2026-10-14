import type { Metadata } from "next";
import Link from "next/link";
import { entryPath, itemsOf } from "@/lib/games";
import { serverLang } from "@/lib/serverLang";

export const metadata: Metadata = {
  title: "사이트 소개 · About",
  description: "미니게임천국은 개인 개발자 제임스웹이 직접 만들고 운영하는 무료 브라우저 게임·추첨 도구·생활 서비스 모음입니다.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const { lang } = await serverLang();
  const en = lang === "en";
  const games = itemsOf("game");
  const tools = itemsOf("tool");
  const apps = itemsOf("app");
  const list = (items: typeof games) => (
    <ul>
      {items.map((g) => (
        <li key={g.id}>
          <Link href={entryPath(g)}>{g.title[lang]}</Link> — {g.desc[lang]}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="wrap mid legal">
      <h1 className="page-title">{en ? "About Mini Game Heaven" : "미니게임천국 소개"}</h1>
      {en ? (
        <>
          <p>Mini Game Heaven is a free collection of browser games, random pickers and small everyday services. Everything here was designed and coded by one independent developer, JamesWeb, and runs directly in your browser — no download, no install and, for most content, no sign-up.</p>
          <h2>Why this site exists</h2>
          <p>It started as a place to play board games with friends online without setting up a table. Over time it grew into a small portal: quick games to fill a coffee break, tools to settle “who pays for lunch”, and services such as a travel map. Each item is built from scratch, with its own rules, artwork choices and balance tuning.</p>
          <h2>What you can do here</h2>
          <ul>
            <li><b>Play online with friends</b> — share a room code and play board games in real time.</li>
            <li><b>Compete on leaderboards</b> — scores are saved per game; sign in to keep your records on every device.</li>
            <li><b>Challenge a friend</b> — after a good run, send a challenge link and see who does better.</li>
            <li><b>Like what you enjoy</b> — the heart button helps us decide what to improve next.</li>
          </ul>
          <h2>Games ({games.length})</h2>
          {list(games)}
          <h2>Pickers & tools ({tools.length})</h2>
          {list(tools)}
          <h2>Services ({apps.length})</h2>
          {list(apps)}
          <h2>How we keep it running</h2>
          <p>The site is free and supported by advertising. Ads never block gameplay, and we do not sell personal data — see the <Link href="/privacy">Privacy Policy</Link> and <Link href="/terms">Terms of Use</Link>.</p>
          <h2>Feedback</h2>
          <p>Found a bug or have an idea for a new game? Please tell us on the <Link href="/contact">contact page</Link>. New games and updates are added regularly.</p>
        </>
      ) : (
        <>
          <p>미니게임천국은 무료 브라우저 게임, 추첨 도구, 생활 서비스를 한곳에 모은 사이트입니다. 모든 콘텐츠는 개인 개발자 <b>제임스웹</b>이 직접 기획하고 개발했으며, 다운로드나 설치 없이 브라우저에서 바로 실행됩니다. 대부분은 회원가입 없이도 이용할 수 있어요.</p>
          <h2>만든 이유</h2>
          <p>처음에는 육각형 섬 개척이나 숫자 타일 대전 같은 보드게임을 판을 펼치지 않고도 친구들과 온라인으로 즐기려고 만들었습니다. 그 뒤로 쉬는 시간에 가볍게 할 수 있는 게임, “점심 누가 살래?”를 정해 주는 추첨 도구, 여행 지도 같은 서비스가 하나씩 늘어나 지금의 모습이 되었어요. 게임마다 규칙과 밸런스, 화면 구성을 처음부터 직접 만들고 다듬고 있습니다.</p>
          <h2>여기서 할 수 있는 것</h2>
          <ul>
            <li><b>친구와 온라인 대전</b> — 방 코드를 공유하면 보드게임을 실시간으로 함께할 수 있어요.</li>
            <li><b>랭킹 도전</b> — 게임마다 점수가 기록되고, 로그인하면 어느 기기에서든 내 기록이 이어집니다.</li>
            <li><b>친구에게 도전장</b> — 좋은 기록이 나오면 도전 링크를 보내 누가 더 잘하는지 겨뤄 보세요.</li>
            <li><b>좋아요</b> — 하트를 눌러 주시면 어떤 콘텐츠를 더 다듬을지 정하는 데 참고합니다.</li>
          </ul>
          <h2>게임 ({games.length}개)</h2>
          {list(games)}
          <h2>추첨 · 도구 ({tools.length}개)</h2>
          {list(tools)}
          <h2>서비스 ({apps.length}개)</h2>
          {list(apps)}
          <h2>운영 방식</h2>
          <p>사이트는 무료이며 광고 수익으로 운영됩니다. 광고가 게임 진행을 가리지 않도록 배치하고, 개인정보는 판매하지 않습니다. 자세한 내용은 <Link href="/privacy">개인정보처리방침</Link>과 <Link href="/terms">이용약관</Link>을 확인해 주세요.</p>
          <h2>의견 보내기</h2>
          <p>버그를 발견했거나 만들어 줬으면 하는 게임이 있다면 <Link href="/contact">문의하기</Link>로 알려 주세요. 새 게임과 업데이트는 꾸준히 추가됩니다.</p>
        </>
      )}
    </div>
  );
}
