/* ==================================================
   PROFESSIONAL PORTFOLIO
   JAVASCRIPT
================================================== */

"use strict";

/* ---------- ELEMENTS ---------- */

const header = document.querySelector(".header");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const navItems = document.querySelectorAll(".nav-link");
const themeToggle = document.getElementById("themeToggle");
const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");
const year = document.getElementById("year");

/* ---------- FOOTER YEAR ---------- */

if (year) {
    year.textContent = new Date().getFullYear();
}

/* ---------- MOBILE MENU ---------- */

if (menuToggle && navLinks) {

    menuToggle.addEventListener("click", () => {
        navLinks.classList.toggle("open");

        const isOpen = navLinks.classList.contains("open");

        menuToggle.setAttribute("aria-expanded", isOpen);
    });

    navItems.forEach((item) => {
        item.addEventListener("click", () => {
            navLinks.classList.remove("open");
            menuToggle.setAttribute("aria-expanded", "false");
        });
    });
}

/* ---------- HEADER ON SCROLL ---------- */

function updateHeader() {

    if (!header) return;

    if (window.scrollY > 30) {
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
}

window.addEventListener("scroll", updateHeader);

updateHeader();

/* ---------- ACTIVE NAVIGATION ---------- */

const sections = document.querySelectorAll("section[id]");

function updateActiveNavigation() {

    const scrollPosition = window.scrollY + 150;

    sections.forEach((section) => {

        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute("id");

        if (
            scrollPosition >= sectionTop &&
            scrollPosition < sectionTop + sectionHeight
        ) {

            navItems.forEach((item) => {
                item.classList.remove("active");

                if (item.getAttribute("href") === `#${sectionId}`) {
                    item.classList.add("active");
                }
            });
        }
    });
}

window.addEventListener("scroll", updateActiveNavigation);

updateActiveNavigation();

/* ---------- DARK MODE ---------- */

const savedTheme = localStorage.getItem("portfolio-theme");

if (savedTheme === "dark") {
    document.body.classList.add("dark");

    if (themeToggle) {
        themeToggle.textContent = "☀";
    }
}

if (themeToggle) {

    themeToggle.addEventListener("click", () => {

        document.body.classList.toggle("dark");

        const isDark = document.body.classList.contains("dark");

        themeToggle.textContent = isDark ? "☀" : "☾";

        localStorage.setItem(
            "portfolio-theme",
            isDark ? "dark" : "light"
        );
    });
}

/* ---------- CONTACT FORM ---------- */

if (contactForm) {

    contactForm.addEventListener("submit", (event) => {

        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const message = document.getElementById("message").value.trim();

        if (!name || !email || !message) {

            formStatus.textContent =
                "Please complete all fields.";

            return;
        }

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {

            formStatus.textContent =
                "Please enter a valid email address.";

            return;
        }

        /*
            This demo does not send data to a server.
            Connect the form to your preferred backend,
            Formspree, EmailJS, or API endpoint here.
        */

        formStatus.textContent =
            "Thank you! Your message has been received.";

        contactForm.reset();

        setTimeout(() => {
            formStatus.textContent = "";
        }, 5000);
    });
}

/* ---------- SCROLL REVEAL ---------- */

const revealElements = document.querySelectorAll(
    ".section-heading, .about-text, .about-stats, " +
    ".skill-card, .project-card, .contact-info, .contact-form"
);

revealElements.forEach((element) => {
    element.classList.add("reveal");
});

const revealObserver = new IntersectionObserver(
    (entries, observer) => {

        entries.forEach((entry) => {

            if (entry.isIntersecting) {

                entry.target.classList.add("visible");

                observer.unobserve(entry.target);
            }
        });
    },
    {
        threshold: 0.12
    }
);

revealElements.forEach((element) => {
    revealObserver.observe(element);
});

/* ---------- CLOSE MENU WITH ESC ---------- */

document.addEventListener("keydown", (event) => {

    if (event.key === "Escape") {

        navLinks?.classList.remove("open");

        menuToggle?.setAttribute(
            "aria-expanded",
            "false"
        );
    }
});

/* ---------- PREVENT EMPTY PROJECT LINKS ---------- */

document.querySelectorAll('.project-link[href="#"]').forEach((link) => {

    link.addEventListener("click", (event) => {
        event.preventDefault();

        alert(
            "Replace this link with the URL of your project."
        );
    });
});

/* ---------- SMOOTH BACK TO TOP ---------- */

document.querySelectorAll('a[href="#home"]').forEach((link) => {

    link.addEventListener("click", (event) => {

        event.preventDefault();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
});
