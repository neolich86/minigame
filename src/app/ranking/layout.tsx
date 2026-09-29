import type { Metadata } from "next";
import { langAlternates, serverLang } from "@/lib/serverLang";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, fromParam } = await serverLang();
  return {
    title: lang === "ko" ? "게임 랭킹 - 뱀서·방치형·타워디펜스·슈팅 최고 기록" : "Leaderboards - Top Scores for Every Game",
    description:
      lang === "ko"
        ? "미니 게임 천국 게임별 전체 랭킹. 궁수 서바이버 생존 시간, 랜덤 타워 디펜스 도달 라운드, 무기 강화 최고 레벨, 스카이 스트라이크 점수 등 최고 기록을 확인하세요."
        : "Leaderboards for every Mini Game Heaven game — survival time, rounds reached, best enhance level, high scores and more.",
    alternates: langAlternates("/ranking", lang, fromParam),
  };
}

export default function RankingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
