// 탐험 지도 공유 카드용 벌집 칸 목록 만들기
// 탐험률 단위(area)마다 H3 해상도 8 육각형 목록을 만든다 — 클라이언트(공유 데이터 인코딩)와 서버(카드 그리기)가 같은 순서를 쓴다.
//   서울 전체(11) · 인천 전체(23) · 경기는 시·군 (구가 있는 시는 앞 4자리로 묶음)
// 사용법: node scripts/build-explore-areas.mjs
import fs from "node:fs";
import path from "node:path";
import { polygonToCells } from "h3-js";

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const dist = JSON.parse(fs.readFileSync(path.join(root, "public/games/explore-map/districts.json"), "utf8"));
const areas = {};
for (const f of dist.features) {
  const { c, n } = f.properties;
  let key, name;
  if (c.startsWith("11")) [key, name] = ["11", "서울"];
  else if (c.startsWith("23")) [key, name] = ["23", "인천"];
  else {
    const m = n.match(/^(.+?시)(.+구)$/);
    [key, name] = m ? [c.slice(0, 4), m[1]] : [c, n];
  }
  const a = (areas[key] ??= { n: name, set: new Set() });
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const p of polys) for (const cell of polygonToCells(p, 8, true)) a.set.add(cell);
}
const out = {};
for (const [k, a] of Object.entries(areas)) out[k] = { n: a.n, cells: [...a.set].sort() };
const json = JSON.stringify(out);
fs.writeFileSync(path.join(root, "src/lib/explore-areas8.json"), json);
fs.writeFileSync(path.join(root, "public/games/explore-map/areas8.json"), json);
console.log(Object.keys(out).length, "areas,", Object.values(out).reduce((s, a) => s + a.cells.length, 0), "cells,", (json.length / 1024).toFixed(0) + "KB",
  "seoul", out["11"].cells.length, "incheon", out["23"].cells.length);
