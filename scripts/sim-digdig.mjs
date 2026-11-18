// 파고파고 대모험 밸런스 봇: node scripts/sim-digdig.mjs ['{"HP_G":3}']
const C = await import(new URL('../public/games/digdig/core.js', import.meta.url));
const T = JSON.parse(process.argv[2] || '{}'); C.tune(T);
const mask = (w, h) => Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => (((x + .5 - w / 2) / (w / 2)) ** 2 + ((y + .5 - h / 2) / (h / 2)) ** 2 < 1 ? 'X' : '.')).join(''));
function run(seed, policy = 'random') {
  let rs = seed; const R = () => ((rs = (rs * 16807) % 2147483647) / 2147483647);
  const st = C.newState(); st.seed = seed; let t = 0; const log = []; let taps = 0;
  const ups = [0, 1, 2, 3];
  for (let r = 0; r < C.ROUNDS.length; r++) {
    st.round = r; if (r === 6) st.tool = 0;
    const rd = C.ROUNDS[r]; const masks = rd.pieces.map(() => mask(rd.act ? 7 : 8, rd.act ? 5 : 6));
    const W = C.makeWall(r, seed + r * 7919, masks);
    const t0 = t; let radarUntil = -1, radarNext = 0, target = null;
    while (!W.found.every(Boolean)) {
      if (t - t0 > 3600 * 3) { log.push('STUCK'); return { log, t }; }
      // 조준
      let hx, hy;
      const unf = W.found.findIndex((f) => !f); 
      if (st.lv.radar > 0 && t >= radarNext) { radarNext = t + C.radarCd(st); radarUntil = t + 4; }
      if (t < radarUntil || policy === 'smart') { const [x0, y0] = W.place[unf], m = masks[unf]; hx = x0 + R() * m[0].length; hy = C.NY - 1 - (y0 + R() * m.length); }
      else { hx = R() * C.NX; hy = R() * C.NY; }
      const xi = Math.min(C.NX - 1, Math.floor(hx)), yi = Math.min(C.NY - 1, Math.floor(hy));
      let hd = 0; while (hd < C.ND && !W.alive[C.idx(xi, yi, hd)]) hd++;
      if (hd >= C.ND) { t += .05; continue; }
      const res = C.hit(W, st, hx, hy, hd, false); taps++;
      st.money += res.gain; const dt = C.interval(st); t += dt; st.money += C.museumIncome(st) * dt;
      for (let k = 0; k < rd.pieces.length; k++) if (!W.found[k] && C.fossilDone(W, k)) { W.found[k] = true; for (let i = 0; i < C.N; i++) if (W.alive[i] && W.fos[i] === k) W.alive[i] = 0; }
      // 사기
      for (let g = 0; g < 20; g++) {
        const nx = C.TOOLS[rd.act][st.tool + 1]; if (nx && st.money >= nx.cost) { st.money -= nx.cost; st.tool++; continue; }
        let best = -1, bc = 1e30; for (const k of ups) { const u = C.UPS[k]; if ((st.lv[u.id] || 0) >= u.max) continue; const c = C.upCost(st, k); if (c < bc) { bc = c; best = k; } }
        const mc = C.upCost(st, 4); if (st.done.length && mc < bc * 1.5 && st.money >= mc && (st.lv.museum||0) < C.UPS[4].max) { st.money -= mc; st.lv.museum = (st.lv.museum || 0) + 1; continue; }
        if (r >= 1 && !(st.lv.radar > 0) && st.money >= C.upCost(st, 5)) { st.money -= C.upCost(st, 5); st.lv.radar = 1; continue; }
        if (best >= 0 && st.money >= bc) { st.money -= bc; st.lv[C.UPS[best].id] = (st.lv[C.UPS[best].id] || 0) + 1; continue; }
        break;
      }
    }
    st.done.push(r); st.money += rd.reward;
    let al = 0; for (let i = 0; i < C.N; i++) al += W.alive[i];
    log.push(`${rd.short.padEnd(5)} ${((t - t0) / 60).toFixed(1).padStart(5)}분 누적 ${(t / 60).toFixed(1).padStart(5)}분  남은큐브 ${(al / C.N * 100).toFixed(0)}%  위${st.lv.pow||0} 크${st.lv.size||0} 속${st.lv.spd||0} 판${st.lv.sell||0} 박${st.lv.museum||0} 도구${st.tool} 돈${Math.round(st.money)}`);
  }
  return { log, t };
}
for (const pol of ['random', 'smart']) { console.log('== ' + pol); const { log } = run(12345, pol); console.log(log.join('\n')); }
