// 마법사 키우기 — 셰이더 이펙트 모음
// 번개 줄기·충격 링·빛 구슬은 Binbun ElectricFX(CC0), 소용돌이는 Binbun DarkMagicFX(CC0)의 Godot 셰이더를 웹(three.js)으로 옮긴 것.
import * as THREE from 'three';

// 반복되는 fbm 노이즈 텍스처
export const NOISE = (() => {
  const N = 128, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), img = g.createImageData(N, N);
  const oct = [[8, .5], [16, .25], [32, .15], [64, .1]]; const grids = oct.map(([n]) => Array.from({ length: n * n }, () => Math.random()));
  const sm = (t) => t * t * (3 - 2 * t);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let v = 0; oct.forEach(([n, a], o) => {
      const gx = x / N * n, gy = y / N * n, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = sm(gx - x0), fy = sm(gy - y0), G = grids[o];
      const at = (i, j) => G[((j % n + n) % n) * n + ((i % n + n) % n)];
      v += a * ((at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx) * (1 - fy) + (at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx) * fy);
    });
    const k = (y * N + x) * 4; img.data[k] = img.data[k + 1] = img.data[k + 2] = Math.min(255, v * 255); img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
})();

const VS = `varying vec3 vN; varying vec3 vV; varying vec2 vUv; void main(){ vUv=uv; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`;
const addM = (o) => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, ...o });

// ---------- 번개 줄기 ----------
const ZAP_VS = `uniform float uT,uAmp,uFreq,uRand,uH,uMode; varying vec3 vN; varying vec3 vV;
  float wv(float y,float f,float o){return abs(fract(y*f+o)*2.-1.)-.5;}
  void main(){ vec3 p=position; float y=p.y; float m=uT*.1;
    vec2 off=vec2(wv(y,uFreq,m+uRand)+wv(y,uFreq*1.5,3.14-m-uRand), wv(y,uFreq,-3.14+m+uRand)+wv(y,uFreq*1.5,-6.28-m-uRand));
    float t=(y/uH)+.5; float mask = uMode<.5 ? sqrt(clamp(t*uH/2.5,0.,1.)) : sqrt(sin(3.14159*clamp(t,0.,1.)));
    p.xz+=off*uAmp*mask; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(p,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`;
function zapMat(prim, sec, amp, freq, mode, halo) {
  return addM({
    uniforms: { uT: { value: 0 }, uA: { value: 1 }, uAmp: { value: amp }, uFreq: { value: freq }, uRand: { value: Math.random() * 10 }, uH: { value: 1 }, uMode: { value: mode }, p: { value: new THREE.Color(prim) }, s: { value: new THREE.Color(sec) } },
    vertexShader: ZAP_VS,
    fragmentShader: halo
      ? `uniform vec3 p,s; uniform float uA; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(abs(dot(vV,vN)),3.); gl_FragColor=vec4(s*f*.28*uA,1.); }`
      : `uniform vec3 p,s; uniform float uA; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(abs(dot(vV,vN)),2.); vec3 c=mix(s,p,step(.5,f)); gl_FragColor=vec4(c*1.15*uA,1.); }`,
  });
}
// a → b 사이 번개. 반환값 set(time, alpha, jitter), dispose()
export function bolt3d(scene, a, b, o = {}) {
  const len = Math.max(.1, a.distanceTo(b)), r = o.r || .09, seg = Math.min(180, Math.ceil(len * 6));
  const geo = new THREE.CylinderGeometry(r, r * (o.taper || 1), len, 6, seg, true);
  const m = zapMat(o.p || 0xffffff, o.s || 0x00d7ff, o.amp || .5, o.freq || .45, o.mode ?? 1, false); m.uniforms.uH.value = len;
  const mesh = new THREE.Mesh(geo, m); mesh.position.copy(a).lerp(b, .5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  const g2 = new THREE.CylinderGeometry(r * 3, r * 3 * (o.taper || 1), len, 6, seg, true);
  const m2 = zapMat(o.s || 0x00d7ff, o.s || 0x00d7ff, o.amp || .5, o.freq || .45, o.mode ?? 1, true); m2.uniforms.uH.value = len; m2.uniforms.uRand = m.uniforms.uRand;
  const halo = new THREE.Mesh(g2, m2); halo.position.copy(mesh.position); halo.quaternion.copy(mesh.quaternion);
  mesh.frustumCulled = halo.frustumCulled = false;
  scene.add(mesh); scene.add(halo);
  return {
    set(t, alpha, jitter) { for (const mm of [m, m2]) { mm.uniforms.uT.value = t; mm.uniforms.uA.value = alpha; } if (jitter != null) m.uniforms.uRand.value = jitter; mesh.visible = halo.visible = alpha > .01; },
    dispose() { scene.remove(mesh); scene.remove(halo); geo.dispose(); g2.dispose(); m.dispose(); m2.dispose(); },
  };
}

// ---------- 빛 구슬 ----------
const ballGeo = new THREE.SphereGeometry(1, 20, 14);
export function glowBall(scene, pos, r, prim, sec, exp = 3) {
  const m = addM({ uniforms: { uA: { value: 1 }, p: { value: new THREE.Color(prim) }, s: { value: new THREE.Color(sec) }, e: { value: exp } }, vertexShader: VS,
    fragmentShader: `uniform vec3 p,s; uniform float uA,e; varying vec3 vN; varying vec3 vV; void main(){ float f=clamp(pow(abs(dot(vV,vN)),e),0.,1.); gl_FragColor=vec4(mix(s,p,f)*f*uA*1.4,1.); }` });
  m.side = THREE.FrontSide; const b = new THREE.Mesh(ballGeo, m); b.position.copy(pos); b.scale.setScalar(r); scene.add(b);
  return { b, set(a, sc = 1) { m.uniforms.uA.value = a; b.scale.setScalar(r * sc); b.visible = a > .01; }, dispose() { scene.remove(b); m.dispose(); } };
}

// ---------- 바닥 충격 링 ----------
const planeGeo = new THREE.PlaneGeometry(1, 1);
export function groundRing(scene, pos, size, prim, sec) {
  const m = addM({ uniforms: { uA: { value: 1 }, uG: { value: 0 }, uF: { value: .25 }, uR: { value: Math.random() }, p: { value: new THREE.Color(prim) }, s: { value: new THREE.Color(sec) } }, vertexShader: VS,
    fragmentShader: `uniform vec3 p,s; uniform float uA,uG,uF,uR; varying vec2 vUv;
      void main(){ vec2 c=vUv*2.-1.; float r=length(c), a=atan(c.x,c.y);
        float w=(sin(a*4.+r+uR*3.14)*.5+.5)*2.+(sin(a*7.04-r-uR*.5)*.5+.5)*1.5+(sin(a*12.56+r+uR*3.14)*.5+.5)+(sin(a*41.+r-uR*.5)*.5+.5)*.2;
        float v=r+w*.1; v-=uG; v=max(1.-abs(v/uF),0.); float al=smoothstep(.05,.7,v);
        gl_FragColor=vec4(mix(s,p,v)*(.6+v*1.4)*al*uA,1.); }` });
  const pl = new THREE.Mesh(planeGeo, m); pl.rotation.x = -Math.PI / 2; pl.position.copy(pos); pl.position.y = .06; pl.scale.set(size, size, 1); scene.add(pl);
  return { set(g, a) { m.uniforms.uG.value = g; m.uniforms.uA.value = a; pl.visible = a > .01; }, dispose() { scene.remove(pl); m.dispose(); } };
}

// ---------- 소용돌이 (블랙홀) ----------
export function vortexMat(prim, sec, emis = 1.2) {
  return addM({ uniforms: { uT: { value: 0 }, uA: { value: 1 }, n: { value: NOISE }, p: { value: new THREE.Color(prim) }, s: { value: new THREE.Color(sec) }, em: { value: emis } }, vertexShader: VS,
    fragmentShader: `uniform float uT,uA,em; uniform sampler2D n; uniform vec3 p,s; varying vec2 vUv;
      float ov(float b,float l){ return mix(2.*b*l, 1.-2.*(1.-b)*(1.-l), step(.5,b)); }
      void main(){ vec2 c=vUv*2.-1.; float r=length(c), a=atan(c.x,c.y);
        float wave=sin(r*5.-uT*2.)+sin(r*9.-uT*2.); float st=sin(a*5.+uT)*.5+.5;
        vec2 nu=vec2(r*.5, a/6.2832)-vec2(.2,0.)*uT; nu.y+=wave*.05; float no=texture2D(n,nu).r;
        float v=no+pow(max(1.-r,0.),4.)*1.5; v*=sqrt(max(1.-r,0.)); v-=st*.2; v=smoothstep(0.,1.,v); v=ov(v,v*v); v=max(v-.05,0.);
        gl_FragColor=vec4(mix(s,p,v)*2.*em*clamp(v,0.,1.)*uA,1.); }` });
}
export function voidCore(scene, pos, r) {
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uA: { value: 1 } }, vertexShader: VS,
    fragmentShader: `uniform float uA; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(max(dot(vV,vN),0.),1.5); gl_FragColor=vec4(0.,0.,0.,f*uA); }` });
  const b = new THREE.Mesh(ballGeo, m); b.position.copy(pos); b.scale.setScalar(r); b.renderOrder = 20; scene.add(b);
  return { b, set(a, sc) { m.uniforms.uA.value = a; b.scale.setScalar(r * sc); b.visible = a > .01; }, dispose() { scene.remove(b); m.dispose(); } };
}

// 둥근 빛 점
export const dotT = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'); const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.3, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })();
