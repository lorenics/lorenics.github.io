/* 技術伝承の無料診断　結果の部品を組み立てる（答えた直後の画面と、結果の1枚で同じ部品を使う）
   文と数は diag-core.js の texts() がつくる。ここでは並べるだけ */
(function (root) {
  'use strict';

  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) { return; }
        if (k === 'class') { e.className = v; }
        else if (k === 'text') { e.textContent = v; }
        else if (k === 'html') { e.innerHTML = v; }
        else if (k === 'style') { e.setAttribute('style', v); }
        else { e.setAttribute(k, v === true ? '' : v); }
      });
    }
    (kids || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) { return; }
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }

  /* 「約314万円」「約1,200時間（仮）」のような数と単位は、途中で折り返さない */
  function rich(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) { e.className = cls; }
    var re = /(約?[\d,.]+(?:万円|時間|か月分|か月|年分|人分|分|回|%)(?:（仮）)?)/g, lastI = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > lastI) { e.appendChild(document.createTextNode(text.slice(lastI, m.index))); }
      var s = document.createElement('span'); s.className = 'nw'; s.textContent = m[1]; e.appendChild(s);
      lastI = m.index + m[1].length;
    }
    if (lastI < text.length) { e.appendChild(document.createTextNode(text.slice(lastI))); }
    return e;
  }

  /* 記録のアイコン（線の絵。意味は下の名前で読む） */
  var ICONS = [
    '<path d="M12 3 2.5 20h19L12 3Z" stroke-linejoin="round"/><path d="M12 9.5v5M12 17.4v.2" stroke-linecap="round"/>',
    '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.1L4 16.7 7.3 20l5.3-5.3a4 4 0 0 0 5.1-5.4l-2.4 2.4-2.6-.7-.7-2.6 2.7-2.1Z" stroke-linejoin="round"/>',
    '<path d="M5 3h9l5 5v13H5V3Z" stroke-linejoin="round"/><path d="M14 3v5h5M8 13l3 3 5-6" stroke-linecap="round" stroke-linejoin="round"/>',
    '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.5h6V4M8.5 10h7M8.5 14h7M8.5 18h4" stroke-linecap="round"/>',
    '<path d="M8 7 3 12l5 5M16 7l5 5-5 5M13.5 5l-3 14" stroke-linecap="round" stroke-linejoin="round"/>',
    '<rect x="3" y="6.5" width="18" height="13" rx="2"/><path d="M8.5 6.5 10 4h4l1.5 2.5"/><circle cx="12" cy="13" r="3.5"/>'
  ];
  function icon(i) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', '28'); s.setAttribute('height', '28');
    s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '2');
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = ICONS[i];
    return s;
  }

  /* ---------- 結論：どこから始めるか（路線図） ---------- */
  var STATIONS = {
    tana: { name: '棚卸し（面談）', cap: '資料と人の洗い出し' },
    saka: { name: '遡る', cap: '「なぜ」を集める' },
    watasu: { name: '渡す', cap: '教材と確認表にする' },
    mawasu: { name: '回す', cap: '社内で足し続ける' }
  };
  function routeMap(T) {
    var list = T.station === 'tana' ? ['tana', 'saka', 'watasu', 'mawasu'] : ['saka', 'watasu', 'mawasu'];
    var here = list.indexOf(T.station);
    var ol = h('ol', { class: 'rs-line' + (list.length === 4 ? ' n4' : ''), style: '--first:' + (50 / list.length).toFixed(3), 'aria-label': '進め方の順番' });
    list.forEach(function (key, i) {
      var st = STATIONS[key];
      var cls = 'rs-st' + (i === here ? ' is-here' : '') + (i === here + 1 ? ' is-next' : '');
      ol.appendChild(h('li', { class: cls, 'aria-current': i === here ? 'step' : null }, [
        i === here ? h('span', { class: 'rs-pin', text: 'ここから' }) : null,
        h('span', { class: 'rs-dot', 'aria-hidden': 'true' }),
        h('b', { text: st.name }),
        h('small', { text: st.cap })
      ]));
    });
    return h('div', { class: 'rs-route' }, [ol]);
  }
  function routeText(T, withReason) {
    var box = h('div', null, [
      h('p', { class: 'rs-name head jp', text: T.routeName }),
      h('p', { class: 'rs-one jp', text: T.one })
    ]);
    if (withReason) {
      box.appendChild(h('ul', { class: 'rs-reason' }, T.reason.map(function (s) { return h('li', { text: s }); })));
      if (T.extra.length) { box.appendChild(h('div', { class: 'rs-extra' }, T.extra.map(function (s) { return h('p', { text: s }); }))); }
    }
    return box;
  }

  /* ---------- 効果の合計と、回収の目安 ---------- */
  function totalBlock(T, opts) {
    var t = T.total;
    var box = h('div', { class: 'rs-total' }, [(opts && opts.label === false) ? null : h('p', { class: 'lbl', text: '品質・コスト・納期で見た効果の合計（年）' })]);
    if (t.state !== 'value') {
      box.appendChild(h('p', { class: 'rs-alt jp', text: t.alt }));
      return box;
    }
    var hero = h('p', { class: 'rs-hero', 'aria-label': '年 ' + t.hero + (t.kari ? '（仮）' : '') }, [
      h('small', { text: '約' }), String(t.heroN).replace(/\B(?=(\d{3})+(?!\d))/g, ','), h('small', { text: '万円' }),
      t.kari ? h('span', { class: 'kari', text: '（仮）' }) : null
    ]);
    box.appendChild(hero);
    /* 条件は合計のすぐ下に1行 */
    box.appendChild(h('p', { class: 'rs-cond', text: '条件：' + t.cond }));
    /* ほかの仕事に回せる時間を、期間（1人の勤務の何か月分）と人数（何人分）に直して見せる */
    if (t.free) {
      box.appendChild(h('div', { class: 'rs-free' }, [
        h('p', { class: 'fl', text: t.free.label }),
        rich('p', 'fv', t.free.h),
        rich('p', 'fe', t.free.eq)
      ]));
    }
    var showParts = !(opts && opts.breakdown === false);
    if (showParts) {
      var sum = t.parts.reduce(function (s2, p) { return s2 + p.v; }, 0);
      var bar = h('div', { class: 'rs-bar', role: 'img', 'aria-label': '内訳 ' + t.parts.map(function (p) { return p.label + ' ' + p.txt; }).join('、') });
      t.parts.forEach(function (p) {
        if (p.v <= 0) { return; }
        bar.appendChild(h('span', { class: p.key, style: 'flex:' + (p.v / sum).toFixed(5) + ' 1 0', title: p.label + ' ' + p.txt }));
      });
      box.appendChild(bar);
      box.appendChild(h('ul', { class: 'rs-leg' }, t.parts.map(function (p) {
        return h('li', null, [h('i', { class: p.key, 'aria-hidden': 'true' }), p.label + ' ' + p.txt]);
      })));
    }
    if (t.qNote) { box.appendChild(h('p', { class: 'rs-note', text: t.qNote })); }
    if (showParts) { box.appendChild(rich('p', 'rs-roi', t.roi)); }
    return box;
  }

  function secHead(key, label, title, look) {
    return h('div', { class: 'rs-sec-h' }, [
      h('span', { class: 'k' }, [h('i', { style: 'background:var(--' + key + ')', 'aria-hidden': 'true' }), label]),
      h('h3', { class: 'head jp', text: title }),
      look ? h('span', { class: 'rs-look', text: 'まず見てほしい所' }) : null
    ]);
  }
  function meter(label, m, flag) {
    var row = h('div', { class: 'rs-meter' }, [h('span', { class: 'ml' }, [label, flag ? h('span', { class: 'rs-flag', text: 'お悩みで選択' }) : null])]);
    if (!m) {
      row.appendChild(h('span', { class: 'mv', text: '分からない（面談で確認）' }));
      return row;
    }
    var segs = h('span', { class: 'rs-segs', role: 'img', 'aria-label': label + '：' + m.txt + '（3段のうち' + m.level + '）' });
    for (var i = 1; i <= 3; i++) { segs.appendChild(h('span', { class: i <= m.level ? 'on' : null })); }
    row.appendChild(segs);
    row.appendChild(h('span', { class: 'mv', text: m.txt }));
    return row;
  }

  /* ---------- 品質 ---------- */
  function qualitySec(T) {
    var Q = T.quality;
    var s = h('section', { class: 'rs-sec' }, [secHead('q', '品質', '正しく、そろって伝わるか', T.mark === 'q')]);
    if (Q.state === 'value') {
      var qb = rich('p', 'rs-big', 'ミス・やり直し ' + Q.big);
      if (Q.sayMiss) { qb.appendChild(h('span', { class: 'rs-flag', text: 'お悩みで選択' })); }
      s.appendChild(qb);
      s.appendChild(rich('p', 'rs-line2', Q.half));
    } else {
      s.appendChild(h('p', { class: 'rs-say jp' }, [Q.big, Q.sayMiss ? h('span', { class: 'rs-flag', text: 'お悩みで選択' }) : null]));
    }
    s.appendChild(h('p', { class: 'rs-line2' }, [h('b', { text: '残っている記録' })]));
    if (Q.records.state === 'unknown') {
      s.appendChild(h('p', { class: 'rs-line2', text: '残っている記録は、面談で確かめます' }));
    } else {
      s.appendChild(h('ul', { class: 'rs-recs' }, Q.records.items.map(function (it, i) {
        return h('li', { class: 'rs-rec' + (it.on ? ' on' : '') }, [h('i', null, [icon(i)]), it.name, it.on ? null : h('em', { text: 'なし' })]);
      })));
    }
    var ms = h('div', { class: 'rs-meters' }, [meter('「なぜ」の残り方', Q.why, Q.sayWhy), meter('教え方のそろい方', Q.teach, false)]);
    s.appendChild(ms);
    if (Q.bothUnknown) { s.appendChild(h('p', { class: 'rs-line2', text: '中身の状態は、面談で一緒に確かめます' })); }
    if (Q.ways) { s.appendChild(h('p', { class: 'rs-say', text: Q.ways })); }
    return s;
  }

  /* ---------- コスト ---------- */
  function costSec(T, R) {
    var C = T.cost;
    var s = h('section', { class: 'rs-sec' }, [secHead('c', 'コスト', '教えるのに、どれだけ時間を使っているか', T.mark === 'c')]);
    if (C.state !== 'value') {
      s.appendChild(h('p', { class: 'rs-say', text: C.big }));
      return s;
    }
    if (C.label) { s.appendChild(h('p', { class: 'rs-line2' }, [h('b', { text: C.label })])); }
    s.appendChild(rich('p', 'rs-big', '付き添い ' + C.big));
    s.appendChild(rich('p', 'rs-line2', C.years));
    s.appendChild(h('div', { class: 'rs-hbars', role: 'img', 'aria-label': '今 ' + C.nowH + '、半分に減った場合 ' + C.halfHtxt }, [
      h('div', { class: 'rs-hb' }, [h('div', { class: 'hl', text: '今' }), h('div', { class: 'hr' }, [h('span', { class: 'ht' }, [h('span', { class: 'hf', style: 'width:100%' })]), h('span', { class: 'hv', text: '約' + C.nowH })])]),
      h('div', { class: 'rs-hb' }, [h('div', { class: 'hl', text: '半分に減った場合' }), h('div', { class: 'hr' }, [h('span', { class: 'ht' }, [h('span', { class: 'hf', style: 'width:50%' })]), h('span', { class: 'hv', text: '約' + C.halfHtxt })])])
    ]));
    s.appendChild(h('p', { class: 'rs-line2' }, [rich('b', null, C.half)]));
    s.appendChild(rich('p', 'rs-line2', C.range));
    s.appendChild(rich('p', 'rs-line2', C.perDay));
    if (C.over50) { s.appendChild(h('p', { class: 'rs-line2', text: C.over50 })); }
    return s;
  }

  /* ---------- 納期 ---------- */
  function timeline(D) {
    var wrap = h('div', { class: 'rs-tl' });
    if (D.line === 'none') { return null; }
    if (D.line === 'value' && D.k === 0) {
      var max = Math.max(D.L, D.m);
      wrap.appendChild(h('div', { class: 'rs-tl-over', role: 'img', 'aria-label': '熟練者が離れるまで ' + D.leaveWord + '、一人立ちまで ' + D.m + 'か月' }, [
        h('div', { class: 'row' }, [h('span', { text: '熟練者が離れるまで' }), h('span', { class: 'bar leave', style: 'width:' + (D.L / max * 100).toFixed(2) + '%' })]),
        h('div', { class: 'row' }, [h('span', { text: '一人立ちまで' }), h('span', { class: 'bar grow', style: 'width:' + (D.m / max * 100).toFixed(2) + '%' })])
      ]));
      wrap.appendChild(h('p', { class: 'rs-tl-cap', text: '熟練者が離れるまで' + D.leaveWord + '／一人立ちまで' + D.m + 'か月' }));
      return wrap;
    }
    var endLabel = D.line === 'unknown' ? '離れる時期は？' : 'いちばん早く離れる熟練者（' + D.leaveWord + '）';
    wrap.appendChild(h('div', { class: 'rs-tl-ends' }, [h('span', { text: '今' }), h('span', { text: endLabel })]));
    var bar = h('div', { class: 'rs-tl-bar', role: 'img' });
    var shown, rest = 0, more = false;
    if (D.line === 'unknown') { shown = 3; }
    else if (D.k >= 11) { shown = 10; more = true; }
    else { shown = D.k; rest = D.L - D.k * D.m; }
    for (var i = 1; i <= shown; i++) { bar.appendChild(h('span', { class: 'sg', style: 'flex:' + D.m + ' 1 0', text: D.line === 'unknown' ? '' : String(i) })); }
    if (rest > 0) { bar.appendChild(h('span', { class: 'sg rest', style: 'flex:' + rest + ' 1 0' })); }
    if (more) { bar.appendChild(h('span', { class: 'more', text: '…' })); }
    if (D.line === 'unknown') { bar.appendChild(h('span', { class: 'q', text: '？' })); }
    bar.setAttribute('aria-label', '一人立ちまでの期間で区切った線。' + (D.line === 'unknown' ? '離れる時期は分からない' : '区切りの数 ' + (more ? '10以上' : D.k)));
    wrap.appendChild(bar);
    wrap.appendChild(h('p', { class: 'rs-tl-cap', text: '1区切り＝一人立ちまでの期間（' + D.m + 'か月' + (D.kari ? '・仮' : '') + '）' + (more ? '。11区切り目より先は省略' : '') }));
    return wrap;
  }
  function deliverySec(T) {
    var D = T.delivery;
    var s = h('section', { class: 'rs-sec' }, [secHead('d', '納期', '熟練者がいるうちに、間に合うか', T.mark === 'd')]);
    var tl = timeline(D);
    if (tl) { s.appendChild(tl); }
    s.appendChild(rich('p', 'rs-say', D.say));
    s.appendChild(rich('p', 'rs-line2', D.faster));
    return s;
  }

  root.LorenicsDiagView = { h: h, routeMap: routeMap, routeText: routeText, totalBlock: totalBlock, qualitySec: qualitySec, costSec: costSec, deliverySec: deliverySec };
})(window);
