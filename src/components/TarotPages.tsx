// 타로 운세 — 카드 사전·신년운세 페이지에서 함께 쓰는 조각들 (서버 컴포넌트)
import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { ROMAN, TAROT_CARDS, cardImg, cardPath, type TarotCard } from "@/lib/tarot-cards";

/** 22장 그림 목록 — 카드 사전 링크 */
export function TarotCardGrid({ lang, caption }: { lang: Lang; caption?: (c: TarotCard) => string }) {
  return (
    <ul className="tarot-grid">
      {TAROT_CARDS.map((c) => (
        <li key={c.id}>
          <Link href={cardPath(c)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cardImg(c, 300)} alt={c.name[lang]} width={150} height={258} loading="lazy" />
            <span className="tarot-grid-num">{ROMAN[c.number]}</span>
            <b>{c.name[lang]}</b>
            {caption && <small>{caption(c)}</small>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function TarotCta({ lang, href = "/apps/tarot", label }: { lang: Lang; href?: string; label?: string }) {
  return (
    <p className="tarot-cta">
      <Link href={href} className="btn primary">
        🔮 {label ?? (lang === "ko" ? "타로 카드 직접 뽑아 보기" : "Draw your own tarot cards")}
      </Link>
    </p>
  );
}

export function Crumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav className="tarot-crumbs" aria-label="breadcrumb">
      {items.map((it, i) => (
        <span key={i}>
          {i > 0 && " › "}
          {it.href ? <Link href={it.href}>{it.name}</Link> : it.name}
        </span>
      ))}
    </nav>
  );
}
