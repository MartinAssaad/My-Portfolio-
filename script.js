'use strict';

/* ============ EDIT YOUR LINKS HERE ============
   Leave a value empty ("") to keep that button hidden.
   cv:     file name of your CV PDF uploaded next to index.html, e.g. "Martin-Assaad-CV.pdf"
   github: your profile URL, e.g. "https://github.com/your-name"
   projects: one entry per project, in the same order as the page.
     demo = live website URL, repo = GitHub repo URL                    */
var SITE = {
  cv: "",
  github: "https://github.com/MartinAssaad",
  githubUser: "MartinAssaad",
  formEndpoint: "",   // optional: a Formspree URL so the contact form sends without opening an email app
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
    var rv = document.getElementById('resView'), rd = document.getElementById('resDl'), rn = document.getElementById('resNote');
    if (rv) { rv.href = SITE.cv; rv.hidden = false; }
    if (rd) { rd.href = SITE.cv; rd.hidden = false; }
    if (rn) rn.hidden = true;
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

/* ---------- shared loader for scene.js (hero stack + Explore 3D lab) ---------- */
(function () {
  var state = 0, waiting = [];
  window.loadScene = function (cb) {
    if (window.MartinScene) return cb();
    waiting.push(cb);
    if (state) return; state = 1;
    var s = document.createElement('script'); s.src = 'scene.js'; s.async = true;
    s.onload = function () { waiting.splice(0).forEach(function (f) { f(); }); };
    s.onerror = function () { state = 0; waiting.length = 0; };
    document.head.appendChild(s);
  };
})();

/* ---------- 3D scene (loaded lazily, with a CSS fallback) ---------- */
(function () {
  var stage = document.getElementById('stage');
  if (!stage) return;
  function webglOK() {
    try { var c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
  }
  var saveData = navigator.connection && navigator.connection.saveData;
  window.__webglOK = webglOK();
  if (saveData || !window.__webglOK) return;
  function boot() {
    window.loadScene(function () {
      if (!window.MartinScene) return;
      var hint = document.getElementById('stageHint');
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
    });
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


/* =====================================================================
   v7 features
   ===================================================================== */
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

/* ---------- boot screen (skipped on repeat visits and reduced motion) ---------- */
(function () {
  var boot = $('#boot'); if (!boot) return;
  var seen = false; try { seen = sessionStorage.getItem('booted') === '1'; } catch (e) {}
  function done() { boot.classList.add('done'); setTimeout(function () { boot.remove(); }, 700); try { sessionStorage.setItem('booted', '1'); } catch (e) {} }
  if (seen || reduce) { boot.remove(); return; }
  var lines = ['INITIALIZING SYSTEM...', 'Loading 3D environment...', 'Loading projects...', 'READY.'];
  var t = $('#bootT'), bar = $('#bootBar'), i = 0;
  (function next() {
    if (i >= lines.length) return setTimeout(done, 260);
    t.textContent = lines[i]; bar.style.width = ((i + 1) / lines.length * 100) + '%'; i++;
    setTimeout(next, 280);
  })();
  setTimeout(done, 2600);
})();

/* ---------- custom cursor (subtle ring, fine pointers only) ---------- */
(function () {
  if (!finePointer || reduce) return;
  var c = document.createElement('div'); c.className = 'cur'; c.setAttribute('aria-hidden', 'true'); document.body.appendChild(c);
  var x = -50, y = -50, tx = -50, ty = -50, raf = 0;
  function loop() { x += (tx - x) * 0.25; y += (ty - y) * 0.25; c.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%)'; raf = (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3) ? requestAnimationFrame(loop) : 0; }
  window.addEventListener('pointermove', function (e) {
    tx = e.clientX; ty = e.clientY; c.classList.add('on');
    c.classList.toggle('hot', !!e.target.closest && !!e.target.closest('a,button,input,textarea,.node,.case-open'));
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
  document.addEventListener('pointerleave', function () { c.classList.remove('on'); });
})();

/* ---------- experience timeline progress ---------- */
(function () {
  var tl = $('#timeline'); if (!tl) return;
  function upd() {
    var r = tl.getBoundingClientRect(), vh = window.innerHeight;
    tl.style.setProperty('--tl', clamp((vh * 0.6 - r.top) / r.height, 0, 1).toFixed(3));
  }
  window.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd); upd();
})();

/* ---------- request pipeline tips ---------- */
(function () {
  var tip = $('#pipeTip'); if (!tip) return;
  var base = tip.textContent;
  $$('#pipe .node').forEach(function (n) {
    function on() { tip.textContent = n.getAttribute('data-tip'); n.classList.add('act'); }
    function off() { tip.textContent = base; n.classList.remove('act'); }
    n.addEventListener('mouseenter', on); n.addEventListener('focus', on);
    n.addEventListener('mouseleave', off); n.addEventListener('blur', off);
  });
})();

/* ---------- case studies ---------- */
var CASES = [
  { name: 'Class Mate', tag: 'Web', color: '#1fb6c1', desc: 'A web application built as an independent project.', stack: ['Web'], flow: ['User', 'Web app', 'Data'] },
  { name: 'Personal data platform', tag: 'Blockchain · Web', color: '#7aa2ff', desc: 'A blockchain-based platform concept exploring how people can keep control of their personal data.', stack: ['Blockchain', 'Web'], flow: ['User', 'Web app', 'Blockchain'] },
  { name: 'IT support ticketing site', tag: 'Web · Support tooling', color: '#e0b15a', desc: 'A website for logging and tracking IT support requests.', stack: ['Web'], flow: ['Staff', 'Ticket site', 'Tickets'] },
  { name: 'Telegram bot', tag: 'Bots', color: '#8fd694', desc: 'A bot built on the Telegram platform.', stack: ['Telegram Bot platform'], flow: ['User', 'Telegram', 'Bot'] }
];
var CASE_SECTIONS = [
  ['Overview', null],
  ['Problem', 'What problem did this solve, and for whom?'],
  ['Solution', 'How does it work, in two or three sentences?'],
  ['Architecture', null],
  ['Technology stack', null],
  ['Implementation', 'Key parts you built and how.'],
  ['Challenges', 'The hardest technical problems and how you solved them.'],
  ['Results', 'What happened: users, speed, what you learned. Only real numbers.'],
  ['Future improvements', 'What you would build next.'],
  ['GitHub and demo', null]
];
(function () {
  var box = $('#case'), body = $('#caseBody'), closeB = $('#caseClose'), count = $('#caseCount'), lastFocus = null, cur = -1;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ph(text) { return '<p class="ph-box"><b>Placeholder</b> ' + esc(text) + '</p>'; }
  function render(i) {
    var c = CASES[i], links = SITE.projects[i] || {};
    var flow = c.flow.map(function (n, k) { return (k ? '<span class="flow-l"><i></i></span>' : '') + '<span class="flow-n">' + esc(n) + '</span>'; }).join('');
    var html = '<header class="case-head"><p class="case-tag">' + esc(c.tag) + '</p><h1 id="caseTitle">' + esc(c.name) + '</h1><p class="case-lede">' + esc(c.desc) + '</p></header>';
    CASE_SECTIONS.forEach(function (s, k) {
      var n = (k + 1 < 10 ? '0' : '') + (k + 1), inner = '';
      if (k === 0) inner = '<p>' + esc(c.desc) + '</p>';
      else if (k === 3) inner = '<div class="flow" aria-label="Architecture sketch">' + flow + '</div>' + ph('Sketch only, replace with the real architecture.');
      else if (k === 4) inner = '<ul class="chips">' + c.stack.map(function (t) { return '<li class="chip">' + esc(t) + '</li>'; }).join('') + '</ul>' + ph('Add the exact languages, frameworks and tools.');
      else if (k === 9) {
        var l = [];
        if (links.demo) l.push('<a class="btn btn-primary" target="_blank" rel="noopener noreferrer" href="' + esc(links.demo) + '">Live demo</a>');
        if (links.repo) l.push('<a class="btn btn-ghost" target="_blank" rel="noopener noreferrer" href="' + esc(links.repo) + '">Source code</a>');
        inner = l.length ? '<div class="c-actions">' + l.join('') + '</div>' : ph('Add the live demo and repository links in SITE.projects in script.js.');
        inner += '<p class="shots">' + 'Screenshots: ' + '<em class="ph">placeholder</em></p>';
      } else inner = ph(s[1]);
      html += '<section class="case-sec"><p class="case-n">' + n + '</p><div><h2>' + s[0] + '</h2>' + inner + '</div></section>';
    });
    html += '<nav class="case-nav" aria-label="Other projects">' + CASES.map(function (o, k) { return k === i ? '' : '<a href="#/project/' + k + '">' + esc(o.name) + '</a>'; }).join('') + '</nav>';
    body.innerHTML = html; box.style.setProperty('--pa', c.color); box.scrollTop = 0; count.textContent = 'Project ' + (i + 1) + ' of ' + CASES.length;
  }
  function open(i) {
    if (!CASES[i]) return;
    if (box.hidden) lastFocus = document.activeElement;
    cur = i; render(i); box.hidden = false; document.documentElement.classList.add('lock'); closeB.focus({ preventScroll: true });
  }
  function close() {
    if (box.hidden) return; box.hidden = true; document.documentElement.classList.remove('lock'); cur = -1;
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function route() {
    var m = /^#\/project\/(\d+)$/.exec(location.hash);
    if (m) open(+m[1]); else close();
  }
  window.openCase = function (i) { location.hash = '#/project/' + i; };
  $$('.case-open').forEach(function (b) { b.addEventListener('click', function () { location.hash = '#/project/' + b.getAttribute('data-case'); }); });
  $$('.project h3').forEach(function (h, i) { h.style.cursor = 'pointer'; h.addEventListener('click', function () { location.hash = '#/project/' + i; }); });
  closeB.addEventListener('click', function () { history.replaceState(null, '', location.pathname + '#projects'); close(); var p = $('#projects'); if (p) p.scrollIntoView(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !box.hidden) closeB.click(); });
  window.addEventListener('hashchange', route); route();
})();

/* ---------- GitHub dashboard (live from the public API) ---------- */
(function () {
  var user = SITE.githubUser; if (!user || !$('#ghRepos')) return;
  var meta = $('#ghMeta'), note = $('#ghNote'), langsBox = $('#ghLangs'), list = $('#ghRepos'), img = $('#ghGraph');
  img.addEventListener('error', function () { img.parentNode.hidden = true; });
  function fail() { meta.textContent = 'Live data unavailable right now.'; note.textContent = 'Open the profile to see everything.'; }
  if (!window.fetch) return fail();
  Promise.all([
    fetch('https://api.github.com/users/' + user).then(function (r) { if (!r.ok) throw 0; return r.json(); }),
    fetch('https://api.github.com/users/' + user + '/repos?per_page=100&sort=updated').then(function (r) { if (!r.ok) throw 0; return r.json(); })
  ]).then(function (a) {
    var u = a[0], repos = a[1].filter(function (r) { return !r.fork; });
    meta.textContent = u.public_repos + ' public repositories · ' + u.followers + ' followers · member since ' + new Date(u.created_at).getFullYear();
    var counts = {}, total = 0;
    repos.forEach(function (r) { if (r.language) { counts[r.language] = (counts[r.language] || 0) + 1; total++; } });
    var names = Object.keys(counts).sort(function (x, y) { return counts[y] - counts[x]; });
    langsBox.innerHTML = names.length ? '<div class="lbar">' + names.map(function (n, i) { return '<i style="flex:' + counts[n] + '" class="l' + (i % 5) + '"></i>'; }).join('') + '</div><ul>' + names.map(function (n, i) { return '<li><i class="l' + (i % 5) + '"></i>' + n + ' ' + Math.round(counts[n] / total * 100) + '%</li>'; }).join('') + '</ul>' : '';
    repos.slice(0, 4).forEach(function (r) {
      var li = document.createElement('li');
      var a = document.createElement('a'); a.href = r.html_url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      var b = document.createElement('b'); b.textContent = r.name; var p = document.createElement('span'); p.textContent = r.description || 'No description yet.';
      var m = document.createElement('small'); m.textContent = (r.language || 'n/a') + ' · ★ ' + r.stargazers_count + ' · updated ' + new Date(r.pushed_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      a.appendChild(b); a.appendChild(p); a.appendChild(m); li.appendChild(a); list.appendChild(li);
    });
    if (!repos.length) note.textContent = 'No public repositories to show yet.';
  }).catch(fail);
})();

/* ---------- contact form ---------- */
(function () {
  var f = $('#contactForm'); if (!f) return;
  var st = $('#cStatus'), btn = $('#cSend');
  function setErr(id, m) { $('#' + id).textContent = m || ''; }
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var n = f.name.value.trim(), em = f.email.value.trim(), m = f.message.value.trim(), ok = true;
    setErr('eName', n ? '' : 'Please enter your name.'); if (!n) ok = false;
    var good = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);
    setErr('eEmail', good ? '' : 'Please enter a valid email address.'); if (!good) ok = false;
    setErr('eMsg', m.length >= 10 ? '' : 'Please write at least a few words (10 characters).'); if (m.length < 10) ok = false;
    st.className = 'status-line';
    if (!ok) { st.textContent = 'ERROR: check the fields above.'; st.classList.add('bad'); return; }
    if (SITE.formEndpoint && window.fetch) {
      btn.disabled = true; st.textContent = 'Sending…';
      fetch(SITE.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ name: n, email: em, message: m }) })
        .then(function (r) { if (!r.ok) throw 0; st.textContent = 'SUCCESS: message sent. I’ll reply soon.'; st.classList.add('good'); f.reset(); })
        .catch(function () { st.textContent = 'ERROR: could not send. Email me directly at martinassaad21@gmail.com.'; st.classList.add('bad'); })
        .then(function () { btn.disabled = false; });
    } else {
      location.href = 'mailto:martinassaad21@gmail.com?subject=' + encodeURIComponent('Portfolio message from ' + n) + '&body=' + encodeURIComponent(m + '\n\n' + n + '\n' + em);
      st.textContent = 'SUCCESS: opening your email app with the message ready to send.'; st.classList.add('good');
    }
  });
})();

/* ---------- hidden terminal (press ` or type: sudo hire-me) ---------- */
(function () {
  var box = $('#cli'), out = $('#cliOut'), inp = $('#cliIn'), x = $('#cliX'), last = null, hist = [], hi = 0;
  function print(t, cls) { var p = document.createElement('p'); if (cls) p.className = cls; p.textContent = t; out.appendChild(p); out.scrollTop = out.scrollHeight; }
  function go(id) { var el = $(id); if (el) { close(); el.scrollIntoView(); } }
  var CMD = {
    help: function () { print('commands: whoami, projects, skills, contact, github, resume, ls, clear, exit'); },
    whoami: function () { print('Martin Assaad: frontend developer, CS student at LIU Beirut, learning .NET and MySQL.'); },
    projects: function () { CASES.forEach(function (c, i) { print((i + 1) + '. ' + c.name + ' (' + c.tag + ')'); }); print('open one: type its number'); },
    skills: function () { print('frontend: HTML, CSS, JavaScript, TypeScript, Angular'); print('learning: .NET, C#, MySQL, SQL'); },
    contact: function () { print('martinassaad21@gmail.com · +961 76 448 169'); print('linkedin.com/in/martin-assaad'); },
    github: function () { print('github.com/MartinAssaad'); },
    resume: function () { print('scrolling to resume…'); setTimeout(function () { go('#resume'); }, 300); },
    ls: function () { print('about  skills  projects  experience  education  github  resume  contact'); },
    clear: function () { out.textContent = ''; },
    exit: function () { close(); },
    'sudo hire-me': function () { print('Access granted.', 'ok'); print('Welcome. Opening the contact section…'); setTimeout(function () { go('#contact'); }, 900); }
  };
  function run(v) {
    v = v.trim(); if (!v) return; print('$ ' + v, 'cmd'); hist.push(v); hi = hist.length;
    if (/^[1-4]$/.test(v)) { close(); window.openCase(+v - 1); return; }
    var f = CMD[v.toLowerCase()]; if (f) f(); else print(v + ': command not found. Try "help".', 'bad');
  }
  function open() { if (!box.hidden) return; last = document.activeElement; box.hidden = false; document.documentElement.classList.add('lock'); if (!out.children.length) { print('Martin Assaad portfolio shell. Type "help".'); } inp.value = ''; inp.focus(); }
  function close() { if (box.hidden) return; box.hidden = true; document.documentElement.classList.remove('lock'); if (last && last.focus) last.focus({ preventScroll: true }); }
  window.openCli = open;
  x.addEventListener('click', close);
  box.addEventListener('click', function (e) { if (e.target === box) close(); });
  inp.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { run(inp.value); inp.value = ''; }
    else if (e.key === 'ArrowUp' && hist.length) { hi = Math.max(0, hi - 1); inp.value = hist[hi]; e.preventDefault(); }
    else if (e.key === 'ArrowDown') { hi = Math.min(hist.length, hi + 1); inp.value = hist[hi] || ''; e.preventDefault(); }
  });
  var buf = '';
  document.addEventListener('keydown', function (e) {
    var tgt = e.target, typing = tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA');
    if (e.key === 'Escape' && !box.hidden) { close(); return; }
    if (typing) return;
    if (e.key === '`') { e.preventDefault(); box.hidden ? open() : close(); return; }
    if (e.key.length === 1) {
      buf = (buf + e.key.toLowerCase()).slice(-12);
      if (buf === 'sudo hire-me') { buf = ''; open(); run('sudo hire-me'); }
    }
  });
})();

/* ---------- Explore 3D lab ---------- */
(function () {
  var btn = $('#exploreBtn'), lab = $('#lab'); if (!btn) return;
  var instance = null, last = null;
  var SPOTS = [
    ['projects', 'Projects (computer)', '#projects'], ['learning', 'Backend (neural core)', '#learning'], ['github', 'GitHub (terminal)', '#github'],
    ['skills', 'Skills (hologram)', '#skills'], ['bot', 'Telegram bot (robot)', 'case:3'], ['about', 'About (door)', '#about'],
    ['contact', 'Contact (phone)', '#contact'], ['resume', 'Resume (documents)', '#resume']
  ];
  var list = $('#labList');
  SPOTS.forEach(function (s) {
    var li = document.createElement('li'), b = document.createElement('button');
    b.type = 'button'; b.textContent = s[1]; b.addEventListener('click', function () { if (instance) instance.choose(s[0]); else go(s); });
    li.appendChild(b); list.appendChild(li);
  });
  function go(s) {
    close();
    if (s[2].indexOf('case:') === 0) window.openCase(+s[2].slice(5));
    else { var el = $(s[2]); if (el) el.scrollIntoView(); }
  }
  function open() {
    if (!window.__webglOK) { return; }
    last = document.activeElement; lab.hidden = false; document.documentElement.classList.add('lock'); $('#labClose').focus({ preventScroll: true });
    window.loadScene(function () {
      if (!instance) {
        instance = window.MartinScene.lab({
          canvas: $('#labCanvas'), host: lab, tip: $('#labTip'),
          onPick: function (id) { var s = SPOTS.filter(function (z) { return z[0] === id; })[0]; if (s) go(s); },
          onLost: function () { close(); btn.hidden = true; }
        });
        if (!instance) { close(); btn.hidden = true; return; }
      }
      if (!lab.hidden) instance.start();
    });
  }
  function close() {
    if (lab.hidden) return; lab.hidden = true; document.documentElement.classList.remove('lock');
    if (instance) instance.stop(); if (last && last.focus) last.focus({ preventScroll: true });
  }
  btn.addEventListener('click', open);
  $('#labClose').addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lab.hidden) close(); });
  // let the page know right away whether 3D is possible
  setTimeout(function () { if (window.__webglOK === false) btn.hidden = true; }, 0);
})();
