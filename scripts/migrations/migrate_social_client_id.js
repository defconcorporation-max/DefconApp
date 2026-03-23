require('dotenv').config();
const { createClient } = require('@libsql/client');

const url = process.env.TURSO_DATABASE_URL || 'file:agency.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
    url,
    authToken,
});

async function migrate() {
    try {
        console.log('Adding client_id to social_accounts...');

        try {
            await db.execute("ALTER TABLE social_accounts ADD COLUMN client_id INTEGER REFERENCES clients(id)");
            console.log('✅ Added client_id column');
        } catch (e) {
            if (e.message.includes('duplicate column')) {
                console.log('ℹ️ client_id column already exists');
            } else {
                console.error('❌ Failed to add client_id:', e.message);
            }
        }

        console.log('Migration complete.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
