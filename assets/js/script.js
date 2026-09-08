/* DEMIAND / navigation, motion and contact interactions. */
(() => {
  const header = document.querySelector('.nav');
  const navigation = header.querySelector('nav');
  const menuToggle = header.querySelector('.menu-toggle');
  const moreToggle = header.querySelector('.nav-sections');
  const moreMenu = document.querySelector('.section-menu');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');

  moreMenu.inert = true;
  moreMenu.querySelectorAll('.section-menu-grid a').forEach((link, index) => link.style.setProperty('--menu-order', index));
  function positionMorePointer() {
    const trigger = moreToggle.getBoundingClientRect();
    const left = header.getBoundingClientRect().left + moreMenu.offsetLeft;
    const anchor = Math.max(24, Math.min(moreMenu.offsetWidth - 24, trigger.left + trigger.width / 2 - left));
    moreMenu.style.setProperty('--menu-anchor', anchor + 'px');
  }
  addEventListener('resize', positionMorePointer, { passive:true });
  document.fonts.ready.then(positionMorePointer);
  let menuCloseTimer;
  function setMoreOpen(open) {
    clearTimeout(menuCloseTimer);
    const wasOpen = moreMenu.classList.contains('open');
    moreMenu.classList.toggle('open', open);
    moreMenu.classList.toggle('closing', !open && wasOpen && !reducedMotion.matches);
    moreMenu.inert = !open;
    moreToggle.setAttribute('aria-expanded', String(open));
    moreMenu.setAttribute('aria-hidden', String(!open));
    if (!open) menuCloseTimer = setTimeout(() => moreMenu.classList.remove('closing'), reducedMotion.matches ? 0 : 420);
  }
  function closeMenus() {
    navigation.classList.remove('open');
    setMoreOpen(false);
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
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
    positionMorePointer();
    setMoreOpen(open);
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

  const launchChoices = [...document.querySelectorAll('.launch-choice')];
  const launchFrames = [...document.querySelectorAll('.launch-frame')];
  function selectLaunch(choice, animate = true) {
    const before = launchFrames.map(frame => frame.getBoundingClientRect());
    launchFrames.forEach(frame => frame.getAnimations().forEach(animation => animation.cancel()));
    launchChoices.forEach(item => item.setAttribute('aria-pressed', String(item === choice)));
    const selected = choice.dataset.preview;
    let slot = 1;
    launchFrames.forEach(frame => {
      const dominant = frame.dataset.preview === selected;
      frame.dataset.slot = dominant ? '0' : String(slot++);
      frame.classList.toggle('is-dominant', dominant);
      frame.style.order = dominant ? '-1' : '';
    });
    if (animate && !reducedMotion.matches) launchFrames.forEach((frame, i) => {
      const after = frame.getBoundingClientRect();
      frame.animate([
        { transform: `translate(${before[i].left - after.left}px,${before[i].top - after.top}px) scale(${before[i].width / after.width},${before[i].height / after.height})`, opacity:.7 },
        { transform:'none', opacity:1 }
      ], { duration:650, easing:'cubic-bezier(.22,.7,.2,1)' });
    });
    document.querySelector('.launch-status').textContent = choice.querySelector('strong').textContent + ' preview selected';
  }
  launchChoices.forEach((choice, index) => {
    choice.addEventListener('click', () => selectLaunch(choice));
    choice.addEventListener('keydown', event => {
      const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (!offset) return;
      event.preventDefault();
      const next = launchChoices[(index + offset + launchChoices.length) % launchChoices.length];
      next.focus(); selectLaunch(next);
    });
  });
  selectLaunch(launchChoices[0], false);

  const partnerTerms = [...document.querySelectorAll('.terms-accordion details')];
  partnerTerms.forEach(detail => detail.querySelector('summary').addEventListener('click', event => {
    event.preventDefault();
    const expand = !detail.open;
    partnerTerms.forEach(item => { item.open = item === detail && expand; });
  }));

  // Scroll-triggered surfaces: exactly two mechanics, with no layout animation.
  const sections = [...document.querySelectorAll('.viewport-section')];
  const sectionBackgrounds = sections.map(section => {
    const style = getComputedStyle(section);
    return style.backgroundImage === 'none' && style.backgroundColor === 'rgba(0, 0, 0, 0)'
      ? getComputedStyle(document.body).background : style.background;
  });
  const chapterStates = new Map(sections.filter(section => section.dataset.transition).map(section => [section, 'pending']));
  const activeChapters = new Map();
  const contentAllowed = node => {
    const state = chapterStates.get(node.closest('.viewport-section'));
    return !state || state === 'content' || state === 'complete';
  };
  function revealChapterContent(section) {
    chapterStates.set(section, 'content');
    section.querySelectorAll('.reveal').forEach(node => {
      const rect = node.getBoundingClientRect();
      if (rect.top < innerHeight && rect.bottom > 0) node.classList.add('visible');
    });
  }
  function enterChapter(section) {
    if (chapterStates.get(section) !== 'pending') return;
    const rect = section.getBoundingClientRect();
    // Direct anchor navigation and fast scrolling always show the destination immediately.
    if (reducedMotion.matches || rect.top < innerHeight * .4) {
      revealChapterContent(section);
      chapterStates.set(section, 'complete');
      return;
    }
    chapterStates.set(section, 'surface');
    const index = sections.indexOf(section);
    const layered = section.dataset.transition === 'layered';
    const previous = sections[index - 1];
    const surface = document.createElement('div');
    surface.className = 'chapter-surface';
    surface.setAttribute('aria-hidden', 'true');
    surface.style.background = sectionBackgrounds[index];
    const originalBackground = section.style.background;
    section.style.background = sectionBackgrounds[index - 1];
    const content = [...section.children];
    section.prepend(surface);
    const radius = getComputedStyle(section).borderTopLeftRadius;
    const duration = layered ? 1050 : 900;
    const contentDelay = layered ? 430 : 700;
    const easing = 'cubic-bezier(.22,.7,.2,1)';
    const animations = [];
    animations.push(surface.animate(layered ? [
      { transform:`translateY(28px) scaleY(${(rect.height - 28) / rect.height})`, clipPath:`inset(5% 0 0 round ${radius} ${radius} 0 0)`, opacity:.35 },
      { transform:'none', clipPath:`inset(0 round ${radius} ${radius} 0 0)`, opacity:1 }
    ] : [
      { clipPath:'inset(100% 0 0)' },
      { clipPath:'inset(0)' }
    ], { duration, easing, fill:'both' }));
    let depth;
    if (layered && previous) {
      depth = document.createElement('div');
      depth.className = 'chapter-depth';
      depth.setAttribute('aria-hidden', 'true');
      previous.append(depth);
      animations.push(depth.animate([{opacity:0},{opacity:.08,offset:.5},{opacity:0}], {duration:1200,easing,fill:'both'}));
    }
    content.forEach((node, i) => {
      if (getComputedStyle(node).display === 'contents') return;
      animations.push(node.animate([
        {opacity:0,transform:'translateY(12px)'},
        {opacity:1,transform:'none'}
      ], {duration:480,delay:contentDelay + Math.min(i * 35,140),easing,fill:'backwards'}));
    });
    const contentTimer = setTimeout(() => revealChapterContent(section), contentDelay);
    let finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      clearTimeout(contentTimer);
      animations.forEach(animation => animation.cancel());
      surface.remove(); depth?.remove();
      section.style.background = originalBackground;
      revealChapterContent(section);
      chapterStates.set(section, 'complete');
      activeChapters.delete(section);
    }
    activeChapters.set(section, finish);
    Promise.all(animations.map(animation => animation.finished)).then(finish).catch(() => {});
  }
  const chapterObserver = new IntersectionObserver(entries => {
    entries.forEach(({target, isIntersecting}) => {
      if (!isIntersecting) return;
      enterChapter(target);
      chapterObserver.unobserve(target);
    });
  }, {rootMargin:'0px 0px 100px 0px',threshold:0});
  chapterStates.forEach((_, section) => chapterObserver.observe(section));
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) activeChapters.forEach(finish => finish());
  });

  document.querySelectorAll('.localization-badges li').forEach((node, i) => node.style.setProperty('--order', i));
  document.querySelectorAll('.innovation-photo-frame').forEach(node => node.classList.add('reveal'));
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || !contentAllowed(entry.target)) return;
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .06, rootMargin: '0px 0px -3% 0px' });
  document.querySelectorAll('.reveal').forEach(node => revealObserver.observe(node));
  document.querySelectorAll('.products,.benefit-grid,.innovation-points,.ip-grid,.connected-features,.quality-contact,.commerce-route,.manufacturing-metrics').forEach(group => {
    [...group.children].forEach((node, index) => {
      node.style.transitionDelay = Math.min(index * 110, 330) + 'ms';
    });
  });
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(({target, isIntersecting}) => {
      if (!isIntersecting) return;
      counterObserver.unobserve(target);
      if (reducedMotion.matches) return;
      const end = Number(target.dataset.count);
      const decimals = Number(target.dataset.decimals || 0);
      const start = performance.now();
      const tick = now => {
        const progress = Math.min((now - start) / 1350, 1);
        target.textContent = (end * (1 - Math.pow(1 - progress, 4))).toFixed(decimals);
        if (progress < 1 && !reducedMotion.matches) requestAnimationFrame(tick);
        else target.textContent = end.toFixed(decimals);
      };
      requestAnimationFrame(tick);
    });
  }, {threshold:.8});
  document.querySelectorAll('[data-count]').forEach(node => counterObserver.observe(node));

  const photographs = [...document.querySelectorAll('.innovation-photo-frame img')];
  let scrollQueued = false;
  function updateScroll() {
    scrollQueued = false;
    activeChapters.forEach((finish, section) => {
      if (section.getBoundingClientRect().top < innerHeight * .35) finish();
    });
    header.classList.toggle('scrolled', scrollY > 24);
    document.querySelectorAll('.reveal:not(.visible)').forEach(node => {
      const rect = node.getBoundingClientRect();
      if (contentAllowed(node) && rect.top < innerHeight * .97 && rect.bottom > 0 && rect.left < innerWidth && rect.right > 0) node.classList.add('visible');
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
