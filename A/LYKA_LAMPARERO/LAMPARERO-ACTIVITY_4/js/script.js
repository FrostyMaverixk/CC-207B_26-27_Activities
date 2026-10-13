// Mobile menu
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");

menuToggle.addEventListener("click", () => {
  navLinks.classList.toggle("open");
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => navLinks.classList.remove("open"));
});

// Reveal on scroll
const revealItems = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);
revealItems.forEach((item) => revealObserver.observe(item));

// Highlight active nav link
const sectionIds = ["about", "work", "stack", "contact"];
const sections = sectionIds
  .map((id) => document.getElementById(id))
  .filter(Boolean);
const links = navLinks.querySelectorAll("a");

function updateActiveLink() {
  let current = "about";
  sections.forEach((section) => {
    if (window.scrollY >= section.offsetTop - 160) {
      current = section.id;
    }
  });
  links.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === "#" + current);
  });
}

window.addEventListener("scroll", updateActiveLink);
updateActiveLink();

// Resume preview modal
const resumeLink = document.getElementById("resume-open");
const resumeModal = document.getElementById("resume-modal");
const resumeFrame = document.getElementById("resume-frame");

if (resumeLink && resumeModal && resumeFrame) {
  const resumeUrl = resumeLink.getAttribute("href");
  const closeButton = resumeModal.querySelector(".modal-close");
  let lastFocused = null;

  // Phones and browsers without an inline PDF viewer just open the file in a new tab
  const canPreview = () =>
    window.matchMedia("(min-width: 701px)").matches &&
    navigator.pdfViewerEnabled !== false;

  function openResume(event) {
    if (!canPreview()) return;
    event.preventDefault();
    lastFocused = document.activeElement;
    // Hide the browser's PDF toolbar and thumbnails so only the paper shows
    resumeFrame.src =
      resumeUrl + "#toolbar=0&navpanes=0&pagemode=none&view=FitH&zoom=page-width";
    resumeModal.classList.add("open");
    resumeModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    closeButton.focus();
  }

  function closeResume() {
    resumeModal.classList.remove("open");
    resumeModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    resumeFrame.src = "about:blank";
    if (lastFocused) lastFocused.focus();
  }

  resumeLink.addEventListener("click", openResume);
  closeButton.addEventListener("click", closeResume);
  resumeModal.addEventListener("click", (event) => {
    if (event.target === resumeModal) closeResume();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && resumeModal.classList.contains("open")) {
      closeResume();
    }
  });
}

// GitHub contribution graph
const ghUser = "eysikiel";
const ghDots = document.getElementById("gh-dots");
const ghStats = document.getElementById("gh-stats");

async function fetchContributions(attempts = 2) {
  for (let i = 0; i < attempts; i++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(
        "https://github-contributions-api.jogruber.de/v4/" + ghUser + "?y=last",
        { signal: controller.signal }
      );

      if (!res.ok) {
        throw new Error("Contribution API returned " + res.status);
      }

      const data = await res.json();

      if (!data.contributions || !data.contributions.length) {
        throw new Error("No contribution data returned.");
      }

      return data.contributions;
    } catch (error) {
      console.error("GitHub contribution error (attempt " + (i + 1) + "):", error);
    } finally {
      clearTimeout(timeout);
    }
  }

  return null;
}

function drawDots(cells, cols) {
  ghDots.style.setProperty("--cols", cols);
  ghDots.replaceChildren(...cells);
}

function makeDot(level, title) {
  const dot = document.createElement("span");
  dot.className = "gh-dot";
  dot.dataset.level = level;
  if (title) dot.title = title;
  return dot;
}

async function loadGithubGraph() {
  if (!ghDots || !ghStats) {
    console.warn("Missing #gh-dots or #gh-stats in index.html");
    return;
  }

  let total = null;
  let repos = null;

  const days = await fetchContributions();

  if (days) {
    // Pad the first week so Sunday is row 1
    const firstDay = new Date(days[0].date + "T00:00:00").getDay();
    const cells = [];

    for (let i = 0; i < firstDay; i++) {
      const blank = makeDot(0);
      blank.classList.add("empty");
      cells.push(blank);
    }

    total = 0;

    days.forEach((day) => {
      total += day.count;
      cells.push(makeDot(day.level, day.count + " contributions on " + day.date));
    });

    drawDots(cells, Math.ceil(cells.length / 7));
  } else {
    // Keep the graph visible (empty dots) instead of hiding it
    const cells = Array.from({ length: 53 * 7 }, () => makeDot(0));
    drawDots(cells, 53);
  }

  // Public repository count
  try {
    const res = await fetch("https://api.github.com/users/" + ghUser);

    if (!res.ok) {
      throw new Error("GitHub user API returned " + res.status);
    }

    const user = await res.json();
    repos = user.public_repos;
  } catch (error) {
    console.error("GitHub repository error:", error);
  }

  const parts = [];

  if (total !== null) {
    parts.push(total + " contributions in the last year");
  }

  if (repos !== null) {
    parts.push(repos + " public repos");
  }

  ghStats.textContent = parts.length
    ? parts.join(" | ")
    : "Could not load GitHub stats. Visit github.com/" + ghUser;
}

loadGithubGraph();