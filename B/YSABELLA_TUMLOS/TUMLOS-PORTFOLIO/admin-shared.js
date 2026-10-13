// ===== BLUME DAILY ADMIN — SHARED JS =====

const SIDEBAR_HTML = `
<div class="sidebar-brand">
  <a href="admin-dashboard.html" class="sidebar-logo">Blume Daily</a>
  <div class="sidebar-sub">Admin Portal</div>
</div>
<nav class="sidebar-nav">
  <div class="sidebar-section-label">Main</div>
  <a href="admin-dashboard.html" class="sidebar-link" data-page="dashboard">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
    Dashboard
  </a>
  <a href="admin-orders.html" class="sidebar-link" data-page="orders">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
    Orders
  </a>
  <a href="admin-payments.html" class="sidebar-link" data-page="payments">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
    Payments
  </a>
  <a href="admin-invoices.html" class="sidebar-link" data-page="invoices">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
    Invoices
  </a>
  <div class="sidebar-section-label">Catalogue</div>
  <a href="admin-products.html" class="sidebar-link" data-page="products">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C7 2 5 7 5 10c0 4 3.5 7 7 10 3.5-3 7-6 7-10 0-3-2-8-7-8z"/></svg>
    Products
  </a>
  <a href="admin-inventory.html" class="sidebar-link" data-page="inventory">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
    Inventory
  </a>
  <div class="sidebar-section-label">Reports</div>
  <a href="admin-reports.html" class="sidebar-link" data-page="reports">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
    Sales Reports
  </a>
</nav>
<div class="sidebar-footer">
  <div class="sidebar-user">
    <div class="sidebar-avatar">B</div>
    <div>
      <div class="sidebar-user-name">Brent Barrientos</div>
      <div class="sidebar-user-role">Owner &amp; Admin</div>
    </div>
  </div>
  <button class="sidebar-logout" onclick="adminLogout()">Sign Out</button>
</div>
`;

function initAdmin(activePage) {
  if (!sessionStorage.getItem('bd_admin')) {
    window.location.href = 'admin-login.html';
    return;
  }
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.innerHTML = SIDEBAR_HTML;
    const activeLink = sidebar.querySelector(`[data-page="${activePage}"]`);
    if (activeLink) activeLink.classList.add('active');
  }
}

function adminLogout() {
  sessionStorage.removeItem('bd_admin');
  window.location.href = 'admin-login.html';
}

// ===== BLUME DAILY ADMIN — ANIMATION & MOTION LAYER =====

(function() {
  // ── 1. Page transition veil ──
  function injectVeil() {
    if (document.getElementById('page-transition-veil')) return;
    const veil = document.createElement('div');
    veil.id = 'page-transition-veil';
    document.body.appendChild(veil);
  }

  // ── 2. Intercept sidebar nav clicks for smooth fade transition ──
  function setupPageTransitions() {
    document.addEventListener('click', function(e) {
      const link = e.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript') ||
          link.getAttribute('target') === '_blank') return;
      // Only intercept admin pages
      if (!href.includes('admin-') && href !== 'admin-login.html') return;
      e.preventDefault();
      const veil = document.getElementById('page-transition-veil');
      if (veil) {
        veil.classList.add('leaving');
        setTimeout(() => { window.location.href = href; }, 260);
      } else {
        window.location.href = href;
      }
    });
  }

  // ── 3. Topbar scroll shadow ──
  function setupTopbarShadow() {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;
    const onScroll = () => {
      topbar.classList.toggle('scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ── 4. Toast utility (global) ──
  window.adminToast = function(msg, duration) {
    duration = duration || 2800;
    let toast = document.getElementById('admin-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'admin-toast';
      toast.innerHTML = `
        <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <span id="admin-toast-msg"></span>`;
      document.body.appendChild(toast);
    }
    document.getElementById('admin-toast-msg').textContent = msg;
    toast.classList.remove('out');
    toast.style.display = 'flex';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.add('out');
      setTimeout(() => { toast.style.display = 'none'; }, 320);
    }, duration);
  };

  // ── 5. Scroll-reveal for .reveal elements ──
  function setupScrollReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
  }

  // ── 6. Stagger table rows on load ──
  function animateTableRows() {
    document.querySelectorAll('.tbl tbody tr').forEach((row, i) => {
      row.style.opacity = '0';
      row.style.transform = 'translateY(10px)';
      row.style.transition = 'opacity .32s ease, transform .32s ease';
      setTimeout(() => {
        row.style.opacity = '';
        row.style.transform = '';
      }, 80 + i * 38);
    });
  }

  // ── 7. Animate stat card values (count-up effect) ──
  function animateCountUp() {
    document.querySelectorAll('.s-card-value').forEach(el => {
      const raw = el.textContent.trim();
      // Only numeric or ₱-prefixed values
      const match = raw.match(/^(₱?)([\d,]+)/);
      if (!match) return;
      const prefix = match[1];
      const target = parseInt(match[2].replace(/,/g, ''), 10);
      if (!target || target > 99999) return; // skip big numbers for perf
      const duration = 900;
      const start = performance.now();
      const fmt = n => prefix + n.toLocaleString();
      el.textContent = fmt(0);
      function step(now) {
        const p = Math.min((now - start) / duration, 1);
        // Ease out cubic
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(Math.round(e * target));
        if (p < 1) requestAnimationFrame(step);
      }
      // Delay until card is visible
      setTimeout(() => requestAnimationFrame(step), 350);
    });
  }

  // ── 8. Ripple effect on buttons ──
  function setupRipples() {
    document.querySelectorAll('.btn-primary, .tbl-btn, .page-btn, .filter-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        const r = document.createElement('span');
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.6;
        r.style.cssText = `
          position:absolute;width:${size}px;height:${size}px;
          left:${e.clientX - rect.left - size/2}px;
          top:${e.clientY - rect.top - size/2}px;
          border-radius:50%;background:rgba(255,255,255,.28);
          pointer-events:none;z-index:9;
          animation:ripple .55s ease-out forwards;`;
        // Ensure relative positioning
        if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
        btn.style.overflow = 'hidden';
        btn.appendChild(r);
        setTimeout(() => r.remove(), 600);
      });
    });
  }

  // ── 9. Smooth filter button active state ──
  function setupFilterBtns() {
    document.querySelectorAll('.filter-bar').forEach(bar => {
      bar.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
        });
      });
    });
  }

  // ── 10. Modal open/close with animation ──
  function setupModalAnimations() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
          overlay.classList.remove('open');
        }
      });
    });
  }

  // ── Init on DOMContentLoaded ──
  document.addEventListener('DOMContentLoaded', function() {
    injectVeil();
    setupPageTransitions();
    setupTopbarShadow();
    setupScrollReveal();
    animateTableRows();
    animateCountUp();
    setupRipples();
    setupFilterBtns();
    setupModalAnimations();
  });
})();
