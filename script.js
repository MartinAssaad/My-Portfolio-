'use strict';

var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

/* ---------- Theme switch ---------- */
(function () {
  var root = document.documentElement;
  var btn = document.getElementById('themeBtn');
  var meta = document.querySelector('meta[name="theme-color"]');
  function paint(t) {
    root.setAttribute('data-theme', t);
    btn.setAttribute('aria-checked', t === 'dark' ? 'true' : 'false');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#070d1a' : '#f4f7fc');
  }
  paint(root.getAttribute('data-theme') || 'light');
  btn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    paint(next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });
})();

/* ---------- Syntax highlighting ---------- */
var KW = {
  ts: 'const|export|default|let|function|return|import|from',
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

/* ---------- Typing engine ---------- */
async function typeLines(el, lines, o) {
  o = o || {};
  var speed = o.speed || 16, lineDelay = o.lineDelay || 110, rowClass = o.rowClass || 'ln', lang = o.lang || 'ts';
  var fast = reduce || o.instant;
  var active = o.isActive || function () { return true; };
  var caret = document.createElement('span');
  caret.className = 'caret';
  el.textContent = '';
  for (var i = 0; i < lines.length; i++) {
    if (!active()) return null;
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
      if (fast) { s.textContent = text; continue; }
      for (var k = 0; k < text.length; k++) {
        if (!active()) return null;
        s.textContent += text[k];
        await sleep(speed + Math.random() * speed * 0.8);
      }
    }
    if (!fast) await sleep(lineDelay);
  }
  return caret;
}

function whenVisible(el, fn) {
  if (!('IntersectionObserver' in window)) { fn(); return; }
  var io = new IntersectionObserver(function (entries, o) {
    if (entries[0].isIntersecting) { o.disconnect(); fn(); }
  }, { threshold: 0.3 });
  io.observe(el);
}

/* ---------- Hero editor with tabs ---------- */
var FILES = [
  {
    lang: 'ts',
    code: [
      '// martin.ts',
      'const martin = {',
      '  role: "Frontend developer",',
      '  studying: "Computer Science @ LIU",',
      '  stack: ["TypeScript", "Angular", "CSS"],',
      '  learning: [".NET", "MySQL"],',
      '  working: "Remote IT support",',
      '  goal: "Found a software company",',
      '};',
      '',
      'export default martin;'
    ],
    term: [
      [['f', '$ '], ['n', 'npm run build']],
      [['s', '✓ '], ['n', 'compiled without errors']],
      [['s', '✓ '], ['n', 'portfolio ready']]
    ]
  },
  {
    lang: 'cs',
    code: [
      '// Learning.cs',
      'public class Martin',
      '{',
      '    public string[] Learning = { ".NET", "MySQL" };',
      '',
      '    public void Practice()',
      '    {',
      '        Console.WriteLine("Hello, .NET");',
      '    }',
      '}'
    ],
    term: [
      [['f', '$ '], ['n', 'dotnet run']],
      [['n', 'Hello, .NET']],
      [['s', '✓ '], ['n', 'build succeeded']]
    ]
  },
  {
    lang: 'sql',
    code: [
      '-- schema.sql',
      'CREATE TABLE skills (',
      '  id INT PRIMARY KEY AUTO_INCREMENT,',
      '  name VARCHAR(50) NOT NULL,',
      '  status VARCHAR(20)',
      ');',
      '',
      "INSERT INTO skills (name, status)",
      "VALUES ('.NET', 'learning'),",
      "       ('MySQL', 'learning');",
      'SELECT * FROM skills;'
    ],
    term: [
      [['f', 'mysql> '], ['n', 'SELECT * FROM skills;']],
      [['c', 'id  name   status']],
      [['n', '1   .NET   learning']],
      [['n', '2   MySQL  learning']]
    ]
  }
];

(function () {
  var code = document.getElementById('heroCode');
  var term = document.getElementById('heroTerm');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var runId = 0, tourStopped = false;

  async function showFile(i, animate) {
    var id = ++runId;
    var active = function () { return id === runId; };
    tabs.forEach(function (t, n) { t.setAttribute('aria-selected', n === i ? 'true' : 'false'); });
    var f = FILES[i];
    var instant = !animate;
    var caret = await typeLines(code, f.code, { lang: f.lang, speed: 13, instant: instant, isActive: active });
    if (!active()) return false;
    if (caret) caret.remove();
    await typeLines(term, f.term, { rowClass: 'tl', speed: 20, instant: instant, isActive: active });
    return active();
  }

  tabs.forEach(function (t, n) {
    t.addEventListener('click', function () { tourStopped = true; showFile(n, false); });
  });

  (async function () {
    if (reduce) { showFile(0, false); return; }
    await sleep(450);
    for (var i = 0; i < FILES.length; i++) {
      var ok = await showFile(i, true);
      if (!ok || tourStopped) return;
      await sleep(1600);
      if (tourStopped) return;
    }
    showFile(0, false);
  })();
})();

/* ---------- Rotating "currently learning" word ---------- */
(function () {
  var el = document.getElementById('rot');
  var words = ['.NET', 'MySQL', 'backend development'];
  if (reduce) { el.textContent = '.NET and MySQL'; return; }
  var w = 0, c = 0, del = false;
  function tick() {
    var word = words[w];
    if (!del) {
      c++;
      el.textContent = word.slice(0, c);
      if (c === word.length) { del = true; return setTimeout(tick, 1700); }
      return setTimeout(tick, 85);
    }
    c--;
    el.textContent = word.slice(0, c);
    if (c === 0) { del = false; w = (w + 1) % words.length; return setTimeout(tick, 350); }
    setTimeout(tick, 45);
  }
  setTimeout(tick, 900);
})();

/* ---------- Learning panels ---------- */
var NET_CODE = [
  'var builder = WebApplication.CreateBuilder(args);',
  'var app = builder.Build();',
  '',
  'app.MapGet("/", () => "Hello from my first API");',
  '',
  'app.Run();'
];
var NET_TERM = [
  [['f', '$ '], ['n', 'dotnet run']],
  [['s', '✓ '], ['n', 'listening on http://localhost:5000']]
];
var SQL_CODE = [
  'SELECT name, status',
  'FROM skills',
  "WHERE status = 'learning'",
  'ORDER BY name;'
];
var SQL_TERM = [
  [['f', 'mysql> '], ['n', 'run query']],
  [['c', 'name   status']],
  [['n', '.NET   learning']],
  [['n', 'MySQL  learning']]
];
function panel(id, code, term, lang) {
  var box = document.getElementById(id);
  whenVisible(box, async function () {
    var c = box.querySelector('.code'), t = box.querySelector('.term');
    var caret = await typeLines(c, code, { lang: lang, speed: 14 });
    if (caret) caret.remove();
    await typeLines(t, term, { rowClass: 'tl', speed: 22 });
  });
}
panel('netPanel', NET_CODE, NET_TERM, 'cs');
panel('sqlPanel', SQL_CODE, SQL_TERM, 'sql');

/* ---------- Contact terminal ---------- */
whenVisible(document.getElementById('contactTerm'), function () {
  typeLines(document.getElementById('contactTerm'), [
    [['f', '$ '], ['n', 'whoami']],
    [['s', 'martin']],
    [['f', '$ '], ['n', './get-in-touch.sh']],
    [['s', 'listening for new opportunities…']]
  ], { rowClass: 'tl', speed: 30 });
});

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
    b.addEventListener('click', function () {
      var label = b.getAttribute('data-label') || b.textContent;
      b.setAttribute('data-label', label);
      copyText(b.getAttribute('data-copy')).then(function () { b.textContent = 'Copied'; }, function () { b.textContent = 'Select and copy'; });
      setTimeout(function () { b.textContent = label; }, 2000);
    });
  });
})();

/* ---------- Reveal on scroll ---------- */
(function () {
  document.querySelectorAll('.stagger').forEach(function (p) {
    Array.prototype.forEach.call(p.children, function (c, i) {
      c.classList.add('reveal');
      c.style.setProperty('--d', (i * 90) + 'ms');
    });
  });
  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) { items.forEach(function (e) { e.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  items.forEach(function (e) { io.observe(e); });

  var steps = document.querySelectorAll('.log li');
  var io2 = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { rootMargin: '0px 0px -35% 0px' });
  steps.forEach(function (s) { io2.observe(s); });
})();

/* ---------- Scroll progress, header shadow, timeline fill, hero glow ---------- */
(function () {
  var bar = document.getElementById('progress');
  var header = document.querySelector('.site-header');
  var log = document.querySelector('.log');
  var hero = document.querySelector('.hero');
  var ticking = false;
  function update() {
    ticking = false;
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, h.scrollTop / max) : 0) + ')';
    header.classList.toggle('scrolled', h.scrollTop > 8);
    if (log) {
      var r = log.getBoundingClientRect();
      var p = (window.innerHeight * 0.65 - r.top) / r.height;
      log.style.setProperty('--p', reduce ? 1 : Math.max(0, Math.min(1, p)).toFixed(3));
    }
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();

  if (hero && !reduce && window.matchMedia('(pointer: fine)').matches) {
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
