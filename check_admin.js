require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'Brukerstøtte_portalen'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }

    db.query('SELECT username, email, role FROM users WHERE email = ?', ['thekvalem@gmail.com'], (err, results) => {
        if (err) {
            console.error(err);
        } else {
            console.log('User found:', results[0]);
        }
        process.exit(0);
    });
});
