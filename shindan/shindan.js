/* 製造業 工数・QCD診断（20問）　計算と画面
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
  function oneDec(k) { return Math.floor(k / 10) + '.' + (k % 10); }
  function trim0(s) { return s.replace(/\.0$/, ''); }
  function fmtH(h) {
    if (h < 10) { return trim0(oneDec(rnd(h * 10))); }
    if (h < 100) { return String(rnd(h)); }
    return comma(rnd(h / 10) * 10);
  }
  function fmtMan(yen) {
    var m = yen / 10000;
    if (m < 10) { return trim0(oneDec(rnd(m * 10))); }
    return comma(rnd(m));
  }
  function fmtMo(m) {
    if (m < 10) { return trim0(oneDec(rnd(m * 10))); }
    return String(rnd(m));
  }
  function fmtX(x) { return x < 10 ? trim0(oneDec(rnd(x * 10))) : comma(rnd(x)); }
  function freeEq(h) {
    var mo = h / C.HOURS_PER_PERSON_MONTH;
    if (mo < 0.05) { return '1人の勤務の0.1か月分未満'; }
    var mk = rnd(mo * 10);
    var pp = h / (C.HOURS_PER_PERSON_MONTH * 12);
    var pTxt = pp < 0.05 ? '0.1人分未満' : '約' + oneDec(rnd(pp * 10)) + '人分';
    return mk < 120 ? '1人の勤務の約' + oneDec(mk) + 'か月分（' + pTxt + '）' : pTxt;
  }
  function v(list, i) { return list[i].value; }

  /* ------------------------------------------------------------
     計算　a ＝ 各問いの選択肢の番号
     ------------------------------------------------------------ */
  function compute(a) {
    var ind = C.industries[a.industry];
    var edu = C.EDU_FACTOR[a.eduNow];
    var ai = C.AI_FACTOR[a.aiNow];
    var monthsSolo = v(C.monthsSolo, a.monthsSolo);
    var monthsInYear = Math.min(monthsSolo, C.MONTHS_CAP);

    /* 今の時間（年） */
    var teach = v(C.newcomers, a.newcomers) * v(C.teachWeek, a.teachWeek) * C.WEEKS_PER_MONTH * monthsInYear;
    var faq = v(C.faqWeek, a.faqWeek) * C.WEEKS_PER_MONTH * 12;
    var doc = v(C.docMonth, a.docMonth) * 12;
    var trouble = v(C.troubleMonth, a.troubleMonth) * 12;
    var vet = v(C.vetShare, a.vetShare);
    var rework = v(C.reworkFreq, a.reworkFreq) * v(C.reworkHours, a.reworkHours) * 12 * ind.q;

    /* 減る割合 */
    var cutTeach = C.CUT.teach * edu;
    var cutFaq = C.CUT.faq * edu * (0.7 + 0.3 * ai);
    var cutDoc = C.CUT.doc * ai;
    var cutTrouble = Math.min(0.5, C.CUT.trouble * vet + 0.1 * ai);
    var cutRework = C.CUT.rework * edu;

    var items = [
      { id: 'teach', label: '後輩に教える', now: teach, cut: cutTeach, move: '教える内容を、教材・課題・答え合わせの形にする' },
      { id: 'faq', label: '同じ質問への回答', now: faq, cut: cutFaq, move: '質問と答えを記録に残し、次の人は教材で済むようにする' },
      { id: 'doc', label: '資料・手順書づくり', now: doc, cut: cutDoc, move: '見る場所と判断の理由を渡して、AIに下書きを作らせる' },
      { id: 'trouble', label: 'トラブル対応', now: trouble, cut: cutTrouble, move: 'ベテランが見ている箇所と判断を、確認する質問の形で残す' },
      { id: 'rework', label: 'ミス・やり直し', now: rework, cut: cutRework, move: '「できた」の基準と確認表を先に決める' }
    ];
    var now = 0, after = 0;
    items.forEach(function (it) { it.after = it.now * (1 - it.cut); it.save = it.now - it.after; now += it.now; after += it.after; });
    var save = now - after;
    var pct = now > 0 ? Math.round(save / now * 100) : 0;

    var top = items.slice().sort(function (x, y) { return y.save - x.save; })[0];

    var yenNow = now * C.RATE_YEN_PER_HOUR;
    var yenAfter = after * C.RATE_YEN_PER_HOUR;
    var yenSave = yenNow - yenAfter;

    var soloAfter = monthsSolo * (1 - C.CUT.lead * edu);

    var budget = C.budget[a.budget].value; /* 万円 or null */
    var roi = null, payback = null;
    if (budget !== null && budget > 0) {
      roi = yenSave / (budget * 10000);
      payback = yenSave > 0 ? (budget * 10000) / (yenSave / 12) : null;
    }

    var retire = v(C.retire, a.retire);
    var riskW = C.RECORD_RISK[a.recordNow];
    var riskMonths = retire * monthsSolo; /* 1人ずつ順に引き継ぐときの期間 */

    return {
      industry: ind, items: items, top: top,
      hours: { now: now, after: after, save: save, pct: pct },
      q: { now: rework, after: rework * (1 - cutRework), pct: Math.round(cutRework * 100) },
      c: { now: yenNow, after: yenAfter, save: yenSave, pct: pct },
      d: { now: monthsSolo, after: soloAfter, pct: Math.round(C.CUT.lead * edu * 100) },
      roi: { budget: budget, ratio: roi, paybackMonths: payback },
      risk: { people: retire, months: riskMonths, weight: riskW },
      free: { yearHours: save }
    };
  }

  if (typeof window !== 'undefined') { window.ShindanCalc = { compute: compute, fmtH: fmtH, fmtMan: fmtMan, freeEq: freeEq }; }
  if (typeof document === 'undefined') { return; }

  /* ------------------------------------------------------------
     問い（20問）
     ------------------------------------------------------------ */
  function L(list) { return list.map(function (o) { return o.label; }); }
  var QUESTIONS = [
    { sec: '会社のこと', key: 'industry', title: '勤め先の業種は？', sub: 'いちばん近いものを選んでください', opts: L(C.industries) },
    { sec: '会社のこと', key: 'role', title: 'あなたの立場は？', opts: L(C.roles) },
    { sec: '会社のこと', key: 'engineers', title: '技術者は何人くらいいますか？', sub: '設計・製造・保全など、技術の仕事をしている人数', opts: L(C.engineers) },
    { sec: '教える仕事', key: 'newcomers', title: '1年に、新しく教える人は何人？', sub: '新人・異動・派遣など、一から教える人数', opts: L(C.newcomers) },
    { sec: '教える仕事', key: 'monthsSolo', title: '1人が独り立ちするまで、どれくらい？', sub: '一人で任せられるようになるまでの期間', opts: L(C.monthsSolo) },
    { sec: '教える仕事', key: 'teachWeek', title: 'その間、先輩が教えるのに使う時間は？', sub: '教わる人1人あたり、週に', opts: L(C.teachWeek) },
    { sec: '教える仕事', key: 'faqWeek', title: '同じ質問に答える時間は？', sub: '週に、あなたやベテランが答えている時間', opts: L(C.faqWeek) },
    { sec: '教える仕事', key: 'docMonth', title: '資料や手順書づくりに使う時間は？', sub: '月に', opts: L(C.docMonth) },
    { sec: 'トラブルとやり直し', key: 'troubleMonth', title: 'トラブル対応に使う時間は？', sub: '月に、ベテランが対応している時間', opts: L(C.troubleMonth) },
    { sec: 'トラブルとやり直し', key: 'vetShare', title: 'そのうち、ベテランにしか対応できない割合は？', opts: L(C.vetShare) },
    { sec: 'トラブルとやり直し', key: 'reworkFreq', title: 'ミスややり直しは、どれくらい起きますか？', opts: L(C.reworkFreq) },
    { sec: 'トラブルとやり直し', key: 'reworkHours', title: '1回のやり直しにかかる時間は？', sub: '関わる人の合計で、ざっくり', opts: L(C.reworkHours) },
    { sec: 'ベテランと記録', key: 'retire', title: '5年以内に退職しそうなベテランは？', opts: L(C.retire) },
    { sec: 'ベテランと記録', key: 'eduNow', title: '今の教え方は？', sub: 'いちばん近いもの', opts: L(C.eduNow) },
    { sec: 'ベテランと記録', key: 'recordNow', title: 'ベテランの判断は、どう残っていますか？', opts: L(C.recordNow) },
    { sec: 'ベテランと記録', key: 'aiNow', title: '社内で使えるAIは？', opts: L(C.aiNow) },
    { sec: '始め方', key: 'freedUse', title: '浮いた時間を、何に使いたいですか？', opts: L(C.freedUse) },
    { sec: '始め方', key: 'budget', title: '教育の仕組みに使える、年間の予算は？', sub: '目安でOK。投資対効果の計算に使います', opts: L(C.budget) },
    { sec: '始め方', key: 'timing', title: '始めたい時期は？', opts: L(C.timing) },
    { sec: '始め方', key: 'decider', title: '導入を決めるのは？', opts: L(C.decider) }
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
    var html = '<p class="q-sec">' + q.sec + '</p>';
    html += '<h2 class="q-title" id="q-title" tabindex="-1">' + q.title + '</h2>';
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
    }, 200);
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
    var hAfter = Math.max(maxH * (h.now > 0 ? h.after / h.now : 0), 8);
    function bar(x, total, label, cls) {
      var top = base - total;
      var s = '<rect class="' + cls + '" x="' + x + '" y="' + top + '" width="' + bw + '" height="' + total + '"/>';
      s += '<text class="svg-val" x="' + (x + bw / 2) + '" y="' + (top - 10) + '" text-anchor="middle">年' + label + '時間</text>';
      return s;
    }
    var s = '<svg class="hero-svg" viewBox="0 0 ' + W + ' 246" role="img" aria-label="工数の比較。今は年' + fmtH(h.now) + '時間、見込みは年' + fmtH(h.after) + '時間">';
    s += bar(x1, hNow, fmtH(h.now), 'svg-own');
    s += bar(x2, hAfter, fmtH(h.after), 'svg-oth');
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

  function breakdown(items) {
    var max = Math.max.apply(null, items.map(function (i) { return i.now; }).concat([1e-9]));
    var s = '<div class="bd">';
    items.forEach(function (it) {
      var wNow = Math.max(it.now / max * 100, 1);
      var wAf = Math.max(it.after / max * 100, 1);
      s += '<div class="bd-row"><div class="bd-l"><b>' + it.label + '</b><span>年' + fmtH(it.now) + '時間 → ' + fmtH(it.after) + '時間</span></div>' +
        '<div class="bd-t"><i class="bf bf--now" style="--w:' + wNow.toFixed(1) + '%"></i><i class="bf bf--af2" style="--w:' + wAf.toFixed(1) + '%"></i></div></div>';
    });
    s += '</div>';
    return s;
  }

  function showResult() {
    var r = compute(answers);
    var h = r.hours;
    var role = C.roles[answers.role].label;
    var html = '';
    html += '<section class="sheet" id="sheet" aria-labelledby="sheet-h">';
    html += '<div class="sheet-top"><p class="sheet-ev">製造業×AI活用法の勉強会　参加特典</p><h2 id="sheet-h">製造業 工数・QCD診断</h2>';
    html += '<ul class="chips"><li>' + r.industry.label + '</li><li>' + role + '</li><li>技術者 ' + C.engineers[answers.engineers].label + '</li><li>独り立ち ' + C.monthsSolo[answers.monthsSolo].label + '</li></ul></div>';

    /* 工数 */
    html += '<div class="blk blk--hours"><h3>工数<small>（教える・答える・直す・対応するに、ベテランと先輩が使う時間。1年分）</small></h3>';
    html += '<p class="hero-line"><span>年' + fmtH(h.now) + '時間</span><i aria-hidden="true">→</i><b>年' + fmtH(h.after) + '時間</b><em class="pct pct--lg"><small>約</small>−' + h.pct + '<small>%</small></em></p>';
    html += heroSvg(r);
    html += '<p class="bd-h">内訳</p>' + breakdown(r.items);
    html += '<p class="cond">見込み＝ベテランの判断を教材・答え合わせ・記録の形にして、AIに準備を手伝わせた場合。今の教え方と、社内で使えるAIの範囲で変わります</p></div>';

    /* QCD */
    html += '<div class="blk blk--qcd"><h3>QCDの改善の見込み<small>（Q＝品質、C＝コスト、D＝納期のことです）</small></h3>';
    html += qcdCard('Q', '品質', 'ミス・やり直しに使う時間（年）', r.q.pct, barRows(r.q.now, r.q.after, fmtH, '時間', 'bars--q'), '「できた」の基準と確認表で減らす分');
    html += qcdCard('C', 'コスト', '工数を人件費に直した金額（年）', r.c.pct, barRows(r.c.now, r.c.after, fmtMan, '万円', 'bars--c'), '1年で、約' + fmtMan(r.c.save) + '万円の差');
    html += qcdCard('D', '納期', '1人が独り立ちするまでの期間', r.d.pct, barRows(r.d.now, r.d.after, fmtMo, 'か月', 'bars--d'), '練習と答え合わせで、独り立ちが早まる分');
    html += '</div>';

    /* 投資対効果 */
    html += '<div class="blk blk--roi"><h3>投資対効果<small>（1年の差を、使える予算と比べたもの）</small></h3>';
    if (r.roi.ratio !== null) {
      var pb = r.roi.paybackMonths;
      html += '<div class="roi"><div class="roi-c"><span>年間の予算</span><b>' + comma(r.roi.budget) + '<small>万円</small></b></div><div class="roi-c roi-c--on"><span>1年の差</span><b>' + fmtMan(r.c.save) + '<small>万円</small></b></div></div>';
      html += '<p class="roi-l">投資対効果 <b>約' + fmtX(r.roi.ratio) + '倍</b>　／　回収まで <b>' + (pb === null ? '—' : (pb > 36 ? '3年以上' : '約' + fmtMo(pb) + 'か月')) + '</b></p>';
      html += '<p class="roi-s">' + (r.roi.ratio >= 1 ? '1年目で元が取れる見込みです' : (r.roi.ratio >= 0.5 ? '2年目で元が取れる見込みです' : '予算を小さく始めるか、対象の仕事を広げるかを、面談で一緒に決めます')) + '</p>';
    } else {
      html += '<div class="roi"><div class="roi-c roi-c--on"><span>1年の差</span><b>' + fmtMan(r.c.save) + '<small>万円</small></b></div></div>';
      html += '<p class="roi-l">年<b>' + fmtMan(r.c.save) + '万円</b>までの投資なら、1年で回収できる計算です</p>';
    }
    html += '</div>';

    /* 退職リスク */
    if (r.risk.people > 0) {
      var rec = C.recordNow[answers.recordNow].label;
      html += '<div class="blk blk--risk"><h3>ベテランの退職リスク<small>（5年以内に退職しそうな人数と、判断の残り方から）</small></h3>';
      html += '<div class="risk"><p><b>' + fmtX(r.risk.people) + '人分</b>の判断が、頭の中にあります。判断の記録は「' + rec + '」。</p>';
      html += '<p>1人ずつ引き継ぐと、独り立ちまで<b>' + C.monthsSolo[answers.monthsSolo].label + '</b>×' + fmtX(r.risk.people) + '人＝<b>約' + fmtMo(r.risk.months) + 'か月</b>。退職の前に、聞き出して記録に残す必要があります。</p>';
      html += (r.risk.weight >= 1.0 ? '<p class="risk-hi">記録が残っていないので、退職と同時に判断が消えます。棚卸しを先に始めてください</p>' : (r.risk.weight >= 0.8 ? '<p class="risk-hi">紙の記録だけでは、次の人が探せません。検索して使える形に直すところから始めてください</p>' : '')) + '</div></div>';
    }

    /* 最初の打ち手 */
    html += '<div class="blk blk--move"><h3>最初の打ち手<small>（いちばん時間が減るところから）</small></h3>';
    html += '<div class="move"><p class="move-k">' + r.top.label + '<span>年' + fmtH(r.top.save) + '時間 減る見込み</span></p><p>' + r.top.move + '</p></div></div>';

    /* 浮いた時間 */
    var use = C.freedUse[answers.freedUse].text;
    html += '<div class="free"><p class="free-l">ほかの仕事に回せる時間</p><p class="free-v">年<b>' + fmtH(r.free.yearHours) + '</b>時間</p><p class="free-s">' + freeEq(r.free.yearHours) + (use ? '。' + use + 'へ' : '') + '</p></div>';

    html += '<p class="note">※算出結果はあくまで参考数値です</p>';
    html += '<p class="basis">人件費は1時間' + comma(C.RATE_YEN_PER_HOUR) + '円、1か月' + C.WEEKS_PER_MONTH + '週、1年12か月で計算しています</p>';
    html += '<p class="sheet-foot">ロアニクス株式会社</p>';
    html += '</section>';

    /* 活用法 */
    var dec = answers.decider;
    html += '<section class="cta" aria-labelledby="cta-h">';
    if (dec === 1 || dec === 2) {
      html += '<p class="cta-t" id="cta-h">この画面を、上司に「共有」してください。説得は要りません</p><p class="cta-s">結果の画面をスクリーンショットで見せるだけで大丈夫です。その先は、西原が直接お話しします。</p>';
    } else {
      html += '<p class="cta-t" id="cta-h">詳しくは、個別面談でフィードバックします</p>';
    }
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
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { elResult.classList.add('is-in'); }
    else { window.requestAnimationFrame(function () { window.requestAnimationFrame(function () { elResult.classList.add('is-in'); }); }); }
  }

  show('intro');
})();
