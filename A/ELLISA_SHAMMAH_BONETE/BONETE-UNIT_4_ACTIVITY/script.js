const themeButton = document.querySelector("#theme-toggle");
const dialog = document.querySelector("#search-dialog");
const searchInput = document.querySelector("#section-search");
const searchLinks = [...document.querySelectorAll(".search-results a")];
const sections = [...document.querySelectorAll("main > section")];
const sectionDots = [...document.querySelectorAll(".section-dot")];
const progress = document.querySelector(".reading-progress");

document.querySelector("#year").textContent = new Date().getFullYear();

// Theme preference
function setTheme(theme) {
  const isLight = theme === "light";
  document.body.classList.toggle("light", isLight);
  themeButton.setAttribute("aria-pressed", String(isLight));
  themeButton.setAttribute(
    "aria-label",
    isLight ? "Switch to dark theme" : "Switch to light theme"
  );
}

let savedTheme = "dark";

try {
  savedTheme = localStorage.getItem("portfolio-theme") || "dark";
} catch {
  // Theme switching still works when storage is blocked.
}

setTheme(savedTheme);

themeButton.addEventListener("click", () => {
  const theme = document.body.classList.contains("light") ? "dark" : "light";
  setTheme(theme);

  try {
    localStorage.setItem("portfolio-theme", theme);
  } catch {
    // Remembering the preference is optional.
  }
});

// Philippine clock
const clockFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Manila",
  hour: "numeric",
  minute: "2-digit",
  hour12: true
});

function updateClock() {
  const parts = clockFormatter.formatToParts(new Date());
  const get = type => parts.find(part => part.type === type)?.value || "";

  document.querySelector("#clock").innerHTML =
    `${get("hour")}:${get("minute")} <small>${get("dayPeriod")}</small>`;
}

updateClock();
setInterval(updateClock, 1000);

// Section search
function filterSections() {
  const query = searchInput.value.toLowerCase().trim();
  let matches = 0;

  searchLinks.forEach(link => {
    const visible = link.textContent.toLowerCase().includes(query);
    link.hidden = !visible;
    if (visible) matches++;
  });

  document.querySelector("#no-results").hidden = matches > 0;
}

function openSearch() {
  if (dialog.open) return;

  searchInput.value = "";
  filterSections();
  dialog.showModal();
  searchInput.focus();
}

document.querySelector("#search-open").addEventListener("click", openSearch);
document.querySelector("#search-close").addEventListener("click", () => {
  dialog.close();
});

searchInput.addEventListener("input", filterSections);

document.addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    if (dialog.open) dialog.close();
    else openSearch();
  }
});

searchLinks.forEach(link => {
  link.addEventListener("click", () => dialog.close());
});

searchInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    const firstMatch = searchLinks.find(link => !link.hidden);
    if (firstMatch) {
      event.preventDefault();
      firstMatch.click();
    }
  }
});

themeButton.addEventListener("click", () => {
  themeButton.classList.remove("is-spinning");

  // Restart the animation, even on repeated clicks.
  void themeButton.offsetWidth;

  themeButton.classList.add("is-spinning");
});

themeButton.addEventListener("animationend", () => {
  themeButton.classList.remove("is-spinning");
});

// Reading progress and active section
function updateReadingPosition() {
  const scrollable =
    document.documentElement.scrollHeight - window.innerHeight;

  const ratio = scrollable > 0
    ? Math.min(1, Math.max(0, window.scrollY / scrollable))
    : 0;

  progress.style.transform = `scaleX(${ratio})`;

  let current = sections[0].id;

  sections.forEach(section => {
    if (section.getBoundingClientRect().top <= 160) {
      current = section.id;
    }
  });

  if (scrollable > 0 && window.scrollY >= scrollable - 4) {
    current = sections[sections.length - 1].id;
  }

  sectionDots.forEach(dot => {
    const active = dot.getAttribute("href") === `#${current}`;
    dot.classList.toggle("active", active);

    if (active) dot.setAttribute("aria-current", "location");
    else dot.removeAttribute("aria-current");
  });
}

let scrollScheduled = false;

window.addEventListener("scroll", () => {
  if (scrollScheduled) return;
  scrollScheduled = true;

  requestAnimationFrame(() => {
    updateReadingPosition();
    scrollScheduled = false;
  });
}, { passive: true });

window.addEventListener("resize", updateReadingPosition);
updateReadingPosition();