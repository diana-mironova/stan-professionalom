
(function(){
function initializeVeronikaSite(){
if(window.__veronikaSiteInitialized)return;
window.__veronikaSiteInitialized=true;

/* неразрывные пробелы после коротких слов и перед тире */
(() => {
  const SHORT = 'а|в|во|и|к|ко|о|об|с|со|у|на|по|из|за|до|не|ни|от|для|без|при|над|под|про|что|как|или|но|же|ли|бы|ты|я|мы|вы|их|её|его|это|то|все|всё|уже|раз|чем|где|кто';
  const reShort = new RegExp('(^|[\\s\\u00A0(«])(' + SHORT + ') ', 'gi');
  const fix = s => {
    for (let k = 0; k < 2; k++) s = s.replace(reShort, '$1$2 ');
    return s.replace(/ (—|–)/g, ' $1').replace(/(\d) (?=[\dа-яё₽])/gi, '$1 ');
  };
  const walk = document.createTreeWalker(document.getElementById('allrecords') || document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: n => n.parentNode.closest('script, style') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  const nodes = []; while (walk.nextNode()) nodes.push(walk.currentNode);
  nodes.forEach(n => { const v = fix(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; });
})();

/* отзывы: стрелки листают карусель, скрин открывается крупно */
(() => {
  const g = document.getElementById('revs'); if (!g) return;
  const step = () => { const c = g.querySelector('.rev'); return c ? c.getBoundingClientRect().width + parseFloat(getComputedStyle(g).columnGap || 16) : g.clientWidth; };
  const prev = document.querySelector('.rev-prev'), next = document.querySelector('.rev-next');
  prev.addEventListener('click', () => g.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => g.scrollBy({ left: step(), behavior: 'smooth' }));
  const upd = () => { prev.disabled = g.scrollLeft < 4; next.disabled = g.scrollLeft + g.clientWidth > g.scrollWidth - 4; };
  g.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd); upd();
  const close = () => { const o = document.querySelector('.lb'); if (o) o.remove(); };
  g.querySelectorAll('.rev-shot').forEach(b => b.addEventListener('click', () => {
    const o = document.createElement('div'); o.className = 'lb';
    o.innerHTML = '<img src="' + b.querySelector('img').src + '" alt="">';
    o.addEventListener('click', close); document.body.appendChild(o);
  }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();

/* первый экран, слайдер (Диана, 28.10): главное фото крупно, стрелки прямо под ним;
   компьютер: три полупрозрачных фото сзади справа полудугой; телефон: главное по центру, два полупрозрачных по бокам */
(() => {
  const DATA = [
    ['jack-full', '«Капитан Джек Воробей»'],
    ['lilo', '«Лило и Стич»'],
    ['arab', '«Арабская ночь»'],
    ['tom', '«Том и Джерри»'],
    ['spider', '«Человек-паук»'],
    ['jasmine', '«Арабская ночь»'],
    ['jack-solo', '«Капитан Джек Воробей»'],
    ['jerry', '«Том и Джерри»'],
    ['aladdin-l', '«Арабская ночь»'],
    ['lilo-solo', '«Лило и Стич»'],
    ['genie', '«Арабская ночь»'],
  ];
  const hero = document.getElementById('hero');
  const wheel = document.getElementById('wheel');
  const track = document.getElementById('track');
  const arrows = document.getElementById('arrows');
  const N = DATA.length;
  const DEG = Math.PI / 180;

  const cards = DATA.map(([f, t]) => {
    const el = document.createElement('figure');
    el.className = 'hv-card';
    el.innerHTML = `<img src="https://diana-mironova.github.io/stan-professionalom/site/img/${f}.jpg" alt="Торт ${t}" draggable="false">`;
    track.appendChild(el);
    return el;
  });

  let phone = false, W, H, cw, ch, fx, fy, L = {};
  function measure() {
    phone = window.innerWidth < 900;
    W = wheel.clientWidth; H = wheel.clientHeight;
    const gap = phone ? 16 : 20, aH = 54;
    if (phone) {
      cw = Math.min(W * .62, 260); ch = cw * 4 / 3;
      fx = W / 2;
      fy = (H - (ch + gap + aH)) / 2 + ch / 2;
      L = { dx: W * .4, dy: -14, s: .72, o: .4 };
    } else {
      ch = Math.min(H - 56 - gap - aH, W * .64 * 4 / 3); cw = ch * 3 / 4;
      fx = cw / 2 + 8;
      fy = (H - (ch + gap + aH)) / 2 + ch / 2;
      const s = .4; // задние фото меньше и дальше от главного, с просветом между собой
      L = { s, o: .42, x2: W - cw * s / 2 - 6, rx: 60, ry: H * .345 };
    }
    cards.forEach(c => c.style.setProperty('--cw', cw.toFixed(1) + 'px'));
    arrows.style.left = fx.toFixed(1) + 'px';
    arrows.style.top = (fy + ch / 2 + gap).toFixed(1) + 'px';
  }

  const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, s: a.s + (b.s - a.s) * t, o: a.o + (b.o - a.o) * t });
  // компьютер: место на дуге справа для 1…4 (1 сверху, 2 посередине, 3 снизу, к 4 фото гаснет)
  const arc = r => {
    const th = (r - 2) * 62 * DEG;
    return { x: L.x2 - L.rx * (1 - Math.cos(th)), y: fy + L.ry * Math.sin(th), s: L.s, o: r <= 3 ? L.o : L.o * Math.max(0, 4 - r) };
  };
  function stateDesk(rel) {
    const F = { x: fx, y: fy, s: 1, o: 1 };
    if (rel <= -1 || rel >= 4) return null;
    if (rel < 0) return lerp({ x: fx - cw * .22, y: fy, s: .9, o: 0 }, F, rel + 1);
    if (rel < 1) return lerp(F, arc(1), rel);
    return arc(rel);
  }
  // телефон: главное по центру, по бокам по одному, дальше гаснут; бока чуть выше и меньше, получается дуга
  function statePhone(rel) {
    const a = Math.abs(rel), sg = Math.sign(rel) || 1;
    if (a >= 2) return null;
    const F = { x: fx, y: fy, s: 1, o: 1 };
    const S1 = { x: fx + sg * L.dx, y: fy + L.dy, s: L.s, o: L.o };
    const S2 = { x: fx + sg * L.dx * 1.6, y: fy + L.dy * 2.4, s: L.s * .8, o: 0 };
    return a < 1 ? lerp(F, S1, a) : lerp(S1, S2, a - 1);
  }

  let pos = 0, target = 0, drag = false, hover = false, lastX = 0, lastY = 0, lastT = 0, vel = 0, visible = true, wait = 0;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HOLD = 3400; // фото стоит впереди 3,4 с, потом листается само

  function place() {
    for (let k = 0; k < N; k++) {
      let rel = ((k - pos) % N + N) % N; if (rel >= N / 2) rel -= N;
      const el = cards[k], st = phone ? statePhone(rel) : stateDesk(rel);
      if (!st || st.o <= .005) { el.style.opacity = '0'; el.style.visibility = 'hidden'; continue; }
      el.style.visibility = '';
      el.style.transform = `translate3d(${(st.x - cw / 2).toFixed(1)}px, ${(st.y - ch / 2).toFixed(1)}px, 0) scale(${st.s.toFixed(3)})`;
      el.style.opacity = st.o.toFixed(3);
      el.style.zIndex = String(100 - Math.round(Math.abs(rel) * 25));
      el.classList.toggle('back', Math.abs(rel) > .5);
    }
  }

  let prev = performance.now();
  function tick(now) {
    const dt = Math.min(48, now - prev); prev = now;
    if (!drag && visible) {
      if (!reduce && !hover) { wait += dt; if (wait > HOLD) { wait = 0; target += 1; } }
      pos += (target - pos) * (1 - Math.exp(-dt / 200));
      place();
    }
    requestAnimationFrame(tick);
  }

  const go = d => { target = Math.round(target) + d; wait = 0; };
  document.getElementById('prev').addEventListener('click', () => go(-1));
  document.getElementById('next').addEventListener('click', () => go(1));

  // компьютер: мышью вверх-вниз или вбок; телефон: пальцем вбок
  track.addEventListener('pointerdown', e => {
    drag = true; vel = 0; wait = 0; lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
    track.classList.add('drag'); track.setPointerCapture(e.pointerId);
  });
  track.addEventListener('pointermove', e => {
    if (!drag) return;
    const now = performance.now();
    const dy = e.clientY - lastY, dx = e.clientX - lastX;
    const d = phone ? -dx / (W * .4) : (Math.abs(dy) > Math.abs(dx) ? -dy : -dx) / 240;
    pos += d; vel = d / Math.max(8, now - lastT);
    lastX = e.clientX; lastY = e.clientY; lastT = now;
    place();
  });
  const end = () => { if (!drag) return; drag = false; track.classList.remove('drag'); target = Math.round(pos + vel * 220); wait = 0; };
  track.addEventListener('pointerup', end);
  track.addEventListener('pointercancel', end);
  wheel.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hover = true; });
  wheel.addEventListener('pointerleave', () => { hover = false; });

  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(hero);
  let lastW = 0;
  window.addEventListener('resize', () => { if (window.innerWidth === lastW) return; lastW = window.innerWidth; measure(); place(); });
  const start = () => { lastW = window.innerWidth; measure(); place(); requestAnimationFrame(t => { prev = t; tick(t); }); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else window.addEventListener('load', start);
})();

/* остальная страница */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // появление блоков
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); io.unobserve(e.target);
  }), { rootMargin: '0px 0px -8% 0px', threshold: .12 });
  document.querySelectorAll('.rv').forEach(el => io.observe(el));

  // росчерк под «начинается здесь»
  const sw = document.getElementById('swash2');
  if (sw) new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { sw.classList.add('go'); o.disconnect(); } }, { threshold: 1 }).observe(sw);

  // липкая шапка
  const bar = document.getElementById('bar');
  new IntersectionObserver(es => bar.classList.toggle('show', !es[0].isIntersecting), { rootMargin: '-80px 0px 0px 0px' })
    .observe(document.querySelector('#hero .hv-text'));

  // двенадцать точек по кругу
  const months = document.getElementById('months');
  for (let k = 0; k < 12; k++) {
    const a = -Math.PI / 2 + k * Math.PI / 6;
    const i = document.createElement('i');
    i.style.left = (50 + 38 * Math.cos(a)).toFixed(2) + '%';
    i.style.top = (50 + 34 * Math.sin(a)).toFixed(2) + '%';
    i.style.setProperty('--k', k);
    months.appendChild(i);
  }

  // лента работ: дублируем для бесшовного круга
  const mq = document.getElementById('mq');
  mq.innerHTML += mq.innerHTML;
  new IntersectionObserver((es, o) => {
    if (!es[0].isIntersecting) return;
    mq.querySelectorAll('img').forEach(i => { i.loading = 'eager'; });
    o.disconnect();
  }, { rootMargin: '1200px 0px' }).observe(mq);

  // слайдер композиций: вкладки, стрелки, свайп, автопоказ по фото уроков
  (() => {
    const sl = document.getElementById('slider');
    if (!sl) return;
    const view = sl.querySelector('.sl-view'), track = sl.querySelector('.sl-track');
    const slides = [...sl.querySelectorAll('.slide')], tabs = [...sl.querySelectorAll('.sl-tab')];
    const N = slides.length, PH = 3200; // одно фото держится 3,2 секунды
    let cur = 0, auto = !reduce, inView = false, hover = false, elapsed = 0;

    // фото внутри слайда: главное и по одному на каждый урок
    const st = slides.map(s => {
      const lays = [...s.querySelectorAll('.lay')], thumbs = [...s.querySelectorAll('.th')], chip = s.querySelector('.comp-chip');
      const srcs = [s.dataset.main, ...thumbs.map(t => t.dataset.big)];
      const o = { srcs, idx: 0, front: 0, want: 0 };
      o.show = idx => {
        o.want = idx;
        if (idx === o.idx) { thumbs.forEach((t, j) => t.classList.toggle('on', j === idx - 1)); return; }
        const back = lays[1 - o.front];
        const done = () => {
          if (o.want !== idx) return;
          back.classList.add('on'); lays[o.front].classList.remove('on');
          o.front = 1 - o.front; o.idx = idx;
          thumbs.forEach((t, j) => t.classList.toggle('on', j === idx - 1));
          if (chip) { if (idx) chip.textContent = thumbs[idx - 1].textContent; chip.classList.toggle('on', !!idx); }
        };
        back.onload = done;
        back.alt = idx ? thumbs[idx - 1].textContent : lays[o.front].alt;
        back.src = srcs[idx];
        if (back.complete && back.naturalWidth) { back.onload = null; done(); }
      };
      o.preload = () => srcs.forEach(u => { const i = new Image(); i.src = u; });
      thumbs.forEach((t, j) => t.addEventListener('click', () => { stop(); o.show(o.idx === j + 1 ? 0 : j + 1); }));
      return o;
    });

    const setBar = (k, v) => tabs[k].style.setProperty('--p', v.toFixed(4));
    function go(i, user) {
      if (user) stop();
      i = (i + N) % N;
      const changed = i !== cur;
      cur = i; elapsed = 0;
      track.style.transform = `translate3d(${-i * 100}%, 0, 0)`;
      slides.forEach((s, k) => { const on = k === i; s.classList.toggle('on', on); s.setAttribute('aria-hidden', String(!on)); s.inert = !on; });
      tabs.forEach((t, k) => { const on = k === i; t.classList.toggle('on', on); t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; setBar(k, on && !auto ? 1 : 0); });
      if (changed) st[i].show(0);
      st[i].preload(); st[(i + 1) % N].preload();
    }
    function stop() {
      if (!auto) return;
      auto = false;
      tabs.forEach((t, k) => setBar(k, k === cur ? 1 : 0));
    }

    tabs.forEach((t, k) => t.addEventListener('click', () => go(k, true)));
    // стрелки две пары: у вкладок (телефон, планшет) и справа от заголовка (компьютер)
    document.querySelectorAll('#lessons .sl-prev').forEach(b => b.addEventListener('click', () => go(cur - 1, true)));
    document.querySelectorAll('#lessons .sl-next').forEach(b => b.addEventListener('click', () => go(cur + 1, true)));
    sl.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { go(cur + 1, true); if (e.target.classList.contains('sl-tab')) tabs[cur].focus(); }
      if (e.key === 'ArrowLeft') { go(cur - 1, true); if (e.target.classList.contains('sl-tab')) tabs[cur].focus(); }
    });
    view.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hover = true; });
    view.addEventListener('pointerleave', () => { hover = false; });

    // свайп и перетаскивание
    let drag = false, moved = false, sx = 0, sy = 0, dx = 0, w = 1;
    view.addEventListener('pointerdown', e => {
      if (e.button) return;
      drag = true; moved = false; sx = e.clientX; sy = e.clientY; dx = 0; w = view.clientWidth;
    });
    view.addEventListener('pointermove', e => {
      if (!drag) return;
      dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (!moved) {
        if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) { moved = true; track.classList.add('drag'); view.setPointerCapture(e.pointerId); }
        else if (Math.abs(dy) > 12) { drag = false; return; }
        else return;
      }
      const edge = (cur === 0 && dx > 0) || (cur === N - 1 && dx < 0);
      track.style.transform = `translate3d(calc(${-cur * 100}% + ${(edge ? dx * .3 : dx).toFixed(1)}px), 0, 0)`;
    });
    const up = () => {
      if (!drag) return;
      drag = false;
      if (!moved) return;
      track.classList.remove('drag');
      if (dx < -w * .12 && cur < N - 1) go(cur + 1, true);
      else if (dx > w * .12 && cur > 0) go(cur - 1, true);
      else { stop(); go(cur); }
    };
    view.addEventListener('pointerup', up);
    view.addEventListener('pointercancel', up);
    view.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

    // картинки всех слайдов подгружаем заранее, иначе соседние слайды пустые
    new IntersectionObserver((es, o) => {
      if (!es[0].isIntersecting) return;
      sl.querySelectorAll('img[loading="lazy"]').forEach(i => { i.loading = 'eager'; });
      o.disconnect();
    }, { rootMargin: '900px 0px' }).observe(sl);
    new IntersectionObserver(es => { inView = es[0].isIntersecting; }, { threshold: .3 }).observe(view);

    // на компьютере столбик композиций справа той же высоты, что главное фото
    const arch0 = slides[0].querySelector('.comp-arch');
    const fitNav = () => sl.style.setProperty('--ph', arch0.offsetHeight + 'px');
    if (window.ResizeObserver) new ResizeObserver(fitNav).observe(arch0);
    fitNav();

    let last = performance.now();
    const tick = now => {
      const dt = Math.min(100, now - last); last = now;
      if (auto && inView && !hover && !drag && !document.hidden) {
        const s = st[cur], total = PH * s.srcs.length;
        elapsed += dt;
        setBar(cur, Math.min(1, elapsed / total));
        const k = Math.min(s.srcs.length - 1, Math.floor(elapsed / PH));
        if (k !== s.want) s.show(k);
        if (elapsed >= total) go(cur + 1);
      }
      requestAnimationFrame(tick);
    };
    go(0);
    requestAnimationFrame(t => { last = t; tick(t); });
  })();

  // лёгкий параллакс фото внутри арок
  const pars = [...document.querySelectorAll('.par')];
  if (!reduce) {
    let ticking = false;
    const upd = () => {
      ticking = false;
      const vh = window.innerHeight;
      pars.forEach(p => {
        const r = p.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        const k = (r.top + r.height / 2 - vh / 2) / vh;
        p.firstElementChild.style.setProperty('--py', (Math.max(-1, Math.min(1, k)) * -18).toFixed(1) + 'px');
      });
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  // вопросы: плавное раскрытие
  document.querySelectorAll('.qa').forEach(d => {
    const sum = d.querySelector('summary'), body = d.querySelector('.qa-a');
    sum.addEventListener('click', e => {
      e.preventDefault();
      if (reduce) { d.open = !d.open; return; }
      if (d.open) {
        const h = body.offsetHeight;
        d.classList.add('closing');
        body.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 320, easing: 'cubic-bezier(.4,0,.2,1)' })
          .onfinish = () => { d.open = false; d.classList.remove('closing'); };
      } else {
        d.open = true;
        const h = body.offsetHeight;
        body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.2,.7,.2,1)' });
      }
    });
  });
})();

/* «Что внутри»: карточка оживает, когда появляется на экране (на телефоне наведения нет), и снова, когда возвращаешься к ней */
(() => {
  const cards = document.querySelectorAll('#inside .fcard, #launch .lcard');
  if (!('IntersectionObserver' in window)) { cards.forEach(c => c.classList.add('on')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('on', e.isIntersecting)), { threshold: .5 });
  cards.forEach(c => io.observe(c));
})();

}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initializeVeronikaSite,{once:true});
else initializeVeronikaSite();
})();
