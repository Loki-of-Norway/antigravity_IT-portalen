require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

/**
 * Database connection helper using promises
 */
async function getDbConnection() {
    return await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'IT-portalen',
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
        ssl: (process.env.DB_HOST && process.env.DB_HOST !== 'localhost') ? { rejectUnauthorized: false } : undefined
    });
}

// Sample Norwegian test student profiles
const DEFAULT_STUDENT_PROFILES = [
    { username: 'elev_emilie', name: 'Emilie Hansen', email: 'elev_emilie@skole-test.no', skill: 'high' },
    { username: 'elev_jonas', name: 'Jonas Berg', email: 'elev_jonas@skole-test.no', skill: 'medium' },
    { username: 'elev_nora', name: 'Nora Solberg', email: 'elev_nora@skole-test.no', skill: 'high' },
    { username: 'elev_mathias', name: 'Mathias Lie', email: 'elev_mathias@skole-test.no', skill: 'struggling' },
    { username: 'elev_sofie', name: 'Sofie Hagen', email: 'elev_sofie@skole-test.no', skill: 'medium' },
    { username: 'elev_henrik', name: 'Henrik Moen', email: 'elev_henrik@skole-test.no', skill: 'medium' },
    { username: 'elev_ingrid', name: 'Ingrid Olsen', email: 'elev_ingrid@skole-test.no', skill: 'high' },
    { username: 'elev_lucas', name: 'Lucas Dahl', email: 'elev_lucas@skole-test.no', skill: 'struggling' },
    { username: 'elev_oliver', name: 'Oliver Kristiansen', email: 'elev_oliver@skole-test.no', skill: 'medium' },
    { username: 'elev_thea', name: 'Thea Amundsen', email: 'elev_thea@skole-test.no', skill: 'high' },
    { username: 'elev_sander', name: 'Sander Haugen', email: 'elev_sander@skole-test.no', skill: 'struggling' },
    { username: 'elev_emma', name: 'Emma Halvorsen', email: 'elev_emma@skole-test.no', skill: 'medium' }
];

// Available courses and question counts
const COURSES = [
    { slug: 'intro-coding', title: 'Introduksjon til koding', totalQuestions: 10 },
    { slug: 'pc-basics', title: 'Grunnleggende PC-bruk', totalQuestions: 5 },
    { slug: 'datasikkerhet', title: 'Sikkerhet og personvern', totalQuestions: 6 },
    { slug: 'feilsoking-nettverk', title: 'Feilsøking i nettverk', totalQuestions: 5 },
    { slug: 'brukerstotte-kommunikasjon', title: 'Brukerstøtte og kundeservice', totalQuestions: 5 }
];

/**
 * 1. Create or ensure test students exist
 */
async function createTestStudents(options = {}) {
    const count = Math.min(options.count || 8, DEFAULT_STUDENT_PROFILES.length);
    const prefix = options.prefix || 'elev';
    const rawPassword = options.defaultPassword || 'Passord123!';

    const conn = await getDbConnection();
    try {
        const passwordHash = await bcrypt.hash(rawPassword, 10);
        const createdStudents = [];

        for (let i = 0; i < count; i++) {
            const profile = DEFAULT_STUDENT_PROFILES[i];
            const username = prefix !== 'elev' ? `${prefix}_${profile.username.replace('elev_', '')}` : profile.username;
            const email = `${username}@skole-test.no`;

            // Check if user already exists
            const [existing] = await conn.execute(
                'SELECT id, username, email FROM users WHERE username = ? OR email = ?',
                [username, email]
            );

            let userId;
            if (existing.length > 0) {
                userId = existing[0].id;
                // Ensure role is student and update password
                await conn.execute(
                    'UPDATE users SET password_hash = ?, role = "student" WHERE id = ?',
                    [passwordHash, userId]
                );
            } else {
                const [result] = await conn.execute(
                    'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, "student")',
                    [username, email, passwordHash]
                );
                userId = result.insertId;
            }

            createdStudents.push({
                id: userId,
                username,
                email,
                name: profile.name,
                skill: profile.skill
            });
        }

        return {
            success: true,
            message: `Opprettet/verifiserte ${createdStudents.length} testelever. Standard passord: ${rawPassword}`,
            students: createdStudents
        };
    } finally {
        await conn.end();
    }
}

/**
 * Helper to calculate score based on profile skill and mode
 */
function calculateScore(totalQuestions, skill, mode) {
    if (mode === 'random') {
        return Math.floor(Math.random() * (totalQuestions + 1));
    }
    if (mode === 'high_performing') {
        return Math.min(totalQuestions, Math.max(Math.floor(totalQuestions * 0.8), Math.round(totalQuestions * (0.8 + Math.random() * 0.2))));
    }
    if (mode === 'struggling') {
        return Math.max(1, Math.round(totalQuestions * (0.2 + Math.random() * 0.35)));
    }

    // Default 'realistic' mode based on student's innate skill
    let ratio = 0.6;
    if (skill === 'high') {
        ratio = 0.75 + Math.random() * 0.25; // 75% - 100%
    } else if (skill === 'medium') {
        ratio = 0.50 + Math.random() * 0.35; // 50% - 85%
    } else {
        ratio = 0.20 + Math.random() * 0.40; // 20% - 60%
    }
    return Math.min(totalQuestions, Math.max(0, Math.round(totalQuestions * ratio)));
}

/**
 * Helper to generate a random timestamp within the last N days
 */
function getRandomPastDate(daysAgoMin = 0, daysAgoMax = 14) {
    const now = new Date();
    const daysOffset = Math.random() * (daysAgoMax - daysAgoMin) + daysAgoMin;
    const pastTime = new Date(now.getTime() - daysOffset * 24 * 60 * 60 * 1000);
    return pastTime.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * 2. Simulate task and quiz responses
 */
async function simulateTaskResponses(options = {}) {
    const mode = options.mode || 'realistic'; // 'random' | 'realistic' | 'high_performing' | 'struggling'
    const attemptsPerStudent = options.attemptsPerStudent || 3;
    const selectedCourses = options.courses || COURSES.map(c => c.slug);

    const conn = await getDbConnection();
    try {
        // Fetch all test students
        const [students] = await conn.execute(
            'SELECT id, username, email FROM users WHERE (email LIKE "%@skole-test.no%" OR username LIKE "elev_%") AND role = "student"'
        );

        if (students.length === 0) {
            return {
                success: false,
                message: 'Ingen testelever funnet. Kjør createTestStudents først!'
            };
        }

        let totalSubmissions = 0;
        let totalCoursesCompleted = 0;

        for (const student of students) {
            // Determine skill profile if known
            const profile = DEFAULT_STUDENT_PROFILES.find(p => p.username === student.username) || { skill: 'medium' };

            for (const courseSlug of selectedCourses) {
                const courseMeta = COURSES.find(c => c.slug === courseSlug) || { totalQuestions: 5 };
                let bestScore = 0;

                // Random number of attempts for this student on this course (1 to attemptsPerStudent)
                const numAttempts = Math.max(1, Math.floor(Math.random() * attemptsPerStudent) + 1);

                for (let a = 0; a < numAttempts; a++) {
                    const score = calculateScore(courseMeta.totalQuestions, profile.skill, mode);
                    if (score > bestScore) bestScore = score;

                    // Days ago progression: earlier attempts happened further back in time
                    const daysAgo = (numAttempts - a) * (1 + Math.random() * 2);
                    const attemptedAt = getRandomPastDate(daysAgo, daysAgo + 2);

                    await conn.execute(
                        'INSERT INTO quiz_results (user_id, course_slug, score, total_questions, attempted_at) VALUES (?, ?, ?, ?, ?)',
                        [student.id, courseSlug, score, courseMeta.totalQuestions, attemptedAt]
                    );
                    totalSubmissions++;
                }

                // If best score >= 70%, mark course as completed in course_progress
                const isPassed = (bestScore / courseMeta.totalQuestions) >= 0.7;
                const completedAt = isPassed ? getRandomPastDate(0, 3) : null;

                await conn.execute(
                    `INSERT INTO course_progress (user_id, course_slug, is_completed, completed_at)
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE is_completed = ?, completed_at = ?`,
                    [student.id, courseSlug, isPassed ? 1 : 0, completedAt, isPassed ? 1 : 0, completedAt]
                );

                if (isPassed) totalCoursesCompleted++;
            }
        }

        return {
            success: true,
            message: `Genererte ${totalSubmissions} quiz-besvarelser fordelt over ${students.length} testelever. ${totalCoursesCompleted} kurs fullført/bestått.`,
            stats: {
                studentCount: students.length,
                totalSubmissions,
                totalCoursesCompleted,
                mode
            }
        };
    } finally {
        await conn.end();
    }
}

/**
 * 3. Simulate IT Support Tickets from students
 */
async function simulateTickets(options = {}) {
    const count = options.count || 6;
    const conn = await getDbConnection();

    const sampleTickets = [
        {
            title: 'Får ikke koblet til Skole-WiFi på min bærbare PC',
            category: 'network',
            priority: 'high',
            description: 'Når jeg prøver å koble til elev-nettverket får jeg bare feilmelding "Kan ikke koble til dette nettverket". Har forsøkt å glemme nettverket uten hell.',
            status: 'open'
        },
        {
            title: 'Glemt passord til Feide og IT-portalen',
            category: 'access',
            priority: 'critical',
            description: 'Jeg kommer ikke inn på IT-portalen for å levere kodingsoppgavene mine. Kan noen tilbakestille passordet mitt?',
            status: 'in_progress',
            troubleshooting_log: 'Mottatt henvendelse. Venter på verifisering av elevens ID.',
            solution_type: 'guidance'
        },
        {
            title: 'Trenger installasjon av Python og VS Code utvidelser',
            category: 'software',
            priority: 'medium',
            description: 'Får beskjed om at jeg mangler administratorrettigheter for å installere Live Server og Python linter.',
            status: 'resolved',
            solution_type: 'device_fix',
            solution_description: 'Instalert godkjent programvarepakke via bedriftens/skolens programvaresenter.',
            time_spent: '15 min'
        },
        {
            title: 'Skjermen på skole-PC flimrer grønt',
            category: 'hardware',
            priority: 'medium',
            description: 'Når jeg beveger lokket på laptopen blir bildet grønt eller slår seg av et halvt sekund.',
            status: 'open'
        },
        {
            title: 'Problemer med lyd i Teams under undervisning',
            category: 'email_teams',
            priority: 'low',
            description: 'Headset-mikrofonen blir ikke registrert som standardinngang i Teams etter siste oppdatering.',
            status: 'resolved',
            solution_type: 'guidance',
            solution_description: 'Veiledet eleven til å velge riktig mikrofon i Teams enhetsinnstillinger.',
            time_spent: '10 min'
        },
        {
            title: 'Mistenkelig e-post mottatt med ukjent vedlegg',
            category: 'security',
            priority: 'high',
            description: 'Mottok en e-post som påstår at OneDrive-kontoen min er låst, med en .zip fil vedlagt. Har ikke åpnet den.',
            status: 'resolved',
            solution_type: 'system_fix',
            solution_description: 'E-post analysert og bekreftet phishing. Avsender blokkert i brannmur/e-postfilter.',
            time_spent: '20 min'
        }
    ];

    try {
        const limitNum = Math.max(1, parseInt(count, 10) || 6);
        const [students] = await conn.query(
            `SELECT id, username, email FROM users WHERE (email LIKE "%@skole-test.no%" OR username LIKE "elev_%") LIMIT ${limitNum}`
        );

        let insertedCount = 0;
        for (let i = 0; i < count; i++) {
            const ticketTemplate = sampleTickets[i % sampleTickets.length];
            const student = students.length > 0 ? students[i % students.length] : null;
            const incidentDate = getRandomPastDate(1, 10);

            await conn.execute(
                `INSERT INTO tickets (
                    user_id, user_name, user_contact, user_department, user_location,
                    title, category, priority, impact, description, status,
                    troubleshooting_log, solution_type, solution_description, time_spent, incident_time
                ) VALUES (?, ?, ?, "VG2-IT", "Klasserom B204", ?, ?, ?, "medium", ?, ?, ?, ?, ?, ?, ?)`,
                [
                    student ? student.id : null,
                    student ? student.username : 'Test Elev',
                    student ? student.email : 'elev@skole-test.no',
                    ticketTemplate.title,
                    ticketTemplate.category,
                    ticketTemplate.priority,
                    ticketTemplate.description,
                    ticketTemplate.status,
                    ticketTemplate.troubleshooting_log || null,
                    ticketTemplate.solution_type || null,
                    ticketTemplate.solution_description || null,
                    ticketTemplate.time_spent || null,
                    incidentDate
                ]
            );
            insertedCount++;
        }

        return {
            success: true,
            message: `Opprettet ${insertedCount} test-tickets for brukerstøtte og adminpanel.`
        };
    } finally {
        await conn.end();
    }
}

/**
 * 4. Simulate Website Feedback from students
 */
async function simulateFeedback(options = {}) {
    const count = options.count || 5;
    const conn = await getDbConnection();

    const sampleFeedbacks = [
        { rating: 5, comment: 'Kodelærer Loki forklarte feilen i koden min kjempebra! Fikk til oppgave 8 til slutt.', page: 'koding-ide' },
        { rating: 4, comment: 'Likte guiden om feilsøking i nettverk, men skulle gjerne hatt flere eksempler på ping og traceroute.', page: 'veiledninger' },
        { rating: 5, comment: 'Veldig oversiktlig og kult design! Elsker mørk modus og terminal-følelsen.', page: 'forside' },
        { rating: 3, comment: 'PC-basics quizen var litt enkel, håper på mer avanserte oppgaver for VG2.', page: 'pc-basics' },
        { rating: 5, comment: 'Ticket-skjemaet var lett å fylle ut, og support svarte raskt!', page: 'support' },
        { rating: 4, comment: 'Flott verktøy for å øve før eksamen i IT-fagene.', page: 'min-fremgang' }
    ];

    try {
        const limitNum = Math.max(1, parseInt(count, 10) || 5);
        const [students] = await conn.query(
            `SELECT id FROM users WHERE (email LIKE "%@skole-test.no%" OR username LIKE "elev_%") LIMIT ${limitNum}`
        );

        let inserted = 0;
        for (let i = 0; i < count; i++) {
            const item = sampleFeedbacks[i % sampleFeedbacks.length];
            const student = students.length > 0 ? students[i % students.length] : null;

            await conn.execute(
                'INSERT INTO feedback (user_id, rating, comment, page_context) VALUES (?, ?, ?, ?)',
                [student ? student.id : null, item.rating, item.comment, item.page]
            );
            inserted++;
        }

        return {
            success: true,
            message: `Opprettet ${inserted} tilbakemeldinger/vurderinger.`
        };
    } finally {
        await conn.end();
    }
}

/**
 * 5. Complete simulation runner
 */
async function runFullSimulation(options = {}) {
    const studentCount = options.studentCount || 8;
    const responseMode = options.responseMode || 'realistic';
    const attemptsPerStudent = options.attemptsPerStudent || 3;

    const studentRes = await createTestStudents({ count: studentCount });
    const quizRes = await simulateTaskResponses({ mode: responseMode, attemptsPerStudent });
    const ticketRes = await simulateTickets({ count: options.ticketCount || 6 });
    const feedbackRes = await simulateFeedback({ count: options.feedbackCount || 5 });
    const summary = await getSimulationSummary();

    return {
        success: true,
        message: 'Full simulering fullført med suksess!',
        students: studentRes,
        quizzes: quizRes,
        tickets: ticketRes,
        feedback: feedbackRes,
        summary
    };
}

/**
 * 6. Clear all simulated test data safely
 */
async function clearTestData() {
    const conn = await getDbConnection();
    try {
        // Find test users
        const [testUsers] = await conn.execute(
            'SELECT id FROM users WHERE email LIKE "%@skole-test.no%" OR username LIKE "elev_%"'
        );

        if (testUsers.length === 0) {
            return { success: true, message: 'Ingen testdata å slette.' };
        }

        const userIds = testUsers.map(u => u.id);
        const placeholders = userIds.map(() => '?').join(',');

        // Delete cascade handles quiz_results, course_progress, feedback, tickets if foreign keys configured,
        // but let's explicitly delete to ensure clean database state.
        await conn.execute(`DELETE FROM quiz_results WHERE user_id IN (${placeholders})`, userIds);
        await conn.execute(`DELETE FROM course_progress WHERE user_id IN (${placeholders})`, userIds);
        await conn.execute(`DELETE FROM feedback WHERE user_id IN (${placeholders})`, userIds);
        await conn.execute(`DELETE FROM tickets WHERE user_id IN (${placeholders}) OR user_contact LIKE "%@skole-test.no%"`, userIds);
        await conn.execute(`DELETE FROM users WHERE id IN (${placeholders})`, userIds);

        return {
            success: true,
            message: `Slettet ${testUsers.length} testelever og alle tilhørende besvarelser, quizer, tickets og feedback.`
        };
    } finally {
        await conn.end();
    }
}

/**
 * 7. Get summary of database and simulation state
 */
async function getSimulationSummary() {
    const conn = await getDbConnection();
    try {
        const [testUsers] = await conn.execute(
            'SELECT COUNT(*) as count FROM users WHERE email LIKE "%@skole-test.no%" OR username LIKE "elev_%"'
        );
        const [totalUsers] = await conn.execute('SELECT COUNT(*) as count FROM users');
        const [totalQuizzes] = await conn.execute('SELECT COUNT(*) as count, AVG(score/total_questions)*100 as avg_pct FROM quiz_results');
        const [totalCompleted] = await conn.execute('SELECT COUNT(*) as count FROM course_progress WHERE is_completed = 1');
        const [totalTickets] = await conn.execute('SELECT COUNT(*) as count FROM tickets');
        const [totalFeedback] = await conn.execute('SELECT COUNT(*) as count, AVG(rating) as avg_rating FROM feedback');

        return {
            testStudents: testUsers[0].count,
            totalUsers: totalUsers[0].count,
            totalQuizSubmissions: totalQuizzes[0].count,
            averageScorePct: totalQuizzes[0].avg_pct ? Math.round(totalQuizzes[0].avg_pct) : 0,
            completedCourses: totalCompleted[0].count,
            totalTickets: totalTickets[0].count,
            totalFeedback: totalFeedback[0].count,
            averageFeedbackRating: totalFeedback[0].avg_rating ? Number(totalFeedback[0].avg_rating).toFixed(1) : 0
        };
    } finally {
        await conn.end();
    }
}

module.exports = {
    createTestStudents,
    simulateTaskResponses,
    simulateTickets,
    simulateFeedback,
    runFullSimulation,
    clearTestData,
    getSimulationSummary,
    COURSES
};
