/* AI活用マップ（ai-map.html）
   - 図の箱を押す → その作業のAI活用＋人に残す判断を表示
   - 工程名・資料カードを押す → その工程の困りごと＋作業一覧を表示
   - フォーム送信（Web3Forms）→ 工程ごとのユースケースPDFをダウンロード */
(function () {
  "use strict";
  var raw = document.getElementById("map-data");
  if (!raw) return;
  var D = JSON.parse(raw.textContent);
  var P = {};
  D.phases.forEach(function (p) { P[p.id] = p; });

  var panel = document.getElementById("map-panel");
  var body = document.getElementById("mp-body");
  var doc = document.getElementById("mp-doc");
  var form = document.getElementById("dl-form");
  var err = document.getElementById("dl-err");
  var done = document.getElementById("dl-done");
  var link = document.getElementById("dl-link");
  var btn = form.querySelector("button[type=submit]");
  var btnLabel = btn.textContent;
  var MAIL = "lorenics@outlook.jp";
  var lastFocus = null, curPhase = null;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function siblings(phase, activeId) {
    var h = "";
    Object.keys(D.boxes).forEach(function (k) {
      var b = D.boxes[k];
      if (b.phase !== phase) return;
      h += '<li><button type="button" data-id="' + k + '"' + (k === activeId ? ' aria-current="true"' : "") + ">" + esc(b.title) + "</button></li>";
    });
    return h;
  }
  function markActive(id, phase) {
    document.querySelectorAll(".map-svg .is-active").forEach(function (g) { g.classList.remove("is-active"); });
    var sel = id ? '.map-svg .mb[data-id="' + id + '"]' : '.map-svg .mp[data-phase="' + phase + '"]';
    var g = document.querySelector(sel);
    if (g) g.classList.add("is-active");
  }

  function renderBox(id) {
    var b = D.boxes[id], p = P[b.phase];
    var lc = D.laneColor[b.lane] || "#5a6472";
    body.innerHTML =
      '<p class="mp-tags"><span class="mp-tag">' + esc(p.name) + '</span><span class="mp-tag lane" style="--lc:' + lc + '">' + esc(b.lane) + "</span></p>" +
      '<h2 class="mp-title" id="mp-title">' + esc(b.title) + "</h2>" +
      '<p class="mp-work">' + esc(b.work) + "</p>" +
      '<h3 class="mp-h">AIでできること</h3><ul class="mp-ai">' + b.ai.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + "</ul>" +
      '<h3 class="mp-h keep">人に残す判断</h3><p class="mp-keep">' + esc(b.keep) + "</p>" +
      '<h3 class="mp-h">' + esc(p.name) + "の他の作業</h3><ul class=\"mp-sib\">" + siblings(b.phase, id) + "</ul>";
    setPhase(b.phase, p.name + "／" + b.title);
    markActive(id, null);
  }
  function renderPhase(pid) {
    var p = P[pid];
    body.innerHTML =
      '<p class="mp-tags"><span class="mp-tag">工程</span></p>' +
      '<h2 class="mp-title" id="mp-title">' + esc(p.name) + "</h2>" +
      '<p class="mp-work">' + esc(p.lead) + "</p>" +
      '<h3 class="mp-h">よくある困りごと</h3><ul class="mp-pains">' + p.pains.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + "</ul>" +
      '<h3 class="mp-h">作業を押すとAI活用が見えます</h3><ul class="mp-sib">' + siblings(pid, null) + "</ul>";
    setPhase(pid, p.name + "（工程全体）");
    markActive(null, pid);
  }
  function setPhase(pid, clicked) {
    var p = P[pid];
    if (curPhase !== pid) { done.hidden = true; form.hidden = false; err.textContent = ""; }
    curPhase = pid;
    doc.textContent = "製品ができるまで × AI活用　" + p.name + "編";
    form.elements["資料名"].value = p.name + "編";
    form.elements["押した箇所"].value = clicked;
    form.elements.subject.value = "【ロアニクスWeb】資料請求：" + p.name + "編";
    link.href = p.pdf;
  }

  function open(fn, arg, from) {
    if (panel.hidden) lastFocus = from || document.activeElement;
    fn(arg);
    panel.hidden = false;
    document.body.classList.add("map-lock");
    var box = panel.querySelector(".map-panel__box");
    box.scrollTop = 0;
    panel.querySelector(".map-panel__x").focus();
  }
  function close() {
    panel.hidden = true;
    document.body.classList.remove("map-lock");
    document.querySelectorAll(".map-svg .is-active").forEach(function (g) { g.classList.remove("is-active"); });
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* 押す操作（図・一覧・カード・パネル内の作業ボタン） */
  document.addEventListener("click", function (ev) {
    var t = ev.target.closest ? ev.target.closest("[data-id], [data-phase], [data-close]") : null;
    if (!t) return;
    if (t.hasAttribute("data-close")) { close(); return; }
    if (t.hasAttribute("data-id") && D.boxes[t.getAttribute("data-id")]) { open(renderBox, t.getAttribute("data-id"), t); return; }
    if (t.hasAttribute("data-phase") && P[t.getAttribute("data-phase")]) {
      open(renderPhase, t.getAttribute("data-phase"), t);
      if (t.classList.contains("map-acc-pdf") || t.classList.contains("map-card")) {
        /* 資料目的で押した時は、フォームまで送る */
        setTimeout(function () { var dl = document.getElementById("mp-dl"); dl.scrollIntoView({ block: "start" }); }, 30);
      }
    }
  });
  document.querySelectorAll(".map-svg [role=button]").forEach(function (g) {
    g.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); g.dispatchEvent(new MouseEvent("click", { bubbles: true })); }
    });
  });
  document.addEventListener("keydown", function (ev) {
    if (panel.hidden) return;
    if (ev.key === "Escape") { close(); return; }
    if (ev.key === "Tab") { /* パネルの中でフォーカスを回す */
      var f = Array.prototype.filter.call(panel.querySelectorAll("button, a[href], input, [tabindex]:not([tabindex='-1'])"), function (el) {
        return !el.closest("[hidden]") && !el.classList.contains("c-hp") && el.offsetParent !== null;
      });
      if (!f.length) return;
      if (ev.shiftKey && document.activeElement === f[0]) { ev.preventDefault(); f[f.length - 1].focus(); }
      else if (!ev.shiftKey && document.activeElement === f[f.length - 1]) { ev.preventDefault(); f[0].focus(); }
    }
  });

  /* 一度入力した内容は、この端末の中だけで次回に流用（失敗しても無視） */
  var KEEP = ["お名前", "会社名", "email"];
  try {
    var saved = JSON.parse(localStorage.getItem("lorenics-dl") || "{}");
    KEEP.forEach(function (k) { if (saved[k]) form.elements[k].value = saved[k]; });
    if (saved["検討状況"]) {
      Array.prototype.forEach.call(form.querySelectorAll("[name='検討状況']"), function (r) { r.checked = r.value === saved["検討状況"]; });
    }
  } catch (e) { /* noop */ }

  function bad(el, on) { el.setAttribute("aria-invalid", on ? "true" : "false"); }
  function validate() {
    var first = null, msgs = [];
    KEEP.forEach(function (k) {
      var el = form.elements[k];
      var ng = !el.value.trim() || (k === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()));
      bad(el, ng); if (ng && !first) first = el;
    });
    if (!form.elements.email.value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.elements.email.value.trim())) { /* ok */ } else msgs.push("メールアドレスの形式を確認してください");
    var radios = form.querySelector(".map-radio");
    var picked = form.querySelector("[name='検討状況']:checked");
    bad(radios, !picked); if (!picked && !first) first = form.querySelector("[name='検討状況']");
    var pv = form.elements.privacy;
    if (!pv.checked) { msgs.push("プライバシーポリシーへの同意が必要です"); if (!first) first = pv; }
    if (first) { err.textContent = "未入力の項目があります。" + (msgs.length ? "（" + msgs.join("／") + "）" : ""); first.focus(); return false; }
    err.textContent = ""; return true;
  }
  function download(href) {
    var a = document.createElement("a");
    a.href = href; a.setAttribute("download", ""); a.style.display = "none";
    document.body.appendChild(a); a.click(); a.remove();
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (form.elements.botcheck.checked) return;
    if (!validate()) return;
    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });
    delete data.botcheck;
    try { var s = {}; KEEP.concat(["検討状況"]).forEach(function (k) { s[k] = data[k]; }); localStorage.setItem("lorenics-dl", JSON.stringify(s)); } catch (e) { /* noop */ }
    btn.disabled = true; btn.textContent = "送信中…";
    fetch(form.action, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(data)
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j || !j.success) throw new Error("send failed");
      form.hidden = true; done.hidden = false;
      download(P[curPhase].pdf);
      done.querySelector(".map-done__t").setAttribute("tabindex", "-1");
      done.querySelector(".map-done__t").focus();
    }).catch(function () {
      err.innerHTML = "送信できませんでした。時間をおいてもう一度お試しいただくか、<a href=\"mailto:" + MAIL + "?subject=" +
        encodeURIComponent("資料請求：" + form.elements["資料名"].value) + "\">" + MAIL + "</a> へご連絡ください。";
    }).then(function () { btn.disabled = false; btn.textContent = btnLabel; });
  });
})();
