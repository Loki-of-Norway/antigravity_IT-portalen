require('dotenv').config();
const mysql = require('mysql2');
const bcrypt = require('bcrypt');

// Admin-brukeren leses fra .env, så passordet aldri havner i git
const adminUser = {
    username: process.env.ADMIN_USERNAME || 'LokiAdmin',
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    role: 'admin'
};

if (!adminUser.email || !adminUser.password) {
    console.error('Mangler ADMIN_EMAIL eller ADMIN_PASSWORD i .env');
    process.exit(1);
}

const dbConnectionOptions = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'IT-portalen'
};

// Samme oppsett som server.js, så skriptet også fungerer mot Aiven
if (process.env.DB_PORT) {
    dbConnectionOptions.port = process.env.DB_PORT;
}
if (process.env.DB_HOST && process.env.DB_HOST !== 'localhost') {
    dbConnectionOptions.ssl = { rejectUnauthorized: false };
}

const db = mysql.createConnection(dbConnectionOptions);

db.connect(async (err) => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    try {
        const hashedPassword = await bcrypt.hash(adminUser.password, 10);
        
        // Check if user exists
        const checkQuery = 'SELECT * FROM users WHERE email = ?';
        db.query(checkQuery, [adminUser.email], (err, results) => {
            if (err) throw err;

            if (results.length > 0) {
                // Update existing user
                const updateQuery = 'UPDATE users SET username = ?, password_hash = ?, role = ? WHERE email = ?';
                db.query(updateQuery, [adminUser.username, hashedPassword, adminUser.role, adminUser.email], (err, result) => {
                    if (err) throw err;
                    console.log('Admin user updated successfully.');
                    process.exit(0);
                });
            } else {
                // Insert new user
                const insertQuery = 'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)';
                db.query(insertQuery, [adminUser.username, adminUser.email, hashedPassword, adminUser.role], (err, result) => {
                    if (err) throw err;
                    console.log('Admin user created successfully.');
                    process.exit(0);
                });
            }
        });

    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
});
