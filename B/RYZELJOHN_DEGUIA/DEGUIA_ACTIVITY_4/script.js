document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();

    if (name && email) {
      formStatus.style.color = '#4ade80';
      formStatus.textContent = `Thank you, ${name}! Your message has been recorded.`;
      contactForm.reset();
    } else {
      formStatus.style.color = '#f87171';
      formStatus.textContent = 'Please fill out all required fields.';
    }
  });

  // Smooth scroll offset handling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
        });
      }
    });
  });
});