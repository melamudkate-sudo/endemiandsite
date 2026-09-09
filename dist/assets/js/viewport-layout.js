/* Responsive rails preserve keyboard access without splitting sections. */
(() => {
  // Compact rails preserve every card and give keyboard users explicit controls.
  document.querySelectorAll('.connected-features').forEach((rail, index) => {
    rail.classList.add('adaptive-rail');
    rail.id ||= `detail-rail-${index}`;
    const controls = document.createElement('div');
    controls.className = 'rail-controls';
    controls.innerHTML = '<button type="button" aria-label="Previous item">←</button><span aria-live="polite"></span><button type="button" aria-label="Next item">→</button>';
    controls.querySelectorAll('button').forEach((button, i) => {
      button.setAttribute('aria-controls', rail.id);
      button.addEventListener('click', () => rail.scrollBy({ left: (i ? 1 : -1) * (rail.clientWidth + 12), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));
    });
    const update = () => {
      const overflow = rail.scrollWidth > rail.clientWidth + 4;
      controls.hidden = !overflow;
      const children = [...rail.children];
      const origin = rail.getBoundingClientRect().left;
      const active = children.reduce((best, item, i) => Math.abs(item.getBoundingClientRect().left - origin) < Math.abs(children[best].getBoundingClientRect().left - origin) ? i : best, 0);
      controls.querySelector('span').textContent = `${String(active + 1).padStart(2, '0')} / ${String(children.length).padStart(2, '0')}`;
      controls.firstElementChild.disabled = rail.scrollLeft < 2;
      controls.lastElementChild.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2;
    };
    rail.after(controls);
    rail.addEventListener('scroll', update, { passive: true });
    new ResizeObserver(update).observe(rail);
    update();
  });
})();
