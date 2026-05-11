/* ============================================================
   HOME.JS — Homepage dynamic sections
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {

  // ── Conference metadata ───────────────────────────────────
  const conf = await AISSH.loadData('data/conference.json');
  if (conf) {
    const dateEl = document.getElementById('hero-date');
    if (dateEl) dateEl.textContent = conf.date || 'Date & Venue to be announced';
  }

  // ── Key Dates ─────────────────────────────────────────────
  const datesData = await AISSH.loadData('data/dates.json');
  const datesContainer = document.getElementById('key-dates-list');
  if (datesData && datesContainer) {
    // Only show dates that have a confirmed value OR are highlighted TBD
    const items = datesData.dates.map(d => {
      const past    = d.date ? AISSH.isPast(d.date) : false;
      const dateStr = d.date ? AISSH.formatDate(d.date) : 'To be announced';
      const cls = [
        'key-date-item',
        (d.highlight && d.date) ? 'key-date-item--highlight' : '',
        past                    ? 'key-date-item--past'       : '',
        !d.date                 ? 'key-date-item--tbd'        : '',
      ].filter(Boolean).join(' ');
      return `
        <div class="${cls}">
          <span class="key-date-item__dot" aria-hidden="true"></span>
          <div class="key-date-item__text">
            <time class="key-date-item__date" ${d.date ? `datetime="${d.date}"` : ''}>${dateStr}</time>
            <span class="key-date-item__label">${d.label}</span>
          </div>
        </div>`;
    }).join('');
    datesContainer.innerHTML = items;
  }

  // ── Speaker Preview (first 4) ─────────────────────────────
  const speakersData = await AISSH.loadData('data/speakers.json');
  const speakersContainer = document.getElementById('speakers-preview-grid');
  if (speakersData && speakersContainer) {
    const preview = speakersData.speakers.slice(0, 4);
    speakersContainer.innerHTML = preview.map(s => {
      const initials = AISSH.initials(s.name);
      return `
        <article class="speaker-preview-card" tabindex="0" role="button"
                 aria-label="View bio for ${s.name}"
                 data-speaker-id="${s.id}">
          <div class="speaker-preview-card__photo-wrap">
            <img src="${s.photo}" alt="${s.name}"
                 class="speaker-preview-card__photo"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <div class="speaker-preview-card__avatar" style="display:none" aria-hidden="true">
              ${initials}
            </div>
          </div>
          <div class="speaker-preview-card__body">
            <p class="speaker-preview-card__name">${s.name}</p>
            <p class="speaker-preview-card__affiliation">${s.affiliation || 'Affiliation to be announced'}</p>
          </div>
        </article>`;
    }).join('');
    AISSH.observeReveal(speakersContainer);
  }

  // ── Quick Schedule ────────────────────────────────────────
  const schedData = await AISSH.loadData('data/schedule.json');
  const schedContainer = document.getElementById('quick-schedule-list');
  if (schedData && schedContainer) {
    schedContainer.innerHTML = schedData.sessions.map(s => {
      const dotColor = AISSH.sessionDotColor[s.type] || '#4A5568';
      return `
        <div class="quick-schedule-row">
          <span class="quick-schedule-row__time">${s.time}</span>
          <span class="quick-schedule-row__dot" style="background-color:${dotColor}" aria-hidden="true"></span>
          <span class="quick-schedule-row__title">${s.title}</span>
          ${s.speaker ? `<span class="quick-schedule-row__speaker">${s.speaker}</span>` : ''}
        </div>`;
    }).join('');
  }

  // ── CFP banner deadline ───────────────────────────────────
  const deadlineEl = document.getElementById('cfp-deadline-display');
  if (deadlineEl && datesData) {
    const sub = datesData.dates.find(d => d.category === 'submission' && d.highlight);
    deadlineEl.textContent = (sub && sub.date) ? AISSH.formatDate(sub.date) : 'To be announced';
  }

  // ── Hero headline word-stagger animation ──────────────────
  const headline = document.querySelector('.hero__headline');
  if (headline) {
    const words = headline.textContent.trim().split(/\s+/);
    headline.innerHTML = words.map((w, i) =>
      `<span class="word" style="animation-delay:${0.1 + i * 0.07}s">${w}</span>`
    ).join(' ');
  }

});
