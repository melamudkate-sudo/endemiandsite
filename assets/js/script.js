/* DEMIAND / navigation, motion and contact interactions. */
(() => {
  const header = document.querySelector('.nav');
  const navigation = header.querySelector('nav');
  const menuToggle = header.querySelector('.menu-toggle');
  const moreToggle = header.querySelector('.nav-sections');
  const moreMenu = document.querySelector('.section-menu');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');

  [
    ['.brand-ready', 'potential'], ['.distributor-value', 'advantages'],
    ['.numbers', 'demand'], ['.margins', 'commercial'],
    ['.app-ecosystem', 'smartcook'], ['.compliance', 'compliance'],
    ['.quality', 'quality'], ['.after-sales', 'after-sales'],
    ['.world', 'global'], ['.ip', 'ip'], ['.distributor-terms', 'terms']
  ].forEach(([selector, id]) => { document.querySelector(selector).id ||= id; });

  function closeMenus() {
    navigation.classList.remove('open');
    moreMenu.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
    moreToggle.setAttribute('aria-expanded', 'false');
    moreMenu.setAttribute('aria-hidden', 'true');
  }
  menuToggle.addEventListener('click', () => {
    const open = !navigation.classList.contains('open');
    closeMenus();
    navigation.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  moreToggle.addEventListener('click', () => {
    const open = !moreMenu.classList.contains('open');
    moreMenu.classList.toggle('open', open);
    moreToggle.setAttribute('aria-expanded', String(open));
    moreMenu.setAttribute('aria-hidden', String(!open));
  });
  moreMenu.querySelector('button').addEventListener('click', () => { closeMenus(); moreToggle.focus(); });
  header.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenus));
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const focus = moreMenu.classList.contains('open') ? moreToggle : menuToggle;
    const wasOpen = navigation.classList.contains('open') || moreMenu.classList.contains('open');
    closeMenus();
    if (wasOpen) focus.focus();
  });
  document.addEventListener('pointerdown', event => { if (!header.contains(event.target)) closeMenus(); });

  const marketTabs = [...document.querySelectorAll('.market-tabs [role=tab]')];
  function selectMarket(index, focus = false) {
    marketTabs.forEach((tab, i) => {
      const active = i === index;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    });
    if (focus) marketTabs[index].focus();
  }
  marketTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectMarket(index));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % marketTabs.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + marketTabs.length - 1) % marketTabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = marketTabs.length - 1;
      if (next !== undefined) { event.preventDefault(); selectMarket(next, true); }
    });
  });

  const launchBundle = document.querySelector('.launch-bundle');
  const launchChoices = [...document.querySelectorAll('.launch-choice')];
  const overview = {
    number: launchBundle.querySelector('strong b').textContent,
    title: launchBundle.querySelector('strong span').innerHTML,
    description: launchBundle.querySelector('p').textContent
  };
  function selectLaunch(choice) {
    launchChoices.forEach(item => item.setAttribute('aria-pressed', String(item === choice)));
    launchBundle.querySelector('strong b').textContent = choice ? choice.querySelector('i').textContent : overview.number;
    launchBundle.querySelector('strong span').innerHTML = choice ? choice.querySelector('strong').innerHTML : overview.title;
    launchBundle.querySelector('p').textContent = choice ? choice.querySelector('.asset-description').textContent : overview.description;
    launchBundle.classList.remove('is-changing');
    requestAnimationFrame(() => launchBundle.classList.add('is-changing'));
  }
  launchChoices.forEach(choice => choice.addEventListener('click', () => selectLaunch(choice.getAttribute('aria-pressed') === 'true' ? null : choice)));
  document.querySelector('.launch-reset').addEventListener('click', () => selectLaunch(null));

  const partnerTerms = [...document.querySelectorAll('.terms-accordion details')];
  partnerTerms.forEach(detail => detail.querySelector('summary').addEventListener('click', event => {
    event.preventDefault();
    const expand = !detail.open;
    partnerTerms.forEach(item => { item.open = item === detail && expand; });
  }));

  document.querySelectorAll('.innovation-photo-frame,.quality-path article').forEach(node => node.classList.add('reveal'));
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .06, rootMargin: '0px 0px -3% 0px' });
  document.querySelectorAll('.reveal').forEach(node => revealObserver.observe(node));
  document.querySelectorAll('.products,.four-cards,.benefit-grid,.innovation-points,.ip-grid,.connected-features,.quality-path').forEach(group => {
    [...group.children].forEach((node, index) => {
      node.style.transitionDelay = Math.min(index * 75, 225) + 'ms';
    });
  });
  const photographs = [...document.querySelectorAll('.factory-photo,.innovation-photo-frame img')];
  let scrollQueued = false;
  function updateScroll() {
    scrollQueued = false;
    header.classList.toggle('scrolled', scrollY > 24);
    document.querySelectorAll('.reveal:not(.visible)').forEach(node => {
      const rect = node.getBoundingClientRect();
      if (rect.top < innerHeight * .97 && rect.bottom > 0 && rect.left < innerWidth && rect.right > 0) node.classList.add('visible');
    });
    photographs.forEach(photo => {
      const rect = photo.parentElement.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight) return;
      const shift = reducedMotion.matches ? 0 : Math.max(-8, Math.min(8, (rect.top + rect.height / 2 - innerHeight / 2) * .025));
      photo.style.setProperty('--image-shift', shift.toFixed(2) + 'px');
    });
  }
  addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); }
  }, { passive: true });
  addEventListener('resize', updateScroll, { passive: true });
  updateScroll();

  const model = document.querySelector('.hero-model');
  const stage = document.querySelector('.model-stage');
  const hero = document.querySelector('.hero');
  let dragging = false;
  const syncMotionPreference = () => model.toggleAttribute('auto-rotate', !reducedMotion.matches);
  reducedMotion.addEventListener('change', syncMotionPreference);
  syncMotionPreference();
  model.addEventListener('pointerdown', () => { dragging = true; stage.style.setProperty('--model-ry', '0deg'); });
  addEventListener('pointerup', () => { dragging = false; });
  hero.addEventListener('pointermove', event => {
    if (dragging || reducedMotion.matches || !finePointer.matches) return;
    const rect = hero.getBoundingClientRect();
    const position = (event.clientX - rect.left) / rect.width * 2 - 1;
    stage.style.setProperty('--model-ry', (position * 2).toFixed(2) + 'deg');
  });
  hero.addEventListener('pointerleave', () => stage.style.setProperty('--model-ry', '0deg'));
  model.addEventListener('progress', event => {
    const loader = model.querySelector('.model-loader');
    loader.querySelector('i').style.width = event.detail.totalProgress * 100 + '%';
    loader.hidden = event.detail.totalProgress >= 1;
  });

  const form = document.querySelector('.partner-form');
  const partnerEmail = document.querySelector('.contact-channels button span').textContent.trim();
  const subjects = ['International distribution partnership', 'Request WhatsApp / WeChat contact', 'Book a B2B introduction'];
  document.querySelectorAll('.contact-channels button').forEach((button, index) => {
    button.addEventListener('click', () => { location.href = 'mailto:' + partnerEmail + '?subject=' + encodeURIComponent(subjects[index]); });
  });
  form.querySelectorAll('input, select').forEach(field => { field.required = true; });
  form.querySelector('.form-submit small').textContent = 'Prepare an email request. Nothing is sent automatically.';
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const body = ['International distribution enquiry', '', 'Business email: ' + data.get('email'), 'Company: ' + data.get('company'), 'Country / market: ' + data.get('market'), 'Product categories: ' + data.get('category'), '', 'Please share wholesale pricing, MOQ, lead times and distributor terms.'].join('\n');
    const link = document.createElement('a');
    link.href = 'mailto:' + partnerEmail + '?subject=' + encodeURIComponent('DEMIAND distribution enquiry — ' + data.get('company')) + '&body=' + encodeURIComponent(body);
    link.textContent = 'Open your email request ↗';
    const status = form.querySelector('.form-status');
    status.replaceChildren(link);
    form.querySelector('.form-submit small')?.replaceWith(status);
  });
})();
