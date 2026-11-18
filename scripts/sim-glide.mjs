// 윈드 러너 밸런스 봇: node scripts/sim-glide.mjs [판수] [실력 0~1]
// 링을 노려 조종(실력만큼 조준 오차), 착지마다 코인으로 가장 싼 강화/글라이더 구매
const C = await import(new URL('../public/games/glide/core.js', import.meta.url));
const N = +(process.argv[2] || 120), SKILL = +(process.argv[3] || 0.6), DT = 1 / 30; if (process.argv[4]) C.tune(JSON.parse(process.argv[4]));
let s = C.newSave(), clock = 0, rs = 7;
const R = () => ((rs = (rs * 16807) % 2147483647) / 2147483647);
const marks = [];
for (let n = 1; n <= N; n++) {
  C.terrainSeed(Math.floor(R() * 1e6));
  const f = C.newFlight(s); let err = [0, 0], ringRef = null;
  while (!f.over && f.t < 900) {
    const r = f.rings.find((x) => !x.hit && !x.miss && x.d > f.d);
    if (r !== ringRef) { ringRef = r; const e = (1 - SKILL) * 14; err = [(R() - .5) * 2 * e, (R() - .5) * 2 * e]; }
    let pitch = -0.13, turn = 0;
    if (r) {
      const ang = Math.atan2(r.lat + err[0] - f.lat, r.d - f.d) - f.yaw; turn = Math.max(-1, Math.min(1, ang * 3));
      const need = Math.atan2(r.y + err[1] - f.y, r.d - f.d); pitch = Math.max(-0.64, Math.min(0.34, need * 1.2));
    } else turn = Math.max(-1, Math.min(1, -f.yaw * 2 - f.lat * 0.01));
    // 앞에 바위산이 있으면 피하기
    const g = C.ground(f.d + 60, f.lat); if (g > f.y - 12) { pitch = 0.34; turn = f.lat > 0 ? -1 : 1; }
    const rocket = f.fuel > 0 && f.y < 60;
    C.step(f, { pitch, turn, rocket }, DT);
  }
  const p = C.payout(f, s.best); s.coins += p.total; s.best = Math.max(s.best, p.dist); s.flights++;
  clock += f.t + 15;
  // 쇼핑: 다음 글라이더 가격의 60% 이상 모이면 저축, 아니면 가장 싼 강화
  for (let g = 0; g < 40; g++) {
    const nx = C.GLIDERS.find((x) => !s.owned.includes(x.id));
    if (nx && s.coins >= nx.price) { s.coins -= nx.price; s.owned.push(nx.id); s.glider = nx.id; continue; }
    let best = -1, bc = 1e18; C.UPS.forEach((u, k) => { if ((s.lv[u.id] || 0) >= u.max) return; const c = C.upCost(s, k); if (c < bc) { bc = c; best = k; } });
    if (nx && s.coins >= nx.price * 0.6 && bc > nx.price - s.coins) break;
    if (best >= 0 && s.coins >= bc) { s.coins -= bc; s.lv[C.UPS[best].id] = (s.lv[C.UPS[best].id] || 0) + 1; continue; }
    break;
  }
  if ([1, 2, 3, 5, 10, 20, 30, 50, 80, 120].includes(n) || p.dist >= C.GOAL && !s.goalT) {
    if (p.dist >= C.GOAL && !s.goalT) s.goalT = clock;
    marks.push(`${String(n).padStart(3)}판 ${(clock / 60).toFixed(1).padStart(5)}분  거리 ${String(p.dist).padStart(5)}m  링 ${String(f.got).padStart(2)}  최고 ${String(s.best).padStart(5)}  글라이더 ${s.glider.padEnd(7)} ${C.UPS.map((u) => u.id[0] + (s.lv[u.id] || 0)).join(' ')}`);
  }
}
console.log(marks.join('\n'));
if (s.goalT) console.log(`하늘 섬 도착: ${(s.goalT / 60).toFixed(1)}분`); else console.log('하늘 섬 미도착');
