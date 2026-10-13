/* 工数・QCD診断シート　計算と画面
   数字は coefficients.js だけにあります。ここには数字を書きません。
   答えた内容は、この端末の中だけで計算します（どこにも送りません）。 */
(function () {
  'use strict';
  var C = (typeof window !== 'undefined' && window.SHINDAN_COEF) || {};

  /* ------------------------------------------------------------
     表示の丸め（0.5は切り上げ。計算は丸めずに進め、表示の直前に1回だけ丸める）
     ------------------------------------------------------------ */
  function rnd(x) { return Math.floor(x + 0.5 + 1e-9); }
  function comma(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function oneDec(k) { return Math.floor(k / 10) + '.' + (k % 10); }          /* k は0.1単位の整数 */
  function trim0(s) { return s.replace(/\.0$/, ''); }
  /* 時間：10時間未満は小数第1位、100時間未満は1時間単位、100時間以上は10時間単位 */
  function fmtH(h) {
    if (h < 10) { return trim0(oneDec(rnd(h * 10))); }
    if (h < 100) { return String(rnd(h)); }
    return comma(rnd(h / 10) * 10);
  }
  /* 金額：10万円未満は0.1万円単位、10万円以上は1万円単位 */
  function fmtMan(yen) {
    var m = yen / 10000;
    if (m < 10) { return trim0(oneDec(rnd(m * 10))); }
    return comma(rnd(m));
  }
  /* 日数：10日未満は小数第1位、10日以上は1日単位 */
  function fmtD(d) {
    if (d < 10) { return trim0(oneDec(rnd(d * 10))); }
    return comma(rnd(d));
  }
  /* ほかの仕事に回せる時間を、1人の勤務の何か月分・何人分かに直す（ホームページ版と同じ書き方） */
  function freeEq(h) {
    var mo = h / C.HOURS_PER_PERSON_MONTH;
    if (mo < 0.05) { return '1人の勤務の0.1か月分未満'; }
    var mk = rnd(mo * 10);
    var pp = h / (C.HOURS_PER_PERSON_MONTH * 12);
    var pTxt = pp < 0.05 ? '0.1人分未満' : '約' + oneDec(rnd(pp * 10)) + '人分';
    return mk < 120 ? '1人の勤務の約' + oneDec(mk) + 'か月分（' + pTxt + '）' : pTxt;
  }

  /* ------------------------------------------------------------
     計算　a = { industry, role, task, hours, people }（選択肢の番号）
     ------------------------------------------------------------ */
  function compute(a) {
    var t = C.tasks[a.task];
    var ind = C.industries[a.industry];
    var own = C.hours[a.hours].value;
    var people = C.people[a.people].value;
    var others = Math.min(own * C.SPILL_PER_PERSON * people, own * C.SPILL_CAP);
    var now = own + others;
    var keep = 1 - t.cut;
    var after = now * keep;

    var reNow = now * t.rework * ind.q;
    var reAfter = reNow * (1 - t.reworkCut);

    var yenNow = now * C.RATE_YEN_PER_HOUR;
    var yenAfter = after * C.RATE_YEN_PER_HOUR;

    var dNow = now / C.HOURS_PER_DAY;
    var dAfter = dNow * (1 - t.lead);

    return {
      task: t, industry: ind,
      hours: { own: own, others: others, now: now, ownAfter: own * keep, othersAfter: others * keep, after: after, pct: Math.round(t.cut * 100) },
      q: { now: reNow, after: reAfter, pct: Math.round(t.reworkCut * 100) },
      c: { now: yenNow, after: yenAfter, yearSave: (yenNow - yenAfter) * 12, pct: Math.round(t.cut * 100) },
      d: { now: dNow, after: dAfter, pct: Math.round(t.lead * 100) },
      free: { yearHours: (now - after) * 12 }
    };
  }

  if (typeof window !== 'undefined') { window.ShindanCalc = { compute: compute, fmtH: fmtH, fmtMan: fmtMan, fmtD: fmtD, freeEq: freeEq }; }
  if (typeof document === 'undefined') { return; }

  /* ------------------------------------------------------------
     問い（5問）
     ------------------------------------------------------------ */
  var QUESTIONS = [
    { key: 'industry', title: '勤め先の業種は？', opts: C.industries.map(function (o) { return o.label; }) },
    { key: 'role', title: 'あなたの立場は？', opts: C.roles.map(function (o) { return o.label; }) },
    { key: 'task', title: 'いちばん時間を取られている仕事は？', opts: C.tasks.map(function (o) { return o.label; }) },
    { key: 'hours', title: 'その仕事に、月どれくらい使っていますか？', sub: '自分の時間で、ざっくりでOKです', opts: C.hours.map(function (o) { return o.label; }) },
    { key: 'people', title: 'その仕事に関わっている人は？', sub: '自分以外の人数です', opts: C.people.map(function (o) { return o.label; }) }
  ];

  var $ = function (id) { return document.getElementById(id); };
  var answers = {};
  var step = 0;

  var elIntro = $('intro'), elQuiz = $('quiz'), elResult = $('result');
  var elQ = $('q-body'), elProg = $('prog'), elBack = $('back');

  function show(which) {
    elIntro.hidden = which !== 'intro';
    elQuiz.hidden = which !== 'quiz';
    elResult.hidden = which !== 'result';
  }

  function renderProgress() {
    var s = '';
    for (var i = 0; i < QUESTIONS.length; i++) {
      s += '<i class="' + (i < step ? 'is-done' : (i === step ? 'is-now' : '')) + '"></i>';
    }
    elProg.innerHTML = s;
    $('prog-n').textContent = (step + 1) + ' / ' + QUESTIONS.length;
  }

  function renderQuestion() {
    var q = QUESTIONS[step];
    renderProgress();
    elBack.hidden = step === 0;
    var html = '<h2 class="q-title" id="q-title" tabindex="-1">' + q.title + '</h2>';
    html += q.sub ? '<p class="q-sub">' + q.sub + '</p>' : '';
    html += '<div class="opts" role="group" aria-labelledby="q-title">';
    q.opts.forEach(function (label, i) {
      var on = answers[q.key] === i;
      html += '<button type="button" class="opt' + (on ? ' is-on' : '') + '" data-i="' + i + '" aria-pressed="' + on + '"><span>' + label + '</span></button>';
    });
    html += '</div>';
    elQ.innerHTML = html;
    var t = $('q-title');
    if (t && t.focus) { try { t.focus({ preventScroll: true }); } catch (e) { t.focus(); } }
  }

  elQ.addEventListener('click', function (ev) {
    var b = ev.target.closest ? ev.target.closest('.opt') : null;
    if (!b) { return; }
    var q = QUESTIONS[step];
    answers[q.key] = parseInt(b.getAttribute('data-i'), 10);
    Array.prototype.forEach.call(elQ.querySelectorAll('.opt'), function (o) {
      var on = o === b;
      o.classList.toggle('is-on', on);
      o.setAttribute('aria-pressed', on);
    });
    window.setTimeout(function () {
      if (step < QUESTIONS.length - 1) { step += 1; renderQuestion(); window.scrollTo(0, 0); }
      else { showResult(); }
    }, 220);
  });

  elBack.addEventListener('click', function () {
    if (step > 0) { step -= 1; renderQuestion(); window.scrollTo(0, 0); }
  });

  $('start').addEventListener('click', function () {
    step = 0; answers = {};
    show('quiz'); renderQuestion(); window.scrollTo(0, 0);
  });

  /* ------------------------------------------------------------
     結果の画面
     ------------------------------------------------------------ */
  function heroSvg(r) {
    var h = r.hours;
    var W = 340, base = 206, maxH = 150, bw = 104, x1 = 38, x2 = 198;
    var hNow = maxH;
    var hAfter = Math.max(maxH * (h.after / h.now), 8);
    function seg(x, y, w, ht, cls, txt) {
      var s = '<rect class="' + cls + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + ht + '"/>';
      if (txt && ht >= 30) { s += '<text class="svg-in" x="' + (x + w / 2) + '" y="' + (y + ht / 2 + 6) + '" text-anchor="middle">' + txt + '</text>'; }
      return s;
    }
    function bar(x, total, ownH, othH, label, ownT, othT) {
      var top = base - total;
      var s = '';
      /* 下が自分の時間、上が関わる人の時間 */
      var ownPx = h.others > 0 ? total * (ownH / (ownH + othH)) : total;
      var othPx = total - ownPx;
      s += seg(x, base - ownPx, bw, ownPx, 'svg-own', ownT);
      if (othPx > 0.5) { s += seg(x, top, bw, othPx, 'svg-oth', othT); }
      s += '<text class="svg-val" x="' + (x + bw / 2) + '" y="' + (top - 10) + '" text-anchor="middle">月' + label + '時間</text>';
      return s;
    }
    var s = '<svg class="hero-svg" viewBox="0 0 ' + W + ' 246" role="img" aria-label="工数の比較。今は月' + fmtH(h.now) + '時間、見込みは月' + fmtH(h.after) + '時間">';
    s += bar(x1, hNow, h.own, h.others, fmtH(h.now), fmtH(h.own), fmtH(h.others));
    s += bar(x2, hAfter, h.ownAfter, h.othersAfter, fmtH(h.after), fmtH(h.ownAfter), fmtH(h.othersAfter));
    s += '<path class="svg-arrow" d="M' + (x1 + bw + 10) + ' 150 L' + (x2 - 14) + ' 150 M' + (x2 - 24) + ' 140 L' + (x2 - 14) + ' 150 L' + (x2 - 24) + ' 160"/>';
    s += '<line class="svg-base" x1="14" y1="' + base + '" x2="' + (W - 14) + '" y2="' + base + '"/>';
    s += '<text class="svg-cat" x="' + (x1 + bw / 2) + '" y="234" text-anchor="middle">今</text>';
    s += '<text class="svg-cat svg-cat--af" x="' + (x2 + bw / 2) + '" y="234" text-anchor="middle">見込み</text>';
    s += '</svg>';
    return s;
  }

  function barRows(now, after, fmt, unit, cls) {
    var max = Math.max(now, 1e-9);
    var wNow = 100;
    var wAf = Math.max((after / max) * 100, 5);
    function row(lab, w, val, kind) {
      return '<div class="brow"><span class="bl">' + lab + '</span><span class="bt"><i class="bf ' + kind + '" style="--w:' + w.toFixed(1) + '%"></i></span><b class="bv">' + fmt(val) + '<small>' + unit + '</small></b></div>';
    }
    return '<div class="bars ' + cls + '">' + row('今', wNow, now, 'bf--now') + row('見込み', wAf, after, 'bf--af') + '</div>';
  }

  function qcdCard(k, name, desc, pct, bars, extra) {
    return '<article class="qcd qcd--' + k.toLowerCase() + '">' +
      '<div class="qcd-h"><span class="qcd-k" aria-hidden="true">' + k + '</span>' +
      '<div class="qcd-t"><h4>' + name + '</h4><p>' + desc + '</p></div>' +
      '<span class="pct"><small>約</small>−' + pct + '<small>%</small></span></div>' +
      bars + (extra ? '<p class="qcd-x">' + extra + '</p>' : '') + '</article>';
  }

  function showResult() {
    var r = compute(answers);
    var h = r.hours;
    var role = C.roles[answers.role].label;
    var html = '';
    html += '<section class="sheet" id="sheet" aria-labelledby="sheet-h">';
    html += '<div class="sheet-top"><p class="sheet-ev">製造業×AI活用法の勉強会　参加特典</p><h2 id="sheet-h">工数・QCD診断シート</h2>';
    html += '<ul class="chips"><li>' + r.industry.label + '</li><li>' + role + '</li><li>' + r.task.label + '</li><li>月' + C.hours[answers.hours].label + '</li><li>関わる人　' + C.people[answers.people].label + '</li></ul></div>';

    html += '<div class="blk blk--hours"><h3>工数<small>（仕事にかかる時間のことです）</small></h3>';
    html += '<p class="hero-line"><span>月' + fmtH(h.now) + '時間</span><i aria-hidden="true">→</i><b>月' + fmtH(h.after) + '時間</b><em class="pct pct--lg"><small>約</small>−' + h.pct + '<small>%</small></em></p>';
    html += heroSvg(r);
    html += '<ul class="legend"><li><i class="lg lg--own"></i>自分の時間</li>' + (h.others > 0 ? '<li><i class="lg lg--oth"></i>関わる人の時間</li>' : '') + '</ul>';
    html += '<p class="cond">見込み＝AIと仕組みづくりを入れて、「' + r.task.label + '」の時間が約' + h.pct + '%減った場合</p></div>';

    html += '<div class="blk blk--qcd"><h3>QCDの改善の見込み<small>（Q＝品質、C＝コスト、D＝納期のことです）</small></h3>';
    html += qcdCard('Q', '品質', 'ミス・やり直しに使う時間（月）', r.q.pct, barRows(r.q.now, r.q.after, fmtH, '時間', 'bars--q'), '');
    html += qcdCard('C', 'コスト', '仕事の時間を、人件費に直した金額（月）', r.c.pct, barRows(r.c.now, r.c.after, fmtMan, '万円', 'bars--c'), '1年に直すと、約' + fmtMan(r.c.yearSave) + '万円の差');
    html += qcdCard('D', '納期', '仕事が終わるまでにかかる日数（月）', r.d.pct, barRows(r.d.now, r.d.after, fmtD, '日', 'bars--d'), '1日8時間で数えた日数です');
    html += '</div>';

    html += '<div class="free"><p class="free-l">ほかの仕事に回せる時間</p><p class="free-v">年<b>' + fmtH(r.free.yearHours) + '</b>時間</p><p class="free-s">' + freeEq(r.free.yearHours) + '</p></div>';

    html += '<p class="note">※算出結果はあくまで参考数値です</p>';
    html += '<p class="basis">人件費は1時間' + comma(C.RATE_YEN_PER_HOUR) + '円で計算しています</p>';
    html += '<p class="sheet-foot">ロアニクス株式会社</p>';
    html += '</section>';

    html += '<section class="cta" aria-labelledby="cta-h"><p class="cta-t" id="cta-h">詳しくは、個別面談でフィードバックします</p>';
    html += '<a class="cta-btn" id="cta-btn" href="' + C.BOOKING_URL + '" target="_blank" rel="noopener">個別面談に申し込む<span class="ar" aria-hidden="true">›</span></a></section>';
    html += '<p class="again"><button type="button" id="again">もう一度、選び直す</button></p>';

    elResult.classList.remove('is-in');
    elResult.innerHTML = html;
    show('result');
    $('again').addEventListener('click', function () {
      step = 0; answers = {};
      show('intro'); window.scrollTo(0, 0);
    });
    window.scrollTo(0, 0);
    var sh = $('sheet-h');
    if (sh) { sh.setAttribute('tabindex', '-1'); try { sh.focus({ preventScroll: true }); } catch (e) { /* 何もしない */ } }
    /* 棒を伸ばす（動きを減らす設定のときは、最初から伸ばした形） */
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var bars = elResult.querySelectorAll('.bf');
    if (reduce) { elResult.classList.add('is-in'); }
    else { window.requestAnimationFrame(function () { window.requestAnimationFrame(function () { elResult.classList.add('is-in'); }); }); }
    return bars;
  }

  show('intro');
})();
