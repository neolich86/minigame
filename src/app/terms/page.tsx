import type { Metadata } from "next";
import Link from "next/link";
import { serverLang } from "@/lib/serverLang";

export const metadata: Metadata = {
  title: "이용약관 · Terms of Use",
  description: "미니게임천국 웹사이트 이용약관",
  alternates: { canonical: "/terms" },
};

const UPDATED = "2026-10-14";

export default async function TermsPage() {
  const { lang } = await serverLang();
  const en = lang === "en";
  return (
    <div className="wrap mid legal">
      <h1 className="page-title">{en ? "Terms of Use" : "이용약관"}</h1>
      <p className="page-sub">{en ? `Last updated ${UPDATED}.` : `최종 수정일 ${UPDATED}.`}</p>
      {en ? (
        <>
          <h2>1. The service</h2>
          <p>Mini Game Heaven (the “Service”) provides free browser games, random pickers and related services, operated by JamesWeb. By using the Service you agree to these terms.</p>
          <h2>2. Accounts</h2>
          <p>Most content works without an account. If you sign in, you are responsible for your account and the nickname you choose. Nicknames that are offensive, impersonate others or contain personal information may be changed or removed.</p>
          <h2>3. Fair play</h2>
          <ul>
            <li>Do not manipulate scores, use automation or exploit bugs to enter leaderboards. Such records may be removed without notice.</li>
            <li>Do not harass other players in online rooms or attempt to disrupt the Service.</li>
          </ul>
          <h2>4. Simulations are for fun only</h2>
          <p>Games such as the Oripa simulator, weapon enhancement and lotto picker use virtual money and random results for entertainment. They involve no real money, have no cash value and do not predict real lottery or sports outcomes.</p>
          <h2>5. Content and intellectual property</h2>
          <p>The games, code and original artwork on the Service belong to the operator. Board-game titles and card images referenced in fan-made content belong to their respective owners and are used for non-commercial play and reference.</p>
          <h2>6. Advertising</h2>
          <p>The Service is supported by ads served by Google AdSense. Ad content is provided by third parties.</p>
          <h2>7. Changes and availability</h2>
          <p>Games may be added, changed or removed, and the Service may be interrupted for maintenance. We are not liable for loss of game records caused by such changes, except where required by law.</p>
          <h2>8. Contact</h2>
          <p>Questions about these terms: <Link href="/contact">Contact</Link>. Personal data is handled under the <Link href="/privacy">Privacy Policy</Link>.</p>
        </>
      ) : (
        <>
          <h2>제1조 (서비스)</h2>
          <p>미니게임천국(이하 “서비스”)은 제임스웹이 운영하는 무료 브라우저 게임, 추첨 도구 및 관련 서비스입니다. 서비스를 이용하면 이 약관에 동의한 것으로 봅니다.</p>
          <h2>제2조 (계정)</h2>
          <p>대부분의 콘텐츠는 로그인 없이 이용할 수 있습니다. 로그인한 경우 계정과 닉네임 관리 책임은 이용자에게 있습니다. 욕설·사칭·개인정보가 포함된 닉네임은 변경되거나 삭제될 수 있습니다.</p>
          <h2>제3조 (공정한 이용)</h2>
          <ul>
            <li>점수 조작, 자동화 프로그램, 버그 악용으로 랭킹에 오르는 행위를 금지합니다. 이런 기록은 예고 없이 삭제될 수 있습니다.</li>
            <li>온라인 방에서 다른 이용자를 괴롭히거나 서비스 운영을 방해하는 행위를 금지합니다.</li>
          </ul>
          <h2>제4조 (시뮬레이션은 재미용입니다)</h2>
          <p>오리파 시뮬레이터, 무기 강화, 로또 번호 추첨기 등은 가상의 돈과 무작위 결과를 이용한 오락용 콘텐츠입니다. 실제 돈이 오가지 않고 현금 가치가 없으며, 실제 복권·스포츠 결과를 예측하지 않습니다.</p>
          <h2>제5조 (콘텐츠와 저작권)</h2>
          <p>서비스의 게임, 코드, 직접 제작한 그림의 권리는 운영자에게 있습니다. 팬메이드 콘텐츠에 등장하는 보드게임 이름·카드 이미지의 권리는 각 권리자에게 있으며, 비상업적 플레이와 참고 목적으로 사용합니다.</p>
          <h2>제6조 (광고)</h2>
          <p>서비스는 Google AdSense 광고로 운영되며, 광고 내용은 제3자가 제공합니다.</p>
          <h2>제7조 (변경과 중단)</h2>
          <p>게임은 추가·변경·종료될 수 있고, 점검을 위해 서비스가 일시 중단될 수 있습니다. 법에서 정한 경우를 제외하고, 이로 인한 게임 기록 손실에 대해 책임지지 않습니다.</p>
          <h2>제8조 (문의)</h2>
          <p>약관 관련 문의는 <Link href="/contact">문의하기</Link>로 보내 주세요. 개인정보는 <Link href="/privacy">개인정보처리방침</Link>에 따라 처리합니다.</p>
        </>
      )}
    </div>
  );
}
