/* CSS is the single source of timing values for native and scripted motion. */
const demiandMotion = (() => {
  const styles = getComputedStyle(document.documentElement);
  const read = name => parseFloat(styles.getPropertyValue('--motion-' + name));
  return Object.freeze({ micro:read('micro'), state:read('state'), chapter:read('chapter'), stagger:read('stagger'), ease:styles.getPropertyValue('--ease').trim() });
})();
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
    if (!open) menuCloseTimer = setTimeout(() => moreMenu.classList.remove('closing'), reducedMotion.matches ? 0 : demiandMotion.state);
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

  const appStory = document.getElementById('smartcook');
  if (appStory) {
    const storyShell = appStory.querySelector('.app-story-shell');
    const storySlides = [...appStory.querySelectorAll('[data-app-slide]')];
    const storyDots = [...appStory.querySelectorAll('.app-story-pagination button')];
    const storyCount = appStory.querySelector('.app-story-count');
    const storyTitle = appStory.querySelector('.app-story-title');
    const storyTitles = [
      'Digital cooking ecosystem', 'Connected appliance control', 'Three levels of intelligence',
      'Expanded programs', 'Smart programs', 'AI Mode', 'Growing content library',
      'Recipe experience', 'AI Culinary Assistant'
    ];
    const storyScenes = [
      ['0px','0px','0px'], ['-24px','16px','18px'], ['18px','-12px','-12px'],
      ['-10px','24px','26px'], ['28px','4px','-20px'], ['-18px','-20px','12px'],
      ['20px','18px','30px'], ['-30px','-8px','-18px'], ['8px','-24px','20px']
    ];
    let activeStoryIndex = 0;
    let storyAnimations = [];
    let storyGeneration = 0;
    const storyAutoplayDelay = 6500;
    let storyAutoplayTimer = null;
    let storyAutoplayStarted = 0;
    let storyAutoplayRemaining = storyAutoplayDelay;
    let storyInView = false;
    let storyPointerInside = false;
    let storyFocusInside = false;
    let storyDragging = false;

    function storyCanAutoplay() {
      return storyInView && document.visibilityState === 'visible' && !reducedMotion.matches &&
        !storyPointerInside && !storyFocusInside && !storyDragging;
    }

    function clearStoryAutoplayTimer() {
      if (storyAutoplayTimer === null) return;
      clearTimeout(storyAutoplayTimer);
      storyAutoplayTimer = null;
    }

    function pauseStoryAutoplay() {
      if (storyAutoplayTimer !== null) {
        storyAutoplayRemaining = Math.max(250,storyAutoplayRemaining - (performance.now() - storyAutoplayStarted));
      }
      clearStoryAutoplayTimer();
      if (appStory.classList.contains('is-autoplay-running')) appStory.classList.add('is-autoplay-paused');
    }

    function resumeStoryAutoplay() {
      if (!storyCanAutoplay() || storyAutoplayTimer !== null) return;
      if (!appStory.classList.contains('is-autoplay-running')) {
        storyAutoplayRemaining = storyAutoplayDelay;
        appStory.classList.add('is-autoplay-running');
      }
      appStory.classList.remove('is-autoplay-paused');
      storyAutoplayStarted = performance.now();
      storyAutoplayTimer = setTimeout(() => {
        storyAutoplayTimer = null;
        selectStorySlide(activeStoryIndex + 1,1);
      },storyAutoplayRemaining);
    }

    function resetStoryAutoplay() {
      clearStoryAutoplayTimer();
      storyAutoplayRemaining = storyAutoplayDelay;
      appStory.classList.remove('is-autoplay-running','is-autoplay-paused');
      if (!storyCanAutoplay()) return;
      void appStory.offsetWidth;
      appStory.classList.add('is-autoplay-running');
      storyAutoplayStarted = performance.now();
      storyAutoplayTimer = setTimeout(() => {
        storyAutoplayTimer = null;
        selectStorySlide(activeStoryIndex + 1,1);
      },storyAutoplayDelay);
    }

    function settleStory() {
      storyAnimations.forEach(animation => animation.cancel());
      storyAnimations = [];
      storySlides.forEach((slide, index) => {
        const active = index === activeStoryIndex;
        slide.hidden = !active;
        slide.inert = !active;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
      });
    }

    function updateStoryInterface(index) {
      storyCount.textContent = `${String(index + 1).padStart(2,'0')} / ${String(storySlides.length).padStart(2,'0')}`;
      storyTitle.textContent = storyTitles[index];
      storyDots.forEach((dot, dotIndex) => {
        if (dotIndex === index) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
      const [orbitX, orbitY, gridX] = storyScenes[index];
      appStory.style.setProperty('--orbit-x', orbitX);
      appStory.style.setProperty('--orbit-y', orbitY);
      appStory.style.setProperty('--grid-x', gridX);
      appStory.dataset.activeSlide = index;
    }

    function selectStorySlide(requestedIndex, requestedDirection) {
      const nextIndex = (requestedIndex + storySlides.length) % storySlides.length;
      if (nextIndex === activeStoryIndex) {
        resetStoryAutoplay();
        return;
      }
      settleStory();
      const previousIndex = activeStoryIndex;
      const outgoing = storySlides[previousIndex];
      const incoming = storySlides[nextIndex];
      const direction = requestedDirection || (nextIndex > previousIndex ? 1 : -1);
      const generation = ++storyGeneration;
      activeStoryIndex = nextIndex;
      incoming.hidden = false;
      incoming.inert = false;
      incoming.setAttribute('aria-hidden', 'false');
      updateStoryInterface(nextIndex);
      resetStoryAutoplay();

      if (reducedMotion.matches) {
        settleStory();
        return;
      }

      const outgoingCopy = outgoing.querySelector('.app-slide-copy');
      const outgoingVisual = outgoing.querySelector('.app-slide-visual');
      const incomingCopy = incoming.querySelector('.app-slide-copy');
      const incomingVisual = incoming.querySelector('.app-slide-visual');
      const duration = demiandMotion.state;
      const options = { duration, easing: demiandMotion.ease, fill: 'both' };
      storyAnimations = [
        outgoingCopy.animate([{opacity:1,transform:'translateX(0)'},{opacity:0,transform:`translateX(${-16 * direction}px)`}], options),
        outgoingVisual.animate([{opacity:1,transform:'translate3d(0,0,0)'},{opacity:0,transform:`translate3d(${-30 * direction}px,8px,0) scale(.99)`}], options),
        incomingCopy.animate([{opacity:0,transform:`translateX(${18 * direction}px)`},{opacity:1,transform:'translateX(0)'}], {...options, delay:70}),
        incomingVisual.animate([{opacity:0,transform:`translate3d(${36 * direction}px,12px,0) scale(.985)`},{opacity:1,transform:'translate3d(0,0,0) scale(1)'}], {...options, delay:40})
      ];
      const incomingKicker = incoming.querySelector('.app-slide-kicker');
      if (incomingKicker) {
        storyAnimations.push(incomingKicker.animate([
          {opacity:0,clipPath:'inset(0 100% 0 0)',transform:'translateY(-6px)'},
          {opacity:1,clipPath:'inset(0)',transform:'none'}
        ], {...options, delay:60}));
      }
      incoming.querySelectorAll('.app-capability-grid li,.app-step-list li,.app-assistant-request').forEach((item, itemIndex) => {
        storyAnimations.push(item.animate([
          {opacity:0,transform:`translate3d(${16 * direction}px,10px,0)`},
          {opacity:1,filter:'blur(0)',transform:'translate3d(0,0,0)'}
        ], {...options, delay:115 + Math.min(itemIndex,5) * demiandMotion.stagger}));
      });
      incoming.querySelectorAll('.app-phone,.app-intelligence-level').forEach((item, itemIndex) => {
        storyAnimations.push(item.animate([
          {opacity:0,filter:'blur(3px)',transform:`translate3d(${34 * direction}px,14px,0) scale(.975)`},
          {opacity:1,filter:'blur(0)',transform:'translate3d(0,0,0)'}
        ], {...options, delay:90 + Math.min(itemIndex,4) * demiandMotion.stagger}));
      });
      const running = [...storyAnimations];
      Promise.all(running.map(animation => animation.finished)).then(() => {
        if (generation !== storyGeneration) return;
        outgoing.hidden = true;
        outgoing.inert = true;
        outgoing.setAttribute('aria-hidden', 'true');
        incoming.classList.add('is-active');
        running.forEach(animation => animation.cancel());
        storyAnimations = [];
      }).catch(() => {});
    }

    appStory.querySelector('.app-story-prev').addEventListener('click', () => selectStorySlide(activeStoryIndex - 1, -1));
    appStory.querySelector('.app-story-next').addEventListener('click', () => selectStorySlide(activeStoryIndex + 1, 1));
    storyDots.forEach((dot, index) => dot.addEventListener('click', () => selectStorySlide(index, index > activeStoryIndex ? 1 : -1)));
    storyShell.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (event.target.matches('input,select,textarea')) return;
      event.preventDefault();
      selectStorySlide(activeStoryIndex + (event.key === 'ArrowRight' ? 1 : -1), event.key === 'ArrowRight' ? 1 : -1);
    });

    let dragStart = null;
    storyShell.addEventListener('pointerdown', event => {
      if (event.button !== 0 || event.target.closest('button,a')) return;
      dragStart = { x:event.clientX, y:event.clientY, id:event.pointerId };
      storyDragging = true;
      pauseStoryAutoplay();
    });
    storyShell.addEventListener('pointerup', event => {
      if (!dragStart || dragStart.id !== event.pointerId) return;
      const distanceX = event.clientX - dragStart.x;
      const distanceY = event.clientY - dragStart.y;
      dragStart = null;
      storyDragging = false;
      if (Math.abs(distanceX) < 48 || Math.abs(distanceX) < Math.abs(distanceY) * 1.35) {
        resumeStoryAutoplay();
        return;
      }
      selectStorySlide(activeStoryIndex + (distanceX < 0 ? 1 : -1), distanceX < 0 ? 1 : -1);
    });
    storyShell.addEventListener('pointercancel', () => {
      dragStart = null;
      storyDragging = false;
      resumeStoryAutoplay();
    });

    let horizontalWheel = 0;
    let wheelReset;
    storyShell.addEventListener('wheel', event => {
      if (Math.abs(event.deltaX) < Math.abs(event.deltaY) * 1.25 || Math.abs(event.deltaX) < 2) return;
      event.preventDefault();
      horizontalWheel += event.deltaX;
      clearTimeout(wheelReset);
      wheelReset = setTimeout(() => { horizontalWheel = 0; }, 180);
      if (Math.abs(horizontalWheel) < 42) return;
      const direction = horizontalWheel > 0 ? 1 : -1;
      horizontalWheel = 0;
      selectStorySlide(activeStoryIndex + direction, direction);
    }, { passive:false });

    const storyVisibilityObserver = new IntersectionObserver(entries => {
      storyInView = entries[0]?.isIntersecting && entries[0].intersectionRatio >= .45;
      if (storyInView) resumeStoryAutoplay();
      else pauseStoryAutoplay();
    }, { threshold:[0,.45,.75] });
    storyVisibilityObserver.observe(appStory);

    appStory.addEventListener('pointerenter', () => {
      storyPointerInside = true;
      pauseStoryAutoplay();
    });
    appStory.addEventListener('pointerleave', () => {
      storyPointerInside = false;
      if (!storyDragging) resumeStoryAutoplay();
    });
    appStory.addEventListener('focusin', () => {
      storyFocusInside = true;
      pauseStoryAutoplay();
    });
    appStory.addEventListener('focusout', () => {
      requestAnimationFrame(() => {
        storyFocusInside = appStory.contains(document.activeElement);
        if (!storyFocusInside) resumeStoryAutoplay();
      });
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') resumeStoryAutoplay();
      else pauseStoryAutoplay();
    });
    reducedMotion.addEventListener('change', () => {
      storyGeneration++;
      settleStory();
      if (reducedMotion.matches) {
        clearStoryAutoplayTimer();
        appStory.classList.remove('is-autoplay-running','is-autoplay-paused');
      } else {
        resetStoryAutoplay();
      }
    });
    updateStoryInterface(0);
    settleStory();
  }

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
      ], { duration:demiandMotion.state, easing:demiandMotion.ease });
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
    const surface = document.createElement('div');
    surface.className = 'chapter-surface';
    surface.setAttribute('aria-hidden', 'true');
    surface.style.background = layered ? sectionBackgrounds[index] : sectionBackgrounds[index - 1];
    const content = [...section.children];
    section.prepend(surface);
    const radius = getComputedStyle(section).borderTopLeftRadius;
    const duration = demiandMotion.chapter;
    const contentDelay = demiandMotion.micro;
    const easing = demiandMotion.ease;
    const animations = [];
    animations.push(surface.animate(layered ? [
      { transform:`translateY(28px) scaleY(${(rect.height - 28) / rect.height})`, clipPath:`inset(5% 0 0 round ${radius} ${radius} 0 0)`, opacity:.35 },
      { transform:'none', clipPath:`inset(0 round ${radius} ${radius} 0 0)`, opacity:1 }
    ] : [
      { clipPath:'inset(0)' },
      { clipPath:'inset(0 0 100%)' }
    ], { duration, easing, fill:'both' }));
    content.forEach((node, i) => {
      if (getComputedStyle(node).display === 'contents') return;
      animations.push(node.animate([
        {opacity:0,transform:'translateY(12px)'},
        {opacity:1,transform:'none'}
      ], {duration:demiandMotion.state,delay:contentDelay + Math.min(i * 20,60),easing,fill:'backwards'}));
    });
    const contentTimer = setTimeout(() => revealChapterContent(section), contentDelay);
    let finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      clearTimeout(contentTimer);
      animations.forEach(animation => animation.cancel());
      surface.remove();
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
  document.querySelectorAll('.products,.benefit-grid,.manufacturing-metrics').forEach(group => {
    [...group.children].forEach((node, index) => {
      node.style.transitionDelay = Math.min(index * demiandMotion.stagger, demiandMotion.stagger * 3) + 'ms';
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
        const progress = Math.min((now - start) / demiandMotion.chapter, 1);
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

/* One reference photo per category until individual model/color photography is ready. */
(() => {
  const colors = [
    { label: 'Pearl', swatch: '#dedfe2' },
    { label: 'Graphite', swatch: '#474a51' },
    { label: 'Silver', swatch: '#b7bbc3' },
    { label: 'Slate', swatch: '#8c929d' }
  ];
  const models = (items, singular) => items.map(([sku, colorCount]) => ({
    name: `${singular} / ${sku}`,
    colors: colors.slice(0, colorCount)
  }));
  const catalog = {
    'air-fryers': {
      title: 'AIR FRYERS', image: 'assets/images/catalog-airfryer-2700.png', photoAlt: 'DEMIAND DK-2700 air fryer',
      models: models([['DK-2400', 3], ['DK-2200', 3], ['DK-5100', 3], ['DK-2500', 2], ['DK-2700', 2], ['DK-5000', 2], ['DK-5300', 2]], 'AIR FRYER')
    },
    'coffee-makers': {
      title: 'COFFEE MAKERS', image: 'assets/images/catalog-coffee-3500.png', photoAlt: 'DEMIAND KF-3500 coffee maker',
      models: models([['KF-3500', 3], ['KF-3100', 2], ['KF-3200', 1]], 'COFFEE MAKER')
    },
    blenders: {
      title: 'BLENDERS', image: 'assets/images/catalog-blender-1200.png', photoAlt: 'DEMIAND BL-1200 blender',
      models: models([['BL-1200', 2], ['DB-E1300', 4]], 'BLENDER')
    }
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
  const easing = demiandMotion.ease;
  let selected, busy = false, active = 0;
  const pad = number => String(number).padStart(2, '0');
  function animate(element, frames, options = {}) {
    if (reducedMotion.matches) return Promise.resolve();
    return element.animate(frames, { duration: demiandMotion.state, easing, ...options }).finished.catch(() => {});
  }
  function render(data) {
    rail.replaceChildren();
    data.models.forEach(model => {
      const card = document.createElement('article'); card.className = 'catalog-card';
      card.setAttribute('aria-label', model.name);
      const frame = document.createElement('div'); frame.className = 'catalog-image';
      const image = new Image(); image.src = data.image; image.alt = data.photoAlt;
      image.width = 2500; image.height = 2000; image.draggable = false; image.decoding = 'async';
      frame.append(image);
      const name = document.createElement('h3'); name.textContent = model.name;
      const swatches = document.createElement('div'); swatches.className = 'catalog-swatches'; swatches.setAttribute('role', 'group'); swatches.setAttribute('aria-label', `${model.name}: illustrative color options`);
      model.colors.forEach((color, i) => {
        const button = document.createElement('button'); button.type = 'button'; button.style.setProperty('--swatch', color.swatch);
        button.setAttribute('aria-label', `${model.name}: ${color.label}`); button.title = color.label;
        button.setAttribute('aria-pressed', String(i === 0));
        button.addEventListener('click', () => {
          swatches.querySelectorAll('button').forEach(node => node.setAttribute('aria-pressed', String(node === button)));
        });
        swatches.append(button);
      });
      card.append(frame, name, swatches); rail.append(card);
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
    if (!reducedMotion.matches) {
      const outgoing = categories.cloneNode(true);
      outgoing.classList.add('catalog-outgoing'); outgoing.inert = true;
      outgoing.setAttribute('aria-hidden', 'true');
      outgoing.querySelector(`[data-category="${button.dataset.category}"]`).style.visibility = 'hidden';
      section.querySelector('.portfolio-stage').append(outgoing);
      animate(outgoing, [{opacity:1, transform:'none'}, {opacity:0, transform:'translateY(10px) scale(.985)'}], {duration:demiandMotion.micro}).then(() => outgoing.remove());
    }
    categories.hidden = true; categoryHeading.hidden = true; heading.hidden = false; view.hidden = false;
    section.classList.add('catalog-open'); rail.scrollLeft = 0; update();
    const image = anchor.firstElementChild; const to = image.getBoundingClientRect();
    const shared = animate(image, [{ transform: `translate(${from.left - to.left}px,${from.top - to.top}px) scale(${from.width / to.width},${from.height / to.height})` }, { transform: 'none' }], { duration: demiandMotion.state });
    const cards = [...rail.children].map((card, i) => animate(card, [{ opacity: 0, transform: 'translateY(28px) scale(.97)', clipPath: 'inset(0 0 100% round 16px)' }, { opacity: 1, transform: 'none', clipPath: 'inset(0 round 16px)' }], { delay: Math.min(i, 2) * demiandMotion.stagger, fill: 'backwards' }));
    await Promise.all([shared, ...cards]); busy = false; title.focus({ preventScroll: true });
  }
  async function close() {
    if (busy) return; busy = true;
    view.hidden = true; heading.hidden = true; categories.hidden = false; categoryHeading.hidden = false; section.classList.remove('catalog-open');
    categories.querySelectorAll('.reveal').forEach(card => card.classList.add('visible'));
    await Promise.all([...categories.children].map((card, i) => animate(card, [{ opacity: 0, transform: 'translateY(18px) scale(.97)' }, { opacity: 1, transform: 'none' }], { delay: i * demiandMotion.stagger, fill: 'backwards' })));
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
