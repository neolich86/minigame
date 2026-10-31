/* 미니게임천국 게임 브리지 (모든 게임 <head> 맨 위에서 로드)
 *  1) 언어: 포털과 같은 언어(mgh:lang)로 게임을 맞춘다. 자체 다국어가 있는 게임은 navigator.language 를
 *     덮어써서 따라오게 하고, 한국어 전용 게임은 사전(/mgh/i18n/<game>.js)으로 화면·캔버스 글자를 번역한다.
 *  2) 랭킹: MGH.submitScore(board, score, meta) → 포털(부모 창)이 로그인 사용자 기록으로 등록.
 *  3) 온라인: MGH.net.send / MGH.net.on — 포털 방 화면과 메시지를 주고받는다 (카탄 멀티플레이).
 *  4) 저장: MGH.save — 로그인 사용자의 게임 데이터·첨부 파일을 계정에 보관 (games.ts 의 saves: true 게임).
 *     onAuth(fn) 으로 로그인 상태({id, name} 또는 null)를 받고, load/store/putFile/deleteFiles/urls 는 Promise.
 */
(function () {
  "use strict";
  var W = window;
  if (W.MGH) return;
  var KO = /[ㄱ-ㆎ가-힣]/;
  var embedded = W.parent && W.parent !== W;
  var origin = location.origin;

  function norm(v) { return v === "ko" || v === "en" ? v : null; }
  function detect() {
    var q = null;
    try { q = norm(new URLSearchParams(location.search).get("lang")); } catch (e) {}
    var s = null;
    try { s = norm(localStorage.getItem("mgh:lang")); } catch (e) {}
    if (s) return s;
    if (q) return q;
    var list = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || "en"];
    for (var i = 0; i < list.length; i++) {
      var l = String(list[i]).toLowerCase();
      if (l.indexOf("ko") === 0) return "ko";
      if (l.indexOf("en") === 0) return "en";
    }
    return "en";
  }
  var LANG = detect();
  try { localStorage.setItem("mgh:lang", LANG); } catch (e) {}

  // 자체 다국어 게임들이 navigator.language 로 판단하므로 포털 언어로 고정
  var navLang = LANG === "ko" ? "ko-KR" : "en-US";
  try {
    Object.defineProperty(navigator, "language", { configurable: true, get: function () { return navLang; } });
    Object.defineProperty(navigator, "languages", { configurable: true, get: function () { return [navLang, LANG]; } });
  } catch (e) {}
  try { localStorage.setItem("elementSiegeLang", LANG); } catch (e) {}
  document.documentElement.lang = LANG;

  /* ───────────── 번역 엔진 ───────────── */
  var exact = Object.create(null);
  var patterns = [];
  var frags = [];
  var cache = new Map();
  var missing = new Set();
  var active = false;

  function key(s) { return s.replace(/\s+/g, " ").trim(); }

  function tr(s) {
    if (!active || typeof s !== "string" || !KO.test(s)) return s;
    var hit = cache.get(s);
    if (hit !== undefined) return hit;
    var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s);
    var core = key(m[2]);
    var out = exact[core];
    if (out === undefined) {
      for (var i = 0; i < patterns.length; i++) {
        var p = patterns[i];
        p[0].lastIndex = 0;
        if (p[0].test(core)) {
          p[0].lastIndex = 0;
          out = core.replace(p[0], p[1]);
          break;
        }
      }
    }
    if (out === undefined) {
      out = core;
      for (var j = 0; j < frags.length; j++) out = out.split(frags[j][0]).join(frags[j][1]);
      if (KO.test(out)) missing.add(core);
    }
    // 번역 결과 안에 한국어가 남아 있으면(예: 패턴 치환 후 남은 조각) 조각 사전을 한 번 더 적용
    if (KO.test(out)) for (var k = 0; k < frags.length; k++) out = out.split(frags[k][0]).join(frags[k][1]);
    out = m[1] + out + m[3];
    if (cache.size > 5000) cache.clear();
    cache.set(s, out);
    return out;
  }

  var ATTRS = ["title", "placeholder", "aria-label", "alt", "data-tip"];
  function trNode(n) {
    if (n.nodeType === 3) {
      if (KO.test(n.data)) {
        var p = n.parentNode;
        if (p && (p.nodeName === "SCRIPT" || p.nodeName === "STYLE")) return;
        var v = tr(n.data);
        if (v !== n.data) n.data = v;
      }
      return;
    }
    if (n.nodeType !== 1) return;
    var tag = n.nodeName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "svg" && !n.textContent) return;
    for (var i = 0; i < ATTRS.length; i++) {
      var a = n.getAttribute && n.getAttribute(ATTRS[i]);
      if (a && KO.test(a)) n.setAttribute(ATTRS[i], tr(a));
    }
    if ((tag === "INPUT" && /^(button|submit|reset)$/i.test(n.type)) && KO.test(n.value)) n.value = tr(n.value);
    var walker = document.createTreeWalker(n, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null);
    var c = walker.nextNode();
    while (c) {
      if (c.nodeType === 3) {
        if (KO.test(c.data)) {
          var pp = c.parentNode;
          if (!(pp && (pp.nodeName === "SCRIPT" || pp.nodeName === "STYLE"))) {
            var vv = tr(c.data);
            if (vv !== c.data) c.data = vv;
          }
        }
      } else {
        for (var j = 0; j < ATTRS.length; j++) {
          var aa = c.getAttribute(ATTRS[j]);
          if (aa && KO.test(aa)) c.setAttribute(ATTRS[j], tr(aa));
        }
        if (c.nodeName === "INPUT" && /^(button|submit|reset)$/i.test(c.type) && KO.test(c.value)) c.value = tr(c.value);
      }
      c = walker.nextNode();
    }
  }

  function startDom() {
    if (document.title && KO.test(document.title)) document.title = tr(document.title);
    trNode(document.body);
    var mo = new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        var r = list[i];
        if (r.type === "characterData") trNode(r.target);
        else if (r.type === "attributes") trNode(r.target);
        else for (var j = 0; j < r.addedNodes.length; j++) trNode(r.addedNodes[j]);
      }
    });
    mo.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  function activate() {
    if (active || LANG !== "en") return;
    active = true;
    var C = W.CanvasRenderingContext2D && W.CanvasRenderingContext2D.prototype;
    if (C) {
      ["fillText", "strokeText", "measureText"].forEach(function (fn) {
        var orig = C[fn];
        C[fn] = function (t) {
          var args = Array.prototype.slice.call(arguments);
          if (typeof t === "string") args[0] = tr(t);
          return orig.apply(this, args);
        };
      });
    }
    ["alert", "confirm", "prompt"].forEach(function (fn) {
      var orig = W[fn];
      if (!orig) return;
      W[fn] = function (msg) {
        var args = Array.prototype.slice.call(arguments);
        if (typeof msg === "string") args[0] = tr(msg);
        return orig.apply(W, args);
      };
    });
    if (document.body) startDom();
    else document.addEventListener("DOMContentLoaded", startDom);
  }

  /* ───────────── 포털 통신 ───────────── */
  var netHandlers = [];
  var saveReqs = {}, saveSeq = 0, authFns = [], authState; // authState: undefined = 아직 모름
  var chalTargetFns = [], chalTarget = null;
  function toParent(msg) {
    if (!embedded) return false;
    msg.mgh = 1;
    try { W.parent.postMessage(msg, origin); return true; } catch (e) { return false; }
  }
  W.addEventListener("message", function (ev) {
    if (ev.origin !== origin || ev.source !== W.parent) return;
    var d = ev.data;
    if (!d || d.mgh !== 1) return;
    if (d.type === "lang" && norm(d.lang) && d.lang !== LANG) {
      try { localStorage.setItem("mgh:lang", d.lang); } catch (e) {}
      var u = new URL(location.href);
      u.searchParams.set("lang", d.lang);
      location.replace(u.toString());
      return;
    }
    if (d.type === "chal:target") {
      chalTarget = d.target || null;
      for (var ct = 0; ct < chalTargetFns.length; ct++) {
        try { chalTargetFns[ct](chalTarget); } catch (e) { console.error(e); }
      }
      return;
    }
    if ((d.type === "save:res" || d.type === "chal:res") && saveReqs[d.id]) {
      var rq = saveReqs[d.id];
      delete saveReqs[d.id];
      if (d.ok) rq.res(d.result);
      else rq.rej(new Error(d.error || "save_failed"));
      return;
    }
    if (d.type === "save:auth") {
      authState = d.user || null;
      for (var a = 0; a < authFns.length; a++) {
        try { authFns[a](authState, d); } catch (e) { console.error(e); }
      }
      return;
    }
    if (typeof d.type === "string" && d.type.indexOf("net:") === 0) {
      for (var i = 0; i < netHandlers.length; i++) {
        try { netHandlers[i](d); } catch (e) { console.error(e); }
      }
    }
  });

  function saveCall(op, args, type) {
    return new Promise(function (res, rej) {
      if (!embedded) { rej(new Error("standalone")); return; }
      var id = ++saveSeq;
      saveReqs[id] = { res: res, rej: rej };
      if (!toParent({ type: type || "save:req", id: id, op: op, args: args || {} })) {
        delete saveReqs[id];
        rej(new Error("no_portal"));
        return;
      }
      setTimeout(function () {
        if (saveReqs[id]) { delete saveReqs[id]; rej(new Error("timeout")); }
      }, 90000);
    });
  }

  /* 공유 횟수: 플랫폼 = toss(앱인토스 빌드가 MGH_PLATFORM 지정) / app(구글플레이 Capacitor 앱) / web */
  function platform() {
    if (W.MGH_PLATFORM) return W.MGH_PLATFORM;
    try { if (W.Capacitor && W.Capacitor.isNativePlatform && W.Capacitor.isNativePlatform()) return "app"; } catch (e) {}
    try { var pc = embedded && W.parent.Capacitor; if (pc && pc.isNativePlatform && pc.isNativePlatform()) return "app"; } catch (e) {}
    // 구글플레이 TWA 앱(Passport Map 등)은 크롬으로 열려 Capacitor 가 없다 — 처음 열릴 때 referrer 가 android-app:// 이고, 그 탭에 표시해 둔다
    try {
      var top = W.top, ref = (top.document && top.document.referrer) || "";
      if (ref.indexOf("android-app://") === 0) { try { top.sessionStorage.setItem("mgh:twa", "1"); } catch (e) {} return "app"; }
      if (top.sessionStorage.getItem("mgh:twa") === "1") return "app";
      if (top.matchMedia && top.matchMedia("(display-mode: standalone)").matches && /Android/i.test(navigator.userAgent) && /\/(passport-map|m\/)/.test(top.location.pathname)) return "app";
    } catch (e) {}
    return "web";
  }
  // 접속 기록: 이 탭에서 이 게임을 처음 열 때 한 번 (visitor = 기기마다 무작위 익명 id)
  function logVisit() {
    try {
      var game = W.MGH_GAME || ((/\/games\/([a-z0-9-]+)\//.exec(location.pathname) || [])[1]);
      if (!game) return;
      var sk = "mgh:visit:" + game;
      try { if (sessionStorage.getItem(sk)) return; sessionStorage.setItem(sk, "1"); } catch (e) {}
      var vid = null;
      try {
        vid = localStorage.getItem("mgh:vid");
        if (!vid) { vid = (W.crypto && crypto.randomUUID) ? crypto.randomUUID() : null; if (vid) localStorage.setItem("mgh:vid", vid); }
      } catch (e) {}
      var url = (W.MGH_API || "") + "/api/visit-event";
      var body = JSON.stringify({ game: game, platform: platform(), visitor: vid });
      if (navigator.sendBeacon && navigator.sendBeacon(url, body)) return;
      fetch(url, { method: "POST", body: body, keepalive: true, mode: "no-cors" }).catch(function () {});
    } catch (e) {}
  }
  setTimeout(logVisit, 1500);
  var lastShare = {};
  function logShare(method, game) {
    try {
      game = game || W.MGH_GAME || ((/\/games\/([a-z0-9-]+)\//.exec(location.pathname) || [])[1]);
      method = String(method || "other").toLowerCase().replace(/[^a-z_]/g, "").slice(0, 20) || "other";
      if (!game) return;
      var k = game + ":" + method, now = Date.now();
      if (lastShare[k] && now - lastShare[k] < 3000) return; // 연타 한 번으로
      lastShare[k] = now;
      var url = (W.MGH_API || "") + "/api/share-event";
      var body = JSON.stringify({ game: game, platform: platform(), method: method });
      if (navigator.sendBeacon && navigator.sendBeacon(url, body)) return;
      fetch(url, { method: "POST", body: body, keepalive: true, mode: "no-cors" }).catch(function () {});
    } catch (e) {}
  }

  var sessionBest = {};
  var timers = {};

  W.MGH = {
    lang: LANG,
    embedded: embedded,
    t: tr,
    /** 게임 안 문자열을 직접 고를 때: MGH.L('한국어', 'English') */
    L: function (ko, en) { return LANG === "en" ? en : ko; },
    /** 번역 사전 등록 — { exact: {ko: en}, patterns: [[/re/, 'rep']], frags: [['ko','en']] } */
    dict: function (d) {
      if (d.exact) for (var k in d.exact) exact[key(k)] = d.exact[k];
      if (d.patterns) patterns = patterns.concat(d.patterns);
      if (d.frags) frags = frags.concat(d.frags).sort(function (a, b) { return b[0].length - a[0].length; });
      cache.clear();
      activate();
    },
    missing: function () { return Array.from(missing); },
    /** 랭킹 기록 제출. 같은 판 안에서 여러 번 불러도 되며, 이번 세션 최고치를 넘을 때만 보낸다.
     *  opts.debounce(ms) 를 주면 마지막 호출 후 그 시간 뒤에 한 번만 보낸다 (계속 오르는 점수용). */
    submitScore: function (board, score, meta, opts) {
      score = Math.round(Number(score));
      if (!isFinite(score) || score <= 0) return;
      if (sessionBest[board] !== undefined && score <= sessionBest[board]) return;
      var send = function () {
        sessionBest[board] = score;
        toParent({ type: "score", board: board, score: score, meta: meta || {} });
      };
      var wait = opts && opts.debounce;
      if (wait) {
        clearTimeout(timers[board]);
        timers[board] = setTimeout(send, wait);
      } else send();
    },
    save: {
      /** 로그인 상태가 정해지거나 바뀔 때마다 fn(user|null). 포털 밖(단독 실행)에서는 호출되지 않는다. */
      onAuth: function (fn) { authFns.push(fn); if (authState !== undefined) fn(authState, { cloud: true }); },
      user: function () { return authState; },
      load: function () { return saveCall("load"); },
      /** prevAt: 마지막으로 읽은/쓴 updatedAt — 그 뒤 다른 기기가 저장했으면 {conflict:true, data, updatedAt} 로 응답 */
      store: function (data, prevAt) { return saveCall("store", { data: data, prevAt: prevAt }); },
      putFile: function (name, blob) { return saveCall("putFile", { name: name, blob: blob }); },
      deleteFiles: function (names) { return saveCall("deleteFiles", { names: names }); },
      urls: function (names) { return saveCall("urls", { names: names }); },
      /** 공개 링크: shareInfo() → {slug, base, names}, sharePublish(data, {name: blob}, keepNames) → {slug}, shareDelete() */
      shareInfo: function () { return saveCall("shareInfo"); },
      sharePublish: function (data, files, keep) { return saveCall("sharePublish", { data: data, files: files || {}, keep: keep || [] }); },
      shareDelete: function () { return saveCall("shareDelete"); },
      /** 포털 로그인 화면으로 이동 (로그인 후 이 게임으로 돌아온다) */
      /** method: "kakao" 면 바로 카카오 로그인, 아니면 로그인 화면(이메일·카카오) */
      login: function (method) { toParent({ type: "save:login", method: method === "kakao" || method === "google" ? method : "page" }); },
    },
    /** 서버 기능 호출 — 포털(src/lib/gameRpc.ts)에 허용된 Supabase RPC 만. 로그인 사용자 세션으로 실행. Promise */
    rpc: function (name, params) { return saveCall("rpc", { name: name, params: params || {} }); },
    /** 친구에게 도전하기 — 포털 안에서만 동작 (단독 실행이면 reject)
     *  info(board, score) → {pct, user, cloud}   pct: 랭킹 상위 % (기록 없으면 null), user: 로그인 닉네임|null
     *  create(board, score, meta, name) → {code, url, nickname, pct}
     *  onTarget(fn): 도전장 링크로 들어왔을 때 fn({code, nickname, score, board, pct}) */
    challenge: {
      available: function () { return embedded; },
      info: function (board, score) { return saveCall("info", { board: board, score: score }, "chal:req"); },
      create: function (board, score, meta, name) { return saveCall("create", { board: board, score: score, meta: meta || {}, name: name || null }, "chal:req"); },
      onTarget: function (fn) { chalTargetFns.push(fn); if (chalTarget) fn(chalTarget); },
      target: function () { return chalTarget; },
    },
    /** 결과 공유 횟수 기록 — 공유(링크 복사·카카오·공유 시트·이미지 저장)가 끝났을 때 MGH.shared('copy') */
    shared: function (method, game) { logShare(method, game); },
    net: {
      send: function (msg) { return toParent(msg); },
      on: function (fn) { netHandlers.push(fn); },
    },
  };

  if (embedded) {
    var ready = function () { toParent({ type: "ready" }); };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
    else ready();
  }
})();
