// Fill in the footer year.
document.querySelector('#year').textContent = new Date().getFullYear();

// Open and close the mobile navigation.
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
menuToggle.addEventListener('click', () => {
	const isOpen = navLinks.classList.toggle('open');
	menuToggle.setAttribute('aria-expanded', isOpen);
	menuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
});
navLinks.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => navLinks.classList.remove('open')));

// Highlight the navigation item for the section in view.
const sections = document.querySelectorAll('main section');
const links = document.querySelectorAll('.nav-links a');
const sectionObserver = new IntersectionObserver((entries) => {
	entries.forEach((entry) => {
		if (entry.isIntersecting) {
			links.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
		}
	});
}, { rootMargin: '-35% 0px -55% 0px' });
sections.forEach((section) => sectionObserver.observe(section));

// Reveal sections as they enter the viewport.
const revealObserver = new IntersectionObserver((entries, observer) => {
	entries.forEach((entry) => {
		if (entry.isIntersecting) {
			entry.target.classList.add('visible');
			observer.unobserve(entry.target);
		}
	});
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((section) => revealObserver.observe(section));
