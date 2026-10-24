/* =====================================================
   Candy Clouds — script.js
   GSAP + ScrollTrigger + Lenis + canvas petals + CSS 3D ring
===================================================== */

if (!window.gsap) {
  // Fallback: if the CDN failed, show everything without animation
  document.body.classList.remove('is-loading');
  document.getElementById('preloader')?.remove();
} else {

gsap.registerPlugin(ScrollTrigger);

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer    = matchMedia('(hover: hover) and (pointer: fine)').matches;

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

/* ---------- Contact config (WhatsApp pre-filled messages) ---------- */
const PHONE_INTL = '962790119286';
const WA_DEFAULT = 'مرحباً Candy Clouds، أود الاستفسار عن الباقات والأسعار';

 $$('a[data-wa]').forEach(a => {
  a.href = `https://wa.me/${PHONE_INTL}?text=${encodeURIComponent(a.dataset.wa || WA_DEFAULT)}`;
});

/* ---------- Smooth scrolling (Lenis) ---------- */
let lenis = null;
if (typeof Lenis !== 'undefined' && !prefersReduced) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  if (document.body.classList.contains('is-loading')) lenis.stop();
}
const goTo = target => {
  if (lenis) lenis.scrollTo(target, { offset: -78, duration: 1.2 });
  else {
    const el = typeof target === 'string' ? $(target) : target;
    el && el.scrollIntoView({ behavior: 'smooth' });
  }
};

/* ---------- Mobile menu ---------- */
function openMenu ()  { document.body.classList.add('menu-open');    lenis?.stop(); }
function closeMenu () {
  if (!document.body.classList.contains('menu-open')) return;
  document.body.classList.remove('menu-open');
  if (!(lightbox && lightbox.classList.contains('open'))) lenis?.start();
}
 $('#burger')?.addEventListener('click', () =>
  document.body.classList.contains('menu-open') ? closeMenu() : openMenu());

/* ---------- Anchor links ---------- */
 $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href');
  if (id.length > 1 && $(id)) { e.preventDefault(); closeMenu(); goTo(id); }
}));

/* ---------- Nav state on scroll ---------- */
const nav = $('#nav');
addEventListener('scroll', () => nav && nav.classList.toggle('scrolled', scrollY > 40), { passive: true });

/* ---------- Custom cursor ---------- */
const cursor = $('#cursor');
if (cursor && finePointer) {
  const label = $('.cursor-label', cursor);
  const xTo = gsap.quickTo(cursor, 'x', { duration: .35, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: .35, ease: 'power3' });
  addEventListener('mousemove', e => { cursor.classList.add('on'); xTo(e.clientX); yTo(e.clientY); });
  document.addEventListener('mouseleave', () => cursor.classList.remove('on'));
  $$('[data-cursor]').forEach(el => {
    el.addEventListener('mouseenter', () => { label.textContent = el.dataset.cursor; cursor.classList.add('is-active'); });
    el.addEventListener('mouseleave', () => cursor.classList.remove('is-active'));
  });
} else if (cursor) cursor.remove();

/* =====================================================
   FLOATING PETALS (canvas, reacts to the mouse)
===================================================== */
const canvas = $('#petals');
if (canvas && !prefersReduced) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, devicePixelRatio || 1);
  let W, H;
  const mouse = { x: -9999, y: -9999, vx: 0 };
  const COLORS = ['#F3BCCC', '#EBA3B7', '#F7CFDA', '#DD8FA9', '#F0B9C8'];

  const resize = () => {
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize(); addEventListener('resize', resize);

  addEventListener('mousemove', e => {
    mouse.vx = e.clientX - mouse.x;
    mouse.x = e.clientX; mouse.y = e.clientY;
  });

  class Petal {
    constructor (init) { this.reset(init); }
    reset (init = false) {
      this.x = Math.random() * W;
      this.y = init ? Math.random() * H : -30;
      this.s = 5 + Math.random() * 8;
      this.vy = .35 + Math.random() * .9;
      this.phase = Math.random() * Math.PI * 2;
      this.freq = .4 + Math.random() * 1;
      this.rot = Math.random() * Math.PI * 2;
      this.vr = (Math.random() - .5) * .03;
      this.color = COLORS[(Math.random() * COLORS.length) | 0];
      this.alpha = .35 + Math.random() * .4;
    }
    update (t) {
      this.x += Math.sin(t * this.freq + this.phase) * .6
              + Math.max(-2.5, Math.min(2.5, mouse.vx * .06));
      this.y += this.vy;
      this.rot += this.vr;
      // gentle repulsion around the cursor
      const dx = this.x - mouse.x, dy = this.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 8100) {
        const d = Math.sqrt(d2) || 1, f = (90 - d) / 90;
        this.x += dx / d * f * 3.2;
        this.y += dy / d * f * 3.2 - .4;
      }
      if (this.y > H + 40 || this.x < -60 || this.x > W + 60) this.reset();
    }
    draw () {
      const s = this.s;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo( s * .9, -s * .55,  s * .85, s * .55, 0, s);
      ctx.bezierCurveTo(-s * .85, s * .55, -s * .9, -s * .55, 0, -s);
      ctx.fill();
      ctx.restore();
    }
  }

  const petals = [];
  const COUNT = Math.min(24, Math.round(innerWidth / 60));
  for (let i = 0; i < COUNT; i++) petals.push(new Petal(true));

  let pt = 0;
  const loop = () => {
    ctx.clearRect(0, 0, W, H);
    pt += .016;
    petals.forEach(p => { p.update(pt); p.draw(); });
    mouse.vx *= .9;
    requestAnimationFrame(loop);
  };
  loop();
}

/* =====================================================
   HERO — draggable 3D ring
===================================================== */
const ring = $('#ring');
if (ring) {
  const stage = $('#ringStage');
  const items = $$('.ring-item', ring);
  const N = items.length;
  let rot = -18, target = rot, vel = 0, dragging = false, lastX = 0;
  let tilt = -6, tiltT = -6;

  const sizeRing = () => {
    const w = stage.clientWidth;
    const iw = Math.max(96, Math.min(170, w * .24));
    const r = Math.round((iw / 2) / Math.tan(Math.PI / N)) + Math.round(iw * .35);
    ring.style.setProperty('--iw', iw + 'px');
    ring.style.setProperty('--r',  r  + 'px');
  };
  sizeRing(); addEventListener('resize', sizeRing);

  stage.addEventListener('pointerdown', e => {
    dragging = true; lastX = e.clientX; vel = 0;
    stage.classList.add('grabbing');
    stage.setPointerCapture && stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - lastX; lastX = e.clientX;
    target += dx * .35; vel = dx * .35;
  });
  const endDrag = () => { dragging = false; stage.classList.remove('grabbing'); };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  addEventListener('mousemove', e => {
    tiltT = -6 - (e.clientY / innerHeight - .5) * 10;
  });

  const AUTO = prefersReduced ? 0 : .055;
  const render = () => {
    if (!dragging) {
      target += vel; vel *= .95;
      if (Math.abs(vel) < .02) target += AUTO;   // idle auto-rotation
    }
    rot  += (target - rot) * .075;
    tilt += (tiltT - tilt) * .04;
    ring.style.transform = `rotateX(${tilt}deg) rotateY(${rot}deg)`;
    items.forEach((it, i) => {
      const c = Math.cos((rot + i * (360 / N)) * Math.PI / 180);
      const f = Math.max(0, c);
      it.style.opacity = (.3 + .7 * f).toFixed(3);
      it.style.filter  = `brightness(${(.55 + .45 * Math.max(.25, c)).toFixed(3)})`;
      it.style.zIndex  = Math.round(100 + c * 50);
    });
    requestAnimationFrame(render);
  };
  render();
}

/* =====================================================
   PRELOADER + HERO INTRO
===================================================== */
const preloader = $('#preloader');

function heroIntro () {
  return gsap.timeline({ defaults: { ease: 'power4.out' } })
    .to('.nav', { y: 0, autoAlpha: 1, duration: .7 })
    .to('.hero .li', { yPercent: 0, duration: 1.05, stagger: .12 }, .05)
    .to('.hero-kicker', { autoAlpha: 1, y: 0, duration: .6 }, .35)
    .to('.hero-sub',    { autoAlpha: 1, y: 0, duration: .7 }, '-=.55')
    .to('.hero-cta .btn', { autoAlpha: 1, y: 0, stagger: .09, duration: .6 }, '-=.55')
    .to('.hero-stage',  { autoAlpha: 1, scale: 1, duration: 1.15, ease: 'power3.out' }, .2)
    .to('.hero-foot > *', { autoAlpha: 1, y: 0, stagger: .1, duration: .55 }, '-=.7');
}

if (prefersReduced) {
  preloader?.remove();
  document.body.classList.remove('is-loading');
} else {
  scrollTo(0, 0);
  gsap.set('.pre-petal', { scale: 0, transformOrigin: '50% 100%' });
  gsap.set('.hero .li', { yPercent: 118 });
  gsap.set(['.hero-kicker', '.hero-sub', '.hero-cta .btn', '.hero-foot > *'], { autoAlpha: 0, y: 26 });
  gsap.set('.hero-stage', { autoAlpha: 0, scale: .86 });
  gsap.set('.nav', { y: -26, autoAlpha: 0 });

  const count = { v: 0 };
  gsap.timeline()
    .to('.pre-petal', { scale: 1, rotation: 20, stagger: .06, duration: .7, ease: 'back.out(1.7)' }, .15)
    .from('.pre-script', { yPercent: 120, duration: .7, ease: 'power3.out' }, '-=.35')
    .to(count, {
      v: 100, duration: 1, ease: 'power2.inOut',
      onUpdate: () => { const c = $('#preCount'); if (c) c.textContent = Math.round(count.v); }
    }, '-=.4')
    .to('.pre-inner', { autoAlpha: 0, y: -30, duration: .45, ease: 'power2.in' }, '+=.1')
    .to(preloader, {
      yPercent: -100, duration: .9, ease: 'power4.inOut',
      onComplete: () => {
        preloader.style.display = 'none';
        document.body.classList.remove('is-loading');
        lenis?.start();
      }
    }, '-=.05')
    .add(heroIntro(), '-=.5');
}

/* =====================================================
   SCROLL REVEALS
===================================================== */
if (!prefersReduced) {

  // word-by-word (safe for Arabic — splits words, never letters)
  $$('.split-words').forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(w => `<span class="w"><span class="wi">${w}</span></span>`).join(' ');
    gsap.set($$('.wi', el), { yPercent: 115 });
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: () => gsap.to($$('.wi', el), { yPercent: 0, duration: .9, ease: 'power4.out', stagger: .07 })
    });
  });

  // generic fade-up reveals (data-reveal="0.1" = extra delay)
  $$('[data-reveal]').forEach(el => {
    gsap.set(el, { autoAlpha: 0, y: 38 });
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: () => gsap.to(el, { autoAlpha: 1, y: 0, duration: .9, ease: 'power3.out', delay: +(el.dataset.reveal || 0) })
    });
  });

  // hero drifts away as you scroll
  gsap.to('.hero-inner', {
    yPercent: -10, autoAlpha: .3, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  // about images parallax
  $$('.parallax img').forEach(img => {
    gsap.fromTo(img, { yPercent: -7 }, {
      yPercent: 7, ease: 'none',
      scrollTrigger: { trigger: img.closest('.parallax'), start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  // rows (prices + occasions) batch reveal
  gsap.set('.price-row, .occ-row', { autoAlpha: 0, y: 34 });
  ScrollTrigger.batch('.price-row, .occ-row', {
    start: 'top 92%', once: true,
    onEnter: els => gsap.to(els, { autoAlpha: 1, y: 0, duration: .8, stagger: .09, ease: 'power3.out' })
  });

  // gallery cards intro
  gsap.set('.g-card', { autoAlpha: 0, y: 60 });
  ScrollTrigger.create({
    trigger: '#gallery', start: 'top 75%', once: true,
    onEnter: () => gsap.to('.g-card', { autoAlpha: 1, y: 0, duration: .9, stagger: .07, ease: 'power3.out' })
  });
}

/* =====================================================
   GALLERY — pinned horizontal scroll (desktop)
===================================================== */
const mm = gsap.matchMedia();
mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
  const track = $('#galleryTrack');
  if (!track) return;
  const dist = () => track.scrollWidth - document.documentElement.clientWidth;
  const tween = gsap.to(track, {
    x: () => -dist(),
    ease: 'none',
    scrollTrigger: {
      trigger: '#galleryPin',
      start: 'top top',
      end: () => '+=' + dist(),
      pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: self => {
        const bar = $('#galleryBar');
        if (bar) bar.style.transform = `scaleX(${self.progress})`;
      }
    }
  });
  // inner image parallax while the track moves
  $$('.g-media img').forEach(img => {
    gsap.fromTo(img, { xPercent: -4 }, {
      xPercent: 4, ease: 'none',
      scrollTrigger: {
        trigger: img.closest('.g-card'),
        containerAnimation: tween,
        start: 'left right', end: 'right left', scrub: true
      }
    });
  });
});

/* =====================================================
   3D TILT CARDS
===================================================== */
if (finePointer && !prefersReduced) {
  $$('.tilt').forEach(card => {
    gsap.set(card, { transformPerspective: 900 });
    const rx = gsap.quickTo(card, 'rotationX', { duration: .5, ease: 'power3' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: .5, ease: 'power3' });
    card.addEventListener('mousemove', e => {
      const b = card.getBoundingClientRect();
      ry(((e.clientX - b.left) / b.width  - .5) * 9);
      rx(-((e.clientY - b.top) / b.height - .5) * 9);
    });
    card.addEventListener('mouseleave', () => { rx(0); ry(0); });
  });
}

/* =====================================================
   LIGHTBOX (images + videos with sound)
===================================================== */
const lightbox = $('#lightbox');
const lbContent = $('#lbContent');

function openLightbox (type, src) {
  lbContent.innerHTML = type === 'video'
    ? `<video src="${src}" controls autoplay playsinline></video>`
    : `<img src="${src}" alt="Candy Clouds">`;
  lightbox.classList.add('open');
  document.body.classList.add('no-scroll');
  lenis?.stop();
}
function closeLightbox () {
  if (!lightbox.classList.contains('open')) return;
  const v = $('video', lbContent);
  if (v) v.pause();
  lbContent.innerHTML = '';
  lightbox.classList.remove('open');
  document.body.classList.remove('no-scroll');
  lenis?.start();
}
 $('#lbClose').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeLightbox(); closeMenu(); }
});

/* gallery images → lightbox */
 $$('.g-card').forEach(c => c.addEventListener('click', () => {
  const img = $('img', c);
  if (img) openLightbox('img', img.src);
}));

/* videos: autoplay muted in view, click = sound on */
 $$('.v-card').forEach(card => {
  const v = $('video', card);
  if (!v) return;
  if (!prefersReduced) {
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting) v.play().catch(() => {});
      else v.pause();
    }, { threshold: .3 }).observe(card);
  }
  card.addEventListener('click', () => openLightbox('video', v.src));
});

/* =====================================================
   OCCASIONS — floating image follows the cursor
===================================================== */
const occFloat = $('#occFloat');
if (occFloat && finePointer && !prefersReduced) {
  const occInner = $('.occ-float-inner', occFloat);
  const occImg = $('img', occInner);
  const firstRow = $('.occ-row');
  if (firstRow) occImg.src = firstRow.dataset.img;

  gsap.set(occInner, { xPercent: -50, yPercent: -56, autoAlpha: 0, scale: .75 });
  const xTo = gsap.quickTo(occFloat, 'x', { duration: .5, ease: 'power3' });
  const yTo = gsap.quickTo(occFloat, 'y', { duration: .5, ease: 'power3' });
  $('#occasions').addEventListener('mousemove', e => { xTo(e.clientX); yTo(e.clientY); });

  $$('.occ-row').forEach(row => {
    row.addEventListener('mouseenter', () => {
      occImg.src = row.dataset.img;
      gsap.to(occInner, { autoAlpha: 1, scale: 1, rotation: gsap.utils.random(-5, 5), duration: .45, ease: 'back.out(1.5)' });
    });
    row.addEventListener('mouseleave', () =>
      gsap.to(occInner, { autoAlpha: 0, scale: .75, duration: .3 }));
  });
}

/* occasion rows → WhatsApp */
 $$('.occ-row').forEach(row => row.addEventListener('click', () => {
  const msg = row.dataset.wa || WA_DEFAULT;
  open(`https://wa.me/${PHONE_INTL}?text=${encodeURIComponent(msg)}`, '_blank');
}));

/* =====================================================
   COUNTERS + YEAR + REFRESH
===================================================== */
 $$('.stat-num').forEach(el => {
  const end = +el.dataset.count || 0;
  if (prefersReduced) { el.textContent = end.toLocaleString('en-US'); return; }
  ScrollTrigger.create({
    trigger: el, start: 'top 90%', once: true,
    onEnter: () => {
      const o = { v: 0 };
      gsap.to(o, {
        v: end, duration: 1.8, ease: 'power2.out',
        onUpdate: () => el.textContent = Math.round(o.v).toLocaleString('en-US')
      });
    }
  });
});

const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

addEventListener('load', () => ScrollTrigger.refresh());

}