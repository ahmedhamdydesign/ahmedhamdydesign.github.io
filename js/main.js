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
    if (lbl) lbl.textContent = open ? 'Close menu' : 'Menu';
    if (!open && returnFocus) toggle.focus();
  }
  if (nav && toggle && links) {
    toggle.addEventListener('click', function (e) {
      var open = !nav.classList.contains('is-open');
      setMenu(open);
      /* opened from the keyboard: move focus into the menu so the next Tab is not lost behind it */
      if (open && e.detail === 0) { var first = links.querySelector('a'); if (first) first.focus(); }
    });
    /* any link in the bar (sections, Hire me, the name) closes the menu */
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) setMenu(false, true);
    });
    doc.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target)) setMenu(false);
    });
    doc.addEventListener('focusin', function (e) {
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

  /* ── ticker pause button ────────────────────────────────────── */
  var tickBtn = $('tickerPause');
  if (tickBtn) {
    tickBtn.addEventListener('click', function () {
      var paused = tickBtn.getAttribute('aria-pressed') !== 'true';
      tickBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      tickBtn.parentNode.classList.toggle('is-paused', paused);
    });
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
    var tops = targets.map(function (el) { return el.getBoundingClientRect().top; }); /* read all first, then write */
    targets.forEach(function (el, k) {
      if (tops[k] < vh) return; /* already on screen: never hide it */
      var sibs = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
      el.style.setProperty('--d', (Math.min(sibs, 4) * 0.07) + 's');
      el.classList.add('rv');
      io.observe(el);
    });
  }

  /* ── printing: show everything, including the closed drawers ── */
  window.addEventListener('beforeprint', function () {
    all('.rv').forEach(function (el) { el.classList.add('in'); });
    all('details.more:not([open])').forEach(function (d) { d.open = true; d.setAttribute('data-po', ''); });
  });
  window.addEventListener('afterprint', function () {
    all('details[data-po]').forEach(function (d) { d.open = false; d.removeAttribute('data-po'); });
  });

  /* ── lightbox ───────────────────────────────────────────────── */
  var lb = $('lb'), lbImg = $('lbImg'), lbCap = $('lbCap'), lbCount = $('lbCount'),
      lbClose = $('lbClose'), lbPrev = $('lbPrev'), lbNext = $('lbNext'), lbStage = $('lbStage');
  if (!lb || !lbImg) return;

  var GROUP_NAMES = {
    hero: 'Featured', work: 'Selected work', covers: 'Book covers', characters: 'Character design',
    spreads: 'Interiors and scenes', process: 'Process', drifter: 'The Drifter', brand: 'Brand identity',
    guides: 'Brand guidelines'
  };
  var groups = {}, list = [], idx = 0, lastFocus = null, closeTimer = null, token = 0, openedAt = 0;
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  /* the hero art loads straight away, so its chosen file tells us if WebP works here */
  var heroImg = doc.querySelector('.stack img');
  var webpOK = !!(heroImg && /\.webp(\?|$)/.test(heroImg.currentSrc || ''));

  all('a.zoom').forEach(function (a) {
    var g = a.getAttribute('data-group') || 'all';
    (groups[g] = groups[g] || []).push(a);
    a.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; /* let "open in new tab" work */
      e.preventDefault();
      open(g, groups[g].indexOf(a));
    });
  });

  /* pick the smallest WebP from the srcset that is sharp at the size the viewer shows it */
  function bestSrc(a, need) {
    var img = a.querySelector('img');
    if (img && /\.webp(\?|$)/.test(img.currentSrc || '')) webpOK = true;
    if (!webpOK) return a.getAttribute('href');
    var src = a.querySelector('source');
    var cands = (src ? src.getAttribute('srcset') : '').split(',').map(function (p) {
      var bits = p.trim().split(/\s+/);
      return { url: bits[0], w: parseInt(bits[1], 10) || 0 };
    }).filter(function (c) { return c.url && c.w; }).sort(function (x, y) { return x.w - y.w; });
    if (!cands.length) return a.getAttribute('data-full') || a.getAttribute('href');
    for (var i = 0; i < cands.length; i++) if (cands[i].w >= need) return cands[i].url;
    return cands[cands.length - 1].url;
  }

  function render(i) {
    idx = (i + list.length) % list.length;
    var a = list[idx], img = a.querySelector('img'), my = ++token;
    var w = img ? +img.getAttribute('width') : 0, h = img ? +img.getAttribute('height') : 0;
    if (w && h) lbImg.style.setProperty('--ar', (w / h).toFixed(4)); /* the frame keeps its size while the file loads */
    lbImg.alt = img ? img.alt : '';
    var dpr = window.devicePixelRatio || 1;
    var shown = lbImg.getBoundingClientRect().width || Math.min(window.innerWidth, 1600);
    var full = bestSrc(a, Math.min(shown, w || shown) * dpr);
    /* show the thumbnail already on the page only if it has loaded, then swap in the sharp file */
    var thumb = (img && img.complete && img.naturalWidth) ? img.currentSrc : '';
    lbImg.src = thumb || full;
    if (thumb !== full) {
      var pre = new Image();
      pre.onload = function () { if (my === token) lbImg.src = full; };
      pre.src = full;
    }
    var title = a.getAttribute('data-title') || '', sub = a.getAttribute('data-sub') || '';
    lbCap.innerHTML = '';
    if (title) { var b = doc.createElement('b'); b.textContent = title; lbCap.appendChild(b); }
    if (sub) lbCap.appendChild(doc.createTextNode(sub));
    var pos = doc.createElement('span');
    pos.className = 'vh';
    pos.textContent = ', ' + (idx + 1) + ' of ' + list.length;
    lbCap.appendChild(pos);
    var g = a.getAttribute('data-group');
    lbCount.textContent = (GROUP_NAMES[g] ? GROUP_NAMES[g] + ' · ' : '') + (idx + 1) + ' / ' + list.length;
    /* warm up the next piece only, and not at all when the visitor asked to save data */
    if (list.length > 1 && !saveData) {
      var nx = list[(idx + 1) % list.length], nimg = nx.querySelector('img');
      var nw = nimg ? +nimg.getAttribute('width') : shown;
      new Image().src = bestSrc(nx, Math.min(shown, nw || shown) * dpr);
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
    openedAt = Date.now();
    if (lb.hidden) lastFocus = doc.activeElement;
    lb.classList.toggle('is-single', list.length < 2);
    lb.hidden = false;
    render(i < 0 ? 0 : i);
    void lb.offsetWidth; /* reflow so the fade runs */
    lb.classList.add('is-open');
    doc.documentElement.style.overflow = 'hidden';
    setInert(true);
    lbClose.focus();
  }

  function close() {
    if (lb.hidden || !lb.classList.contains('is-open')) return; /* a second Escape does nothing */
    clearTimeout(closeTimer);
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
  /* click on the dark backdrop closes; clicks on the art or buttons do not.
     Ignore the second click of the double click that opened the viewer. */
  lb.addEventListener('click', function (e) {
    if (Date.now() - openedAt < 400) return;
    if (e.target === lb || e.target === lbStage || e.target.classList.contains('lb__fig')) close();
  });

  doc.addEventListener('keydown', function (e) {
    if (lb.hidden || !lb.classList.contains('is-open')) return;
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
