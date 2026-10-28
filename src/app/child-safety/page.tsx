import type { Metadata } from "next";
import Link from "next/link";
import { serverLang } from "@/lib/serverLang";

// 구글 플레이 '아동 안전 표준' 공개 페이지 (동네쪽지 등 사용자 제작 콘텐츠가 있는 앱)
export const metadata: Metadata = {
  title: "아동 안전 표준 · Child Safety Standards",
  description: "미니게임천국·동네쪽지의 아동 성적 학대 및 착취(CSAE) 방지 표준",
  alternates: { canonical: "/child-safety" },
};

const UPDATED = "2026-10-29";
const EMAIL = "l1c2h3@gmail.com";

export default async function ChildSafetyPage() {
  const { lang } = await serverLang();
  const en = lang === "en";
  return (
    <div className="wrap mid legal">
      <h1 className="page-title">{en ? "Child Safety Standards" : "아동 안전 표준"}</h1>
      <p className="page-sub">{en ? `Last updated ${UPDATED}.` : `최종 수정일 ${UPDATED}.`}</p>
      {en ? (
        <>
          <p>These standards apply to Mini Game Heaven (playwithme.kr) and its apps, including <b>Neighborhood Notes (동네쪽지)</b>, operated by JamesWeb.</p>
          <h2>1. Zero tolerance for CSAE</h2>
          <p>We prohibit child sexual abuse and exploitation (CSAE) in any form, including child sexual abuse material (CSAM), sexualization of minors, grooming, sextortion and trafficking. Content or accounts involved in CSAE are removed and permanently banned.</p>
          <h2>2. In-app reporting</h2>
          <p>Every note has a ⋯ menu with <b>Report → Child safety</b>. A child-safety report hides the note immediately, before review. Users can also block other users so their notes and comments are no longer shown.</p>
          <h2>3. Moderation</h2>
          <ul>
            <li>All users must agree to the community rules before posting.</li>
            <li>Reported content is reviewed by the operator; child-safety reports are prioritized.</li>
            <li>Posts with phone numbers or account numbers are blocked automatically to prevent contact and grooming outside the app.</li>
            <li>The service does not offer private one-to-one messaging.</li>
          </ul>
          <h2>4. Reporting to authorities</h2>
          <p>When we become aware of CSAM, we remove it, preserve the information required by law and report it to the relevant authorities, including the Korean National Police Agency (Cyber Bureau), the Korea Communications Standards Commission, and NCMEC where applicable.</p>
          <h2>5. Compliance</h2>
          <p>We comply with applicable child safety laws, including the Korean Act on the Protection of Children and Youth against Sex Offenses. Users under 14 may not create an account.</p>
          <h2>6. Contact</h2>
          <p>Child safety contact: <a href={`mailto:${EMAIL}`}>{EMAIL}</a> (also via <Link href="/contact">Contact</Link>). See also the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</p>
        </>
      ) : (
        <>
          <p>이 표준은 제임스웹이 운영하는 미니게임천국(playwithme.kr)과 <b>동네쪽지</b>를 포함한 관련 앱에 적용됩니다.</p>
          <h2>1. 아동 성적 학대·착취 무관용</h2>
          <p>아동 성적 학대 및 착취(CSAE)를 어떤 형태로든 금지합니다. 아동 성 학대 콘텐츠(CSAM), 미성년자를 성적으로 묘사하는 콘텐츠, 그루밍(길들이기), 성적 협박, 인신매매가 모두 포함됩니다. 이와 관련된 콘텐츠는 삭제하고 계정은 영구 이용 정지합니다.</p>
          <h2>2. 앱 안에서 신고하기</h2>
          <p>모든 쪽지의 ⋯ 메뉴에서 <b>신고하기 → 아동 안전</b>을 선택할 수 있습니다. 아동 안전 신고가 들어오면 확인 전이라도 해당 쪽지를 즉시 숨깁니다. 또한 다른 이용자를 차단해 그 사람의 쪽지·댓글이 보이지 않게 할 수 있습니다.</p>
          <h2>3. 운영과 관리</h2>
          <ul>
            <li>모든 이용자는 첫 글을 쓰기 전에 운영 정책에 동의해야 합니다.</li>
            <li>신고된 콘텐츠는 운영자가 확인하며, 아동 안전 신고를 가장 먼저 처리합니다.</li>
            <li>앱 밖 연락과 그루밍을 막기 위해 전화번호·계좌번호가 포함된 글은 자동으로 차단합니다.</li>
            <li>1:1 개인 메시지 기능을 제공하지 않습니다.</li>
          </ul>
          <h2>4. 관계 기관 신고</h2>
          <p>아동 성 학대 콘텐츠를 알게 되면 즉시 삭제하고, 법에 따라 필요한 정보를 보존한 뒤 경찰청 사이버수사국, 방송통신심의위원회 등 관계 기관(해당하는 경우 미국 NCMEC 포함)에 신고합니다.</p>
          <h2>5. 법규 준수</h2>
          <p>「아동·청소년의 성보호에 관한 법률」 등 아동 안전 관련 법규를 준수합니다. 만 14세 미만은 계정을 만들 수 없습니다.</p>
          <h2>6. 연락처</h2>
          <p>아동 안전 담당 연락처: <a href={`mailto:${EMAIL}`}>{EMAIL}</a> (<Link href="/contact">문의하기</Link>로도 연락할 수 있습니다). <Link href="/terms">이용약관</Link>·<Link href="/privacy">개인정보처리방침</Link>도 함께 확인해 주세요.</p>
        </>
      )}
    </div>
  );
}
