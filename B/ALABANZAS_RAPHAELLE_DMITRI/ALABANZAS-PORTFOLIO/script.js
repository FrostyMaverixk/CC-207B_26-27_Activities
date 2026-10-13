// ==============================
// PORTFOLIO JAVASCRIPT
// ==============================

// ------------------------------
// THEME TOGGLE
// ------------------------------

const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");

const savedTheme = localStorage.getItem("portfolio-theme");

if (savedTheme === "dark") {
  root.dataset.theme = "dark";
}

function updateThemeButton() {
  const darkMode = root.dataset.theme === "dark";

  themeToggle.textContent = darkMode ? "☼" : "◐";

  themeToggle.setAttribute(
    "aria-label",
    darkMode
      ? "Switch to light theme"
      : "Switch to dark theme"
  );

  themeToggle.title = darkMode
    ? "Switch to light theme"
    : "Switch to dark theme";
}

updateThemeButton();

themeToggle.addEventListener("click", () => {
  const isDark = root.dataset.theme === "dark";

  root.dataset.theme = isDark ? "light" : "dark";

  localStorage.setItem(
    "portfolio-theme",
    root.dataset.theme
  );

  updateThemeButton();
});


// ------------------------------
// PROJECT FILTERS
// ------------------------------

const filters = document.querySelectorAll(".filter");
const cards = document.querySelectorAll(".project-card");

filters.forEach((filter) => {
  filter.addEventListener("click", () => {

    // Remove active state from all filters
    filters.forEach((item) => {
      item.classList.remove("active");
    });

    // Activate clicked filter
    filter.classList.add("active");

    const selectedCategory = filter.dataset.filter;

    cards.forEach((card) => {

      const categories = card.dataset.category
        ? card.dataset.category.split(" ")
        : [];

      const matches =
        selectedCategory === "all" ||
        categories.includes(selectedCategory);

      card.classList.toggle(
        "hidden",
        !matches
      );
    });
  });
});


// ------------------------------
// SCROLL REVEAL ANIMATION
// ------------------------------

const observer = new IntersectionObserver(
  (entries) => {

    entries.forEach((entry) => {

      if (entry.isIntersecting) {

        entry.target.classList.add("in");

        // Stop observing after animation
        observer.unobserve(entry.target);
      }

    });

  },
  {
    threshold: 0.08
  }
);


// Elements that should animate into view
const revealElements = document.querySelectorAll(
  "section, .project-card, .writing-card, .timeline-item, .skill-row"
);

revealElements.forEach((element) => {

  element.classList.add("reveal");

  observer.observe(element);

});


// ------------------------------
// COPY CONTACT EMAIL
// ------------------------------

const copyButton =
  document.getElementById("copyContact");

const toast =
  document.getElementById("toast");

let toastTimer;


// Copy email when button is clicked
copyButton.addEventListener("click", async () => {

  const email = copyButton.dataset.copy;

  try {

    await navigator.clipboard.writeText(email);

    toast.textContent = `Copied: ${email}`;

  } catch (error) {

    // Fallback when clipboard permission fails
    toast.textContent = `Email: ${email}`;

  }

  // Show toast notification
  toast.classList.add("show");

  // Reset previous timer
  clearTimeout(toastTimer);

  // Hide toast after 2.2 seconds
  toastTimer = setTimeout(() => {

    toast.classList.remove("show");

  }, 2200);

});


// ------------------------------
// CURRENT YEAR
// ------------------------------

const yearElement = document.getElementById("year");

if (yearElement) {
  yearElement.textContent =
    new Date().getFullYear();
}