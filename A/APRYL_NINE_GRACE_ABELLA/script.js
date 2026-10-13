const root = document.documentElement;

const landingPage = document.getElementById("landingPage");
const portfolioPage = document.getElementById("portfolioPage");

const enterPortfolioButtons = document.querySelectorAll(".enter-portfolio-button");
const goToLandingButtons = document.querySelectorAll(".go-to-landing");

const navLinks = document.querySelectorAll(".nav-link");
const contentPanels = document.querySelectorAll(".content-panel");
const panelButtons = document.querySelectorAll(".panel-button");

const mobileMenuButton = document.getElementById("mobileMenuButton");
const mobileThemeButton = document.getElementById("mobileThemeButton");
const landingThemeButton = document.getElementById("landingThemeButton");

const sidebar = document.getElementById("sidebar");
const themeMenu = document.getElementById("themeMenu");
const themeOptions = document.querySelectorAll(".theme-option");

const THEME_KEY = "apryl-portfolio-theme";
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

function getSavedThemeMode() {
  return localStorage.getItem(THEME_KEY) || "system";
}

function getActiveTheme(mode) {
  if (mode === "system") {
    return systemTheme.matches ? "dark" : "light";
  }

  return mode;
}

function updateThemeIcons(activeTheme) {
  const iconClass = activeTheme === "dark" ? "ph ph-moon" : "ph ph-sun";

  if (landingThemeButton) {
    landingThemeButton.querySelector("i").className = iconClass;
  }

  if (mobileThemeButton) {
    mobileThemeButton.querySelector("i").className = iconClass;
  }
}

function updateThemeButtons(selectedMode) {
  themeOptions.forEach((option) => {
    const isSelected = option.dataset.themeChoice === selectedMode;

    option.classList.toggle("selected", isSelected);
    option.setAttribute("aria-pressed", isSelected ? "true" : "false");
  });
}

function applyTheme(mode) {
  const activeTheme = getActiveTheme(mode);

  root.setAttribute("data-theme", activeTheme);
  root.setAttribute("data-theme-mode", mode);

  localStorage.setItem(THEME_KEY, mode);

  updateThemeIcons(activeTheme);
  updateThemeButtons(mode);
}

function closeThemeMenu() {
  if (themeMenu) {
    themeMenu.classList.remove("open");
  }

  if (landingThemeButton) {
    landingThemeButton.setAttribute("aria-expanded", "false");
  }

  if (mobileThemeButton) {
    mobileThemeButton.setAttribute("aria-expanded", "false");
  }
}

function closeMobileSidebar() {
  if (!sidebar || !mobileMenuButton) {
    return;
  }

  sidebar.classList.remove("open");

  mobileMenuButton.querySelector("i").className = "ph ph-list";
  mobileMenuButton.setAttribute("aria-label", "Open navigation menu");
}

function showLanding(updateHash = true) {
  landingPage.classList.add("active-page");
  portfolioPage.classList.remove("active-page");

  closeMobileSidebar();
  closeThemeMenu();

  if (updateHash) {
    window.location.hash = "landing";
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function showPortfolio(updateHash = true) {
  landingPage.classList.remove("active-page");
  portfolioPage.classList.add("active-page");

  closeThemeMenu();

  if (updateHash) {
    window.location.hash = "portfolio";
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function showPanel(panelName, updateHash = true) {
  contentPanels.forEach((panel) => {
    const shouldShow = panel.dataset.panel === panelName;

    panel.classList.toggle("active-panel", shouldShow);
  });

  navLinks.forEach((link) => {
    const isActive = link.dataset.page === panelName;

    link.classList.toggle("active", isActive);
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });

  closeMobileSidebar();

  if (updateHash) {
    window.location.hash = panelName;
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function loadFromHash() {
  const hash = window.location.hash.replace("#", "");
  const validPages = ["home", "skills", "projects", "contact", "about"];

  if (validPages.includes(hash)) {
    showPortfolio(false);
    showPanel(hash, false);
    return;
  }

  if (hash === "portfolio") {
    showPortfolio(false);
    showPanel("home", false);
    return;
  }

  showLanding(false);
}

/* Set stored Light / Dark / System theme */
applyTheme(getSavedThemeMode());

systemTheme.addEventListener("change", () => {
  if (getSavedThemeMode() === "system") {
    applyTheme("system");
  }
});

/* Theme buttons */
themeOptions.forEach((option) => {
  option.addEventListener("click", () => {
    applyTheme(option.dataset.themeChoice);
    closeThemeMenu();
  });
});

/* Landing page screen-mode menu */
if (landingThemeButton && themeMenu) {
  landingThemeButton.addEventListener("click", () => {
    const isOpen = themeMenu.classList.toggle("open");

    landingThemeButton.setAttribute(
      "aria-expanded",
      isOpen ? "true" : "false"
    );
  });
}

/* Mobile screen-mode menu */
if (mobileThemeButton && themeMenu) {
  mobileThemeButton.addEventListener("click", () => {
    const isOpen = themeMenu.classList.toggle("open");

    mobileThemeButton.setAttribute(
      "aria-expanded",
      isOpen ? "true" : "false"
    );

    if (isOpen) {
      themeMenu.style.position = "fixed";
      themeMenu.style.right = "20px";
      themeMenu.style.top = "75px";
    }
  });
}

/* Close mode menu if user clicks outside */
document.addEventListener("click", (event) => {
  const clickedThemeButton =
    event.target.closest("#landingThemeButton") ||
    event.target.closest("#mobileThemeButton");

  const clickedThemeMenu = event.target.closest("#themeMenu");

  if (!clickedThemeButton && !clickedThemeMenu) {
    closeThemeMenu();
  }
});

/* Landing -> Portfolio */
enterPortfolioButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showPortfolio(true);
    showPanel("home", false);
  });
});

/* Portfolio -> Landing */
goToLandingButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showLanding(true);
  });
});

/* Sidebar navigation changes only the right-side panel */
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    showPanel(link.dataset.page, true);
  });
});

/* Buttons inside Home / Projects panels */
panelButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showPanel(button.dataset.target, true);
  });
});

/* Mobile menu */
if (mobileMenuButton && sidebar) {
  mobileMenuButton.addEventListener("click", () => {
    sidebar.classList.toggle("open");

    const isOpen = sidebar.classList.contains("open");

    mobileMenuButton.querySelector("i").className = isOpen
      ? "ph ph-x"
      : "ph ph-list";

    mobileMenuButton.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu"
    );
  });
}

/* Handle direct URLs and browser Back / Forward */
window.addEventListener("hashchange", loadFromHash);

loadFromHash();