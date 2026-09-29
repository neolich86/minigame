import Link from "next/link";
import { GAMES, gameById } from "@/lib/games";
import type { Lang } from "@/lib/i18n";
import { GAME_SEO, HOME_SECTIONS } from "@/lib/seo";

/** 게임 페이지 아래 소개 글 — 검색엔진이 읽을 수 있는 본문 + 같은 장르 게임 링크 */
export function GameAbout({ gameId, lang, subHeading }: { gameId: string; lang: Lang; subHeading?: boolean }) {
  const g = gameById(gameId);
  const seo = GAME_SEO[gameId]?.[lang];
  if (!g || !seo) return null;
  const related = GAMES.filter((x) => x.id !== g.id && x.genre === g.genre).concat(GAMES.filter((x) => x.id !== g.id && x.genre !== g.genre)).slice(0, 4);
  return (
    <section className="wrap mid game-about">
      {subHeading ? <h2 className="about-title">{seo.h1}</h2> : <h1>{seo.h1}</h1>}
      <div className="tag-row">
        {seo.tags.map((t) => (
          <span key={t} className="seo-tag">#{t}</span>
        ))}
      </div>
      {seo.about.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      <h2>{lang === "ko" ? "플레이 방법" : "How to play"}</h2>
      <ol>
        {seo.howTo.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      <h2>{lang === "ko" ? "다른 게임도 해보세요" : "More games"}</h2>
      <div className="related">
        {related.map((r) => (
          <Link key={r.id} href={r.online ? `/online/${r.id}` : `/play/${r.id}`} className="related-item">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={r.thumb} alt={r.title[lang]} loading="lazy" />
            <span>{r.title[lang]}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** 홈 화면 아래 장르별 소개 */
export function HomeAbout({ lang }: { lang: Lang }) {
  const s = HOME_SECTIONS[lang];
  return (
    <section className="wrap home-about">
      <h2>{s.heading}</h2>
      <div className="about-grid">
        {s.items.map((it) => (
          <div key={it.title} className="panel">
            <h3>{it.title}</h3>
            <p>{it.text}</p>
            <div className="about-links">
              {it.games.map((id) => {
                const g = gameById(id)!;
                return (
                  <Link key={id} href={g.online ? `/online/${id}` : `/play/${id}`}>
                    {g.title[lang]} →
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
