// 성당 바닥 걷기 격자: 벽 메시를 바닥 위 높이에서 수평으로 잘라 막힌 칸을 표시하고,
// 시작 지점에서 퍼져 나가 닿는 칸만 걸을 수 있게 한다.
import * as THREE from 'three';

export class NavGrid {
  constructor(x0, z0, x1, z1, cell = 0.25) {
    this.x0 = x0; this.z0 = z0; this.cell = cell;
    this.w = Math.ceil((x1 - x0) / cell); this.h = Math.ceil((z1 - z0) / cell);
    this.block = new Uint8Array(this.w * this.h);
    this.walk = new Uint8Array(this.w * this.h);
  }
  ix(x) { return Math.floor((x - this.x0) / this.cell); }
  iz(z) { return Math.floor((z - this.z0) / this.cell); }
  mark(x, z) { const i = this.ix(x), j = this.iz(z); if (i >= 0 && j >= 0 && i < this.w && j < this.h) this.block[j * this.w + i] = 1; }
  segment(ax, az, bx, bz) {
    const n = Math.ceil(Math.hypot(bx - ax, bz - az) / (this.cell * .5)) + 1;
    for (let k = 0; k <= n; k++) this.mark(ax + (bx - ax) * k / n, az + (bz - az) * k / n);
  }
  box(cx, cz, hw, hd) { for (let x = cx - hw; x <= cx + hw; x += this.cell * .5) for (let z = cz - hd; z <= cz + hd; z += this.cell * .5) this.mark(x, z); }
  // 메시들을 높이 ys 에서 잘라 막힌 칸 표시
  sliceMeshes(meshes, ys) {
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    for (const m of meshes) {
      const pos = m.geometry.attributes.position, idx = m.geometry.index, mw = m.matrixWorld;
      const cnt = idx ? idx.count : pos.count;
      for (let t = 0; t < cnt; t += 3) {
        const i0 = idx ? idx.getX(t) : t, i1 = idx ? idx.getX(t + 1) : t + 1, i2 = idx ? idx.getX(t + 2) : t + 2;
        a.fromBufferAttribute(pos, i0).applyMatrix4(mw); b.fromBufferAttribute(pos, i1).applyMatrix4(mw); c.fromBufferAttribute(pos, i2).applyMatrix4(mw);
        const lo = Math.min(a.y, b.y, c.y), hi = Math.max(a.y, b.y, c.y);
        for (const y of ys) {
          if (y < lo || y > hi) continue;
          const pts = [];
          for (const [p, q] of [[a, b], [b, c], [c, a]]) {
            if ((p.y - y) * (q.y - y) <= 0 && p.y !== q.y) { const k = (y - p.y) / (q.y - p.y); pts.push(p.x + (q.x - p.x) * k, p.z + (q.z - p.z) * k); }
          }
          if (pts.length >= 4) this.segment(pts[0], pts[1], pts[2], pts[3]);
        }
      }
    }
  }
  // 몸 반지름만큼 벽에서 띄우고, 시작점에서 닿는 칸만 걷기 가능
  flood(sx, sz, radiusCells = 1) {
    const { w, h } = this, grown = new Uint8Array(w * h);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (this.block[j * w + i])
      for (let dj = -radiusCells; dj <= radiusCells; dj++) for (let di = -radiusCells; di <= radiusCells; di++) {
        const ii = i + di, jj = j + dj; if (ii >= 0 && jj >= 0 && ii < w && jj < h && di * di + dj * dj <= radiusCells * radiusCells) grown[jj * w + ii] = 1;
      }
    this.walk.fill(0);
    const q = [this.iz(sz) * w + this.ix(sx)];
    if (grown[q[0]]) return 0;
    this.walk[q[0]] = 1; let n = 0;
    while (q.length) {
      const k = q.pop(); n++; const i = k % w, j = (k - i) / w;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= w || jj >= h) continue;
        const kk = jj * w + ii; if (!grown[kk] && !this.walk[kk]) { this.walk[kk] = 1; q.push(kk); }
      }
    }
    return n;
  }
  ok(x, z) { const i = this.ix(x), j = this.iz(z); return i >= 0 && j >= 0 && i < this.w && j < this.h && this.walk[j * this.w + i] === 1; }
  free(x, z) { const i = this.ix(x), j = this.iz(z); return i >= 0 && j >= 0 && i < this.w && j < this.h && !(this.wall || this.block)[j * this.w + i]; }
}
