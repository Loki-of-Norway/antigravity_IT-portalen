require('dotenv').config();
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'IT-portalen'
});

console.log("--- System Verification ---");

// Check API Key
if (process.env.GEMINI_API_KEY) {
    console.log("✅ GEMINI_API_KEY is found (Length: " + process.env.GEMINI_API_KEY.length + ")");
} else {
    console.log("❌ GEMINI_API_KEY is MISSING in .env");
}

// Check Database
connection.connect(err => {
    if (err) {
        console.error("❌ DB Connection Failed:", err.message);
        process.exit(1);
    }
    console.log("✅ DB Connected");

    const query = `
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'IT-portalen'}' 
        AND TABLE_NAME = 'chat_messages' 
        AND COLUMN_NAME = 'intent';
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error("❌ Failed to query columns:", err.message);
        } else if (results.length > 0) {
            console.log("✅ Column 'intent' EXISTS in 'chat_messages' table.");
        } else {
            console.log("❌ Column 'intent' is MISSING in 'chat_messages' table.");
        }
        connection.end();
    });
});
