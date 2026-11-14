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
    el.style.setProperty('--marquee-duration', `${group.scrollWidth / speed}s`);
    el.classList.add('is-running');
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
