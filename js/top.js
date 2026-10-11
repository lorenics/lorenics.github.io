/* トップページ：スマホのメニュー */
(() => {
  const btn = document.querySelector('.menu-btn');
  const drawer = document.getElementById('drawer');
  if (!btn || !drawer) return;
  const close = () => { drawer.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'メニューを開く'); };
  btn.addEventListener('click', () => {
    const open = drawer.hidden;
    drawer.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
  });
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
})();
