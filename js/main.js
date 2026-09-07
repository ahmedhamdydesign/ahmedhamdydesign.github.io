/* Ahmed Hamdy portfolio */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* year */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* hero marquee: duplicated so the loop is seamless */
  var strip = [
    'char-alien', 'cover-merrick', 'scene-fish', 'drifter-p08', 'char-lemonade',
    'cover-frankie', 'scene-underwater', 'cover-dave', 'char-period', 'scene-cave',
    'cover-mouseville', 'spread-bakery', 'cover-hobby', 'scene-city'
  ];
  var track = document.getElementById('mtrack');
  if (track) {
    var html = strip.map(function (s) {
      return '<img src="assets/work/' + s + '.jpg" alt="" loading="lazy" decoding="async">';
    }).join('');
    track.innerHTML = html + html;
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
      imgs = [].slice.call(document.querySelectorAll('.fig img, .pages img')),
      idx = -1,
      lastFocus = null;

  function show(i) {
    if (!imgs.length) return;
    idx = (i + imgs.length) % imgs.length;
    var src = imgs[idx];
    lbImg.src = src.currentSrc || src.src;
    lbImg.alt = src.alt || '';
  }
  function open(i) {
    lastFocus = document.activeElement;
    lb.hidden = false;
    show(i);
    void lb.offsetWidth; /* force reflow so the fade runs without relying on rAF */
    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    document.getElementById('lbClose').focus();
  }
  function close() {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function () { lb.hidden = true; lbImg.src = ''; }, 220);
    if (lastFocus) lastFocus.focus();
  }

  imgs.forEach(function (im, i) {
    im.addEventListener('click', function () { open(i); });
  });
  document.getElementById('lbClose').addEventListener('click', close);
  document.getElementById('lbPrev').addEventListener('click', function () { show(idx - 1); });
  document.getElementById('lbNext').addEventListener('click', function () { show(idx + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'ArrowRight') show(idx + 1);
  });

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
