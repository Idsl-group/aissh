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

  /* ── Step 1: Fetch CSV ───────────────────────────────────── */
  let csvText;
  try {
    const res = await fetch('data/responses.csv?v=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    csvText = await res.text();
  } catch (err) {
    console.warn('[AISSH] Could not load responses.csv', err);
    grid.innerHTML = '<p style="color:var(--color-slate);text-align:center;padding:3rem 0;">Could not load abstracts.</p>';
    return;
  }

  /* ── Step 2: Parse CSV ───────────────────────────────────── */
  // Handles quoted fields, embedded commas, escaped double-quotes (""),
  // and both \r\n and \n line endings.
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

  const allRows = parseCSV(csvText);
  const headers = allRows[0];   // Row 0 = column headers
  const dataRows = allRows.slice(1);

  // Map column names to indices
  const col = {};
  headers.forEach((h, i) => { col[h.trim()] = i; });

  /* ── Step 3: Filter valid rows ───────────────────────────── */
  // Keep only rows that have a non-empty Abstract Title AND a non-empty Timestamp
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
  // For identical titles keep the LATER submission (higher timestamp).
  const titleMap = new Map(); // normalised title → row

  valid.forEach(row => {
    const normTitle = cell(row, COL_TITLE).toLowerCase();
    if (!titleMap.has(normTitle)) {
      titleMap.set(normTitle, row);
    } else {
      // Compare timestamps — keep the later one
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

  const papers = sorted.map((row, idx) => ({
    id: String(idx + 1).padStart(2, '0'),
    slug: makeSlug(cell(row, COL_FULLNAME)),
    title: cell(row, COL_TITLE),
    leadAuthor: cell(row, COL_FULLNAME),
    allAuthors: cell(row, COL_AUTHORS) || cell(row, COL_FULLNAME),
    area: cell(row, COL_AREA),
    pref: cell(row, COL_PREF) || '',
    initials: AISSH.initials(cell(row, COL_FULLNAME) || 'A B'),
  }));

  /* ── Step 8: Render cards ────────────────────────────────── */
  function prefLabel(pref) {
    const map = { 'Talk': 'Poster', 'Poster': 'Poster', 'Either': 'Poster' };
    return map[pref] || pref || 'Presentation';
  }

  function renderCard(p) {
    const authorPhoto = `assets/images/accepted-authors/${p.slug}.jpg`;
    const paperImg = `assets/images/accepted-papers/${p.slug}.gif`;

    // Show the full author list only if different from lead author name
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

        <!-- Paper visual (image / gif — hidden until image loads) -->
        <div class="paper-card__visual" id="visual-${p.id}" hidden
             aria-hidden="true">
          <img src="${paperImg}"
               alt="Visual for: ${p.title}"
               class="paper-card__visual-img"
               loading="lazy">
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

  /* ── Lazy-load paper visuals with extension fallback ─────── */
  // Try .gif → .png → .jpg; show the slot only if one succeeds.
  const extensions = ['.gif', '.png', '.jpg', '.jpeg'];

  papers.forEach(p => {
    const visualEl = document.getElementById(`visual-${p.id}`);
    if (!visualEl) return;
    const imgEl = visualEl.querySelector('img');
    if (!imgEl) return;

    let extIdx = 0;
    const base = `assets/images/accepted-papers/${p.slug}`;

    function tryNext() {
      if (extIdx >= extensions.length) return; // all failed — slot stays hidden
      const src = base + extensions[extIdx];
      extIdx++;
      const probe = new Image();
      probe.onload = () => {
        imgEl.src = src;
        visualEl.removeAttribute('hidden');
      };
      probe.onerror = tryNext;
      probe.src = src;
    }
    tryNext();
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
