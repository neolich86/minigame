import type { Metadata } from "next";

// 내 정보는 로그인한 사람마다 다른 화면 — 검색에 노출하지 않는다
export const metadata: Metadata = { title: "My page", robots: { index: false, follow: false } };

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
