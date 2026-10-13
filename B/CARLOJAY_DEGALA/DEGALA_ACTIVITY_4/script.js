document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Theme Toggle Persistence ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    // Load user saved theme preference from localStorage
    const savedTheme = localStorage.getItem('portfolio-theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    htmlElement.setAttribute('data-theme', savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('portfolio-theme', newTheme);
    });

    // --- 2. Mobile Navigation Toggle ---
    const mobileToggleBtn = document.getElementById('mobile-toggle');
    const navLinks = document.getElementById('nav-links');

    mobileToggleBtn.addEventListener('click', () => {
        navLinks.classList.toggle('show');
    });

    // Close menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('show');
        });
    });

    // --- 3. Projects Category Filter ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state on filter buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            // Show/Hide project cards
            projectCards.forEach(card => {
                const category = card.getAttribute('data-category');
                
                if (filterValue === 'all' || category === filterValue) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 50);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(10px)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 200);
                }
            });
        });
    });

    // --- 4. Active Navigation Link on Scroll ---
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let currentSection = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (window.scrollY >= sectionTop) {
                currentSection = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${currentSection}`) {
                item.classList.add('active');
            }
        });
    });

    // --- 5. Contact Form Validation & Submission Handling ---
    const contactForm = document.getElementById('contact-form');
    const formAlert = document.getElementById('form-alert');
    const submitBtn = document.getElementById('submit-btn');

    // Email validation helper
    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        let isValid = true;
        const inputs = [
            { id: 'name', valid: document.getElementById('name').value.trim() !== '' },
            { id: 'email', valid: isValidEmail(document.getElementById('email').value.trim()) },
            { id: 'subject', valid: document.getElementById('subject').value.trim() !== '' },
            { id: 'message', valid: document.getElementById('message').value.trim() !== '' }
        ];

        // Apply error states
        inputs.forEach(input => {
            const fieldGroup = document.getElementById(input.id).parentElement;
            if (!input.valid) {
                fieldGroup.classList.add('invalid');
                isValid = false;
            } else {
                fieldGroup.classList.remove('invalid');
            }
        });

        if (isValid) {
            // Processing state
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span>Sending...</span> <i class="fa-solid fa-circle-notch fa-spin"></i>`;

            // Simulate form dispatch delay
            setTimeout(() => {
                formAlert.className = 'form-alert success';
                formAlert.textContent = 'Thank you! Your message has been sent successfully.';

                contactForm.reset();
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<span>Send Message</span> <i class="fa-solid fa-paper-plane"></i>`;

                setTimeout(() => {
                    formAlert.className = 'form-alert hidden';
                }, 5000);
            }, 1200);
        }
    });

    // Clear validation error on key input
    contactForm.querySelectorAll('input, textarea').forEach(field => {
        field.addEventListener('input', () => {
            field.parentElement.classList.remove('invalid');
        });
    });

    // --- 6. Dynamic Copyright Year ---
    document.getElementById('year').textContent = new Date().getFullYear();
});