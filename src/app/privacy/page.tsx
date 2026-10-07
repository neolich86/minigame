import type { Metadata } from "next";
import Link from "next/link";
import { serverLang } from "@/lib/serverLang";

export const metadata: Metadata = {
  title: "개인정보처리방침 · Privacy Policy",
  description: "미니게임천국과 Passport Map 앱의 개인정보처리방침",
  alternates: { canonical: "/privacy" },
};

const UPDATED = "2026-10-07";
const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";

// 미니게임천국 웹사이트와 Passport Map 안드로이드 앱 공통 개인정보처리방침 (구글 플레이 등록용)
export default async function PrivacyPage() {
  const { lang } = await serverLang();
  const en = lang === "en";
  const contact = CONTACT ? <a href={`mailto:${CONTACT}`}>{CONTACT}</a> : en ? "the developer contact on the app's store page" : "앱 스토어 페이지의 개발자 연락처";
  return (
    <div className="wrap mid legal">
      <h1 className="page-title">{en ? "Privacy Policy" : "개인정보처리방침"}</h1>
      <p className="page-sub">
        {en
          ? `Applies to the Mini Game Heaven website and the Passport Map Android app. Last updated ${UPDATED}.`
          : `미니게임천국 웹사이트와 Passport Map 안드로이드 앱에 적용됩니다. 최종 수정일 ${UPDATED}.`}
      </p>
      {en ? (
        <>
          <h2>1. What we collect</h2>
          <ul>
            <li><b>Account</b>: email address (email sign-up) or Kakao account identifier (Kakao login), and the nickname you set.</li>
            <li><b>Passport Map data</b>: countries and cities you mark, pin colors, visit dates, notes, map theme and the photos you add.</li>
            <li><b>Game records</b>: scores and rankings, online room participation.</li>
            <li><b>Usage data</b>: pages visited and device/browser information collected by Google Analytics, and cookies used by Google AdSense on the website.</li>
          </ul>
          <p>You can use Passport Map without an account; your map is then stored only on your device.</p>
          <h2>2. Why we use it</h2>
          <ul>
            <li>To keep your map, photos and records in your account and show them on any device you sign in on.</li>
            <li>To show rankings and run online games.</li>
            <li>To create a public link to your map, only when you choose to.</li>
            <li>To understand usage and improve the service.</li>
          </ul>
          <h2>3. Sharing and public links</h2>
          <p>We do not sell your data. If you press “Create my map link”, a copy of your map, notes and photos becomes viewable by anyone with that link. You can stop sharing at any time, which deletes the public copy.</p>
          <h2>4. Where data is stored</h2>
          <p>Data is stored with our service providers: Supabase (database, login and file storage) and Vercel (website hosting). They process data only to run the service.</p>
          <h2>5. How long we keep it</h2>
          <p>Until you delete it or delete your account. Deleting your account removes your profile, records, Passport Map data, photos and public links.</p>
          <h2>6. Deleting your account</h2>
          <p>Go to <Link href="/account/delete">Delete account</Link> (sign-in required), or contact us at {contact}.</p>
          <h2>7. Children</h2>
          <p>The service is not directed at children under 14. We do not knowingly collect their personal data.</p>
          <h2>8. Contact</h2>
          <p>Developer: 제임스웹 · {contact}</p>
        </>
      ) : (
        <>
          <h2>1. 수집하는 정보</h2>
          <ul>
            <li><b>계정</b>: 이메일 가입 시 이메일 주소, 카카오 로그인 시 카카오 계정 식별자, 직접 정한 닉네임</li>
            <li><b>Passport Map 데이터</b>: 표시한 나라·도시, 핀 색, 방문 기간, 메모, 지도 테마, 올린 사진</li>
            <li><b>게임 기록</b>: 점수·랭킹, 온라인 방 참여 기록</li>
            <li><b>이용 기록</b>: 구글 애널리틱스가 수집하는 방문 페이지·기기·브라우저 정보, 웹사이트의 구글 애드센스 쿠키</li>
          </ul>
          <p>Passport Map은 로그인 없이도 쓸 수 있으며, 이때 지도는 이용자의 기기에만 저장됩니다.</p>
          <h2>2. 이용 목적</h2>
          <ul>
            <li>지도·사진·기록을 계정에 보관하고 로그인한 모든 기기에서 보여 주기 위해</li>
            <li>랭킹 표시와 온라인 대전 운영을 위해</li>
            <li>이용자가 원할 때만, 내 지도 공개 링크를 만들기 위해</li>
            <li>서비스 이용 현황을 파악하고 개선하기 위해</li>
          </ul>
          <h2>3. 제3자 제공과 공개 링크</h2>
          <p>개인정보를 판매하거나 제3자에게 제공하지 않습니다. 이용자가 “내 지도 링크 만들기”를 누르면 지도·메모·사진의 사본을 링크를 아는 누구나 볼 수 있게 됩니다. 언제든 공개를 중지할 수 있고, 중지하면 공개 사본이 삭제됩니다.</p>
          <h2>4. 처리 위탁 (보관 장소)</h2>
          <p>Supabase(데이터베이스·로그인·파일 저장)와 Vercel(웹사이트 호스팅)에 보관·처리를 맡기며, 이들은 서비스 운영 목적으로만 데이터를 처리합니다.</p>
          <h2>5. 보유 기간</h2>
          <p>이용자가 직접 지우거나 회원 탈퇴할 때까지 보관합니다. 탈퇴하면 프로필, 기록, Passport Map 데이터, 사진, 공개 링크가 모두 삭제됩니다.</p>
          <h2>6. 계정 삭제(회원 탈퇴)</h2>
          <p><Link href="/account/delete">계정 삭제</Link> 페이지에서 직접 삭제할 수 있습니다(로그인 필요). 또는 {contact}로 요청해 주세요.</p>
          <h2>7. 아동</h2>
          <p>만 14세 미만 아동을 대상으로 하지 않으며, 아동의 개인정보를 알면서 수집하지 않습니다.</p>
          <h2>8. 문의</h2>
          <p>개발자: 제임스웹 · {contact}</p>
        </>
      )}
    </div>
  );
}
