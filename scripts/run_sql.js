require('dotenv').config();
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// Sjekk om filnavn er oppgitt
if (process.argv.length < 3) {
    console.error('Bruk: node run_sql.js <filnavn.sql>');
    process.exit(1);
}

const fileName = process.argv[2];
const sqlPath = path.isAbsolute(fileName) ? fileName : path.resolve(process.cwd(), fileName);

if (!fs.existsSync(sqlPath)) {
    console.error(`Feil: Filen "${fileName}" ble ikke funnet.`);
    process.exit(1);
}

const sql = fs.readFileSync(sqlPath, 'utf8');

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'IT-portalen',
    multipleStatements: true
});

db.connect((err) => {
    if (err) {
        console.error('Tilkobling til database feilet:', err);
        process.exit(1);
    }
    
    console.log(`Koblet til database. Kjører SQL fra "${path.basename(sqlPath)}"...`);
    
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Feil under kjøring av SQL:', err);
            db.end();
            process.exit(1);
        }
        
        console.log('SQL ble utført uten feil!');
        // Noen ganger returnerer multipleStatements en array av resultater
        if (Array.isArray(result)) {
            console.log(`Utførte ${result.length} operasjoner.`);
        }
        
        db.end();
    });
});
