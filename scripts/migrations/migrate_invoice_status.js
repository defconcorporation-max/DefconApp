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
        console.log('Adding Invoice Status to Projects...');

        // Add invoice_status column
        try {
            await db.execute("ALTER TABLE projects ADD COLUMN invoice_status TEXT DEFAULT 'Draft'");
            console.log('✅ Added invoice_status column');
        } catch (e) {
            if (e.message.includes('duplicate column')) {
                console.log('ℹ️ invoice_status column already exists');
            } else {
                console.error('❌ Failed to add invoice_status:', e.message);
            }
        }

        // Add invoice_sent_at column
        try {
            await db.execute("ALTER TABLE projects ADD COLUMN invoice_sent_at TIMESTAMP");
            console.log('✅ Added invoice_sent_at column');
        } catch (e) {
            if (e.message.includes('duplicate column')) {
                console.log('ℹ️ invoice_sent_at column already exists');
            } else {
                console.error('❌ Failed to add invoice_sent_at:', e.message);
            }
        }

        console.log('Migration complete.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
