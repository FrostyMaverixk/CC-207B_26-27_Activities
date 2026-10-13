// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Typing effect
const words = ["BSIT Student", "Web Developer", "UX/UI Enthusiast"];
let wordIndex = 0;
let charIndex = 0;
let deleting = false;
const typingEl = document.getElementById("typing");

function type() {
  const current = words[wordIndex];

  if (!deleting) {
    charIndex++;
    typingEl.textContent = current.slice(0, charIndex);
    if (charIndex === current.length) {
      deleting = true;
      setTimeout(type, 1200);
      return;
    }
  } else {
    charIndex--;
    typingEl.textContent = current.slice(0, charIndex);
    if (charIndex === 0) {
      deleting = false;
      wordIndex = (wordIndex + 1) % words.length;
    }
  }

  setTimeout(type, deleting ? 50 : 100);
}

type();

// Fade in sections on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    }
  });
});

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));