/* Peshawar Arms Company · Home V2 preview. Motion: Lenis smooth scroll + GSAP ScrollTrigger + Flip. Products move, text stays still. */
(async () => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.registerPlugin(ScrollTrigger, Flip);

  /* ---------- data ---------- */
  const DATA = await fetch('assets/products.json').then(r => r.json());
  const bySlug = s => DATA.find(p => p.slug === s);
  const CALS = [...new Set(DATA.map(p => p.caliber))];

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollTo = (target, offset = -72) => { const el = typeof target === 'string' ? $(target) : target; if (!el) return; if (lenis) lenis.scrollTo(el, { offset, duration: 1.2 }); else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); };
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => { const id = a.getAttribute('href'); if (id.length > 1 && $(id)) { e.preventDefault(); scrollTo(id); } }));

  /* ---------- nav ---------- */
  const nav = $('#nav');
  ScrollTrigger.create({ start: 'top -60', onUpdate: s => nav.classList.toggle('is-solid', s.scroll() > 60) });
  $('#burger').addEventListener('click', () => { const open = nav.classList.toggle('is-open'); $('#burger').setAttribute('aria-expanded', open); });
  $$('.nav__links a').forEach(a => a.addEventListener('click', () => nav.classList.remove('is-open')));

  /* ---------- marquee ---------- */
  const mq = $('#marquee'); const order = ['pk-308-l', 'raad', 'battlehawk', 'pk07', 'foldstrike', 'vx-warborn', 'zarraredge', 'yarmouk-556'];
  mq.innerHTML = [...order, ...order].map(s => { const p = bySlug(s); return `<div class="marquee__item"><img src="assets/img/products/${s}.webp" alt="${p.name}" loading="lazy"><span>${p.name}</span></div>`; }).join('');

  /* ---------- gallery tiles ---------- */
  const tiles = $('#tiles');
  const sorted = [...DATA].sort((a, b) => a.cat.localeCompare(b.cat) || a.name.localeCompare(b.name));
  tiles.innerHTML = sorted.map(p => `<article class="tile" data-slug="${p.slug}" data-cat="${p.cat}" data-cal="${p.caliber}" data-text="${(p.name + ' ' + p.caliber + ' ' + p.platform + ' ' + p.stock + ' ' + p.cat + ' ' + p.tag).toLowerCase()}">
    <span class="chip tile__cal">${p.caliber}</span>
    <label class="tile__cmp"><input type="checkbox" data-cmp="${p.slug}" aria-label="Compare ${p.name}">Compare</label>
    <img src="assets/img/products/${p.slug}.webp" alt="${p.name}" loading="lazy">
    <div class="tile__name">${p.name}<small>${p.cat}</small></div>
    <div class="tile__specs"><span>${p.barrel.split(',')[0]}</span><span>${p.mag.split(' ')[0]} rd</span><span>${p.stock.split(' ').slice(0, 2).join(' ')}</span></div>
  </article>`).join('');

  let filter = 'all', query = '';
  const applyFilter = (animate = true) => {
    const all = $$('.tile'); const state = animate && !reduced ? Flip.getState(all) : null;
    let shown = 0;
    all.forEach(t => {
      let ok = true;
      if (filter.startsWith('cat:')) ok = t.dataset.cat === filter.slice(4);
      if (filter.startsWith('cal:')) ok = t.dataset.cal === filter.slice(4);
      if (ok && query) ok = t.dataset.text.includes(query);
      t.style.display = ok ? '' : 'none'; if (ok) shown++;
    });
    $('#empty').hidden = shown > 0;
    if (state) Flip.from(state, { duration: 0.6, ease: 'power3.out', stagger: 0.02, absolute: true, onEnter: els => gsap.fromTo(els, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 }), onLeave: els => gsap.to(els, { opacity: 0, scale: 0.9, duration: 0.3 }) });
    ScrollTrigger.refresh();
  };
  const setFilter = (f) => { filter = f; $$('#filters .chip').forEach(c => c.classList.toggle('is-on', c.dataset.filter === f)); applyFilter(); };
  $('#filters').addEventListener('click', e => { const b = e.target.closest('[data-filter]'); if (b) setFilter(b.dataset.filter); });
  $$('[data-cat]').forEach(a => a.addEventListener('click', () => { setFilter('cat:' + a.dataset.cat); if (a.closest('.hero') || a.closest('.nav')) scrollTo('#gallery'); }));
  let qT; $('#search').addEventListener('input', e => { clearTimeout(qT); qT = setTimeout(() => { query = e.target.value.trim().toLowerCase(); if (query) { filter = 'all'; $$('#filters .chip').forEach(c => c.classList.toggle('is-on', c.dataset.filter === 'all')); } applyFilter(); if (query) scrollTo('#gallery'); }, 150); });

  /* ---------- calibre band ---------- */
  $('#calrow').innerHTML = CALS.map(c => { const n = DATA.filter(p => p.caliber === c).length; return `<button class="cal__item" data-cal="${c}" title="${DATA.filter(p => p.caliber === c).map(p => p.name).join(', ')}"><span class="cal__num">${c.replace('mm', '')}</span><span class="label">${n} ${n === 1 ? 'model' : 'models'}</span></button>`; }).join('');
  $$('.cal__item').forEach(b => b.addEventListener('click', () => { const f = 'cal:' + b.dataset.cal; let chip = $(`#filters [data-filter="${f}"]`); if (!chip) { chip = document.createElement('button'); chip.className = 'chip chip--btn'; chip.dataset.filter = f; chip.textContent = b.dataset.cal.replace('mm', ''); $('#filters').appendChild(chip); } setFilter(f); scrollTo('#gallery'); }));

  /* ---------- compare ---------- */
  const DEFAULT_CMP = ['foldstrike', 'pk-103', 'black-unit-308'];
  let cmp = JSON.parse(localStorage.getItem('pac-compare') || 'null') || [];
  const ROWS = [['Calibre', 'caliber'], ['Barrel', 'barrel'], ['Magazine', 'mag'], ['Stock', 'stock'], ['Weight', 'weight'], ['Operation', 'action'], ['Finish', 'finish']];
  const renderCompare = () => {
    const list = (cmp.length ? cmp : DEFAULT_CMP).map(bySlug);
    const cols = $('#cmpcols');
    cols.innerHTML = list.map((p, i) => `<article class="ccol" style="--dx:${i === 0 ? '-40px' : i === 2 ? '40px' : '0'}"><div class="ccol__stage"><img src="assets/img/products/${p.slug}.webp" alt="${p.name}"></div><div class="ccol__body"><h3>${p.name}</h3>${ROWS.map(([l, k]) => { const vals = list.map(x => x[k] || '—'); const diff = list.length > 1 && new Set(vals).size > 1; return `<div class="ccol__row${diff ? ' is-diff' : ''}"><span class="label">${l}</span><span>${p[k] || '—'}</span></div>`; }).join('')}</div></article>`).join('')
      + (list.length < 3 && cmp.length ? `<div class="ccol ccol--empty">Tick one more model in the gallery</div>` : '');
    if (!reduced) gsap.fromTo($$('.ccol:not(.ccol--empty)', cols), { opacity: 0, x: (i, el) => parseFloat(getComputedStyle(el).getPropertyValue('--dx')) || 0 }, { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: '#compare', start: 'top 70%' } }); else $$('.ccol', cols).forEach(c => { c.style.opacity = 1; c.style.transform = 'none'; });
    const bar = $('#cmpbar'); $('#cmpcount').textContent = `${cmp.length} of 3 selected`;
    $('#cmpchips').innerHTML = cmp.map(s => `<span class="chip" data-remove="${s}">${bySlug(s).name} ×</span>`).join('');
    bar.classList.toggle('is-open', cmp.length > 0);
    $$('[data-cmp]').forEach(i => { i.checked = cmp.includes(i.dataset.cmp); i.disabled = !i.checked && cmp.length >= 3; });
    localStorage.setItem('pac-compare', JSON.stringify(cmp));
  };
  tiles.addEventListener('change', e => { const i = e.target.closest('[data-cmp]'); if (!i) return; const s = i.dataset.cmp; if (i.checked) { if (cmp.length >= 3) { i.checked = false; return; } cmp.push(s); } else cmp = cmp.filter(x => x !== s); renderCompare(); });
  $('#cmpchips').addEventListener('click', e => { const c = e.target.closest('[data-remove]'); if (c) { cmp = cmp.filter(x => x !== c.dataset.remove); renderCompare(); } });
  $('#cmpclear').addEventListener('click', () => { cmp = []; renderCompare(); });
  renderCompare();

  /* ---------- quote prefill ---------- */
  $$('[data-model]').forEach(a => a.addEventListener('click', () => { const wa = $('#wa'); wa.href = wa.href.replace(/for%20.*$/, 'for%20' + encodeURIComponent(a.dataset.model)); }));

  /* ---------- motion ---------- */
  const loader = $('#loader');
  if (reduced) { loader.remove(); $$('.reveal, .cal__num, .mfg__lines span i').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; }); $$('.spot').forEach(s => s.classList.add('is-in')); return; }

  // split hero words into clip-masked spans
  $$('.hero__title .word').forEach(w => { w.innerHTML = `<span>${w.textContent}</span>`; });
  $$('.spot__word').forEach(h => { h.innerHTML = h.innerHTML.split(/\s+/).map(w => `<span class="line"><span class="w">${w}</span></span>`).join(' '); });
  $$('.mfg__lines span').forEach(s => { s.innerHTML = `<i>${s.textContent}</i>`; });

  // load sequence
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.fromTo('.loader__band', { scaleX: 0 }, { scaleX: 1, duration: 0.6 })
    .fromTo('.loader__word', { scale: 1.1, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6 }, '-=0.3')
    .to('.loader', { yPercent: -100, duration: 0.7, ease: 'expo.inOut', delay: 0.2 })
    .set('.loader', { display: 'none' })
    .fromTo('.hero__ghost', { scale: 1.1, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2 }, '-=0.5')
    .fromTo('.hero__title .word span', { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.08 }, '-=1.1')
    .fromTo('.eyebrow, .hero__sub', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 }, '-=0.6')
    .to('.hero__band', { scaleX: 1, duration: 0.8, ease: 'expo.inOut' }, '-=0.7')
    .to('.hero__band-edge', { scaleX: 1, duration: 0.8, ease: 'expo.inOut' }, '-=0.75')
    .fromTo('.hero__product img', { x: 160, opacity: 0, filter: 'blur(14px)' }, { x: 0, opacity: 1, filter: 'blur(0px)', duration: 1.1 }, '-=0.5')
    .fromTo('.hero__tags .chip, .hero__cats a', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06 }, '-=0.5')
    .fromTo('.nav', { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.8');

  // hero scroll parallax
  gsap.to('.hero__product img', { y: 120, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__band, .hero__band-edge', { y: 60, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__copy', { opacity: 0, y: -40, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: '70% top', scrub: true } });

  // generic reveals
  $$('.reveal').forEach((el, i) => gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', delay: (i % 3) * 0.08, scrollTrigger: { trigger: el, start: 'top 88%' } }));

  // ranges hover tilt (desktop only)
  if (matchMedia('(hover:hover) and (min-width:900px)').matches) $$('.tilt').forEach(card => {
    const img = $('.range__img', card);
    card.addEventListener('mousemove', e => { const r = card.getBoundingClientRect(); const dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5; gsap.to(card, { rotateY: dx * 8, rotateX: -dy * 8, transformPerspective: 900, duration: 0.5, ease: 'power2.out' }); gsap.to(img, { x: dx * 24, y: dy * 16, duration: 0.5 }); });
    card.addEventListener('mouseleave', () => { gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.7, ease: 'elastic.out(1,0.6)' }); gsap.to(img, { x: 0, y: 0, duration: 0.7 }); });
  });

  // spotlights: product slides in from its side, word types in, band skews, parallax
  $$('.spot').forEach(s => {
    const right = s.classList.contains('spot--right');
    const t = gsap.timeline({ scrollTrigger: { trigger: s, start: 'top 65%', once: true, onEnter: () => s.classList.add('is-in') } });
    t.fromTo($('.spot__product img', s), { x: right ? 140 : -140, opacity: 0 }, { x: 0, opacity: 1, duration: 1.1, ease: 'expo.out' })
      .fromTo($$('.spot__word .w', s), { yPercent: 110 }, { yPercent: 0, duration: 0.8, stagger: 0.1, ease: 'expo.out' }, '-=0.8')
      .fromTo($$('.spot__text > :not(.spot__word)', s), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 }, '-=0.5');
    gsap.to($('.spot__product img', s), { y: -40, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo($('.spot__band', s), { skewX: -14 }, { skewX: -18, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // gallery wave
  ScrollTrigger.batch('.tile', { start: 'top 90%', onEnter: els => gsap.fromTo(els, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: 'power3.out', overwrite: true }) });

  // calibre numbers
  gsap.to('.cal__num', { y: 0, duration: 0.8, stagger: 0.06, ease: 'expo.out', scrollTrigger: { trigger: '.cal', start: 'top 80%' } });

  // manufacturing lines + carbine
  gsap.to('.mfg__lines span i', { y: 0, duration: 0.8, stagger: 0.12, ease: 'expo.out', scrollTrigger: { trigger: '.mfg', start: 'top 70%' } });
  gsap.fromTo('.mfg__product img', { x: 120, opacity: 0 }, { x: 0, opacity: 1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.mfg', start: 'top 70%' } });
  gsap.fromTo('.mfg__emblems img', { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(2)', scrollTrigger: { trigger: '.mfg__emblems', start: 'top 90%' } });

  // quote: ghost drifts, buttons magnetic, WhatsApp pulse
  gsap.to('.quote__ghost', { x: 120, ease: 'none', scrollTrigger: { trigger: '.quote', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('#wa', { scale: 1 }, { scale: 1.04, duration: 0.35, yoyo: true, repeat: 1, ease: 'power1.inOut', scrollTrigger: { trigger: '.quote', start: 'top 60%', once: true } });
  if (matchMedia('(hover:hover)').matches) $$('.magnetic, .btn--red').forEach(b => {
    b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.25, duration: 0.4 }); });
    b.addEventListener('mouseleave', () => gsap.to(b, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.5)' }));
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
