const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const menuButton = $('.menu-toggle'), nav = $('.nav'), navLinks = $$('.nav-link');

menuButton?.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  menuButton.setAttribute('aria-expanded', String(open));
});
navLinks.forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('is-open');
  menuButton?.setAttribute('aria-expanded', 'false');
  navLinks.forEach((item) => item.classList.remove('active'));
  link.classList.add('active');
}));
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) navLinks.forEach((link) => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
  }), { rootMargin: '-35% 0px -55% 0px' });
  $$('main section[id]').forEach((section) => observer.observe(section));
}

const product = $('#product-model');
const enhanceBottleContents = () => {
  const materials = product?.model?.materials ?? [];
  const glass = materials.find((material) => material.name?.toLowerCase() === 'glass');
  const liquid = materials.find((material) => material.name?.toLowerCase() === 'liquid');
  glass?.pbrMetallicRoughness?.setBaseColorFactor([1, 0.84, 0.91, 0.28]);
  liquid?.pbrMetallicRoughness?.setBaseColorFactor([1, 0.1, 0.36, 1]);
};
product?.addEventListener('load', () => {
  product.classList.add('is-loaded');
  enhanceBottleContents();
}, { once: true });
if (product?.model) enhanceBottleContents();

if (window.gsap && window.ScrollTrigger && !reduce) experience();
else { document.documentElement.classList.remove('js'); $('.curtain')?.remove(); }

function experience() {
  gsap.registerPlugin(...[ScrollTrigger, window.ScrollSmoother].filter(Boolean));
  /* rolagem suave: precisa ser criada antes de qualquer ScrollTrigger */
  const smoother = window.ScrollSmoother && ScrollSmoother.create({ wrapper: '#smooth-wrapper', content: '#smooth-content', smooth: 1.2, smoothTouch: .1 });
  if (smoother) $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const t = $(a.hash); if (!t) return;
    e.preventDefault(); smoother.scrollTo(t, true, 'top 90px');
  }));
  const stage = $('.stage'), plantL = $('.plant-left'), plantR = $('.plant-right'), stone = $('.stone-left'), act = $('.act');
  const st = { spin: 0, px: 0, py: 0 };
  let productInteracted = false;
  const orbit = () => {
    if (productInteracted) return;
    product.cameraOrbit = `${st.spin + st.px * 14}deg ${75 + st.py * 5}deg 115%`;
  };
  product.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    productInteracted = true;
    product.classList.add('is-dragging');
  });
  product.addEventListener('selectstart', (event) => event.preventDefault());
  addEventListener('pointerup', () => product.classList.remove('is-dragging'));
  addEventListener('pointercancel', () => product.classList.remove('is-dragging'));
  product.addEventListener('camera-change', (event) => {
    if (event.detail.source === 'user') {
      productInteracted = true;
    }
  });

  /* títulos em caracteres (preserva <em> e <br>) */
  const split = (el) => {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    const walk = (n) => [...n.childNodes].forEach((c) => {
      if (c.nodeType === 3) {
        const f = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach((t) => {
          if (!t.trim()) return f.append(t);
          const w = Object.assign(document.createElement('span'), { className: 'w' });
          [...t].forEach((ch) => w.append(Object.assign(document.createElement('span'), { className: 'ch', textContent: ch })));
          f.append(w);
        });
        c.replaceWith(f);
      } else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c);
    });
    walk(el);
    return $$('.ch', el);
  };
  const h1 = split($('.hero h1'));
  gsap.set(h1, { opacity: 0 });
  gsap.set(['.hero .eyebrow', '.hero .intro', '.primary-link', '.edition', '.hero-aside > *', '.spark'], { opacity: 0 });

  /* abertura: a cortina da lua sobe quando o frasco carrega */
  let started = false;
  const ready = () => { if (!started) { started = true; reveal(); } };
  product.loaded ? ready() : product.addEventListener('load', ready, { once: true });
  setTimeout(ready, 4500);
  gsap.to('.curtain-moon', { scale: 1.12, duration: 1.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });

  function reveal() {
    const exp = { v: 0 };
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .to('.curtain', { yPercent: -100, duration: 1.2, ease: 'power4.inOut', onComplete: () => $('.curtain').remove() })
      .fromTo(product, { scale: .82, y: 50 }, { scale: 1, y: 0, duration: 1.8, ease: 'expo.out' }, .5)
      .to(exp, { v: 1.25, duration: 2, onUpdate: () => { product.exposure = exp.v; } }, .5)
      .fromTo(h1, { yPercent: 110, rotateX: -80, opacity: 0 }, { yPercent: 0, rotateX: 0, opacity: 1, duration: 1, stagger: .03 }, .8)
      .fromTo(['.hero .eyebrow', '.hero .intro', '.primary-link', '.edition'], { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: .9, stagger: .12 }, 1.1)
      .fromTo('.hero-aside > *', { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: .9, stagger: .1 }, 1.3)
      .from([plantL, plantR, stone], { scale: .4, y: 90, opacity: 0, duration: 1.6, stagger: .18, ease: 'back.out(1.4)' }, .9)
      .to('.spark', { opacity: 1, duration: .8, stagger: .2 }, 1.6)
      .add(idle);
  }

  /* vida própria: tudo flutua, cintila e gira (inclusive os modelos 3D) */
  function idle() {
    [plantL, plantR, stone].forEach((el, i) => gsap.to(el, { yPercent: -6, duration: 3 + i * .7, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * .4 }));
    $$('.spark').forEach((s) => gsap.to(s, { opacity: 'random(.35,1)', scale: 'random(.7,1.3)', rotation: 'random(-30,30)', duration: 'random(1.2,2.4)', ease: 'sine.inOut', yoyo: true, repeat: -1, repeatRefresh: true }));
    gsap.to('.moon-disc', { opacity: .72, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    const sp = { t: 0 };
    const spin = orbitalSpin = gsap.to(sp, { t: 360, duration: 70, ease: 'none', repeat: -1, onUpdate() {
      plantL.cameraOrbit = `${30 + sp.t + layerByElement.get(plantL).turn}deg 76deg 115%`;
      plantR.cameraOrbit = `${-30 - sp.t * 1.3 + layerByElement.get(plantR).turn}deg 72deg 125%`;
      stone.cameraOrbit = `${30 + sp.t * .8 + layerByElement.get(stone).turn}deg 65deg 110%`;
    } });
    ScrollTrigger.create({ trigger: '.hero', start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? spin.resume() : spin.pause()) });
  }

  /* mouse: o frasco inclina e as camadas se movem em profundidades diferentes */
  let pointerNX = 0, pointerNY = 0, activeDrag = null, orbitalSpin;
  const layers = [[plantL, -26, -14], [plantR, 32, 18], [stone, -16, 10], [$('.moon-disc'), 12, 8]]
    .map(([el, x, y]) => ({ el, x, y, dragX: 0, dragY: 0, turn: 0,
      qx: gsap.quickTo(el, 'x', { duration: 1.2 }), qy: gsap.quickTo(el, 'y', { duration: 1.2 }) }));
  const layerByElement = new Map(layers.map((layer) => [layer.el, layer]));
  const paintLayer = (layer) => {
    layer.qx(pointerNX * layer.x + layer.dragX);
    layer.qy(pointerNY * layer.y + layer.dragY);
  };
  layers.filter((layer) => layer.el.matches('.plant, .stone')).forEach((layer) => {
    layer.el.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      activeDrag = { layer, pointerId: e.pointerId, x: e.clientX, y: e.clientY, dragX: layer.dragX, dragY: layer.dragY, turn: layer.turn };
      orbitalSpin?.pause();
      layer.el.classList.add('is-dragging');
      e.preventDefault();
    });
    layer.el.addEventListener('dragstart', (e) => e.preventDefault());
    layer.el.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 36 : 18;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        layer.dragX += (e.key === 'ArrowLeft' ? -step : step);
        layer.turn += (e.key === 'ArrowLeft' ? -12 : 12);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        layer.dragY += (e.key === 'ArrowUp' ? -step : step);
      } else return;
      e.preventDefault();
      paintLayer(layer);
    });
  });
  addEventListener('pointerup', (e) => {
    if (!activeDrag || e.pointerId !== activeDrag.pointerId) return;
    activeDrag.layer.el.classList.remove('is-dragging');
    activeDrag = null;
    orbitalSpin?.resume();
  });
  addEventListener('pointercancel', () => {
    activeDrag?.layer.el.classList.remove('is-dragging');
    activeDrag = null;
    orbitalSpin?.resume();
  });
  addEventListener('pointermove', (e) => {
    const nx = e.clientX / innerWidth * 2 - 1, ny = e.clientY / innerHeight * 2 - 1;
    pointerNX = nx; pointerNY = ny;
    gsap.to(st, { px: nx, py: ny, duration: 1.2, ease: 'power3', overwrite: true, onUpdate: orbit });
    layers.forEach(paintLayer);
    if (activeDrag && e.pointerId === activeDrag.pointerId) {
      const { layer } = activeDrag;
      const maxX = innerWidth * .28, maxY = innerHeight * .18;
      layer.dragX = gsap.utils.clamp(-maxX, maxX, activeDrag.dragX + e.clientX - activeDrag.x);
      layer.dragY = gsap.utils.clamp(-maxY, maxY, activeDrag.dragY + e.clientY - activeDrag.y);
      layer.turn = activeDrag.turn + (e.clientX - activeDrag.x) * .7;
      paintLayer(layer);
      const baseOrbit = layer.el === plantR ? -30 : 30;
      const polar = layer.el === plantL ? 76 : layer.el === plantR ? 72 : 65;
      const zoom = layer.el === plantR ? 125 : layer.el === stone ? 110 : 115;
      layer.el.cameraOrbit = `${baseOrbit + layer.turn}deg ${polar}deg ${zoom}%`;
    }
  });

  /* rastro de estrelas (só com mouse) */
  if (matchMedia('(pointer: fine)').matches) {
    const box = $('.trail'), pool = Array.from({ length: 16 }, () => box.appendChild(Object.assign(new Image(), { src: 'assets/textures/star-particle.png', alt: '' })));
    let i = 0, lx = 0, ly = 0;
    addEventListener('pointermove', (e) => {
      if (Math.hypot(e.clientX - lx, e.clientY - ly) < 28) return;
      lx = e.clientX; ly = e.clientY;
      const s = pool[i++ % pool.length];
      gsap.killTweensOf(s);
      gsap.fromTo(s, { x: e.clientX - 15, y: e.clientY - 11, scale: .3, opacity: .9, rotation: 0 },
        { x: e.clientX - 15 + gsap.utils.random(-16, 16), y: e.clientY + 18, scale: gsap.utils.random(.6, 1.1), opacity: 0, rotation: gsap.utils.random(-120, 120), duration: 1.1, ease: 'power2.out' });
    });
  }

  /* scroll: o hero fica fixo e conta a pirâmide olfativa enquanto o frasco gira */
  const acts = [['NOTAS DE SAÍDA', 'Brilho cítrico', [232, 201, 147]], ['NOTAS DE CORAÇÃO', 'Pétalas lunares', [220, 159, 186]], ['NOTAS DE FUNDO', 'Rastro acolhedor', [176, 160, 230]]];
  const glow = { r: 210, g: 160, b: 205 };
  let cur = -2;
  const setGlow = (c) => gsap.to(glow, { r: c[0], g: c[1], b: c[2], duration: 1, overwrite: true, onUpdate: () => stage.style.setProperty('--glow', `${glow.r | 0} ${glow.g | 0} ${glow.b | 0}`) });
  const showAct = (i) => {
    if (i === cur) return;
    cur = i;
    gsap.killTweensOf(act);
    if (i < 0) { gsap.to(act, { opacity: 0, duration: .3 }); setGlow([210, 160, 205]); return; }
    gsap.timeline().to(act, { opacity: 0, y: 12, duration: .2 })
      .add(() => { act.firstChild.textContent = acts[i][0]; act.lastChild.textContent = acts[i][1]; })
      .to(act, { opacity: 1, y: 0, duration: .6, ease: 'power3.out' });
    setGlow(acts[i][2]);
  };
  gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=150%', scrub: 1, pin: true, anticipatePin: 1,
    onUpdate: (s) => { st.spin = s.progress * 330; orbit(); showAct(s.progress < .1 ? -1 : Math.min(2, Math.floor((s.progress - .1) / .3))); } } })
    .to('.hero-copy', { yPercent: -16, opacity: 0, duration: .2 }, 0)
    .to('.hero-aside', { xPercent: 25, opacity: 0, duration: .2 }, 0)
    .to('.scroll-hint', { opacity: 0, duration: .1 }, 0)
    .to('.moon-disc', { scale: 1.9, duration: 1 }, 0)
    .to('.halo-one', { scale: 1.25, rotation: 40, duration: 1 }, 0)
    .to('.halo-two', { rotation: 100, duration: 1 }, 0)
    .to(plantL, { xPercent: -70, rotation: -40, duration: 1 }, 0)
    .to(plantR, { xPercent: 70, rotation: 35, duration: 1 }, 0)
    .to(stone, { xPercent: -50, rotation: 25, duration: 1 }, 0)
    .to(product, { scale: 1.12, duration: 1 }, 0);

  /* seções seguintes */
  $$('.notes-heading h2, .concept-section h2').forEach((h) => gsap.from(split(h), { yPercent: 110, rotateX: -70, opacity: 0, stagger: .02, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: h, start: 'top 82%' } }));
  gsap.set('.note-card', { transformPerspective: 800 });
  gsap.from('.note-card', { y: 70, opacity: 0, rotateX: -18, stagger: .15, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.notes-grid', start: 'top 82%' } });
  $$('.note-card').forEach((c) => {
    const rx = gsap.quickTo(c, 'rotationX', { duration: .5 }), ry = gsap.quickTo(c, 'rotationY', { duration: .5 });
    c.addEventListener('pointermove', (e) => { const b = c.getBoundingClientRect(); ry(((e.clientX - b.left) / b.width - .5) * 12); rx(-((e.clientY - b.top) / b.height - .5) * 12); });
    c.addEventListener('pointerleave', () => { rx(0); ry(0); });
    gsap.to($('.note-orbit', c), { rotation: 360, duration: 24, ease: 'none', repeat: -1 });
  });
  gsap.from('.notes-intro', { y: 28, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: '.notes-intro', start: 'top 84%' } });
  gsap.from('.note-card > :not(.note-orbit)', { y: 18, opacity: 0, stagger: .08, duration: .65, ease: 'power3.out', scrollTrigger: { trigger: '.notes-grid', start: 'top 76%' } });
  gsap.to('.concept-mark', { rotation: 360, ease: 'none', scrollTrigger: { trigger: '.concept-section', scrub: true, start: 'top bottom', end: 'bottom top' } });
  gsap.from('.concept-section .eyebrow', { y: 20, opacity: 0, duration: .75, scrollTrigger: { trigger: '.concept-section', start: 'top 75%' } });
  gsap.from('.concept-copy, .concept-link', { y: 30, opacity: 0, stagger: .15, duration: .9, scrollTrigger: { trigger: '.concept-section', start: 'top 70%' } });

  /* cursor de lua: minguante normal, lua cheia sobre links, maior sobre o frasco */
  const moon = $('.moon-cursor');
  if (moon && matchMedia('(pointer: fine)').matches) {
    document.documentElement.classList.add('has-cursor');
    const svg = $('svg', moon), cut = $('#mc-cut');
    const qx = gsap.quickTo(moon, 'x', { duration: .35, ease: 'power3' }), qy = gsap.quickTo(moon, 'y', { duration: .35, ease: 'power3' });
    const qr = gsap.quickTo(svg, 'rotation', { duration: .6, ease: 'power3' });
    let mode = '', shown = false, rest;
    const size = () => (mode === 'link' ? 1.7 : mode === 'drag' ? 1.35 : 1);
    const setMode = (m) => {
      if (m === mode) return;
      mode = m;
      gsap.to(svg, { scale: size(), duration: .4, ease: 'back.out(2)', overwrite: 'auto' });
      gsap.to(cut, { attr: m === 'link' ? { cx: 60, cy: 20 } : { cx: 27, cy: 15 }, duration: .5, ease: 'power3.out' });
    };
    addEventListener('pointermove', (e) => {
      if (!shown) { shown = true; gsap.set(moon, { x: e.clientX, y: e.clientY }); gsap.to(moon, { opacity: 1, duration: .3 }); }
      qx(e.clientX); qy(e.clientY);
      qr(-20 + gsap.utils.clamp(-30, 30, e.movementX));
      clearTimeout(rest); rest = setTimeout(() => qr(-20), 120);
    });
    document.addEventListener('pointerover', (e) => setMode(e.target.closest('a,button,.note-card') ? 'link' : e.target.closest('#product-model') ? 'drag' : ''));
    addEventListener('pointerdown', () => gsap.to(svg, { scale: size() * .8, duration: .2, overwrite: 'auto' }));
    addEventListener('pointerup', () => gsap.to(svg, { scale: size(), duration: .4, ease: 'back.out(2)', overwrite: 'auto' }));
    document.documentElement.addEventListener('pointerleave', () => gsap.to(moon, { opacity: 0, duration: .2 }));
    document.documentElement.addEventListener('pointerenter', () => shown && gsap.to(moon, { opacity: 1, duration: .2 }));
    qr(-20);
  }
  addEventListener('load', () => ScrollTrigger.refresh());
}