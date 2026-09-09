/* LEMMA site.js — IO reveal + hero parallax
 * 文档：design-guide/Lemma-Website-Style-Guide.html  第 08 章
 */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 章节级联揭示 ───────────────────────────────────────────────── */
  var sections = document.querySelectorAll('.sr');
  if (!('IntersectionObserver' in window)) {
    sections.forEach(function (s) { s.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ── Hero 视差退场 ──────────────────────────────────────────────── */
  var heroWrap = document.querySelector('.hero .wrap');
  if (heroWrap && !reduced) {
    var ticking = false;
    var update = function () {
      var p = Math.min(1, window.scrollY / (window.innerHeight * 0.9));
      heroWrap.style.transform = 'translateY(' + (p * 46).toFixed(1) + 'px) scale(' + (1 - p * 0.045).toFixed(4) + ')';
      heroWrap.style.opacity = (1 - p * 0.75).toFixed(3);
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
  }

  /* ── 视频降级：播不起来就退到 poster（页面无视频时是空操作）── */
  var swapToPoster = function (v) {
    if (!v || !v.isConnected) return;
    var img = document.createElement('img');
    img.className = v.className;
    img.src = v.poster;
    img.setAttribute('aria-hidden', 'true');
    img.setAttribute('alt', '');
    v.parentNode.insertBefore(img, v);
    v.remove();
  };
  if (reduced) document.querySelectorAll('video').forEach(swapToPoster);

  /* ── 平滑滚动时自动高亮当前 nav 锚点 ───────────────────────────── */
  var navLinks = document.querySelectorAll('.nav__links a[href^="#"]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    var anchorMap = {};
    navLinks.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var t = document.getElementById(id);
      if (t) anchorMap[id] = a;
    });
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        Object.keys(anchorMap).forEach(function (id) {
          anchorMap[id].classList.toggle('is-active', id === e.target.id);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(anchorMap).forEach(function (id) {
      var t = document.getElementById(id);
      if (t) navIO.observe(t);
    });
  }
})();