// 정적 게임(iframe)이 MGH.rpc(name, params) 로 부를 수 있는 Supabase RPC 목록 — 게임별 허용 목록
// 로그인한 사용자 세션으로 호출되므로 RPC 안에서 auth.uid() 가 그 사용자다.
export const GAME_RPC: Record<string, readonly string[]> = {
  "dongne-note": [
    "dn_memos_in_view",
    "dn_memo",
    "dn_comments",
    "dn_me",
    "dn_set_animal",
    "dn_post_memo",
    "dn_delete_memo",
    "dn_toggle_like",
    "dn_add_comment",
    "dn_delete_comment",
    "dn_report",
  ],
};
