/* ============================================================
   CONTACT.JS — Dynamically render contact cards from JSON
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const chairsGrid = document.getElementById('contact-chairs-grid');
  const coordinatorsGrid = document.getElementById('contact-coordinators-grid');

  if (!chairsGrid || !coordinatorsGrid) return;

  try {
    const data = await AISSH.loadData('data/organizers.json');
    if (!data) throw new Error("No data returned");

    const renderCard = (person, defaultTag) => {
      const emailLink = person.email ? `mailto:${person.email}` : '#';
      const emailText = person.email ? person.email : 'Email (to be added)';
      
      return `
        <div class="contact-card">
          <span class="contact-card__tag">${defaultTag}</span>
          <h4 class="contact-card__name">${person.name}</h4>
          <p class="contact-card__role">${person.role}</p>
          <a href="${emailLink}" class="contact-card__link">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              aria-hidden="true">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            ${emailText}
          </a>
        </div>
      `;
    };

    if (data.contacts) {
      const activeContacts = data.contacts.filter(c => c.show_in_contact);
      chairsGrid.innerHTML = activeContacts.map(c => renderCard(c, c.contact_role || 'General Chair')).join('');
    }

    if (data.coordinators) {
      const activeCoordinators = data.coordinators.filter(c => c.show_in_contact);
      coordinatorsGrid.innerHTML = activeCoordinators.map(c => renderCard(c, c.contact_role || 'Coordinator')).join('');
    }

  } catch (err) {
    console.error('Error loading contacts:', err);
    chairsGrid.innerHTML = '<p style="color:var(--color-amber);">Failed to load contacts.</p>';
  }
});
