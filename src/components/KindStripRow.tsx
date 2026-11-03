"use client";
// 홈의 추첨·도구 / 서비스 줄 — 하트 많은 순으로 (같으면 원래 순서)
import Link from "next/link";
import { useMemo } from "react";
import { entryPath, itemsOf, type Kind } from "@/lib/games";
import { useLikes } from "@/lib/likes";
import type { Lang } from "@/lib/i18n";

export function KindStripRow({ kind, lang }: { kind: Exclude<Kind, "game">; lang: Lang }) {
  const { counts } = useLikes();
  const items = useMemo(() => itemsOf(kind).map((g, i) => ({ g, i, n: counts[g.id] ?? 0 })).sort((a, b) => b.n - a.n || a.i - b.i).map((x) => x.g), [kind, counts]);
  return (
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
  );
}
