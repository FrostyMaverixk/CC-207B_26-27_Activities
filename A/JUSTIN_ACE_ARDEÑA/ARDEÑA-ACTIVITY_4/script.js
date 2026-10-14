// ===== FEATURE: footer year (auto-updates) =====
document.getElementById("yr").textContent = new Date().getFullYear();

// FEATURE: burger menu
const burger = document.querySelector(".burger");
const menu = document.getElementById("menu");

function setMenu(open) {
  menu.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", String(open));
  burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}
burger.addEventListener("click", () =>
  setMenu(!menu.classList.contains("open")),
);
menu.addEventListener("click", (e) => {
  if (e.target.closest("a")) setMenu(false);
});
document.addEventListener("click", (e) => {
  if (!e.target.closest(".topbar")) setMenu(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && menu.classList.contains("open")) {
    setMenu(false);
    burger.focus();
  }
});
addEventListener("resize", () => {
  if (innerWidth > 760) setMenu(false);
});

// FEATURE: scroll progress bar
const bar = document.querySelector(".progress");
let ticking = false;
addEventListener(
  "scroll",
  () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
      ticking = false;
    });
  },
  { passive: true },
);

// FEATURE: scroll reveal (staggered rows)
if ("IntersectionObserver" in window) {
  const items = document.querySelectorAll(
    "main > section:not(.hero) > :is(h2, p, .project), .kv > div, .facts > div",
  );
  const reveal = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        reveal.unobserve(entry.target);
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
  );

  items.forEach((el) => {
    const siblings = el.parentElement.matches(".kv, .facts")
      ? [...el.parentElement.children]
      : [];
    el.style.setProperty("--d", `${Math.min(siblings.indexOf(el), 6) * 0.06}s`);
    el.classList.add("reveal");
    reveal.observe(el);
  });

  // FEATURE: highlight current section in nav
  const links = [...document.querySelectorAll("nav a")];
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) =>
          a.classList.toggle(
            "active",
            a.getAttribute("href") === `#${entry.target.id}`,
          ),
        );
      });
    },
    { rootMargin: "-40% 0px -55% 0px" },
  );
  document
    .querySelectorAll("main > section[id]")
    .forEach((s) => spy.observe(s));
}