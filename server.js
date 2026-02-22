require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MISSING_KEY');
// Using Gemini 2.5 as confirmed by available models
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });


const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'loki-brukerstotte-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Sett til true hvis du bruker HTTPS
}));

// Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'IT-portalen'
});

console.log('Kobler til database med host:', process.env.DB_HOST);

db.connect((err) => {
    if (err) {
        console.error('Databasefeil under oppkobling:', err);
        process.exit(1); // Avslutt hvis vi ikke får kontakt med db
    }
    console.log('Koblet til MySQL-databasen.');
});

// Middleware for Admin protection
const isAdmin = (req, res, next) => {
    if (req.session.userId) {
        db.query('SELECT role FROM users WHERE id = ?', [req.session.userId], (err, results) => {
            if (err) return res.status(500).json({ success: false, message: 'Serverfeil' });
            if (results.length > 0 && results[0].role === 'admin') {
                return next();
            }
            res.status(403).json({ success: false, message: 'Tilgang nektet. Kun admin.' });
        });
    } else {
        res.status(401).json({ success: false, message: 'Vennligst logg inn.' });
    }
};

// --- API Routes ---

// 1. Registrering
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'Alle felt må fylles ut.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)';
        
        db.query(query, [username, email, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ success: false, message: 'Brukernavn eller e-post eksisterer allerede.' });
                }
                return res.status(500).json({ success: false, message: 'Databasefeil: ' + err.message });
            }
            res.json({ success: true, message: 'Bruker registrert!' });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Serverfeil.' });
    }
});

// 2. Innlogging
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'E-post og passord må fylles ut.' });
    }

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        if (results.length > 0) {
            const user = results[0];
            const match = await bcrypt.compare(password, user.password_hash);
            
            if (match) {
                req.session.userId = user.id;
                req.session.username = user.username;
                req.session.role = user.role;
                console.log('Login attempt. User found:', JSON.stringify(user));
                console.log('Role value:', user.role);
                return res.json({ 
                    success: true, 
                    message: 'Innlogging vellykket!',
                    user: {
                        id: user.id,
                        username: user.username,
                        role: user.role
                    }
                });
            }
        }
        res.status(401).json({ success: false, message: 'Feil e-post eller passord.' });
    });
});

// 3. Kontakt
app.post('/api/contact', (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ success: false, message: 'Navn, e-post og melding må fylles ut.' });
    }

    const query = 'INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)';
    db.query(query, [name, email, subject, message], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Meldingen din er sendt!' });
    });
});

// 4. Tilbakemelding
app.post('/api/feedback', (req, res) => {
    const { rating, category, comment } = req.body;
    const userId = req.session.userId || null;

    if (!rating) return res.status(400).json({ success: false, message: 'Vurdering mangler.' });

    const query = 'INSERT INTO feedback (user_id, rating, comment, page_context) VALUES (?, ?, ?, ?)';
    db.query(query, [userId, rating, comment, category], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Takk for tilbakemeldingen!' });
    });
});

// Check Login Status
app.get('/api/user-status', (req, res) => {
    if (req.session.userId) {
        // Fetch minimal user info if needed, or just return status
        // For menu display, role might be useful
        const query = 'SELECT username, role FROM users WHERE id = ?';
        db.query(query, [req.session.userId], (err, results) => {
            if (err || results.length === 0) {
                return res.json({ loggedIn: false });
            }
            res.json({ loggedIn: true, user: results[0] });
        });
    } else {
        res.json({ loggedIn: false });
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ success: false, message: 'Kunne ikke logge ut.' });
        res.json({ success: true, message: 'Logget ut.' });
    });
});

// 5. Chatbot
// 5. Chatbot (Upgraded with Gemini & Intent Classification)
app.post('/api/chat', async (req, res) => {
    const { message, mode } = req.body; // mode: 'decision_tree' (AI classifier) or 'regular' (classic)
    const userId = req.session.userId || null;
    
    // Debug API Key status (Do not log the actual key)
    console.log(`[Chat Msg] Mode: ${mode}, Has Key: ${!!process.env.GEMINI_API_KEY}`);


    if (!message) return res.status(400).json({ success: false, message: 'Melding mangler.' });

    // Default response stuff
    let botResponse = '';
    let intent = 'UNKNOWN';

    // Check if we use AI (Gemini) for classification
    // Only use if mode is 'decision_tree' AND we have a key (or if user wants AI to always run)
    // User requested: "Add Gemini 2.5... make it work together with decision tree"
    
    if (mode === 'guided' && process.env.GEMINI_API_KEY) {
        try {
const systemPrompt = `
Du er en klassifiserer for IT-portalen sin support-chatbot.
Din oppgave er å kategorisere brukerens input til ETT av følgende intents for et beslutningstre.
Du skal også korrigere skrivefeil implisitt.

Gyldige Intents:
- LEARNING_GRUNNLEGGENDE (PC-start, mus, tastatur)
- LEARNING_OFFICE (Word, Excel, PowerPoint, Teams)
- SUPPORT_WIFI (Nettverk, internett, dekning)
- SUPPORT_PRINTER (Utskrift, papirkrøll, toner)
- SUPPORT_HARDWARE (Maskinvare, skjerm, lyd)
- SUPPORT_PASSWORD (Glemt passord, feide, opplåsing)
- CONTACT_INFO (Åpningstider, telefon, hvor er dere)
- UNKNOWN

Svar KUN med intent-koden.
`;
            
            const result = await geminiModel.generateContent([
                systemPrompt,
                `User: ${message}`
            ]);
            
            const response = await result.response;
            const text = response.text().trim();
            
            if (text.includes('_')) {
                intent = text;
                botResponse = `[INTENT_DETECTED]: ${intent}`; 
            } else {
                intent = 'UNKNOWN';
                botResponse = 'Fant ingen match i menyen.';
            }

        } catch (error) {
            console.error("Gemini Error:", error);
            intent = 'ERROR';
            botResponse = 'Beklager, feil med AI-tjenesten.';
        }
    } else if (mode === 'free_chat' && process.env.GEMINI_API_KEY) {
        try {
             const systemPrompt = `
Du er "Loki", en hjelpsom IT-support assistent for IT-portalen.
Du svarer på norsk, kort og presist.
Du hjelper elever og ansatte med IT-spørsmål.
Du kan referere til portalens sider hvis det passer (f.eks. FAQ, Kurs osv...).
Hold tonen profesjonell men vennlig.
`;
            const result = await geminiModel.generateContent([
                systemPrompt,
                `User: ${message}`
            ]);
            const response = await result.response;
            botResponse = response.text().trim();
            intent = 'FREE_CHAT';

        } catch (error) {
             console.error("Gemini Free Chat Error:", error);
             botResponse = "Beklager, jeg fikk problemer med å tenke akkurat nå.";
        }


    } else {
        // Fallback to simple keyword matching (Old Logic) or if API key missing
        const responses = {
            'hei': 'Hei! Hvordan kan jeg hjelpe deg?',
            'hjelp': 'Jeg kan hjelpe med kurs, feilsøking og kontakt.',
            'passord': 'Glemt passord? Gå til FAQ.',
            'kontakt': 'Kontakt oss på support@it-portalen.no',
            'skrivefeil': 'Jeg retter gjerne skrivefeil for deg.'
        };
        
        botResponse = 'Beklager, jeg forstår ikke helt. Prøv "hjelp".';
        const lowerInput = message.toLowerCase();
        
        for (const [key, value] of Object.entries(responses)) {
            if (lowerInput.includes(key)) {
                botResponse = value;
                intent = 'KEYWORD_MATCH';
                break;
            }
        }
    }

    // Save to DB with Intent
    const saveChat = () => {
        // Updated query to include intent
        const query = 'INSERT INTO chat_messages (session_id, sender, message_text, intent) VALUES (?, ?, ?, ?)';
        
        // Dummy session ID 1 for now if not normalized
        db.query('INSERT IGNORE INTO chat_sessions (id, user_id) VALUES (?, ?)', [1, userId], () => {
            // Log User Message
            db.query(query, [1, 'user', message, intent], (err) => {
                if (err) console.error("Error logging user msg:", err);
                
                // Log Bot Response
                db.query(query, [1, 'bot', botResponse, 'RESPONSE'], (err) => {
                    if (err) console.error("Error logging bot msg:", err);
                    
                    res.json({ 
                        success: true, 
                        response: botResponse, 
                        intent: intent 
                    });
                });
            });
        });
    };
    
    saveChat();
});

// --- Admin API Routes ---

// Get Dashboard Stats
app.get('/api/admin/stats', isAdmin, (req, res) => {
    const queries = {
        users: 'SELECT COUNT(*) as count FROM users',
        feedback: 'SELECT COUNT(*) as count FROM feedback',
        contacts: 'SELECT COUNT(*) as count FROM contacts WHERE status = "new"',
        guides: 'SELECT COUNT(*) as count FROM guides'
    };

    const stats = {};
    let pending = Object.keys(queries).length;

    for (const [key, query] of Object.entries(queries)) {
        db.query(query, (err, results) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            stats[key] = results[0].count;
            pending--;
            if (pending === 0) {
                res.json({ success: true, stats });
            }
        });
    }
});

// Get all users
app.get('/api/admin/users', isAdmin, (req, res) => {
    db.query('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, users: results });
    });
});

// Get all feedback
app.get('/api/admin/feedback', isAdmin, (req, res) => {
    db.query('SELECT f.*, u.username FROM feedback f LEFT JOIN users u ON f.user_id = u.id ORDER BY f.created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, feedback: results });
    });
});

// Get all contacts
app.get('/api/admin/contacts', isAdmin, (req, res) => {
    db.query('SELECT * FROM contacts ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, contacts: results });
    });
});

// Resolve a contact message
app.post('/api/admin/contacts/resolve', isAdmin, (req, res) => {
    const { id, response } = req.body;
    if (!id || !response) return res.status(400).json({ success: false, message: 'ID og svar mangler.' });

    db.query('UPDATE contacts SET admin_response = ?, status = "resolved" WHERE id = ?', [response, id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Melding markert som løst!' });
    });
});

// Analytics: Users over time
app.get('/api/admin/analytics/users', isAdmin, (req, res) => {
    const query = `
        SELECT DATE(created_at) as date, COUNT(*) as count 
        FROM users 
        GROUP BY DATE(created_at) 
        ORDER BY date ASC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: results });
    });
});

// Analytics: Chatbot queries
app.get('/api/admin/analytics/chatbot', isAdmin, (req, res) => {
    const query = `
        SELECT message_text as keyword, COUNT(*) as count 
        FROM chat_messages 
        WHERE sender = 'user'
        GROUP BY message_text 
        ORDER BY count DESC 
        LIMIT 5
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: results });
    });
});

// Content: Get all guides
app.get('/api/admin/guides', isAdmin, (req, res) => {
    db.query('SELECT id, title, category, created_at FROM guides ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, guides: results });
    });
});

// Content: Get all FAQs
app.get('/api/admin/faqs', isAdmin, (req, res) => {
    db.query('SELECT id, question, category FROM faqs ORDER BY display_order ASC', (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, faqs: results });
    });
});

// Create Guide
app.post('/api/admin/guides', isAdmin, (req, res) => {
    const { title, category, content, slug } = req.body;
    const query = 'INSERT INTO guides (title, category, content, slug) VALUES (?, ?, ?, ?)';
    db.query(query, [title, category, content, slug], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, id: result.insertId });
    });
});

// Delete Guide
app.delete('/api/admin/guides/:id', isAdmin, (req, res) => {
    db.query('DELETE FROM guides WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true });
    });
});

// Create FAQ
app.post('/api/admin/faqs', isAdmin, (req, res) => {
    const { question, answer, category } = req.body;
    const query = 'INSERT INTO faqs (question, answer, category) VALUES (?, ?, ?)';
    db.query(query, [question, answer, category], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, id: result.insertId });
    });
});

// Delete FAQ
app.delete('/api/admin/faqs/:id', isAdmin, (req, res) => {
    db.query('DELETE FROM faqs WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true });
    });
});

// --- Ticket System API Routes ---

// --- Ticket System API Routes ---

// Create Ticket (Expanded)
app.post('/api/tickets', (req, res) => {
    const { 
        title, category, priority, description,
        user_name, user_contact, user_department, user_location,
        pc_name, ip_address, source_system, received_via, impact,
        error_message, expected_behavior, reproduction_steps, incident_time
    } = req.body;
    
    const userId = req.session.userId || null; 

    // Basic Validation
    if (!title || !category || !description) {
        return res.status(400).json({ success: false, message: 'Tittel, kategori og beskrivelse må fylles ut.' });
    }

    const query = `
        INSERT INTO tickets (
            user_id, title, category, priority, description,
            user_name, user_contact, user_department, user_location,
            pc_name, ip_address, source_system, received_via, impact,
            error_message, expected_behavior, reproduction_steps, incident_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
        userId, title, category, priority, description,
        user_name || null, user_contact || null, user_department || null, user_location || null,
        pc_name || null, ip_address || null, source_system || 'IT-portalen', received_via || 'form', impact || 'medium',
        error_message || null, expected_behavior || null, reproduction_steps || null, incident_time || new Date()
    ];

    db.query(query, values, (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Sak opprettet!', id: result.insertId });
    });
});

// Update Ticket (For full logging/solution)
app.put('/api/tickets/:id', (req, res) => {
    const ticketId = req.params.id;
    // Note: In a real app, check if user is admin/owner
    
    const {
        status, troubleshooting_log, solution_type, solution_description,
        root_cause, time_spent, learning_points, sla_deadline
    } = req.body;

    const query = `
        UPDATE tickets SET 
            status = COALESCE(?, status),
            troubleshooting_log = ?,
            solution_type = ?,
            solution_description = ?,
            root_cause = ?,
            time_spent = ?,
            learning_points = ?,
            sla_deadline = ?
        WHERE id = ?
    `;

    const values = [
        status, troubleshooting_log, solution_type, solution_description,
        root_cause, time_spent, learning_points, sla_deadline, ticketId
    ];

    db.query(query, values, (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Sak oppdatert!' });
    });
});

// Get My Tickets
app.get('/api/tickets', (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Logg inn for å se dine saker.' });

    // For IT-portal purposes, we want to see ALL tickets (support view)
    // In a real app, we would check if (req.session.role === 'admin')
    const query = 'SELECT * FROM tickets ORDER BY created_at DESC';
    db.query(query, [], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, tickets: results });
    });
});

// Get Single Ticket Details
app.get('/api/tickets/:id', (req, res) => {
    const ticketId = req.params.id;
    // Check access (owner or admin) - skipping for simplified MVP
    db.query('SELECT * FROM tickets WHERE id = ?', [ticketId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (results.length === 0) return res.status(404).json({ success: false, message: 'Sak ikke funnet' });
        res.json({ success: true, ticket: results[0] });
    });
});

// Get All Tickets (Admin)
app.get('/api/admin/tickets', isAdmin, (req, res) => {
    const query = `
        SELECT t.*, u.username, u.email 
        FROM tickets t 
        LEFT JOIN users u ON t.user_id = u.id 
        ORDER BY field(t.status, 'open', 'in_progress', 'resolved', 'closed'), t.created_at DESC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, tickets: results });
    });
});

// Update Ticket Status (Admin/Simple)
app.put('/api/admin/tickets/:id', isAdmin, (req, res) => {
    const { status } = req.body;
    db.query('UPDATE tickets SET status = ? WHERE id = ?', [status, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Status oppdatert.' });
    });
});
// --- Course & Quiz Progress API Routes ---

// Save Course Progress
app.post('/api/progress/course', (req, res) => {
    const { courseSlug, isCompleted } = req.body;
    const userId = req.session.userId;

    if (!userId) return res.status(401).json({ success: false, message: 'Logg inn for å lagre fremgang.' });
    if (!courseSlug) return res.status(400).json({ success: false, message: 'Kurs-ID mangler.' });

    const query = `
        INSERT INTO course_progress (user_id, course_slug, is_completed, completed_at)
        VALUES (?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE is_completed = ?, completed_at = NOW()
    `;

    db.query(query, [userId, courseSlug, isCompleted, isCompleted], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Fremgang lagret!' });
    });
});

// Save Quiz Result
app.post('/api/progress/quiz', (req, res) => {
    const { courseSlug, score, totalQuestions } = req.body;
    const userId = req.session.userId;

    if (!userId) return res.status(401).json({ success: false, message: 'Logg inn for å lagre quiz-resultat.' });
    if (!courseSlug || score === undefined || !totalQuestions) {
        return res.status(400).json({ success: false, message: 'Ugyldige data.' });
    }

    const query = 'INSERT INTO quiz_results (user_id, course_slug, score, total_questions) VALUES (?, ?, ?, ?)';
    db.query(query, [userId, courseSlug, score, totalQuestions], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Quiz-resultat lagret!' });
    });
});

// Get User Progress for a specific course
app.get('/api/progress/:courseSlug', (req, res) => {
    const userId = req.session.userId;
    const courseSlug = req.params.courseSlug;

    if (!userId) return res.status(401).json({ success: false, message: 'Logg inn for å se fremgang.' });

    const progressQuery = 'SELECT is_completed FROM course_progress WHERE user_id = ? AND course_slug = ?';
    const quizQuery = 'SELECT score, total_questions, attempted_at FROM quiz_results WHERE user_id = ? AND course_slug = ? ORDER BY attempted_at DESC LIMIT 5';

    db.query(progressQuery, [userId, courseSlug], (err, progressResults) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        db.query(quizQuery, [userId, courseSlug], (err, quizResults) => {
            if (err) return res.status(500).json({ success: false, message: err.message });

            const isCompleted = progressResults.length > 0 ? progressResults[0].is_completed : false;
            res.json({ success: true, isCompleted, quizHistory: quizResults });
        });
    });
});

// Get Overall Progress (for dashboard)
app.get('/api/progress', (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Logg inn for å se fremgang.' });

    const query = `
        SELECT qr.course_slug, qr.score, qr.total_questions, qr.attempted_at, cp.is_completed
        FROM quiz_results qr
        LEFT JOIN course_progress cp ON qr.user_id = cp.user_id AND qr.course_slug = cp.course_slug
        WHERE qr.user_id = ?
        ORDER BY qr.attempted_at ASC
    `;

    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: results });
    });
});

app.use(express.static(__dirname));
app.use('/pages', express.static(__dirname + '/pages'));
app.use('/css', express.static(__dirname + '/css'));
app.use('/js', express.static(__dirname + '/js'));
app.use('/Images', express.static(__dirname + '/Images'));

app.listen(port, () => {
    console.log(`Server v2 starter på http://localhost:${port}`);
});
