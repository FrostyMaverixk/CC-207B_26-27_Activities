/* HOME.JS - CV preview popup. CV file path is set in index.html (data-cv on the button). */
const modal = document.getElementById('cvModal');
const frame = document.getElementById('cvFrame');
const openBtn = document.getElementById('cvOpen');
function openCv(){ frame.src = openBtn.dataset.cv; modal.classList.add('open'); }
function closeCv(){ modal.classList.remove('open'); }
openBtn.addEventListener('click', openCv);
document.getElementById('cvClose').addEventListener('click', closeCv);
modal.addEventListener('click', e => { if (e.target === modal) closeCv(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCv(); });
