// 리포트 요약 — public/games/my-post-2026/index.html 의 buildReport() 와 같은 규칙 (공유 이미지·메타 설명용)
import type { MyPostData } from "./mypost";

type Post = MyPostData["posts"][number];
const KST = 9 * 3600e3;

export function rankBest(posts: Post[]) {
  return posts
    .map((p, i) => ({ p, i }))
    .filter((x) => x.p.l != null)
    .sort((a, b) => b.p.l! - a.p.l! || b.p.c - a.p.c || b.p.t - a.p.t)
    .slice(0, 9);
}

export const MONTH_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function summarize(d: MyPostData) {
  const counted = d.posts.filter((p) => p.l != null);
  const total = counted.reduce((s, p) => s + (p.l ?? 0), 0);
  const avg = counted.length ? Math.round(total / counted.length) : 0;
  const best = rankBest(d.posts).map((x) => x.p);
  const byMonth = Array.from({ length: 12 }, () => ({ likes: 0, posts: 0 }));
  const format = { IMAGE: 0, CAROUSEL: 0, REELS: 0 };
  for (const p of d.posts) {
    const m = new Date(p.t + KST).getUTCMonth();
    byMonth[m].posts++;
    byMonth[m].likes += p.l ?? 0;
    format[p.f]++;
  }
  const topMonth = byMonth.reduce((bi, v, i, a) => (v.likes > a[bi].likes ? i : bi), 0);
  const busyMonth = byMonth.reduce((bi, v, i, a) => (v.posts > a[bi].posts ? i : bi), 0);
  const n = d.posts.length || 1;
  const activeMonths = byMonth.filter((v) => v.posts > 0).length;
  let title = "피드 큐레이터";
  if (format.REELS / n >= 0.6) title = "릴스 장인";
  else if (best[0] && avg && best[0].l! >= avg * 5) title = "한 방의 주인공";
  else if (activeMonths >= 10) title = "꾸준함의 아이콘";
  else if (byMonth[busyMonth].posts / n >= 0.4) title = `${busyMonth + 1}월의 폭주기관차`;
  else if (format.CAROUSEL / n >= 0.5) title = "캐러셀 스토리텔러";
  const lastMonth = new Date(d.at + KST).getUTCMonth();
  return { posts: d.posts.length, total, avg, best, topMonth, title, lastMonth };
}
