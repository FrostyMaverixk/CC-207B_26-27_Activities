// Dark mode toggle
const root = document.documentElement;
const toggle = document.getElementById("theme-toggle");

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  const isDark = theme === "dark";
  toggle.textContent = isDark ? "Light mode" : "Dark mode";
  toggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
}

let saved = null;
try { saved = localStorage.getItem("theme"); } catch (e) {}

const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
applyTheme(saved || (prefersDark ? "dark" : "light"));

toggle.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
  try { localStorage.setItem("theme", next); } catch (e) {}
});

// Typing effect
// EDIT: change these phrases to match how you describe yourself.
const phrases = ["aspiring web developer", "Git and GitHub learner", "problem solver"];
const typed = document.getElementById("typed");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reduceMotion) {
  typed.textContent = phrases[0];
} else {
  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function type() {
    const phrase = phrases[phraseIndex];
    charIndex += deleting ? -1 : 1;
    typed.textContent = phrase.slice(0, charIndex);

    let delay = deleting ? 40 : 80;
    if (!deleting && charIndex === phrase.length) {
      deleting = true;
      delay = 1500;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      delay = 400;
    }
    setTimeout(type, delay);
  }
  type();
}
