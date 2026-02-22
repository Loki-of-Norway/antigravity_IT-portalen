/* ==========================================
   Brukerstøtteportal - Auth (Login/Register)
   ========================================== */

document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
});

/**
 * Handle Login Form Submission
 */
function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Redirect based on role
      const role = data.user ? data.user.role : 'ingen';
      alert('Innlogging vellykket! (Rolle: ' + role + ')');
      
      if (role === 'admin') {
          window.location.href = '/admin/index.html';
      } else {
          window.location.href = '/index.html';
      }
    } else {
      alert('Feil: ' + data.message);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('En feil oppstod under innlogging.');
  });
}

/**
 * Handle Registration Form Submission
 */
function handleRegister(e) {
  e.preventDefault();
  
  const username = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  if (password !== confirmPassword) {
    alert('Passordene samsvarer ikke!');
    return;
  }
  
  fetch('/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, email, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('Registrering vellykket! Du kan nå logge inn.');
      window.location.href = 'login.html';
    } else {
      alert('Feil: ' + data.message);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('En feil oppstod under registrering.');
  });
}
