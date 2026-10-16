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
        case 'teacher':
            loadTeacherOverview();
            break;
        case 'tickets':
            loadTickets();
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

/* ========================================================
   Teacher Overview & MCP Simulator Logic
   ======================================================== */

window.teacherStudentsData = [];
let teacherCourseChartInstance = null;
let teacherDistributionChartInstance = null;

/**
 * Load complete Teacher Overview
 */
window.loadTeacherOverview = function() {
    loadTeacherStats();
    loadTeacherStudents();
    loadTeacherCourses();
    loadSimulatorSummary();
};

/**
 * Fetch and display Teacher KPIs
 */
function loadTeacherStats() {
    fetch('/api/admin/teacher/stats')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                document.getElementById('teacher-stat-students').innerText = data.stats.totalStudents;
                document.getElementById('teacher-stat-avg-score').innerText = (data.stats.avgClassScore || 0) + '%';
                document.getElementById('teacher-stat-completed').innerText = data.stats.totalCompleted;
                document.getElementById('teacher-stat-at-risk').innerText = data.stats.atRiskStudents;
            }
        })
        .catch(err => console.error('Feil ved henting av lærer-stats:', err));
}

/**
 * Fetch and list students with progress
 */
function loadTeacherStudents() {
    fetch('/api/admin/teacher/students')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                window.teacherStudentsData = data.students;
                renderTeacherStudents(window.teacherStudentsData);
                // Refresh distribution chart once student data is in
                if (window.lastCoursesData) {
                    renderTeacherCharts(window.lastCoursesData);
                }
            }
        })
        .catch(err => console.error('Feil ved henting av elever:', err));
}

/**
 * Render student list into table
 */
function renderTeacherStudents(students) {
    const tbody = document.getElementById('teacher-students-table-body');
    if (!students || students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-gray); padding: 2rem;">Ingen elever funnet. Klikk "🎲 Generer 8 testelever & svar" ovenfor for å opprette testelever!</td></tr>';
        return;
    }

    tbody.innerHTML = students.map(s => {
        const avg = s.avg_score_pct !== null ? Number(s.avg_score_pct) : 0;
        let statusBadge = '<span class="badge badge-info">Ikke startet</span>';
        let barColor = '#94a3b8';

        if (s.total_quiz_attempts > 0) {
            if (avg >= 70) {
                statusBadge = '<span class="badge badge-success">Bestått (A/B)</span>';
                barColor = '#10b981';
            } else if (avg >= 50) {
                statusBadge = '<span class="badge badge-warning">Middels (C/D)</span>';
                barColor = '#f59e0b';
            } else {
                statusBadge = '<span class="badge badge-danger">Trenger oppfølging</span>';
                barColor = '#ef4444';
            }
        }

        const lastActive = s.last_attempt_at ? new Date(s.last_attempt_at).toLocaleDateString() : 'Aldri';

        return `
            <tr>
                <td><strong>${s.username}</strong></td>
                <td><small style="color:var(--text-gray);">${s.email}</small></td>
                <td><span style="font-weight:600;">${s.completed_courses}</span> kurs</td>
                <td>${s.total_quiz_attempts} forsøk</td>
                <td>
                    <div class="score-progress">
                        <span style="min-width: 42px; font-weight:600;">${s.total_quiz_attempts > 0 ? avg + '%' : '-'}</span>
                        <div class="score-bar-bg">
                            <div class="score-bar-fill" style="width: ${Math.min(100, avg)}%; background-color: ${barColor};"></div>
                        </div>
                    </div>
                </td>
                <td>${statusBadge}</td>
                <td>${lastActive}</td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="openStudentModal(${s.id})">
                        🔍 Se svar
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Filter students in UI
 */
window.filterTeacherStudents = function() {
    const search = (document.getElementById('teacherSearchInput').value || '').toLowerCase();
    const filter = document.getElementById('teacherFilterSelect').value;

    const filtered = window.teacherStudentsData.filter(s => {
        const matchesSearch = s.username.toLowerCase().includes(search) || s.email.toLowerCase().includes(search);
        const avg = s.avg_score_pct !== null ? Number(s.avg_score_pct) : 0;

        let matchesFilter = true;
        if (filter === 'passed') {
            matchesFilter = s.total_quiz_attempts > 0 && avg >= 70;
        } else if (filter === 'risk') {
            matchesFilter = s.total_quiz_attempts > 0 && avg < 50;
        }

        return matchesSearch && matchesFilter;
    });

    renderTeacherStudents(filtered);
};

/**
 * Load course statistics and render teacher charts
 */
function loadTeacherCourses() {
    fetch('/api/admin/teacher/courses')
        .then(res => res.json())
        .then(data => {
            if (data.success && data.courses) {
                window.lastCoursesData = data.courses;
                renderTeacherCharts(data.courses);
            }
        })
        .catch(err => console.error('Feil ved henting av kurs-statistikk:', err));
}

function renderTeacherCharts(courses) {
    // 1. Average score per course chart
    const courseCanvas = document.getElementById('teacherCourseChart');
    if (courseCanvas) {
        if (teacherCourseChartInstance) teacherCourseChartInstance.destroy();

        const labels = courses.map(c => c.course_slug);
        const avgScores = courses.map(c => c.avg_score_pct);

        teacherCourseChartInstance = new Chart(courseCanvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels.length > 0 ? labels : ['Ingen kursdata'],
                datasets: [
                    {
                        label: 'Gjennomsnittlig score (%)',
                        data: avgScores.length > 0 ? avgScores : [0],
                        backgroundColor: '#3b82f6',
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, max: 100 }
                }
            }
        });
    }

    // 2. Class grade distribution chart
    const distCanvas = document.getElementById('teacherDistributionChart');
    if (distCanvas) {
        if (teacherDistributionChartInstance) teacherDistributionChartInstance.destroy();

        let countHigh = 0; // >= 70%
        let countMed = 0;  // 50-69%
        let countLow = 0;  // < 50%
        let countUnstarted = 0;

        (window.teacherStudentsData || []).forEach(s => {
            if (s.total_quiz_attempts === 0) {
                countUnstarted++;
            } else {
                const avg = Number(s.avg_score_pct || 0);
                if (avg >= 70) countHigh++;
                else if (avg >= 50) countMed++;
                else countLow++;
            }
        });

        teacherDistributionChartInstance = new Chart(distCanvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Bestått (70-100%)', 'Middels (50-69%)', 'Trenger hjelp (<50%)', 'Ikke startet'],
                datasets: [{
                    data: [countHigh, countMed, countLow, countUnstarted],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#94a3b8'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
}

/**
 * Load simulator status pill
 */
function loadSimulatorSummary() {
    fetch('/api/admin/simulator/summary')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const pill = document.getElementById('simStatusPill');
                if (pill) {
                    pill.innerHTML = `🤖 <strong>${data.summary.testStudents}</strong> testelever (${data.summary.totalQuizSubmissions} svar)`;
                }
            }
        })
        .catch(err => console.error(err));
}

/**
 * Trigger MCP / API Simulation
 */
window.runSimulation = function() {
    const btn = document.getElementById('btnRunSimulation');
    btn.disabled = true;
    btn.innerText = '⏳ Kjører simulering...';

    fetch('/api/admin/simulator/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentCount: 8, responseMode: 'realistic', attemptsPerStudent: 3 })
    })
    .then(res => res.json())
    .then(data => {
        btn.disabled = false;
        btn.innerText = '🎲 Generer 8 testelever & svar';
        if (data.success) {
            alert(data.message || 'Simulering fullført!');
            loadTeacherOverview();
            loadOverviewStats();
        } else {
            alert('Feil under simulering: ' + (data.message || 'Ukjent feil'));
        }
    })
    .catch(err => {
        btn.disabled = false;
        btn.innerText = '🎲 Generer 8 testelever & svar';
        alert('Nettverksfeil: ' + err.message);
    });
};

/**
 * Clear simulated test data
 */
window.clearSimulation = function() {
    if (!confirm('Er du sikker på at du vil slette alle genererte testelever og tilhørende oppgaveresultater?')) return;

    const btn = document.getElementById('btnClearSimulation');
    btn.disabled = true;
    btn.innerText = '⏳ Sletter...';

    fetch('/api/admin/simulator/clear', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
            btn.disabled = false;
            btn.innerText = '🧹 Nullstill testdata';
            if (data.success) {
                alert(data.message);
                loadTeacherOverview();
                loadOverviewStats();
            } else {
                alert('Feil: ' + data.message);
            }
        })
        .catch(err => {
            btn.disabled = false;
            btn.innerText = '🧹 Nullstill testdata';
            alert('Feil: ' + err.message);
        });
};

/**
 * Open Student Detail Modal
 */
window.openStudentModal = function(studentId) {
    const modal = document.getElementById('studentModal');
    modal.style.display = 'flex';
    document.getElementById('modalQuizHistoryBody').innerHTML = '<tr><td colspan="4" style="text-align:center;">Laster besvarelser...</td></tr>';

    fetch(`/api/admin/teacher/student/${studentId}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                document.getElementById('modalStudentName').innerText = data.student.username;
                document.getElementById('modalStudentEmail').innerText = data.student.email;

                const completedCount = data.courses.filter(c => c.is_completed).length;
                document.getElementById('modalStudentCourses').innerText = completedCount;
                document.getElementById('modalStudentAttempts').innerText = data.quizHistory.length;

                const totalPct = data.quizHistory.reduce((acc, q) => acc + (q.score / q.total_questions * 100), 0);
                const avgPct = data.quizHistory.length > 0 ? Math.round(totalPct / data.quizHistory.length) : 0;
                document.getElementById('modalStudentAvg').innerText = avgPct + '%';

                const tbody = document.getElementById('modalQuizHistoryBody');
                if (data.quizHistory.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-gray);">Ingen quizer levert enda.</td></tr>';
                    return;
                }

                tbody.innerHTML = data.quizHistory.map(q => {
                    const pct = Math.round((q.score / q.total_questions) * 100);
                    const color = pct >= 70 ? '#10b981' : (pct >= 50 ? '#f59e0b' : '#ef4444');
                    return `
                        <tr>
                            <td><strong>${q.course_slug}</strong></td>
                            <td>${q.score} / ${q.total_questions}</td>
                            <td><strong style="color: ${color};">${pct}%</strong></td>
                            <td><small>${new Date(q.attempted_at).toLocaleString()}</small></td>
                        </tr>
                    `;
                }).join('');
            }
        })
        .catch(err => console.error(err));
};

window.closeStudentModal = function() {
    document.getElementById('studentModal').style.display = 'none';
};

/**
 * Load and display tickets
 */
window.loadTickets = function() {
    fetch('/api/admin/tickets')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const statusFilter = document.getElementById('ticketStatusFilter').value;
                let tickets = data.tickets;

                if (statusFilter !== 'all') {
                    tickets = tickets.filter(t => t.status === statusFilter);
                }

                const tbody = document.getElementById('tickets-table-body');
                if (tickets.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 2rem; color:var(--text-gray);">Ingen saker matcher valgt filter.</td></tr>';
                    return;
                }

                tbody.innerHTML = tickets.map(t => {
                    const statusClass = t.status === 'resolved' ? 'badge-resolved' : (t.status === 'in_progress' ? 'badge-warning' : 'badge-new');
                    const priorityClass = t.priority === 'critical' ? 'badge-danger' : (t.priority === 'high' ? 'badge-warning' : 'badge-info');

                    return `
                        <tr>
                            <td>#${t.id}</td>
                            <td>
                                <strong>${t.title}</strong>
                                <div style="font-size:0.8rem; color:var(--text-gray); max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                    ${t.description || ''}
                                </div>
                            </td>
                            <td>${t.user_name || t.username || 'Anonym'}<br><small style="color:var(--text-gray);">${t.user_contact || t.email || ''}</small></td>
                            <td><span class="badge badge-info">${t.category}</span></td>
                            <td><span class="badge ${priorityClass}">${t.priority}</span></td>
                            <td><span class="badge ${statusClass}">${t.status}</span></td>
                            <td><small>${new Date(t.created_at).toLocaleDateString()}</small></td>
                            <td>
                                ${t.status !== 'resolved' ? `
                                    <button class="btn btn-outline btn-sm" onclick="markTicketResolved(${t.id})">Løs sak</button>
                                ` : `
                                    <span style="color:#059669; font-weight:600; font-size:0.8rem;">✓ Løst</span>
                                `}
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        })
        .catch(err => console.error('Feil ved henting av tickets:', err));
};

window.markTicketResolved = function(ticketId) {
    fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            loadTickets();
        } else {
            alert('Feil: ' + data.message);
        }
    });
};
