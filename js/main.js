/* Ahmed Hamdy portfolio, v10 */
(function () {
  'use strict';
  var doc = document;
  var mm = function (q) { return window.matchMedia ? window.matchMedia(q) : { matches: false }; };
  var reduce = mm('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return doc.getElementById(id); };
  var all = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };

  /* year */
  var yr = $('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ── mobile menu ─────────────────────────────────────────────── */
  var nav = $('nav'), toggle = $('navToggle'), links = $('navLinks');
  function setMenu(open, returnFocus) {
    if (!nav || !toggle) return;
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    var lbl = toggle.querySelector('.lbl');
    if (lbl) lbl.textContent = open ? 'Close' : 'Menu';
    if (!open && returnFocus) toggle.focus();
  }
  if (nav && toggle && links) {
    toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
    links.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) setMenu(false, true);
    });
    doc.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target)) setMenu(false);
    });
    var wide = mm('(min-width: 1061px)');
    var onWide = function () { if (wide.matches) setMenu(false); };
    if (wide.addEventListener) wide.addEventListener('change', onWide);
    else if (wide.addListener) wide.addListener(onWide);
  }

  /* ── current section in the nav ─────────────────────────────── */
  if (links && 'IntersectionObserver' in window) {
    var navLinks = all('a[href^="#"]', links);
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var mark = function (id) {
      navLinks.forEach(function (a) {
        if (a === byId[id]) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) mark(e.target.getAttribute('data-nav') || e.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    all('main section[id], main .hero').forEach(function (s) { spy.observe(s); });
  }

  /* ── reveal on scroll (skipped when the visitor prefers less motion) ── */
  if (!reduce && 'IntersectionObserver' in window) {
    var targets = all('.sec__head, .row, .covers > .piece, .pages > .pg, .pair > *, .sketches > .piece, .guides > .piece, .guides-cover, .steps li, .contact .wrap > *');
    var vh = window.innerHeight || 800;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    targets.forEach(function (el) {
      if (el.getBoundingClientRect().top < vh) return; /* already on screen: never hide it */
      var sibs = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
      el.style.setProperty('--d', (Math.min(sibs, 4) * 0.07) + 's');
      el.classList.add('rv');
      io.observe(el);
    });
    window.addEventListener('beforeprint', function () { targets.forEach(function (el) { el.classList.add('in'); }); });
  }

  /* ── lightbox ───────────────────────────────────────────────── */
  var lb = $('lb'), lbImg = $('lbImg'), lbCap = $('lbCap'), lbCount = $('lbCount'),
      lbClose = $('lbClose'), lbPrev = $('lbPrev'), lbNext = $('lbNext'), lbStage = $('lbStage');
  if (!lb || !lbImg) return;

  var GROUP_NAMES = {
    hero: 'Featured', work: 'Selected work', covers: 'Book covers', characters: 'Character design',
    spreads: 'Interiors and scenes', process: 'Process', drifter: 'The Drifter', brand: 'Brand identity',
    guides: 'Brand guidelines'
  };
  var groups = {}, list = [], idx = 0, lastFocus = null, closeTimer = null, token = 0;
  var webpOK = false;

  all('a.zoom').forEach(function (a) {
    var g = a.getAttribute('data-group') || 'all';
    (groups[g] = groups[g] || []).push(a);
    a.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; /* let "open in new tab" work */
      e.preventDefault();
      open(g, groups[g].indexOf(a));
    });
  });

  function fullSrc(a) {
    var img = a.querySelector('img');
    var cur = img && (img.currentSrc || '');
    if (/\.webp(\?|$)/.test(cur)) webpOK = true;
    return (webpOK && a.getAttribute('data-full')) || a.getAttribute('href');
  }

  function render(i) {
    idx = (i + list.length) % list.length;
    var a = list[idx], img = a.querySelector('img'), my = ++token;
    var thumb = img ? (img.currentSrc || img.src) : '';
    var full = fullSrc(a);
    lbImg.alt = img ? img.alt : '';
    /* show the sharp file once it is ready; until then the thumbnail already on the page */
    if (thumb) lbImg.src = thumb;
    var pre = new Image();
    pre.onload = function () { if (my === token) lbImg.src = full; };
    pre.src = full;
    var title = a.getAttribute('data-title') || '', sub = a.getAttribute('data-sub') || '';
    lbCap.innerHTML = '';
    if (title) { var b = doc.createElement('b'); b.textContent = title; lbCap.appendChild(b); }
    if (sub) lbCap.appendChild(doc.createTextNode(sub));
    var g = a.getAttribute('data-group');
    lbCount.textContent = (GROUP_NAMES[g] ? GROUP_NAMES[g] + ' \u00b7 ' : '') + (idx + 1) + ' / ' + list.length;
    /* warm up the neighbours */
    if (list.length > 1) {
      [idx + 1, idx - 1].forEach(function (n) { var x = new Image(); x.src = fullSrc(list[(n + list.length) % list.length]); });
    }
  }

  function setInert(on) {
    Array.prototype.forEach.call(doc.body.children, function (el) {
      if (el === lb || el.tagName === 'SCRIPT') return;
      if (on) { el.setAttribute('inert', ''); el.setAttribute('aria-hidden', 'true'); }
      else { el.removeAttribute('inert'); el.removeAttribute('aria-hidden'); }
    });
  }

  function open(g, i) {
    list = groups[g] || [];
    if (!list.length) return;
    clearTimeout(closeTimer);
    lastFocus = doc.activeElement;
    lb.classList.toggle('is-single', list.length < 2);
    render(i < 0 ? 0 : i);
    lb.hidden = false;
    void lb.offsetWidth; /* reflow so the fade runs */
    lb.classList.add('is-open');
    doc.documentElement.style.overflow = 'hidden';
    setInert(true);
    lbClose.focus();
  }

  function close() {
    if (lb.hidden) return;
    lb.classList.remove('is-open');
    doc.documentElement.style.overflow = '';
    setInert(false);
    token++;
    closeTimer = setTimeout(function () { lb.hidden = true; lbImg.removeAttribute('src'); }, reduce ? 0 : 220);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  lbClose.addEventListener('click', close);
  lbPrev.addEventListener('click', function () { render(idx - 1); });
  lbNext.addEventListener('click', function () { render(idx + 1); });
  /* click on the dark backdrop closes; clicks on the art or buttons do not */
  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target === lbStage || e.target.classList.contains('lb__fig')) close();
  });

  doc.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowLeft' && list.length > 1) { e.preventDefault(); render(idx - 1); return; }
    if (e.key === 'ArrowRight' && list.length > 1) { e.preventDefault(); render(idx + 1); return; }
    if (e.key === 'Tab') { /* keep focus inside the viewer */
      var order = list.length > 1 ? [lbClose, lbPrev, lbNext] : [lbClose];
      var at = order.indexOf(doc.activeElement);
      e.preventDefault();
      order[(at + (e.shiftKey ? -1 : 1) + order.length) % order.length].focus();
    }
  });

  /* swipe left or right on touch screens */
  var sx = null, sy = null;
  lb.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) { sx = null; return; }
    sx = e.touches[0].clientX; sy = e.touches[0].clientY;
  }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (sx === null || list.length < 2) return;
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    sx = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) render(dx < 0 ? idx + 1 : idx - 1);
  }, { passive: true });
})();
