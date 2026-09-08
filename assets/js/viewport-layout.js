/* Keep readable compositions within the available viewport. Large compositions
   become two adjacent, labelled screens; original nodes and listeners survive. */
(() => {
  const sections = [...document.querySelectorAll('main > section, footer.contact')];
  const records = [];
  const contentSelectors = [
    '.hero-object', '.products', '.market-system', '.four-cards', '.benefit-grid', '.demand-stage',
    '.commerce-layout', '.innovation-grid', '.connected-layout', '.launch-system',
    '.regional-system', '.quality-body', '.world-stage', '.ip-grid', '.terms-accordion'
  ];
  contentSelectors.push('.manufacturing-layout');
  contentSelectors.push('.contact-main');

  for (const section of sections) {
    section.classList.add('viewport-section');
    const content = contentSelectors.map(s => section.querySelector(s)).find(Boolean);
    if (!content) continue;
    const marker = document.createComment('composition content');
    content.before(marker);
    const continuation = document.createElement('section');
    continuation.className = `${section.className} viewport-continuation`;
    continuation.removeAttribute('id');
    const label = document.createElement('div');
    label.className = 'continuation-label';
    const originalLabel = section.querySelector('.section-label');
    const eyebrow = section.querySelector('.eyebrow');
    label.textContent = originalLabel ? [...originalLabel.children].map(e => e.textContent.trim()).join(' / ') : (eyebrow?.textContent.trim() || 'DEMIAND / SMARTCOOK SERIES');
    if (section.matches('footer')) label.textContent = originalLabel.firstElementChild.textContent + ' / ' + section.querySelector('.form-head span').textContent;
    continuation.append(label);
    continuation.hidden = true;
    section.after(continuation);
    records.push({ section, content, marker, continuation });
  }

  // Compact rails preserve every card and give keyboard users explicit controls.
  document.querySelectorAll('.products,.four-cards,.benefit-grid,.innovation-points,.connected-features,.quality-path,.ip-grid,.world-stage ol,.localization-stack ul').forEach((rail, index) => {
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
  let timer;
  let lastLayout = '';
  const layoutSignature = () => [innerWidth, innerHeight, ...records.flatMap(({ section, content }) => [section.offsetHeight, content.offsetWidth, content.offsetHeight])].join(':');
  function compose() {
    for (const record of records) {
      const { section, content, marker, continuation } = record;
      const controls = content.nextElementSibling?.classList.contains('rail-controls') ? content.nextElementSibling : null;
      marker.after(content);
      if (controls) content.after(controls);
      continuation.hidden = true;
      section.classList.remove('has-continuation');
    }
    for (const { section, content, continuation } of records) {
      if (section.getBoundingClientRect().height > window.innerHeight + 1) {
        const controls = content.nextElementSibling?.classList.contains('rail-controls') ? content.nextElementSibling : null;
        continuation.append(content);
        if (controls) continuation.append(controls);
        continuation.hidden = false;
        section.classList.add('has-continuation');
      }
    }
    document.documentElement.dataset.composed = 'true';
    document.documentElement.dataset.layoutViewport = `${innerWidth}x${innerHeight}`;
    lastLayout = layoutSignature();
  }
  function scheduleComposition() {
    if (layoutSignature() === lastLayout || timer) return;
    timer = requestAnimationFrame(() => { timer = 0; compose(); });
  }
  window.addEventListener('resize', scheduleComposition);
  const layoutObserver = new ResizeObserver(scheduleComposition);
  records.forEach(({section, content}) => { layoutObserver.observe(section); layoutObserver.observe(content); });
  window.addEventListener('load', compose);
  document.fonts.ready.then(compose);
  compose();
})();
