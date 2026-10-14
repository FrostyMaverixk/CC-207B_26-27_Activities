// ----- Footer year -----
document.getElementById("year").textContent = new Date().getFullYear();

// ----- Mobile menu -----
const nav = document.getElementById("nav");
document.getElementById("menuToggle").addEventListener("click", () => {
  nav.classList.toggle("open");
});
nav.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => nav.classList.remove("open"))
);

// ----- Dark mode (remembers your choice) -----
const themeBtn = document.getElementById("themeToggle");

function applyTheme(isDark) {
  document.body.classList.toggle("dark", isDark);
  themeBtn.textContent = isDark ? "☀️" : "🌙";
}

let savedDark = false;
try { savedDark = localStorage.getItem("theme") === "dark"; } catch (e) {}
applyTheme(savedDark);

themeBtn.addEventListener("click", () => {
  const isDark = !document.body.classList.contains("dark");
  applyTheme(isDark);
  try { localStorage.setItem("theme", isDark ? "dark" : "light"); } catch (e) {}
});

// ----- Typing effect -----
const words = ["Web Developer", "Designer", "Problem Solver"];
const typedEl = document.getElementById("typed");
let wordIndex = 0;
let charIndex = 0;
let deleting = false;

function type() {
  const word = words[wordIndex];
  typedEl.textContent = word.slice(0, charIndex);

  if (!deleting && charIndex < word.length) {
    charIndex++;
    setTimeout(type, 100);
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

// ----- Scroll reveal -----
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// ----- Contact form (demo only) -----
document.getElementById("contactForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  document.getElementById("formStatus").textContent =
    `Thanks, ${name}! Your message was received (demo only).`;
  e.target.reset();
});
