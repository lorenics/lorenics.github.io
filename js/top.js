/* トップページ：スマホのメニューと、動きを止めるボタン */
(() => {
  const btn = document.querySelector('.menu-btn');
  const drawer = document.getElementById('drawer');
  if (btn && drawer) {
    const close = () => { drawer.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'メニューを開く'); };
    btn.addEventListener('click', () => {
      const open = drawer.hidden;
      drawer.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    });
    drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  }
  // ヘッダーの「事業内容」：押すと4つの事業が開く。外を押すか Esc で閉じる（パソコンは重ねるだけでも開く）
  document.querySelectorAll('[data-nav-biz]').forEach(box => {
    const b = box.querySelector('.nav-biz-btn');
    if (!b) return;
    const set = open => { box.classList.toggle('is-open', open); b.setAttribute('aria-expanded', open ? 'true' : 'false'); };
    b.addEventListener('click', e => { e.stopPropagation(); set(!box.classList.contains('is-open')); });
    document.addEventListener('click', e => { if (!box.contains(e.target)) set(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && box.classList.contains('is-open')) { set(false); b.focus(); } });
    box.addEventListener('focusout', e => { if (!box.contains(e.relatedTarget)) set(false); });
  });
  // 動きを減らす設定の人にだけ出るボタン。押した人だけ動きを止める（同じタブの間は覚えておく）
  const root = document.getElementById('tb');
  const stop = document.getElementById('motion-stop');
  if (root && stop) {
    let off = false;
    try { off = sessionStorage.getItem('lx-motion') === 'off'; } catch (e) {}
    const set = v => {
      off = v;
      root.classList.toggle('motion-off', v);
      stop.setAttribute('aria-pressed', v ? 'true' : 'false');
      stop.querySelector('span').textContent = v ? 'アニメーションを再開する' : 'アニメーションを停止する';
      try { sessionStorage.setItem('lx-motion', v ? 'off' : 'on'); } catch (e) {}
    };
    set(off);
    stop.addEventListener('click', () => set(!off));
  }
})();
