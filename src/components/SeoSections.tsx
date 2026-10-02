import Link from "next/link";
import { GAMES, KIND_INDEX, entryPath, gameById, itemsOf, kindOf, type Kind } from "@/lib/games";
import type { Lang } from "@/lib/i18n";
import { GAME_SEO, HOME_SECTIONS, KIND_SEO } from "@/lib/seo";

/** 게임 페이지 아래 소개 글 — 검색엔진이 읽을 수 있는 본문 + 같은 장르 게임 링크 */
export function GameAbout({ gameId, lang, subHeading }: { gameId: string; lang: Lang; subHeading?: boolean }) {
  const g = gameById(gameId);
  const seo = GAME_SEO[gameId]?.[lang];
  if (!g || !seo) return null;
  const kind = kindOf(g);
  const isGame = kind === "game";
  // 같은 구분(게임/도구/서비스) 안에서 같은 장르를 먼저, 모자라면 게임으로 채운다
  const same = GAMES.filter((x) => x.id !== g.id && kindOf(x) === kind);
  const related = same
    .filter((x) => x.genre === g.genre)
    .concat(same.filter((x) => x.genre !== g.genre))
    .concat(isGame ? [] : itemsOf("game"))
    .slice(0, 4);
  return (
    // 게임 화면을 가리지 않도록 기본은 접힌 상태 — 눌러서 펼친다 (내용은 HTML에 그대로 있어 검색엔진이 읽는다)
    <details className="wrap mid game-about">
      <summary>
        {subHeading ? <h2 className="about-title">{seo.h1}</h2> : <h1>{seo.h1}</h1>}
        <span className="about-toggle" aria-hidden="true">
          <span className="when-closed">{lang === "ko" ? (isGame ? "게임 소개 펼치기" : "소개 펼치기") : "Show details"}</span>
          <span className="when-open">{lang === "ko" ? "접기" : "Hide"}</span>
        </span>
      </summary>
      <div className="tag-row">
        {seo.tags.map((t) => (
          <span key={t} className="seo-tag">#{t}</span>
        ))}
      </div>
      {seo.about.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      <h2>{lang === "ko" ? (isGame ? "플레이 방법" : "사용 방법") : isGame ? "How to play" : "How to use"}</h2>
      <ol>
        {seo.howTo.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      <h2>{lang === "ko" ? (isGame ? "다른 게임도 해보세요" : "이것도 둘러보세요") : isGame ? "More games" : "More to explore"}</h2>
      <div className="related">
        {related.map((r) => (
          <Link key={r.id} href={entryPath(r)} className="related-item">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={r.thumb} alt={r.title[lang]} loading="lazy" />
            <span>{r.title[lang]}</span>
          </Link>
        ))}
      </div>
    </details>
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
                  <Link key={id} href={entryPath(g)}>
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

/** 홈 화면에서 추첨·도구 / 서비스를 짧게 소개하는 줄 — 전체 목록은 /tools · /apps */
export function KindStrip({ kind, lang }: { kind: Exclude<Kind, "game">; lang: Lang }) {
  const items = itemsOf(kind);
  if (!items.length) return null;
  const seo = KIND_SEO[kind][lang];
  return (
    <section className="wrap kind-strip">
      <div className="kind-strip-head">
        <h2>
          {kind === "tool" ? "🎲" : "🧭"} {seo.heading}
        </h2>
        <Link href={KIND_INDEX[kind]} className="kind-strip-all">
          {lang === "ko" ? "전체 보기" : "See all"} →
        </Link>
      </div>
      <p className="kind-strip-sub">{seo.subtitle}</p>
      <div className="kind-strip-row">
        {items.map((g) => (
          <Link key={g.id} href={entryPath(g)} className="kind-chip">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.thumb} alt={g.title[lang]} loading="lazy" />
            <span>
              <b>{g.title[lang]}</b>
              <small>{g.desc[lang]}</small>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** 추첨·도구 / 서비스 목록 페이지 아래 소개 글 */
export function KindAbout({ kind, lang }: { kind: Exclude<Kind, "game">; lang: Lang }) {
  const seo = KIND_SEO[kind][lang];
  return (
    <section className="wrap home-about">
      <h2>{lang === "ko" ? `${seo.heading} 소개` : `About ${seo.heading}`}</h2>
      {seo.about.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      <div className="about-links">
        <Link href="/">{lang === "ko" ? "🎮 게임 보러 가기 →" : "🎮 Browse games →"}</Link>
      </div>
    </section>
  );
}
