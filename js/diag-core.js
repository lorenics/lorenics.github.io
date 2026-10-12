/* 技術伝承の無料診断　問い・計算・出し分け・文（計算式 v1.2）
   診断ページ（diagnosis.html）と結果の1枚（diagnosis-result.html）の両方から読む。
   ・計算は表示の直前に1回だけ丸める（0.5は切り上げ）。合計は丸める前の数で足す
   ・割り算でずれが出ないよう、数は分子と分母で持つ
   ・画面に触らない（Node でも読める）。画面の組み立ては diag-view.js
   式と文の出どころ：設計書「技術伝承の無料診断 設計書」の各タブ */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { root.LorenicsDiag = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = '1.2';
  var VERSION_LABEL = '計算式 v1.2（2026年10月時点の統計）';

  /* ------------------------------------------------------------
     分数（n/d）。表示の直前まで丸めない
     ------------------------------------------------------------ */
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function fr(n, d) {
    if (d === undefined) { d = 1; }
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d);
    return { n: n / g, d: d / g };
  }
  function dec(x) { return fr(Math.round(x * 1000), 1000); }   // 2.5 → 5/2（小数第3位まで）
  function mul(a, b) { return fr(a.n * b.n, a.d * b.d); }
  function div(a, b) { return fr(a.n * b.d, a.d * b.n); }
  function add(a, b) { return fr(a.n * b.d + b.n * a.d, a.d * b.d); }
  function cmp(a, b) { return a.n * b.d - b.n * a.d; }
  function lt(a, b) { return cmp(a, b) < 0; }
  function ge(a, b) { return cmp(a, b) >= 0; }
  function num(a) { return a.n / a.d; }
  /* 0.5は切り上げて unit の何倍かにする（正の数だけ）。戻りは整数 k（値 = k × unit） */
  function roundK(x, unit) {
    var q = div(x, unit);
    var top = 2 * q.n + q.d, bottom = 2 * q.d;
    return (top - (top % bottom)) / bottom;
  }

  /* ------------------------------------------------------------
     表示の形（丸め方は設計書「計算式と出典」の丸め方のとおり）
     ------------------------------------------------------------ */
  function comma(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function oneDec(k) { return Math.floor(k / 10) + '.' + (k % 10); }      // k は 0.1 単位の整数
  /* 時間：100時間未満は1時間単位、100時間以上は10時間単位 */
  function hoursN(h) { return lt(h, fr(100)) ? roundK(h, fr(1)) : roundK(h, fr(10)) * 10; }
  function hours(h) { return comma(hoursN(h)) + '時間'; }
  /* 金額：1万円単位 */
  function manN(yen) { return roundK(yen, fr(10000)); }
  function man(yen) { return comma(manN(yen)) + '万円'; }
  /* 1人の勤務の何年分。0.05年分未満は「0.1年分未満」（「約」は付けない） */
  function years(h) {
    var y = div(h, fr(1920));
    if (lt(y, fr(1, 20))) { return '0.1年分未満'; }
    return '約' + oneDec(roundK(y, fr(1, 10))) + '年分';
  }
  /* 1日に浮く分。5分未満は「1日 5分未満」（「約」は付けない） */
  function perDay(raw) {
    if (lt(raw, fr(5))) { return '1日 5分未満'; }
    return '1日 約' + (roundK(raw, fr(5)) * 5) + '分';
  }
  function tenth(x) { return oneDec(roundK(x, fr(1, 10))); }
  /* ほかの仕事に回せる時間を、1人の勤務の何か月分・何人分かに直す
     1か月＝160時間（年1,920時間÷12）、1人分＝年1,920時間。どちらも0.1単位
     ・12.0か月分未満：「1人の勤務の約4.0か月分（約0.3人分）」。0.05人分未満は「0.1人分未満」
     ・12.0か月分以上：「約2.5人分」（か月分が大きくなると思い浮かべにくいため、人数だけ）
     ・0.05か月分未満：「1人の勤務の0.1か月分未満」（「約」は付けない） */
  function freeEq(h) {
    var mo = div(h, fr(160));
    if (lt(mo, fr(1, 20))) { return '1人の勤務の0.1か月分未満'; }
    var mk = roundK(mo, fr(1, 10));
    var pp = div(h, fr(1920));
    var pTxt = lt(pp, fr(1, 20)) ? '0.1人分未満' : '約' + oneDec(roundK(pp, fr(1, 10))) + '人分';
    return mk < 120 ? '1人の勤務の約' + oneDec(mk) + 'か月分（' + pTxt + '）' : pTxt;
  }

  /* ------------------------------------------------------------
     問い（設計書「質問（16問）」タブの全文）
     unknown：「分からない」として数える選択肢
     ------------------------------------------------------------ */
  var QUESTIONS = [
    { id: 'q1', no: 1, screen: 1, type: 'multi', max: 3, title: 'いま困っていること', how: '3つまで',
      text: '技術を伝えるうえで、いま困っていることはどれですか。',
      options: ['詳しい人が、辞めた・もうすぐ辞める', '若手が「なぜそうするのか」を知らずに作業している', '教える人が足りず、手が回らない',
        '一人立ちまでに時間がかかる', '教わっていないことで、ミスややり直しが起きる', '手順書や教材を作っても、使われなくなる',
        'トラブルのとき、特定の人しか対応できない', 'まだ整理できていない'],
      exclusive: [7], unknown: [7] },
    { id: 'q2', no: 2, screen: 1, type: 'single', title: '伝えたい技術', how: '1つ',
      text: 'いちばん急いで伝えたい技術はどれですか。決まっていなければ、教えるのにいちばん時間がかかる仕事を選んでください。',
      options: ['設備の保全（点検・修理）', '電気・制御（PLC＝設備を動かす制御装置など）', '設備の設計・立上げ（新しい設備を動かすまで）',
        '加工・組立（溶接・切削・組付けなど）', '品質・検査（良し悪しの見極め）', '生産技術（工程やラインのつくり方）', 'その他', 'まだ決まっていない'],
      unknown: [7] },
    { id: 'q3', no: 3, screen: 2, type: 'multi', title: '残っている記録', how: '当てはまるものすべて',
      text: 'その技術について、社内に残っている記録はどれですか。',
      options: ['過去トラ（過去のトラブルと対策の記録）', '改造履歴（設備を変えたときの記録）', '図面の赤入れ（手書きで直した図面）',
        '日報・保全記録（点検や修理の記録）', '設備のプログラムと、その変更の記録', '作業の動画・写真', 'ほとんど残っていない', '分からない'],
      exclusive: [6, 7], unknown: [7] },
    { id: 'q4', no: 4, screen: 2, type: 'single', title: '記録の中身', how: '1つ',
      text: '残っている記録の中身は、どれにいちばん近いですか。',
      options: ['「なぜそうしたか」まで書いてあるものが多い', '結論や対策だけで、「なぜ」はほとんどない', '書いた本人にしか分からない書き方が多い',
        '記録はあるが、どこに何があるか分からない', '記録自体がほとんどない', '分からない'],
      unknown: [5] },
    { id: 'q5', no: 5, screen: 2, type: 'single', title: 'いまの教え方', how: '1つ',
      text: 'その技術は、いまどのように教えていますか。',
      options: ['手順書や教材があり、誰が教えても同じ中身になる', '手順書や教材はあるが、あまり使われず、教え方は人によって違う',
        '手順書や教材はほとんどなく、教える人の頭の中にある', '分からない'],
      unknown: [3] },
    { id: 'q6', no: 6, screen: 3, type: 'single', title: '教えられる人の数', how: '1つ',
      text: 'その技術をひと通り分かっていて、若手に教えられる人（熟練者）は何人くらいですか。',
      options: ['いない', '1人', '2〜3人', '5人くらい', '10人くらい', '20人以上', '分からない'], unknown: [6] },
    { id: 'q7', no: 7, screen: 3, type: 'single', title: '熟練者が離れるまで', how: '1つ',
      text: 'そのうち、いちばん早く職場を離れそうな方は、あと何年くらいですか（定年・再雇用の終わり・異動など）。',
      options: ['1年以内', '2〜3年', '5年くらい', '10年くらい', '10年より先', '分からない'], unknown: [5],
      skipIf: function (a) { return a.q6 === 0; } },
    { id: 'q8', no: 8, screen: 3, type: 'single', title: '新しく覚える人の数', how: '1つ',
      text: 'その技術を新しく覚える人（若手）は、1年に何人くらいですか。新人・中途・異動の人をふくみます。',
      options: ['今は予定がない', '1人', '2〜3人', '5人くらい', '10人くらい', '20人くらい', '50人くらい', '100人以上', '分からない'], unknown: [8] },
    { id: 'q9', no: 9, screen: 3, type: 'single', title: '一人立ちまでの期間', how: '1つ',
      text: '若手がその技術を一人で任せられるようになるまで（一人立ちまで）、どれくらいかかりますか。会社の仕事を全部覚える「一人前」ではなく、選んだ技術についてお答えください。',
      options: ['1か月くらい', '3か月くらい', '半年くらい', '1年くらい', '2年くらい', '3年以上', '分からない'], unknown: [6] },
    { id: 'q10', no: 10, screen: 3, type: 'single', title: '1日の付き添い時間', how: '1つ',
      text: '一人立ちまでの間、教える人が若手1人に付き添う時間は、平均すると1日どれくらいですか。付き添う＝そばで見せる・説明する・見守ること。日によって違えば平均で。',
      options: ['ほとんどない（聞かれたら答える程度）', '30分くらい', '1時間くらい', '2時間くらい', '半日くらい（4時間）', 'ほぼ1日中（6時間以上）', '分からない'],
      unknown: [6] },
    { id: 'q11', no: 11, screen: 4, type: 'single', title: 'ミス・やり直しの回数', how: '1つ',
      text: '若手が、教わっていなかったことや、教え方の違いが原因で起こすミス・やり直しは、月に何回くらいありますか。数えていなければ「分からない」を選んでください。',
      options: ['ほとんどない', '月に1回くらい', '月に2〜3回', '週に1回くらい', '週に2〜3回', 'ほぼ毎日', '分からない'], unknown: [6] },
    { id: 'q12', no: 12, screen: 4, type: 'single', title: '1回の手間', how: '1つ',
      text: '1回のミス・やり直しを片付けるのに、手間はどれくらいかかりますか。片付けに入った人（若手本人をのぞく、先輩・検査・上司など）の時間を足してください。若手に付き添う時間とは別に数えます。',
      options: ['30分くらい', '1時間くらい', '2〜3時間', '半日くらい', '1日くらい', '2日以上', '分からない'], unknown: [6],
      skipIf: function (a) { return a.q11 === 0 || a.q11 === 6; } },
    { id: 'q13', no: 13, screen: 5, type: 'single', title: '事業の形', how: '1つ',
      text: '御社の事業にいちばん近いものはどれですか。',
      options: ['自社製品の工場（量産が中心）', '自社製品の工場（多品種少量・受注生産が中心）', '部品の加工・組立を請け負う工場',
        '設備・装置をつくって納める会社', '設備を止めずに動かし続ける工場（化学・食品など）', 'その他', '分からない'], unknown: [6] },
    { id: 'q14', no: 14, screen: 5, type: 'single', title: '会社の規模', how: '1つ',
      text: '会社全体の従業員は何人くらいですか。',
      options: ['29人以下', '30〜99人', '100〜299人', '300〜999人', '1,000人以上', '分からない'], unknown: [5] },
    { id: 'q15', no: 15, screen: 5, type: 'single', title: 'あなたの立場', how: '1つ',
      text: 'あなたの立場にいちばん近いものはどれですか。',
      options: ['若手に教えている現場の担当者', '教える人をまとめる係長・課長', '部長・工場長', '経営者・役員', '人事・教育の担当', 'その他'],
      unknown: [], notCounted: true },
    { id: 'q16', no: 16, screen: 5, type: 'single', title: '社内の段階', how: '1つ',
      text: '技術を伝える取り組みは、社内でどの段階ですか。',
      options: ['会社として、期限を決めて進めることになっている', '上から、検討するよう言われている', '自分が必要だと感じて、情報を集めている',
        'まだ社内では話していない', '分からない'], unknown: [4] }
  ];
  var BY_ID = {};
  QUESTIONS.forEach(function (q) { BY_ID[q.id] = q; });

  var SCREENS = [
    { no: 1, title: 'いまのお悩み' },
    { no: 2, title: '残っている記録と教材' },
    { no: 3, title: '教える人と、かかる時間' },
    { no: 4, title: 'ミス・やり直し' },
    { no: 5, title: '御社について' }
  ];

  /* 技術の短い名前（画面2〜4の見出しに差し込む） */
  var TECH_SHORT = ['設備の保全', '電気・制御', '設備の設計・立上げ', '加工・組立', '品質・検査', '生産技術', null, null];
  var TECH_LABEL = ['設備の保全', '電気・制御', '設備の設計・立上げ', '加工・組立', '品質・検査', '生産技術', 'その他', 'まだ決まっていない'];

  function has(list, i) { return Array.isArray(list) && list.indexOf(i) >= 0; }
  function isSkipped(q, a) { return !!(q.skipIf && q.skipIf(a)); }

  /* ------------------------------------------------------------
     計算に使う値（選択肢の順番どおり。null＝計算に使わない）
     ------------------------------------------------------------ */
  var EXPERTS = [0, 1, 2.5, 5, 10, 20, null];
  var LEAVE = [6, 30, 60, 120, 120, null];
  var YOUNG = [null, 1, 2.5, 5, 10, 20, 50, 100, null];
  var MONTHS = [1, 3, 6, 12, 24, 36, 6];          // 分からない＝6か月（仮）
  var DAILY = [null, 0.5, 1, 2, 4, 6, 1];         // ほとんどない＝計算しない／分からない＝1時間（仮）
  var MISS = [0, 1, 2.5, 4, 10, 20, null];        // 分からない＝金額を出さない
  var EFFORT = [0.5, 1, 2.5, 4, 8, 16, 1];        // 分からない＝1時間（仮）
  var RATE = fr(3600);                            // 時間単価（会社負担込み）
  var D_YEN_PER = fr(14050);                      // 若手の月の人件費 28.1万円 × 1割 × 半人前 0.5
  var REF_1M = fr(140500);                        // 28.1万円 × 半人前 0.5（面談前カードだけ）

  /* ------------------------------------------------------------
     計算（参照実装 calc_v12.py と同じ式）
     ------------------------------------------------------------ */
  function compute(a) {
    var R = {};
    var yi = a.q8;
    var perPerson = (yi === 0 || yi === 8);
    var n = perPerson ? fr(1) : dec(YOUNG[yi]);
    var m = fr(MONTHS[a.q9]);
    var mKari = (a.q9 === 6);
    var dRaw = DAILY[a.q10];
    var dKari = (a.q10 === 6);
    var eRaw = EXPERTS[a.q6];
    var cKari = mKari || dKari;
    R.perPerson = perPerson; R.youngNone = (yi === 0); R.youngUnknown = (yi === 8);
    R.n = n; R.m = m; R.mKari = mKari; R.cKari = cKari; R.experts = eRaw;

    /* 品質：ミス・やり直し */
    var cnt = MISS[a.q11], qSave = null, eKari = false;
    if (cnt === null) { R.q = { state: 'unknown' }; }
    else if (cnt === 0) { R.q = { state: 'none' }; qSave = fr(0); }
    else {
      eKari = (a.q12 === 6);
      var qh = mul(mul(dec(cnt), dec(EFFORT[a.q12])), fr(12));
      qSave = mul(mul(qh, fr(1, 2)), RATE);
      R.q = { state: 'value', h: qh, yen: mul(qh, RATE), halfH: mul(qh, fr(1, 2)), halfYen: qSave, kari: eKari };
    }

    /* コスト：教える時間 */
    var cSave = null;
    if (dRaw === null) { R.c = { state: 'none' }; }
    else {
      var d = dec(dRaw);
      var per = mul(mul(m, fr(20)), d);
      var now = mul(n, per);
      cSave = mul(mul(now, fr(1, 2)), RATE);
      R.c = { state: 'value', per: per, now: now, nowYen: mul(now, RATE), halfH: mul(now, fr(1, 2)), halfYen: cSave,
        h3: mul(now, fr(3, 10)), h9: mul(now, fr(9, 10)), yen3: mul(mul(now, fr(3, 10)), RATE), yen9: mul(mul(now, fr(9, 10)), RATE),
        kari: cKari };
      if (eRaw !== null && eRaw >= 1) {
        var e = dec(eRaw);
        var perTeacher = div(now, e);
        var burden = div(perTeacher, fr(1920));
        R.c.perTeacher = perTeacher;
        R.c.pct = roundK(mul(burden, fr(100)), fr(1));
        R.c.over = ge(burden, fr(1));
        R.c.over50 = ge(burden, fr(1, 2));
        if (!R.c.over) { R.c.dayRaw = div(mul(now, fr(30)), mul(e, fr(240))); }   // × 0.5 × 60分
      } else {
        R.c.youngDayRaw = mul(d, fr(30));                                             // × 0.5 × 60分
      }
    }

    /* 納期：あと何回と、1割早まった場合 */
    if (eRaw === 0) { R.d = { line: 'none' }; }
    else if (a.q7 === null || a.q7 === undefined || LEAVE[a.q7] === null) { R.d = { line: 'unknown' }; }
    else {
      var L = LEAVE[a.q7];
      R.d = { line: 'value', L: L, k: Math.floor(L / MONTHS[a.q9]), ijo: (a.q7 === 4) };
    }
    var dYen = mul(mul(n, m), D_YEN_PER);
    R.d.yen = dYen; R.d.manMonths = div(mul(n, m), fr(20)); R.d.mShort = mul(m, fr(9, 10)); R.d.kari = mKari;
    R.d.ref1m = mul(n, REF_1M);

    /* QCDの合計と、回収できる投資額 */
    if (cSave === null) { R.total = { state: 'noTsukisoi' }; }
    else if (perPerson) { R.total = { state: R.youngNone ? 'youngNone' : 'youngUnknown' }; }
    else {
      var sum = add(add(qSave === null ? fr(0) : qSave, cSave), dYen);
      /* ほかの仕事に回せる時間＝品質とコストの「半分に減った場合」の時間の合計（納期の分は時間ではないので入れない） */
      var freeH = add(R.q.state === 'value' ? R.q.halfH : fr(0), R.c.halfH);
      R.total = { state: 'value', yen: sum, kari: (mKari || dKari || eKari), q: qSave, c: cSave, d: dYen, freeH: freeH };
    }
    return R;
  }

  /* ------------------------------------------------------------
     「分からない」の数と出し分け（設計書「結果の出し分け」）
     ------------------------------------------------------------ */
  function unknownCount(a) {
    var u = 0;
    QUESTIONS.forEach(function (q) {
      if (q.notCounted || isSkipped(q, a)) { return; }
      var v = a[q.id];
      if (v === null || v === undefined) { return; }
      var vals = Array.isArray(v) ? v : [v];
      if (vals.some(function (x) { return q.unknown.indexOf(x) >= 0; })) { u += 1; }
    });
    return u;
  }
  function calc3Unknown(a) { return (a.q8 === 8 ? 1 : 0) + (a.q9 === 6 ? 1 : 0) + (a.q10 === 6 ? 1 : 0); }

  var ROUTES = [
    { name: '熟練者から遡る', station: 'saka', mark: 'd',
      one: '熟練者がいるうちに、「なぜ今の形なのか」を聞き取って残せます',
      meeting: 'どなたから、どの順番で聞き取るか' },
    { name: '棚卸しから始める', station: 'tana', mark: null,
      one: '何が残っていて、誰が何を知っているかを、面談の30分で一緒に洗い出し始められます',
      meeting: '社内に残っているもの（資料と人）の洗い出し' },
    { name: '回すから始める', station: 'mawasu', mark: 'q',
      one: '作った手順書や教材を、使う場面と、社内で更新する担当まで決めた形に組み直せます',
      meeting: 'いまの資料が使われていない理由の見立て' },
    { name: '渡すから始める', station: 'watasu', mark: 'c',
      one: 'いまある資料を、若手の理解度に合わせた教材と確認表に置き換えられます',
      meeting: 'どの資料から教材と確認表にするか' },
    { name: '記録から遡る', station: 'saka', mark: 'q',
      one: '残っている{記録の名前}を読み解いて、「なぜ今の形なのか」の一覧にできます',
      meeting: 'どの記録から読み解くか' }
  ];

  function route(a) {
    var expert = [1, 2, 3, 4, 5].indexOf(a.q6) >= 0;
    var hurry = (a.q7 === 0 || a.q7 === 1);
    var why = (a.q4 === 0);                       // 「分からない」は残っていない側
    var few = has(a.q3, 6) || a.q4 === 4;
    var young = (a.q8 >= 1 && a.q8 <= 7);
    var u = unknownCount(a), c3 = calc3Unknown(a);
    var f = { expert: expert, hurry: hurry, why: why, few: few, young: young, unknown: u, calc3: c3 };
    if (expert && ((hurry && !why) || few)) { f.i = 0; f.variant = (hurry && !why) ? 'hurry' : 'few'; return f; }
    if (u >= 5 || c3 >= 2 || a.q2 === 7 || (!expert && few)) { f.i = 1; return f; }
    if (has(a.q1, 5) || a.q5 === 1) { f.i = 2; return f; }
    if (young && (why || (a.q5 === 0 && has(a.q1, 2)))) { f.i = 3; return f; }
    f.i = 4; return f;
  }

  /* {記録の名前}：選んだ記録から最大2つ。設備・装置をつくって納める会社は図面と改造履歴に寄せる */
  var RECORD_NAMES = ['過去トラ', '改造履歴', '図面の赤入れ', '日報・保全記録', 'プログラムの変更の記録', '作業の動画・写真'];
  function recordName(a) {
    var sel = a.q3 || [];
    var order = a.q13 === 3 ? [2, 1, 0, 3, 4, 5] : [0, 1, 2, 3, 4, 5];
    var picked = order.filter(function (i) { return sel.indexOf(i) >= 0; }).slice(0, 2);
    return picked.length ? picked.map(function (i) { return RECORD_NAMES[i]; }).join('と') : '記録';
  }

  /* ------------------------------------------------------------
     文を組み立てる（結果の1枚・答えた直後の画面・メールで同じ文を使う）
     ------------------------------------------------------------ */
  var COND = '教える時間とミス・やり直しが半分に減り、一人立ちが1割早まった場合';
  var KARI = '（仮）';
  var LEAVE_WORD = ['1年以内', '約2〜3年', '約5年', '約10年', '10年より先'];

  function texts(a, R, rt) {
    R = R || compute(a);
    rt = rt || route(a);
    var T = {};
    var r = ROUTES[rt.i];
    T.routeIndex = rt.i;
    T.routeName = r.name;
    T.station = r.station;
    T.one = r.one.replace('{記録の名前}', recordName(a));
    T.meeting = r.meeting;
    T.tech = TECH_LABEL[a.q2];
    T.manyKari = rt.calc3 >= 2;

    /* 理由の文と、添える文 */
    var reason = [], extra = [];
    if (rt.i === 0) {
      if (rt.variant === 'hurry') {
        reason.push('いちばん早く離れる方まで、' + (a.q7 === 0 ? 'あと1年以内です。' : 'あと約2〜3年です。') +
          '記録に「なぜ」が残っていない分、本人に聞けるうちに残すのが先です。');
      } else {
        reason.push('記録が少ない分、技術は熟練者の頭の中にあります。聞き取って、形に残すところから始めます。');
      }
      extra.push('聞き取りは、社内の利害に関わらない立場でロアニクスが行います。');
    } else if (rt.i === 1) {
      reason.push('何が残っていて、誰が何を知っているかが見えないまま教材を作ると、的外れになりやすいためです。まず、残っているもの（資料と人）を洗い出します。');
      if (!rt.expert && rt.few) {
        reason.push('いまいちばん詳しい方の経験と、設備に残っている情報（プログラムなど）から、どこまで読み解けるかを確かめるところからです。');
      }
    } else if (rt.i === 2) {
      reason.push('資料はすでにあります。足りないのは、背景の共有と動機づけ、業務への組み込みです。ここを決めないまま作り直しても、また使われなくなるおそれがあります。');
    } else if (rt.i === 3) {
      reason.push('材料は社内にそろっています。時間を使っているのは、毎回人が付き添って教えることです。教材と確認表に置き換えると、付き添いを「質問に答える所」に寄せられます。');
      if (!rt.why) { reason.push('「なぜ」が抜けている所だけ、遡って補います。'); }
    } else {
      if (rt.why) {
        reason.push('記録に「なぜ」まで残っているのは大きな資産です。足りないのは、記録どうしのつながりです。一覧にまとめておくと、教える人が入ったときに教材にしやすくなります。');
      } else {
        reason.push('材料は社内に残っています。足りないのは「なぜ」と、記録どうしのつながりです。記録を読み、詳しい方に確かめて、「なぜ今の形なのか」の一覧にまとめます。');
      }
      if (a.q6 === 0) { reason.push('熟練者がいない分、記録の読み解きが中心になります。どこまで読み解けるかは、面談で記録の種類を伺って確かめます。'); }
    }
    var saidRead = reason.some(function (s) { return s.indexOf('どこまで読み解ける') >= 0; });
    if ((a.q2 === 3 || a.q2 === 4 || a.q2 === 6) && !saidRead) { extra.push('どこまで読み解けるかは面談で確かめます。'); }
    if (a.q2 === 1 || a.q2 === 2) { extra.push('手段の例：3Dシミュレータ（本物の設備を止めずに試せる場）'); }
    T.reason = reason; T.extra = extra;

    /* まず見てほしい所の印 */
    var mark = r.mark;
    if (mark === 'c' && R.c.state === 'none') { mark = 'q'; }
    T.mark = mark;

    /* 効果の合計と、回収の目安 */
    var tot = { cond: COND };
    if (R.total.state === 'value') {
      tot.state = 'value';
      tot.kari = R.total.kari;
      tot.hero = '約' + man(R.total.yen);
      tot.heroN = manN(R.total.yen);
      tot.roi = 'この合計で見ると、投資（費用と、社内でかかる時間）が約' + man(R.total.yen) + '以下なら、1年分の効果で元が取れる計算です' + (R.total.kari ? KARI : '');
      tot.parts = [];
      if (R.q.state === 'value') { tot.parts.push({ key: 'q', label: '品質', txt: '約' + man(R.total.q), v: num(R.total.q) }); }
      else if (R.q.state === 'none') { tot.parts.push({ key: 'q', label: '品質', txt: 'ほとんどない', v: 0 }); }
      tot.parts.push({ key: 'c', label: 'コスト', txt: '約' + man(R.total.c), v: num(R.total.c) });
      tot.parts.push({ key: 'd', label: '納期', txt: '約' + man(R.total.d), v: num(R.total.d) });
      tot.qNote = R.q.state === 'unknown' ? '※品質の分は入っていません（回数が分かると出せます）' : null;
      /* 合計のすぐ下：ほかの仕事に回せる時間を、期間と人数に直す（「仮」は時間のあとに1回だけ。＝の右は時間を直しただけのため） */
      var ft = R.total.kari ? KARI : '';
      tot.free = { label: 'ほかの仕事に回せる時間', h: '年 約' + hours(R.total.freeH) + ft, eq: '＝' + freeEq(R.total.freeH) };
      tot.freeLine = tot.free.label + '：' + tot.free.h + tot.free.eq;
    } else {
      tot.state = R.total.state;
      tot.alt = R.total.state === 'noTsukisoi' ? '教える時間がすでに少ないため、合計と回収の目安は面談で一緒に確かめます'
        : R.total.state === 'youngNone' ? '新しく覚える人の予定が決まると、合計と回収の目安が出ます（面談で確認）'
          : '若手の人数が分かると、合計と回収の目安が出ます（面談で確認）';
    }
    T.total = tot;

    /* 品質 */
    var Q = { state: R.q.state, sayMiss: has(a.q1, 4), sayWhy: has(a.q1, 1) };
    if (R.q.state === 'value') {
      Q.big = '年 約' + hours(R.q.h) + '（約' + man(R.q.yen) + '）' + (R.q.kari ? KARI : '');
      Q.half = '半分に減った場合 約' + hours(R.q.halfH) + '・約' + man(R.q.halfYen) + '浮く' + (R.q.kari ? KARI : '');
    } else if (R.q.state === 'none') {
      Q.big = 'ミス・やり直しは、ほとんどない（ご回答）';
    } else {
      Q.big = 'ミス・やり直しの回数が分かると、金額が出せます（面談で確認）';
    }
    Q.records = (function () {
      var sel = a.q3 || [];
      if (has(sel, 7)) { return { state: 'unknown' }; }
      return { state: 'value', items: RECORD_NAMES.map(function (nm, i) { return { name: nm, on: has(sel, i) }; }) };
    })();
    var WHY_LV = [3, 1, 2, 2, 1, null];
    var WHY_TXT = { 1: 'ほぼ残っていない', 2: '一部', 3: '残っている' };
    var TEACH_LV = [3, 2, 1, null];
    var TEACH_TXT = { 1: '頭の中だけ', 2: '人によって違う', 3: 'そろっている' };
    var wl = WHY_LV[a.q4], tl = TEACH_LV[a.q5];
    Q.why = wl ? { level: wl, txt: WHY_TXT[wl] } : null;
    Q.teach = tl ? { level: tl, txt: TEACH_TXT[tl] } : null;
    Q.bothUnknown = (a.q4 === 5 && a.q5 === 3);
    var WAYS = [null, null, '3通り', '5通り', '10通り', '20通り以上', null];
    Q.ways = ((a.q5 === 1 || a.q5 === 2) && WAYS[a.q6]) ? '教え方 最大' + WAYS[a.q6] + ' → 教材と確認テストで1通りに' : null;
    T.quality = Q;

    /* コスト */
    var C = { state: R.c.state, perPerson: R.perPerson };
    if (R.c.state === 'value') {
      var tag = R.c.kari ? KARI : '';
      if (R.perPerson) {
        C.label = '若手1人の場合';
        C.big = '若手1人あたり 約' + hours(R.c.now) + '（約' + man(R.c.nowYen) + '）' + tag;
      } else {
        C.big = '年 約' + hours(R.c.now) + '（約' + man(R.c.nowYen) + '）' + tag;
      }
      C.years = '1人の勤務の' + years(R.c.now) + tag;
      C.nowH = hours(R.c.now); C.halfHtxt = hours(R.c.halfH);
      C.half = '半分に減った場合 約' + hours(R.c.halfH) + '・約' + man(R.c.halfYen) + '浮く' + tag;
      C.range = '3割〜9割なら約' + comma(hoursN(R.c.h3)) + '〜' + hours(R.c.h9) + '（約' + comma(manN(R.c.yen3)) + '〜' + man(R.c.yen9) + '）' + tag;
      if (R.c.perTeacher) {
        if (R.c.over) {
          C.perDay = '熟練者だけでは付き添いきれない量です。ほかの先輩も教えているか、面談で確認します';
        } else {
          C.perDay = '教える人1人あたり、' + perDay(R.c.dayRaw) + '浮く計算（半分に減った場合）' + tag;
          if (R.c.over50) { C.over50 = 'いまは教える人の勤務の約' + R.c.pct + '%が付き添いです' + tag; }
        }
        C.perTeacherYear = '年 約' + hours(R.c.perTeacher) + tag;
      } else {
        C.perDay = '若手1人を教えるごとに、' + perDay(R.c.youngDayRaw) + '浮く（半分に減った場合）' + tag;
      }
      C.perYoung = '約' + hours(R.c.per) + tag;
    } else {
      C.big = '付き添いの時間は、すでに少ない状態です（ご回答）';
    }
    T.cost = C;

    /* 納期 */
    var D = { line: R.d.line, kari: R.d.kari, m: num(R.m), label: R.perPerson ? '若手1人の場合' : null };
    var dk = R.d.kari ? KARI : '';
    if (R.d.line === 'none') { D.say = '熟練者はすでにいません（ご回答）'; }
    else if (R.d.line === 'unknown') { D.say = '熟練者が離れる時期が分かると、間に合うかが見えます（面談で確認）'; }
    else {
      D.L = R.d.L; D.k = R.d.k; D.m = num(R.m); D.ijo = R.d.ijo; D.leaveWord = LEAVE_WORD[a.q7];
      if (R.d.k === 0) { D.say = '一人立ちより先に、熟練者が離れる見込みです'; }
      else if (R.d.k >= 11) { D.say = '熟練者がいるうちに一人立ちまで育てられるのは、あと10回以上' + dk; }
      else { D.say = '熟練者がいるうちに一人立ちまで育てられるのは、あと約' + R.d.k + '回' + (R.d.ijo ? '以上' : '') + dk; }
    }
    D.faster = (R.perPerson ? '若手1人の場合：' : '') + '一人立ちが1割早まった場合 ' + num(R.m) + 'か月→約' + tenth(R.d.mShort) + 'か月、年 約' + man(R.d.yen) + '分 早く戦力に' + dk;
    T.delivery = D;

    /* メールと共有文に使う「教えることに使っている時間」 */
    if (R.c.state === 'value') {
      T.timeLine = (R.perPerson ? '若手1人あたり 約' : '年 約') + hours(R.c.now) + '（約' + man(R.c.nowYen) + '）' + (R.c.kari ? KARI : '');
    } else {
      T.timeLine = null;
    }
    T.leaveWord = (a.q6 === 0) ? null : (a.q7 === null || a.q7 === undefined || a.q7 === 5) ? null : LEAVE_WORD[a.q7];
    return T;
  }

  /* 立場別の「あなたにとって」（結果メールにだけ出す） */
  function roleLine(a, R, T) {
    if (R.c.state === 'none') { return '付き添いの時間は、すでに少ない状態です（ご回答）。品質と納期の数字を中心にご覧ください'; }
    var tag = R.c.kari ? KARI : '';
    /* 若手の人数が分からないとき・教えられる人が分からないときは「若手1人あたり」で出す */
    var perYoung = '若手1人あたり、付き添いに約' + hours(R.c.per) + tag;
    var perT = (R.c.perTeacher && !R.perPerson) ? ('教える人1人あたり、付き添いに年 約' + hours(R.c.perTeacher) + tag) : perYoung;
    switch (a.q15) {
      case 0:
        return perT + 'を使っている目安です。教材と確認表に置き換えると、同じ説明をくり返す時間を『質問に答える所』に寄せられます。上の方に説明するときは、この1枚をそのままお使いください';
      case 1:
        /* 部下の方（教える人たち）の合計 */
        return '部下の方が付き添いに使っている時間は、' + (R.perPerson ? '若手1人あたり 約' + hours(R.c.per) : '年 約' + hours(R.c.now)) + tag + 'の目安です。上に説明する材料として、この1枚をそのままお使いいただけます';
      case 2:
        var dept = R.perPerson ? ('若手1人あたり 約' + hours(R.c.per)) : ('年 約' + hours(R.c.now));
        return '部門で付き添いに使っている時間は' + dept + tag + (T.leaveWord ? '、いちばん早く熟練者が離れるまで' + T.leaveWord : '') + 'です。判断の材料としてお使いください';
      case 3:
        if (R.total.state === 'value') {
          return '品質・コスト・納期で見た効果は、条件つきで年 約' + man(R.total.yen) + (R.total.kari ? KARI : '') + 'の目安です。投資の判断の材料として、前提とあわせてお使いください';
        }
        return '会社として教えることに使っている時間は、若手1人あたり 約' + hours(R.c.per) + '（約' + man(mul(R.c.per, RATE)) + '）' + tag + 'の目安です';
      case 4:
        return '教育計画に入れられる数字として、前提とあわせてお使いください';
      default:
        return '結果は、ご回答から計算した目安です。前提とあわせてお使いください';
    }
  }

  /* 上の方への共有文（結果の1枚でコピーする） */
  function shareText(a, R, T) {
    var L = ['技術伝承の無料診断（ロアニクス株式会社）を受けました。結果は目安です。'];
    L.push('・始めるのが合いそうな所：' + T.routeName + '（' + T.one + '）');
    if (T.total.state === 'value') {
      L.push('・品質・コスト・納期の効果の合計：年 ' + T.total.hero + (T.total.kari ? KARI : '') + '（' + COND + '）');
      L.push('・' + T.total.freeLine);
    } else {
      L.push('・品質・コスト・納期の効果の合計：' + T.total.alt);
    }
    L.push('・教えることに使っている時間：' + (T.timeLine || '付き添いの時間は、すでに少ない状態です（ご回答）'));
    var lv = (a.q6 === 0) ? '熟練者はすでにいません（ご回答）' : (T.leaveWord || '分からない（面談で確認）');
    L.push('・いちばん早く熟練者が離れるまで：' + lv);
    L.push('計算の前提つきの1枚を添付します。');
    return L.join('\n');
  }

  /* 前提（図解の中の要点5行／結果メール） */
  var PREMISE5 = [
    'ご回答と国の統計から計算した目安です。効果を約束するものではありません。',
    '金額は、製造業の平均的な人件費（会社負担をふくめ1時間あたり約3,600円、若手は月 約28.1万円）で計算しています。',
    '浮く時間・金額は、人件費が減ることではなく、ほかの仕事に回せる時間を金額に直したものです。',
    '「半分に減った場合」「1割早まった場合」は、統計の裏付けがない条件です。教える時間の半分は当社の事例をもとに置いた値、育成中の若手は半人前として計算しています。',
    '回収の目安は、仕組みが回り始めたあとの1年分の効果で計算しています。「仮」は、「分からない」と答えた所を仮の値で計算した数字です。' + VERSION_LABEL + '。'
  ];
  /* 図解のすぐ下に入れる全文 */
  var PREMISE_FULL = [
    'この結果は、ご回答と国の統計から計算した目安です。効果を約束するものではありません。',
    '金額は、製造業の平均的な人件費で計算しています（会社負担をふくめ1時間あたり約3,600円、若手は月 約28.1万円）。御社の実際の金額とは違います。',
    '浮く時間・金額は、人件費が減ることではありません。ほかの仕事に回せる時間を、金額に直したものです。',
    '教える時間の減り方は、当社の事例（PLCを100名に教える場合、付き添う時間が約96%減）をそのまま当てはめていません。3割・5割・9割に減った場合の幅で示し、合計には半分に減った場合を使っています。',
    'ミス・やり直しが半分に減る、一人立ちが1割早まる、は統計の裏付けがない条件です。育成中の若手は、半人前として計算しています。',
    'ミス・やり直しは、片付けに入った人（若手本人をのぞく）の手間（時間）だけを数えています。材料や部品のロス、お客さまへの影響は入れていません。',
    '毎年この人数の若手が新しく覚える場合の、1年あたりの値です。仕組みを作っている間（事例では2年）は、効果は小さくなります。',
    '回収の目安は、仕組みが回り始めたあとの1年分の効果です。教材づくりのために社内でかかる時間（熟練者への聞き取りなど）は入れていません。費用を入れた回収の年数は、面談で一緒に出します。',
    '合計は丸める前の数で足しているため、内訳を足した数と1万円ずれることがあります。',
    '「分からない」と答えた所は、仮の値で計算しています（「仮」と表示）。',
    VERSION_LABEL + '。出典：厚生労働省「毎月勤労統計調査」「就労条件総合調査」「賃金構造基本統計調査」、労働政策研究・研修機構の調査。'
  ];

  /* 結果メールの文（設計書「結果メール」と「差し込む文の切り替え」） */
  function mailText(a, opts) {
    opts = opts || {};
    var R = compute(a), rt = route(a), T = texts(a, R, rt);
    var L = [];
    L.push((opts.name ? opts.name + '様' : 'ご担当者様'));
    L.push('');
    L.push('ロアニクスの西原です。技術伝承の無料診断にお答えいただき、ありがとうございました！ 結果をお送りします。');
    L.push('');
    L.push('■ 結果の要約（目安）');
    L.push('・始めるのが合いそうな所：' + T.routeName + '（' + T.one + '）');
    if (T.total.state === 'value') {
      var parts = T.total.parts.map(function (p) { return p.label + ' ' + p.txt; }).join('／');
      L.push('・品質・コスト・納期（QCD）の効果の合計：年 ' + T.total.hero + (T.total.kari ? KARI : '') + '（' + COND + '。' + parts + '）');
      L.push('・' + T.total.freeLine);
      if (T.total.qNote) { L.push(T.total.qNote); }
      L.push('・' + T.total.roi);
    } else {
      L.push('・' + T.total.alt);
    }
    L.push('・教えることに使っている時間：' + (T.timeLine || '付き添いの時間は、すでに少ない状態です（ご回答）'));
    L.push('・' + T.delivery.say);
    L.push('・' + roleLine(a, R, T));
    L.push('結果の1枚：' + (opts.resultUrl || '{結果ページのURL}'));
    L.push('画像とPDFで保存できます。そのまま上の方にお渡しいただけます。');
    L.push('');
    L.push('※計算の前提（要点）');
    PREMISE5.forEach(function (p) { L.push('・' + p); });
    L.push('くわしい前提と出典は、結果の1枚の下に載せています。');
    L.push('');
    L.push('■ 個別面談のご案内（オンライン30分・無料）');
    L.push('結果を御社の実際の数字で確かめる時間です。');
    L.push('・' + T.meeting);
    L.push('・計算の前提を御社の数字に置き換えた目安');
    L.push('・費用を入れて、元が取れるまでの年数と、お見積りの前提');
    L.push((a.q2 === 1 || a.q2 === 2) ? '教材や3Dシミュレータ（本物の設備を止めずに何度でも試せる場）の実際の画面もお見せします。' : '教材の実際の画面もお見せします。');
    L.push('資料のご用意は要りません。社外秘の資料をお見せいただく必要もありません。');
    L.push('上の方とご一緒の参加も歓迎します。診断だけで終わっても問題ありません。');
    L.push('日程はこちらから選べます。');
    L.push(opts.bookingUrl || '{日程調整フォームのURL}');
    L.push('急ぎませんので、ご都合のよいときにお使いください。');
    L.push('このメールに返信いただければ、西原が直接読みます。');
    L.push('――');
    L.push('ロアニクス株式会社　代表取締役　西原健人（生産設備屋のイヌ）');
    L.push('〒542-0081 大阪府大阪市中央区南船場3丁目2番22号 おおきに南船場ビル205');
    L.push(opts.sender || 'nishihara.kento@lorenics.co.jp');
    L.push('https://lorenics.com/');
    L.push('');
    L.push('今後のご案内が不要なときは、こちらから止められます。');   /* UTAGEでは配信を止めるURLが必須 */
    L.push(opts.cancelUrl || '{配信を止めるURL}');
    return L.join('\n');
  }

  /* 結果メールに差し込む文（UTAGEの見えない項目に入れて送る。文の切り替えはここで済ませる）
     行の頭の「・」も項目に入れて渡す。どの項目も空にならないようにして、メールのひな形では各項目を1行に1つだけ置く
     ・出たり出なかったりする行（ほかの仕事に回せる時間・品質の注・回収の目安）は、合計の行とまとめて total に改行つきで入れる
       （項目ごとに分けると、出ないときにメールに空の行が残るため）
     ・宛名は、お名前がないとき「ご担当者様」にする（UTAGEの差し込みには、空のときの代わりの文がないため）
     ・結果の1枚は記号（#から後ろ）だけを渡し、URLの前半はメールのひな形に書いておく（ほかのサイトへのリンクを差し込まれないように）
     UTAGEの項目：greet=free1 route=free2 one=free3 total=free4 time=free5 delivery=free6 role=free7 meeting=free8 screen=free9
                  resultHash=free10 answers=free11（js/diag.js の CONFIG と合わせる） */
  function mailFields(a, opts) {
    opts = opts || {};
    var R = compute(a), rt = route(a), T = texts(a, R, rt);
    var f = {};
    f.greet = opts.name ? opts.name + '様' : 'ご担当者様';
    f.route = T.routeName;                                   /* ひな形：・始めるのが合いそうな所：{route}（{one}） */
    f.one = T.one;
    var lines = [];
    if (T.total.state === 'value') {
      lines.push('・品質・コスト・納期（QCD）の効果の合計：年 ' + T.total.hero + (T.total.kari ? KARI : '') + '（' + COND + '。' +
        T.total.parts.map(function (p) { return p.label + ' ' + p.txt; }).join('／') + '）');
      lines.push('・' + T.total.freeLine);
      if (T.total.qNote) { lines.push(T.total.qNote); }
      lines.push('・' + T.total.roi);
    } else {
      lines.push('・' + T.total.alt);
    }
    f.total = lines.join('\n');
    f.time = '・教えることに使っている時間：' + (T.timeLine || '付き添いの時間は、すでに少ない状態です（ご回答）');
    f.delivery = '・' + T.delivery.say;
    f.role = '・' + roleLine(a, R, T);
    f.meeting = '・' + T.meeting;
    f.screen = (a.q2 === 1 || a.q2 === 2) ? '教材や3Dシミュレータ（本物の設備を止めずに何度でも試せる場）の実際の画面もお見せします。' : '教材の実際の画面もお見せします。';
    f.resultHash = opts.hash || '';
    f.answers = encodeAll(a);
    return f;
  }

  /* ------------------------------------------------------------
     答えの記号
     ・結果の1枚のURL：問1〜問13（立場・社内の段階・規模は入れない）＋始める所＋回答日＋版
     ・UTAGEに送る記号：16問すべて（面談前カード用）
     ------------------------------------------------------------ */
  function encOne(q, v) {
    if (v === null || v === undefined) { return q.type === 'multi' ? '--' : '-'; }
    if (q.type === 'multi') {
      var mask = 0; v.forEach(function (i) { mask |= (1 << i); });
      return ('0' + mask.toString(16)).slice(-2);
    }
    return v.toString(36);
  }
  function decOne(q, s) {
    if (s === '-' || s === '--') { return null; }
    if (q.type === 'multi') {
      var mask = parseInt(s, 16), out = [];
      if (isNaN(mask)) { throw new Error('bad'); }
      for (var i = 0; i < q.options.length; i++) { if (mask & (1 << i)) { out.push(i); } }
      return out;
    }
    var n = parseInt(s, 36);
    if (isNaN(n) || n < 0 || n >= q.options.length) { throw new Error('bad'); }
    return n;
  }
  var URL_QS = QUESTIONS.slice(0, 13);
  function encodeAnswers(a, list) { return list.map(function (q) { return encOne(q, a[q.id]); }).join(''); }
  function encodeAll(a) { return 'v' + VERSION + ':' + encodeAnswers(a, QUESTIONS); }

  function today() {
    var t = new Date();
    return '' + t.getFullYear() + ('0' + (t.getMonth() + 1)).slice(-2) + ('0' + t.getDate()).slice(-2);
  }
  /* 例：#v1.2_20261012_0_110031121332220（版_回答日_始める所_答えの記号）。英数字と . _ - だけ */
  function resultHash(a, date) {
    var rt = route(a);
    return '#v' + VERSION + '_' + (date || today()) + '_' + rt.i + '_' + encodeAnswers(a, URL_QS);
  }
  function parseResultHash(hash) {
    var parts = String(hash || '').replace(/^#/, '').split('_');
    if (parts.length !== 4) { return null; }
    var p = { v: parts[0].replace(/^v/, ''), d: parts[1], r: parts[2], a: parts[3] };
    if (p.v !== VERSION || !p.a) { return null; }
    var a = {}, pos = 0;
    try {
      URL_QS.forEach(function (q) {
        var len = q.type === 'multi' ? 2 : 1;
        a[q.id] = decOne(q, p.a.substr(pos, len)); pos += len;
      });
    } catch (e) { return null; }
    if (pos !== p.a.length) { return null; }
    a.q14 = null; a.q15 = null; a.q16 = null;
    /* 必須の問いがそろっているか（飛ばした問いはそのまま） */
    var ok = URL_QS.every(function (q) {
      if (isSkipped(q, a)) { return true; }
      var v = a[q.id];
      return q.type === 'multi' ? (Array.isArray(v) && v.length > 0) : (typeof v === 'number');
    });
    if (!ok) { return null; }
    var r = parseInt(p.r, 10);
    var d = /^\d{8}$/.test(p.d || '') ? p.d : null;
    return { answers: a, routeIndex: (r >= 0 && r <= 4) ? r : null, date: d };
  }
  function dateLabel(d) {
    if (!d) { return ''; }
    return d.slice(0, 4) + '年' + parseInt(d.slice(4, 6), 10) + '月' + parseInt(d.slice(6, 8), 10) + '日';
  }

  return {
    VERSION: VERSION, VERSION_LABEL: VERSION_LABEL,
    QUESTIONS: QUESTIONS, SCREENS: SCREENS, BY_ID: BY_ID, TECH_SHORT: TECH_SHORT, TECH_LABEL: TECH_LABEL,
    ROUTES: ROUTES, RECORD_NAMES: RECORD_NAMES, PREMISE5: PREMISE5, PREMISE_FULL: PREMISE_FULL, COND: COND,
    isSkipped: isSkipped, compute: compute, route: route, unknownCount: unknownCount, recordName: recordName,
    texts: texts, roleLine: roleLine, shareText: shareText, mailText: mailText, mailFields: mailFields,
    encodeAll: encodeAll, resultHash: resultHash, parseResultHash: parseResultHash, dateLabel: dateLabel, today: today,
    /* 検算用（試験で使う） */
    _f: { fr: fr, dec: dec, mul: mul, div: div, add: add, num: num, roundK: roundK, hours: hours, hoursN: hoursN, man: man, manN: manN,
      years: years, perDay: perDay, tenth: tenth, comma: comma, freeEq: freeEq }
  };
});
