(function () {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const canvas = document.getElementById("mechanism");
  if (canvas) initMechanism(canvas);

  const revealTargets = document.querySelectorAll(
    ".hero-copy, .hero-mech, .hero-photo-row, .section-head, .about-body, .spec-list, .case, .skills-intro, .skill-grid, .log, .contact-copy, .contact-list"
  );

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (!entry.isIntersecting) return;
          entry.target.style.animationDelay = `${Math.min(i % 4, 3) * 70}ms`;
          entry.target.classList.add("reveal");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealTargets.forEach((el) => io.observe(el));
  }

  const cases = document.querySelectorAll(".case");
  cases.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const visual = card.querySelector(".proto");
      if (!visual) return;
      visual.style.transform = `translate(${x * 6}px, 0)`;
    });
    card.addEventListener("pointerleave", () => {
      const visual = card.querySelector(".proto");
      if (visual) visual.style.transform = "";
    });
  });

  document.querySelectorAll(".proto").forEach((el) => {
    el.style.transition = "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)";
  });
})();

function initMechanism(canvas) {
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const nodes = [
    { x: 0.18, y: 0.28, r: 5 },
    { x: 0.42, y: 0.18, r: 4 },
    { x: 0.62, y: 0.32, r: 6 },
    { x: 0.78, y: 0.22, r: 4 },
    { x: 0.3, y: 0.55, r: 4 },
    { x: 0.52, y: 0.52, r: 7 },
    { x: 0.74, y: 0.58, r: 4 },
    { x: 0.22, y: 0.78, r: 4 },
    { x: 0.48, y: 0.8, r: 5 },
    { x: 0.7, y: 0.82, r: 4 },
  ];

  const links = [
    [0, 1],
    [1, 2],
    [2, 3],
    [0, 4],
    [4, 5],
    [5, 2],
    [2, 6],
    [5, 6],
    [4, 7],
    [5, 8],
    [6, 9],
    [7, 8],
    [8, 9],
  ];

  const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  let width = 0;
  let height = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(320, rect.width);
    height = Math.max(240, rect.width * 0.72);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resize();
  window.addEventListener("resize", resize);

  canvas.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.tx = (event.clientX - rect.left) / rect.width;
    pointer.ty = (event.clientY - rect.top) / rect.height;
  });

  canvas.addEventListener("pointerleave", () => {
    pointer.tx = 0.5;
    pointer.ty = 0.5;
  });

  function draw() {
    pointer.x += (pointer.tx - pointer.x) * 0.08;
    pointer.y += (pointer.ty - pointer.y) * 0.08;

    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#1a1714";
    ctx.fillStyle = "#1a1714";

    const shifted = nodes.map((node, index) => {
      const pull = index === 5 ? 22 : 10;
      return {
        x: node.x * width + (pointer.x - 0.5) * pull,
        y: node.y * height + (pointer.y - 0.5) * pull,
        r: node.r,
      };
    });

    links.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(shifted[a].x, shifted[a].y);
      ctx.lineTo(shifted[b].x, shifted[b].y);
      ctx.stroke();
    });

    shifted.forEach((node, index) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fillStyle = index === 5 ? "#1f5eff" : "#faf7f1";
      ctx.fill();
      ctx.strokeStyle = "#1a1714";
      ctx.stroke();
    });

    const hub = shifted[5];
    ctx.beginPath();
    ctx.arc(hub.x, hub.y, 16, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(26,23,20,0.35)";
    ctx.stroke();

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}
