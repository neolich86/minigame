// 범인은 바로 너! — 사건 만들기 (DOM 없음, node에서도 돌아감)
export const COLORS = { red: '빨간', blue: '파란', yellow: '노란', green: '초록' };
export const ITEMS = { umbrella: '우산', balloon: '풍선', camera: '카메라', book: '책', flower: '꽃다발', icecream: '아이스크림' };
export const HATS = { beret: '베레모', cap: '야구모자', none: '모자 없음' };
// 용의자 12명 (그림 시트 순서와 같음: 4열 × 3줄)
export const SUSPECTS = [
  { id: 'ruby', name: '루비', job: '거리 화가', color: 'red', item: 'umbrella', hat: 'beret' },
  { id: 'bada', name: '바다', job: '신문 기자', color: 'blue', item: 'camera', hat: 'cap' },
  { id: 'haen', name: '해님', job: '꼬마 탐험가', color: 'yellow', item: 'balloon', hat: 'none' },
  { id: 'soop', name: '숲결', job: '도서부 학생', color: 'green', item: 'book', hat: 'beret' },
  { id: 'rose', name: '장미', job: '파티시에 지망생', color: 'red', item: 'flower', hat: 'none' },
  { id: 'cone', name: '콘이', job: '자전거 소년', color: 'blue', item: 'icecream', hat: 'none' },
  { id: 'lemon', name: '레몬', job: '여행 유튜버', color: 'yellow', item: 'camera', hat: 'beret' },
  { id: 'mint', name: '민트', job: '우체부', color: 'green', item: 'umbrella', hat: 'cap' },
  { id: 'toma', name: '토마', job: '역사 교수', color: 'red', item: 'book', hat: 'cap' },
  { id: 'gureum', name: '구름', job: '음유 시인', color: 'blue', item: 'flower', hat: 'beret' },
  { id: 'banana', name: '바나', job: '육상 선수', color: 'yellow', item: 'icecream', hat: 'cap' },
  { id: 'olly', name: '올리', job: '풍선 아저씨', color: 'green', item: 'balloon', hat: 'none' },
];
export const SP = Object.fromEntries(SUSPECTS.map((s) => [s.id, s]));
// 장소 (장면 그림의 건물)
export const PLACES = { cafe: '카페', clock: '시계탑', books: '서점', flower: '꽃집', fountain: '분수 광장', bakery: '빵집', icecream: '아이스크림 수레', stage: '축제 무대' };
export const CRIMES = [
  { id: 'cake', place: 'bakery', title: '축제 케이크 도난 사건', what: '빵집의 거대 딸기 케이크가 사라졌어요!' },
  { id: 'key', place: 'clock', title: '시계탑 황금 열쇠 실종 사건', what: '시계탑의 황금 열쇠가 감쪽같이 없어졌어요!' },
  { id: 'coin', place: 'fountain', title: '분수 소원 동전 도난 사건', what: '분수에 모인 소원 동전이 몽땅 사라졌어요!' },
  { id: 'rose', place: 'flower', title: '꽃집 무지개 장미 실종 사건', what: '꽃집에서 단 한 송이뿐인 무지개 장미가 없어졌어요!' },
  { id: 'rare', place: 'books', title: '서점 마법책 도난 사건', what: '서점 금고의 오래된 마법책이 사라졌어요!' },
  { id: 'mic', place: 'stage', title: '축제 무대 마이크 실종 사건', what: '공연 직전에 무대의 황금 마이크가 없어졌어요!' },
];
// 증거 (그림 시트 순서: 4열 × 4줄)
export const EVIDENCE = [
  { id: 'c_red', kind: 'color', v: 'red', name: '빨간 천 조각', says: '범인은 빨간 옷을 입었어요.' },
  { id: 'c_blue', kind: 'color', v: 'blue', name: '파란 천 조각', says: '범인은 파란 옷을 입었어요.' },
  { id: 'c_yellow', kind: 'color', v: 'yellow', name: '노란 천 조각', says: '범인은 노란 옷을 입었어요.' },
  { id: 'c_green', kind: 'color', v: 'green', name: '초록 천 조각', says: '범인은 초록 옷을 입었어요.' },
  { id: 'i_umbrella', kind: 'item', v: 'umbrella', name: '부러진 우산살', says: '범인은 우산을 들고 있었어요.' },
  { id: 'i_balloon', kind: 'item', v: 'balloon', name: '풍선 끈', says: '범인은 풍선을 들고 있었어요.' },
  { id: 'i_camera', kind: 'item', v: 'camera', name: '카메라 렌즈 뚜껑', says: '범인은 카메라를 갖고 있었어요.' },
  { id: 'i_book', kind: 'item', v: 'book', name: '책갈피', says: '범인은 책을 들고 있었어요.' },
  { id: 'i_flower', kind: 'item', v: 'flower', name: '꽃잎', says: '범인은 꽃다발을 들고 있었어요.' },
  { id: 'i_icecream', kind: 'item', v: 'icecream', name: '녹은 아이스크림 콘', says: '범인은 아이스크림을 들고 있었어요.' },
  { id: 'h_beret', kind: 'hat', v: 'beret', name: '베레모 방울', says: '범인은 베레모를 썼어요.' },
  { id: 'h_cap', kind: 'hat', v: 'cap', name: '야구모자 단추', says: '범인은 야구모자를 썼어요.' },
  { id: 'h_none', kind: 'hat', v: 'none', name: '헝클어진 머리카락', says: '범인은 모자를 쓰지 않았어요.' },
  { id: 'notice', kind: 'closed', name: '임시 휴무 안내문', says: '' },
];
export const EV = Object.fromEntries(EVIDENCE.map((e) => [e.id, e]));
const KEY = { color: 'c_', item: 'i_', hat: 'h_' };

export function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pick = (r, a) => a[Math.floor(r() * a.length)];
function shuffle(r, a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const match = (s, clues) => clues.every((c) => s[c.kind] === c.v);

// 사건 만들기: 물증으로 용의자를 2~3명까지 좁히고, 휴무 안내문으로 거짓 알리바이를 깨면 범인 1명이 남게.
export function makeCase(seed, spots) {
  const r = rng(seed);
  for (let tries = 0; tries < 500; tries++) {
    const crime = pick(r, CRIMES), six = shuffle(r, SUSPECTS).slice(0, 6), C = pick(r, six);
    const dims = shuffle(r, ['color', 'item', 'hat']).slice(0, 2);
    const clues = dims.map((k) => EV[KEY[k] + C[k]]);
    const cand = six.filter((s) => match(s, clues));
    if (cand.length < 2 || cand.length > 3) continue;
    // 알리바이: 범인은 그 시간 닫혀 있던 장소에 있었다고 거짓말, 나머지는 열려 있던 장소
    const places = Object.keys(PLACES).filter((p) => p !== crime.place);
    const closed = pick(r, places), open = places.filter((p) => p !== closed);
    const alibi = {}; for (const s of six) alibi[s.id] = s === C ? closed : pick(r, open);
    const hour = pick(r, [2, 3, 4, 5]), min = pick(r, ['00', '10', '20', '30', '40', '50']);
    // 장면 위 위치 (겹치지 않게)
    const free = shuffle(r, spots.slice());
    const pos = {}; six.forEach((s, i) => (pos[s.id] = free[i]));
    const evs = [...clues.map((c) => c.id), 'notice'];
    const epos = {}; evs.forEach((id, i) => (epos[id] = free[6 + i]));
    return { seed, crime, time: `오후 ${hour}시 ${min}분`, suspects: six.map((s) => s.id), culprit: C.id, clues: clues.map((c) => c.id), closed, alibi, evs, pos, epos, flip: Object.fromEntries(six.map((s) => [s.id, r() < 0.5])) };
  }
  return null;
}
// 정답이 하나뿐인지 확인 (시뮬레이션·테스트용)
export function solve(cs) {
  const clues = cs.clues.map((id) => EV[id]);
  const left = cs.suspects.map((id) => SP[id]).filter((s) => match(s, clues)).filter((s) => cs.alibi[s.id] === cs.closed);
  return left.map((s) => s.id);
}
export const evidenceText = (cs, id) => (id === 'notice' ? `${PLACES[cs.closed]}은(는) ${cs.time}에 문을 닫았어요. 그때 거기 있었다는 사람은 거짓말!` : EV[id].says);
