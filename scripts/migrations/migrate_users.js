const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

dotenv.config();

const turso = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
    console.log('🚀 Creating users table...');

    try {
        await turso.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Users table created.');
    } catch (e) {
        console.error('❌ Error creating table:', e);
    }
}

migrate();
