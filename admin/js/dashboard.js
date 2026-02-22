/* ==========================================
   Admin Dashboard Logic
   ========================================== */

document.addEventListener('DOMContentLoaded', function() {
  // Check Session
  checkAdminAuth();

  // Navigation Logic
  initNavigation();

  // Load Initial Data
  loadOverviewStats();
  initCharts();

  // Content Form Submission
  document.getElementById('contentForm').addEventListener('submit', saveContent);
});

/**
 * Check if user is logged in as admin
 */
function checkAdminAuth() {
  // Simpel session sjekk via fetch (eller sjekk localStorage hvis lagret der)
  // For MVP: Prøv å hente stats, hvis 401/403 -> send til login
  fetch('/api/admin/stats')
    .then(res => {
        if (res.status === 401 || res.status === 403) {
            window.location.href = '../pages/login.html';
        }
        return res.json();
    })
    .then(data => {
        if (data.success) {
            document.getElementById('admin-name').innerText = 'Admin';
        }
    })
    .catch(err => console.error('Auth sjekk feilet:', err));
}

/**
 * Handle sidebar navigation
 */
function initNavigation() {
  const navLinks = document.querySelectorAll('.sidebar-nav a');
  const viewTitle = document.getElementById('view-title');
  const views = document.querySelectorAll('.view');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = link.dataset.view;

      // Update Active State
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Update Header Title
      viewTitle.innerText = link.innerText.trim();

      // Show/Hide Views
      views.forEach(v => v.style.display = 'none');
      document.getElementById(`${targetView}-view`).style.display = 'block';

      // Load View Data
      loadViewData(targetView);
    });
  });

  // Load user info for header
  fetch('/api/admin/stats')
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Vi kunne lagret brukernavn i session her
            document.getElementById('admin-name').innerText = 'System Admin';
        }
    });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    // Implementer utlogging API hvis nødvendig, eller bare tøm sesjon og redirect
    window.location.href = '../pages/login.html';
  });
}

/**
 * Load data based on active view
 */
function loadViewData(view) {
    switch(view) {
        case 'overview':
            loadOverviewStats();
            break;
        case 'users':
            loadUsers();
            break;
        case 'feedback':
            loadFeedback();
            break;
        case 'contacts':
            loadContacts();
            break;
        case 'analytics':
            initCharts();
            break;
        case 'content':
            loadGuides();
            break;
    }
}

/**
 * Tab switching for Content view
 */
window.showContentTab = function(tab) {
    document.getElementById('guides-tab').style.display = tab === 'guides' ? 'block' : 'none';
    document.getElementById('faqs-tab').style.display = tab === 'faqs' ? 'block' : 'none';
    if (tab === 'faqs') loadFAQs();
    else loadGuides();
}

/**
 * Fetch and display overview stats
 */
function loadOverviewStats() {
    fetch('/api/admin/stats')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                document.getElementById('stat-users').innerText = data.stats.users;
                document.getElementById('stat-feedback').innerText = data.stats.feedback;
                document.getElementById('stat-contacts').innerText = data.stats.contacts;
                document.getElementById('stat-guides').innerText = data.stats.guides;
            }
        });
}

/**
 * Fetch and list all members
 */
function loadUsers() {
    fetch('/api/admin/users')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const tbody = document.getElementById('users-table-body');
                tbody.innerHTML = data.users.map(user => `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.username}</td>
                        <td>${user.email}</td>
                        <td><span class="badge ${user.role === 'admin' ? 'badge-resolved' : ''}">${user.role}</span></td>
                        <td>${new Date(user.created_at).toLocaleDateString()}</td>
                    </tr>
                `).join('');
            }
        });
}

/**
 * Fetch and list all feedback
 */
function loadFeedback() {
    fetch('/api/admin/feedback')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const list = document.getElementById('feedback-list');
                list.innerHTML = data.feedback.map(item => `
                    <div class="feedback-item">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <strong>${item.username || 'Anonym'}</strong>
                            <span class="text-primary">${'★'.repeat(item.rating)}${'☆'.repeat(4-item.rating)}</span>
                        </div>
                        <p style="margin: 0;">"${item.comment || 'Ingen kommentar'}"</p>
                        <small style="color: var(--text-light);">${new Date(item.created_at).toLocaleString()}</small>
                    </div>
                `).join('');
            }
        });
}

/**
 * Fetch and list contact messages
 */
function loadContacts() {
    fetch('/api/admin/contacts')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const list = document.getElementById('contacts-list');
                list.innerHTML = data.contacts.map(item => `
                    <div class="contact-item">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <div>
                                <h4 style="margin: 0;">${item.subject}</h4>
                                <small>${item.name} (${item.email})</small>
                            </div>
                            <span class="badge badge-${item.status}">${item.status === 'new' ? 'Ny' : 'Løst'}</span>
                        </div>
                        <p style="background: var(--bg-admin); padding: 0.75rem; border-radius: var(--radius-md); font-size: 0.875rem;">
                            ${item.message}
                        </p>
                        ${item.status === 'new' ? `
                            <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                                <input type="text" placeholder="Skriv svar her..." class="form-input" id="resp-${item.id}">
                                <button class="btn btn-primary" onclick="resolveContact(${item.id})">Svar & Løs</button>
                            </div>
                        ` : `
                            <div style="margin-top: 0.5rem; color: #059669; font-size: 0.875rem;">
                                <strong>Svar:</strong> ${item.admin_response}
                            </div>
                        `}
                    </div>
                `).join('');
            }
        });
}

/**
 * Resolve a contact message
 */
window.resolveContact = function(id) {
    const response = document.getElementById(`resp-${id}`).value;
    if (!response) return alert('Vennligst skriv et svar.');

    fetch('/api/admin/contacts/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, response })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            loadContacts();
            loadOverviewStats();
        }
    });
}

/**
 * Initialize Analytics Charts
 */
function initCharts() {
    const ctx = document.getElementById('usersChart').getContext('2d');
    
    fetch('/api/admin/analytics/users')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const labels = data.data.map(d => new Date(d.date).toLocaleDateString());
                const values = data.data.map(d => d.count);

                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Nye brukere',
                            data: values,
                            borderColor: '#2563eb',
                            backgroundColor: 'rgba(37, 99, 235, 0.1)',
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: { beginAtZero: true, ticks: { stepSize: 1 } }
                        }
                    }
                });
            }
        });

    // Chatbot Analytics
    const chatCtx = document.getElementById('chatbotChart').getContext('2d');
    fetch('/api/admin/analytics/chatbot')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                new Chart(chatCtx, {
                    type: 'bar',
                    data: {
                        labels: data.data.map(d => d.keyword),
                        datasets: [{
                            label: 'Antall treff',
                            data: data.data.map(d => d.count),
                            backgroundColor: '#60a5fa'
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true
                    }
                });
            }
        });
}

/**
 * Modal Controls
 */
window.openContentModal = function(type, id = null) {
    document.getElementById('contentType').value = type;
    document.getElementById('contentId').value = id || '';
    document.getElementById('modalTitle').innerText = id ? 'Rediger' : 'Ny' + (type === 'guide' ? ' Veiledning' : ' FAQ');
    
    document.getElementById('guide-fields').style.display = type === 'guide' ? 'block' : 'none';
    document.getElementById('faq-fields').style.display = type === 'faq' ? 'block' : 'none';
    
    document.getElementById('contentModal').style.display = 'flex';
}

window.closeContentModal = function() {
    document.getElementById('contentModal').style.display = 'none';
    document.getElementById('contentForm').reset();
}

/**
 * Save Content (Create or Update)
 */
function saveContent(e) {
    e.preventDefault();
    const type = document.getElementById('contentType').value;
    const id = document.getElementById('contentId').value;
    
    let data = {};
    if (type === 'guide') {
        data = {
            title: document.getElementById('guideTitle').value,
            category: document.getElementById('guideCategory').value,
            content: document.getElementById('guideContent').value,
            slug: document.getElementById('guideSlug').value || document.getElementById('guideTitle').value.toLowerCase().replace(/ /g, '-')
        };
    } else {
        data = {
            question: document.getElementById('faqQuestion').value,
            answer: document.getElementById('faqAnswer').value,
            category: document.getElementById('faqCategory').value
        };
    }

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/admin/${type}s/${id}` : `/api/admin/${type}s`;

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            closeContentModal();
            if (type === 'guide') loadGuides();
            else loadFAQs();
            loadOverviewStats();
        } else {
            alert('Feil ved lagring: ' + data.message);
        }
    });
}

/**
 * Delete Content
 */
window.deleteGuide = function(id) {
    if (!confirm('Er du sikker på at du vil slette denne veiledningen?')) return;
    fetch(`/api/admin/guides/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => { if (data.success) loadGuides(); });
}

window.deleteFAQ = function(id) {
    if (!confirm('Er du sikker på at du vil slette denne FAQ-en?')) return;
    fetch(`/api/admin/faqs/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => { if (data.success) loadFAQs(); });
}

/**
 * Load Guides for management
 */
function loadGuides() {
    fetch('/api/admin/guides')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const tbody = document.getElementById('guides-table-body');
                tbody.innerHTML = data.guides.map(g => `
                    <tr>
                        <td>${g.title}</td>
                        <td>${g.category}</td>
                        <td>${new Date(g.created_at).toLocaleDateString()}</td>
                        <td>
                            <button class="btn btn-outline btn-sm" onclick="editGuide(${g.id})">Rediger</button>
                            <button class="btn btn-outline btn-sm" style="color: #ef4444; border-color: #ef4444;" onclick="deleteGuide(${g.id})">Slett</button>
                        </td>
                    </tr>
                `).join('');
            }
        });
}

/**
 * Load FAQs for management
 */
function loadFAQs() {
    fetch('/api/admin/faqs')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const tbody = document.getElementById('faqs-table-body');
                tbody.innerHTML = data.faqs.map(f => `
                    <tr>
                        <td>${f.question}</td>
                        <td>${f.category}</td>
                        <td>
                            <button class="btn btn-outline btn-sm" onclick="editFAQ(${f.id})">Rediger</button>
                            <button class="btn btn-outline btn-sm" style="color: #ef4444; border-color: #ef4444;" onclick="deleteFAQ(${f.id})">Slett</button>
                        </td>
                    </tr>
                `).join('');
            }
        });
}
