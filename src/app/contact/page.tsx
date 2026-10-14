import type { Metadata } from "next";
import Link from "next/link";
import { serverLang } from "@/lib/serverLang";

export const metadata: Metadata = {
  title: "문의하기 · Contact",
  description: "미니게임천국 버그 제보, 게임 제안, 제휴·광고 문의 안내",
  alternates: { canonical: "/contact" },
};

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";

export default async function ContactPage() {
  const { lang } = await serverLang();
  const en = lang === "en";
  const mail = CONTACT ? <a href={`mailto:${CONTACT}`}>{CONTACT}</a> : null;
  return (
    <div className="wrap mid legal">
      <h1 className="page-title">{en ? "Contact" : "문의하기"}</h1>
      {en ? (
        <>
          <p>Mini Game Heaven is run by an independent developer, JamesWeb. We read every message.</p>
          <h2>Email</h2>
          <p>{mail ?? "Please use the developer contact listed on our app store page."}</p>
          <h2>What to include</h2>
          <ul>
            <li><b>Bug reports</b>: the game name, your device and browser, and what happened (a screenshot helps).</li>
            <li><b>Game ideas</b>: what kind of game you would like to see, or how an existing one could be better.</li>
            <li><b>Ranking or account issues</b>: your nickname and the game. To delete your account, use <Link href="/account/delete">Delete account</Link>.</li>
            <li><b>Partnership or advertising</b>: your company and proposal.</li>
          </ul>
          <p>We usually reply within a few business days.</p>
        </>
      ) : (
        <>
          <p>미니게임천국은 개인 개발자 제임스웹이 운영합니다. 보내 주신 의견은 모두 직접 읽고 있어요.</p>
          <h2>이메일</h2>
          <p>{mail ?? "앱 스토어 페이지의 개발자 연락처로 문의해 주세요."}</p>
          <h2>이렇게 보내 주시면 빨리 확인할 수 있어요</h2>
          <ul>
            <li><b>버그 제보</b>: 게임 이름, 사용 기기와 브라우저, 어떤 상황에서 문제가 생겼는지 (스크린샷이 있으면 더 좋아요)</li>
            <li><b>게임 제안</b>: 만들어 줬으면 하는 게임이나, 기존 게임에서 바뀌었으면 하는 점</li>
            <li><b>랭킹·계정 문의</b>: 닉네임과 게임 이름. 회원 탈퇴는 <Link href="/account/delete">계정 삭제</Link> 페이지에서 직접 할 수 있어요.</li>
            <li><b>제휴·광고 문의</b>: 회사(단체)명과 제안 내용</li>
          </ul>
          <p>보통 영업일 기준 며칠 안에 답장드립니다.</p>
        </>
      )}
    </div>
  );
}
