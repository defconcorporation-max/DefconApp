const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
    try {
        console.log('Starting migration for Tasks, Webhooks and Meetings feature...');

        // 1. Create Tasks table
        await client.execute(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT DEFAULT 'Todo',
                ghl_id TEXT,
                sync_status TEXT DEFAULT 'Pending',
                entity_type TEXT,
                entity_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Tasks table created/verified.');

        // 2. Add columns to shoots for meetings
        const alterShoots = [
            `ALTER TABLE shoots ADD COLUMN shoot_type TEXT DEFAULT 'shoot';`,
            `ALTER TABLE shoots ADD COLUMN contact_name TEXT;`,
            `ALTER TABLE shoots ADD COLUMN contact_email TEXT;`,
            `ALTER TABLE shoots ADD COLUMN contact_phone TEXT;`
        ];

        for (const query of alterShoots) {
            try {
                await client.execute(query);
                console.log(`Successfully added column: ${query}`);
            } catch (e) {
                if (e.message && e.message.includes('duplicate column name')) {
                    console.log(`Column already exists, skipping: ${query}`);
                } else {
                    console.warn(`Warning executing ${query}:`, e.message);
                }
            }
        }

        console.log('Migration completed successfully!');
    } catch (e) {
        console.error('Migration failed:', e);
    }
}

migrate();
