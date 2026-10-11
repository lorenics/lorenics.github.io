/* トップ改定案：スクロールでふわっと出す／左下の無料診断バナー */
(() => {
  const items = document.querySelectorAll('.v2-in');
  if (!('IntersectionObserver' in window)) { items.forEach(el => el.classList.add('is-in')); }
  else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(el => io.observe(el));
  }

  const menu = document.querySelector('.v2-menu');
  const drawer = document.getElementById('v2-drawer');
  if (menu && drawer) {
    const close = () => { drawer.hidden = true; menu.setAttribute('aria-expanded', 'false'); };
    menu.addEventListener('click', () => { const open = drawer.hidden; drawer.hidden = !open; menu.setAttribute('aria-expanded', String(open)); });
    drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  }

  const float = document.querySelector('[data-float]');
  if (!float) return;
  let closed = false;
  try { closed = sessionStorage.getItem('v2-float-closed') === '1'; } catch (e) {}
  if (closed) return;
  float.hidden = false;
  const hero = document.querySelector('.v2-hero');
  const ctas = document.querySelectorAll('.v2-cta');
  let inCta = false;
  const update = () => {
    const past = hero ? hero.getBoundingClientRect().bottom < 0 : true;
    float.classList.toggle('is-show', past && !inCta);
  };
  if ('IntersectionObserver' in window) {
    const seen = new Set();
    const ctaIo = new IntersectionObserver(entries => {
      entries.forEach(e => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)));
      inCta = seen.size > 0;
      update();
    });
    ctas.forEach(c => ctaIo.observe(c));
  }
  addEventListener('scroll', update, { passive: true });
  update();
  float.querySelector('.v2-float__close').addEventListener('click', () => {
    float.hidden = true;
    try { sessionStorage.setItem('v2-float-closed', '1'); } catch (e) {}
  });
})();
