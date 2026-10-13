/* HEADER.JS - highlights the nav link of the section you're viewing, and on click. */
const burger = document.getElementById('burger'), nav = document.getElementById('nav');
function setMenu(open){ nav.classList.toggle('open', open); burger.classList.toggle('open', open); burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); }
burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
document.addEventListener('click', e => { if (!e.target.closest('.header') && !e.target.closest('.nav')) setMenu(false); });
const links = document.querySelectorAll('.nav a[href^="#"]');
const sections = [...links].map(a => document.querySelector(a.getAttribute('href')));
function setActive(id){ links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id)); }
links.forEach(a => a.addEventListener('click', () => setActive(a.getAttribute('href').slice(1))));
const spy = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach(s => s && spy.observe(s));
