/**
 * CADANGIN-PORTFOLIO — Vanilla JavaScript
 * Matching the exact interactions of markcadangin.me
 */

document.addEventListener("DOMContentLoaded", function () {
  // 1. Navbar scroll blur & border effect
  var navbar = document.getElementById("main-header");
  function handleScroll() {
    if (window.scrollY > 20) {
      navbar.classList.add("bg-[#090a0d]/95", "backdrop-blur-md", "border-b", "border-zinc-800", "py-3.5", "shadow-sm");
      navbar.classList.remove("bg-transparent", "py-5");
    } else {
      navbar.classList.remove("bg-[#090a0d]/95", "backdrop-blur-md", "border-b", "border-zinc-800", "py-3.5", "shadow-sm");
      navbar.classList.add("bg-transparent", "py-5");
    }
  }
  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

  // 2. Mobile Menu Drawer
  var menuBtn = document.getElementById("mobile-menu-btn");
  var mobileDrawer = document.getElementById("mobile-drawer");
  var menuIcon = document.getElementById("menu-icon");
  var closeIcon = document.getElementById("close-icon");

  if (menuBtn && mobileDrawer) {
    menuBtn.addEventListener("click", function () {
      var isHidden = mobileDrawer.classList.contains("hidden");
      if (isHidden) {
        mobileDrawer.classList.remove("hidden");
        menuIcon.classList.add("hidden");
        closeIcon.classList.remove("hidden");
      } else {
        mobileDrawer.classList.add("hidden");
        menuIcon.classList.remove("hidden");
        closeIcon.classList.add("hidden");
      }
    });

    var drawerLinks = mobileDrawer.querySelectorAll("a");
    drawerLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        mobileDrawer.classList.add("hidden");
        menuIcon.classList.remove("hidden");
        closeIcon.classList.add("hidden");
      });
    });
  }

  // 3. Project Filter Tabs
  var filterButtons = document.querySelectorAll(".filter-tab-btn");
  var projectCards = document.querySelectorAll(".project-item");
  var courseworkSection = document.getElementById("coursework-section");

  filterButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var category = btn.getAttribute("data-filter");

      filterButtons.forEach(function (b) {
        b.classList.remove("bg-zinc-100", "text-zinc-900", "font-semibold", "shadow-sm");
        b.classList.add("text-zinc-400", "hover:text-zinc-200", "hover:bg-zinc-800/60");
        var badge = b.querySelector(".badge-counter");
        if (badge) {
          badge.classList.remove("bg-zinc-200", "text-zinc-800");
          badge.classList.add("bg-zinc-800", "text-zinc-500");
        }
      });

      btn.classList.add("bg-zinc-100", "text-zinc-900", "font-semibold", "shadow-sm");
      btn.classList.remove("text-zinc-400", "hover:text-zinc-200", "hover:bg-zinc-800/60");
      var activeBadge = btn.querySelector(".badge-counter");
      if (activeBadge) {
        activeBadge.classList.add("bg-zinc-200", "text-zinc-800");
        activeBadge.classList.remove("bg-zinc-800", "text-zinc-500");
      }

      projectCards.forEach(function (card) {
        var cardCat = card.getAttribute("data-category");
        if (category === "all" || cardCat === category) {
          card.classList.remove("hidden");
        } else {
          card.classList.add("hidden");
        }
      });

      if (courseworkSection) {
        if (category === "all") {
          courseworkSection.classList.remove("hidden");
        } else {
          courseworkSection.classList.add("hidden");
        }
      }
    });
  });

  // 4. Copy Email Functionality
  var copyBtn = document.getElementById("copy-email-btn");
  var emailAddress = "markcadangin@gmail.com";
  var copyIcon = document.getElementById("copy-icon");
  var checkIcon = document.getElementById("check-icon");
  var copyText = document.getElementById("copy-text");

  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(emailAddress).catch(function () {});
      } else {
        var ta = document.createElement("textarea");
        ta.value = emailAddress;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (_) {}
        document.body.removeChild(ta);
      }

      if (copyIcon && checkIcon && copyText) {
        copyIcon.classList.add("hidden");
        checkIcon.classList.remove("hidden");
        copyText.textContent = "Copied";
        copyText.classList.add("text-emerald-400");
        copyText.classList.remove("text-zinc-300");

        setTimeout(function () {
          copyIcon.classList.remove("hidden");
          checkIcon.classList.add("hidden");
          copyText.textContent = "Copy";
          copyText.classList.remove("text-emerald-400");
          copyText.classList.add("text-zinc-300");
        }, 2000);
      }
    });
  }

  // 5. Live Philippine Standard Time (Asia/Manila UTC+8)
  var phTimeEl = document.getElementById("ph-time");
  function updateTime() {
    if (!phTimeEl) return;
    try {
      var now = new Date();
      var formatted = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Manila",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }).format(now);
      phTimeEl.textContent = "Iloilo, PH · " + formatted + " (UTC+8)";
    } catch (_) {
      phTimeEl.textContent = "Iloilo, PH · UTC+8";
    }
  }
  updateTime();
  setInterval(updateTime, 60000);
});
