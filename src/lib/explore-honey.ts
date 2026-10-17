// 공유 카드 오른쪽 벌집 지도 (SVG) — 서버에서만 사용
import { cellToBoundary } from "h3-js";
import areas from "./explore-areas8.json";
import { decodeHoney } from "./explore-share";

type Areas = Record<string, { n: string; cells: string[] }>;

export function honeySvg(areaKey: string, m: string, w: number, h: number): string | null {
  const area = (areas as Areas)[areaKey];
  if (!area) return null;
  const levels = decodeHoney(m);
  const k = Math.cos((37.5 * Math.PI) / 180);
  const polys = area.cells.map((c) => cellToBoundary(c).map(([lat, lng]) => [lng * k, -lat] as [number, number]));
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of polys) for (const [x, y] of p) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const s = Math.min(w / (x1 - x0), h / (y1 - y0));
  const ox = (w - (x1 - x0) * s) / 2, oy = (h - (y1 - y0) * s) / 2;
  const fill = ["#24324f", "#8a7440", "#c9a24a", "#f2c14e"];
  const parts: string[] = [];
  polys.forEach((p, i) => {
    const pts = p.map(([x, y]) => [ox + (x - x0) * s, oy + (y - y0) * s]);
    const cx = pts.reduce((a, q) => a + q[0], 0) / pts.length, cy = pts.reduce((a, q) => a + q[1], 0) / pts.length;
    const d = pts.map(([x, y]) => `${(cx + (x - cx) * 0.84).toFixed(1)},${(cy + (y - cy) * 0.84).toFixed(1)}`).join(" ");
    parts.push(`<polygon points="${d}" fill="${fill[levels.get(i) ?? 0]}"/>`);
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join("")}</svg>`;
}
