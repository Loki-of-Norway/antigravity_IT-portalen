require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');
const { GoogleGenAI } = require('@google/genai');

// 1. Initialiser Google AI med din hemmelige API-nøkkel fra .env (GEMINI_API_KEY)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'MISSING_KEY' });

// 2. Kodelærer med Gemini 3.6 Flash
async function chatMedKodelærer(brukerMelding, chatHistorikk = [], ekstraKontekst = {}) {
  try {
    // 2. Start en chat-sesjon med Gemini 3.6 Flash
    const chat = ai.chats.create({
      model: 'gemini-3.6-flash',
      
      // 3. DETTE ER MAGIEN: Her definerer du rollen som kodelærer
      config: {
        systemInstruction: `
          Du er en tålmodig og pedagogisk kodelærer for nybegynnere. 
          Ditt mål er ikke å bare gi brukeren det ferdige svaret (kopier/lim inn-kode), 
          men heller lede dem på rett vei ved å forklare konseptene.
          - Svar alltid på norsk.
          - Bruk en oppmuntrende og vennlig tone.
          - Hvis brukeren har en feil i koden sin, forklar *hvorfor* feilen oppstår, og gi små hint fremfor å skrive om hele koden for dem.
          - Bruk formatering med kodeblokker (\`\`\`) for å gjøre eksempler enkle å lese.
          ${ekstraKontekst.taskTitle ? `\nOppgave: ${ekstraKontekst.taskTitle}` : ''}
          ${ekstraKontekst.taskInstructions ? `\nMål/instruks: ${ekstraKontekst.taskInstructions}` : ''}
          ${ekstraKontekst.code ? `\nElevens kode nå:\n${ekstraKontekst.code}` : ''}
          ${ekstraKontekst.errors ? `\nTerminal/konsoll feil:\n${ekstraKontekst.errors}` : ''}
        `
      },
      // Send med tidligere meldinger hvis du vil at den skal huske samtalen
      history: chatHistorikk 
    });

    // 4. Send den nye meldingen fra brukeren til boten
    const result = await chat.sendMessage({ message: brukerMelding });
    
    // 5. Returner svaret fra kodelæreren
    return result.text;

  } catch (error) {
    console.error("Feil under API-kall (gemini-3.6-flash):", error.message);
    // Fallback til 2.5-flash dersom 3.6-flash ikke er aktivert på nøkkelen
    try {
      const fallbackChat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: 'Du er en tålmodig og pedagogisk kodelærer for nybegynnere. Hjelp eleven med hint og forklaringer uten å gi hele fasitsvaret direkte. Svar på norsk.'
        },
        history: chatHistorikk
      });
      const fallbackResult = await fallbackChat.sendMessage({ message: brukerMelding });
      return fallbackResult.text;
    } catch (err2) {
      console.error("Fallback også feilet:", err2.message);
      return null;
    }
  }
}


const app = express();
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// I produksjon skal sesjonsnøkkelen alltid komme fra miljøvariabler
if (isProduction && !process.env.SESSION_SECRET) {
    console.error('SESSION_SECRET mangler. Sett den i miljøvariablene før oppstart.');
    process.exit(1);
}

// Render (og de fleste hostere) ligger bak en proxy som håndterer HTTPS
if (isProduction) {
    app.set('trust proxy', 1);
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'kun-for-lokal-utvikling',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: isProduction } // Sikre cookies over HTTPS i produksjon
}));

// Database Connection
const dbConnectionOptions = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'IT-portalen'
};

// If we are given a custom port (like Aiven's 24540), append it
if (process.env.DB_PORT) {
    dbConnectionOptions.port = process.env.DB_PORT;
}

// If we are connecting to a remote database (like Aiven), we generally need SSL
if (process.env.DB_HOST && process.env.DB_HOST !== 'localhost') {
    dbConnectionOptions.ssl = { rejectUnauthorized: false };
}

const db = mysql.createConnection(dbConnectionOptions);

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

// 5. Chatbot (Upgraded with Gemini 3.6 Flash & Decision Tree)

// AI-Klassifiserer for beslutningstreet via Gemini 3.6 Flash (@google/genai)
async function classifyDecisionTreeIntent(message) {
    if (!process.env.GEMINI_API_KEY) return null;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: message,
            config: {
                systemInstruction: `
Du er en intelligent klassifiserer for IT-portalen sin support-chatbot.
Brukeren oppgir et spørsmål, et ønske eller et IT-problem.
Din oppgave er å kategorisere brukerens henvendelse til ETT av følgende gyldige steg (intents) i vårt beslutningstre:

Gyldige Intents:
- LEARNING_GRUNNLEGGENDE (PC-oppstart, mus, tastatur, filer, mapper, grunnleggende data, startkurs)
- LEARNING_OFFICE (Word, Excel, PowerPoint, Teams, Office 365, OneNote)
- SUPPORT_WIFI (Trådløst nett, Wi-Fi, internett, nettverk, Skole-Guest, Skole-Ansatt)
- SUPPORT_PRINTER (Printer, utskrift, papirkrøll, toner, installere printer)
- SUPPORT_HARDWARE (Maskinvare, PC, skjerm, lyd, lader, fysisk skade på utstyr)
- SUPPORT_PASSWORD (Glemt passord, Feide, nullstille passord, låst konto)
- TOOLS_REPORT (Melde sak, registrere feil/avvik, sende inn supportsak til IT)
- TOOLS_GDPR (Personvern, GDPR, sikkerhet, passordregler)
- CONTACT_INFO (Åpningstider, hvor er IT-avdelingen, telefon, besøksadresse rom 202)
- UNKNOWN (Dersom meldingen overhodet ikke matcher noen av kategoriene over)

Svar KUN med intent-koden i store bokstaver (f.eks. SUPPORT_WIFI).
                `,
                temperature: 0.1
            }
        });
        const text = (response.text || '').trim();
        const match = text.match(/(LEARNING_GRUNNLEGGENDE|LEARNING_OFFICE|SUPPORT_WIFI|SUPPORT_PRINTER|SUPPORT_HARDWARE|SUPPORT_PASSWORD|TOOLS_REPORT|TOOLS_GDPR|CONTACT_INFO|UNKNOWN)/i);
        return match ? match[1].toUpperCase() : 'UNKNOWN';
    } catch (err) {
        console.error("Feil ved klassifisering med gemini-3.6-flash:", err.message);
        try {
            const fallback = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: message,
                config: {
                    systemInstruction: 'Klassifiser til ETT av: LEARNING_GRUNNLEGGENDE, LEARNING_OFFICE, SUPPORT_WIFI, SUPPORT_PRINTER, SUPPORT_HARDWARE, SUPPORT_PASSWORD, TOOLS_REPORT, TOOLS_GDPR, CONTACT_INFO, UNKNOWN. Svar kun med intent.'
                }
            });
            const match2 = (fallback.text || '').trim().match(/(LEARNING_GRUNNLEGGENDE|LEARNING_OFFICE|SUPPORT_WIFI|SUPPORT_PRINTER|SUPPORT_HARDWARE|SUPPORT_PASSWORD|TOOLS_REPORT|TOOLS_GDPR|CONTACT_INFO|UNKNOWN)/i);
            return match2 ? match2[1].toUpperCase() : null;
        } catch (e2) {
            return null;
        }
    }
}

// Fri samtale med IT-supportassistent Loki via Gemini 3.6 Flash (@google/genai)
async function chatMedLokiSupport(userMessage, chatHistory = []) {
    if (!process.env.GEMINI_API_KEY) return null;
    try {
        const chat = ai.chats.create({
            model: 'gemini-3.6-flash',
            config: {
                systemInstruction: `
Du er "Loki", en vennlig, oppmuntrende og faglig dyktig IT-support assistent for IT-portalen.
- Svar alltid på flytende, hyggelig norsk.
- Hjelp elever, lærere og ansatte med IT-problemer (passord, Wi-Fi, printere, programmer, maskinvare).
- Du kjenner portalens innhold: Vi har kurs for grunnleggende PC, Office/Teams, en interaktiv kodelærings-IDE (HTML/CSS/JS), feilsøkingsguider, FAQ og kontaktskjema.
- Hold svarene dine konsise, pedagogiske og oversiktlige. Bruk gjerne punktlister eller kodeblokker der det er nyttig.
- Hvis et problem krever fysisk service eller administrativ hjelp, minn om at de kan melde sak via kontaktskjemaet (/pages/konvertering/kontakt.html) eller besøke IT-kontoret i 2. etasje, rom 202 (åpent 08:00 - 15:30).
                `
            },
            history: chatHistory
        });
        const result = await chat.sendMessage({ message: userMessage });
        return result.text;
    } catch (err) {
        console.error("Feil ved Loki support chat med gemini-3.6-flash:", err.message);
        try {
            const fallbackChat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: 'Du er Loki, en hjelpsom IT-support assistent for IT-portalen. Svar på norsk, kort og hjelpsomt.'
                },
                history: chatHistory
            });
            const fallbackResult = await fallbackChat.sendMessage({ message: userMessage });
            return fallbackResult.text;
        } catch (e2) {
            return null;
        }
    }
}

app.post('/api/chat', async (req, res) => {
    const { message, mode, chatHistory } = req.body; // mode: 'guided' (decision tree) or 'free_chat' (AI assistent)
    const userId = req.session.userId || null;

    if (!message) return res.status(400).json({ success: false, message: 'Melding mangler.' });

    let botResponse = '';
    let intent = 'UNKNOWN';

    if (mode === 'guided') {
        // Veiledet modus: Bruk Gemini 3.6 Flash til å hoppe direkte til riktig node i beslutningstreet
        if (process.env.GEMINI_API_KEY) {
            const detectedIntent = await classifyDecisionTreeIntent(message);
            if (detectedIntent && detectedIntent !== 'UNKNOWN') {
                intent = detectedIntent;
                botResponse = `[INTENT_DETECTED]: ${intent}`;
            }
        }

        // Robust nøkkelord-fallback dersom AI ikke finner match eller API-nøkkel mangler
        if (intent === 'UNKNOWN') {
            const lowerInput = message.toLowerCase();
            if (lowerInput.includes('passord') || lowerInput.includes('feide') || lowerInput.includes('glemt') || lowerInput.includes('nullstill')) {
                intent = 'SUPPORT_PASSWORD';
            } else if (lowerInput.includes('wifi') || lowerInput.includes('wi-fi') || lowerInput.includes('nettverk') || lowerInput.includes('internett') || lowerInput.includes('trådløs')) {
                intent = 'SUPPORT_WIFI';
            } else if (lowerInput.includes('print') || lowerInput.includes('skriver') || lowerInput.includes('utskrift') || lowerInput.includes('toner') || lowerInput.includes('papir')) {
                intent = 'SUPPORT_PRINTER';
            } else if (lowerInput.includes('pc') || lowerInput.includes('skjerm') || lowerInput.includes('mus') || lowerInput.includes('tastatur') || lowerInput.includes('lyd') || lowerInput.includes('maskinvare') || lowerInput.includes('hardware')) {
                intent = 'SUPPORT_HARDWARE';
            } else if (lowerInput.includes('word') || lowerInput.includes('excel') || lowerInput.includes('powerpoint') || lowerInput.includes('teams') || lowerInput.includes('office') || lowerInput.includes('onedrive')) {
                intent = 'LEARNING_OFFICE';
            } else if (lowerInput.includes('grunnleggende') || lowerInput.includes('kurs') || lowerInput.includes('lære') || lowerInput.includes('start') || lowerInput.includes('nybegynner')) {
                intent = 'LEARNING_GRUNNLEGGENDE';
            } else if (lowerInput.includes('kontakt') || lowerInput.includes('åpningstid') || lowerInput.includes('telefon') || lowerInput.includes('hvor') || lowerInput.includes('adresse')) {
                intent = 'CONTACT_INFO';
            } else if (lowerInput.includes('sak') || lowerInput.includes('skjema') || lowerInput.includes('melde') || lowerInput.includes('feilmelding') || lowerInput.includes('rapport')) {
                intent = 'TOOLS_REPORT';
            } else if (lowerInput.includes('gdpr') || lowerInput.includes('personvern') || lowerInput.includes('sikkerhet')) {
                intent = 'TOOLS_GDPR';
            }

            if (intent !== 'UNKNOWN') {
                botResponse = `[INTENT_DETECTED]: ${intent}`;
            } else {
                botResponse = 'Fant ingen match i menyen. Prøv å velge fra alternativene eller formuler spørsmålet annerledes.';
            }
        }
    } else {
        // Fri samtale-modus (AI-Assistent med Gemini 3.6 Flash)
        if (process.env.GEMINI_API_KEY) {
            const aiReply = await chatMedLokiSupport(message, chatHistory || []);
            if (aiReply) {
                botResponse = aiReply;
                intent = 'FREE_CHAT';
            }
        }

        // Reserveløsning dersom Gemini-nøkkel mangler
        if (!botResponse) {
            const responses = {
                'hei': 'Hei! Hvordan kan jeg hjelpe deg med IT i dag?',
                'hjelp': 'Jeg kan hjelpe med kurs, feilsøking, passord og kontakt med IT-avdelingen.',
                'passord': 'Glemt passord? Du kan tilbakestille det på passord.vlfk.no eller lese vår FAQ.',
                'wifi': 'Sjekk at du er koblet til Skole-Ansatt eller Skole-Guest, og at flymodus er slått av.',
                'kontakt': 'Du finner IT-kontoret i 2. etasje (rom 202), åpent hverdager 08:00 - 15:30.'
            };
            const lowerInput = message.toLowerCase();
            botResponse = 'Hei! Jeg er Loki, din IT-assistent. Spør meg om passord, Wi-Fi, veiledninger, koding eller feilsøking!';
            for (const [key, value] of Object.entries(responses)) {
                if (lowerInput.includes(key)) {
                    botResponse = value;
                    break;
                }
            }
            intent = 'KEYWORD_MATCH';
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

// --- Loki IDE Socratic Tutor API ---
app.post('/api/ide/loki-tutor', async (req, res) => {
    const { message, taskTitle, taskInstructions, code, errors, taskIndex, chatHistory } = req.body;
    const userId = req.session.userId || null;

    if (!message && message !== "") {
        return res.status(400).json({ success: false, message: 'Ingen melding mottatt.' });
    }

    let tutorResponse = "";

    // 1. Forsøk Gemini 3.6 Flash via chatMedKodelærer
    if (process.env.GEMINI_API_KEY) {
        tutorResponse = await chatMedKodelærer(
            message || 'Jeg trenger et hint for å komme videre!',
            chatHistory || [],
            { taskTitle, taskInstructions, code, errors }
        );
    }

    // 2. Intelligent Socratic fallback if Gemini key is missing or failed
    if (!tutorResponse) {
        const lowerMsg = (message || '').toLowerCase();
        const lowerErrors = (errors || '').toLowerCase();
        const lowerCode = (code || '').toLowerCase();

        if (lowerMsg.includes('fasit') || lowerMsg.includes('gi meg svaret') || lowerMsg.includes('løsning')) {
            tutorResponse = "Som din kodelærer kan jeg ikke bare gi deg fasiten – den ekte gleden ligger i å knekke koden selv! 💡 Hva er det første steget i oppgavebeskrivelsen du lurer på?";
        } else if (lowerErrors.includes('syntaxerror') || lowerErrors.includes('unexpected token')) {
            tutorResponse = "Terminalen melder om en syntaksfeil! 🔍 Sjekk nøye: Har du glemt et anførselstegn `\"`, en parentes `)`, eller en klammeparentes `}` et sted?";
        } else if (lowerErrors.includes('is not defined') || lowerErrors.includes('referenceerror')) {
            tutorResponse = "En variabel eller funksjon er ikke definert. Sjekk om navnet er stavet nøyaktig likt med store og små bokstaver (JavaScript skiller mellom 'minKnapp' og 'minknapp')!";
        } else if (lowerMsg.includes('feil') || lowerMsg.includes('fungerer ikke') || lowerMsg.includes('virker ikke')) {
            tutorResponse = "La oss feilsøke sammen! Sjekk konsollen/terminalen i felt 4 nederst til høyre. Hvilken melding dukker opp når du trykker 'Kjør kode'?";
        } else {
            // Task-specific Socratic hints
            const taskHints = [
                "Husk at en overskrift på øverste nivå i HTML starter med en åpningstagg `<h1...>` og må alltid avsluttes med en lukketagg `</h1>`. Hva har du skrevet inni den?",
                "Et avsnitt bruker taggen `<p>`. For å gjøre ord fete eller uthevede, hvilken tagg kan du pakke rundt selve ordet?",
                "Lenker bruker anker-taggen `<a>`. Hvilket attributt må du legge til for å fortelle nettleseren hvor linken skal gå (tenk på Hypertext REFerence)?",
                "En uordnet liste starter med `<ul>`. Hvilken tagg må du bruke for hvert enkelt listepunkt (List Item) inni der?",
                "For å sette farge på en tekst i CSS bruker du `color`. Hva bruker du hvis du vil endre fargen på hele bakgrunnen?",
                "Tenk på boksmodellen: Hvilken egenskap gir luft på innsiden av rammen, og hvilken egenskap gjør hjørnene myke og runde?",
                "Flexbox er fantastisk for oppsett! Når du har satt `display: flex;` på forelderen, hvilken egenskap styrer sentrering langs hovedaksen?",
                "Når noen klikker på knappen din, hvilken hendelse (event) lytter du etter? Husker du `onclick` eller `addEventListener`?",
                "For å finne et element med en bestemt ID i HTML, hvilken metode på `document`-objektet bruker vi?",
                "I oppgave 10 vil vi sende en hilsen til terminalen. Hvilken innebygd funksjon skriver direkte ut i konsollen? Prøv `console. ...`!"
            ];
            const currentHint = taskHints[taskIndex] || "Ta et steg tilbake og les oppgaven nøye. Hva er det neste lille elementet du må legge til?";
            tutorResponse = `Hei! 🦉 Her er en ledetråd: ${currentHint} Hva tror du skjer hvis du tester dette i editoren?`;
        }
    }

    // Save to chat history if possible
    try {
        const query = 'INSERT INTO chat_messages (session_id, sender, message_text, intent) VALUES (?, ?, ?, ?)';
        db.query('INSERT IGNORE INTO chat_sessions (id, user_id) VALUES (?, ?)', [1, userId], () => {
            db.query(query, [1, 'user', `[IDE Spm]: ${message}`, 'LOKI_TUTOR_QUERY'], () => {
                db.query(query, [1, 'bot', tutorResponse, 'LOKI_TUTOR_RESPONSE'], () => {
                    res.json({ success: true, response: tutorResponse });
                });
            });
        });
    } catch (e) {
        res.json({ success: true, response: tutorResponse });
    }
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

// --- Teacher Dashboard & MCP Simulator API Routes (Admin) ---
const simulatorCore = require('./mcp/simulator-core.js');

// 1. Teacher Dashboard KPIs
app.get('/api/admin/teacher/stats', isAdmin, (req, res) => {
    const qStudents = 'SELECT COUNT(*) as totalStudents FROM users WHERE role = "student"';
    const qQuizzes = 'SELECT COUNT(*) as totalAttempts, ROUND(AVG(score / total_questions * 100), 1) as avgClassScore FROM quiz_results';
    const qCompleted = 'SELECT COUNT(*) as totalCompleted FROM course_progress WHERE is_completed = 1';
    const qAtRisk = `
        SELECT COUNT(DISTINCT user_id) as atRiskStudents
        FROM (
            SELECT user_id, AVG(score / total_questions * 100) as avg_pct
            FROM quiz_results
            GROUP BY user_id
            HAVING avg_pct < 50
        ) as struggling
    `;

    db.query(qStudents, (err, rStudents) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        db.query(qQuizzes, (err, rQuizzes) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            db.query(qCompleted, (err, rCompleted) => {
                if (err) return res.status(500).json({ success: false, message: err.message });
                db.query(qAtRisk, (err, rAtRisk) => {
                    if (err) return res.status(500).json({ success: false, message: err.message });
                    res.json({
                        success: true,
                        stats: {
                            totalStudents: rStudents[0].totalStudents || 0,
                            totalAttempts: rQuizzes[0].totalAttempts || 0,
                            avgClassScore: rQuizzes[0].avgClassScore || 0,
                            totalCompleted: rCompleted[0].totalCompleted || 0,
                            atRiskStudents: rAtRisk[0].atRiskStudents || 0
                        }
                    });
                });
            });
        });
    });
});

// 2. All Students Overview for Teacher
app.get('/api/admin/teacher/students', isAdmin, (req, res) => {
    const query = `
        SELECT 
            u.id, 
            u.username, 
            u.email, 
            u.created_at,
            COUNT(DISTINCT cp.course_slug) as completed_courses,
            COUNT(qr.id) as total_quiz_attempts,
            ROUND(AVG(qr.score / qr.total_questions * 100), 1) as avg_score_pct,
            MAX(qr.attempted_at) as last_attempt_at
        FROM users u
        LEFT JOIN course_progress cp ON u.id = cp.user_id AND cp.is_completed = 1
        LEFT JOIN quiz_results qr ON u.id = qr.user_id
        WHERE u.role = 'student'
        GROUP BY u.id, u.username, u.email, u.created_at
        ORDER BY u.created_at DESC
    `;

    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, students: results });
    });
});

// 3. Single Student Detailed Breakdown
app.get('/api/admin/teacher/student/:id', isAdmin, (req, res) => {
    const studentId = req.params.id;
    const userQuery = 'SELECT id, username, email, role, created_at FROM users WHERE id = ?';
    const coursesQuery = 'SELECT course_slug, is_completed, completed_at FROM course_progress WHERE user_id = ?';
    const historyQuery = 'SELECT id, course_slug, score, total_questions, attempted_at FROM quiz_results WHERE user_id = ? ORDER BY attempted_at DESC';

    db.query(userQuery, [studentId], (err, userRes) => {
        if (err || userRes.length === 0) return res.status(404).json({ success: false, message: 'Elev ikke funnet' });
        db.query(coursesQuery, [studentId], (err, courseRes) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            db.query(historyQuery, [studentId], (err, historyRes) => {
                if (err) return res.status(500).json({ success: false, message: err.message });
                res.json({
                    success: true,
                    student: userRes[0],
                    courses: courseRes,
                    quizHistory: historyRes
                });
            });
        });
    });
});

// 4. Course Analytics for Teacher
app.get('/api/admin/teacher/courses', isAdmin, (req, res) => {
    const query = `
        SELECT 
            course_slug,
            COUNT(*) as attempts,
            COUNT(DISTINCT user_id) as unique_students,
            ROUND(AVG(score / total_questions * 100), 1) as avg_score_pct,
            ROUND(MAX(score / total_questions * 100), 1) as highest_pct,
            ROUND(MIN(score / total_questions * 100), 1) as lowest_pct
        FROM quiz_results
        GROUP BY course_slug
        ORDER BY attempts DESC
    `;

    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, courses: results });
    });
});

// 5. Simulator Trigger Endpoint (Run from Admin UI)
app.post('/api/admin/simulator/run', isAdmin, async (req, res) => {
    try {
        const result = await simulatorCore.runFullSimulation(req.body);
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 6. Simulator Clear Endpoint (Reset from Admin UI)
app.post('/api/admin/simulator/clear', isAdmin, async (req, res) => {
    try {
        const result = await simulatorCore.clearTestData();
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 7. Simulator Status Endpoint
app.get('/api/admin/simulator/summary', isAdmin, async (req, res) => {
    try {
        const summary = await simulatorCore.getSimulationSummary();
        res.json({ success: true, summary });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.use(express.static(__dirname));
app.use('/pages', express.static(__dirname + '/pages'));
app.use('/css', express.static(__dirname + '/css'));
app.use('/js', express.static(__dirname + '/js'));
app.use('/Images', express.static(__dirname + '/Images'));

app.listen(port, () => {
    console.log(`Server v2 starter på http://localhost:${port}`);
});
