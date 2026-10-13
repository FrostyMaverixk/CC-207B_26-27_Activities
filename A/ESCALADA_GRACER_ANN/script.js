// View switching: Home <-> Projects, inside the same index.html
const views = document.querySelectorAll('.view');
const links = document.querySelectorAll('[data-view-link]');
const navLinks = document.querySelector('.nav-links');
const menuToggle = document.querySelector('.menu-toggle');

function showView(name, updateHash = true) {
  const target = document.getElementById('view-' + name) ? name : 'home';
  views.forEach(v => v.classList.toggle('active', v.id === 'view-' + target));
  document.querySelectorAll('.nav-links [data-view-link]').forEach(b =>
    b.classList.toggle('is-active', b.dataset.viewLink === target)
  );
  if (updateHash) history.replaceState(null, '', target === 'home' ? '#' : '#' + target);
  window.scrollTo({ top: 0, behavior: 'auto' });
  navLinks.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
}

links.forEach(el =>
  el.addEventListener('click', e => {
    e.preventDefault();
    showView(el.dataset.viewLink);
  })
);

// Mobile menu
menuToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});

// Open the right view from the URL (#projects)
showView(location.hash.replace('#', '') === 'projects' ? 'projects' : 'home', false);

// Photo placeholders: show the placeholder until the image file exists in /assets
document.querySelectorAll('.ph').forEach(frame => {
  const img = frame.querySelector('img');
  if (!img) return;
  const markLoaded = () => frame.classList.add('has-image');
  const markMissing = () => { img.style.display = 'none'; frame.classList.remove('has-image'); };
  img.addEventListener('load', markLoaded);
  img.addEventListener('error', markMissing);
  if (img.complete) (img.naturalWidth > 0 ? markLoaded : markMissing)();
});

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Photo carousel: click a side photo (or use Previous/Next, arrow keys, swipe) to slide it to the centre
const gallery = document.querySelector('.gallery');
if (gallery) {
  const slides = [...gallery.querySelectorAll('.ph')];
  const n = slides.length;
  let active = Math.floor(n / 2);

  const render = () => slides.forEach((slide, i) => {
    let d = (i - active + n) % n;
    if (d > n / 2) d -= n;
    slide.dataset.pos = d;
    slide.setAttribute('aria-current', String(d === 0));
  });

  const go = step => { active = (active + step + n) % n; render(); };

  slides.forEach((slide, i) => {
    const img = slide.querySelector('img');
    slide.tabIndex = 0;
    slide.setAttribute('role', 'button');
    if (img) slide.setAttribute('aria-label', img.alt);
    slide.addEventListener('click', () => { active = i; render(); });
    slide.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); active = i; render(); }
    });
  });

  const carousel = gallery.closest('.carousel');
  carousel.querySelectorAll('[data-dir]').forEach(btn =>
    btn.addEventListener('click', () => go(Number(btn.dataset.dir)))
  );
  carousel.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  });

  let startX = null;
  gallery.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  gallery.addEventListener('touchend', e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    startX = null;
  });

  render();
}