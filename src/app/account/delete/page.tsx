"use client";

import Link from "next/link";
import { LoginLink } from "@/components/LoginLink";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { deleteMyAccount } from "@/lib/saves";

// 계정 삭제 — 앱 안(설정)과 웹 양쪽에서 들어올 수 있는 주소 (구글 플레이 계정 삭제 정책)
export default function DeleteAccountPage() {
  const { lang, user, loading } = useApp();
  const en = lang === "en";
  const [armed, setArmed] = useState(false);
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function run() {
    if (!armed) {
      setArmed(true);
      return;
    }
    setState("busy");
    try {
      await deleteMyAccount();
      setState("done");
    } catch (e) {
      console.error(e);
      setState("error");
    }
  }

  return (
    <div className="wrap narrow legal">
      <h1 className="page-title">{en ? "Delete account" : "계정 삭제"}</h1>
      <p className="page-sub">
        {en
          ? "Account deletion for apps by 미니게임천국 (Mini Game Heaven, playwithme.kr). One account is shared by all of our apps and the website."
          : "미니게임천국(playwithme.kr)이 만든 앱과 웹사이트의 계정 삭제 페이지예요. 아래 앱들은 모두 하나의 미니게임천국 계정을 함께 써요."}
      </p>
      <div className="panel">
        <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>{en ? "Apps using this account" : "이 계정을 쓰는 앱"}</h2>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
          <li>{en ? "Card Binder (카드 도감) — kr.minigame.carddex" : "카드 도감 — kr.minigame.carddex"}</li>
          <li>{en ? "Neighborhood Notes (동네쪽지) — kr.minigame.dongnenote" : "동네쪽지 — kr.minigame.dongnenote"}</li>
          <li>{en ? "Little Witch's Potion Shop (꼬마 마녀의 물약가게)" : "꼬마 마녀의 물약가게"}</li>
          <li>{en ? "Archer Survivor (궁수 키우기)" : "궁수 키우기"}</li>
          <li>Passport Map</li>
          <li>{en ? "Mini Game Heaven website (playwithme.kr)" : "미니게임천국 웹사이트 (playwithme.kr)"}</li>
        </ul>
      </div>
      <div className="panel">
        <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>{en ? "How to delete" : "삭제 방법"}</h2>
        <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
          <li>{en ? "Sign in on this page with the account you want to delete (Kakao, Google or email)." : "이 페이지에서 삭제할 계정(카카오·구글·이메일)으로 로그인해요."}</li>
          <li>{en ? 'Press "Delete my account", then press it once more to confirm.' : "아래 '계정 삭제' 버튼을 누르고, 한 번 더 눌러 확인해요."}</li>
          <li>{en ? "Can't sign in? Email l1c2h3@gmail.com from your account email and we will delete it within 7 days." : "로그인이 안 되면 가입한 이메일로 l1c2h3@gmail.com 에 요청해 주세요. 7일 안에 삭제해 드려요."}</li>
        </ol>
      </div>
      <div className="panel">
        <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>{en ? "What is deleted" : "삭제되는 데이터"}</h2>
        <p style={{ margin: 0, lineHeight: 1.7 }}>
          {en
            ? "Deleted immediately and permanently: profile (nickname, email, user ID), game records and rankings, saved game data, Card Binder cards and uploaded photos, Neighborhood Notes notes·likes·comments, Passport Map data and photos, and all share links. Nothing is kept afterwards, except anonymous visit statistics that cannot identify you."
            : "바로 영구 삭제: 프로필(닉네임·이메일·사용자 ID), 게임 기록과 랭킹, 저장 데이터, 카드 도감의 카드와 올린 사진, 동네쪽지의 쪽지·좋아요·댓글, Passport Map 지도와 사진, 모든 공유 링크. 삭제 후에는 보관하지 않아요 (개인을 알아볼 수 없는 접속 통계만 남아요)."}
        </p>
      </div>
      <div className="panel">
        {state === "done" ? (
          <p>{en ? "Your account has been deleted." : "계정을 삭제했어요. 그동안 이용해 주셔서 고마워요."}</p>
        ) : loading ? (
          <p className="muted">…</p>
        ) : !user ? (
          <>
            <p>{en ? "Sign in with the account you want to delete." : "삭제할 계정으로 먼저 로그인해 주세요."}</p>
            <LoginLink className="btn primary" next="/account/delete">
              {en ? "Sign in" : "로그인"}
            </LoginLink>
          </>
        ) : (
          <>
            <p>
              {en ? "Signed in as " : "현재 계정: "}
              <b>{user.email ?? "Kakao"}</b>
            </p>
            <button className="btn danger" onClick={run} disabled={state === "busy"}>
              {state === "busy" ? (en ? "Deleting…" : "삭제하는 중…") : armed ? (en ? "Press again to delete for good" : "한 번 더 누르면 영구 삭제돼요") : en ? "Delete my account" : "계정 삭제"}
            </button>
            {state === "error" && (
              <p className="notice err" style={{ marginTop: 12 }}>
                {en ? "Couldn't delete the account. Please try again later." : "계정을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요."}
              </p>
            )}
          </>
        )}
      </div>
      <p className="muted small" style={{ marginTop: 16 }}>
        <Link href="/privacy">{en ? "Privacy Policy" : "개인정보처리방침"}</Link>
      </p>
    </div>
  );
}
