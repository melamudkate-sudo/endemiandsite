/* Shared responsive behavior for media rails that remain native scroll surfaces. */
(() => {
  const rail = document.querySelector('.manufacturing-proof-rail');
  if (!rail) return;

  const items = [...rail.querySelectorAll('.manufacturing-proof-media')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const advanceDelay = 5600;
  let advanceTimer = null;
  let isVisible = false;
  let isHovered = false;
  let hasFocus = false;
  let isDragging = false;
  let dragStart = null;

  const hasOverflow = () => rail.scrollWidth > rail.clientWidth + 4;
  const canAdvance = () => hasOverflow() && isVisible && !isHovered && !hasFocus && !isDragging &&
    document.visibilityState === 'visible' && !reducedMotion.matches;

  function stopAdvance() {
    clearTimeout(advanceTimer);
    advanceTimer = null;
  }

  function nearestItemIndex() {
    return items.reduce((nearest,index) => {
      const nearestDistance = Math.abs(items[nearest].offsetLeft - rail.scrollLeft);
      const distance = Math.abs(items[index].offsetLeft - rail.scrollLeft);
      return distance < nearestDistance ? index : nearest;
    },0);
  }

  function scheduleAdvance() {
    stopAdvance();
    if (!canAdvance()) return;
    advanceTimer = setTimeout(() => {
      const lastStartIndex = items.reduce((last,index) =>
        items[index].offsetLeft <= rail.scrollWidth - rail.clientWidth + 2 ? index : last, 0);
      const currentIndex = nearestItemIndex();
      const nextIndex = currentIndex >= lastStartIndex ? 0 : currentIndex + 1;
      rail.scrollTo({ left:items[nextIndex].offsetLeft, behavior:'smooth' });
      scheduleAdvance();
    },advanceDelay);
  }

  new IntersectionObserver(entries => {
    isVisible = entries[0]?.isIntersecting && entries[0].intersectionRatio >= .4;
    scheduleAdvance();
  }, { threshold:[0,.4,.75] }).observe(rail);

  rail.addEventListener('pointerenter', () => { isHovered = true; stopAdvance(); });
  rail.addEventListener('pointerleave', () => {
    isHovered = false;
    if (!isDragging) scheduleAdvance();
  });
  rail.addEventListener('focusin', () => { hasFocus = true; stopAdvance(); });
  rail.addEventListener('focusout', () => {
    requestAnimationFrame(() => {
      hasFocus = rail.contains(document.activeElement);
      scheduleAdvance();
    });
  });
  rail.addEventListener('wheel', scheduleAdvance,{ passive:true });

  rail.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.pointerType !== 'mouse') return;
    dragStart = { x:event.clientX, scrollLeft:rail.scrollLeft, id:event.pointerId };
    isDragging = true;
    stopAdvance();
    rail.setPointerCapture(event.pointerId);
  });
  rail.addEventListener('pointermove', event => {
    if (!dragStart || dragStart.id !== event.pointerId) return;
    rail.scrollLeft = dragStart.scrollLeft - (event.clientX - dragStart.x);
  });
  const finishDrag = event => {
    if (!dragStart || dragStart.id !== event.pointerId) return;
    dragStart = null;
    isDragging = false;
    if (rail.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId);
    scheduleAdvance();
  };
  rail.addEventListener('pointerup',finishDrag);
  rail.addEventListener('pointercancel',finishDrag);

  document.addEventListener('visibilitychange',scheduleAdvance);
  reducedMotion.addEventListener('change',scheduleAdvance);
  new ResizeObserver(scheduleAdvance).observe(rail);
})();
