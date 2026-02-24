import { createClient } from '@libsql/client';
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error('Missing TURSO credentials');
    process.exit(1);
}

const db = createClient({ url, authToken });

async function migrate() {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                message TEXT NOT NULL,
                link TEXT,
                is_read BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Successfully created notifications table.');
    } catch (e) {
        console.error('Migration failed:', e);
    }
}

migrate();
