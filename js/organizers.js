/* ============================================================
   ORGANIZERS.JS — Render organizer cards
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const data = await AISSH.loadData('data/organizers.json');
  if (!data) return;

  function renderCard(person) {
    const initials = AISSH.initials(person.name);
    return `
      <article class="organizer-card">
        <div class="organizer-card__photo-wrap">
          <img src="${person.photo}" alt="${person.name}"
               class="organizer-card__photo"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div class="organizer-card__avatar" style="display:none" aria-hidden="true">${initials}</div>
        </div>
        <h3 class="organizer-card__name">${person.name}</h3>
        <p class="organizer-card__role">${person.role}</p>
        ${person.institution ? `<p class="organizer-card__institution">${person.institution}</p>` : ''}
        ${person.email ? `
          <a href="mailto:${person.email}" class="organizer-card__email">
            ${AISSH.icons.mail} ${person.email}
          </a>` : ''}
      </article>`;
  }

  const contactsGrid = document.getElementById('contacts-grid');
  if (contactsGrid && data.contacts) {
    contactsGrid.innerHTML = data.contacts.map(renderCard).join('');
    AISSH.observeReveal(contactsGrid);
  }

  const coordsGrid = document.getElementById('coordinators-grid');
  if (coordsGrid && data.coordinators) {
    coordsGrid.innerHTML = data.coordinators.map(renderCard).join('');
    AISSH.observeReveal(coordsGrid);
  }
});
