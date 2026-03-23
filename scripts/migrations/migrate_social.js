require('dotenv').config();
const { createClient } = require('@libsql/client');

const url = process.env.TURSO_DATABASE_URL || 'file:agency.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
    url,
    authToken,
});

const schema = [
    `CREATE TABLE IF NOT EXISTS social_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT,
        handle TEXT,
        avatar_url TEXT,
        access_token TEXT,
        connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS social_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER,
        content TEXT,
        media_url TEXT,
        scheduled_date TIMESTAMP,
        status TEXT DEFAULT 'Draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(account_id) REFERENCES social_accounts(id) ON DELETE CASCADE
    )`
];

async function migrate() {
    try {
        console.log('Migrating Social Tables to:', url);
        for (const sql of schema) {
            await db.execute(sql);
        }
        console.log('Social Media tables created successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
