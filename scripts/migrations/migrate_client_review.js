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
    console.log('Adding Review Token column...');
    try {
        await db.execute("ALTER TABLE post_prod_projects ADD COLUMN review_token TEXT");
        await db.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_review_token ON post_prod_projects(review_token)");
        console.log('Migration successful: Added review_token');
    } catch (e) {
        if (e.message.includes('duplicate column')) {
            console.log('Column already exists, skipping.');
        } else {
            console.error('Migration failed:', e);
        }
    }
}

migrate();
