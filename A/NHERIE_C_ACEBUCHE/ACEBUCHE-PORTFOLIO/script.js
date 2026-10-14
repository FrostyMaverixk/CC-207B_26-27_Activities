const menuButton = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-links');
const navLinks = document.querySelectorAll('.nav-links a');
const year = document.querySelector('#current-year');

// Shows and hides the mobile navigation menu.
menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  navMenu.classList.toggle('open');
});

// Closes the mobile menu after a navigation link is selected.
navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  });
});

// Adds a gentle entrance effect once a section element is visible.
const revealItems = document.querySelectorAll('.reveal');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reduceMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

// Highlights the current navigation section while the visitor scrolls.
const sections = document.querySelectorAll('main section[id]');
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
        });
      }
    });
  },
  { rootMargin: '-35% 0px -55% 0px' }
);

sections.forEach((section) => sectionObserver.observe(section));

// Keeps the footer date current without needing to edit the HTML each year.
year.textContent = new Date().getFullYear();
