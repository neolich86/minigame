// 서킷 메이커 — 기본 제공 맵. 거북이(turtle) 명령으로 코스를 깔고, 빈 칸에 장식을 뿌린다.
import { cellsOf, DECOS } from "./track.js?v=2";

const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
function rotCell(cx, cy, k, r) {
  let x = cx + 0.5, y = cy + 0.5;
  for (let i = 0; i < r; i++) [x, y] = [k - y, x];
  return [Math.floor(x), Math.floor(y)];
}

/**
 * cmds: "S"(직선) "F"(출발선) "X"(교차로) "R1".."R3" / "L1".."L3"(오른/왼 코너, 크기) — 숫자 접두로 반복: "3S"
 * 출발 칸 (x,y)과 방향 d 에서 시작
 */
export function turtle(x, y, d, cmds) {
  const tiles = [];
  const seen = new Map();
  for (let raw of cmds.trim().split(/\s+/)) {
    let rep = 1;
    const m = raw.match(/^(\d+)([A-Z]\d?)$/);
    if (m) { rep = +m[1]; raw = m[2]; }
    for (let n = 0; n < rep; n++) {
      if (raw === "S" || raw === "F" || raw === "X") {
        const key = x + "," + y;
        if (raw === "X" || seen.has(key)) {
          // 교차로: 이미 지나간 칸이면 그 칸을 교차로로 바꾼다
          const prev = seen.get(key);
          if (prev) { prev.t = "cross"; prev.r = 0; }
          else { const t = { t: "cross", x, y, r: 0 }; tiles.push(t); seen.set(key, t); }
        } else {
          const t = raw === "F" ? { t: "start", x, y, r: d } : { t: "straight", x, y, r: d % 2 };
          tiles.push(t);
          seen.set(key, t);
        }
        x += DX[d]; y += DY[d];
      } else {
        const right = raw[0] === "R", k = +raw[1];
        const type = "c" + k;
        let r, inL, outL, nd;
        if (right) { r = d; inL = [0, k - 1]; outL = [k - 1, 0]; nd = (d + 1) % 4; }
        else { r = (d + 1) % 4; inL = [k - 1, 0]; outL = [0, k - 1]; nd = (d + 3) % 4; }
        const [ix, iy] = rotCell(inL[0], inL[1], k, r);
        const ox0 = x - ix, oy0 = y - iy;
        const t = { t: type, x: ox0, y: oy0, r };
        tiles.push(t);
        for (const [cx, cy] of cellsOf(t)) seen.set(cx + "," + cy, t);
        const [ex, ey] = rotCell(outL[0], outL[1], k, r);
        d = nd;
        x = ox0 + ex + DX[d]; y = oy0 + ey + DY[d];
      }
    }
  }
  tiles.end = { x, y, d };
  return tiles;
}

// 결정적 난수
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function decorate(map, seed, density = 0.16, extra = []) {
  const occ = new Set();
  for (const p of map.tiles) for (const [cx, cy] of cellsOf(p)) occ.add(cx + "," + cy);
  const near = (x, y) => { for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) if (occ.has(x + i + "," + (y + j))) return true; return false; };
  for (const e of extra) { map.tiles.push(e); for (const [cx, cy] of cellsOf(e)) occ.add(cx + "," + cy); }
  const R = rng(seed);
  const trees = map.theme === "snow" ? ["pine", "pine", "treeSmall"] : ["treeLarge", "treeSmall", "pine", "tree"];
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
    if (occ.has(x + "," + y)) continue;
    const nr = near(x, y);
    if (R() < (nr ? density * 0.5 : density * 1.6)) {
      map.tiles.push({ t: trees[(R() * trees.length) | 0], x, y, r: (R() * 4) | 0 });
      occ.add(x + "," + y);
    }
  }
  return map;
}

function make(id, name, w, h, theme, start, cmds, seed, extra, density) {
  const tiles = turtle(start[0], start[1], start[2], cmds);
  return decorate({ id, v: 1, name, w, h, theme, tiles }, seed, density, extra);
}

export function builtinMaps() {
  return [
    make("oval", { ko: "그린 오벌", en: "Green Oval" }, 12, 8, "grass", [5, 6, 3],
      "F 2S R2 2S R2 6S R2 2S R2 3S", 11,
      [{ t: "grandStand", x: 4, y: 7, r: 0 }, { t: "grandStand", x: 5, y: 7, r: 0 }, { t: "grandStandCovered", x: 6, y: 7, r: 0 }, { t: "pitsGarage", x: 5, y: 3, r: 2 }, { t: "pitsOffice", x: 6, y: 3, r: 2 }, { t: "boost", x: 6, y: 1, r: 1 }]),
    make("eight", { ko: "8자 교차로", en: "Figure Eight" }, 13, 13, "grass", [6, 9, 0],
      "F 2S X 2S R2 2S R2 S R2 3S X 2S L2 2S L2 S L2", 23,
      [{ t: "grandStandCovered", x: 7, y: 9, r: 3 }, { t: "grandStand", x: 7, y: 8, r: 3 }, { t: "billboard", x: 5, y: 9, r: 1 }, { t: "boost", x: 6, y: 4, r: 0 }, { t: "boost", x: 4, y: 6, r: 1 }]),
    make("canyon", { ko: "사막 협곡", en: "Desert Canyon" }, 16, 12, "sand", [6, 9, 1],
      "F 5S L3 3S L2 2S L1 R1 S R1 L1 3S L2 4S L2 S", 37,
      [{ t: "tent", x: 7, y: 10, r: 0 }, { t: "tent", x: 8, y: 10, r: 0 }, { t: "tent", x: 9, y: 10, r: 0 }, { t: "radar", x: 6, y: 7, r: 0 }, { t: "bannerRed", x: 6, y: 8, r: 0 }, { t: "boost", x: 14, y: 5, r: 0 }, { t: "boost", x: 3, y: 5, r: 0 }], 0.1),
    make("alpine", { ko: "알파인 서킷", en: "Alpine Circuit" }, 18, 14, "snow", [8, 11, 3],
      "F 3S R3 2S R2 2S L1 S R2 5S R3 2S R2 2S L1 S R2 S", 51,
      [{ t: "grandStandCovered", x: 5, y: 12, r: 0 }, { t: "grandStandCovered", x: 6, y: 12, r: 0 }, { t: "grandStand", x: 7, y: 12, r: 0 }, { t: "grandStand", x: 8, y: 12, r: 0 }, { t: "pitsGarage", x: 6, y: 10, r: 2 }, { t: "pitsOffice", x: 7, y: 10, r: 2 }, { t: "lightPost", x: 9, y: 12, r: 0 }, { t: "boost", x: 10, y: 2, r: 1 }]),
  ];
}

export const BLANK = (w = 14, h = 10) => ({ v: 1, name: "", w, h, theme: "grass", tiles: [] });
export { DECOS };
