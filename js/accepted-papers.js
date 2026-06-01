/* ============================================================
   ACCEPTED-PAPERS.JS — Load, parse, render & filter the
   accepted abstract submissions from data/responses.csv
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {

  /* ── DOM refs ────────────────────────────────────────────── */
  const grid = document.getElementById('papers-grid');
  const countEl = document.getElementById('papers-count');
  const emptyEl = document.getElementById('papers-empty');
  const searchInput = document.getElementById('papers-search-input');
  const resetBtn = document.getElementById('papers-reset-btn');
  const filterBar = document.getElementById('papers-filter-bar');
  if (!grid) return;

  /* ── Step 1: Fetch CSV Files ─────────────────────────────── */
  let csvText = '';
  let detailsText = '';
  try {
    const [resResponses, resDetails] = await Promise.all([
      fetch('data/responses.csv?v=' + Date.now()),
      fetch('data/additional-details.csv?v=' + Date.now()).catch(err => {
        console.warn('[AISSH] details sheet fetch failed', err);
        return { ok: false };
      })
    ]);
    
    if (!resResponses.ok) throw new Error('HTTP ' + resResponses.status);
    csvText = await resResponses.text();
    
    if (resDetails && resDetails.ok) {
      detailsText = await resDetails.text();
    }
  } catch (err) {
    console.warn('[AISSH] Could not load abstracts data', err);
    grid.innerHTML = '<p style="color:var(--color-slate);text-align:center;padding:3rem 0;">Could not load abstracts.</p>';
    return;
  }

  /* ── Step 2: Parse CSV ───────────────────────────────────── */
  function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuote = false;
    let i = 0;

    // Normalise line endings
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    while (i < text.length) {
      const ch = text[i];

      if (inQuote) {
        if (ch === '"') {
          // Peek ahead: escaped double-quote?
          if (text[i + 1] === '"') {
            field += '"';
            i += 2;
          } else {
            inQuote = false;
            i++;
          }
        } else {
          field += ch;
          i++;
        }
      } else {
        if (ch === '"') {
          inQuote = true;
          i++;
        } else if (ch === ',') {
          row.push(field);
          field = '';
          i++;
        } else if (ch === '\n') {
          row.push(field);
          rows.push(row);
          row = [];
          field = '';
          i++;
        } else {
          field += ch;
          i++;
        }
      }
    }
    // Last field / row
    if (field !== '' || row.length > 0) {
      row.push(field);
      rows.push(row);
    }
    return rows;
  }

  // Parse additional details mapping
  const detailsMap = new Map();
  if (detailsText) {
    const detailsRows = parseCSV(detailsText);
    if (detailsRows.length > 0) {
      const dHeaders = detailsRows[0].map(h => h.trim());
      const dDataRows = detailsRows.slice(1);
      
      const detCol = {};
      dHeaders.forEach((h, i) => { detCol[h] = i; });
      
      const COL_DET_TITLE = 'Poster Title';
      const COL_DET_VISUAL = 'A short video (GIF) or Image to display along side your abstract.';
      const COL_DET_POSTER = 'Final Poster';
      const COL_DET_CONSENT = 'Do you consent to your poster being showed on the website? ';
      const COL_DET_PHOTO = 'Image of the presenting author';
      
      dDataRows.forEach(row => {
        const titleIdx = detCol[COL_DET_TITLE];
        const title = (titleIdx !== undefined && row[titleIdx]) ? row[titleIdx].trim() : '';
        if (title) {
          const normTitle = title.toLowerCase();
          
          const visIdx = detCol[COL_DET_VISUAL];
          const postIdx = detCol[COL_DET_POSTER];
          const conIdx = detCol[COL_DET_CONSENT];
          const phoIdx = detCol[COL_DET_PHOTO];
          
          detailsMap.set(normTitle, {
            visual: (visIdx !== undefined && row[visIdx]) ? row[visIdx].trim() : '',
            poster: (postIdx !== undefined && row[postIdx]) ? row[postIdx].trim() : '',
            consent: (conIdx !== undefined && row[conIdx]) ? row[conIdx].trim() : '',
            photo: (phoIdx !== undefined && row[phoIdx]) ? row[phoIdx].trim() : ''
          });
        }
      });
    }
  }

  // Google Drive url direct view link builder
  function getDriveDirectLink(url) {
    if (!url) return '';
    url = url.trim();
    let id = '';
    const idMatch = url.match(/[?&]id=([^&]+)/);
    if (idMatch) {
      id = idMatch[1];
    } else {
      const pathMatch = url.match(/\/file\/d\/([^\/]+)/);
      if (pathMatch) {
        id = pathMatch[1];
      }
    }
    if (id) {
      // Use the modern, highly reliable googleusercontent view/thumbnail endpoint
      // that bypasses standard Drive hotlink blocks!
      return `https://lh3.googleusercontent.com/d/${id}`;
    }
    return url;
  }

  const allRows = parseCSV(csvText);
  const headers = allRows[0];   // Row 0 = column headers
  const dataRows = allRows.slice(1);

  // Map column names to indices
  const col = {};
  headers.forEach((h, i) => { col[h.trim()] = i; });

  /* ── Step 3: Filter valid rows ───────────────────────────── */
  const COL_TIMESTAMP = 'Timestamp';
  const COL_TITLE = 'Abstract Title';
  const COL_FULLNAME = 'Full Name';
  const COL_AUTHORS = 'Author Names';
  const COL_AREA = 'Area';
  const COL_PREF = 'Presentation Preference';

  function cell(row, colName) {
    const idx = col[colName];
    return (idx !== undefined && row[idx] !== undefined) ? row[idx].trim() : '';
  }

  const valid = dataRows.filter(row => {
    const title = cell(row, COL_TITLE);
    const timestamp = cell(row, COL_TIMESTAMP);
    return title !== '' && timestamp !== '';
  });

  /* ── Step 4: Deduplicate by title ────────────────────────── */
  const titleMap = new Map(); // normalised title → row

  valid.forEach(row => {
    const normTitle = cell(row, COL_TITLE).toLowerCase();
    if (!titleMap.has(normTitle)) {
      titleMap.set(normTitle, row);
    } else {
      const existing = titleMap.get(normTitle);
      const existingDate = new Date(cell(existing, COL_TIMESTAMP));
      const newDate = new Date(cell(row, COL_TIMESTAMP));
      if (newDate > existingDate) {
        titleMap.set(normTitle, row);
      }
    }
  });

  /* ── Step 5: Sort chronologically ───────────────────────── */
  const sorted = Array.from(titleMap.values()).sort((a, b) => {
    return new Date(cell(a, COL_TIMESTAMP)) - new Date(cell(b, COL_TIMESTAMP));
  });

  /* ── Step 6 & 7: Assign IDs and derive slugs ─────────────── */
  function makeSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  const papers = sorted.map((row, idx) => {
    const title = cell(row, COL_TITLE);
    const normTitle = title.toLowerCase();
    const details = detailsMap.get(normTitle) || {};
    
    return {
      id: String(idx + 1).padStart(2, '0'),
      slug: makeSlug(cell(row, COL_FULLNAME)),
      title: title,
      leadAuthor: cell(row, COL_FULLNAME),
      allAuthors: cell(row, COL_AUTHORS) || cell(row, COL_FULLNAME),
      area: cell(row, COL_AREA),
      pref: cell(row, COL_PREF) || '',
      initials: AISSH.initials(cell(row, COL_FULLNAME) || 'A B'),
      // Drive direct links from additional details matching
      authorPhotoUrl: getDriveDirectLink(details.photo),
      visualUrl: getDriveDirectLink(details.visual),
      consent: details.consent || '',
      // Detailed author metadata from responses.csv
      university: cell(row, 'University'),
      department: cell(row, 'Department'),
      program: cell(row, 'Program'),
      supervisor: cell(row, 'Supervisor')
    };
  });

  /* ── Step 8: Render cards ────────────────────────────────── */
  function prefLabel(pref) {
    const map = { 'Talk': 'Poster', 'Poster': 'Poster', 'Either': 'Poster' };
    return map[pref] || pref || 'Presentation';
  }

  function renderCard(p) {
    const authorPhoto = p.authorPhotoUrl || `assets/images/accepted-authors/${p.slug}.jpg`;

    const authorListHtml = (p.allAuthors && p.allAuthors !== p.leadAuthor)
      ? `<span class="paper-card__author-list">${p.allAuthors}</span>`
      : '';

    return `
      <article class="paper-card reveal"
               data-area="${p.area}"
               data-id="${p.id}"
               data-title="${p.title.toLowerCase()}"
               data-authors="${p.allAuthors.toLowerCase()}">

        <!-- Meta bar: ID · Area · Presentation type -->
        <div class="paper-card__meta-bar">
          <span class="paper-card__id" aria-label="Paper number ${p.id}">#${p.id}</span>
          <span class="paper-card__area">${p.area}</span>
          ${p.pref ? `<span class="paper-card__pref">${prefLabel(p.pref)}</span>` : ''}
        </div>

        <!-- Title -->
        <h2 class="paper-card__title">${p.title}</h2>

        <!-- Authors -->
        <div class="paper-card__authors">
          <div class="paper-card__author-photo-wrap">
            <img src="${authorPhoto}"
                 alt="${p.leadAuthor}"
                 class="paper-card__author-photo"
                 onerror="this.style.display='none';
                          this.nextElementSibling.style.display='flex'">
            <div class="paper-card__author-avatar"
                 style="display:none" aria-hidden="true">${p.initials}</div>
          </div>
          <div class="paper-card__author-info">
            <span class="paper-card__lead-author">${p.leadAuthor}</span>
            ${authorListHtml}
          </div>
        </div>

      </article>`;
  }

  grid.innerHTML = papers.map(renderCard).join('');

  /* ── Step 9: Interactive Detail Modals ───────────────────── */
  function openPaperModal(p) {
    const authorPhoto = p.authorPhotoUrl || `assets/images/accepted-authors/${p.slug}.jpg`;
    const paperImg = p.visualUrl || '';
    const hasVisual = !!p.visualUrl;

    const overlay = document.createElement('div');
    overlay.className = 'paper-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', `modal-title-${p.id}`);

    overlay.innerHTML = `
      <div class="paper-modal">
        <button class="paper-modal__close" aria-label="Close details window">&times;</button>
        <div class="paper-modal__container">
          
          <!-- Header Section -->
          <div class="paper-modal__header">
            <div class="paper-modal__meta-header">
              <span class="paper-modal__id">#${p.id}</span>
              <span class="paper-modal__area">${p.area}</span>
              ${p.pref ? `<span class="paper-modal__pref">${prefLabel(p.pref)}</span>` : ''}
            </div>
            <h1 class="paper-modal__title" id="modal-title-${p.id}">${p.title}</h1>
          </div>
          
          <!-- Tabs Navigation -->
          <div class="paper-modal__tabs">
            <button class="paper-modal__tab-btn paper-modal__tab-btn--active" 
                    data-tab="info">Author Info</button>
            <button class="paper-modal__tab-btn" 
                    data-tab="graphic" 
                    style="${hasVisual ? '' : 'display:none'}">Abstract Graphic</button>
          </div>

          <!-- Tab Content: Abstract Graphic -->
          <div class="paper-modal__tab-content" data-tab="graphic" hidden>
            <div class="paper-modal__visual">
              ${p.visualUrl 
                ? `<img src="${p.visualUrl}"
                        alt="Visual graphic for: ${p.title}"
                        class="paper-modal__visual-img"
                        onerror="this.parentElement.style.display='none';">`
                : `<img alt="Visual graphic for: ${p.title}"
                        class="paper-modal__visual-img">`
              }
            </div>
          </div>
          
          <!-- Tab Content: Author Info -->
          <div class="paper-modal__tab-content" data-tab="info">
            <div class="paper-modal__author-profile">
              <div class="paper-modal__author-photo-column">
                <div class="paper-modal__photo-wrap">
                  <img src="${authorPhoto}"
                       alt="${p.leadAuthor}"
                       class="paper-modal__photo"
                       onerror="this.style.display='none';
                                this.nextElementSibling.style.display='flex'">
                  <div class="paper-modal__avatar" style="display:none" aria-hidden="true">${p.initials}</div>
                </div>
              </div>
              
              <div class="paper-modal__author-details-column">
                <div class="paper-modal__info-grid">
                  <div class="paper-modal__info-item">
                    <span class="paper-modal__info-label">Presenting Author</span>
                    <span class="paper-modal__info-val">${p.leadAuthor}</span>
                  </div>
                  
                  <div class="paper-modal__info-item">
                    <span class="paper-modal__info-label">All Authors</span>
                    <span class="paper-modal__info-val">${p.allAuthors}</span>
                  </div>
                  
                  ${p.university ? `
                  <div class="paper-modal__info-item">
                    <span class="paper-modal__info-label">University</span>
                    <span class="paper-modal__info-val">${p.university}</span>
                  </div>` : ''}
                  
                  ${p.department ? `
                  <div class="paper-modal__info-item">
                    <span class="paper-modal__info-label">Department</span>
                    <span class="paper-modal__info-val">${p.department}</span>
                  </div>` : ''}
                  
                  ${p.program ? `
                  <div class="paper-modal__info-item">
                    <span class="paper-modal__info-label">Program</span>
                    <span class="paper-modal__info-val">${p.program}</span>
                  </div>` : ''}
                  
                  ${p.supervisor ? `
                  <div class="paper-modal__info-item">
                    <span class="paper-modal__info-label">Supervisor(s)</span>
                    <span class="paper-modal__info-val">${p.supervisor}</span>
                  </div>` : ''}
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden'; // Stop background scrolling

    // Fade-in effect via CSS opacity transition
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.25s ease';
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });

    // Tab switching event listeners
    const tabBtns = overlay.querySelectorAll('.paper-modal__tab-btn');
    const tabContents = overlay.querySelectorAll('.paper-modal__tab-content');
    
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        
        tabBtns.forEach(b => b.classList.remove('paper-modal__tab-btn--active'));
        btn.classList.add('paper-modal__tab-btn--active');
        
        tabContents.forEach(content => {
          if (content.dataset.tab === targetTab) {
            content.removeAttribute('hidden');
          } else {
            content.setAttribute('hidden', '');
          }
        });
      });
    });

    // Close logic
    function close() {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.remove();
        document.body.style.overflow = '';
      }, 250);
      document.removeEventListener('keydown', handleKey);
    }

    overlay.querySelector('.paper-modal__close').addEventListener('click', close);
    overlay.addEventListener('click', e => {
      if (e.target === overlay) close();
    });

    function handleKey(e) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', handleKey);

    // Dynamically probe local file extensions if no direct visual link is specified in additional-details.csv
    if (!p.visualUrl) {
      const visualBox = overlay.querySelector('.paper-modal__visual');
      const imgEl = visualBox.querySelector('img');
      const localExtensions = ['.gif', '.png', '.jpg', '.jpeg'];
      let extIdx = 0;
      const base = `assets/images/accepted-papers/${p.slug}`;
      
      function tryNext() {
        if (extIdx >= localExtensions.length) return; // all failed - slot remains hidden
        const src = base + localExtensions[extIdx];
        extIdx++;
        const probe = new Image();
        probe.onload = () => {
          imgEl.src = src;
          
          // Re-enable and show the graphic tab dynamically!
          const graphicTabBtn = overlay.querySelector('.paper-modal__tab-btn[data-tab="graphic"]');
          if (graphicTabBtn) {
            graphicTabBtn.style.display = 'block'; // Make it visible
          }
        };
        probe.onerror = tryNext;
        probe.src = src;
      }
      tryNext();
    }
  }

  // Attach card click handlers via delegation
  grid.addEventListener('click', e => {
    const card = e.target.closest('.paper-card');
    if (!card) return;
    
    const id = card.dataset.id;
    const paper = papers.find(p => p.id === id);
    if (paper) {
      openPaperModal(paper);
    }
  });

  /* ── Observe scroll-reveal ───────────────────────────────── */
  AISSH.observeReveal(grid);

  /* ── Update count display ────────────────────────────────── */
  function updateCount() {
    const visible = grid.querySelectorAll('.paper-card:not(.paper-card--hidden)').length;
    const total = papers.length;
    if (countEl) {
      countEl.textContent = visible === total
        ? `Showing all ${total} accepted abstracts`
        : `Showing ${visible} of ${total} accepted abstracts`;
    }
    if (emptyEl) {
      emptyEl.hidden = visible > 0;
    }
  }

  updateCount();

  /* ── Step 10A: Search ────────────────────────────────────── */
  let activeFilter = 'all';
  let searchQuery = '';

  function applyFilters() {
    const cards = grid.querySelectorAll('.paper-card');
    cards.forEach(card => {
      const matchesSearch = searchQuery === '' ||
        card.dataset.title.includes(searchQuery) ||
        card.dataset.authors.includes(searchQuery) ||
        ('#' + card.dataset.id).includes(searchQuery) ||
        card.dataset.id.includes(searchQuery);

      const matchesFilter = activeFilter === 'all' ||
        card.dataset.area === activeFilter;

      card.classList.toggle('paper-card--hidden', !(matchesSearch && matchesFilter));
    });
    updateCount();
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value.toLowerCase().trim();
      applyFilters();
    });
  }

  /* ── Step 10B: Filter pills ──────────────────────────────── */
  if (filterBar) {
    filterBar.addEventListener('click', e => {
      const pill = e.target.closest('.filter-pill');
      if (!pill) return;
      filterBar.querySelectorAll('.filter-pill').forEach(p =>
        p.classList.remove('filter-pill--active'));
      pill.classList.add('filter-pill--active');
      activeFilter = pill.dataset.filter;
      applyFilters();
    });
  }

  /* ── Step 10D: Reset button ──────────────────────────────── */
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) { searchInput.value = ''; }
      searchQuery = '';
      activeFilter = 'all';
      if (filterBar) {
        filterBar.querySelectorAll('.filter-pill').forEach(p =>
          p.classList.remove('filter-pill--active'));
        const allPill = filterBar.querySelector('[data-filter="all"]');
        if (allPill) allPill.classList.add('filter-pill--active');
      }
      applyFilters();
    });
  }
});
