const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.nav nav');
const header = document.querySelector('.nav');
const progressBar = document.querySelector('.scroll-progress i');
const hero = document.querySelector('.hero');
const modelStage = document.querySelector('.model-stage');
const model = document.querySelector('.hero-model');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(pointer: fine)');

// Lightweight ambient points keep the dark canvas alive without bringing back
// the noisy raster texture. Positions are deterministic so the composition is
// stable between reloads and on mobile.
const sparkleField = document.querySelector('.sparkle-field');
if (sparkleField && !reducedMotion.matches) {
  const count = window.innerWidth < 700 ? 18 : 34;
  for (let i = 0; i < count; i += 1) {
    const dot = document.createElement('span');
    dot.style.left = `${(i * 47 + 13) % 100}%`;
    dot.style.top = `${(i * 71 + 9) % 100}%`;
    dot.style.animationDelay = `${(i % 9) * -0.55}s`;
    dot.style.animationDuration = `${3.8 + (i % 5) * .55}s`;
    sparkleField.appendChild(dot);
  }
}

let scrollQueued = false;

function closeMenu() {
  menu?.classList.remove('open');
  document.body.classList.remove('menu-open');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Open menu');
}

menuButton?.addEventListener('click', () => {
  const isOpen = menu?.classList.toggle('open') ?? false;
  document.body.classList.toggle('menu-open', isOpen);
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  header?.classList.remove('nav-hidden');
});

menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });

// The portfolio navigation uses one underline that glides between labels.
// Reproduce that rhythm here on desktop; the mobile menu has its own full-screen motion.
const navUnderline = menu?.querySelector('.nav-underline');
const navLinks = menu ? Array.from(menu.children).filter((item) => item.matches('a:not(.nav-cta)')) : [];
if (menu && navUnderline && finePointer.matches) {
  navLinks.forEach((link) => {
    link.addEventListener('pointerenter', () => {
      if (window.innerWidth <= 900) return;
      const menuBox = menu.getBoundingClientRect();
      const linkBox = link.getBoundingClientRect();
      navUnderline.style.left = `${linkBox.left - menuBox.left}px`;
      navUnderline.style.width = `${linkBox.width}px`;
      navUnderline.classList.add('visible');
    });
  });
  menu.addEventListener('pointerleave', () => navUnderline.classList.remove('visible'));
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    observer.unobserve(entry.target);
  });
}, { threshold: .08, rootMargin: '0px 0px -7% 0px' });

document.querySelectorAll('.reveal, .global').forEach((item) => observer.observe(item));

// Nearby cards land in a short cascade. The delay resets for every group,
// keeping motion intentional even deep into the page.
document.querySelectorAll('.number-grid, .products, .why-list, .process-grid, .innovation-points, .support-nodes, .steps-list').forEach((group) => {
  Array.from(group.children).forEach((item, index) => {
    if (item.classList.contains('reveal')) item.style.transitionDelay = `${Math.min(index * 80, 320)}ms`;
  });
});

function updateScrollEffects() {
  const scrollY = window.scrollY;
  const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);

  if (progressBar) progressBar.style.width = `${Math.min((scrollY / scrollable) * 100, 100)}%`;
  header?.classList.toggle('scrolled', scrollY > 24);

  scrollQueued = false;
}

window.addEventListener('scroll', () => {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(updateScrollEffects);
}, { passive: true });
window.addEventListener('resize', updateScrollEffects, { passive: true });
updateScrollEffects();

if (hero && modelStage && finePointer.matches && !reducedMotion.matches) {
  let modelIsDragging = false;
  model?.addEventListener('pointerdown', () => {
    modelIsDragging = true;
    modelStage.classList.add('is-dragging');
    modelStage.style.setProperty('--model-rx', '0deg');
    modelStage.style.setProperty('--model-ry', '0deg');
  });
  window.addEventListener('pointerup', () => {
    modelIsDragging = false;
    modelStage.classList.remove('is-dragging');
  });
  hero.addEventListener('pointermove', (event) => {
    if (modelIsDragging) return;
    const bounds = hero.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
    const y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
    modelStage.style.setProperty('--model-rx', `${y * -2.2}deg`);
    modelStage.style.setProperty('--model-ry', `${x * 3.2}deg`);
  });
  hero.addEventListener('pointerleave', () => {
    modelStage.style.setProperty('--model-rx', '0deg');
    modelStage.style.setProperty('--model-ry', '0deg');
  });
}

model?.addEventListener('progress', (event) => {
  const loader = model.querySelector('.model-loader');
  const line = loader?.querySelector('i');
  const amount = event.detail.totalProgress;
  if (line) { line.style.animation = 'none'; line.style.width = `${amount * 100}%`; }
  if (loader && amount >= 1) loader.style.opacity = '0';
});

// A compact, live position indicator makes the mobile product rail feel like
// a deliberate carousel instead of a clipped horizontal list.
const productRail = document.querySelector('.products');
const portfolioSection = document.querySelector('.portfolio');
if (productRail && portfolioSection) {
  const productCards = Array.from(productRail.querySelectorAll('.product-card'));
  const swipeStatus = document.createElement('div');
  swipeStatus.className = 'portfolio-swipe-status';
  swipeStatus.setAttribute('aria-hidden', 'true');
  swipeStatus.innerHTML = '<span>Swipe</span><div></div><b>01 / 04</b>';
  const swipeDots = swipeStatus.querySelector('div');
  productCards.forEach((_, index) => {
    const dot = document.createElement('i');
    if (index === 0) dot.classList.add('active');
    swipeDots.appendChild(dot);
  });
  portfolioSection.appendChild(swipeStatus);

  let productFrameQueued = false;
  const updateProductStatus = () => {
    const railBox = productRail.getBoundingClientRect();
    let activeIndex = 0;
    let closest = Infinity;
    productCards.forEach((card, index) => {
      const distance = Math.abs(card.getBoundingClientRect().left - railBox.left);
      if (distance < closest) { closest = distance; activeIndex = index; }
    });
    swipeDots.querySelectorAll('i').forEach((dot, index) => dot.classList.toggle('active', index === activeIndex));
    const counter = swipeStatus.querySelector('b');
    if (counter) counter.textContent = `0${activeIndex + 1} / 0${productCards.length}`;
    productFrameQueued = false;
  };
  productRail.addEventListener('scroll', () => {
    if (productFrameQueued) return;
    productFrameQueued = true;
    requestAnimationFrame(updateProductStatus);
  }, { passive: true });
  window.addEventListener('resize', updateProductStatus, { passive: true });
}

// On narrow screens, information-heavy grids become focused editorial rails.
// Each rail exposes a next-card preview and a live position indicator.
const editorialRails = [
  { track: '.number-grid', label: 'Highlights' },
  { track: '.why-list', label: 'Advantages' },
  { track: '.manufacturing .process-grid', label: 'Process' },
  { track: '.innovation-points', label: 'Technology' },
];

editorialRails.forEach(({ track, label }) => {
  const rail = document.querySelector(track);
  if (!rail || !rail.children.length) return;
  const items = Array.from(rail.children);
  const status = document.createElement('div');
  status.className = 'mobile-rail-status';
  status.setAttribute('aria-hidden', 'true');
  status.innerHTML = `<span>${label}</span><span class="rail-bars"></span><b>01 / 0${items.length}</b>`;
  const bars = status.querySelector('.rail-bars');
  items.forEach((_, index) => {
    const bar = document.createElement('i');
    if (index === 0) bar.classList.add('active');
    bars.appendChild(bar);
  });
  rail.insertAdjacentElement('afterend', status);

  let queued = false;
  const update = () => {
    const railBox = rail.getBoundingClientRect();
    let active = 0;
    let distance = Infinity;
    items.forEach((item, index) => {
      const nextDistance = Math.abs(item.getBoundingClientRect().left - railBox.left);
      if (nextDistance < distance) { distance = nextDistance; active = index; }
    });
    bars.querySelectorAll('i').forEach((bar, index) => bar.classList.toggle('active', index === active));
    status.querySelector('b').textContent = `0${active + 1} / 0${items.length}`;
    queued = false;
  };
  rail.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }, { passive: true });
  window.addEventListener('resize', update, { passive: true });
});

if (finePointer.matches && !reducedMotion.matches) {
  document.querySelectorAll('.magnetic').forEach((element) => {
    element.addEventListener('pointermove', (event) => {
      const box = element.getBoundingClientRect();
      const x = (event.clientX - box.left - box.width / 2) * .11;
      const y = (event.clientY - box.top - box.height / 2) * .14;
      element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
    element.addEventListener('pointerleave', () => { element.style.transform = ''; });
  });
}

const partnerForm = document.querySelector('.partner-form');
partnerForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const status = partnerForm.querySelector('.form-status');
  if (status) status.textContent = 'Demo mode — the submission endpoint will be connected at launch.';
});

window.addEventListener('load', () => document.body.classList.add('is-loaded'), { once: true });
