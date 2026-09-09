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

  const partnerTerms = [...document.querySelectorAll('.terms-accordion details')];
  let selectedTerm = partnerTerms.find(detail => detail.open);
  const closingTerms = new Map();
  partnerTerms.forEach(detail => detail.querySelector('summary').addEventListener('click', event => {
    event.preventDefault();
    selectedTerm = selectedTerm === detail ? null : detail;
    partnerTerms.forEach(item => {
      closingTerms.get(item)?.cancel();
      closingTerms.delete(item);
      if (item === selectedTerm) { item.open = true; return; }
      if (!item.open) return;
      if (reducedMotion.matches) { item.open = false; return; }
      const animation = item.querySelector('p').animate([
        { opacity:1, transform:'none', clipPath:'inset(0)' },
        { opacity:0, transform:'translateY(-5px)', clipPath:'inset(0 0 100%)' }
      ], { duration:180, easing:'ease-out' });
      closingTerms.set(item, animation);
      animation.finished.then(() => {
        if (closingTerms.get(item) !== animation) return;
        item.open = false; closingTerms.delete(item);
      }).catch(() => {});
    });
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

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || !contentAllowed(entry.target)) return;
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .06, rootMargin: '0px 0px -3% 0px' });
  document.querySelectorAll('.reveal').forEach(node => revealObserver.observe(node));
  document.querySelectorAll('.products,.benefit-grid,.connected-features,.manufacturing-metrics').forEach(group => {
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
  const partnerEmail = form.dataset.email;
  form.querySelectorAll('input, select').forEach(field => { field.required = true; });
  form.querySelector('.form-submit small').textContent = 'Prepare an email request. Nothing is sent automatically.';
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const body = ['International distribution enquiry', '', 'Business email: ' + data.get('email'), 'Company: ' + data.get('company'), 'Country / market: ' + data.get('market'), 'Product categories: ' + data.get('category'), '', 'Please share wholesale pricing, MOQ, lead times and distributor terms.'].join('\n');
    const request = 'mailto:' + partnerEmail + '?subject=' + encodeURIComponent('DEMIAND distribution enquiry — ' + data.get('company')) + '&body=' + encodeURIComponent(body);
    location.href = request;
    form.querySelector('.form-status').textContent = 'Email request prepared. Review and send it in your email app.';
  });
})();

/* Catalog data: neutral demo swatches only. Replace labels, swatches and images here. */
(() => {
  const demoColors = ['#dedfe2', '#474a51', '#b7bbc3', '#8c929d'].map((swatch, i) => ({ label: `Placeholder color ${i + 1}`, swatch, image: null }));
  const models = (counts, singular) => counts.map((count, i) => ({
    name: `${singular} / MODEL ${String(i + 1).padStart(2, '0')}`,
    colors: demoColors.slice(0, count).map(color => ({ ...color })), image: null
  }));
  const catalog = {
    'air-fryers': { title: 'AIR FRYERS', models: models([3, 3, 3, 2, 2, 2, 2], 'AIR FRYER') },
    'coffee-makers': { title: 'COFFEE MAKERS', models: models([3, 2, 1], 'COFFEE MAKER') },
    blenders: { title: 'BLENDERS', models: models([2, 4], 'BLENDER') }
  };
  const section = document.getElementById('portfolio');
  const categories = section.querySelector('.products');
  const categoryHeading = section.querySelector('.category-heading');
  const heading = section.querySelector('.catalog-heading');
  const view = section.querySelector('.catalog-view');
  const rail = section.querySelector('.catalog-rail');
  const title = section.querySelector('#catalog-title');
  const count = section.querySelector('#catalog-count');
  const anchor = section.querySelector('.catalog-anchor');
  const back = section.querySelector('.catalog-back');
  const prev = section.querySelector('.catalog-prev');
  const next = section.querySelector('.catalog-next');
  const progress = section.querySelector('.catalog-progress');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const easing = 'cubic-bezier(.22,.7,.2,1)';
  let selected, busy = false, active = 0;
  const pad = number => String(number).padStart(2, '0');
  function animate(element, frames, options = {}) {
    if (reducedMotion.matches) return Promise.resolve();
    return element.animate(frames, { duration: 650, easing, ...options }).finished.catch(() => {});
  }
  function showImage(frame, src, alt) {
    frame.replaceChildren();
    if (src) {
      const image = new Image(); image.src = src; image.alt = alt; image.draggable = false;
      frame.append(image);
    } else {
      const label = document.createElement('span'); label.className = 'placeholder-label'; label.textContent = 'PRODUCT IMAGE / PLACEHOLDER'; frame.append(label);
    }
  }
  function render(data) {
    rail.replaceChildren();
    data.models.forEach((model, index) => {
      const card = document.createElement('article'); card.className = 'catalog-card';
      card.setAttribute('aria-label', `${model.name}, ${model.colors.length} placeholder colors`);
      const frame = document.createElement('div'); frame.className = 'catalog-image media-placeholder';
      showImage(frame, model.image, model.name);
      const name = document.createElement('h3'); name.textContent = model.name;
      const swatches = document.createElement('div'); swatches.className = 'catalog-swatches'; swatches.setAttribute('role', 'group'); swatches.setAttribute('aria-label', `${model.name}: illustrative color options`);
      model.colors.forEach((color, i) => {
        const button = document.createElement('button'); button.type = 'button'; button.style.setProperty('--swatch', color.swatch);
        button.setAttribute('aria-label', `${model.name}: ${color.label}`); button.title = color.label;
        button.setAttribute('aria-pressed', String(i === 0));
        button.addEventListener('click', () => {
          swatches.querySelectorAll('button').forEach(node => node.setAttribute('aria-pressed', String(node === button)));
          showImage(frame, color.image || model.image, `${model.name}: ${color.label}`);
          animate(frame, [{ opacity: .4 }, { opacity: 1 }], { duration: 300 });
        });
        swatches.append(button);
      });
      card.append(frame, name, swatches); card.style.setProperty('--card', index); rail.append(card);
    });
  }
  function update() {
    if (view.hidden) return;
    const max = rail.scrollWidth - rail.clientWidth;
    const start = rail.getBoundingClientRect().left;
    const cards = [...rail.children];
    // At the end of the rail, the final model becomes the progress anchor.
    active = max > 2 && rail.scrollLeft >= max - 2 ? cards.length - 1 : cards.reduce((best, card, i) => Math.abs(card.getBoundingClientRect().left - start) < Math.abs(cards[best].getBoundingClientRect().left - start) ? i : best, 0);
    progress.textContent = `${pad(active + 1)} / ${pad(cards.length)}`;
    prev.disabled = rail.scrollLeft <= 2; next.disabled = rail.scrollLeft >= max - 2;
    section.querySelector('.catalog-track i').style.width = `${max > 2 ? 100 * (active + 1) / cards.length : 100}%`;
  }
  function move(direction) {
    const step = rail.firstElementChild.getBoundingClientRect().width + parseFloat(getComputedStyle(rail).gap);
    rail.scrollBy({ left: direction * step, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  }
  async function open(button) {
    if (busy) return; busy = true; selected = button;
    const source = button.querySelector('img');
    const from = source.getBoundingClientRect();
    const data = catalog[button.dataset.category];
    title.textContent = data.title; count.textContent = `${pad(data.models.length)} MODELS`;
    anchor.replaceChildren(source.cloneNode());
    render(data);
    await Promise.all([...categories.children].filter(card => card !== button).map(card => animate(card, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(18px) scale(.96)' }], { duration: 240 })));
    categories.hidden = true; categoryHeading.hidden = true; heading.hidden = false; view.hidden = false;
    section.classList.add('catalog-open'); rail.scrollLeft = 0; update();
    const image = anchor.firstElementChild; const to = image.getBoundingClientRect();
    const shared = animate(image, [{ transform: `translate(${from.left - to.left}px,${from.top - to.top}px) scale(${from.width / to.width},${from.height / to.height})` }, { transform: 'none' }], { duration: 700 });
    const cards = [...rail.children].map((card, i) => animate(card, [{ opacity: 0, transform: 'translateY(28px) scale(.97)', clipPath: 'inset(0 0 100% round 16px)' }, { opacity: 1, transform: 'none', clipPath: 'inset(0 round 16px)' }], { delay: 130 + Math.min(i, 3) * 75, fill: 'backwards' }));
    await Promise.all([shared, ...cards]); busy = false; title.focus({ preventScroll: true });
  }
  async function close() {
    if (busy) return; busy = true;
    await animate(view, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(12px)' }], { duration: 220 });
    view.hidden = true; heading.hidden = true; categories.hidden = false; categoryHeading.hidden = false; section.classList.remove('catalog-open');
    categories.querySelectorAll('.reveal').forEach(card => card.classList.add('visible'));
    await Promise.all([...categories.children].map((card, i) => animate(card, [{ opacity: 0, transform: 'translateY(18px) scale(.97)' }, { opacity: 1, transform: 'none' }], { delay: i * 55, fill: 'backwards' })));
    busy = false; selected.focus({ preventScroll: true });
  }
  categories.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => open(button)));
  back.addEventListener('click', close);
  prev.addEventListener('click', () => move(-1)); next.addEventListener('click', () => move(1));
  rail.addEventListener('scroll', update, { passive: true }); new ResizeObserver(update).observe(rail);
  rail.addEventListener('keydown', event => {
    if (event.target !== rail) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); }
    if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); rail.scrollTo({ left: event.key === 'Home' ? 0 : rail.scrollWidth, behavior: reducedMotion.matches ? 'instant' : 'smooth' }); }
  });
  section.addEventListener('keydown', event => { if (event.key === 'Escape' && !view.hidden) { event.stopPropagation(); close(); } });
  rail.addEventListener('wheel', event => {
    if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rail.clientWidth : 1);
    const max = rail.scrollWidth - rail.clientWidth;
    if ((delta > 0 && rail.scrollLeft < max - 2) || (delta < 0 && rail.scrollLeft > 2)) { event.preventDefault(); rail.scrollLeft += delta; }
  }, { passive: false });
  let drag = null, suppressClick = false;
  rail.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('button')) return;
    drag = { x: event.clientX, scroll: rail.scrollLeft, id: event.pointerId }; suppressClick = false;
  });
  rail.addEventListener('pointermove', event => {
    if (!drag) return;
    const delta = event.clientX - drag.x;
    if (Math.abs(delta) > 5) { suppressClick = true; rail.setPointerCapture(drag.id); rail.classList.add('dragging'); }
    if (suppressClick) rail.scrollLeft = drag.scroll - delta;
  });
  const endDrag = () => { if (!drag) return; if (rail.hasPointerCapture(drag.id)) rail.releasePointerCapture(drag.id); drag = null; rail.classList.remove('dragging'); };
  window.addEventListener('pointerup', endDrag); rail.addEventListener('pointercancel', endDrag);
  rail.addEventListener('click', event => { if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; } }, true);
})();
