document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const modal = document.getElementById('ticket-modal');
    const workModal = document.getElementById('work-modal');
    const newTicketBtn = document.getElementById('new-ticket-btn');
    const closeModalBtn = document.querySelector('.close-modal');
    const closeWorkModalBtn = document.querySelector('.close-work-modal');
    const form = document.getElementById('ticket-form');
    
    // Wizard Elements
    const steps = document.querySelectorAll('.wizard-step');
    const progressSteps = document.querySelectorAll('.progress-bar .step');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    
    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    let currentStep = 1;
    const totalSteps = 6;
    let isLoggedIn = false;

    // --- Creation Wizard Logic ---
    newTicketBtn.addEventListener('click', () => {
        if (!isLoggedIn) {
            if (confirm('Du må være logget inn for å opprette en sak. Vil du logge inn nå?')) {
                window.location.href = '/pages/konvertering/login.html';
            }
            return;
        }
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('active'), 10);
    });

    const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.classList.add('hidden');
            resetWizard();
        }, 300);
    };

    closeModalBtn.addEventListener('click', closeModal);

    const updateWizard = () => {
        // Steps Visibility
        steps.forEach(step => {
            step.classList.toggle('active', parseInt(step.dataset.step) === currentStep);
        });

        // Progress Bar
        progressSteps.forEach((step, index) => {
            step.classList.toggle('active', index + 1 <= currentStep);
        });

        // Buttons
        prevBtn.classList.toggle('hidden', currentStep === 1);
        
        if (currentStep === totalSteps) {
            nextBtn.classList.add('hidden');
            submitBtn.classList.remove('hidden');
            updateSummary();
        } else {
            nextBtn.classList.remove('hidden');
            submitBtn.classList.add('hidden');
        }
    };

    const validateStep = () => {
        const currentStepEl = document.querySelector(`.wizard-step[data-step="${currentStep}"]`);
        const inputs = currentStepEl.querySelectorAll('input[required], select[required], textarea[required]');
        let valid = true;

        inputs.forEach(input => {
            if (!input.value) {
                valid = false;
                input.style.borderColor = 'red';
                input.addEventListener('input', () => input.style.borderColor = '');
            }
            if (input.type === 'radio') {
                const name = input.name;
                const checked = currentStepEl.querySelector(`input[name="${name}"]:checked`);
                if (!checked) valid = false;
            }
        });

        if (!valid) alert('Vennligst fyll ut obligatoriske felt.');
        return valid;
    };

    nextBtn.addEventListener('click', () => {
        if (validateStep()) {
            currentStep++;
            updateWizard();
        }
    });

    prevBtn.addEventListener('click', () => {
        currentStep--;
        updateWizard();
    });

    // --- Form Submission (Create) ---
    const updateSummary = () => {
        const formData = new FormData(form);
        document.getElementById('summary-source').textContent = formData.get('source_system');
        document.getElementById('summary-user').textContent = formData.get('user_name') || 'Ukjent';
        document.getElementById('summary-category').textContent = formData.get('category');
        document.getElementById('summary-title').textContent = formData.get('title');
        document.getElementById('summary-prioritet').textContent = formData.get('priority');
        document.getElementById('summary-desc').textContent = formData.get('description');
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());

        try {
            const response = await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (result.success) {
                alert('Sak registrert!');
                closeModal();
                loadTickets();
            } else {
                alert('Feil: ' + result.message);
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('Feil ved innsending.');
        }
    });

    const resetWizard = () => {
        currentStep = 1;
        form.reset();
        updateWizard();
    };

    // --- Ticket List Logic ---
    const loadTickets = async () => {
        const container = document.getElementById('tickets-container');
        try {
            const response = await fetch('/api/tickets');
            const result = await response.json();

            if (result.success) {
                isLoggedIn = true;
                if (result.tickets.length === 0) {
                    container.innerHTML = '<p style="text-align:center; padding:2rem;">Ingen saker funnet.</p>';
                    return;
                }
                container.innerHTML = result.tickets.map(t => `
                    <div class="ticket-list-item" onclick="openTicketDetails(${t.id})" style="cursor:pointer;">
                        <div>
                            <div style="font-weight:bold;">${t.title} <span style="font-weight:normal; color:#888;">(#${t.id})</span></div>
                            <div style="font-size:0.85rem; color:#aaa;">
                                ${new Date(t.created_at).toLocaleDateString()} • ${t.user_name || 'Ukjent'} • ${t.category}
                            </div>
                        </div>
                        <span class="ticket-status status-${t.status}">${t.status}</span>
                    </div>
                `).join('');
            } else {
                isLoggedIn = false;
                container.innerHTML = `<div style="text-align:center; padding:1rem; color: #ff6b6b;">
                    <p>${result.message}</p>
                    ${result.message.includes('Logg inn') ? '<a href="/pages/konvertering/login.html" class="btn btn-primary" style="margin-top:10px; display:inline-block;">Gå til innlogging</a>' : ''}
                </div>`;
            }
        } catch (e) {
            console.error(e);
            container.innerHTML = '<p style="color:red; text-align:center;">Feil ved kontakt med server.</p>';
        }
    };

    // --- Work Modal Logic (View/Edit) ---
    window.openTicketDetails = async (id) => {
        currentTicketId = id;
        workModal.classList.remove('hidden');
        setTimeout(() => workModal.classList.add('active'), 10);
        
        // Load ticket data
        try {
            const res = await fetch(`/api/tickets/${id}`);
            const data = await res.json();
            if (data.success) {
                populateWorkModal(data.ticket);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const populateWorkModal = (t) => {
        document.getElementById('work-title').textContent = `Sak #${t.id} - ${t.title}`;
        
        // Info Tab
        document.getElementById('work-info-content').innerHTML = `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                <div>
                    <h4 style="color:var(--primary-color);">Bruker</h4>
                    <p><strong>Navn:</strong> ${t.user_name || '-'}</p>
                    <p><strong>Kontakt:</strong> ${t.user_contact || '-'}</p>
                    <p><strong>Avdeling:</strong> ${t.user_department || '-'}</p>
                </div>
                <div>
                    <h4 style="color:var(--primary-color);">Problem</h4>
                    <p><strong>Kategori:</strong> ${t.category}</p>
                    <p><strong>Prioritet:</strong> ${t.priority}</p>
                    <p><strong>Impact:</strong> ${t.impact || '-'}</p>
                </div>
            </div>
            <div style="margin-top:1rem;">
                <h4 style="color:var(--primary-color);">Beskrivelse</h4>
                <p style="background:rgba(255,255,255,0.05); padding:10px; border-radius:4px;">${t.description}</p>
            </div>
        `;

        // Pre-fill inputs
        document.getElementById('work-log').value = t.troubleshooting_log || '';
        document.getElementById('work-solution-type').value = t.solution_type || '';
        document.getElementById('work-solution-desc').value = t.solution_description || '';
        document.getElementById('work-root-cause').value = t.root_cause || '';
        document.getElementById('work-time-spent').value = t.time_spent || '';
        document.getElementById('work-learning').value = t.learning_points || '';
        document.getElementById('work-status').value = t.status || 'open';
    };

    const closeWorkModal = () => {
        workModal.classList.remove('active');
        setTimeout(() => workModal.classList.add('hidden'), 300);
    };

    closeWorkModalBtn.addEventListener('click', closeWorkModal);

    // Save/Update Ticket
    document.getElementById('close-ticket-btn').addEventListener('click', async () => {
        const payload = {
            troubleshooting_log: document.getElementById('work-log').value,
            solution_type: document.getElementById('work-solution-type').value,
            solution_description: document.getElementById('work-solution-desc').value,
            root_cause: document.getElementById('work-root-cause').value,
            time_spent: document.getElementById('work-time-spent').value,
            learning_points: document.getElementById('work-learning').value,
            status: document.getElementById('work-status').value
        };

        try {
            const res = await fetch(`/api/tickets/${currentTicketId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (result.success) {
                alert('Sak oppdatert!');
                closeWorkModal();
                loadTickets();
            }
        } catch (e) {
            alert('Kunne ikke lagre.');
        }
    });

    // Tabs Logic
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.style.display = 'none');
            
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).style.display = 'block';
        });
    });

    // init
    loadTickets();
});
