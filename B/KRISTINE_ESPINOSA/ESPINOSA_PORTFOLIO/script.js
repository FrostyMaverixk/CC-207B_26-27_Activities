// Mobile menu toggle
const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");
menuBtn.addEventListener("click", () => navLinks.classList.toggle("open"));
navLinks.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => navLinks.classList.remove("open"))
);

// Typing effect
const words = ["BSIT Student", "Web Developer", "Network Enthusiast", "Lifelong Learner"];
const typedEl = document.getElementById("typed");
let wordIndex = 0;
let charIndex = 0;
let deleting = false;

function type() {
  const word = words[wordIndex];
  typedEl.textContent = word.substring(0, charIndex);

  if (!deleting && charIndex < word.length) {
    charIndex++;
    setTimeout(type, 90);
  } else if (!deleting) {
    deleting = true;
    setTimeout(type, 1200);
  } else if (charIndex > 0) {
    charIndex--;
    setTimeout(type, 50);
  } else {
    deleting = false;
    wordIndex = (wordIndex + 1) % words.length;
    setTimeout(type, 300);
  }
}
type();

// Reveal sections and animate skill bars on scroll
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        entry.target.querySelectorAll(".fill").forEach((bar) => {
          bar.style.width = bar.dataset.level + "%";
        });
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// Contact form validation (opens the visitor's email app with the message filled in)
const form = document.getElementById("contactForm");
const statusEl = document.getElementById("formStatus");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const message = document.getElementById("message").value.trim();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!name || !message || !emailOk) {
    statusEl.textContent = "Please fill in all fields with a valid email.";
    statusEl.className = "err";
    return;
  }

  const subject = encodeURIComponent("Portfolio message from " + name);
  const body = encodeURIComponent(message + "\n\nFrom: " + name + " (" + email + ")");
  window.location.href =
    "mailto:espinosakristine27@gmail.com?subject=" + subject + "&body=" + body;

  statusEl.textContent = "Thanks, " + name + "! Your email app should open now.";
  statusEl.className = "ok";
  form.reset();
});

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();
