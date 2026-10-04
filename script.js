// ---------- Edit your contact details here ----------
var CONFIG = {
  email: "martinassaad21@gmail.com",
  phone: "+961 76 448 169",
  linkedin: "https://www.linkedin.com/in/martin-assaad/",
  github: ""      // optional, full URL, e.g. https://github.com/your-name
};

var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

// ---------- Theme toggle ----------
(function () {
  var root = document.documentElement;
  var btn = document.getElementById('themeBtn');
  var meta = document.querySelector('meta[name="theme-color"]');
  function paint(t) {
    root.setAttribute('data-theme', t);
    btn.setAttribute('aria-checked', t === 'dark' ? 'true' : 'false');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#0d1828' : '#f3f6fb');
  }
  paint(root.getAttribute('data-theme') || 'light');
  btn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    paint(next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });
})();

// ---------- Typewriter with syntax colors ----------
async function typeInto(el, lines, opts) {
  opts = opts || {};
  var speed = opts.speed || 18, lineDelay = opts.lineDelay || 140;
  var caret = document.createElement('span');
  caret.className = 'caret';
  el.textContent = '';
  var rowClass = opts.rowClass || 'ln';
  for (var i = 0; i < lines.length; i++) {
    var row = document.createElement('div');
    row.className = rowClass;
    el.appendChild(row);
    row.appendChild(caret);
    var tokens = lines[i];
    for (var j = 0; j < tokens.length; j++) {
      var s = document.createElement('span');
      if (tokens[j][0]) s.className = tokens[j][0];
      row.insertBefore(s, caret);
      var text = tokens[j][1];
      if (reduce) { s.textContent = text; continue; }
      for (var k = 0; k < text.length; k++) {
        s.textContent += text[k];
        await sleep(speed + Math.random() * speed);
      }
    }
    if (!reduce) await sleep(lineDelay);
  }
  return caret;
}

function whenVisible(el, fn) {
  if (!('IntersectionObserver' in window)) { fn(); return; }
  var io = new IntersectionObserver(function (entries, o) {
    if (entries[0].isIntersecting) { o.disconnect(); fn(); }
  }, { threshold: 0.35 });
  io.observe(el);
}

var heroLines = [
  [['c', '// martin.ts']],
  [['k', 'const '], ['p', 'martin'], ['n', ' = {']],
  [['n', '  '], ['p', 'role'], ['n', ': '], ['s', '"Web & backend developer"'], ['n', ',']],
  [['n', '  '], ['p', 'studying'], ['n', ': '], ['s', '"Computer Science"'], ['n', ',']],
  [['n', '  '], ['p', 'stack'], ['n', ': ['], ['s', '"TypeScript"'], ['n', ', '], ['s', '"JavaScript"'], ['n', ', '], ['s', '"Angular"'], ['n', '],']],
  [['n', '  '], ['p', 'learning'], ['n', ': ['], ['s', '"NestJS"'], ['n', ', '], ['s', '"MongoDB"'], ['n', ', '], ['s', '"Firebase"'], ['n', '],']],
  [['n', '  '], ['p', 'working'], ['n', ': '], ['s', '"IT support, remotely"'], ['n', ',']],
  [['n', '  '], ['p', 'goal'], ['n', ': '], ['s', '"Found a software company"'], ['n', ',']],
  [['n', '};']],
  [],
  [['k', 'export default '], ['p', 'martin'], ['n', ';']]
];
var buildLines = [
  [['f', '$ '], ['n', 'npm run build']],
  [['s', '✓ '], ['n', 'compiled without errors']],
  [['s', '✓ '], ['n', 'portfolio ready']]
];
var fsLines = [
  [['k', 'const '], ['p', 'db'], ['n', ' = '], ['f', 'getFirestore'], ['n', '(app);']],
  [['k', 'const '], ['p', 'orders'], ['n', ' = '], ['f', 'collection'], ['n', '(db, '], ['s', '"orders"'], ['n', ');']],
  [],
  [['k', 'await '], ['f', 'addDoc'], ['n', '(orders, {']],
  [['n', '  '], ['p', 'status'], ['n', ': '], ['s', '"pending"'], ['n', ',']],
  [['n', '  '], ['p', 'createdAt'], ['n', ': '], ['f', 'serverTimestamp'], ['n', '(),']],
  [['n', '});']]
];
var contactLines = [
  [['f', '$ '], ['n', 'whoami']],
  [['s', 'martin']],
  [['f', '$ '], ['n', './get-in-touch.sh']],
  [['s', 'listening for new opportunities…']]
];

(async function () {
  var heroCode = document.getElementById('heroCode');
  var heroTerm = document.getElementById('heroTerm');
  await sleep(reduce ? 0 : 350);
  var c = await typeInto(heroCode, heroLines, { speed: 16 });
  c.remove();
  await sleep(reduce ? 0 : 250);
  typeInto(heroTerm, buildLines, { speed: 24, rowClass: 'tl' });
})();

whenVisible(document.getElementById('fsCode'), function () {
  typeInto(document.getElementById('fsCode'), fsLines, { speed: 16 });
});
whenVisible(document.getElementById('contactTerm'), function () {
  typeInto(document.getElementById('contactTerm'), contactLines, { speed: 30, rowClass: 'tl' });
});

// ---------- Contact links ----------
(function () {
  var box = document.getElementById('contactLinks');
  box.setAttribute('aria-live', 'polite');
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var t = document.createElement('textarea');
      t.value = text; t.setAttribute('readonly', '');
      t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy') ? resolve() : reject(); } catch (e) { reject(e); }
      document.body.removeChild(t);
    });
  }
  function addCopy(label, value, primary) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn ' + (primary ? 'btn-primary' : 'btn-ghost');
    b.textContent = label;
    b.addEventListener('click', function () {
      copyText(value).then(function () { b.textContent = 'Copied'; }, function () { b.textContent = value; });
      setTimeout(function () { b.textContent = label; }, 2200);
    });
    box.appendChild(b);
  }
  function addLink(label, href, primary) {
    var a = document.createElement('a');
    a.className = 'btn ' + (primary ? 'btn-primary' : 'btn-ghost');
    a.href = href; a.textContent = label;
    a.target = '_blank'; a.rel = 'noopener noreferrer';
    box.appendChild(a);
  }
  if (CONFIG.email) addCopy('Copy email', CONFIG.email, true);
  if (CONFIG.phone) addCopy('Copy phone number', CONFIG.phone, false);
  if (CONFIG.linkedin) addLink('LinkedIn', CONFIG.linkedin, false);
  if (CONFIG.github) addLink('GitHub', CONFIG.github, false);
  document.getElementById('contactDetails').textContent = [CONFIG.email, CONFIG.phone].filter(Boolean).join('  |  ');
})();

// ---------- Active nav link ----------
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
