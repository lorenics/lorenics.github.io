/* 技術伝承の無料診断（diagnosis.html）の画面の動き
   冒頭 → 5画面・16問 → 結果の送り先（メールアドレス）→ 答えた直後の画面（結論と効果の合計）
   計算はブラウザの中だけで行い、サイトには何も保存しない */
(function () {
  'use strict';

  /* ------------------------------------------------------------
     結果メールの送り先（UTAGEの登録フォーム）
     endpoint が空のあいだは試作として動き、メールは送らない。
     UTAGEにロアニクスのシナリオを作ったら、送り先と項目名（free1 など）をここに入れる
     ------------------------------------------------------------ */
  var CONFIG = {
    endpoint: '',
    fields: {
      mail: 'mail', name: 'name',
      route: '', one: '', total: '', totalNote: '', roi: '', time: '', delivery: '', role: '', meeting: '', screen: '',
      resultUrl: '', answers: ''
    }
  };

  var D = window.LorenicsDiag, V = window.LorenicsDiagView, h = V.h;
  var STORE_KEY = 'lorenics-diag-v' + D.VERSION;
  var CHECK = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ARROW = '<span class="ar" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h9M7.5 3l4 4-4 4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  var SHORT = { q6: 1, q7: 1, q8: 1, q9: 1, q11: 1, q12: 1, q14: 1 };   // 選択肢が短い問いは2列

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var intro = $('#dg-intro'), app = $('#dg-app'), form = $('#dg-form'), screensBox = $('#dg-screens');
  var step = 0;   // 0＝冒頭、1〜5＝問い、6＝結果の送り先、7＝答えた直後
  var last = null;

  /* ---------- 問いを組み立てる ---------- */
  function buildQuestion(q) {
    var multi = q.type === 'multi';
    var fs = h('fieldset', { class: 'dg-q', id: 'f-' + q.id, 'data-q': q.id });
    fs.appendChild(h('legend', null, [h('span', { class: 'dg-qhead' }, [
      h('span', { class: 'dg-qno', text: '問' + q.no }),
      h('span', { class: 'dg-qtitle head', text: q.title }),
      h('span', { class: 'dg-qhow', text: q.how })
    ])]));
    fs.appendChild(h('p', { class: 'dg-qtext jp', text: q.text }));
    var opts = h('div', { class: 'dg-opts' + (SHORT[q.id] ? ' grid2 short' : '') });
    q.options.forEach(function (label, i) {
      var excl = multi && q.exclusive && q.exclusive.indexOf(i) >= 0;
      var input = h('input', { type: multi ? 'checkbox' : 'radio', name: q.id, value: String(i) });
      var mark = h('span', { class: 'dg-mark', html: CHECK });
      opts.appendChild(h('label', { class: 'dg-opt ' + (multi ? 'check' : 'radio') }, [
        input, mark, h('span', { class: 'jp' }, [label, excl ? h('small', { text: 'ほかと一緒には選べません' }) : null])
      ]));
    });
    fs.appendChild(opts);
    if (multi && q.max) { fs.appendChild(h('p', { class: 'dg-count', 'aria-live': 'polite', 'data-count': q.id })); }
    fs.appendChild(h('p', { class: 'dg-err', 'aria-live': 'polite' }));
    return fs;
  }
  function buildScreens() {
    D.SCREENS.forEach(function (s) {
      var sec = h('section', { class: 'dg-screen', 'data-step': String(s.no), 'aria-labelledby': 'dg-h-' + s.no });
      sec.appendChild(h('h2', { class: 'u-sr', id: 'dg-h-' + s.no, tabindex: '-1', text: s.no + '/5 ' + s.title }));
      sec.appendChild(h('p', { class: 'dg-lead jp', 'data-lead': String(s.no), hidden: s.no === 1 }));
      D.QUESTIONS.filter(function (q) { return q.screen === s.no; }).forEach(function (q) { sec.appendChild(buildQuestion(q)); });
      sec.appendChild(h('p', { class: 'dg-toperr', 'aria-live': 'assertive' }));
      sec.appendChild(h('div', { class: 'dg-nav' }, [
        h('button', { type: 'button', class: 'pill pill-line mid back', text: '戻る' }),
        h('button', { type: 'button', class: 'pill pill-blue mid next', html: (s.no === 5 ? '結果の送り先へ' : '次へ') + ARROW })
      ]));
      screensBox.appendChild(sec);
    });
  }

  /* ---------- 答えを読む ---------- */
  function collect() {
    var a = {};
    D.QUESTIONS.forEach(function (q) {
      var checked = $$('input[name="' + q.id + '"]:checked', form).map(function (i) { return parseInt(i.value, 10); });
      if (q.type === 'multi') { a[q.id] = checked.length ? checked.sort(function (x, y) { return x - y; }) : null; }
      else { a[q.id] = checked.length ? checked[0] : null; }
    });
    D.QUESTIONS.forEach(function (q) { if (D.isSkipped(q, a)) { a[q.id] = null; } });
    return a;
  }
  function restore(a) {
    Object.keys(a || {}).forEach(function (id) {
      var v = a[id]; if (v === null || v === undefined) { return; }
      (Array.isArray(v) ? v : [v]).forEach(function (i) {
        var inp = $('input[name="' + id + '"][value="' + i + '"]', form); if (inp) { inp.checked = true; }
      });
    });
  }
  function save() {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify({ a: collect() })); } catch (e) { /* 保存できなくても動く */ }
  }
  function load() {
    try { var s = JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null'); return s && s.a ? s.a : null; } catch (e) { return null; }
  }

  /* ---------- 飛ばす問い・選べる数・見出しの技術名 ---------- */
  function syncSkips() {
    var a = collect();
    D.QUESTIONS.forEach(function (q) {
      if (!q.skipIf) { return; }
      var fs = $('#f-' + q.id), skip = D.isSkipped(q, a);
      fs.hidden = skip;
      if (skip) { $$('input', fs).forEach(function (i) { i.checked = false; }); clearErr(fs); }
    });
  }
  function syncCount(q) {
    var p = $('[data-count="' + q.id + '"]'); if (!p) { return; }
    var n = $$('input[name="' + q.id + '"]:checked', form).length;
    p.textContent = q.max + 'つまで選べます（いま' + n + 'つ）';
  }
  function techLeads() {
    var a = collect(), t = a.q2;
    var name = (t !== null && D.TECH_SHORT[t]) ? D.TECH_SHORT[t] : null;
    var target = name ? '『' + name + '』' : (t === 7 ? 'その仕事' : 'その技術');
    var l2 = name ? 'ここからは『' + name + '』について答えます。'
      : (t === 7 ? 'ここからは、教えるのにいちばん時間がかかる仕事について答えます。' : 'ここからは、最初に選んだ技術について答えます。');
    $('[data-lead="2"]').textContent = l2;
    $('[data-lead="3"]').textContent = (name ? '『' + name + '』について答えます。' : '') + 'だいたいで大丈夫です。いちばん近いものを選んでください。';
    $('[data-lead="4"]').textContent = target + 'で起きる、ミス・やり直しについて伺います。だいたいで大丈夫です。';
    $('[data-lead="5"]').textContent = 'あと4問で結果が出ます。';
  }

  form.addEventListener('change', function (ev) {
    var t = ev.target; if (!t || !t.name) { return; }
    var q = D.BY_ID[t.name];
    if (q && q.type === 'multi') {
      var boxes = $$('input[name="' + q.id + '"]', form);
      var idx = parseInt(t.value, 10);
      if (t.checked && q.exclusive) {
        if (q.exclusive.indexOf(idx) >= 0) { boxes.forEach(function (b) { if (b !== t) { b.checked = false; } }); }
        else { boxes.forEach(function (b) { if (q.exclusive.indexOf(parseInt(b.value, 10)) >= 0) { b.checked = false; } }); }
      }
      if (t.checked && q.max && boxes.filter(function (b) { return b.checked; }).length > q.max) {
        t.checked = false;
        setErr($('#f-' + q.id), q.max + 'つまで選べます。ほかを外してから選んでください');
      } else { clearErr($('#f-' + q.id)); }
      syncCount(q);
    } else if (q) { clearErr($('#f-' + q.id)); }
    if (t.name === 'q6' || t.name === 'q11') { syncSkips(); }
    if (t.name === 'q2') { techLeads(); }
    var top = $('.dg-screen.is-on .dg-toperr');
    if (top && top.textContent && step >= 1 && step <= 5) { refreshTop(step); }
    save();
  });

  /* ---------- 確かめる ---------- */
  function refreshTop(no) {
    var a = collect();
    var miss = D.QUESTIONS.filter(function (q) {
      if (q.screen !== no || D.isSkipped(q, a)) { return false; }
      var v = a[q.id];
      return q.type === 'multi' ? !(Array.isArray(v) && v.length) : v === null;
    });
    var top = $('.dg-screen[data-step="' + no + '"] .dg-toperr');
    top.textContent = miss.length ? 'まだ選んでいない問いがあります（' + miss.map(function (q) { return '問' + q.no; }).join('・') + '）' : '';
  }
  function setErr(fs, msg) { fs.classList.add('is-err'); $('.dg-err', fs).textContent = msg; }
  function clearErr(fs) { if (!fs) { return; } fs.classList.remove('is-err'); $('.dg-err', fs).textContent = ''; }
  function checkScreen(no) {
    var a = collect(), missing = [];
    D.QUESTIONS.filter(function (q) { return q.screen === no; }).forEach(function (q) {
      var fs = $('#f-' + q.id);
      if (D.isSkipped(q, a)) { return; }
      var v = a[q.id];
      var ok = q.type === 'multi' ? (Array.isArray(v) && v.length > 0) : (v !== null);
      if (!ok) { missing.push(q); setErr(fs, '選んでください'); } else { clearErr(fs); }
    });
    var sec = $('.dg-screen[data-step="' + no + '"]');
    var top = $('.dg-toperr', sec);
    if (missing.length) {
      top.textContent = 'まだ選んでいない問いがあります（' + missing.map(function (q) { return '問' + q.no; }).join('・') + '）';
      var first = $('#f-' + missing[0].id);
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var inp = $('input', first); if (inp) { inp.focus({ preventScroll: true }); }
      return false;
    }
    top.textContent = '';
    return true;
  }

  /* ---------- 画面の切り替え ---------- */
  var STEP_LABEL = { 6: ['最後', '結果の送り先'], 7: ['完了', '結果'] };
  function show(n, push) {
    step = n;
    intro.hidden = n !== 0;
    app.hidden = n === 0;
    $$('.dg-screen').forEach(function (s) { s.classList.toggle('is-on', s.getAttribute('data-step') === String(n)); });
    if (n >= 1) {
      var lab = n <= 5 ? [n + '/5', D.SCREENS[n - 1].title] : STEP_LABEL[n];
      $('#dg-prog-no').textContent = lab[0];
      $('#dg-prog-title').textContent = lab[1];
      $$('#dg-steps span').forEach(function (sp, i) {
        sp.className = (i + 1 < n) ? 'on' : (i + 1 === n ? 'now' : '');
        if (n === 7) { sp.className = 'on'; }
      });
      $('#dg-prog').hidden = n === 7;
    }
    if (n >= 2 && n <= 5) { techLeads(); }
    if (push !== false) { try { history.pushState({ dg: n }, ''); } catch (e) { /* なくても動く */ } }
    window.scrollTo(0, 0);
    var head = n === 0 ? $('#dg-h1') : $('.dg-screen.is-on h2');
    if (head) { head.focus({ preventScroll: true }); }
  }
  window.addEventListener('popstate', function (ev) {
    var n = ev.state && typeof ev.state.dg === 'number' ? ev.state.dg : 0;
    if (n === 7 && !last) { n = 6; }
    show(n, false);
  });

  screensBox.addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) { return; }
    if (b.classList.contains('back')) { show(step - 1); }
    if (b.classList.contains('next') && checkScreen(step)) { show(step + 1); }
  });
  $('#dg-start').addEventListener('click', function () { show(1); });
  $('#dg-send-back').addEventListener('click', function () { show(5); });

  /* ---------- 結果の送り先 → 答えた直後の画面 ---------- */
  var MAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var mail = $('#dg-mail').value.trim(), name = $('#dg-name').value.trim();
    var fs = $('#dg-mail-f'), err = $('#dg-mail-err');
    if (!MAIL_RE.test(mail)) {
      fs.classList.add('is-err');
      err.textContent = mail ? 'メールアドレスの形を確かめてください（例：name@example.co.jp）' : 'メールアドレスを入れてください';
      $('#dg-mail').focus();
      return;
    }
    fs.classList.remove('is-err'); err.textContent = '';
    var a = collect();
    for (var s = 1; s <= 5; s++) { if (!checkScreen(s)) { show(s); return; } }
    var hash = D.resultHash(a, D.today());
    var base = window.DIAG_PREVIEW ? 'https://lorenics.com/diagnosis-result.html' : new URL('diagnosis-result.html', location.href).href;
    var resultUrl = base + hash;
    last = { a: a, mail: mail, name: name, resultUrl: resultUrl, hash: hash };
    var btn = $('#dg-submit');
    if (!CONFIG.endpoint) { renderDone(false); return; }
    btn.disabled = true; btn.firstChild.textContent = '送っています…';
    var f = D.mailFields(a, { resultUrl: resultUrl });
    var body = new URLSearchParams();
    body.append(CONFIG.fields.mail, mail);
    if (name && CONFIG.fields.name) { body.append(CONFIG.fields.name, name); }
    Object.keys(f).forEach(function (k) { if (CONFIG.fields[k]) { body.append(CONFIG.fields[k], f[k]); } });
    fetch(CONFIG.endpoint, { method: 'POST', mode: 'no-cors', body: body, keepalive: true })
      .then(function () { renderDone(true); })
      .catch(function () {
        $('#dg-send-err').textContent = '送れませんでした。通信の状態を確かめて、もう一度お試しください。';
      })
      .then(function () { btn.disabled = false; btn.firstChild.textContent = '結果をメールで受け取る'; });
  });

  function renderDone(sent) {
    var a = last.a, R = D.compute(a), rt = D.route(a), T = D.texts(a, R, rt);
    var box = $('#dg-done');
    box.innerHTML = '';
    box.appendChild(h('h2', { class: 'u-sr', tabindex: '-1', text: '結果' }));
    var head = h('div', { class: 'dg-done-head' }, [
      h('p', { class: 'dg-h2 head', text: '結果をメールでお送りしました' }),
      h('p', null, ['送り先：', h('span', { class: 'addr', text: last.mail })]),
      h('p', { text: '届くまで数分かかることがあります。届かないときは、迷惑メールのフォルダもご確認ください。' }),
      h('p', null, [h('a', { href: '#', id: 'dg-fix', text: '送り先を直す' })])
    ]);
    box.appendChild(head);
    if (!sent) {
      box.appendChild(h('p', { class: 'dg-proto' }, [h('b', { text: '試作のため、メールはまだ送られません。' }), '本番では、この画面が出た時点で結果メールが届きます。']));
    }
    box.appendChild(h('div', { class: 'dg-card' }, [
      h('p', { class: 'dg-card-h', text: 'どこから始めるのが合いそうか' }),
      V.routeMap(T), V.routeText(T, false)
    ]));
    box.appendChild(h('div', { class: 'dg-card' }, [
      V.totalBlock(T),
      h('p', { class: 'rs-disc', text: 'ご回答から計算した目安です。効果を約束するものではありません。' })
    ]));
    box.appendChild(h('div', { class: 'dg-mailnote jp', text: '品質・コスト・納期の内訳と、上の方にそのまま渡せる結果の1枚（図解）、個別面談（オンライン30分・無料）の日程調整フォームは、メールでご覧いただけます。' }));
    if (!sent) {
      box.appendChild(h('div', { class: 'dg-proto' }, [
        h('h3', { text: '試作の確認用（本番では出しません）' }),
        h('p', { text: 'このご回答で届く結果メールの文面です。{ }の所は、UTAGEを用意したあとに入ります。' }),
        h('pre', { text: D.mailText(a, { name: last.name, resultUrl: last.resultUrl }) }),
        window.DIAG_PREVIEW
          ? h('button', { type: 'button', class: 'pill pill-line mid wrap', id: 'dg-open-result', html: 'メールのリンク先（結果の1枚）を開く' + ARROW })
          : h('a', { class: 'pill pill-line mid wrap', href: last.resultUrl, target: '_blank', rel: 'noopener', html: 'メールのリンク先（結果の1枚）を開く' + ARROW })
      ]));
      var ob = $('#dg-open-result');
      if (ob) { ob.addEventListener('click', function () { window.DIAG_PREVIEW_OPEN(D.parseResultHash(last.hash)); }); }
    }
    $('#dg-fix').addEventListener('click', function (e) { e.preventDefault(); show(6); $('#dg-mail').focus(); });
    show(7);
    try { sessionStorage.removeItem(STORE_KEY); } catch (e) { /* なくても動く */ }
  }

  /* ---------- はじめに ---------- */
  buildScreens();
  var saved = load();
  if (saved) { restore(saved); }
  syncSkips();
  D.QUESTIONS.forEach(function (q) { if (q.max) { syncCount(q); } });
  try { history.replaceState({ dg: 0 }, ''); } catch (e) { /* なくても動く */ }
})();
