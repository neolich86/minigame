// 탐험 지도 — 체크인할 수 있는 지하철역·버스정류장 (OpenStreetMap / Overpass API)
// 지도를 z14 타일(약 2km 사각형) 단위로 나눠 가져오고, 응답은 CDN 에 30일 캐시한다.

export const STOP_ZOOM = 14;

/** 열린 지역 — 1단계: 수도권(서울·인천·경기). 단계가 늘면 상자만 추가한다. */
export const OPEN_REGIONS: { id: string; s: number; w: number; n: number; e: number }[] = [
  { id: "capital", s: 36.85, w: 124.5, n: 38.35, e: 127.9 },
];

export type StopKind = "s" | "t" | "b"; // 역 · 환승역 · 버스정류장
/** [id, 종류, 이름, 위도, 경도, 외곽(1)] */
export type StopRow = [string, StopKind, string, number, number, 0 | 1];

export function tileBounds(x: number, y: number, z = STOP_ZOOM) {
  const n = 2 ** z;
  const lng = (v: number) => (v / n) * 360 - 180;
  const lat = (v: number) => (Math.atan(Math.sinh(Math.PI * (1 - (2 * v) / n))) * 180) / Math.PI;
  return { w: lng(x), e: lng(x + 1), n: lat(y), s: lat(y + 1) };
}

export function tileIsOpen(x: number, y: number, z = STOP_ZOOM) {
  const b = tileBounds(x, y, z);
  return OPEN_REGIONS.some((r) => b.s < r.n && b.n > r.s && b.w < r.e && b.e > r.w);
}

const ENDPOINTS = (process.env.OVERPASS_URL || "https://overpass-api.de/api/interpreter,https://overpass.kumi.systems/api/interpreter,https://overpass.private.coffee/api/interpreter")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

interface OsmNode {
  type: string;
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

function query(b: { s: number; w: number; n: number; e: number }) {
  // 버스는 주변 밀도(외곽 판정)를 보려고 타일보다 600m 정도 넓게 가져온다
  const p = 0.006;
  const bb = `${b.s.toFixed(5)},${b.w.toFixed(5)},${b.n.toFixed(5)},${b.e.toFixed(5)}`;
  const wide = `${(b.s - p).toFixed(5)},${(b.w - p).toFixed(5)},${(b.n + p).toFixed(5)},${(b.e + p).toFixed(5)}`;
  return `[out:json][timeout:25];(
node["highway"="bus_stop"](${wide});
node["public_transport"="platform"]["bus"="yes"](${wide});
node["railway"~"^(station|halt)$"](${bb});
node["public_transport"="station"]["subway"="yes"](${bb});
node["public_transport"="station"]["train"="yes"](${bb});
);out body;`;
}

async function overpass(q: string): Promise<OsmNode[]> {
  const errs: string[] = [];
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded", "user-agent": "playwithme.kr explore-map (contact via site)" },
        body: "data=" + encodeURIComponent(q),
        signal: AbortSignal.timeout(20000),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 120).replace(/\s+/g, " ")}`);
      const j = (await res.json()) as { elements?: OsmNode[] };
      return (j.elements ?? []).filter((e) => e.type === "node");
    } catch (e) {
      errs.push(`${new URL(url).host}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  throw new Error(errs.join(" | ") || "overpass_failed");
}

const R = 6371000;
export function distM(aLat: number, aLng: number, bLat: number, bLng: number) {
  const r = Math.PI / 180;
  const dLat = (bLat - aLat) * r;
  const dLng = (bLng - aLng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const cleanStation = (n: string) => n.replace(/\s*\(.*?\)\s*/g, "").replace(/역$/, "").trim();
const round = (v: number) => Math.round(v * 1e5) / 1e5;

/** OSM 노드 → 체크인 지점 목록 (중복 정리·환승역·외곽 판정) */
export function toStops(nodes: OsmNode[], b: { s: number; w: number; n: number; e: number }): StopRow[] {
  const inTile = (n: OsmNode) => n.lat >= b.s && n.lat < b.n && n.lon >= b.w && n.lon < b.e;
  const name = (n: OsmNode) => (n.tags?.["name:ko"] || n.tags?.name || "").trim();
  const isRail = (n: OsmNode) => {
    const t = n.tags ?? {};
    return t.railway === "station" || t.railway === "halt" || (t.public_transport === "station" && (t.subway === "yes" || t.train === "yes" || t.light_rail === "yes"));
  };
  const rails = nodes.filter((n) => isRail(n) && name(n));
  const buses = nodes.filter((n) => !isRail(n) && (n.tags?.highway === "bus_stop" || n.tags?.bus === "yes"));

  // 역: 같은 이름이 400m 안에 여러 개면(노선별 노드) 하나로 합치고 환승역으로 본다
  const groups: { name: string; nodes: OsmNode[] }[] = [];
  for (const n of rails) {
    const nm = cleanStation(name(n));
    if (!nm) continue;
    const g = groups.find((x) => x.name === nm && distM(x.nodes[0].lat, x.nodes[0].lon, n.lat, n.lon) < 400);
    if (g) g.nodes.push(n);
    else groups.push({ name: nm, nodes: [n] });
  }
  const out: StopRow[] = [];
  for (const g of groups) {
    const lat = g.nodes.reduce((a, n) => a + n.lat, 0) / g.nodes.length;
    const lng = g.nodes.reduce((a, n) => a + n.lon, 0) / g.nodes.length;
    if (!(lat >= b.s && lat < b.n && lng >= b.w && lng < b.e)) continue;
    const id = "r" + Math.min(...g.nodes.map((n) => n.id));
    out.push([id, g.nodes.length >= 2 ? "t" : "s", g.name + "역", round(lat), round(lng), 0]);
  }

  // 버스: 같은 이름이 25m 안이면 하나로 (정류장 표지·승강장 노드 중복)
  const kept: OsmNode[] = [];
  for (const n of buses) {
    const nm = name(n);
    if (kept.some((k) => name(k) === nm && distM(k.lat, k.lon, n.lat, n.lon) < 25)) continue;
    kept.push(n);
  }
  for (const n of kept) {
    if (!inTile(n)) continue;
    // 외곽: 반경 600m 안 다른 정류장이 3개 이하
    let near = 0;
    for (const k of kept) if (k !== n && distM(k.lat, k.lon, n.lat, n.lon) < 600 && ++near > 3) break;
    out.push(["b" + n.id, "b", name(n) || "이름 없는 정류장", round(n.lat), round(n.lon), near <= 3 ? 1 : 0]);
  }
  return out;
}

export async function stopsForTile(x: number, y: number): Promise<StopRow[]> {
  const b = tileBounds(x, y);
  return toStops(await overpass(query(b)), b);
}
