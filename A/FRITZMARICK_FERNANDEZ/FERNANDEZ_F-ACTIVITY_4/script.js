/* MarickLabs portfolio: all content lives in the DATA block below, so edits are one-line changes. */

/* ============ CONFIG ============ */
const CONFIG = {
  email: "fmafernandez325@gmail.com",
  sfxFile: "public/hoverSFX.mp3",   // put your hover sound here
  // Optional: paste a Firebase Realtime Database URL to count viewers across all devices.
  // Example: "https://your-project-default-rtdb.firebaseio.com"
  firebaseDbUrl: "",
};

/* ============ DATA ============ */
const SOCIALS = [
  { name: "GitHub", url: "https://github.com/Maricklabs", slug: "github" },
  { name: "LinkedIn", url: "https://www.linkedin.com/in/fritz-marick-fernandez-244709327", slug: "linkedin" },
  { name: "Instagram", url: "https://www.instagram.com/kiram.fr/", slug: "instagram" },
  { name: "Facebook", url: "https://www.facebook.com/fritzmarick.fernandez", slug: "facebook" },
];

const PROJECTS = {
  commissioned: [
    { name: "JT Smiles Dental Clinic", desc: "Marketing website for a local dental clinic.", url: "https://jtalunan-dental-clinic.vercel.app/" },
    { name: "PADANE Walking Stick", desc: "Emergency alert web app paired with a smart walking stick.", url: "https://padane-webapp.vercel.app/" },
    { name: "SPARKHUB", desc: "Official website for the SparkHub organization.", url: "https://spark-hub-website.vercel.app/" },
    { name: "Cyb Robotics Organization", desc: "Official website for the Cyb Robotics Organization.", url: "https://cyb-robotics-website.vercel.app/" },
  ],
  hobby: [
    { name: "Late Night Coders Lounge", desc: "A cozy hangout page for developers who code after dark.", url: "https://late-night-coders.vercel.app/" },
    { name: "IVARTar Legends", desc: "A fan-made showcase site for avatar legends.", url: "https://ivartar-legends.vercel.app/" },
    { name: "Digitalized Study Reviewers", desc: "Online reviewers for quick and organized studying.", url: "https://rvwrmt2sem2k26s.vercel.app/" },
    { name: "Valolabs.gg", desc: "A Valorant companion site for agents and strategies.", url: "https://valolabsgg.netlify.app/" },
    { name: "Realms of Runeterra", desc: "A lore and champions explorer for Runeterra fans.", url: "https://realmsofruneterra.netlify.app/" },
    { name: "PATHFIT Cocina", desc: "A cooking-themed website made for a PATHFIT class.", url: "https://fritzfernandezpathfit2website.my.canva.site/" },
    { name: "MangMarick Resto POS", desc: "A point-of-sale web app for a small restaurant.", url: "https://github.com/Maricklabs/mangmavrick-web-app.git" },
    { name: "WVSU PATH", desc: "Post Alumni Tracking Hub for WVSU graduates.", url: "https://github.com/vincenttamano/ITCWeb.git" },
    { name: "Portfolio on ICP Motoko", desc: "A personal portfolio built on the Internet Computer.", url: "https://github.com/Maricklabs/Devcon-icp-motoko-level2.git" },
  ],
  iot: [
    { name: "Solar Moisture Delivery", desc: "Solar powered automated moisture delivery on Arduino Uno." },
    { name: "Lettuce Hydroponics", desc: "Hydroponics system for lettuce growth on Arduino Uno." },
    { name: "RFID Vehicle Gate", desc: "Automated vehicle access gate using RFID on Arduino Uno." },
    { name: "Gas and Smoke Detector", desc: "Smart gas and smoke detection with SMS alerts on Arduino Uno." },
    { name: "ALIGMAT", desc: "Flood water level detection with emergency SMS alerts." },
    { name: "LumiShade", desc: "Solar umbrella with portable energy storage." },
  ],
};

const GEAR = {
  desk: [
    { name: "Lenovo IdeaPad Slim 3", desc: "512GB SSD, 16GB RAM. The daily driver for code and builds.", icon: "laptop", image: "public/laptop.png", url: "https://shopee.ph/search?keyword=lenovo%20ideapad%20slim%203%2016gb%20512gb" },
    { name: "MSI MP225V Monitor", desc: "21 inch display at 100Hz for smooth scrolling and long sessions.", icon: "monitor", image: "public/monitor.png", url: "https://shopee.ph/search?keyword=msi%20mp225v" },
    { name: "Redragon K530 White RGB", desc: "Tri-mode wireless mechanical keyboard.", icon: "keyboard", image: "public/keyboard.png", url: "https://shopee.ph/search?keyword=redragon%20k530%20white" },
    { name: "Mloong MX301 White", desc: "Tri-mode wireless mouse.", icon: "mouse", image: "public/mouse.png", url: "https://shopee.ph/search?keyword=mloong%20mx301" },
  ],
  edc: [
    { name: "Realme C85 4G", desc: "My everyday phone.", icon: "phone", image: "public/phone.png", url: "https://shopee.ph/search?keyword=realme%20c85%204g" },
    { name: "Anker Soundcore R50i", desc: "Earbuds for focus music and calls.", icon: "earbuds", image: "public/earbuds.png", url: "https://shopee.ph/search?keyword=anker%20soundcore%20r50i" },
  ],
};

/* [label, simple-icons slug] */
const STACK = [
  ["Frontend", [["JavaScript","javascript"],["TypeScript","typescript"],["React","react"],["Vite","vite"],["Next.js","nextdotjs"],["Tailwind CSS","tailwindcss"],["SCSS","sass"],["JavaFX","openjdk"],["Java Swing","openjdk"]]],
  ["Backend", [["Node.js","nodedotjs"],["PHP","php"],["PostgreSQL","postgresql"],["MySQL","mysql"],["MongoDB","mongodb"],["Firebase","firebase"],["Java","openjdk"],["C++","cplusplus"],["C","c"],["MicroPython","micropython"]]],
  ["IoT", [["Arduino","arduino"],["ESP32","espressif"],["MQTT","mqtt"]]],
  ["AI and Machine Learning", [["TensorFlow","tensorflow"],["MediaPipe","google"],["Teachable Machine","google"],["Grok","x"],["Gemini","googlegemini"],["Claude","claude"],["OpenAI","openai"]]],
  ["Developer Tools", [["Git","git"],["GitHub","github"],["VS Code","visualstudiocode"],["JetBrains IntelliJ","intellijidea"],["Eclipse","eclipseide"],["Apache NetBeans","apachenetbeanside"],["XAMPP","xampp"],["Qt","qt"]]],
  ["Design and Prototyping", [["Canva","canva"],["Figma","figma"],["Adobe Illustrator","adobeillustrator"]]],
  ["Networking", [["CISCO","cisco"],["Cisco Packet Tracer","cisco"]]],
];

const CERTS = [
  ["Networking", [
    { name: "CCNA: Introduction to Networks", by: "Cisco, certificate of completion" },
  ]],
  ["Cybersecurity", [
    { name: "Cybersecurity Fundamentals and Ethical Hacking", by: "Training" },
  ]],
  ["Development and design", [
    { name: "IthinkCodeCamp", by: "DEVCON Iloilo" },
    { name: "Unlocking UX/UI Essentials", by: "Crafting Human-Centered Digital Experiences" },
    { name: "Tech for All", by: "DigiHwy" },
  ]],
  ["Robotics and innovation", [
    { name: "Tech Training", by: "JNU (Jeju National University) x Cyb Robotics Organization" },
    { name: "IP 101: Intellectual Property Rights", by: "KTTBDC and SparkHub" },
  ]],
  ["Agile and teamwork", [
    { name: "Webinar on Agile and Scrum", by: "LinkedIT" },
  ]],
];

const EXPERIENCE = [
  { when: "2025 to 2026", title: "VP for Research and Development", org: "SPARKHUB Organization", url: "https://spark-hub-website.vercel.app/" },
  { when: "2025 to 2026", title: "VP for Research and Development", org: "Cyb Robotics Organization", url: "https://cyb-robotics-website.vercel.app/" },
  { when: "June to July 2026", title: "Part Time English Tutor", org: "Green International Technological College" },
];

const AFFILIATIONS = [
  { name: "SPARKHUB Organization", role: "VP for Research and Development, 2025 to 2026", url: "https://spark-hub-website.vercel.app/" },
  { name: "Cyb Robotics Organization", role: "VP for Research and Development, 2025 to 2026", url: "https://cyb-robotics-website.vercel.app/" },
];

const OFFERS = [
  { glyph: "</>", name: "Web development", desc: "Marketing sites, dashboards and web apps built with React, Next.js, Node and PHP." },
  { glyph: "[#]", name: "IoT prototyping", desc: "Arduino and ESP32 builds with sensors, RFID, SMS alerts and MQTT." },
  { glyph: "{*}", name: "Security basics", desc: "Secure-by-default review of your site or app, plus beginner friendly ethical hacking guidance." },
  { glyph: "(~)", name: "Network setup", desc: "Small network design and simulation in Cisco Packet Tracer." },
  { glyph: "<ui>", name: "UI and UX design", desc: "Wireframes and clickable prototypes in Figma and Canva." },
  { glyph: "[?]", name: "Project guidance", desc: "Research and capstone mentoring for robotics and IT students." },
];

/* ============ HELPERS ============ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
};
const theme = () => document.documentElement.getAttribute("data-theme");
const iconUrl = (slug) => `https://cdn.simpleicons.org/${slug}`;
const initials = (n) => n.replace(/[^A-Za-z0-9+ ]/g, "").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

/* Logo with automatic fallback to initials if the CDN has no icon */
function logo(name, slug) {
  return `<img src="${iconUrl(slug)}" data-slug="${slug}" data-name="${esc(name)}" alt="" loading="lazy" width="20" height="20" />`;
}
document.addEventListener("error", (e) => {
  const el = e.target;
  if (el.tagName === "IMG" && el.dataset.slug) {
    const g = document.createElement("span");
    g.className = "glyph";
    g.textContent = initials(el.dataset.name || "?");
    el.replaceWith(g);
  }
}, true);

/* ============ ASCII BRANDING ============ */
const FONT = {
  M: ["#...#","##.##","#.#.#","#...#","#...#"],
  A: [".###.","#...#","#####","#...#","#...#"],
  R: ["####.","#...#","####.","#..#.","#...#"],
  I: ["#####","..#..","..#..","..#..","#####"],
  C: [".####","#....","#....","#....",".####"],
  K: ["#...#","#..#.","###..","#..#.","#...#"],
  L: ["#....","#....","#....","#....","#####"],
  B: ["####.","#...#","####.","#...#","####."],
  S: [".####","#....",".###.","....#","####."],
};
function ascii(word) {
  const rows = ["", "", "", "", ""];
  for (const ch of word) {
    FONT[ch].forEach((r, i) => { rows[i] += [...r].map((c) => (c === "#" ? "██" : "  ")).join("") + "  "; });
  }
  return rows.map((r) => r.replace(/\s+$/, "")).join("\n");
}
function renderAscii() {
  $("#asciiTitle").textContent = ascii("MARICK") + "\n\n" + ascii("LABS");
}

/* ============ SOUND ============ */
const sfx = {
  on: store.get("ml-sound") === "on",
  unlocked: false,
  useBeep: false,
  ctx: null,
  last: 0,
  base: null,
  init() {
    this.base = new Audio(CONFIG.sfxFile);
    this.base.preload = "auto";
    this.base.volume = 0.35;
    this.base.addEventListener("error", () => { this.useBeep = true; });
    const unlock = () => { this.unlocked = true; };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
  },
  beep() {
    try {
      this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = "square"; o.frequency.value = 880;
      g.gain.setValueAtTime(0.03, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.06);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(); o.stop(this.ctx.currentTime + 0.07);
    } catch (e) {}
  },
  play() {
    if (!this.on || !this.unlocked) return;
    const now = performance.now();
    if (now - this.last < 60) return;
    this.last = now;
    if (this.useBeep) return this.beep();
    const a = this.base.cloneNode();
    a.volume = this.base.volume;
    a.play().catch(() => { this.useBeep = true; this.beep(); });
  },
};
document.addEventListener("mouseover", (e) => {
  const t = e.target.closest("a, button, .sfx, .card, .chip, .pill-list li");
  if (t && !t.contains(e.relatedTarget)) sfx.play();
});

const SOUND_PATHS = {
  on: "M11 5 6 9H3v6h3l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13",
  off: "M11 5 6 9H3v6h3l5 4V5zM16 9l5 6M21 9l-5 6",
};
const THEME_PATHS = {
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
};
function paintSound() {
  $("#soundLabel").textContent = sfx.on ? "Sound on" : "Sound off";
  $("#soundIcon").setAttribute("d", sfx.on ? SOUND_PATHS.on : SOUND_PATHS.off);
  $("#soundBtn").setAttribute("aria-pressed", String(sfx.on));
}

/* ============ THEME ============ */
function paintTheme() {
  const dark = theme() === "dark";
  $("#themeLabel").textContent = dark ? "Light Mode" : "Dark Mode";
  $("#themeIcon").setAttribute("d", dark ? THEME_PATHS.sun : THEME_PATHS.moon);
  $("#portrait").src = "public/maricklabsPic.png";
  $$("img[data-slug]").forEach((img) => { img.src = iconUrl(img.dataset.slug); });
  $$("img.plat").forEach((img) => { img.src = iconUrl(img.dataset.slug); });
}

/* ============ RENDERERS ============ */
function host(url) { try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return url; } }
function platform(url) {
  const h = host(url);
  if (h.includes("vercel")) return { slug: "vercel", name: "Vercel" };
  if (h.includes("netlify")) return { slug: "netlify", name: "Netlify" };
  if (h.includes("github")) return { slug: "github", name: "GitHub" };
  if (h.includes("canva")) return { slug: "canva", name: "Canva" };
  return { slug: "googlechrome", name: "Web" };
}
function projectCard(p) {
  const pl = platform(p.url);
  const shot = `https://image.thum.io/get/width/640/crop/400/${p.url}`;
  const isRepo = host(p.url).includes("github");
  return `
    <a class="card sfx" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">
      <div class="thumb">
        <img class="plat" data-slug="${pl.slug}" src="${iconUrl(pl.slug)}" alt="" />
        ${isRepo ? "" : `<img class="shot" src="${shot}" alt="Preview of ${esc(p.name)}" loading="lazy" onerror="this.remove()" />`}
      </div>
      <div class="card-body">
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.desc)}</p>
        <span class="tag">${isRepo ? "Source on GitHub" : esc(host(p.url))}</span>
      </div>
    </a>`;
}
const CHIP_ART = "┌─┬─┬─┐\n│▒│▒│▒│\n├─┼─┼─┤\n│▒│▒│▒│\n└─┴─┴─┘";
function iotCard(p) {
  return `
    <article class="card hoverable">
      <div class="thumb"><pre aria-hidden="true">${CHIP_ART}</pre></div>
      <div class="card-body">
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.desc)}</p>
        <span class="tag">Hardware build</span>
      </div>
    </article>`;
}
function gearCard(g, cat) {
  return `
    <a class="card gear-card sfx" href="${esc(g.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(g.name)}, find where to buy">
      <div class="gear-img"><img class="gear-photo" src="${esc(g.image)}" alt="${esc(g.name)} product thumbnail" loading="lazy" /></div>
      <div class="card-body">
        <span class="gear-cat">${cat}</span>
        <h3>${esc(g.name)}</h3>
        <p>${esc(g.desc)}</p>
        <span class="gear-arrow" aria-hidden="true">↗</span>
      </div>
    </a>`;
}

function render() {
  $("#socialLinks").innerHTML = SOCIALS.map((s) =>
    `<li><a class="sfx" href="${s.url}" target="_blank" rel="noopener noreferrer"><img src="${iconUrl(s.slug)}" data-slug="${s.slug}" data-name="${s.name}" alt="" />${s.name}</a></li>`).join("");

  const projCount = PROJECTS.commissioned.length + PROJECTS.hobby.length + PROJECTS.iot.length;
  const certCount = CERTS.reduce((n, [, items]) => n + items.length, 0);
  $("#stats").innerHTML = [
    [projCount, "Projects built"],
    [PROJECTS.iot.length, "IoT builds"],
    [certCount, "Certificates and trainings"],
    [AFFILIATIONS.length, "Organizations"],
  ].map(([n, l]) => `<div><dd>${n}</dd><dt>${l}</dt></div>`).join("");

  $("#homeProjects").innerHTML = PROJECTS.commissioned.map(projectCard).join("");
  $("#experience").innerHTML = EXPERIENCE.map((e) => `
    <li><time>${esc(e.when)}</time><div><h3>${esc(e.title)}</h3><p>${e.url ? `<a class="sfx" href="${e.url}" target="_blank" rel="noopener noreferrer">${esc(e.org)}</a>` : esc(e.org)}</p></div></li>`).join("");
  $("#homeCerts").innerHTML = CERTS.flatMap(([, items]) => items).map((c) => `<li>${esc(c.name)}</li>`).join("");
  $("#affiliations").innerHTML = AFFILIATIONS.map((a) => `
    <a class="card sfx" href="${a.url}" target="_blank" rel="noopener noreferrer"><div class="card-body"><h3>${esc(a.name)}</h3><p>${esc(a.role)}</p><span class="tag">${esc(host(a.url))}</span></div></a>`).join("");

  $("#gearDesk").innerHTML = GEAR.desk.map((g) => gearCard(g, "Desk setup")).join("");
  $("#gearEdc").innerHTML = GEAR.edc.map((g) => gearCard(g, "Everyday carry")).join("");

  $("#projCommissioned").innerHTML = PROJECTS.commissioned.map(projectCard).join("");
  $("#projHobby").innerHTML = PROJECTS.hobby.map(projectCard).join("");
  $("#projIot").innerHTML = PROJECTS.iot.map(iotCard).join("");

  $("#stackGroups").innerHTML = STACK.map(([title, items]) => `
    <div class="group"><h2>${title}</h2><div class="chips">
      ${items.map(([n, slug]) => `<span class="chip">${logo(n, slug)}${esc(n)}</span>`).join("")}
    </div></div>`).join("");

  $("#certGroups").innerHTML = CERTS.map(([title, items]) => `
    <div class="group"><h2>${title}</h2><div class="grid grid-3">
      ${items.map((c) => `<article class="card cert hoverable"><h3>${esc(c.name)}</h3><p>${esc(c.by)}</p></article>`).join("")}
    </div></div>`).join("");

  $("#offers").innerHTML = OFFERS.map((o) => `
    <button class="card offer hoverable" type="button" data-topic="${esc(o.name)}"><span class="glyph">${esc(o.glyph)}</span><h3>${esc(o.name)}</h3><p>${esc(o.desc)}</p></button>`).join("");
  $("select[name=topic]").insertAdjacentHTML("beforeend",
    OFFERS.map((o) => `<option>${esc(o.name)}</option>`).join("") + "<option>Something else</option>");
}

/* ============ ROUTER ============ */
const VIEWS = ["home", "gear", "projects", "stack", "certifications", "consult"];
function route() {
  const id = VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "home";
  const title = { home: "MarickLabs | Fritz Marick, Cybersecurity and Fullstack Developer", gear: "Gear - MarickLabs", projects: "Projects - MarickLabs", stack: "Stack - MarickLabs", certifications: "Certifications - MarickLabs", consult: "Consult - MarickLabs" };
  document.title = title[id];
  $$(".view").forEach((v) => { v.hidden = v.dataset.view !== id; });
  $$("[data-nav]").forEach((a) => a.classList.toggle("active", a.dataset.nav === id));
  window.scrollTo(0, 0);
  closeMenu();
}
function closeMenu() {
  $("#sidebar").classList.remove("open");
  $("#scrim").classList.remove("show");
  $("#menuBtn").setAttribute("aria-expanded", "false");
}

/* ============ VIEWER COUNT ============ */
function setViewers(n) {
  n = Math.max(1, n);
  $("#viewerCount").textContent = n;
  $("#viewerLabel").textContent = n === 1 ? "person viewing now" : "people viewing now";
}
function startViewers() {
  const id = Math.random().toString(36).slice(2, 10);
  setViewers(1);

  if (CONFIG.firebaseDbUrl) {
    const base = CONFIG.firebaseDbUrl.replace(/\/$/, "");
    const beat = async () => {
      try {
        await fetch(`${base}/presence/${id}.json`, { method: "PUT", body: JSON.stringify({ t: Date.now() }) });
        const all = await (await fetch(`${base}/presence.json`)).json();
        const live = Object.values(all || {}).filter((v) => v && Date.now() - v.t < 35000).length;
        setViewers(live);
      } catch (e) {}
    };
    beat();
    setInterval(beat, 15000);
    addEventListener("pagehide", () => fetch(`${base}/presence/${id}.json`, { method: "DELETE", keepalive: true }).catch(() => {}));
    return;
  }

  /* No backend configured: count tabs open in this browser only. */
  if (!("BroadcastChannel" in window)) return;
  const ch = new BroadcastChannel("marick-viewers");
  const seen = new Map();
  const tick = () => {
    const now = Date.now();
    for (const [k, t] of seen) if (now - t > 8000) seen.delete(k);
    setViewers(1 + seen.size);
  };
  ch.onmessage = (e) => { if (e.data.id !== id) { seen.set(e.data.id, Date.now()); tick(); } };
  setInterval(() => { ch.postMessage({ id }); tick(); }, 3000);
  ch.postMessage({ id });
}

/* ============ FORM ============ */
function initForm() {
  const form = $("#consultForm"), msg = $("#formMsg");
  $$('[data-topic]').forEach((offer) => offer.addEventListener("click", () => {
    const topic = $("select[name=topic]");
    topic.value = offer.dataset.topic;
    $$('[data-topic].selected').forEach((selected) => selected.classList.remove("selected"));
    offer.classList.add("selected");
    $(".sub", $("[data-view=consult]")).scrollIntoView({ behavior: "smooth", block: "start" });
  }));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    let ok = true;
    $$("input, select, textarea", form).forEach((el) => {
      const bad = !el.value.trim() || (el.type === "email" && !/^\S+@\S+\.\S+$/.test(el.value));
      el.classList.toggle("invalid", bad);
      if (bad) ok = false;
    });
    if (!ok) { msg.textContent = "Please fill in every field with a valid email."; return; }
    const body = `Name: ${d.name}\nEmail: ${d.email}\nTopic: ${d.topic}\nBudget: ${d.budget}\nTimeline: ${d.timeline}\n\nProject details:\n${d.details}`;
    location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Consult inquiry: " + d.topic)}&body=${encodeURIComponent(body)}`;
    msg.textContent = "Opening your email app. If nothing opens, write to " + CONFIG.email + ".";
  });
  $$("input, select, textarea", form).forEach((el) => el.addEventListener("input", () => el.classList.remove("invalid")));
}

/* ============ INIT ============ */
document.addEventListener("DOMContentLoaded", () => {
  renderAscii();
  render();
  sfx.init();
  paintTheme();
  paintSound();

  $("#themeBtn").addEventListener("click", () => {
    const next = theme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    store.set("ml-theme", next);
    paintTheme();
  });
  $("#soundBtn").addEventListener("click", () => {
    sfx.on = !sfx.on;
    store.set("ml-sound", sfx.on ? "on" : "off");
    paintSound();
  });
  $("#menuBtn").addEventListener("click", () => {
    const open = $("#sidebar").classList.toggle("open");
    $("#scrim").classList.toggle("show", open);
    $("#menuBtn").setAttribute("aria-expanded", String(open));
  });
  $("#scrim").addEventListener("click", closeMenu);
  addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  addEventListener("hashchange", route);

  initForm();
  startViewers();
  route();
});
