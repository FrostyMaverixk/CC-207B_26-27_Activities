(() => {
  const app = document.querySelector('.app');
  const stage = document.getElementById('stage');
  const openBtn = document.getElementById('open-btn');
  const closeBtn = document.getElementById('close-btn');
  const themeBtn = document.getElementById('theme-toggle');
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
  const info = document.getElementById('folder-content');
  const backFit = document.getElementById('back-fit');

  let isOpen = false;
  let currentTab = 0;
  let focusedTab = 0;

  /* Theme */
  const ICONS = {
    light:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v2m0 14v2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42M3 12h2m14 0h2M5.64 18.36l1.42-1.42m9.88-9.88 1.42-1.42M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" /></svg>',

    dark:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 15.2A8.5 8.5 0 0 1 8.8 3.8 8.5 8.5 0 1 0 20.2 15.2Z" /></svg>',
  };

  function getSavedTheme() {
    try {
      return localStorage.getItem('portfolio-theme');
    } catch {
      return null;
    }
  }

  function applyTheme(theme) {
    app.dataset.theme = theme;
    const next = theme === 'light' ? 'dark' : 'light';
    themeBtn.innerHTML = ICONS[theme];
    themeBtn.setAttribute('aria-label', `Switch to ${next} mode`);
    themeBtn.title = `Switch to ${next} mode`;
  }

  applyTheme(
    getSavedTheme() ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );

  themeBtn.addEventListener('click', () => {
    const next = app.dataset.theme === 'light' ? 'dark' : 'light';
    try {
      localStorage.setItem('portfolio-theme', next);
    } catch {
    }
    applyTheme(next);
  });

  /* Open / close folder */
  function setOpen(value) {
    isOpen = value;
    stage.classList.toggle('is-open', isOpen);
    openBtn.setAttribute('aria-expanded', String(isOpen));

    if (isOpen) tabs[currentTab].focus({ preventScroll: true });
    else openBtn.focus({ preventScroll: true });
  }

  openBtn.addEventListener('click', () => setOpen(true));
  closeBtn.addEventListener('click', () => setOpen(false));

  app.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) setOpen(false);
  });

  /* Tabs */
  function selectTab(index) {
    currentTab = index;
    tabs.forEach((tab, i) => tab.setAttribute('aria-selected', String(i === index)));
    panels.forEach((panel, i) => (panel.hidden = i !== index));
  }

  function setFocusedTab(index) {
    focusedTab = index;
    tabs.forEach((tab, i) => (tab.tabIndex = i === index ? 0 : -1));
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(i));
    tab.addEventListener('focus', () => setFocusedTab(i));
  });

  // Keyboard navigation for tabs
  document.getElementById('tablist').addEventListener('keydown', (e) => {
    const n = tabs.length;
    const active = tabs.indexOf(document.activeElement);
    let i = active >= 0 ? active : focusedTab;

    if (e.key === 'ArrowRight') i = (i + 1) % n;
    else if (e.key === 'ArrowLeft') i = (i + n - 1) % n;
    else if (e.key === 'Home') i = 0;
    else if (e.key === 'End') i = n - 1;
    else return;

    e.preventDefault();
    setFocusedTab(i);
    tabs[i].focus();
  });

  /* Animation for folder height */
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      backFit.style.height = `${info.offsetHeight}px`;
    }).observe(info);
  }
})();
