// Mobile menu
const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("nav");
toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});
nav.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", false);
  }
});

// Project filter
const chips = document.querySelectorAll(".chip");
const cards = document.querySelectorAll(".card");
chips.forEach((chip) =>
  chip.addEventListener("click", () => {
    chips.forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    const f = chip.dataset.filter;
    cards.forEach((card) =>
      card.classList.toggle("hidden", f !== "all" && card.dataset.type !== f),
    );
  }),
);

// Contact form: validates, then opens the visitor's email app
const form = document.getElementById("contact-form");
const status = form.querySelector(".form-status");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const { name, email, message } = Object.fromEntries(new FormData(form));
  if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email) || !message.trim()) {
    status.textContent = "Please enter your name, a valid email and a message.";
    status.classList.add("error");
    return;
  }
  status.classList.remove("error");
  status.textContent = "Opening your email app…";
  const subject = encodeURIComponent("Portfolio message from " + name);
  const body = encodeURIComponent(message + "\n\n" + name + " (" + email + ")");
  window.location.href = `mailto:joseemmanuelsariego@gmail.com?subject=${subject}&body=${body}`;
});

document.getElementById("year").textContent = new Date().getFullYear();
