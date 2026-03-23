const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
const fs = require('fs');

const envPath = fs.existsSync('.env.local') ? '.env.local' : '.env';
dotenv.config({ path: envPath });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

async function migrate() {
    console.log('Adding Client Auth columns...');
    try {
        await db.execute("ALTER TABLE clients ADD COLUMN password_hash TEXT");
        await db.execute("ALTER TABLE clients ADD COLUMN portal_enabled BOOLEAN DEFAULT 0");
        console.log('Migration successful: Added password_hash and portal_enabled');
    } catch (e) {
        if (e.message.includes('duplicate column')) {
            console.log('Columns already exist, skipping.');
        } else {
            console.error('Migration failed:', e);
        }
    }
}

migrate();
