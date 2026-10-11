/* ライブデモ：押したときだけ本物を読み込む（ページを軽く保つため） */
(function () {
  "use strict";
  document.querySelectorAll("[data-embed]").forEach(function (box) {
    var btn = box.querySelector(".demo-play");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = box.getAttribute("data-embed");
      f.title = box.getAttribute("data-title") || "デモ";
      f.setAttribute("allow", "fullscreen");
      f.setAttribute("loading", "eager");
      box.innerHTML = "";
      box.appendChild(f);
      box.classList.add("is-live");
      f.focus();
    });
  });
})();
