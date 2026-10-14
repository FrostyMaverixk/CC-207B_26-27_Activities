(() => {
  /* ==========================================================================
     1. THEME CONTROLLER & I18N
     ========================================================================== */
  const root = document.documentElement;
  const btn = document.getElementById('theme');
  const label = document.getElementById('theme-label');
  const icon = document.getElementById('theme-icon');

  const themeConfig = {
    light: {
      next: 'dark',
      icon: 'fa-solid fa-moon',
      label: 'Dark Mode'
    },
    dark: {
      next: 'chinese',
      icon: 'fa-solid fa-dragon',
      label: '中文模式 🇨🇳'
    },
    chinese: {
      next: 'light',
      icon: 'fa-solid fa-sun',
      label: 'Light Mode'
    }
  };

  const i18nMap = [
    // Navigation
    { sel: 'nav a[data-page="home"]', en: '<i class="fa-solid fa-house"></i> Home', zh: '<i class="fa-solid fa-house"></i> 首页' },
    { sel: 'nav a[data-page="about"]', en: '<i class="fa-solid fa-user"></i> About', zh: '<i class="fa-solid fa-user"></i> 关于我' },
    { sel: 'nav a[data-page="projects"]', en: '<i class="fa-solid fa-code"></i> Projects', zh: '<i class="fa-solid fa-code"></i> 项目作品' },
    { sel: '#nav-terminal', en: '<i class="fa-solid fa-terminal"></i> Terminal', zh: '<i class="fa-solid fa-terminal"></i> 终端' },

    // Hero Section
    { sel: '.badge', en: '<span class="badge-dot"></span> Open to IT &amp; networking opportunities', zh: '<span class="badge-dot"></span> 🇨🇳 开放IT与网络技术职位申请' },
    { sel: '.tagline', en: 'BSIT · Cybersecurity Track · WVSU', zh: '信息技术学士 · 网络安全专业 · 西维萨亚州立大学' },
    { sel: '.intro h1', en: 'Vincent John Tamaño', zh: 'Vincent John Tamaño (梵森特) 🇨🇳' },
    { sel: '.lead', en: 'I build and secure networks, run a self-hosted Linux homelab, and create full-stack applications. Currently seeking IT support, networking, or sysadmin roles.', zh: '我专注于构建与保护网络安全、运维 Linux 自建实验室，并开发全栈应用程序。目前正在寻找 IT 技术支持、网络工程及系统管理员职位。' },
    { sel: '.cta .btn.primary', en: '<i class="fa-solid fa-rocket"></i> View Projects', zh: '<i class="fa-solid fa-rocket"></i> 查看项目' },
    { sel: '.cta .btn:not(.primary)', en: '<i class="fa-solid fa-user"></i> About Me', zh: '<i class="fa-solid fa-user"></i> 关于我' },

    // About Section
    { sel: '#about .section-eyebrow', en: '<i class="fa-solid fa-fingerprint"></i> Who I Am', zh: '<i class="fa-solid fa-fingerprint"></i> 个人简介 🇨🇳' },
    { sel: '#about h2', en: 'About Me', zh: '关于我' },
    { sel: '.about-lead', en: 'I\'m <strong>Vincent John Tamaño</strong> — a third-year BSIT student at <strong>West Visayas State University</strong> in Iloilo City, Philippines, specializing in Cybersecurity (expected graduation: 2028). I\'m deeply passionate about the intersection of networking, systems administration, and secure infrastructure. Outside the classroom, I spend my time running a self-hosted Linux homelab, tinkering with containers and firewalls, and building full-stack web applications.', zh: '我是 <strong>Vincent John Tamaño</strong> — 西维萨亚州立大学信息技术专业大三学生，主修网络安全（预计2028年毕业）。我热衷于网络工程、系统管理与安全基础设施建设。课余时间，我运行着自己的 Linux 实验室，研究容器与防火墙技术，并开发全栈 Web 应用。' },

    // Stats labels
    { sel: '.stats-row .stat-box:nth-child(1) .stat-label', en: 'Year at WVSU', zh: '大三在读 (WVSU)' },
    { sel: '.stats-row .stat-box:nth-child(2) .stat-label', en: 'Projects Completed', zh: '已完成项目' },
    { sel: '.stats-row .stat-box:nth-child(3) .stat-label', en: 'Cisco Certifications', zh: '思科专业认证' },
    { sel: '#about p a.btn.primary', en: '<i class="fa-solid fa-file-arrow-down"></i> Download Resume', zh: '<i class="fa-solid fa-file-arrow-down"></i> 下载个人简历' },

    // Technical Skills
    { sel: '.skill-card h3', en: '<i class="fa-solid fa-screwdriver-wrench" style="color:var(--accent);margin-right:.45rem"></i>Technical Skills', zh: '<i class="fa-solid fa-screwdriver-wrench" style="color:var(--accent);margin-right:.45rem"></i>核心技术技能' },
    { sel: '.skill-card dt:nth-of-type(1)', en: '<i class="fa-solid fa-server"></i> Systems &amp; Servers', zh: '<i class="fa-solid fa-server"></i> 系统与服务器' },
    { sel: '.skill-card dt:nth-of-type(2)', en: '<i class="fa-solid fa-network-wired"></i> Networking', zh: '<i class="fa-solid fa-network-wired"></i> 网络技术' },
    { sel: '.skill-card dt:nth-of-type(3)', en: '<i class="fa-solid fa-shield-halved"></i> Cybersecurity', zh: '<i class="fa-solid fa-shield-halved"></i> 网络安全' },
    { sel: '.skill-card dt:nth-of-type(4)', en: '<i class="fa-solid fa-headset"></i> IT Support', zh: '<i class="fa-solid fa-headset"></i> IT 技术支持' },
    { sel: '.skill-card dt:nth-of-type(5)', en: '<i class="fa-solid fa-laptop-code"></i> Frontend', zh: '<i class="fa-solid fa-laptop-code"></i> 前端开发' },
    { sel: '.skill-card dt:nth-of-type(6)', en: '<i class="fa-solid fa-database"></i> Backend &amp; Databases', zh: '<i class="fa-solid fa-database"></i> 后端与数据库' },
    { sel: '.skill-card dt:nth-of-type(7)', en: '<i class="fa-brands fa-git-alt"></i> DevOps &amp; Tools', zh: '<i class="fa-brands fa-git-alt"></i> DevOps 与工具' },

    // Side Cards
    { sel: '.side-card:nth-of-type(1) h3', en: '<i class="fa-solid fa-certificate" style="color:var(--accent);margin-right:.45rem"></i>Certifications', zh: '<i class="fa-solid fa-certificate" style="color:var(--accent);margin-right:.45rem"></i>资格认证' },
    { sel: '.side-card:nth-of-type(2) h3', en: '<i class="fa-solid fa-building-columns" style="color:var(--accent);margin-right:.45rem"></i>Education', zh: '<i class="fa-solid fa-building-columns" style="color:var(--accent);margin-right:.45rem"></i>教育背景' },
    { sel: '.side-card:nth-of-type(3) h3', en: '<i class="fa-solid fa-book-open" style="color:var(--accent);margin-right:.45rem"></i>Currently Learning', zh: '<i class="fa-solid fa-book-open" style="color:var(--accent);margin-right:.45rem"></i>正在进修' },
    { sel: '.side-card:nth-of-type(4) h3', en: '<i class="fa-solid fa-heart" style="color:var(--accent);margin-right:.45rem"></i>Beyond the Keyboard', zh: '<i class="fa-solid fa-heart" style="color:var(--accent);margin-right:.45rem"></i>工作之余 🇨🇳' },

    // Projects Section
    { sel: '#projects .section-eyebrow', en: '<i class="fa-solid fa-cubes"></i> What I\'ve Built', zh: '<i class="fa-solid fa-cubes"></i> 项目展示 🇨🇳' },
    { sel: '#projects h2', en: 'Projects', zh: '个人项目作品' }
  ];

  function setTheme(mode) {
    if (!themeConfig[mode]) mode = 'light';
    root.setAttribute('data-theme', mode);
    const config = themeConfig[mode];
    btn.setAttribute('aria-pressed', mode !== 'light');
    if (label) label.textContent = config.label;
    if (icon) icon.className = config.icon;

    // Apply translation if chinese mode, else restore EN
    i18nMap.forEach(item => {
      const el = document.querySelector(item.sel);
      if (el) {
        el.innerHTML = mode === 'chinese' ? item.zh : item.en;
      }
    });

    try { localStorage.setItem('theme', mode); } catch (e) {}
  }

  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) {}
  setTheme(saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

  btn.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') || 'light';
    const next = themeConfig[current] ? themeConfig[current].next : 'dark';
    setTheme(next);
  });

  /* ==========================================================================
     2. HASH-BASED PAGE ROUTER & TERMINAL OPENER
     ========================================================================== */
  const pages = ['home', 'about', 'projects'];
  function route() {
    const rawName = location.hash.replace('#', '');
    const isTerminal = rawName === 'terminal';
    const current = isTerminal ? 'about' : (pages.includes(rawName) ? rawName : 'home');

    // Toggle pages visibility
    pages.forEach(p => {
      const el = document.getElementById(p);
      if (el) el.hidden = p !== current;
    });

    // Update active nav styling
    document.querySelectorAll('nav a').forEach(a => {
      const isTarget = isTerminal ? a.dataset.page === 'terminal' : a.dataset.page === current;
      if (isTarget) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    // If navigating to terminal, scroll down smoothly and focus the prompt
    if (isTerminal) {
      setTimeout(() => {
        const term = document.getElementById('terminal-card');
        const input = document.getElementById('terminal-input');
        if (term) {
          term.scrollIntoView({ behavior: 'smooth', block: 'center' });
          term.classList.remove('pulse');
          void term.offsetWidth; // re-trigger animation
          term.classList.add('pulse');
        }
        if (input) input.focus();
      }, 60);
    } else {
      window.scrollTo(0, 0);
    }
  }

  // Handle re-clicking terminal link when already on #terminal or #about
  const navTerminalBtn = document.getElementById('nav-terminal');
  if (navTerminalBtn) {
    navTerminalBtn.addEventListener('click', (e) => {
      if (location.hash === '#terminal') {
        e.preventDefault();
        const term = document.getElementById('terminal-card');
        const input = document.getElementById('terminal-input');
        if (term) {
          term.scrollIntoView({ behavior: 'smooth', block: 'center' });
          term.classList.remove('pulse');
          void term.offsetWidth;
          term.classList.add('pulse');
        }
        if (input) input.focus();
      }
    });
  }

  window.addEventListener('hashchange', route);
  route();

  // Dynamic copyright year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ==========================================================================
     3. FEATURE 1: TYPING EFFECT (Home page)
     ========================================================================== */
  const words = ['IT Support', 'Networking', 'Sysadmin', 'Cybersecurity'];
  const typingEl = document.getElementById('typing-text');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (typingEl) {
    if (prefersReduced) {
      // Respect user preference: display first word statically without animation
      typingEl.textContent = words[0];
    } else {
      let wordIndex = 0;
      let charIndex = words[0].length;
      let isDeleting = true;

      function typeLoop() {
        const currentWord = words[wordIndex];

        if (isDeleting) {
          // Deleting characters
          charIndex--;
          typingEl.textContent = currentWord.substring(0, charIndex);

          if (charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            setTimeout(typeLoop, 400); // Pause before typing next word
            return;
          }
          setTimeout(typeLoop, 50); // Deletion speed
        } else {
          // Typing characters
          charIndex++;
          typingEl.textContent = currentWord.substring(0, charIndex);

          if (charIndex === currentWord.length) {
            isDeleting = true;
            setTimeout(typeLoop, 1800); // Pause while word is fully typed
            return;
          }
          setTimeout(typeLoop, 100); // Typing speed
        }
      }

      // Initial pause before deleting first word
      setTimeout(typeLoop, 1800);
    }
  }

  /* ==========================================================================
     4. FEATURE 2: PROJECT FILTER (Projects page)
     ========================================================================== */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card.project');

  filterBtns.forEach(filterBtn => {
    filterBtn.addEventListener('click', () => {
      const selectedCategory = filterBtn.dataset.filter;

      // Update active state and aria-pressed attributes
      filterBtns.forEach(b => {
        const isActive = b === filterBtn;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      // Filter project cards according to data-category
      projectCards.forEach(card => {
        const category = card.dataset.category;
        const matches = selectedCategory === 'all' || category === selectedCategory;
        card.hidden = !matches;
      });
    });
  });

  /* ==========================================================================
     5. FEATURE 3: FAKE TERMINAL (About page)
     ========================================================================== */
  const terminalCard = document.getElementById('terminal-card');
  const terminalWindow = document.getElementById('terminal-window');
  const terminalHistory = document.getElementById('terminal-history');
  const terminalForm = document.getElementById('terminal-form');
  const terminalInput = document.getElementById('terminal-input');

  if (terminalForm && terminalInput && terminalHistory) {
    const commandHistory = [];
    let historyCursor = -1;

    // Helper: append a terminal line safely using textContent (prevent HTML injection)
    function appendTerminalOutput(command, outputText, isError = false) {
      const entry = document.createElement('div');
      entry.className = 'terminal-entry';

      if (command !== null) {
        const cmdEcho = document.createElement('div');
        cmdEcho.className = 'terminal-cmd-echo';
        cmdEcho.textContent = 'visitor@vjt:~$ ' + command;
        entry.appendChild(cmdEcho);
      }

      if (outputText) {
        const outDiv = document.createElement('div');
        outDiv.className = isError ? 'terminal-output-error' : 'terminal-output-text';
        outDiv.textContent = outputText;
        entry.appendChild(outDiv);
      }

      terminalHistory.appendChild(entry);
      // Auto-scroll to latest output
      if (terminalWindow) {
        terminalWindow.scrollTop = terminalWindow.scrollHeight;
      }
    }

    // Welcome message on load
    appendTerminalOutput(null, "Welcome to VJT Terminal v1.0. Type 'help' to see available commands.");

    // Focus input when clicking anywhere inside the terminal window
    if (terminalCard) {
      terminalCard.addEventListener('click', (e) => {
        if (e.target !== terminalInput) {
          terminalInput.focus();
        }
      });
    }

    // Handle command execution
    function executeCommand(rawInput) {
      const cmd = rawInput.trim();
      if (!cmd) return;

      const lower = cmd.toLowerCase();

      switch (lower) {
        case 'help':
          appendTerminalOutput(cmd,
`Available commands:
  help      - Display this list of commands
  about     - Overview of Vincent John Tamaño
  skills    - Technical proficiencies & systems
  projects  - Highlighted portfolio projects
  contact   - Contact links and information
  resume    - Open Vincent's resume in a new tab
  theme     - Toggle between Light, Dark, and Chinese modes
  clear     - Clear the terminal screen`
          );
          break;

        case 'about':
          appendTerminalOutput(cmd,
"Vincent John Tamaño — 3rd-year BSIT student at West Visayas State University specializing in Cybersecurity. Passionate about Linux homelabs, networking, and full-stack software development."
          );
          break;

        case 'skills':
          appendTerminalOutput(cmd,
`Systems & Servers : Linux (Debian), Docker, Portainer, UFW, Tailscale VPN, Pi-hole
Networking        : Cisco Packet Tracer, TCP/IP, Subnetting/VLSM, Routing
Development       : JavaScript, React, Tailwind CSS, PHP, Java (Swing), MySQL, Supabase`
          );
          break;

        case 'projects':
          appendTerminalOutput(cmd,
`1. Homelab Server    [Networking] - Debian 12, Docker, UFW, Tailscale VPN
2. Dental Clinic IMS [Web]        - React, Supabase, Tailwind, Vercel
3. Booking System    [Web]        - PHP, MySQL, XAMPP, Tailwind CSS
4. Horse Race Bet    [Java]       - Java Swing, OOP Architecture, NetBeans`
          );
          break;

        case 'contact':
          appendTerminalOutput(cmd,
`Email    : vincentjohntamano123@gmail.com
Phone    : +63 945 682 9136
GitHub   : https://github.com/vincenttamano
LinkedIn : https://www.linkedin.com/in/vincent-john-tamaño-2255a332b`
          );
          break;

        case 'resume':
          window.open('assets/resume.pdf', '_blank', 'noopener,noreferrer');
          appendTerminalOutput(cmd, "Opening assets/resume.pdf in a new tab...");
          break;

        case 'theme':
          if (btn) {
            btn.click();
            const currentMode = root.getAttribute('data-theme') || 'light';
            appendTerminalOutput(cmd, `Theme changed to: ${currentMode}`);
          } else {
            appendTerminalOutput(cmd, "Theme button not found.", true);
          }
          break;

        case 'clear':
          terminalHistory.textContent = '';
          break;

        default:
          appendTerminalOutput(cmd, `command not found: ${cmd}. Type 'help' for available commands.`, true);
          break;
      }
    }

    // Terminal form submit handler
    terminalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = terminalInput.value;
      if (val.trim()) {
        commandHistory.push(val);
      }
      historyCursor = -1;
      terminalInput.value = '';
      executeCommand(val);
    });

    // Up / Down arrow navigation for command history
    terminalInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (commandHistory.length === 0) return;

        if (historyCursor === -1) {
          historyCursor = commandHistory.length - 1;
        } else if (historyCursor > 0) {
          historyCursor--;
        }
        terminalInput.value = commandHistory[historyCursor];
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyCursor === -1) return;

        if (historyCursor < commandHistory.length - 1) {
          historyCursor++;
          terminalInput.value = commandHistory[historyCursor];
        } else {
          historyCursor = -1;
          terminalInput.value = '';
        }
      }
    });
  }
})();
