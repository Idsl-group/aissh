/* ============================================================
   SPEAKERS.JS — Speakers grid + bio modal
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const data = await AISSH.loadData('data/speakers.json');
  if (!data) return;

  const grid    = document.getElementById('speakers-grid');
  const overlay = document.getElementById('modal-overlay');
  const modal   = document.getElementById('speaker-modal');
  if (!grid || !overlay || !modal) return;

  // ── Render speaker cards ───────────────────────────────────
  grid.innerHTML = data.speakers.map(s => {
    const initials = AISSH.initials(s.name);
    return `
      <article class="speaker-card" tabindex="0" role="button"
               aria-label="View bio for ${s.name}"
               data-speaker-id="${s.id}">
        <div class="speaker-card__photo-wrap">
          <img src="${s.photo}" alt="${s.name}"
               class="speaker-card__photo"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div class="speaker-card__avatar" style="display:none" aria-hidden="true">${initials}</div>
          ${s.status === 'confirmed' ? `
            <span class="speaker-card__status">
              <span class="badge badge-confirmed">Confirmed</span>
            </span>` : ''}
        </div>
        <div class="speaker-card__body">
          <h2 class="speaker-card__name">${s.name}</h2>
          ${s.title       ? `<p class="speaker-card__title">${s.title}</p>` : ''}
          <p class="speaker-card__affiliation">${s.affiliation || 'Affiliation to be announced'}</p>
          ${s.talk_title ? `
            <div class="speaker-card__talk">
              <span class="speaker-card__talk-label">Keynote Talk</span>
              <span class="speaker-card__talk-title">${s.talk_title}</span>
            </div>` : ''}
        </div>
      </article>`;
  }).join('');

  // Observe any reveal elements within the grid
  AISSH.observeReveal(grid);

  // ── Modal references ───────────────────────────────────────
  const modalPhotoWrap = modal.querySelector('.modal__photo-wrap');
  const modalName      = modal.querySelector('.modal__name');
  const modalTitle     = modal.querySelector('.modal__title');
  const modalBio       = modal.querySelector('.modal__bio');
  const modalTalkBox   = modal.querySelector('.modal__talk-box');
  const modalTalkTitle = modal.querySelector('.modal__talk-title');
  const modalClose     = modal.querySelector('.modal__close');

  let isOpen      = false;
  let lastFocused = null; // element to return focus to on close

  // ── Open modal ─────────────────────────────────────────────
  function openModal(speakerId) {
    if (isOpen) return;
    const s = data.speakers.find(x => x.id === speakerId);
    if (!s) return;

    const initials = AISSH.initials(s.name);
    modalPhotoWrap.innerHTML = `
      <img src="${s.photo}" alt="${s.name}" class="modal__photo"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="modal__avatar" style="display:none" aria-hidden="true">${initials}</div>`;

    modalName.textContent  = s.name;
    modalTitle.textContent = [s.title, s.affiliation].filter(Boolean).join(' · ') || 'Affiliation to be announced';
    modalBio.textContent   = s.bio || 'Full biography coming soon.';

    if (s.talk_title && s.talk_title !== 'Talk title to be announced') {
      modalTalkTitle.textContent = s.talk_title;
      modalTalkBox.hidden = false;
    } else {
      modalTalkBox.hidden = true;
    }

    isOpen = true;
    overlay.hidden = false;
    overlay.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';

    // Focus the close button after a tiny delay to avoid the triggering click
    setTimeout(() => { if (modalClose) modalClose.focus(); }, 50);
  }

  // ── Close modal ────────────────────────────────────────────
  function closeModal() {
    if (!isOpen) return;
    isOpen = false;
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // Return focus to the card that opened the modal
    if (lastFocused) { lastFocused.focus(); lastFocused = null; }
  }

  // ── Event: card click ──────────────────────────────────────
  grid.addEventListener('click', e => {
    const card = e.target.closest('[data-speaker-id]');
    if (!card) return;
    lastFocused = card;
    openModal(card.dataset.speakerId);
  });

  // Keyboard activation on cards
  grid.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('[data-speaker-id]');
    if (!card) return;
    e.preventDefault();
    lastFocused = card;
    openModal(card.dataset.speakerId);
  });

  // ── Event: close button ────────────────────────────────────
  if (modalClose) {
    modalClose.addEventListener('click', e => {
      e.stopPropagation(); // prevent bubbling to overlay
      closeModal();
    });
  }

  // ── Event: click overlay backdrop (not modal content) ──────
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });

  // ── Event: Escape key ──────────────────────────────────────
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) closeModal();
  });
});
