/* ============================================================
   SCHEDULE.JS — Render vertical timeline programme
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const timeline = document.getElementById('schedule-timeline');
  if (!timeline) return;

  const data = await AISSH.loadData('data/schedule.json');
  if (!data) {
    timeline.innerHTML = '<p style="color:var(--color-slate); padding:2rem 0;">Schedule data unavailable.</p>';
    return;
  }

  timeline.innerHTML = data.sessions.map(s => {
    const typeLabel = s.type.charAt(0).toUpperCase() + s.type.slice(1);
    return `
      <div class="session-block session-block--${s.type}">
        <span class="session-block__time">${s.time}</span>
        <div class="session-block__icon" aria-hidden="true">
          ${AISSH.sessionIcon(s.type)}
        </div>
        <div class="session-block__content">
          <span class="session-block__type-tag">${typeLabel}</span>
          <h3 class="session-block__title">${s.title}</h3>
          ${s.speaker ? `<p class="session-block__speaker">${s.speaker}</p>` : ''}
          ${s.affiliation ? `<p class="session-block__affiliation">${s.affiliation}</p>` : ''}
          ${s.details    ? `<p class="session-block__details">${s.details}</p>` : ''}
        </div>
      </div>`;
  }).join('');
});
