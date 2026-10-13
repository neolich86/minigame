"use client";

import Link from "next/link";
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
          ? "Deleting your account permanently removes your profile, game records, Passport Map data and photos, and any public map links. This cannot be undone."
          : "계정을 삭제하면 프로필, 게임 기록, Passport Map 지도와 사진, 공개 지도 링크가 모두 영구히 지워지고 되돌릴 수 없어요."}
      </p>
      <div className="panel">
        {state === "done" ? (
          <p>{en ? "Your account has been deleted." : "계정을 삭제했어요. 그동안 이용해 주셔서 고마워요."}</p>
        ) : loading ? (
          <p className="muted">…</p>
        ) : !user ? (
          <>
            <p>{en ? "Sign in with the account you want to delete." : "삭제할 계정으로 먼저 로그인해 주세요."}</p>
            <Link className="btn primary" href="/login?next=/account/delete">
              {en ? "Sign in" : "로그인"}
            </Link>
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
