/* 結果の1枚（diagnosis-result.html）
   メールのリンクの「#」の後ろにある答えの記号から、同じ式で図解1枚を描く。
   「#」の後ろはサーバーに送られない。会社名・氏名・メールアドレス・立場・社内の段階は受け取らない */
(function () {
  'use strict';
  var D = window.LorenicsDiag, V = window.LorenicsDiagView, h = V.h;
  var ARROW = '<span class="ar" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h9M7.5 3l4 4-4 4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';

  function fail(box) {
    box.appendChild(h('div', { class: 'rp-err' }, [
      h('h1', { class: 'dg-h2 head', text: '結果を表示できませんでした' }),
      h('p', { text: 'リンクの一部が欠けているようです。結果メールのリンクを、もう一度そのまま開いてください。' }),
      h('p', null, [h('a', { class: 'pill pill-blue mid', href: 'diagnosis.html', html: '診断のページへ' + ARROW })])
    ]));
  }

  /* box：描く場所、p：parseResultHash の結果、opts.preview：試作の画面（保存ボタンは動かない） */
  function render(box, p, opts) {
    opts = opts || {};
    box.innerHTML = '';
    if (!p) { fail(box); return; }
    var a = p.answers, R = D.compute(a), rt = D.route(a);
    if (p.routeIndex !== null && p.routeIndex !== rt.i) { rt.i = p.routeIndex; }
    var T = D.texts(a, R, rt);
    var share = D.shareText(a, R, T);

    /* ---------- 保存と共有（どの方にも図解のすぐ上） ---------- */
    var msg = h('p', { class: 'msg', 'aria-live': 'polite' });
    var actions = h('div', { class: 'rp-actions' }, [
      h('button', { type: 'button', class: 'pill pill-blue', id: 'rp-img', text: '画像で保存' }),
      h('button', { type: 'button', class: 'pill pill-line', id: 'rp-pdf', text: 'PDFで保存' }),
      h('button', { type: 'button', class: 'pill pill-line', id: 'rp-copy', text: '上の方への共有文をコピー' }),
      msg
    ]);
    box.appendChild(actions);

    /* ---------- 図解1枚 ---------- */
    var sheet = h('article', { class: 'rp-sheet', 'aria-label': '技術伝承の診断結果' });
    sheet.appendChild(h('header', { class: 'rp-head' }, [
      h('h1', { class: 'head jp', text: '技術伝承の診断結果（目安）' }),
      h('p', { class: 'meta', text: (p.date ? '回答日 ' + D.dateLabel(p.date) + '／' : '') + '伝えたい技術：' + T.tech }),
      h('p', { class: 'disc', text: 'ご回答から計算した目安です。効果を約束するものではありません。' })
    ]));
    var body = h('div', { class: 'rp-body' });
    if (T.manyKari) { body.appendChild(h('p', { class: 'rp-kari', text: '仮の値が多い結果です。面談で実際の数字に置き換えて計算し直します' })); }
    body.appendChild(h('section', { class: 'rp-blk' }, [h('h2', { class: 'head jp', text: 'どこから始めるか' }), V.routeMap(T), V.routeText(T, true)]));
    body.appendChild(h('section', { class: 'rp-blk' }, [h('h2', { class: 'head jp', text: '品質・コスト・納期で、年にどれだけ浮くか' }), V.totalBlock(T, { label: false })]));
    body.appendChild(V.qualitySec(T));
    body.appendChild(V.costSec(T, R));
    body.appendChild(V.deliverySec(T));
    sheet.appendChild(body);
    sheet.appendChild(h('footer', { class: 'rp-prem' }, [
      h('h2', { text: '計算の前提（要点）' }),
      h('ol', null, D.PREMISE5.map(function (s) { return h('li', { text: s }); })),
      h('div', { class: 'rp-brand' }, [h('img', { src: 'images/lorenics-logo.png', alt: 'ロアニクス株式会社', width: '120', height: '28' }), h('span', null, ['ロアニクス株式会社', h('br'), 'https://lorenics.com/'])])
    ]));
    box.appendChild(sheet);

    /* ---------- 図解の下：全国の状況と、前提の全文 ---------- */
    box.appendChild(h('section', { class: 'rp-more' }, [
      h('h2', { class: 'head', text: '全国の製造業では' }),
      h('div', { class: 'rp-stats' }, [
        h('div', { class: 'rp-stat' }, [h('b', { text: '91.1%' }), h('span', { text: '技能継承を重視している（やや重視しているを含む）' })]),
        h('div', { class: 'rp-stat' }, [h('b', { text: '33.3%' }), h('span', { text: '技能継承がうまくいっている（ややうまくいっているを含む）' })])
      ]),
      h('p', { class: 'rp-src', text: '出典：労働政策研究・研修機構「ものづくり産業における人材確保・定着と技能継承に関する調査」（2026年5月27日公表、製造業4,342社が回答）' })
    ]));
    box.appendChild(h('section', { class: 'rp-more' }, [
      h('h2', { class: 'head', text: '計算の前提と出典（全文）' }),
      h('ul', null, D.PREMISE_FULL.map(function (s) { return h('li', { text: s }); }))
    ]));
    box.appendChild(h('section', { class: 'rp-more' }, [
      h('h2', { class: 'head', text: '個別面談（オンライン30分・無料）' }),
      h('p', { text: '結果を、御社の実際の数字に置き換えて確かめる時間です。日程は、結果メールの日程調整フォームから選べます。' })
    ]));

    /* ---------- ボタンの動き ---------- */
    function say(t) { msg.textContent = t; }
    box.querySelector('#rp-pdf').addEventListener('click', function () {
      if (opts.preview) { say('試作の画面では保存できません。本番のページでは、印刷の画面から「PDFに保存」を選べます。'); return; }
      say('印刷の画面で「PDFに保存」を選んでください。');
      window.print();
    });
    box.querySelector('#rp-copy').addEventListener('click', function () {
      var done = function () { say('共有文をコピーしました。メールやチャットに貼り付けて、この1枚と一緒にお送りください。'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(share).then(done, function () { manual(); });
      } else { manual(); }
    });
    function manual() {
      var ta = h('textarea', { readonly: true, rows: '7', style: 'width:100%;margin-top:8px;font:inherit;font-size:15px;padding:10px;border:2px solid #7f95b5;border-radius:12px' });
      ta.value = share;
      say('うまくコピーできませんでした。下の文を長押しして、コピーしてください。');
      actions.appendChild(ta); ta.focus(); ta.select();
    }
    box.querySelector('#rp-img').addEventListener('click', function () {
      var btn = this;
      if (opts.preview) { say('試作の画面では保存できません。本番のページでは、この1枚を画像で保存できます。'); return; }
      if (!window.html2canvas) { say('画像の保存が使えないため、「PDFで保存」をお使いください。'); return; }
      btn.disabled = true; say('画像をつくっています…');
      var wrap = h('div', { class: 'rp-shot' }); var clone = sheet.cloneNode(true);
      wrap.appendChild(clone); document.body.appendChild(wrap);
      window.html2canvas(clone, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false }).then(function (canvas) {
        document.body.removeChild(wrap);
        canvas.toBlob(function (blob) {
          var name = '技術伝承の診断結果_' + (p.date || D.today()) + '.png';
          var file = (typeof File === 'function') ? new File([blob], name, { type: 'image/png' }) : null;
          if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file], title: '技術伝承の診断結果' }).catch(function () { /* 閉じたときは何もしない */ });
            say('');
          } else {
            var url = URL.createObjectURL(blob), link = h('a', { href: url, download: name });
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
            say('画像を保存しました。');
          }
          btn.disabled = false;
        }, 'image/png');
      }).catch(function () {
        if (wrap.parentNode) { document.body.removeChild(wrap); }
        btn.disabled = false; say('画像をつくれませんでした。「PDFで保存」をお使いください。');
      });
    });
  }

  window.LorenicsDiagResult = { render: render };
  var rp = document.getElementById('rp');
  if (rp && !window.DIAG_PREVIEW) { render(rp, D.parseResultHash(location.hash)); }
})();
