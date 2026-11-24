'use strict';

/* ============ EDIT YOUR LINKS HERE ============
   Leave a value empty ("") to keep that button hidden.
   cv:     file name of your CV PDF uploaded next to index.html, e.g. "Martin-Assaad-CV.pdf"
   github: your profile URL, e.g. "https://github.com/your-name"
   projects: one entry per project, in the same order as the page.
     demo = live website URL, repo = GitHub repo URL                    */
var SITE = {
  cv: "",
  github: "",
  projects: [
    { demo: "", repo: "" },   // Class Mate
    { demo: "", repo: "" },   // Personal data platform
    { demo: "", repo: "" },   // IT support ticketing site
    { demo: "", repo: "" }    // Telegram bot
  ]
};

var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

/* ---------- Theme switch ---------- */
(function () {
  var root = document.documentElement;
  var btn = document.getElementById('themeBtn');
  var meta = document.querySelector('meta[name="theme-color"]');
  function paint(t) {
    root.setAttribute('data-theme', t);
    btn.setAttribute('aria-checked', t === 'dark' ? 'true' : 'false');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#22262e' : '#f3f7f8');
  }
  paint(root.getAttribute('data-theme') || 'light');
  btn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    paint(next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });
})();

/* ---------- Helpers ---------- */
function whenVisible(el, fn, threshold) {
  if (!el) return;
  if (!('IntersectionObserver' in window)) { fn(); return; }
  var io = new IntersectionObserver(function (entries, o) {
    if (entries[0].isIntersecting) { o.disconnect(); fn(); }
  }, { threshold: threshold || 0.3 });
  io.observe(el);
}

function splitLetters(container) {
  var letters = [], idx = 0;
  container.querySelectorAll('.line').forEach(function (line) {
    var text = line.textContent;
    line.textContent = '';
    for (var i = 0; i < text.length; i++) {
      var s = document.createElement('span');
      s.className = 'l';
      s.textContent = text[i] === ' ' ? ' ' : text[i];
      s.style.setProperty('--i', idx++);
      line.appendChild(s);
      letters.push(s);
    }
  });
  container.classList.add('split');
  return letters;
}

/* ---------- Hero name: letters rise, then swell toward the cursor ---------- */
(function () {
  var h1 = document.getElementById('name');
  if (!h1) return;
  var hero = document.getElementById('hero');
  var letters = splitLetters(h1);
  var N = letters.length;
  var BASE = 620, PEAK = 800;
  var cur = [], tgt = [];
  for (var i = 0; i < N; i++) { cur.push(BASE); tgt.push(BASE); }

  function measure() {
    letters.forEach(function (l) { l.style.width = ''; l.style.fontWeight = PEAK; });
    var ws = letters.map(function (l) { return l.getBoundingClientRect().width; });
    letters.forEach(function (l, k) { l.style.width = ws[k] + 'px'; l.style.fontWeight = Math.round(cur[k]); });
  }

  if (reduce) {
    measure();
    letters.forEach(function (l) { l.style.fontWeight = 700; });
    h1.classList.add('go');
    return;
  }

  var raf = 0, waving = false, pointerOn = false;
  function frame() {
    raf = 0;
    var moving = false;
    for (var k = 0; k < N; k++) {
      var d = tgt[k] - cur[k];
      if (Math.abs(d) > 0.4) { cur[k] += d * 0.16; moving = true; }
      else cur[k] = tgt[k];
      letters[k].style.fontWeight = Math.round(cur[k]);
    }
    if (moving || waving) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }

  function wave(done) {
    if (waving) return;
    waving = true;
    var t0 = performance.now(), dur = 1900;
    (function step(now) {
      var p = clamp((now - t0) / dur, 0, 1);
      var pos = -2 + p * (N + 4);
      for (var k = 0; k < N; k++) {
        var g = Math.exp(-Math.pow(k - pos, 2) / (2 * 1.7 * 1.7));
        tgt[k] = BASE + (PEAK - BASE) * g;
      }
      kick();
      if (p < 1) requestAnimationFrame(step);
      else {
        waving = false;
        for (var j = 0; j < N; j++) tgt[j] = BASE;
        kick();
        if (done) done();
      }
    })(t0);
  }

  function onMove(e) {
    if (waving) return;
    pointerOn = true;
    for (var k = 0; k < N; k++) {
      var r = letters[k].getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      var g = Math.exp(-(dx * dx + dy * dy) / (2 * 150 * 150));
      tgt[k] = BASE + (PEAK - BASE) * g;
    }
    kick();
  }
  function onLeave() {
    pointerOn = false;
    if (waving) return;
    for (var k = 0; k < N; k++) tgt[k] = BASE;
    kick();
  }

  function start() {
    measure();
    var t = 0, rs;
    window.addEventListener('resize', function () { clearTimeout(rs); rs = setTimeout(measure, 150); });
    letters.forEach(function (l) { l.style.fontWeight = BASE; });
    requestAnimationFrame(function () { h1.classList.add('go'); });
    document.dispatchEvent(new CustomEvent('name-start'));
    setTimeout(function () { wave(); }, 1100 + N * 55);
    if (finePointer) {
      hero.addEventListener('pointermove', onMove);
      hero.addEventListener('pointerleave', onLeave);
    }
    h1.addEventListener('click', function () { wave(); });
  }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start);
})();

/* ---------- Role line: letters decode into place ---------- */
(function () {
  var role = document.getElementById('role');
  if (!role || reduce) return;
  var ghost = role.querySelector('.ghost'), live = role.querySelector('.live');
  var text = ghost.textContent, N = text.length;
  var pool = 'abcdefghijklmnopqrstuvwxyz';
  role.classList.add('scr');
  live.textContent = '';
  function run() {
    var t0 = performance.now(), dur = 1500;
    var rev = [];
    for (var i = 0; i < N; i++) rev.push((i / N) * dur * 0.72 + Math.random() * dur * 0.26);
    (function step(now) {
      var t = now - t0, out = '';
      for (var k = 0; k < N; k++) {
        var c = text[k];
        out += (c === ' ' || c === ',' || c === '.' || t >= rev[k]) ? c : pool[Math.floor(Math.random() * pool.length)];
      }
      live.textContent = out;
      if (t < dur) requestAnimationFrame(step);
      else live.textContent = text;
    })(t0);
  }
  var started = false;
  function go() { if (started) return; started = true; setTimeout(run, 500); }
  document.addEventListener('name-start', go);
  setTimeout(go, 3000);
  role.addEventListener('mouseenter', function () { if (started) run(); });
})();

/* ---------- Footer name ---------- */
(function () {
  var big = document.getElementById('bigName');
  if (!big) return;
  splitLetters(big);
  if (reduce) { big.classList.add('go'); return; }
  whenVisible(big, function () { big.classList.add('go'); }, 0.25);
})();

/* ---------- Headings: words rise out of a mask ---------- */
(function () {
  document.querySelectorAll('[data-split]').forEach(function (el) {
    var text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    text.split(/\s+/).forEach(function (word, i) {
      var o = document.createElement('span');
      o.className = 'w';
      o.setAttribute('aria-hidden', 'true');
      var inn = document.createElement('span');
      inn.className = 'wi';
      inn.style.setProperty('--i', i);
      inn.textContent = word;
      o.appendChild(inn);
      el.appendChild(o);
      el.appendChild(document.createTextNode(' '));
    });
    if (reduce || !('IntersectionObserver' in window)) { el.classList.add('in'); return; }
    var io = new IntersectionObserver(function (entries, ob) {
      if (entries[0].isIntersecting) { el.classList.add('in'); ob.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(el);
  });

  var rows = document.querySelectorAll('.xrow, .prow');
  if (!('IntersectionObserver' in window)) { rows.forEach(function (r) { r.classList.add('in'); }); return; }
  var io2 = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io2.unobserve(e.target); } });
  }, { threshold: 0.2 });
  rows.forEach(function (r) { io2.observe(r); });
})();

/* ---------- About: words light up as you scroll ---------- */
var aboutWords = [];
(function () {
  var el = document.getElementById('aboutLead');
  if (!el) return;
  var text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.textContent = '';
  text.split(/\s+/).forEach(function (w) {
    var s = document.createElement('span');
    s.className = 'lw';
    s.setAttribute('aria-hidden', 'true');
    s.textContent = w;
    el.appendChild(s);
    el.appendChild(document.createTextNode(' '));
    aboutWords.push(s);
  });
  if (reduce) aboutWords.forEach(function (s) { s.classList.add('on'); });
})();

/* ---------- Syntax colors and typing for the learning panels ---------- */
var KW = {
  cs: 'public|class|string|void|new|var|static|using',
  sql: 'CREATE|TABLE|INT|PRIMARY|KEY|AUTO_INCREMENT|VARCHAR|NOT|NULL|INSERT|INTO|VALUES|SELECT|FROM|WHERE|ORDER|BY'
};
function tokenize(line, lang) {
  if (/^\s*(\/\/|--)/.test(line)) return [['c', line]];
  var re = new RegExp('("[^"]*"|\'[^\']*\')|\\b(' + KW[lang] + ')\\b|([A-Za-z_]\\w*)(?=\\()|([A-Za-z_]\\w*)(?=:)|(\\b\\d+\\b)', lang === 'sql' ? 'gi' : 'g');
  var out = [], last = 0, m;
  while ((m = re.exec(line))) {
    if (m.index > last) out.push(['n', line.slice(last, m.index)]);
    out.push([m[1] ? 's' : m[2] ? 'k' : m[3] ? 'f' : m[4] ? 'p' : 'f', m[0]]);
    last = re.lastIndex;
  }
  if (last < line.length) out.push(['n', line.slice(last)]);
  return out;
}
async function typeLines(el, lines, o) {
  o = o || {};
  var speed = o.speed || 16, lineDelay = o.lineDelay || 110, rowClass = o.rowClass || 'ln', lang = o.lang || 'cs';
  var caret = document.createElement('span');
  caret.className = 'caret';
  el.textContent = '';
  for (var i = 0; i < lines.length; i++) {
    var tokens = typeof lines[i] === 'string' ? tokenize(lines[i], lang) : lines[i];
    var row = document.createElement('div');
    row.className = rowClass;
    el.appendChild(row);
    row.appendChild(caret);
    for (var j = 0; j < tokens.length; j++) {
      var s = document.createElement('span');
      if (tokens[j][0]) s.className = tokens[j][0];
      row.insertBefore(s, caret);
      var text = tokens[j][1];
      if (reduce) { s.textContent = text; continue; }
      for (var k = 0; k < text.length; k++) {
        s.textContent += text[k];
        await sleep(speed + Math.random() * speed * 0.8);
      }
    }
    if (!reduce) await sleep(lineDelay);
  }
  return caret;
}
function panel(id, code, term, lang) {
  var box = document.getElementById(id);
  whenVisible(box, async function () {
    var c = box.querySelector('.code'), t = box.querySelector('.term');
    var caret = await typeLines(c, code, { lang: lang, speed: 14 });
    if (caret) caret.remove();
    await typeLines(t, term, { rowClass: 'tl', speed: 22 });
  });
}
panel('netPanel', [
  'var builder = WebApplication.CreateBuilder(args);',
  'var app = builder.Build();',
  '',
  'app.MapGet("/", () => "Hello from my first API");',
  '',
  'app.Run();'
], [
  [['f', '$ '], ['n', 'dotnet run']],
  [['s', '✓ '], ['n', 'listening on http://localhost:5000']]
], 'cs');
panel('sqlPanel', [
  'SELECT name, status',
  'FROM skills',
  "WHERE status = 'learning'",
  'ORDER BY name;'
], [
  [['f', 'mysql> '], ['n', 'run query']],
  [['c', 'name   status']],
  [['n', '.NET   learning']],
  [['n', 'MySQL  learning']]
], 'sql');

/* ---------- Copy buttons ---------- */
(function () {
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var t = document.createElement('textarea');
      t.value = text; t.setAttribute('readonly', '');
      t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy') ? resolve() : reject(); } catch (e) { reject(e); }
      document.body.removeChild(t);
    });
  }
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    var label = b.textContent;
    b.addEventListener('click', function () {
      copyText(b.getAttribute('data-copy')).then(function () { b.textContent = 'Copied'; }, function () { b.textContent = 'Select and copy'; });
      setTimeout(function () { b.textContent = label; }, 2000);
    });
  });
})();

/* ---------- Links from the SITE config ---------- */
(function () {
  if (SITE.cv) {
    var cv = document.getElementById('cvBtn');
    cv.href = SITE.cv; cv.hidden = false;
  }
  if (SITE.github) {
    var gh = document.getElementById('ghOpen');
    gh.href = SITE.github; gh.hidden = false;
    document.getElementById('moreGh').hidden = false;
    document.getElementById('moreGhLink').href = SITE.github;
  }
  document.querySelectorAll('.project').forEach(function (card, i) {
    var p = SITE.projects[i] || {}, box = card.querySelector('.plinks');
    function add(label, href, primary) {
      var a = document.createElement('a');
      a.className = 'mini' + (primary ? ' primary' : '');
      a.href = href; a.textContent = label;
      a.target = '_blank'; a.rel = 'noopener noreferrer';
      box.appendChild(a);
    }
    if (p.demo) add('Live demo', p.demo, true);
    if (p.repo) add('Source code', p.repo, false);
  });
})();

/* ---------- Scroll: progress bar, header shadow, About words, hero glow ---------- */
(function () {
  var bar = document.getElementById('progress');
  var header = document.querySelector('.site-header');
  var lead = document.getElementById('aboutLead');
  var hero = document.getElementById('hero');
  var ticking = false;
  function update() {
    ticking = false;
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, h.scrollTop / max) : 0) + ')';
    header.classList.toggle('scrolled', h.scrollTop > 8);
    if (lead && !reduce && aboutWords.length) {
      var r = lead.getBoundingClientRect(), vh = window.innerHeight;
      var p = clamp((vh * 0.88 - r.top) / (r.height + vh * 0.28), 0, 1);
      var n = Math.round(p * aboutWords.length);
      for (var i = 0; i < aboutWords.length; i++) aboutWords[i].classList.toggle('on', i < n);
    }
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();

  if (hero && !reduce && finePointer) {
    hero.addEventListener('mousemove', function (e) {
      var b = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', (e.clientX - b.left) + 'px');
      hero.style.setProperty('--my', (e.clientY - b.top) + 'px');
    });
  }
})();

/* ---------- Active nav link ---------- */
(function () {
  var links = {};
  document.querySelectorAll('.nav-links a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      Object.keys(links).forEach(function (k) { links[k].removeAttribute('aria-current'); });
      var a = links[e.target.id];
      if (a) a.setAttribute('aria-current', 'true');
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
})();

document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- 3D scene (loaded lazily, with a CSS fallback) ---------- */
(function () {
  var stage = document.getElementById('stage');
  if (!stage) return;
  function webglOK() {
    try { var c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
  }
  var saveData = navigator.connection && navigator.connection.saveData;
  if (saveData || !webglOK()) return;
  function boot() {
    var s = document.createElement('script');
    s.src = 'scene.js'; s.async = true;
    s.onload = function () {
      if (!window.MartinScene) return;
      var hint = document.getElementById('stageHint');
      var wc = document.getElementById('world');
      if (wc && window.MartinScene.world) window.MartinScene.world({ canvas: wc, reduce: reduce });
      window.MartinScene.init({
        canvas: document.getElementById('scene'),
        stage: stage,
        labels: [].slice.call(document.querySelectorAll('#layerLabels li')),
        reduce: reduce,
        onReady: function () {
          if (hint && !reduce) { hint.textContent = finePointer ? 'Move over the stack, click a layer to jump to it' : 'Drag to turn it, tap a layer to jump to it'; hint.hidden = false; }
        },
        onLost: function () { if (hint) hint.hidden = true; }
      });
    };
    document.head.appendChild(s);
  }
  function schedule() {
    if ('requestIdleCallback' in window) requestIdleCallback(boot, { timeout: 2500 });
    else setTimeout(boot, 1200);
  }
  if (document.readyState === 'complete') schedule(); else window.addEventListener('load', schedule);
})();

/* ---------- CSS 3D tilt (portrait and cards) ---------- */
(function () {
  if (reduce || !finePointer) return;
  document.querySelectorAll('.tilt').forEach(function (el) {
    var amt = parseFloat(el.getAttribute('data-tilt')) || 6;
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.classList.add('moving');
      el.style.setProperty('--rx', (-y * amt * 2).toFixed(2) + 'deg');
      el.style.setProperty('--ry', (x * amt * 2).toFixed(2) + 'deg');
      el.style.setProperty('--gx', (x * 100 + 50).toFixed(1) + '%');
      el.style.setProperty('--gy', (y * 100 + 50).toFixed(1) + '%');
    });
    el.addEventListener('pointerleave', function () {
      el.classList.remove('moving');
      el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
    });
  });
})();


/* ---------- 3D depth engine: every block sits in space and turns with scroll ---------- */
(function () {
  var root = document.documentElement;
  var sel = '.hero .role,.hero .lead,.hero .learning-line,.hero .cta,.about-lead,.about-more,.xrow,.prow,.skill,.card,.portrait-card,.contact-copy,.mail,.phone-line,.c-actions,.more-gh,.marquee';
  var els = [].slice.call(document.querySelectorAll(sel));
  els.forEach(function (e) { e.classList.add('d3'); e._sx = 0; e._sy = 0; e._tz = 0; });
  if (reduce || true) { /* v6: text stays still for easy reading */ }
  if (true) {}
  var vis = new Set();
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) vis.add(e.target); else { vis.delete(e.target); e.target.style.setProperty('--sx', '0deg'); e.target.style.setProperty('--tz', '0px'); } });
      kick();
    }, { rootMargin: '10% 0px 10% 0px' });
    els.forEach(function (e) { io.observe(e); });
  } else els.forEach(function (e) { vis.add(e); });
  var raf = 0, small = window.innerWidth < 760;
  function kick() { if (!raf) raf = requestAnimationFrame(tick); }
  function tick() {
    raf = 0; var vh = window.innerHeight, busy = false;
    vis.forEach(function (e) {
      var r = e.getBoundingClientRect();
      var t = Math.max(-1, Math.min(1, ((r.top + r.height / 2) - vh / 2) / (vh / 2)));
      var sx = 0, tz = 0;
      var dx = sx - e._sx, dz = tz - e._tz;
      if (Math.abs(dx) > 0.02 || Math.abs(dz) > 0.2) { e._sx += dx * 0.22; e._tz += dz * 0.22; busy = true; }
      else { e._sx = sx; e._tz = tz; }
      e.style.setProperty('--sx', e._sx.toFixed(2) + 'deg');
      e.style.setProperty('--tz', e._tz.toFixed(1) + 'px');
    });
    if (busy) raf = requestAnimationFrame(tick);
  }
  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', function () { small = window.innerWidth < 760; kick(); });
  kick();

  /* extruded text follows the cursor (name, section titles, big heading) */
  if (!finePointer) return;
  var ext = [].slice.call(document.querySelectorAll('.name,.sec-title,.big-h')), pend = 0, mx = 0, my = 0;
  window.addEventListener('pointermove', function (e) {
    mx = e.clientX / window.innerWidth * 2 - 1; my = e.clientY / window.innerHeight * 2 - 1;
    if (!pend) pend = requestAnimationFrame(function () {
      pend = 0;
      root.style.setProperty('--ex', (-mx * 0.026).toFixed(4) + 'em');
      root.style.setProperty('--ey', (0.012 + my * 0.02 + 0.014).toFixed(4) + 'em');
      root.style.setProperty('--nry', (mx * 2.5).toFixed(2) + 'deg');
      root.style.setProperty('--nrx', (-my * 1.5).toFixed(2) + 'deg');
    });
  }, { passive: true });
})();
