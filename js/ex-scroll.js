/* トップ「つくるものの例」：横に動かすボタン。端ではボタンを押せなくする */
(() => {
  document.querySelectorAll('.ex-scroll').forEach(box => {
    const track = box.querySelector('.ex-track');
    const prev = box.querySelector('.ex-btn.prev');
    const next = box.querySelector('.ex-btn.next');
    if (!track || !prev || !next) return;
    const step = () => {
      const card = track.querySelector('.exc');
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
    };
    const update = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max;
    };
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    // 今いるカードの番号から、1枚前・1枚後ろの位置へ送る（連打しても1枚ずつ進む）
    const go = dir => {
      const w = step();
      const max = track.scrollWidth - track.clientWidth;
      const pos = track.scrollLeft / w;
      const i = dir > 0 ? Math.floor(pos + 0.01) + 1 : Math.ceil(pos - 0.01) - 1;
      track.scrollTo({ left: Math.max(0, Math.min(max, i * w)), behavior: smooth ? 'smooth' : 'auto' });
    };
    prev.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });
})();
