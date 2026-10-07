/* 미니게임천국 — 게임 결과 · 친구에게 도전하기 공용 팝업
 *
 *   MGH.result.open({
 *     board: 'archer',            // 랭킹 보드 id (도전장·TOP % 기준)
 *     score: 763,                 // 보드 점수 (정수)
 *     fmt: function (s) {...},    // 점수 → 보여줄 문자열 (친구 기록에도 사용)
 *     game: 'ARCHER SURVIVOR', icon: '🏹', accent: '#ffb43d',
 *     label: '내 생존', friend: '친구', question: '누가 오래 버티나?',
 *     sub: 'LV 23 · 처치 812',    // 기록 아래 작은 설명 (선택)
 *     meta: {...},                // 도전장에 함께 저장할 값 (선택)
 *     shareText: '...'            // 공유 문구 (선택)
 *   })
 *
 * 포털 안에서는 MGH.challenge 로 도전장 링크(/challenge/<code>)를 만들고, 도전장으로 들어온 경우
 * 친구 기록과 승패를 함께 보여준다. bridge.js 다음에 불러야 한다.
 */
(function () {
  "use strict";
  var W = window;
  if (!W.MGH) return;
  var MGH = W.MGH;
  var L = function (ko, en) { return MGH.L ? MGH.L(ko, en) : ko; };
  var CHAL = MGH.challenge && MGH.challenge.available() ? MGH.challenge : null;
  var NAME_KEY = "mgh:chalName";
  var TARGETS = {};
  if (CHAL) CHAL.onTarget(function (t) { if (t && t.board) TARGETS[t.board] = t; });

  var CSS =
    ".mghr-ov{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(3,5,10,.82);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);font-family:'Pretendard','Apple SD Gothic Neo','Malgun Gothic',system-ui,-apple-system,sans-serif}" +
    ".mghr-ov.open{display:flex}" +
    ".mghr-box{width:100%;max-width:380px;max-height:92vh;overflow-y:auto;text-align:center;color:#e8eefa;border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:20px 20px 14px;background:radial-gradient(120% 60% at 50% 0%,var(--mghr-a2),transparent 60%),linear-gradient(180deg,#0f1628,#080c16);box-shadow:0 30px 80px -30px var(--mghr-a2)}" +
    ".mghr-line{height:1px;background:linear-gradient(90deg,transparent,var(--mghr-a),transparent);opacity:.6;margin:14px 0}" +
    ".mghr-game{font-weight:900;letter-spacing:.16em;font-size:13.5px;color:var(--mghr-a)}" +
    ".mghr-lab{margin-top:14px;font-size:12px;letter-spacing:.12em;color:#8fa0bd;font-weight:800}" +
    ".mghr-val{font-size:46px;font-weight:900;line-height:1.1;margin-top:2px;color:#fff;text-shadow:0 0 26px var(--mghr-a2);word-break:keep-all}" +
    ".mghr-sub{font-size:12.5px;color:#9fb3c8;margin-top:4px}" +
    ".mghr-pct{margin-top:8px;font-size:14px;font-weight:900;color:var(--mghr-a);min-height:18px}" +
    ".mghr-vs{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);text-align:left}" +
    ".mghr-vs .w{font-size:12.5px;color:#8fa0bd;font-weight:800}.mghr-vs .v{font-size:20px;font-weight:900;color:#5ff0d0;white-space:nowrap}.mghr-vs .v.q{letter-spacing:.15em}" +
    ".mghr-q{margin-top:10px;font-size:16px;font-weight:900}" +
    ".mghr-verdict{margin-top:10px;font-size:13px;font-weight:800;padding:8px 10px;border-radius:10px;display:none}" +
    ".mghr-verdict.win{display:block;background:rgba(57,217,138,.12);color:#5ff0a8;border:1px solid rgba(57,217,138,.35)}" +
    ".mghr-verdict.lose{display:block;background:rgba(255,77,94,.1);color:#ff9aa5;border:1px solid rgba(255,77,94,.3)}" +
    ".mghr-name{display:none;margin:0 0 10px}.mghr-name input{width:100%;box-sizing:border-box;background:#0b1120;border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:10px 12px;color:#fff;font:inherit;font-size:13px;text-align:center;outline:none}.mghr-name input:focus{border-color:var(--mghr-a)}" +
    ".mghr-btn{display:block;width:100%;margin:0 0 8px;padding:13px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#e8eefa;font:inherit;font-size:15px;font-weight:800;cursor:pointer}" +
    ".mghr-btn:hover{border-color:var(--mghr-a)}.mghr-btn:disabled{opacity:.6;cursor:wait}" +
    ".mghr-btn.fire{background:linear-gradient(90deg,#ff7a3d,#ffb43d);color:#1d0f00;border-color:transparent}" +
    ".mghr-link{font-size:11.5px;color:#8fd0ff;word-break:break-all}" +
    ".mghr-close{background:none;border:0;color:#8fa0bd;font:inherit;font-size:13px;font-weight:700;cursor:pointer;padding:6px 12px}.mghr-close:hover{color:#fff}" +
    ".mghr-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:2147483001;background:rgba(10,14,24,.95);border:1px solid rgba(255,255,255,.15);color:#fff;padding:10px 16px;border-radius:999px;font-size:13px;font-weight:700;pointer-events:none;opacity:0;transition:opacity .2s}" +
    ".mghr-toast.on{opacity:1}";

  var el, R = null, built = false;
  function $(id) { return document.getElementById(id); }
  function build() {
    if (built) return;
    built = true;
    var st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);
    el = document.createElement("div");
    el.className = "mghr-ov";
    el.innerHTML =
      '<div class="mghr-box" role="dialog" aria-modal="true">' +
      '<div class="mghr-line" style="margin-top:0"></div>' +
      '<div class="mghr-game" id="mghrGame"></div>' +
      '<div class="mghr-lab" id="mghrLab"></div>' +
      '<div class="mghr-val" id="mghrVal"></div>' +
      '<div class="mghr-sub" id="mghrSub"></div>' +
      '<div class="mghr-pct" id="mghrPct"></div>' +
      '<div class="mghr-line"></div>' +
      '<div class="mghr-vs"><span class="w" id="mghrFw"></span><span class="v q" id="mghrFv">? ? ?</span></div>' +
      '<div class="mghr-q" id="mghrQ"></div>' +
      '<div class="mghr-verdict" id="mghrVerdict"></div>' +
      '<div class="mghr-line"></div>' +
      '<div class="mghr-name" id="mghrNameWrap"><input id="mghrName" maxlength="12"></div>' +
      '<button class="mghr-btn fire" id="mghrChal"></button>' +
      '<button class="mghr-btn" id="mghrShare"></button>' +
      '<button class="mghr-btn" id="mghrCopy"></button>' +
      '<div class="mghr-link" id="mghrLink"></div>' +
      '<div class="mghr-line"></div>' +
      '<button class="mghr-close" id="mghrClose"></button>' +
      "</div>";
    document.body.appendChild(el);
    $("mghrName").placeholder = L("내 이름 (친구에게 보여져요)", "Your name (shown to your friend)");
    $("mghrChal").textContent = L("🔥 친구에게 도전하기", "🔥 Challenge a friend");
    $("mghrShare").textContent = L("📸 결과 공유하기", "📸 Share result");
    $("mghrCopy").textContent = L("🔗 링크 복사", "🔗 Copy link");
    $("mghrClose").textContent = L("계속하기", "Continue");
    $("mghrClose").onclick = close;
    el.addEventListener("click", function (e) { if (e.target === el) close(); });
    // 팝업이 열려 있는 동안 게임 단축키(Space 등)가 먹지 않게
    ["keydown", "keyup", "keypress"].forEach(function (t) {
      W.addEventListener(t, function (e) {
        if (!el.classList.contains("open")) return;
        if (e.key === "Escape" && t === "keydown") { close(); }
        var tag = (e.target && e.target.tagName) || "";
        if (tag === "INPUT" || (tag === "BUTTON" && (e.key === "Enter" || e.key === " "))) { e.stopPropagation(); return; }
        e.stopPropagation();
        if (e.key === " " || e.key === "Enter" || e.key.indexOf("Arrow") === 0) e.preventDefault();
      }, true);
    });
    $("mghrChal").onclick = function () { busy($("mghrChal"), challenge); };
    $("mghrCopy").onclick = function () { busy($("mghrCopy"), function () { return link().then(copy); }); };
    $("mghrShare").onclick = function () { busy($("mghrShare"), shareImage); };
  }

  var toastT;
  function toast(t) {
    var d = $("mghrToast");
    if (!d) { d = document.createElement("div"); d.id = "mghrToast"; d.className = "mghr-toast"; document.body.appendChild(d); }
    d.textContent = t; d.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(function () { d.classList.remove("on"); }, 1800);
  }
  function hexA(hex, a) {
    var h = String(hex || "#ffb43d").replace("#", "");
    if (h.length === 3) h = h.replace(/./g, "$&$&");
    var n = parseInt(h, 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }

  function open(o) {
    build();
    R = { o: o, link: null, info: null };
    var a = o.accent || "#ffb43d";
    el.style.setProperty("--mghr-a", a);
    el.style.setProperty("--mghr-a2", hexA(a, 0.22));
    $("mghrGame").textContent = (o.icon ? o.icon + " " : "") + (o.game || "");
    $("mghrLab").textContent = o.label || L("내 기록", "MY RECORD");
    $("mghrVal").textContent = o.fmt(o.score);
    $("mghrSub").textContent = o.sub || "";
    $("mghrSub").style.display = o.sub ? "" : "none";
    $("mghrPct").textContent = "";
    $("mghrLink").textContent = "";
    $("mghrQ").textContent = "→ " + (o.question || L("누가 이길까?", "Who wins?"));
    var t = TARGETS[o.board], fw = $("mghrFw"), fv = $("mghrFv"), vd = $("mghrVerdict");
    vd.className = "mghr-verdict"; vd.textContent = "";
    if (t) {
      fw.textContent = (o.friend || L("친구", "Friend")) + " · " + t.nickname;
      fv.textContent = o.fmt(t.score);
      fv.className = "v";
      var d = o.score - t.score;
      if (d > 0) { vd.className = "mghr-verdict win"; vd.textContent = L("🎉 " + t.nickname + "님을 이겼어요!", "🎉 You beat " + t.nickname + "!"); }
      else if (d === 0) { vd.className = "mghr-verdict lose"; vd.textContent = L("🤝 " + t.nickname + "님과 동점! 한 번만 더!", "🤝 Tied with " + t.nickname + "!"); }
      else { vd.className = "mghr-verdict lose"; vd.textContent = L("😭 " + t.nickname + "님에게 졌어요 — 다시 도전!", "😭 " + t.nickname + " wins — try again!"); }
    } else {
      fw.textContent = o.friend || L("친구", "Friend");
      fv.textContent = "? ? ?";
      fv.className = "v q";
    }
    $("mghrNameWrap").style.display = "none";
    try { $("mghrName").value = localStorage.getItem(NAME_KEY) || ""; } catch (e) {}
    el.classList.add("open");
    if (CHAL) {
      var mine = R;
      CHAL.info(o.board, o.score).then(function (info) {
        if (R !== mine) return;
        R.info = info;
        if (info && info.pct != null) $("mghrPct").textContent = "🏆 TOP " + info.pct + "%";
        if (info && info.cloud && !info.user) $("mghrNameWrap").style.display = "block";
      }).catch(function () {});
    }
  }
  function close() { if (el) el.classList.remove("open"); }

  function link() {
    if (R.link) return Promise.resolve(R.link);
    if (!CHAL) {
      // 포털 밖(단독 실행)에서는 게임 주소만 공유
      R.link = location.href.split("#")[0].split("?")[0];
      return Promise.resolve(R.link);
    }
    var name = null;
    if ($("mghrNameWrap").style.display !== "none") {
      name = $("mghrName").value.trim();
      if (!name) { $("mghrName").focus(); toast(L("친구에게 보여줄 이름을 적어주세요", "Enter a name to show your friend")); return Promise.reject(new Error("need_name")); }
      try { localStorage.setItem(NAME_KEY, name); } catch (e) {}
    }
    return CHAL.create(R.o.board, R.o.score, R.o.meta || {}, name).then(function (r) {
      R.link = r.url;
      if (r.pct != null) $("mghrPct").textContent = "🏆 TOP " + r.pct + "%";
      return R.link;
    });
  }
  function busy(btn, fn) {
    if (btn.disabled) return;
    btn.disabled = true;
    Promise.resolve().then(fn).catch(function (e) {
      if (e && e.message !== "need_name" && e.name !== "AbortError") toast(L("잠시 후 다시 시도해 주세요", "Please try again shortly"));
    }).then(function () { btn.disabled = false; });
  }
  function shareText() {
    var o = R.o;
    return o.shareText || (o.game + " " + o.fmt(o.score) + " — " + (o.question || ""));
  }
  function copy(url) {
    $("mghrLink").textContent = url;
    var done = function (ok) { toast(ok ? L("링크 복사 완료!", "Link copied!") : L("아래 링크를 길게 눌러 복사하세요", "Long-press the link below to copy")); };
    if (navigator.clipboard && W.isSecureContext) return navigator.clipboard.writeText(url).then(function () { done(true); }, function () { done(legacyCopy(url)); });
    done(legacyCopy(url));
  }
  function legacyCopy(txt) {
    try {
      var t = document.createElement("textarea");
      t.value = txt; t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select();
      var ok = document.execCommand("copy");
      t.remove();
      return ok;
    } catch (e) { return false; }
  }
  function challenge() {
    return link().then(function (url) {
      if (navigator.share) {
        return navigator.share({ title: R.o.game, text: shareText(), url: url }).then(function () { $("mghrLink").textContent = url; }, function (e) {
          if (e && e.name === "AbortError") return;
          return copy(url);
        });
      }
      return copy(url);
    });
  }

  /* 공유 이미지 (1080×1350) */
  function image() {
    var o = R.o, Wd = 1080, H = 1350, c = document.createElement("canvas");
    c.width = Wd; c.height = H;
    var g = c.getContext("2d"), a = o.accent || "#ffb43d";
    var F = "'Pretendard','Apple SD Gothic Neo','Malgun Gothic',system-ui,sans-serif";
    var bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#141d33"); bg.addColorStop(1, "#05070d");
    g.fillStyle = bg; g.fillRect(0, 0, Wd, H);
    var glow = g.createRadialGradient(Wd / 2, 460, 30, Wd / 2, 460, 560); glow.addColorStop(0, hexA(a, 0.3)); glow.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = glow; g.fillRect(0, 0, Wd, H);
    function line(y) { var lg = g.createLinearGradient(140, 0, Wd - 140, 0); lg.addColorStop(0, hexA(a, 0)); lg.addColorStop(0.5, hexA(a, 0.75)); lg.addColorStop(1, hexA(a, 0)); g.fillStyle = lg; g.fillRect(140, y, Wd - 280, 3); }
    function fit(txt, size, weight, maxW) { var s = size; do { g.font = weight + " " + s + "px " + F; s -= 4; } while (g.measureText(txt).width > maxW && s > 20); }
    g.textAlign = "center";
    line(110);
    g.fillStyle = a; fit((o.icon ? o.icon + " " : "") + (o.game || ""), 50, 900, 900); g.fillText((o.icon ? o.icon + " " : "") + (o.game || ""), Wd / 2, 200);
    g.fillStyle = "#8fa0bd"; g.font = "800 38px " + F; g.fillText(o.label || L("내 기록", "MY RECORD"), Wd / 2, 330);
    g.fillStyle = "#ffffff"; g.shadowColor = hexA(a, 0.8); g.shadowBlur = 40;
    fit(o.fmt(o.score), 170, 900, 960); g.fillText(o.fmt(o.score), Wd / 2, 510);
    g.shadowBlur = 0;
    var y = 580;
    if (o.sub) { g.fillStyle = "#9fb3c8"; fit(o.sub, 38, 700, 940); g.fillText(o.sub, Wd / 2, y); y += 60; }
    if (R.info && R.info.pct != null) { g.fillStyle = a; g.font = "900 46px " + F; g.fillText("🏆 TOP " + R.info.pct + "%", Wd / 2, y + 10); }
    line(740);
    var t = TARGETS[o.board];
    // 친구 비교 칸
    g.fillStyle = "rgba(255,255,255,.05)"; g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 3;
    if (g.roundRect) { g.beginPath(); g.roundRect(140, 800, Wd - 280, 150, 26); g.fill(); g.stroke(); } else { g.fillRect(140, 800, Wd - 280, 150); }
    g.textAlign = "left"; g.fillStyle = "#8fa0bd"; g.font = "800 36px " + F;
    g.fillText((o.friend || L("친구", "Friend")) + (t ? " · " + t.nickname : ""), 190, 890);
    g.textAlign = "right"; g.fillStyle = "#5ff0d0"; fit(t ? o.fmt(t.score) : "? ? ?", 60, 900, 430);
    g.fillText(t ? o.fmt(t.score) : "? ? ?", Wd - 190, 897);
    g.textAlign = "center";
    g.fillStyle = "#ffffff"; fit("→ " + (o.question || ""), 60, 900, 900); g.fillText("→ " + (o.question || ""), Wd / 2, 1080);
    line(1160);
    g.fillStyle = "#e8eefa"; g.font = "800 34px " + F; g.fillText(L("이 기록, 깰 수 있어?", "Can you beat this?"), Wd / 2, 1225);
    g.fillStyle = "#6f7f9b"; g.font = "700 26px " + F; g.fillText(location.host || "minigame-on.vercel.app", Wd / 2, 1280);
    return new Promise(function (res) { c.toBlob(res, "image/png"); });
  }
  function shareImage() {
    return image().then(function (blob) {
      var name = (R.o.board || "result") + "-" + R.o.score + ".png";
      var file;
      try { file = new File([blob], name, { type: "image/png" }); } catch (e) { file = null; }
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file], title: R.o.game, text: shareText() }).catch(function (e) {
          if (e && e.name === "AbortError") return;
          download(blob, name);
        });
      }
      download(blob, name);
    });
  }
  function download(blob, name) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    toast(L("이미지를 저장했어요", "Image saved"));
  }

  MGH.result = {
    open: open,
    close: close,
    isOpen: function () { return !!(el && el.classList.contains("open")); },
    /** 도전장으로 들어온 경우 그 보드의 친구 기록 {nickname, score} */
    target: function (board) { return TARGETS[board] || null; },
  };
})();
