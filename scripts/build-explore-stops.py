#!/usr/bin/env python3
"""탐험 지도 정류장 데이터 만들기 (공공데이터포털 파일 → 지도 타일별 JSON)

사용법:
  python3 scripts/build-explore-stops.py <전국도시철도역사정보표준데이터.xlsx|csv> <국토교통부_전국 버스정류장 위치정보.csv>

결과: public/games/explore-map/stops/<x>_<y>.json  (z14 타일, 수도권 시·군·구 경계 안만)
행 형식: [id, 종류(s 역|t 환승역|b 버스), 이름, 위도, 경도, 외곽(0|1), 노선목록(역만)]
"""
import csv, io, json, math, os, re, sys, shutil
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public/games/explore-map/stops")
Z = 14

def read_table(path):
    if path.lower().endswith((".xlsx", ".xls")):
        import openpyxl
        ws = openpyxl.load_workbook(path, read_only=True).worksheets[0]
        rows = [list(r) for r in ws.iter_rows(values_only=True)]
    else:
        raw = open(path, "rb").read()
        for enc in ("utf-8-sig", "cp949", "euc-kr"):
            try:
                text = raw.decode(enc); break
            except UnicodeDecodeError:
                continue
        rows = list(csv.reader(io.StringIO(text)))
    head = [str(h).strip() for h in rows[0]]
    return [dict(zip(head, r)) for r in rows[1:]]

# 수도권 시·군·구 경계 (점이 안에 있는지)
dist = json.load(open(os.path.join(ROOT, "public/games/explore-map/districts.json")))
polys = []
for f in dist["features"]:
    g = f["geometry"]
    ps = [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]
    for p in ps:
        xs = [c[0] for c in p[0]]; ys = [c[1] for c in p[0]]
        polys.append((min(xs), min(ys), max(xs), max(ys), p))

def pip(x, y, ring):
    ins = False; j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i]; xj, yj = ring[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            ins = not ins
        j = i
    return ins

def in_capital(lat, lng):
    for x0, y0, x1, y1, p in polys:
        if x0 <= lng <= x1 and y0 <= lat <= y1 and pip(lng, lat, p[0]) and not any(pip(lng, lat, h) for h in p[1:]):
            return True
    return False

def dist_m(a, b, c, d):
    r = math.pi / 180
    h = math.sin((c - a) * r / 2) ** 2 + math.cos(a * r) * math.cos(c * r) * math.sin((d - b) * r / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(h))

def tile(lat, lng):
    n = 2 ** Z; r = math.radians(lat)
    return int((lng + 180) / 360 * n), int((1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * n)

def num(v):
    try: return float(v)
    except (TypeError, ValueError): return None

rail_path, bus_path = sys.argv[1], sys.argv[2]
out = []

# ── 역: 같은 이름(괄호·'역' 제거)이 600m 안이면 한 역으로 합친다
groups = []
for r in read_table(rail_path):
    lat, lng = num(r.get("역위도")), num(r.get("역경도"))
    name = str(r.get("역사명") or "").strip()
    if not lat or not lng or not name or not in_capital(lat, lng):
        continue
    base = re.sub(r"\(.*?\)", "", name).strip()
    base = re.sub(r"역$", "", base).strip() or base
    line = re.sub(r"\s+", " ", str(r.get("노선명") or "").strip())
    g = next((g for g in groups if g["name"] == base and dist_m(g["lat"], g["lng"], lat, lng) < 600), None)
    if g is None:
        g = {"name": base, "lat": lat, "lng": lng, "pts": [], "lines": [], "flag": False, "id": str(r.get("역번호") or "")}
        groups.append(g)
    g["pts"].append((lat, lng))
    if line and line not in g["lines"]:
        g["lines"].append(line)
    if "환승" in str(r.get("환승역구분") or ""):
        g["flag"] = True
for g in groups:
    lat = sum(p[0] for p in g["pts"]) / len(g["pts"]); lng = sum(p[1] for p in g["pts"]) / len(g["pts"])
    kind = "t" if len(g["lines"]) >= 2 or g["flag"] else "s"
    out.append(["r" + (g["id"] or f"{lat:.4f}{lng:.4f}"), kind, g["name"] + "역", round(lat, 5), round(lng, 5), 0, g["lines"]])
rails = len(out)

# ── 버스정류장: 서울·인천·경기만
buses = []
for r in read_table(bus_path):
    city = str(r.get("도시명") or "")
    if not city.startswith(("서울", "인천", "경기")):
        continue
    lat, lng = num(r.get("위도")), num(r.get("경도"))
    if not lat or not lng or not in_capital(lat, lng):
        continue
    buses.append([str(r.get("정류장번호")), str(r.get("정류장명") or "").strip() or "이름 없는 정류장", lat, lng])

# 같은 정류장이 서울·경기 BIS 양쪽에 따로 올라온 경우: 같은 이름이 30m 안이면 하나만
grid = defaultdict(list)
kept = []
for b in buses:
    k = (int(b[2] / 0.0005), int(b[3] / 0.0006))
    dup = False
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            for o in grid.get((k[0] + dx, k[1] + dy), ()):
                if o[1] == b[1] and dist_m(o[2], o[3], b[2], b[3]) < 30:
                    dup = True
    if not dup:
        grid[k].append(b); kept.append(b)
buses = kept

# 외곽 판정: 반경 600m 안 다른 정류장이 3개 이하 (격자로 빠르게)
cell = defaultdict(list)
for i, b in enumerate(buses):
    cell[(int(b[2] / 0.006), int(b[3] / 0.0075))].append(i)
for i, b in enumerate(buses):
    cx, cy = int(b[2] / 0.006), int(b[3] / 0.0075)
    near = 0
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            for j in cell.get((cx + dx, cy + dy), ()):
                if j != i and dist_m(b[2], b[3], buses[j][2], buses[j][3]) < 600:
                    near += 1
    out.append(["b" + b[0], "b", b[1], round(b[2], 5), round(b[3], 5), 1 if near <= 3 else 0])

# ── 타일별로 저장
tiles = defaultdict(list)
for row in out:
    tiles[tile(row[3], row[4])].append(row)
if os.path.isdir(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT)
for (x, y), rows in tiles.items():
    with open(os.path.join(OUT, f"{x}_{y}.json"), "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(OUT, "index.json"), "w") as f:
    json.dump(sorted(f"{x}_{y}" for x, y in tiles), f, separators=(",", ":"))
size = sum(os.path.getsize(os.path.join(OUT, n)) for n in os.listdir(OUT))
print(f"stations {rails} (transfer {sum(1 for r in out if r[1]=='t')}), bus {len(buses)}, rural {sum(1 for r in out if r[1]=='b' and r[5])}, tiles {len(tiles)}, {size/1e6:.1f}MB")
