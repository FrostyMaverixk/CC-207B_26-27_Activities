// Mobile menu
const header = document.querySelector('.site-header');
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('nav');

function setMenu(open) {
  nav.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}
toggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
nav.querySelectorAll('a').forEach(l => l.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

// Header border once the page scrolls
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Highlight current section in the nav
const links = document.querySelectorAll('.nav a');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id));
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });
document.querySelectorAll('main section[id]').forEach(s => observer.observe(s));

// Typing effect in the hero code window (the one load-in moment)
const typed = document.getElementById('typed');
const text = '"Open to internships"';
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reduce) {
  typed.textContent = text;
} else {
  let i = 0;
  const type = () => {
    typed.textContent = text.slice(0, ++i);
    if (i < text.length) setTimeout(type, 70);
  };
  setTimeout(type, 600);
}

// Copy email
const toast = document.getElementById('toast');
document.getElementById('copy-email').addEventListener('click', async () => {
  const email = 'jennymae.navea@wvsu.edu.ph';
  let message = 'Email address copied';
  try {
    await navigator.clipboard.writeText(email);
  } catch {
    message = 'Copy failed. Email: ' + email;
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
});

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Logo cloud: seamless marquee, border beam, and text wave kept in sync
(function () {
  const card = document.getElementById('logo-cloud');
  const title = document.getElementById('lc-title');
  const wave = document.getElementById('lc-wave');
  const beam = document.getElementById('lc-beam');
  const marquee = document.getElementById('marquee');
  const group = document.getElementById('marquee-group');
  const track = document.getElementById('marquee-track');
  if (!card) return;

  // Marquee: repeat chips until one group is wider than the card, then duplicate the group
  const originals = [...group.children];
  function buildMarquee() {
    track.querySelectorAll('.marquee-group[aria-hidden]').forEach(g => g.remove());
    group.querySelectorAll('[data-clone]').forEach(c => c.remove());
    if (reduce) return;
    let guard = 0;
    while (group.scrollWidth < marquee.clientWidth && guard++ < 6) {
      originals.forEach(li => {
        const c = li.cloneNode(true);
        c.dataset.clone = '1';
        group.appendChild(c);
      });
    }
    const copy = group.cloneNode(true);
    copy.removeAttribute('id');
    copy.setAttribute('aria-hidden', 'true');
    track.appendChild(copy);
  }
  buildMarquee();
  document.fonts.ready.then(buildMarquee);
  let t;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(buildMarquee, 200); });

  if (reduce) return;

  // Beam and wave share one clock. The wave sweeps across the title as the beam passes behind it.
  const DURATION = 8000;
  let visible = true;
  new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(card);

  function frame(now) {
    if (visible) {
      const progress = (now % DURATION) / DURATION * 100;
      beam.style.offsetDistance = progress + '%';

      const c = card.getBoundingClientRect();
      const r = title.getBoundingClientRect();
      const perimeter = 2 * (c.width + c.height);
      const start = (Math.max(0, r.left - c.left) / perimeter) * 100;
      const end = (Math.min(c.width, r.right - c.left) / perimeter) * 100;

      if (progress >= start && progress <= end) {
        const k = (progress - start) / (end - start);
        wave.style.backgroundPosition = (95 - k * 90) + '% center';
      } else {
        wave.style.backgroundPosition = progress < start ? '0% center' : '100% center';
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
