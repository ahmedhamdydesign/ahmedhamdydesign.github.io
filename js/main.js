/* Ahmed Hamdy portfolio */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* year */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* hero marquee: sizes are declared so lazy loading can defer off-screen frames */
  var strip = [
    ['char-alien', 1600, 1600], ['cover-dave', 1280, 1600], ['scene-fish', 1600, 1600],
    ['drifter-p08', 1600, 2447], ['char-lemonade', 1600, 1600], ['cover-frankie', 1280, 1600],
    ['scene-underwater', 1600, 811], ['cover-merrick', 1280, 1600], ['char-period', 1600, 1474],
    ['scene-cave', 1600, 812], ['cover-mouseville', 1556, 1600], ['spread-bakery', 1600, 1135],
    ['cover-hobby', 1280, 1600], ['scene-city', 1600, 1600]
  ];
  var track = document.getElementById('mtrack');
  if (track) {
    var html = strip.map(function (s, i) {
      return '<img src="assets/work/' + s[0] + '.jpg" alt="" width="' + s[1] + '" height="' + s[2] +
        '" loading="' + (i < 5 ? 'eager' : 'lazy') + '" decoding="async">';
    }).join('');
    track.innerHTML = html + html.replace(/loading="eager"/g, 'loading="lazy"');
  }

  /* reveal on scroll */
  var targets = document.querySelectorAll('.case__head, .fig, .pages figure, .steps li, .contact > *');
  if (!reduce && 'IntersectionObserver' in window) {
    Array.prototype.forEach.call(targets, function (el) { el.classList.add('rv'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.02 });
    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });
    /* safety net: nothing may ever stay invisible */
    setTimeout(function () {
      Array.prototype.forEach.call(targets, function (el) { el.classList.add('in'); });
    }, 4000);
  }

  /* lightbox */
  var lb = document.getElementById('lb'),
      lbImg = document.getElementById('lbImg'),
      lbCount = document.getElementById('lbCount'),
      lbClose = document.getElementById('lbClose'),
      lbPrev = document.getElementById('lbPrev'),
      lbNext = document.getElementById('lbNext'),
      imgs = [].slice.call(document.querySelectorAll('.fig img, .pages img')),
      idx = -1,
      lastFocus = null;

  function show(i) {
    if (!imgs.length) return;
    idx = (i + imgs.length) % imgs.length;
    var src = imgs[idx];
    lbImg.src = src.currentSrc || src.src;
    lbImg.alt = src.alt || '';
    if (lbCount) lbCount.textContent = (idx + 1) + ' / ' + imgs.length;
  }
  function open(i) {
    lastFocus = document.activeElement;
    lb.hidden = false;
    show(i);
    void lb.offsetWidth; /* force reflow so the fade runs without relying on rAF */
    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }
  function close() {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function () { lb.hidden = true; lbImg.src = ''; }, 220);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  imgs.forEach(function (im, i) {
    im.setAttribute('tabindex', '0');
    im.setAttribute('role', 'button');
    im.setAttribute('aria-label', 'Open full size: ' + (im.alt || 'artwork'));
    im.addEventListener('click', function () { open(i); });
    im.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
    });
  });
  lbClose.addEventListener('click', close);
  lbPrev.addEventListener('click', function () { show(idx - 1); });
  lbNext.addEventListener('click', function () { show(idx + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowLeft') { show(idx - 1); return; }
    if (e.key === 'ArrowRight') { show(idx + 1); return; }
    if (e.key === 'Tab') {
      /* keep focus inside the dialog */
      var order = [lbClose, lbPrev, lbNext], at = order.indexOf(document.activeElement);
      e.preventDefault();
      order[(at + (e.shiftKey ? -1 : 1) + order.length) % order.length].focus();
    }
  });

  /* touch: swipe left / right inside the lightbox */
  var tx = null;
  lb.addEventListener('touchstart', function (e) { tx = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 40) show(dx < 0 ? idx + 1 : idx - 1);
  }, { passive: true });

  /* smooth anchors */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var t = document.querySelector(a.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  });
})();
