(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const header = document.querySelector(".site-header");
  const navToggle = document.querySelector(".nav-toggle");
  const siteNav = document.getElementById("site-nav");
  const navLinks = document.querySelectorAll(".nav-link");

  function setMenu(open) {
    siteNav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  navToggle.addEventListener("click", () => {
    setMenu(!siteNav.classList.contains("is-open"));
  });

  navLinks.forEach((link) => link.addEventListener("click", () => setMenu(false)));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && siteNav.classList.contains("is-open")) {
      setMenu(false);
      navToggle.focus();
    }
  });
  document.addEventListener("click", (e) => {
    if (siteNav.classList.contains("is-open") && !header.contains(e.target)) setMenu(false);
  });

  window.matchMedia("(min-width: 761px)").addEventListener("change", () => setMenu(false));

  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const sections = document.querySelectorAll("main section[id]");

  function setActive(id) {
    navLinks.forEach((link) => {
      const isMatch = link.getAttribute("href") === "#" + id;
      link.classList.toggle("is-active", isMatch);
      if (isMatch) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" } 
    );
    sections.forEach((section) => sectionObserver.observe(section));
  }
  setActive("home");

  const revealItems = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window && !prefersReducedMotion.matches) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target); 
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealItems.forEach((el) => revealObserver.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add("is-visible"));
  }

  const canvas = document.getElementById("fireflies");
  const ctx = canvas.getContext("2d");
  const glow = document.querySelector(".cursor-glow");
  const layers = document.querySelectorAll(".blob-layer");

  let width = 0;
  let height = 0;
  let dpr = 1;
  let fireflies = [];
  let rafId = null;

  function makeSprite(r, g, b) {
    const size = 64;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const cx = c.getContext("2d");
    const grad = cx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
    grad.addColorStop(0.35, `rgba(${r},${g},${b},0.45)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    cx.fillStyle = grad;
    cx.fillRect(0, 0, size, size);
    return c;
  }
  const sprites = [
    makeSprite(255, 224, 110), 
    makeSprite(255, 246, 190), 
    makeSprite(150, 205, 140), 
  ];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5); 
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.max(14, Math.min(34, Math.round(width / 46)));
    fireflies = Array.from({ length: count }, makeFirefly);
  }

  function makeFirefly() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      size: 14 + Math.random() * 30,            
      vx: (Math.random() - 0.5) * 0.25,
      vy: -0.05 - Math.random() * 0.22,          
      phase: Math.random() * Math.PI * 2,        
      speed: 0.4 + Math.random() * 0.9,          
      sprite: sprites[Math.floor(Math.random() * sprites.length)],
    };
  }

  function drawFrame(time) {
    ctx.clearRect(0, 0, width, height);
    const t = time / 1000;

    for (const f of fireflies) {
      f.x += f.vx + Math.sin(t * 0.5 + f.phase) * 0.12;
      f.y += f.vy;

      if (f.y < -f.size) { f.y = height + f.size; f.x = Math.random() * width; }
      if (f.x < -f.size) f.x = width + f.size;
      if (f.x > width + f.size) f.x = -f.size;

      ctx.globalAlpha = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * f.speed + f.phase));
      ctx.drawImage(f.sprite, f.x - f.size / 2, f.y - f.size / 2, f.size, f.size);
    }
    ctx.globalAlpha = 1;
  }

  function loop(time) {
    drawFrame(time);
    updateMouse();
    rafId = requestAnimationFrame(loop);
  }

  const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const eased = { x: mouse.x, y: mouse.y };
  let mouseActive = false;

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    if (!mouseActive && glow && finePointer.matches) {
      mouseActive = true;
      glow.classList.add("is-on");
    }
  }, { passive: true });

  document.addEventListener("pointerleave", () => {
    mouseActive = false;
    if (glow) glow.classList.remove("is-on");
  });

  function updateMouse() {
    if (!finePointer.matches) return;
    eased.x += (mouse.x - eased.x) * 0.08;
    eased.y += (mouse.y - eased.y) * 0.08;

    if (glow) glow.style.transform = `translate3d(${eased.x}px, ${eased.y}px, 0)`;

    const nx = (eased.x / width - 0.5) * 2;
    const ny = (eased.y / height - 0.5) * 2;
    layers.forEach((layer) => {
      const depth = Number(layer.dataset.depth) || 0;
      layer.style.transform = `translate3d(${nx * depth}px, ${ny * depth}px, 0)`;
    });
  }

  function start() {
    if (rafId === null) rafId = requestAnimationFrame(loop);
  }
  function stop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function initBackground() {
    resize();
    if (prefersReducedMotion.matches) {
      drawFrame(0); 
      stop();
    } else {
      start();
    }
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initBackground, 150);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else if (!prefersReducedMotion.matches) start();
  });

  prefersReducedMotion.addEventListener("change", initBackground);

  initBackground();
})();