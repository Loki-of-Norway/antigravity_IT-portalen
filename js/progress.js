/* Progress Page Logic */

document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/progress')
        .then(res => res.json())
        .then(data => {
            if (!data.success) { // Likely not logged in
                document.getElementById('dashboardContent').classList.add('hidden');
                document.getElementById('loginWarning').classList.remove('hidden');
                return;
            }
            
            renderDashboard(data.data);
        })
        .catch(err => console.error(err));
});

function renderDashboard(data) {
    // Calculate Stats
    const completedCourses = data.filter(d => d.is_completed).length; 
    const quizzes = data.filter(d => d.score !== null);
    const uniqueCoursesCompleted = new Set(data.filter(d => d.is_completed).map(d => d.course_slug)).size;
    
    const totalScore = quizzes.reduce((acc, curr) => acc + (curr.score / curr.total_questions), 0);
    const avgScore = quizzes.length > 0 ? Math.round((totalScore / quizzes.length) * 100) : 0;

    document.getElementById('statsCompleted').textContent = uniqueCoursesCompleted;
    document.getElementById('statsQuizzes').textContent = quizzes.length;
    document.getElementById('statsAvgScore').textContent = avgScore + '%';

    // Render Table
    const tbody = document.getElementById('progressTableBody');
    tbody.innerHTML = '';
    quizzes.forEach(q => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #eee';
        const date = new Date(q.attempted_at).toLocaleDateString();
        const percent = Math.round((q.score / q.total_questions) * 100);
        const color = percent >= 80 ? 'green' : (percent >= 50 ? 'orange' : 'red');
        
        tr.innerHTML = `
            <td style="padding:10px;">${q.course_slug}</td>
            <td style="padding:10px;">${date}</td>
            <td style="padding:10px;">${q.score}/${q.total_questions}</td>
            <td style="padding:10px; color:${color}; font-weight:bold;">${percent}%</td>
        `;
        tbody.appendChild(tr);
    });

    // Render Chart
    renderChart(quizzes);
}

function renderChart(quizzes) {
    const ctx = document.getElementById('progressChart').getContext('2d');
    
    // Prepare data
    const labels = quizzes.map(q => new Date(q.attempted_at).toLocaleDateString());
    const scores = quizzes.map(q => Math.round((q.score / q.total_questions) * 100));

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Quiz Score (%)',
                data: scores,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#2563eb',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',     // This enables the "crosshair" like behavior (all points at index)
                intersect: false,
            },
            plugins: {
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#1f2937',
                    bodyColor: '#1f2937',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                },
                legend: {
                    display: false
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: '#f3f4f6'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}
