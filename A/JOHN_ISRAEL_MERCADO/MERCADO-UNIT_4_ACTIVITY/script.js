document.getElementById('year').textContent = new Date().getFullYear();

const skills = [
  { id: 'html', name: 'HTML', level: 95, x: 8, y: 26, size: 14, note: 'Semantic, accessible markup that works with screen readers.' },
  { id: 'css', name: 'CSS', level: 90, x: 17, y: 60, size: 16, note: 'Responsive layouts, animation and design systems.' },
  { id: 'js', name: 'JavaScript', level: 88, x: 30, y: 34, size: 19, note: 'The language that ties the front end and back end together.' },
  { id: 'tailwind', name: 'Tailwind', level: 85, x: 38, y: 68, size: 13, note: 'Utility-first styling for fast, consistent interfaces.' },
  { id: 'react', name: 'React', level: 82, x: 50, y: 42, size: 17, note: 'Component-based interfaces and state management.' },
  { id: 'next', name: 'Next.js', level: 78, x: 64, y: 22, size: 16, note: 'Full-stack React apps with server rendering and routing.' },
  { id: 'node', name: 'Node.js', level: 76, x: 68, y: 70, size: 15, note: 'JavaScript on the server for APIs and tooling.' },
  { id: 'supabase', name: 'Supabase', level: 74, x: 84, y: 34, size: 14, note: 'Postgres database, auth and storage without running a server.' },
  { id: 'mysql', name: 'MySQL', level: 90, x: 88, y: 74, size: 14, note: 'Relational schema design and SQL queries.' },
  { id: 'python', name: 'Python', level: 78, x: 54, y: 86, size: 15, note: 'Scripts, automation and data work.' },
  { id: 'cpp', name: 'C++', level: 65, x: 20, y: 86, size: 13, note: 'Fast, low-level programs and problem solving.' }
];
const links = [
  ['html', 'css'], ['html', 'js'], ['css', 'js'],
  ['css', 'tailwind'], ['tailwind', 'react'], ['tailwind', 'next'],
  ['js', 'react'], ['react', 'next'],
  ['js', 'node'], ['next', 'node'],
  ['js', 'supabase'], ['next', 'supabase'],
  ['node', 'mysql'], ['python', 'mysql'], ['mysql', 'supabase'],
  ['python', 'cpp']
];

const box = document.getElementById('constellation');
const svg = box.querySelector('svg');
const detail = document.getElementById('skill-detail');
const byId = Object.fromEntries(skills.map(s => [s.id, s]));
const lines = [];
const buttons = {};

links.forEach(([a, b]) => {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', byId[a].x);
  line.setAttribute('y1', byId[a].y);
  line.setAttribute('x2', byId[b].x);
  line.setAttribute('y2', byId[b].y);
  line.dataset.a = a;
  line.dataset.b = b;
  svg.appendChild(line);
  lines.push(line);
});

function show(skill) {
  Object.values(buttons).forEach(btn => btn.classList.toggle('active', btn === buttons[skill.id]));
  lines.forEach(l => l.classList.toggle('lit', l.dataset.a === skill.id || l.dataset.b === skill.id));
  detail.innerHTML =
    '<strong>' + skill.name + '</strong> · ' + skill.level + '%' +
    '<div class="meter"><span style="width:' + skill.level + '%"></span></div>' +
    '<p>' + skill.note + '</p>';
}

skills.forEach(skill => {
  const btn = document.createElement('button');
  btn.className = 'star';
  btn.style.left = skill.x + '%';
  btn.style.top = skill.y + '%';
  btn.style.setProperty('--size', skill.size + 'px');
  btn.innerHTML = '<i></i><span>' + skill.name + '</span>';
  btn.setAttribute('aria-label', skill.name + ', ' + skill.level + ' percent');
  ['mouseenter', 'focus', 'click'].forEach(evt => btn.addEventListener(evt, () => show(skill)));
  box.appendChild(btn);
  buttons[skill.id] = btn;
});
show(byId.js);

const filterButtons = document.querySelectorAll('.filters button');
const projects = document.querySelectorAll('.project');
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.toggle('active', b === btn));
    const f = btn.dataset.filter;
    projects.forEach(p => { p.hidden = f !== 'all' && p.dataset.category !== f; });
  });
});

const canvas = document.getElementById('stars');
const ctx = canvas.getContext('2d');
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const distance = document.getElementById('distance');
let stars = [];
let mx = 0;
let my = 0;
let lastY = scrollY;
let vel = 0;

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  stars = Array.from({ length: Math.round(innerWidth * innerHeight / 4500) }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    z: Math.random() * 0.9 + 0.1,
    t: Math.random() * Math.PI * 2
  }));
}

function draw() {
  const dy = scrollY - lastY;
  lastY = scrollY;
  vel += (dy - vel) * 0.18;
  const max = document.documentElement.scrollHeight - innerHeight;
  const progress = max > 0 ? scrollY / max : 0;
  document.documentElement.style.setProperty('--p', progress.toFixed(3));
  distance.textContent = Math.round(scrollY * 7.3).toLocaleString();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stars.forEach(s => {
    s.t += 0.02;
    s.y += s.z * (still ? 0 : 0.08) - dy * s.z * 1.4;
    if (s.y > canvas.height) s.y -= canvas.height;
    if (s.y < 0) s.y += canvas.height;
    const px = (s.x + mx * s.z * 24 + canvas.width) % canvas.width;
    const py = s.y + my * s.z * 24;
    const streak = still ? 0 : Math.min(Math.abs(vel) * s.z * 3, 90);
    ctx.globalAlpha = still ? 0.8 : Math.min(1, 0.6 + Math.sin(s.t) * 0.3 + streak / 60);
    ctx.fillStyle = ctx.strokeStyle = s.z > 0.8 ? '#bfe9ff' : '#ffffff';
    if (streak > 2) {
      ctx.lineWidth = s.z * 1.6;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, py + (vel > 0 ? streak : -streak));
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(px, py, s.z * 1.9 + 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  if (!still) requestAnimationFrame(draw);
}

addEventListener('resize', () => { resize(); if (still) draw(); });
addEventListener('mousemove', e => {
  mx = e.clientX / innerWidth - 0.5;
  my = e.clientY / innerHeight - 0.5;
});
if (still) addEventListener('scroll', draw);

const navLinks = document.querySelectorAll('nav a');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(a => a.classList.toggle('current', a.getAttribute('href') === '#' + entry.target.id));
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });
document.querySelectorAll('main section[id]').forEach(s => observer.observe(s));

resize();
draw();