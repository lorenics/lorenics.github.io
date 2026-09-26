/* Lorenics 下層ページ共通スクリプト
   - スクロールで表示(reveal)
   - 「視差効果を減らす」環境だけに、アニメーション停止ボタンを出す
   - スマホ下部の固定CTA(最後のCTA帯が見えたら隠す)
   - お問い合わせフォーム(入力チェック・送信・送信先未設定時はメール作成で代替)
   JSが動かなくても、表示とフォーム送信(HTML標準)は成立する作りにしている。 */
(function () {
  "use strict";
  var root = document.documentElement;

  /* ---------- モーション方針 ---------- */
  var stopped = false;
  try { stopped = sessionStorage.getItem("lorenics-motion") === "off"; } catch (e) { /* 利用不可でも続行 */ }
  var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  if (!(reduced && stopped)) root.classList.add("force-motion");
  if (reduced && document.querySelector(".c-anim")) {
    var tog = document.createElement("button");
    tog.type = "button";
    tog.className = "c-motion-toggle";
    tog.textContent = stopped ? "▶ アニメーションを再開する" : "■ アニメーションを停止する";
    tog.addEventListener("click", function () {
      try { sessionStorage.setItem("lorenics-motion", stopped ? "on" : "off"); } catch (e) { /* noop */ }
      location.reload();
    });
    document.body.appendChild(tog);
  }

  /* ---------- reveal ---------- */
  var reveals = document.querySelectorAll("[data-reveal]");
  if (reveals.length && "IntersectionObserver" in window && root.classList.contains("force-motion")) {
    root.classList.add("js-reveal");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    Array.prototype.forEach.call(reveals, function (el) { io.observe(el); });
  }

  /* ---------- スマホ固定CTA ---------- */
  var sticky = document.querySelector(".c-sticky-cta");
  var finalCta = document.querySelector("[data-final-cta]");
  if (sticky) {
    document.body.classList.add("has-sticky-cta");
    if (finalCta && "IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { sticky.classList.toggle("is-hidden", en.isIntersecting); });
      }, { threshold: 0.05 }).observe(finalCta);
    }
  }

  /* ---------- お問い合わせフォーム ---------- */
  var form = document.getElementById("contact-form");
  if (!form) return;

  var MAIL_TO = "lorenics@outlook.jp";
  var TYPES = {
    plc: "PLC教育・社員研修",
    advisor: "FA制御の技術顧問",
    ai: "AIを使った業務改善",
    other: "取材・PR・その他"
  };
  var select = form.querySelector("[name='ご相談の種類']");
  try {
    var t = new URLSearchParams(location.search).get("type");
    if (t && TYPES[t] && select) select.value = TYPES[t];
  } catch (e) { /* 古いブラウザは初期値のまま */ }

  var status = document.getElementById("form-status");
  var button = form.querySelector("button[type='submit']");
  var buttonLabel = button ? button.textContent : "";
  form.noValidate = true; /* JSが動く時は独自メッセージで案内する */

  var MESSAGES = {
    valueMissing: {
      "ご相談の種類": "ご相談の種類を選んでください。",
      "お名前": "お名前を入力してください。",
      "email": "メールアドレスを入力してください。",
      "ご相談内容": "ご相談内容を入力してください。",
      "privacy": "プライバシーポリシーへの同意が必要です。"
    },
    typeMismatch: { "email": "メールアドレスの形式が正しくありません（例：name@example.co.jp）。" },
    patternMismatch: { "電話番号": "電話番号は数字とハイフンで入力してください。" }
  };

  function errorBox(field) {
    return document.getElementById(field.getAttribute("aria-describedby").split(" ").filter(function (id) {
      return id.indexOf("err-") === 0;
    })[0]);
  }
  function checkField(field) {
    if (!field.willValidate || !field.getAttribute("aria-describedby")) return true;
    var box = errorBox(field);
    var v = field.validity;
    var msg = "";
    if (!v.valid) {
      var key = v.valueMissing ? "valueMissing" : v.typeMismatch ? "typeMismatch" : v.patternMismatch ? "patternMismatch" : "";
      msg = (MESSAGES[key] && MESSAGES[key][field.name]) || "入力内容を確認してください。";
    }
    field.setAttribute("aria-invalid", msg ? "true" : "false");
    if (box) box.textContent = msg;
    return !msg;
  }
  var fields = Array.prototype.filter.call(form.elements, function (f) {
    return f.getAttribute && f.getAttribute("aria-describedby") && /err-/.test(f.getAttribute("aria-describedby"));
  });
  fields.forEach(function (f) {
    f.addEventListener(f.type === "checkbox" || f.tagName === "SELECT" ? "change" : "blur", function () { checkField(f); });
    f.addEventListener("input", function () { if (f.getAttribute("aria-invalid") === "true") checkField(f); });
  });

  function setStatus(kind, html) {
    status.className = "c-form__status c-form__status--" + kind;
    status.innerHTML = html;
  }
  function payload() {
    var data = {};
    new FormData(form).forEach(function (value, key) { data[key] = value; });
    delete data.redirect; /* fetch送信ではリダイレクトさせない(303を踏むと結果が読めない) */
    return data;
  }
  function mailtoFallback(data) {
    var lines = [
      "ご相談の種類: " + (data["ご相談の種類"] || ""),
      "お名前: " + (data["お名前"] || ""),
      "会社名・屋号: " + (data["会社名・屋号"] || ""),
      "メール: " + (data.email || ""),
      "電話番号: " + (data["電話番号"] || ""),
      "",
      "ご相談内容:",
      data["ご相談内容"] || ""
    ];
    setStatus("info", "メールソフトを開いて、入力内容を下書きにしました。そのまま送信してください。");
    location.href = "mailto:" + MAIL_TO + "?subject=" + encodeURIComponent("【Webサイト】" + (data["ご相談の種類"] || "お問い合わせ")) +
      "&body=" + encodeURIComponent(lines.join("\n"));
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    status.className = "c-form__status"; status.textContent = "";
    if (form.botcheck && form.botcheck.checked) return; /* ハニーポット */

    var firstBad = null;
    fields.forEach(function (f) { if (!checkField(f) && !firstBad) firstBad = f; });
    if (firstBad) {
      setStatus("error", "入力内容に不足があります。赤字の項目を確認してください。");
      firstBad.focus();
      return;
    }

    var data = payload();
    var key = data.access_key || "";
    if (!key || key.indexOf("YOUR_") === 0) { mailtoFallback(data); return; }

    button.disabled = true;
    button.textContent = "送信中…";
    fetch(form.action, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(data)
    }).then(function (res) {
      return res.json();
    }).then(function (json) {
      if (!json || !json.success) throw new Error("send failed");
      location.href = "thanks.html";
    }).catch(function () {
      button.disabled = false;
      button.textContent = buttonLabel;
      setStatus("error", "送信できませんでした。時間をおいてもう一度お試しいただくか、<a href=\"mailto:" + MAIL_TO + "\">" + MAIL_TO + "</a> へ直接ご連絡ください。");
    });
  });
})();
