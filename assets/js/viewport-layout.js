/* Native overflow gallery with cloned runway and a seamless, one-way loop. */
(() => {
  const rail = document.querySelector('.manufacturing-proof-rail');
  if (!rail) return;
  const originals = [...rail.children], count = originals.length;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clone = item => {
    const copy = item.cloneNode(true);
    copy.dataset.clone = 'true'; copy.setAttribute('aria-hidden','true'); copy.inert = true;
    return copy;
  };
  rail.prepend(...originals.map(clone)); rail.append(...originals.map(clone));
  const cards = [...rail.children];
  cards.forEach(card => card.querySelector('img').draggable = false);
  let step=0, period=0, timer, frame, settleTimer;
  let visible=false, hover=false, focused=false, dragging=false, moving=false;
  let startX=0, startScroll=0;
  const duration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--motion-visual')) || 900;
  const stop = () => { clearTimeout(timer); timer=null; };
  function normalize() {
    if (!period || moving || dragging) return;
    if (rail.scrollLeft < period - 1) rail.scrollLeft += period;
    else if (rail.scrollLeft >= period * 2 - 1) rail.scrollLeft -= period;
  }
  function schedule() {
    stop();
    if (visible && !hover && !focused && !dragging && !moving && !reduced.matches && !document.hidden)
      timer=setTimeout(() => advance(1),3000);
  }
  function cancelMove() {
    cancelAnimationFrame(frame); moving=false; rail.classList.remove('is-moving'); stop();
  }
  function advance(direction) {
    if (!step) return;
    cancelMove(); normalize();
    const from=rail.scrollLeft, target=(Math.round(from/step)+direction)*step, first=Math.round(from/step);
    cards.forEach(card=>card.classList.remove('is-entering','is-leaving'));
    cards[first]?.classList.add('is-leaving');
    cards[first+Math.max(1,Math.round(rail.clientWidth/step))]?.classList.add('is-entering');
    if(reduced.matches){rail.scrollLeft=target;normalize();return;}
    moving=true; rail.classList.add('is-moving');
    const start=performance.now();
    function tick(now) {
      const t=Math.min((now-start)/duration,1), ease=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
      rail.scrollLeft=from+(target-from)*ease;
      if(t<1) frame=requestAnimationFrame(tick);
      else {moving=false;rail.classList.remove('is-moving');normalize();schedule();}
    }
    frame=requestAnimationFrame(tick);
  }
  function measure() {
    cancelMove();
    const logical=step?((rail.scrollLeft/step-count)%count+count)%count:0;
    step=cards[1].offsetLeft-cards[0].offsetLeft; period=step*count;
    rail.scrollLeft=period+Math.round(logical)*step; schedule();
  }
  new ResizeObserver(measure).observe(rail);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(!visible)cancelMove();schedule();},{threshold:.2}).observe(rail);
  rail.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){hover=true;stop();}});
  rail.addEventListener('pointerleave',()=>{hover=false;schedule();});
  rail.addEventListener('focusin',()=>{focused=true;stop();});
  rail.addEventListener('focusout',()=>requestAnimationFrame(()=>{focused=rail.contains(document.activeElement);schedule();}));
  rail.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
    event.preventDefault();advance(event.key==='ArrowRight'?1:-1);
  });
  rail.addEventListener('wheel',()=>{cancelMove();clearTimeout(settleTimer);settleTimer=setTimeout(()=>{normalize();schedule();},180);},{passive:true});
  rail.addEventListener('scroll',()=>{
    if(moving||dragging)return;
    clearTimeout(settleTimer);settleTimer=setTimeout(()=>{normalize();schedule();},140);
  },{passive:true});
  rail.addEventListener('pointerdown',event=>{
    cancelMove();
    if(event.pointerType!=='mouse'||event.button!==0)return;
    dragging=true;startX=event.clientX;startScroll=rail.scrollLeft;
    rail.classList.add('is-dragging');rail.setPointerCapture(event.pointerId);event.preventDefault();
  });
  rail.addEventListener('pointermove',event=>{if(dragging)rail.scrollLeft=startScroll-(event.clientX-startX);});
  function finish(event) {
    if(dragging&&rail.hasPointerCapture(event.pointerId))rail.releasePointerCapture(event.pointerId);
    dragging=false;rail.classList.remove('is-dragging');normalize();schedule();
  }
  rail.addEventListener('pointerup',finish);rail.addEventListener('pointercancel',finish);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelMove();schedule();});
  reduced.addEventListener('change',()=>{cancelMove();normalize();schedule();});
})();
