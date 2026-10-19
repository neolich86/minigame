import type { BadgeBook, Badge, L10n, Tier } from "./types";

// Passport Map 저장 데이터: { countries: { [ISO2]: Place }, cities: (Place & { cc })[] }
// Place: { from?, to?, more?: {from,to}[], photo?, memo? } — 날짜는 "YYYY-MM-DD"
type Visit = { from?: string; to?: string };
type Place = Visit & { more?: Visit[]; photo?: string; cc?: string };

export type PassportStats = {
  countries: number;
  cities: number;
  days: number; // 겹치는 기간은 한 번만 센 여행 일수
  continents: Set<string>;
  maxVisits: number; // 한 장소를 방문한 최대 횟수
  longest: number; // 한 번 방문한 최장 일수
  photos: number;
};

const DAY = 86400_000;
const visits = (o: Place): Visit[] => [{ from: o.from, to: o.to }, ...(Array.isArray(o.more) ? o.more : [])].filter((v) => v && typeof v.from === "string" && v.from);
const span = (v: Visit): [number, number] | null => {
  const a = Date.parse(v.from!);
  if (Number.isNaN(a)) return null;
  let b = Date.parse(v.to || v.from!);
  if (Number.isNaN(b) || b < a) b = a;
  return [a, b];
};
const len = ([a, b]: [number, number]) => Math.round((b - a) / DAY) + 1;

/* 대륙 (ISO 3166-1 alpha-2). 목록에 없는 나라는 아시아 */
const CONT: Record<string, string> = {};
const put = (c: string, ids: string) => ids.split(" ").forEach((i) => (CONT[i] = c));
put("EU", "VA GB JE GG IM UA CH SE SK SI RS SM RU RO PT PL NO NL ME MD MC MT MK LU LT LI LV XK IT IE IS HU GR DE FR AX FI EE DK FO CZ HR BG BA BE BY AT AD AL ES");
put("AF", "ZW ZM SH UG TN TG TZ SZ SS SD ZA SO XSomali SL SC SN ST RW NG NE NA MZ MA EH MU MR ML MW MG LY LR LS KE GW GN GH GM GA ET ER GQ EG DJ CI CD CG KM TD CF CV CM BI BF BW BJ AO DZ IO TF");
put("NA", "VI PR US AI KY BM VG TC MS TT VC LC KN PA NI MX JM HT HN GT GD PM MF BL SV DO DM GL CU CR CA BZ BB BS AG AW CW SX");
put("SA", "VE UY GS FK SR PE PY GY EC CO CL BR BO AR");
put("OC", "VU FM MH MP GU AS PN TO SB WS PG PW NZ NU CK NR KI PF NC WF FJ AU HM NF");
const continentOf = (id: string) => CONT[id] ?? "AS";

function stats(data: unknown): PassportStats | null {
  if (!data || typeof data !== "object") return null;
  const d = data as { countries?: Record<string, Place>; cities?: Place[] };
  const countries = d.countries && typeof d.countries === "object" ? d.countries : {};
  const cities = Array.isArray(d.cities) ? d.cities.filter((c) => c && typeof c === "object") : [];
  const places: Place[] = [...Object.values(countries), ...cities];
  const iv: [number, number][] = [];
  let maxVisits = 0, longest = 0, photos = 0;
  for (const p of places) {
    if (!p || typeof p !== "object") continue;
    const vs = visits(p);
    maxVisits = Math.max(maxVisits, vs.length);
    for (const v of vs) { const s = span(v); if (s) { iv.push(s); longest = Math.max(longest, len(s)); } }
    if (p.photo) photos++;
  }
  iv.sort((a, b) => a[0] - b[0]);
  let days = 0, cur: [number, number] | null = null;
  for (const s of iv) {
    if (!cur) cur = [...s];
    else if (s[0] <= cur[1] + DAY) cur[1] = Math.max(cur[1], s[1]);
    else { days += len(cur); cur = [...s]; }
  }
  if (cur) days += len(cur);
  const continents = new Set<string>();
  for (const id of Object.keys(countries)) continents.add(continentOf(id));
  for (const c of cities) if (typeof c.cc === "string" && c.cc) continents.add(continentOf(c.cc));
  return { countries: Object.keys(countries).length, cities: cities.length, days, continents, maxVisits, longest, photos };
}

const U = { day: { ko: "일", en: "days" }, country: { ko: "개국", en: "countries" }, city: { ko: "곳", en: "cities" }, cont: { ko: "개 대륙", en: "continents" }, photo: { ko: "장", en: "photos" }, visit: { ko: "번", en: "visits" } };
type B = Badge<PassportStats>;
const b = (id: string, icon: string, group: string, tier: Tier, goal: number, name: L10n, desc: L10n, value: B["value"], unit?: L10n): B => ({ id, icon, group, tier, goal, name, desc, value, unit });

const DAYS: [number, string, Tier, L10n][] = [
  [2, "🌙", "bronze", { ko: "1박 2일", en: "Overnighter" }],
  [7, "🧳", "bronze", { ko: "일주일 여행자", en: "One-week traveler" }],
  [10, "🎒", "silver", { ko: "열흘의 모험", en: "Ten-day adventure" }],
  [30, "🗓️", "silver", { ko: "30일 여행자", en: "30 days away" }],
  [50, "🚂", "silver", { ko: "50일 방랑자", en: "50-day wanderer" }],
  [100, "✈️", "gold", { ko: "100일 탐험가", en: "100-day explorer" }],
  [200, "🧭", "gold", { ko: "길 위의 사람", en: "Life on the road" }],
  [365, "🌏", "gold", { ko: "1년의 여정", en: "A year of travel" }],
  [500, "🛳️", "diamond", { ko: "세계 유랑자", en: "World nomad" }],
  [1000, "👑", "diamond", { ko: "천일의 여행", en: "A thousand days" }],
];
const COUNTRIES: [number, string, Tier, L10n][] = [
  [3, "🛂", "bronze", { ko: "세 나라 도장", en: "Three stamps" }],
  [5, "📘", "bronze", { ko: "여권 수집가", en: "Passport collector" }],
  [10, "🗺️", "silver", { ko: "열 나라 정복", en: "Ten countries" }],
  [20, "🏳️", "silver", { ko: "스무 나라", en: "Twenty countries" }],
  [30, "🌐", "gold", { ko: "세계 시민", en: "Global citizen" }],
  [50, "🏅", "gold", { ko: "50개국 달성", en: "Fifty countries" }],
  [100, "💎", "diamond", { ko: "100개국 전설", en: "Century club" }],
];
const CITIES: [number, string, Tier, L10n][] = [
  [5, "🏙️", "bronze", { ko: "도시 산책", en: "City stroller" }],
  [10, "🌆", "silver", { ko: "도시 수집가", en: "City collector" }],
  [30, "🌃", "silver", { ko: "도시 여행 고수", en: "City hopper" }],
  [50, "🏰", "gold", { ko: "50개 도시", en: "Fifty cities" }],
  [100, "🗼", "diamond", { ko: "100개 도시 전설", en: "Hundred cities" }],
];
const CONTS: [string, string, L10n][] = [
  ["AS", "🏯", { ko: "아시아", en: "Asia" }],
  ["EU", "🏛️", { ko: "유럽", en: "Europe" }],
  ["NA", "🗽", { ko: "북아메리카", en: "North America" }],
  ["SA", "🦙", { ko: "남아메리카", en: "South America" }],
  ["AF", "🦁", { ko: "아프리카", en: "Africa" }],
  ["OC", "🦘", { ko: "오세아니아", en: "Oceania" }],
];

export const PASSPORT_BOOK: BadgeBook<PassportStats> = {
  id: "passport-map",
  gameId: "passport-map",
  title: { ko: "Passport Map", en: "Passport Map" },
  icon: "🌍",
  href: "/apps/passport-map",
  empty: { ko: "Passport Map에 다녀온 나라와 여행 날짜를 기록하면 뱃지가 모여요.", en: "Log countries and trip dates in Passport Map to collect badges." },
  groups: [
    { id: "first", name: { ko: "첫 걸음", en: "First steps" } },
    { id: "days", name: { ko: "여행 기간", en: "Days traveled" } },
    { id: "countries", name: { ko: "나라", en: "Countries" } },
    { id: "cities", name: { ko: "도시", en: "Cities" } },
    { id: "continents", name: { ko: "대륙", en: "Continents" } },
    { id: "special", name: { ko: "특별", en: "Special" } },
  ],
  stats,
  badges: [
    b("first-country", "🛫", "first", "bronze", 1, { ko: "첫 나라", en: "First country" }, { ko: "처음으로 나라를 기록했어요", en: "Log your first country" }, (s) => s.countries, U.country),
    b("first-city", "📍", "first", "bronze", 1, { ko: "첫 도시", en: "First city" }, { ko: "처음으로 도시를 기록했어요", en: "Log your first city" }, (s) => s.cities, U.city),
    b("first-trip", "📅", "first", "bronze", 1, { ko: "첫 여행 날짜", en: "First trip date" }, { ko: "방문 날짜를 처음 기록했어요", en: "Add your first trip date" }, (s) => s.days, U.day),
    ...DAYS.map(([n, icon, tier, name]) => b(`days-${n}`, icon, "days", tier, n, name, { ko: `여행 기간 합계 ${n}일 (겹치는 날은 한 번만)`, en: `${n} days of travel in total (overlaps count once)` }, (s) => s.days, U.day)),
    ...COUNTRIES.map(([n, icon, tier, name]) => b(`countries-${n}`, icon, "countries", tier, n, name, { ko: `${n}개 나라를 기록`, en: `Log ${n} countries` }, (s) => s.countries, U.country)),
    ...CITIES.map(([n, icon, tier, name]) => b(`cities-${n}`, icon, "cities", tier, n, name, { ko: `${n}개 도시를 기록`, en: `Log ${n} cities` }, (s) => s.cities, U.city)),
    ...CONTS.map(([c, icon, name]) => b(`cont-${c}`, icon, "continents", "bronze", 1, name, { ko: `${name.ko}의 나라나 도시를 기록`, en: `Log a place in ${name.en}` }, (s) => (s.continents.has(c) ? 1 : 0))),
    b("cont-3", "🧭", "continents", "gold", 3, { ko: "세 대륙", en: "Three continents" }, { ko: "3개 대륙을 여행", en: "Travel to 3 continents" }, (s) => s.continents.size, U.cont),
    b("cont-6", "🌎", "continents", "diamond", 6, { ko: "모든 대륙", en: "Every continent" }, { ko: "6개 대륙을 모두 여행", en: "Travel to all 6 continents" }, (s) => s.continents.size, U.cont),
    b("revisit-3", "💞", "special", "silver", 3, { ko: "단골 여행지", en: "Favorite place" }, { ko: "같은 나라나 도시를 3번 방문", en: "Visit the same place 3 times" }, (s) => s.maxVisits, U.visit),
    b("long-30", "🏡", "special", "gold", 30, { ko: "한 달 살기", en: "Live like a local" }, { ko: "한 번의 방문으로 30일 이상 머물기", en: "Stay 30+ days in one visit" }, (s) => s.longest, U.day),
    b("photo-10", "📸", "special", "silver", 10, { ko: "사진 기록가", en: "Photo keeper" }, { ko: "장소 10곳에 사진 남기기", en: "Add photos to 10 places" }, (s) => s.photos, U.photo),
  ],
};
