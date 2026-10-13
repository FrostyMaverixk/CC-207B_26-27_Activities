const $ = (s) => document.querySelector(s);
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---- Edit your details here ---- */
const ROLES = ["Web Developer", "Designer", "Java Programmer", "BSIT Student", "Chud"];

/* ---- Footer year ---- */
const yr = $("#year");
if (yr) yr.textContent = new Date().getFullYear();

/* ---- Profile picture that follows the theme ---- */
const portraitImgs = {
  light: $("#portrait-light"),
  dark: $("#portrait-dark"),
};
const portraitFallback = $("#portrait-fallback");
const portraitLoaded = { light: false, dark: false };
let isDark = false;

function setPortrait(dark) {
  isDark = dark;
  const want = dark ? "dark" : "light";
  const other = dark ? "light" : "dark";
  const show = portraitLoaded[want] ? want : portraitLoaded[other] ? other : null;

  Object.entries(portraitImgs).forEach(([key, img]) => {
    if (!img) return;
    img.classList.toggle("visible", key === show);
    img.setAttribute("aria-hidden", String(key !== show));
  });
  if (portraitFallback) portraitFallback.hidden = show !== null;
}

Object.entries(portraitImgs).forEach(([key, img]) => {
  if (!img) return;
  img.addEventListener("load", () => { portraitLoaded[key] = true; setPortrait(isDark); });
  img.addEventListener("error", () => { portraitLoaded[key] = false; setPortrait(isDark); });
  img.src = img.dataset.src;
});

/* ---- Theme (saved in localStorage) ---- */
const themeBtn = $("#theme-toggle");

function applyTheme(dark) {
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  themeBtn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  setPortrait(dark);
  try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch (e) {}
}

applyTheme(document.documentElement.getAttribute("data-theme") === "dark");
themeBtn.addEventListener("click", () => {
  applyTheme(document.documentElement.getAttribute("data-theme") !== "dark");
});

/* ---- Mobile menu ---- */
const menuBtn = $(".menu-toggle");
const navLinks = $("#nav-links");

function setMenu(open) {
  navLinks.classList.toggle("open", open);
  menuBtn.setAttribute("aria-expanded", String(open));
}

menuBtn.addEventListener("click", () => setMenu(!navLinks.classList.contains("open")));
navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

/* ---- Typing animation ---- */
const typed = $("#typed");
if (typed) {
  if (reduceMotion) {
    typed.textContent = ROLES[0];
  } else {
    let r = 0, c = 0, deleting = false;
    (function tick() {
      const word = ROLES[r];
      typed.textContent = word.slice(0, c);
      let delay = deleting ? 45 : 90;
      if (!deleting && c === word.length) { deleting = true; delay = 1400; }
      else if (deleting && c === 0) { deleting = false; r = (r + 1) % ROLES.length; delay = 400; }
      else c += deleting ? -1 : 1;
      setTimeout(tick, delay);
    })();
  }
}

/* ---- Stat counters ---- */
document.querySelectorAll("[data-count]").forEach((el) => {
  const target = +el.dataset.count;
  if (reduceMotion) { el.textContent = target; return; }
  new IntersectionObserver((entries, obs) => {
    if (!entries[0].isIntersecting) return;
    obs.disconnect();
    let n = 0;
    const t = setInterval(() => {
      el.textContent = ++n;
      if (n >= target) clearInterval(t);
    }, 200);
  }).observe(el);
});

/* ---- Active nav link ---- */
const navSections = [...document.querySelectorAll("#nav-links a")]
  .map((a) => ({ link: a, section: document.querySelector(a.getAttribute("href")) }))
  .filter((x) => x.section && x.section.id !== "top");

let navTicking = false;
function updateActiveNav() {
  navTicking = false;
  const atBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
  let current = null;
  navSections.forEach((x) => {
    if (x.section.getBoundingClientRect().top <= 140) current = x;
  });
  if (atBottom) current = navSections[navSections.length - 1];
  navSections.forEach((x) => {
    if (x === current) x.link.setAttribute("aria-current", "true");
    else x.link.removeAttribute("aria-current");
  });
}
addEventListener("scroll", () => {
  if (!navTicking) { navTicking = true; requestAnimationFrame(updateActiveNav); }
}, { passive: true });
updateActiveNav();

/* ---- Scroll reveal ---- */
if (!reduceMotion && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(".section-heading, .about-grid > *, .project-card, .resume-panel, .contact-box")
    .forEach((el) => {
      const siblings = [...el.parentElement.children].filter((s) => s.classList.contains("reveal") || s === el);
      el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 3) * 90}ms`;
      el.classList.add("reveal");
      revealObserver.observe(el);
    });
}

/* ---- Back to top ---- */
const toTop = $("#to-top");
if (toTop) {
  let topTicking = false;
  const updateToTop = () => {
    topTicking = false;
    toTop.classList.toggle("show", scrollY > 500);
  };
  addEventListener("scroll", () => {
    if (!topTicking) { topTicking = true; requestAnimationFrame(updateToTop); }
  }, { passive: true });
  toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));
  updateToTop();
}