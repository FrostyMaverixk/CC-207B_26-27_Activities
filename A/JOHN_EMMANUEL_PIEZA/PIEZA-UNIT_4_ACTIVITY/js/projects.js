/* PROJECTS.JS - slider buttons + progress bar, card tilt/glow, touch tap, and the "View more" popup. */
const slider = document.getElementById('slider');
const cards = [...slider.querySelectorAll('.card')];
const step = () => (cards.find(c => !c.hidden) || cards[0]).offsetWidth + 29;   // card width + gap

document.getElementById('next').addEventListener('click', () => {
  const end = slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 5;
  end ? slider.scrollTo({ left: 0 }) : slider.scrollBy({ left: step() });   // loops back to start
});
document.getElementById('prev').addEventListener('click', () => slider.scrollBy({ left: -step() }));

// Progress bar under the slider
const bar = document.getElementById('sliderBar');
function progress(){
  const max = slider.scrollWidth - slider.clientWidth;
  const w = Math.max(12, slider.clientWidth / slider.scrollWidth * 100);
  bar.style.width = w + '%';
  bar.style.marginLeft = (max > 0 ? slider.scrollLeft / max * (100 - w) : 0) + '%';
}
slider.addEventListener('scroll', progress, { passive: true });
window.addEventListener('resize', progress);
progress();

// Designs / Code toggle: shows only the cards whose data-cat matches the chosen tab
const tabs = [...document.querySelectorAll('.proj-tab')];
function filterProjects(cat){
  tabs.forEach(t => { const on = t.dataset.filter === cat; t.classList.toggle('active', on); t.setAttribute('aria-selected', on); });
  cards.forEach(c => { c.hidden = c.dataset.cat !== cat; c.classList.remove('open'); });
  slider.classList.remove('swap'); void slider.offsetWidth; slider.classList.add('swap');
  slider.style.scrollBehavior = 'auto'; slider.scrollLeft = 0; slider.style.scrollBehavior = '';
  progress();
}
tabs.forEach(t => t.addEventListener('click', () => filterProjects(t.dataset.filter)));
filterProjects('design');

// Tilt + glow that follows the cursor (mouse only, skipped for reduced motion)
const fine = matchMedia('(hover:hover)').matches && !matchMedia('(prefers-reduced-motion:reduce)').matches;
if (fine) cards.forEach(c => {
  c.addEventListener('mousemove', e => {
    const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    c.style.setProperty('--ry', ((x - .5) * 8).toFixed(2) + 'deg');
    c.style.setProperty('--rx', ((.5 - y) * 8).toFixed(2) + 'deg');
    c.style.setProperty('--mx', (x * 100) + '%');
    c.style.setProperty('--my', (y * 100) + '%');
  });
  c.addEventListener('mouseleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
});

// Touch screens: first tap opens the hover panel
if (matchMedia('(hover:none)').matches) cards.forEach(c => c.addEventListener('click', e => {
  if (e.target.closest('.view-more, .proj-link')) return;
  cards.forEach(x => x.classList.toggle('open', x === c && !c.classList.contains('open')));
}));

// Popup
const pm = document.getElementById('pModal');
const $ = id => document.getElementById(id);
function openProject(card){
  const media = card.querySelector('.card-media').cloneNode(true);
  media.querySelector('.card-num')?.remove(); media.querySelector('.card-type')?.remove();
  $('pMedia').style.cssText = media.getAttribute('style');
  $('pMedia').innerHTML = ''; $('pMedia').appendChild(media);
  $('pType').textContent = card.querySelector('.card-type').textContent;
  $('pTitle').textContent = card.querySelector('.card-body h4').textContent;
  $('pDesc').textContent = card.querySelector('.long').textContent;
  $('pTags').innerHTML = card.querySelector('.tags').innerHTML;
  $('pMeta').innerHTML = `<dt>Role</dt><dd>${card.dataset.role}</dd><dt>Year</dt><dd>${card.dataset.year}</dd><dt>Tools</dt><dd>${[...card.querySelectorAll('.tags li')].map(l => l.textContent).join(', ')}</dd>`;
  $('pLinks').innerHTML = '';
  card.querySelectorAll('.proj-link').forEach(l => { const a = l.cloneNode(true); a.classList.remove('btn-outline'); $('pLinks').appendChild(a); });
  pm.classList.add('open'); pm.setAttribute('aria-hidden', 'false');
}
const closeProject = () => { pm.classList.remove('open'); pm.setAttribute('aria-hidden', 'true'); };
cards.forEach(c => c.querySelector('.view-more').addEventListener('click', () => openProject(c)));
['pClose', 'pClose2'].forEach(id => $(id).addEventListener('click', closeProject));
pm.addEventListener('click', e => { if (e.target === pm) closeProject(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeProject(); });

// Green light that follows the cursor over the black background
const proj = document.getElementById('projects');
proj.addEventListener('mousemove', e => {
  const r = proj.getBoundingClientRect();
  proj.style.setProperty('--gx', (e.clientX - r.left) + 'px');
  proj.style.setProperty('--gy', (e.clientY - r.top) + 'px');
  proj.classList.add('lit');
});
proj.addEventListener('mouseleave', () => proj.classList.remove('lit'));
