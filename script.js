(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 900px)');

  /* ---------- Infinite marquee ----------
     The group is padded with copies until it is wider than the viewport, then
     the whole group is duplicated once. The track slides by exactly -50%
     (one group), so the loop point is invisible. Speed is in px per second so
     every marquee moves at a steady pace whatever its content width. */
  function buildMarquee(el) {
    const track = el.querySelector('.marquee__track');
    const group = track.querySelector('.marquee__group');
    track.querySelectorAll('[data-clone]').forEach(n => n.remove());
    el.classList.remove('is-running');
    el._auto = false;

    const active = !reduceMotion.matches && (!el.hasAttribute('data-marquee-mobile') || mobile.matches);
    if (!active) return;

    const originals = [...group.children];
    const viewport = el.clientWidth || window.innerWidth;
    let guard = 0;
    while (group.scrollWidth < viewport && guard++ < 20) {
      originals.forEach(item => {
        const c = item.cloneNode(true);
        c.setAttribute('data-clone', '');
        c.setAttribute('aria-hidden', 'true');
        group.appendChild(c);
      });
    }
    const copy = group.cloneNode(true);
    copy.setAttribute('data-clone', '');
    copy.setAttribute('aria-hidden', 'true');
    track.appendChild(copy);

    const speed = Number(el.dataset.speed) || 40; // px per second
    if (el.hasAttribute('data-marquee-scroll')) { scrollMarquee(el, group, speed); return; }
    el.style.setProperty('--marquee-duration', `${group.scrollWidth / speed}s`);
    el.classList.add('is-running');
  }

  /* ---------- Scrollable marquee (testimonials) ----------
     A real overflow container: the user can wheel, swipe, drag or use arrow
     keys. Each frame nudges scrollLeft forward; position wraps by one group
     width in both directions so it never runs out. Auto-scroll pauses while
     the user interacts or hovers and resumes 2s after they stop. */
  function scrollMarquee(el, group, speed) {
    const loop = () => group.offsetWidth;
    let pos = Math.max(1, el.scrollLeft), lastSet = -1, idleUntil = 0, hovering = false, last = 0;
    const wrap = () => {
      const w = loop();
      if (pos >= w) pos -= w;
      else if (pos < 1) pos += w;
    };
    const set = () => { wrap(); el.scrollLeft = pos; lastSet = el.scrollLeft; };
    const hold = (ms = 2000) => { idleUntil = performance.now() + ms; };

    if (!el._scrollBound) {
      el._scrollBound = true;
      el.addEventListener('scroll', () => {
        if (Math.abs(el.scrollLeft - lastSet) > 1) { pos = el.scrollLeft; hold(); if (pos >= loop() || pos < 1) set(); }
      }, { passive: true });
      ['wheel', 'touchstart', 'keydown'].forEach(t => el.addEventListener(t, () => hold(), { passive: true }));
      el.addEventListener('mouseenter', () => { hovering = true; });
      el.addEventListener('mouseleave', () => { hovering = false; hold(600); });

      // Mouse drag-to-scroll (touch and trackpads scroll natively)
      let dragX = null, startPos = 0, moved = false;
      el.addEventListener('pointerdown', e => {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        dragX = e.clientX; startPos = pos; moved = false; el.classList.add('is-dragging');
      });
      window.addEventListener('pointermove', e => {
        if (dragX === null) return;
        const dx = e.clientX - dragX;
        if (Math.abs(dx) > 3) moved = true;
        pos = startPos - dx; set(); hold();
      });
      window.addEventListener('pointerup', () => { if (dragX !== null) { dragX = null; el.classList.remove('is-dragging'); hold(); } });
      el.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
      el.addEventListener('dragstart', e => e.preventDefault());

      const tick = now => {
        const dt = last ? Math.min(now - last, 64) / 1000 : 0;
        last = now;
        if (el._auto && !hovering && dragX === null && now > idleUntil && !document.hidden) { pos += speed * dt; set(); }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    el._auto = true;
    el.classList.add('is-scrollable');
    pos = Math.max(pos, 1); set();
  }

  const marquees = [...document.querySelectorAll('[data-marquee]')];
  const buildAll = () => marquees.forEach(buildMarquee);
  let lastWidth = window.innerWidth, resizeTimer;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastWidth) return; // ignore mobile URL-bar height changes
    lastWidth = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildAll, 150);
  });
  reduceMotion.addEventListener('change', buildAll);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(buildAll);
  window.addEventListener('load', buildAll, { once: true });

  /* ---------- Hero video: play only when visible and motion is allowed ---------- */
  const video = document.querySelector('.hero__video');
  if (video) {
    let inView = true;
    const sync = () => {
      if (reduceMotion.matches || !inView) video.pause();
      else video.play().catch(() => {}); // autoplay blocked: poster stays
    };
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); }).observe(video);
    reduceMotion.addEventListener('change', sync);
    if (reduceMotion.matches) { video.removeAttribute('autoplay'); video.pause(); }
  }

  /* ---------- Mobile nav ---------- */
  const burger = document.querySelector('.nav__burger');
  const links = document.getElementById('nav-links');
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', open);
    links.classList.toggle('is-open', open);
  });
  links.addEventListener('click', e => {
    if (e.target.closest('a')) { burger.setAttribute('aria-expanded', 'false'); links.classList.remove('is-open'); }
  });

  /* ---------- FAQ: one open at a time, animated height ---------- */
  const items = [...document.querySelectorAll('.faq__item')];
  const animate = (item, opening) => {
    const panel = item.querySelector('.faq__a');
    if (reduceMotion.matches) { item.open = opening; return; }
    if (opening) item.open = true;
    const h = panel.scrollHeight;
    const anim = panel.animate(
      { height: opening ? ['0px', h + 'px'] : [h + 'px', '0px'], opacity: opening ? [0, 1] : [1, 0] },
      { duration: 380, easing: 'cubic-bezier(.22,1,.36,1)' }
    );
    if (!opening) anim.onfinish = () => { item.open = false; };
  };
  items.forEach(item => {
    item.querySelector('summary').addEventListener('click', e => {
      e.preventDefault();
      const opening = !item.open;
      if (opening) items.forEach(o => o !== item && o.open && animate(o, false));
      animate(item, opening);
    });
  });

  /* ---------- Quote quiz ---------- */
  const form = document.querySelector('.quiz__card');
  const steps = [...form.querySelectorAll('.quiz__step')];
  const bar = form.querySelector('.progress');
  let current = 0;

  const stepComplete = step => {
    const radios = step.querySelectorAll('input[type=radio]');
    return !radios.length || [...radios].some(r => r.checked);
  };
  const syncNext = step => {
    const next = step.querySelector('[data-next]');
    if (next && !next.hasAttribute('data-free')) next.setAttribute('aria-disabled', String(!stepComplete(step)));
  };
  const show = (i, back = false) => {
    steps[current].hidden = true;
    current = i;
    const step = steps[i];
    step.hidden = false;
    step.classList.remove('is-entering', 'is-back');
    void step.offsetWidth;
    step.classList.add('is-entering');
    step.classList.toggle('is-back', back);
    const p = Number(step.dataset.progress || step.dataset.step);
    bar.style.setProperty('--p', Math.min(p, 6));
    bar.setAttribute('aria-valuenow', Math.min(p, 6));
    syncNext(step);
    const focusable = step.querySelector('input, button');
    if (focusable) focusable.focus({ preventScroll: true });
  };

  form.addEventListener('change', e => {
    if (e.target.type === 'radio') syncNext(steps[current]);
  });
  form.addEventListener('click', e => {
    if (e.target.closest('[data-next]')) {
      if (!stepComplete(steps[current])) return;
      show(current + 1);
    } else if (e.target.closest('[data-back]')) {
      show(current - 1, true);
    }
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    steps[current].querySelectorAll('input[required], input[type=email]').forEach(inp => {
      const bad = !inp.checkValidity() || !inp.value.trim();
      inp.classList.toggle('is-invalid', bad);
      if (bad && ok) { inp.focus(); ok = false; }
    });
    if (ok) show(current + 1);
  });
  form.addEventListener('input', e => e.target.classList.remove('is-invalid'));
  syncNext(steps[0]);
})();
