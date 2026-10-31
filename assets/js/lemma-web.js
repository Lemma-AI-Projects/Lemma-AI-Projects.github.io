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
  if (reduced) document.querySelectorAll('video:not(.film__video)').forEach(swapToPoster);

  /* ── 短片 Film：进视口才加载，静音循环，可开声 ───────────────────── */
  var filmFrame = document.querySelector('[data-film]');
  if (filmFrame) {
    var filmVideo = filmFrame.querySelector('video');
    var soundBtn = filmFrame.querySelector('[data-film-sound]');
    var playBtn = filmFrame.querySelector('[data-film-play]');
    var soundLabel = filmFrame.querySelector('[data-film-label]');
    var filmSrc = filmVideo && filmVideo.getAttribute('data-src');
    var filmLoaded = false;
    var failed = false;

    var setLabel = function (muted) {
      if (!soundLabel || !soundBtn) return;
      var t = soundBtn.getAttribute(muted ? 'data-label-off' : 'data-label-on');
      if (t) soundLabel.textContent = t;
    };
    var loadFilm = function () {
      if (filmLoaded || failed || !filmVideo || !filmSrc) return;
      filmLoaded = true;
      filmVideo.src = filmSrc;
    };
    var playFilm = function () {
      if (!filmVideo || failed) return;
      loadFilm();
      var p = filmVideo.play();
      if (p && p.catch) p.catch(function () {});
    };
    var setSound = function (on) {
      if (!filmVideo || failed) return;
      filmVideo.muted = !on;
      filmFrame.classList.toggle('is-sound', on);
      if (soundBtn) soundBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      setLabel(!on);
    };
    var failToPoster = function () {
      failed = true;
      filmFrame.classList.add('is-failed');
      var img = document.createElement('img');
      img.className = 'film__video';
      img.src = filmVideo.getAttribute('poster') || '';
      img.alt = filmVideo.getAttribute('aria-label') || '';
      filmVideo.parentNode.insertBefore(img, filmVideo);
      filmVideo.remove();
      filmVideo = null;
    };

    if (filmVideo) filmVideo.addEventListener('error', failToPoster);

    if (reduced) {
      /* 减弱动效：只留封面，点一下才播（这是用户手势，可以直接开声） */
      filmFrame.classList.add('is-static');
      if (playBtn) playBtn.addEventListener('click', function () {
        filmFrame.classList.remove('is-static');
        setSound(true);
        playFilm();
      });
    } else if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) playFilm();
          else if (filmLoaded && filmVideo) filmVideo.pause();
        });
      }, { threshold: 0.25 }).observe(filmFrame);
    } else {
      playFilm();
    }

    if (soundBtn) soundBtn.addEventListener('click', function () {
      if (!filmVideo) return;
      setSound(!!filmVideo.muted);
      if (filmVideo.paused) playFilm();
    });
  }

  /* ── 关键短语 marker 下划线扫过（IO 触发）──────────────────────── */
  var marks = document.querySelectorAll('.mark');
  if (marks.length && 'IntersectionObserver' in window) {
    var markIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); markIO.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    marks.forEach(function (m) { markIO.observe(m); });
  } else { marks.forEach(function (m) { m.classList.add('in'); }); }

  /* ── Hero 大水印鼠标视差 ──────────────────────────────────────────── */
  var heroMark = document.querySelector('.hero__mark');
  if (heroMark && !reduced && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    var raf = false;
    var tx = 0, ty = 0;
    var apply = function () {
      heroMark.style.transform = 'translate(calc(-50% + ' + tx.toFixed(1) + 'px), calc(-58% + ' + ty.toFixed(1) + 'px))';
      raf = false;
    };
    window.addEventListener('mousemove', function (e) {
      var cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      tx = Math.max(-18, Math.min(18, (e.clientX - cx) / cx * 16));
      ty = Math.max(-12, Math.min(12, (e.clientY - cy) / cy * 10));
      if (!raf) { raf = true; requestAnimationFrame(apply); }
    }, { passive: true });
  }

  /* ── Magnetic hover on CTA ──────────────────────────────────────── */
  if (!reduced && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.querySelectorAll('.magnetic').forEach(function (el) {
      var inner = el.querySelector('.glassbtn, .pill');
      if (!inner) return;
      var rAF = false;
      var move = function (e) {
        var b = el.getBoundingClientRect();
        var dx = e.clientX - (b.left + b.width / 2);
        var dy = e.clientY - (b.top + b.height / 2);
        var tx = Math.max(-10, Math.min(10, dx * 0.22));
        var ty = Math.max(-10, Math.min(10, dy * 0.32));
        if (!rAF) { rAF = true; requestAnimationFrame(function () {
          inner.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px)';
          rAF = false;
        }); }
      };
      var leave = function () {
        inner.style.transform = '';
      };
      el.addEventListener('mousemove', move);
      el.addEventListener('mouseleave', leave);
    });
  }

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