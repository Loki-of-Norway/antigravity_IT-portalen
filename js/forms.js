/* ==========================================
   Brukerstøtteportal - Forms (Contact/Feedback)
   ========================================== */

document.addEventListener('DOMContentLoaded', function() {
  const contactForm = document.getElementById('contactForm');
  const feedbackForm = document.getElementById('feedbackForm');

  if (contactForm) {
    contactForm.addEventListener('submit', handleContactSubmit);
  }

  if (feedbackForm) {
    initRatingSelection();
    feedbackForm.addEventListener('submit', handleFeedbackSubmit);
  }
});

/**
 * Handle Contact Form Submission
 */
function handleContactSubmit(e) {
  e.preventDefault();
  
  const data = Object.fromEntries(new FormData(this).entries());

  fetch('/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert(data.message);
      this.reset();
    } else {
      alert('Feil: ' + data.message);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('En feil oppstod under sending av melding.');
  });
}

/**
 * Rating Selection Logic for Feedback Form
 */
function initRatingSelection() {
  const ratingOptions = document.querySelectorAll('.rating-option');
  const ratingInput = document.getElementById('ratingInput');
  
  if (!ratingOptions.length || !ratingInput) return;

  ratingOptions.forEach(option => {
    option.addEventListener('click', () => {
      // Remove active class from all
      ratingOptions.forEach(opt => opt.classList.remove('active'));
      // Add to clicked
      option.classList.add('active');
      // Set hidden input value
      ratingInput.value = option.dataset.value;
    });
  });
}

/**
 * Handle Feedback Form Submission
 */
function handleFeedbackSubmit(e) {
  e.preventDefault();
  
  const ratingInput = document.getElementById('ratingInput');
  if (ratingInput && !ratingInput.value) {
    alert('Vennligst velg en vurdering.');
    return;
  }
  
  const rating = ratingInput ? ratingInput.value : null;
  const category = document.getElementById('category').value;
  const comment = document.getElementById('feedbackText').value;

  fetch('/api/feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ rating, category, comment })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert(data.message);
      this.reset();
      const ratingOptions = document.querySelectorAll('.rating-option');
      if (ratingOptions) {
        ratingOptions.forEach(opt => opt.classList.remove('active'));
      }
      if (ratingInput) {
        ratingInput.value = '';
      }
    } else {
      alert('Feil: ' + data.message);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('En feil oppstod under sending av tilbakemelding.');
  });
}
