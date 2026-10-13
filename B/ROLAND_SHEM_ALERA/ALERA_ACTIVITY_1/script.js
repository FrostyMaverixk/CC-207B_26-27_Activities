// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Light / dark theme
const root = document.documentElement;
const themeButton = document.getElementById("theme-toggle");

function setTheme(theme) {
  root.setAttribute("data-theme", theme);
  themeButton.textContent = theme === "dark" ? "Light" : "Dark";
}

setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

themeButton.addEventListener("click", () => {
  setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
});

// Mobile menu
const nav = document.getElementById("nav");
const menuButton = document.getElementById("menu-toggle");

menuButton.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", open);
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  });
});

// Rotating role in the hero
const roles = ["Frontend developer", "Backend developer", "Mobile app builder", "IT technician"];
const roleText = document.getElementById("role-rotator");
let roleIndex = 0;

setInterval(() => {
  roleIndex = (roleIndex + 1) % roles.length;
  roleText.textContent = roles[roleIndex];
}, 2500);

// Highlight the nav link of the section on screen
const sections = document.querySelectorAll("main section[id]");
const links = nav.querySelectorAll("a");

window.addEventListener("scroll", () => {
  let current = "";
  sections.forEach((section) => {
    if (window.scrollY >= section.offsetTop - 120) current = section.id;
  });
  links.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === "#" + current);
  });
});

// Contact form (no server, so it only shows a confirmation)
const form = document.getElementById("contact-form");
const status = document.getElementById("form-status");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  status.textContent = "Thanks, " + form.name.value + "! Your message is ready to send.";
  form.reset();
});
