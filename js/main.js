/* ============================================================
   MAIN.JS — Shared utilities: nav scroll, mobile menu,
              reveal observer, data loading, footer render
   ============================================================ */

// ——— Namespace ———
window.AISSH = window.AISSH || {};

/* ─── Data Loader ─────────────────────────────────────────── */
AISSH.loadData = async function (url) {
  try {
    const res = await fetch(url + '?v=' + Date.now());
    if (!res.ok) throw new Error('Failed to fetch ' + url);
    return res.json();
  } catch (err) {
    console.warn('[AISSH] Could not load', url, err);
    return null;
  }
};

/* ─── Initials from name ──────────────────────────────────── */
AISSH.initials = function (name) {
  return name.split(' ').filter(Boolean)
    .map(w => w[0].toUpperCase()).slice(0, 2).join('');
};

/* ─── Format date string ──────────────────────────────────── */
AISSH.formatDate = function (iso) {
  if (!iso) return 'TBD';
  const d = new Date(iso + 'T12:00:00'); // avoid TZ shift
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
};

AISSH.isPast = function (iso) {
  if (!iso) return false;
  return new Date(iso + 'T23:59:59') < new Date();
};

/* ─── Inline SVG icons ────────────────────────────────────── */
AISSH.icons = {
  mic:       `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>`,
  coffee:    `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
  list:      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  trophy:    `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="8 21 12 17 16 21"/><path d="M5 3H3v3c0 3.31 2.69 6 6 6s6-2.69 6-6V3h-2"/><path d="M5 3h14"/><path d="M19 3v3a6 6 0 0 1-2 4.47"/></svg>`,
  clipboard: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`,
  users:     `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  utensils:  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="2" x2="3" y2="12"/><path d="M7 2v4a4 4 0 0 1-4 4"/><line x1="7" y1="2" x2="7" y2="22"/><path d="M20 5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v5a4 4 0 0 0 4 4v7"/></svg>`,
  arrow:     `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  chevron:   `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>`,
  close:     `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  mail:      `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  pin:       `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  check:     `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`,
  alert:     `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
};

AISSH.sessionIcon = function (type) {
  const map = {
    keynote:      'mic',
    break:        'coffee',
    session:      'list',
    awards:       'trophy',
    registration: 'clipboard',
    networking:   'users',
    lunch:        'utensils',
  };
  return AISSH.icons[map[type] || 'list'];
};

AISSH.sessionDotColor = {
  keynote:      '#2D6A4F',
  break:        '#F4E9D8',
  session:      '#4A5568',
  awards:       '#E07B39',
  registration: '#4A5568',
  networking:   '#74C69D',
  lunch:        '#F4E9D8',
};

/* ─── Header: scroll + mobile menu ────────────────────────── */
(function initHeader() {
  const header   = document.querySelector('.site-header');
  const hamburger = document.querySelector('.site-header__hamburger');
  const mobileNav = document.querySelector('.site-nav__mobile');
  if (!header) return;

  const isHome = document.body.classList.contains('page-home');

  // Mark active nav link
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('[data-nav-link]').forEach(link => {
    const href = link.getAttribute('href').replace(/\/$/, '') || '/';
    if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
      link.setAttribute('aria-current', 'page');
    }
  });

  // Scroll behaviour (home page only: transparent → solid)
  if (isHome) {
    header.classList.add('site-header--transparent');
    const onScroll = () => {
      if (window.scrollY > 60) {
        header.classList.remove('site-header--transparent');
        header.classList.add('site-header--solid');
      } else {
        header.classList.add('site-header--transparent');
        header.classList.remove('site-header--solid');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  } else {
    header.classList.add('site-header--always-solid');
  }

  // Mobile menu
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', String(!isOpen));
      mobileNav.classList.toggle('is-open', !isOpen);
      document.body.style.overflow = isOpen ? '' : 'hidden';
    });

    // Close on link click
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });

    // Close on Esc
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) {
        hamburger.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('is-open');
        document.body.style.overflow = '';
        hamburger.focus();
      }
    });
  }
})();

/* ─── Scroll-reveal observer ──────────────────────────────── */
AISSH._revealObserver = null;

(function initReveal() {
  if (!('IntersectionObserver' in window)) {
    // Fallback: just make everything visible
    AISSH.observeReveal = function (root) {
      (root || document).querySelectorAll('.reveal').forEach(el => el.classList.add('revealed'));
    };
    AISSH.observeReveal();
    return;
  }

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });

  AISSH._revealObserver = obs;

  // Observe elements present at load time
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

  // Public function: call after injecting dynamic content
  AISSH.observeReveal = function (root) {
    (root || document).querySelectorAll('.reveal:not(.revealed)').forEach(el => obs.observe(el));
  };
})();

/* ─── Footer: inject conference info ─────────────────────── */
(function initFooter() {
  AISSH.loadData('data/conference.json').then(conf => {
    if (!conf) return;
    const nameEl = document.querySelector('.site-footer__conf-name');
    if (nameEl) nameEl.textContent = conf.short_title || conf.title;
    const tagEl = document.querySelector('.site-footer__tagline');
    if (tagEl) tagEl.textContent = conf.tagline || '';
    const yearEl = document.querySelector('.footer-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  });
})();
