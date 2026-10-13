// Theme toggle: follows the system setting until the visitor picks one.
(function () {
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  function currentTheme() {
    return root.getAttribute('data-theme') || (media.matches ? 'dark' : 'light');
  }
  function applyLabel() {
    btn.textContent = currentTheme() === 'dark' ? 'Light mode' : 'Dark mode';
  }

  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
  } catch (e) { /* storage unavailable, use system theme */ }

  btn.addEventListener('click', function () {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    applyLabel();
  });
  media.addEventListener('change', applyLabel);
  applyLabel();
})();

// Highlight the nav link for the section being read.
(function () {
  const links = document.querySelectorAll('nav a[href^="#"]');
  const sections = [];
  links.forEach(function (link) {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) sections.push({ link: link, target: target });
  });
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      links.forEach(function (l) { l.classList.remove('active'); l.removeAttribute('aria-current'); });
      const match = sections.find(function (s) { return s.target === entry.target; });
      if (match) { match.link.classList.add('active'); match.link.setAttribute('aria-current', 'true'); }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(function (s) { observer.observe(s.target); });
})();

// Copy email to clipboard.
(function () {
  const btn = document.getElementById('copyEmail');
  const email = document.getElementById('email');
  if (!btn || !email) return;
  btn.addEventListener('click', function () {
    const text = email.textContent.trim();
    const done = function (msg) {
      btn.textContent = msg;
      setTimeout(function () { btn.textContent = 'Copy email'; }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done('Copied'); }, function () { done('Copy failed'); });
    } else {
      done('Copy failed');
    }
  });
})();

// Footer year.
(function () {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
