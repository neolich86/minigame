// 오늘 뭐 읽지? — 도서관 정보나루에서 책을 모아 public/games/book-pick/catalog.json 을 만든다.
// GitHub Actions(.github/workflows/book-catalog.yml)에서 매일 실행. 인증키는 환경변수 DATA4LIBRARY_KEY (GitHub Secrets) — 저장소에 적지 않는다.
// 하루 호출 한도가 있어 책별 상세(키워드·추천도서)는 data/book-pick/cache.json 에 쌓아 가며 날마다 조금씩 채운다.
//   node scripts/book-catalog.mjs            (MAX_CALLS=900 기본)
import fs from 'fs';
import path from 'path';

const KEY = (process.env.DATA4LIBRARY_KEY || '').trim();
if (!KEY) { console.error('DATA4LIBRARY_KEY 가 없어요'); process.exit(1); }
const MAX_CALLS = +(process.env.MAX_CALLS || 490); // IP 등록 없이 하루 500건까지 (GitHub Actions 는 IP 가 바뀌어 등록 불가)
const ROOT = path.resolve(import.meta.dirname, '..');
const CACHE = path.join(ROOT, 'data/book-pick/cache.json');
const OUT = path.join(ROOT, 'public/games/book-pick/catalog.json');
const API = 'http://data4library.kr/api/';

let calls = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(name, params) {
  if (calls >= MAX_CALLS) throw new Error('budget');
  calls++;
  const q = new URLSearchParams({ authKey: KEY, format: 'json', ...params });
  for (let t = 0; t < 3; t++) {
    try {
      const r = await fetch(`${API}${name}?${q}`, { signal: AbortSignal.timeout(20000) });
      const txt = await r.text();
      let j; try { j = JSON.parse(txt); } catch { throw new Error(`not json: ${txt.slice(0, 160)}`); }
      if (j.response && j.response.error) throw new Error(`api error: ${j.response.error}`);
      await sleep(120);
      return j.response || j;
    } catch (e) {
      if (String(e.message).startsWith('api error')) { if (/500건|IP 등록|한도|초과/.test(e.message)) calls = MAX_CALLS; throw e; }
      if (t === 2) throw e;
      await sleep(1500 * (t + 1));
    }
  }
}
const docs = (r) => (r && r.docs ? r.docs.map((d) => d.doc || d) : []);

/* ───── 칩 ↔ 정보나루 키워드 (동의어 사전) ───── */
const SYN = {
  sf: ['SF', '과학소설', '공상과학', '우주선', '외계인', '로봇', '미래사회'],
  fantasy: ['판타지', '마법사', '마법', '용', '요정', '이세계', '마녀'],
  mystery: ['추리', '미스터리', '탐정', '수수께끼', '추리소설', '살인사건'],
  thriller: ['스릴러', '서스펜스', '긴장', '추격', '사이코패스', '연쇄살인'],
  romance: ['로맨스', '연애', '연인'],
  horror: ['공포', '호러', '귀신', '유령', '괴담', '저주', '악령'],
  dystopia: ['디스토피아', '전체주의', '빅브라더', '감시사회'],
  apocalypse: ['종말', '멸망', '재난', '생존', '아포칼립스', '전염병', '바이러스'],
  time: ['시간여행', '타임머신', '타임슬립', '타임루프', '회귀'],
  space: ['우주', '행성', '은하', '우주선', '외계'],
  ai: ['인공지능', 'AI', '로봇', '안드로이드', '기계'],
  zombie: ['좀비', '감염'],
  magic: ['마법', '마법사', '마녀', '주문'],
  revenge: ['복수', '응징', '원한'],
  crime: ['범죄', '살인', '형사', '경찰', '사건', '범인'],
  war: ['전쟁', '전투', '군인', '독립운동', '한국전쟁', '세계대전'],
  family: ['가족', '엄마', '아버지', '어머니', '아빠', '부모', '형제', '자매'],
  friend: ['우정', '친구'],
  love: ['사랑', '첫사랑', '연애', '연인'],
  growth: ['성장', '청춘', '소년', '소녀', '사춘기', '꿈'],
  animal: ['동물', '고양이', '강아지', '개', '새'],
  travel: ['여행', '여행기', '세계여행', '배낭여행'],
  food: ['음식', '요리', '맛집', '식당', '레시피'],
  work: ['직장', '회사', '직장인', '사무실', '일'],
  death: ['죽음', '죽은', '애도', '상실', '이별'],
  society: ['사회', '불평등', '차별', '계급', '자본주의', '노동', '인권'],
  healing: ['힐링', '위로', '치유', '휴식', '쉼'],
  funny: ['유머', '웃음', '코믹', '재미'],
  tearful: ['눈물', '감동', '슬픔', '이별'],
  chilling: ['소름', '공포', '오싹', '섬뜩'],
  twist: ['반전', '비밀', '진실'],
  calm: ['일상', '잔잔', '평범', '산책', '계절'],
  thinky: ['철학', '사유', '존재', '삶의 의미', '성찰'],
  warm: ['따뜻', '온기', '다정', '행복', '희망'],
  dark: ['어둠', '절망', '폭력', '고독', '광기'],
  easy: ['재미', '유쾌', '가볍', '짧은'],
  immersive: ['몰입', '긴장', '흥미진진', '모험'],
  short: ['단편', '단편집', '단편소설', '소설집'],
  long: ['장편', '장편소설', '대하소설'],
};
// 테마 칩마다 도서 검색에 쓸 대표 낱말 (대출순 상위를 후보로 모은다)
const SEARCH = ['디스토피아', '종말', '시간여행', '우주', '인공지능', '좀비', '마법', '복수', '범죄', '전쟁', '가족', '우정', '첫사랑', '성장', '고양이', '여행', '요리', '직장', '죽음', '불평등',
  '힐링', '위로', '추리', '스릴러', '판타지', 'SF', '공포', '로맨스', '단편', '고전'];

/* ───── KDC(분류번호) → 장르 ───── */
function genreTags(cls, title) {
  const t = {}; const c = String(cls || '').replace(/[^0-9.]/g, ''); const n = parseFloat(c) || -1, h = Math.floor(n / 100), d2 = Math.floor(n / 10), last = Math.floor(n) % 10;
  if (h === 8) {
    if (d2 === 81) { if (last === 3) t.kor = 1; else if (last === 1) t.poem = 1; else if (last === 4 || last === 6) t.essay = 1; }
    else if (d2 >= 82 && d2 <= 89) { if (last === 3) t.for = 1; else if (last === 1) t.poem = 1; else if (last === 4 || last === 6) t.essay = 1; }
  }
  if (h === 9) t.history = 1;
  if (h === 4) t.science = 1;
  if (d2 === 18) t.psych = 1;
  if (h === 1 && d2 !== 18) t.humanities = 1;
  if (d2 === 19) { t.selfhelp = 1; delete t.humanities; }
  if (d2 === 32 || Math.floor(n) === 325) t.econ = 1;
  if (h === 3 && d2 !== 32) t.humanities = t.humanities || .6;
  if (Math.floor(n) === 657) t.comic = 1;
  if (/만화|그래픽 ?노블|웹툰/.test(title || '')) t.comic = 1;
  return t;
}
const isChildren = (add) => /^[756]/.test(String(add || '')); // 부가기호 7 아동, 5·6 학습서
const isYouth = (add) => /^4/.test(String(add || ''));

/* ───── 1) 후보 모으기 ───── */
const today = new Date(Date.now() + 9 * 3600e3); const ymd = (d) => d.toISOString().slice(0, 10);
const back = (days) => ymd(new Date(today - days * 864e5));
const cand = new Map(); // isbn → 목록에서 온 기본 정보
function addDoc(d, src) {
  const isbn = String(d.isbn13 || '').trim(); if (!/^\d{13}$/.test(isbn)) return;
  if (isChildren(d.addition_symbol)) return;
  const prev = cand.get(isbn);
  const loan = +(d.loan_count || d.loanCnt || 0);
  if (prev) { prev.loan = Math.max(prev.loan, loan); prev.src.add(src); return; }
  cand.set(isbn, { id: isbn, t: (d.bookname || '').replace(/\s+/g, ' ').split(/\s*[:=;／/]\s*/)[0].replace(/\s*\(.*?\)\s*$/, '').trim(), a: String(d.authors || '').split(/[;,]/)[0].replace(/(지은이|글|저|지음|옮긴이)\s*:?/g, '').trim(),
    p: (d.publisher || '').trim(), y: +(d.publication_year || 0) || 0, img: d.bookImageURL || '', kdc: String(d.class_no || ''), add: String(d.addition_symbol || ''), loan, src: new Set([src]) });
}

async function collect() {
  const periods = [['1y', back(365)], ['5y', back(365 * 5)], ['all', '2005-01-01']];
  for (const [nm, from] of periods) for (const kdc of (nm === 'all' ? ['8', '1', '9'] : ['0', '1', '3', '4', '8', '9'])) {
    try { docs(await api('loanItemSrch', { startDt: from, endDt: back(1), kdc, pageNo: 1, pageSize: nm === 'all' ? 300 : 200 })).forEach((d) => addDoc(d, `loan-${nm}`)); }
    catch (e) { if (e.message === 'budget') return; console.warn('loanItemSrch', nm, kdc, e.message); }
  }
  // 소설만 더 깊게 (한국소설 · 외국소설)
  for (const [nm, from] of [['1y', back(365)], ['5y', back(365 * 5)]]) for (const dtl of ['813', '823', '833', '843', '863']) {
    try { docs(await api('loanItemSrch', { startDt: from, endDt: back(1), dtl_kdc: dtl, pageNo: 1, pageSize: 100 })).forEach((d) => addDoc(d, `loan-${nm}`)); }
    catch (e) { if (e.message === 'budget') return; console.warn('loanItemSrch dtl', dtl, e.message); }
  }
  for (const kw of SEARCH) {
    try { docs(await api('srchBooks', { keyword: kw, sort: 'loan', order: 'desc', pageNo: 1, pageSize: 50 })).forEach((d) => addDoc(d, 'search')); }
    catch (e) { if (e.message === 'budget') return; console.warn('srchBooks', kw, e.message); }
  }
}

/* ───── 2) 책마다 키워드·추천도서·소개 (캐시에 쌓기) ───── */
let cache = {}; try { cache = JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch {}
async function details() {
  const need = [...cand.values()].filter((b) => !cache[b.id] || Date.now() - (cache[b.id].at || 0) > 90 * 864e5).sort((a, b) => b.loan - a.loan);
  let got = 0;
  for (const b of need) {
    if (calls >= MAX_CALLS) break;
    try {
      const r = await api('usageAnalysisList', { isbn13: b.id });
      const bk = r.book || {};
      const kw = (r.keywords || []).map((k) => k.keyword || k).filter((k) => k && k.word).map((k) => [String(k.word), +k.weight || 0]).slice(0, 40);
      const rec = [...(r.maniaRecBooks || []), ...(r.readerRecBooks || [])].map((x) => (x.book || x).isbn13).filter((x) => /^\d{13}$/.test(String(x))).slice(0, 12);
      cache[b.id] = { at: Date.now(), kw, rec, d: String(bk.description || '').replace(/\s+/g, ' ').trim().slice(0, 120), cls: bk.class_no || '', loan: +(bk.loanCnt || 0) };
      got++;
    } catch (e) {
      if (e.message === 'budget' || calls >= MAX_CALLS) { console.warn('오늘 호출 한도 도달 — 내일 이어서'); break; }
      console.warn('usageAnalysisList', b.id, e.message); cache[b.id] = { at: Date.now() - 80 * 864e5, kw: [], rec: [], d: '', err: 1 };
    }
  }
  return got;
}

/* ───── 3) 카탈로그 만들기 ───── */
function build() {
  const list = [...cand.values()].filter((b) => cache[b.id] && !cache[b.id].err && b.t);
  const loans = list.map((b) => Math.max(b.loan, cache[b.id].loan || 0)).sort((a, b) => a - b);
  const q = (p) => loans[Math.floor((loans.length - 1) * p)] || 0;
  const cut = [q(.2), q(.45), q(.7), q(.9)];
  const books = list.map((b) => {
    const c = cache[b.id], loan = Math.max(b.loan, c.loan || 0);
    const tags = genreTags(b.kdc || c.cls, b.t);
    if (isYouth(b.add)) tags.youth = 1;
    const maxW = Math.max(1, ...c.kw.map((k) => k[1]));
    for (const [chip, words] of Object.entries(SYN)) {
      let w = 0;
      for (const [word, wt] of c.kw) if (words.some((s) => word === s || (s.length >= 2 && word.includes(s)))) w = Math.max(w, wt / maxW);
      if (w >= .25) tags[chip] = Math.max(tags[chip] || 0, +Math.min(1, w + .2).toFixed(2));
    }
    if (/단편|소설집/.test(b.t)) tags.short = 1;
    if (b.y && b.y < 1960) tags.classic = 1;
    const pop = loan >= cut[3] ? 5 : loan >= cut[2] ? 4 : loan >= cut[1] ? 3 : loan >= cut[0] ? 2 : 1;
    const o = { id: b.id, t: b.t, a: b.a, p: b.p, y: b.y, pop, loan, tags };
    if (b.img) o.img = b.img; if (b.kdc) o.kdc = b.kdc; if (c.d) o.d = c.d; if (c.rec.length) o.rec = c.rec;
    return o;
  }).filter((o) => Object.keys(o.tags).length);
  return { source: '도서관 정보나루 (data4library.kr)', updated: ymd(today), count: books.length, books };
}

(async () => {
  await collect();
  console.log(`후보 ${cand.size}권 (호출 ${calls})`);
  const got = await details();
  console.log(`상세 새로 ${got}권, 캐시 ${Object.keys(cache).length}권 (호출 ${calls}/${MAX_CALLS})`);
  fs.mkdirSync(path.dirname(CACHE), { recursive: true });
  // 캐시는 후보에 있는 책만 남긴다 (커지지 않게)
  if (cand.size > 800) for (const k of Object.keys(cache)) if (!cand.has(k)) delete cache[k];
  fs.writeFileSync(CACHE, JSON.stringify(cache));
  const cat = build();
  if (cat.books.length >= 50) { fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(cat)); console.log(`카탈로그 ${cat.books.length}권 → ${path.relative(ROOT, OUT)}`); }
  else console.log(`카탈로그가 아직 ${cat.books.length}권이라 쓰지 않아요 (예시 목록 그대로)`);
})().catch((e) => { console.error(e); process.exit(1); });
