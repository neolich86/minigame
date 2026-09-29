import { GameList } from "@/components/GameList";
import { GAMES } from "@/lib/games";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://minigame-heaven.vercel.app";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "미니 게임 천국 | Mini Game Heaven",
    url: SITE_URL,
    inLanguage: ["ko", "en"],
    hasPart: GAMES.map((g) => ({
      "@type": "VideoGame",
      name: g.title.ko,
      alternateName: g.title.en,
      url: `${SITE_URL}/play/${g.id}`,
      applicationCategory: "Game",
      operatingSystem: "Web Browser",
    })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GameList />
    </>
  );
}
