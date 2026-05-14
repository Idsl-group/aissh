document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registration-form');
  const submitBtn = document.getElementById('form-submit-btn');
  const successBanner = document.getElementById('form-success');
  const errorBanner = document.getElementById('form-error');
  const hiddenIframe = document.getElementById('hidden_iframe');

  if (!form) return;

  // We set a variable in the global scope so the iframe onload can check it
  window.submitted = false;

  form.addEventListener('submit', (e) => {
    // Basic validation
    const requiredInputs = form.querySelectorAll('[required]');
    let isValid = true;
    requiredInputs.forEach(input => {
      if (!input.value && input.type !== 'radio') {
        isValid = false;
      }
    });

    // Special check for radios
    const radioGroups = ['entry.209893764', 'entry.84335957', 'entry.1668215942'];
    radioGroups.forEach(name => {
      const checked = form.querySelector(`input[name="${name}"]:checked`);
      if (!checked) isValid = false;
      
      // If "Other" is checked, ensure the text input is not empty
      if (checked && checked.value === '__other_option__') {
        const textInput = form.querySelector(`input[name="${name}.other_option_response"]`);
        if (!textInput || !textInput.value.trim()) isValid = false;
      }
    });

    if (!isValid) {
      e.preventDefault();
      errorBanner.style.display = 'flex';
      errorBanner.querySelector('span').textContent = 'Please complete all required fields, including "Other" details if selected.';
      successBanner.style.display = 'none';
      return;
    }

    // Hide error banner, show loading state
    errorBanner.style.display = 'none';
    submitBtn.textContent = 'Registering...';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';

    window.submitted = true;
  });

  // Listen for iframe load which indicates submission completed
  hiddenIframe.addEventListener('load', () => {
    if (window.submitted) {
      // Success!
      form.style.display = 'none';
      successBanner.style.display = 'flex';
      
      // Scroll to success banner
      successBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
});
