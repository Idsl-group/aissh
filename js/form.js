/* ============================================================
   FORM.JS — Abstract submission form: validation + iframe submit
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('submission-form');
  const submitBtn = document.getElementById('form-submit-btn');
  const successBanner = document.getElementById('form-success');
  const errorBanner = document.getElementById('form-error');
  const charCounter = document.getElementById('abstract-char-count');
  const abstractField = document.getElementById('field-abstract');
  const iframe = document.getElementById('submission-iframe');

  // ── Load thematic areas into select + sidebar ─────────────
  const areasData = await AISSH.loadData('data/areas.json');
  const areaSelect = document.getElementById('field-area');
  if (areasData && areaSelect) {
    areasData.areas.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = a.label;
      areaSelect.appendChild(opt);
    });
  }

  // Populate sidebar area list
  const areasList = document.getElementById('cfp-areas-list');
  if (areasData && areasList) {
    areasList.innerHTML = areasData.areas
      .filter(a => a.id !== 'other')
      .map(a => `
        <div class="cfp-area-item">
          <span class="cfp-area-item__label">${a.label}</span>
          ${a.description ? `<span class="cfp-area-item__desc">${a.description}</span>` : ''}
        </div>`).join('');
  }

  if (!form) return;

  // ── Load Google Form action URL ────────────────────────────
  const confData = await AISSH.loadData('data/conference.json');
  if (confData && confData.google_form_action_url) {
    form.action = confData.google_form_action_url;
  }

  // ── Character counter ─────────────────────────────────────
  if (abstractField && charCounter) {
    const MAX = 2000;
    const update = () => {
      const len = abstractField.value.length;
      charCounter.textContent = `${len} / ${MAX} characters`;
      charCounter.style.color = len > MAX ? 'var(--color-amber)' : '';
    };
    abstractField.addEventListener('input', update);
    update();
  }

  // ── Field validation helpers ──────────────────────────────
  function setError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.classList.add('error');
    let msg = field.parentElement.querySelector('.form-error-msg');
    if (!msg) {
      msg = document.createElement('span');
      msg.className = 'form-error-msg';
      msg.setAttribute('role', 'alert');
      field.parentElement.appendChild(msg);
    }
    msg.textContent = message;
  }

  function clearError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.classList.remove('error');
    const msg = field.parentElement.querySelector('.form-error-msg');
    if (msg) msg.remove();
  }

  function validateForm() {
    let valid = true;

    const required = [
      { id: 'field-abstract-title', label: 'Abstract title' },
      { id: 'field-name', label: 'Full name' },
      { id: 'field-email', label: 'Email address' },
      { id: 'field-university', label: 'University' },
      { id: 'field-year', label: 'Year of study' },
      { id: 'field-area', label: 'Thematic area' },
      { id: 'field-abstract', label: 'Abstract text' },
    ];

    required.forEach(({ id, label }) => {
      clearError(id);
      const el = document.getElementById(id);
      if (!el) return;
      if (!el.value.trim()) {
        setError(id, `${label} is required.`);
        valid = false;
      }
    });

    // Email format
    const emailEl = document.getElementById('field-email');
    if (emailEl && emailEl.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
      setError('field-email', 'Please enter a valid email address.');
      valid = false;
    }

    // Consent checkbox
    const consent = document.getElementById('field-consent');
    if (consent && !consent.checked) {
      const label = consent.closest('.form-checkbox-item');
      let msg = form.querySelector('#consent-error');
      if (!msg) {
        msg = document.createElement('span');
        msg.id = 'consent-error';
        msg.className = 'form-error-msg';
        msg.setAttribute('role', 'alert');
        label.insertAdjacentElement('afterend', msg);
      }
      msg.textContent = 'You must confirm to submit.';
      valid = false;
    } else {
      const msg = form.querySelector('#consent-error');
      if (msg) msg.remove();
    }

    return valid;
  }

  // ── Submission flow ────────────────────────────────────────
  let submitted = false;

  form.addEventListener('submit', e => {
    if (submitted) { e.preventDefault(); return; }

    if (!validateForm()) {
      e.preventDefault();
      // Scroll to first error
      const firstError = form.querySelector('.error, .form-error-msg');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // If no action URL configured, block real submit and just show success
    if (!form.action || form.action === window.location.href) {
      e.preventDefault();
      showSuccess();
      return;
    }

    // Let real POST fire to Google Forms via hidden iframe
    setSubmitting(true);
  });

  // iframe load = Google Forms responded (success or CORS block — both mean submitted)
  if (iframe) {
    iframe.addEventListener('load', () => {
      if (submitBtn && submitBtn.disabled) {
        showSuccess();
      }
    });
  }

  function setSubmitting(on) {
    if (on) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner" aria-hidden="true"></span> Submitting…`;
      // Fallback: if iframe never fires (blocked), show success after 3s
      setTimeout(() => {
        if (submitBtn.disabled) showSuccess();
      }, 3000);
    }
  }

  function showSuccess() {
    submitted = true;
    form.style.display = 'none';
    if (successBanner) {
      successBanner.classList.add('is-visible');
      successBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // Clear errors on input
  form.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('input', () => {
      if (el.id) clearError(el.id);
    });
  });
});
