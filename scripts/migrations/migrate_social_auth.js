const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local or .env
const envPath = fs.existsSync('.env.local') ? '.env.local' : '.env';
dotenv.config({ path: envPath });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error('Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env');
    process.exit(1);
}

const db = createClient({
    url,
    authToken,
});

async function migrate() {
    console.log('Starting migration: Add OAuth fields to social_accounts...');

    try {
        // Add columns if they don't exist
        // SQLite doesn't support IF NOT EXISTS for ADD COLUMN in older versions, 
        // ensuring we handle errors gracefully if columns exist or check first.

        // We will try running them one by one.
        const columns = [
            'ADD COLUMN provider_account_id TEXT',
            'ADD COLUMN access_token TEXT',
            'ADD COLUMN refresh_token TEXT',
            'ADD COLUMN expires_at INTEGER'
        ];

        for (const col of columns) {
            try {
                await db.execute(`ALTER TABLE social_accounts ${col}`);
                console.log(`Executed: ALTER TABLE social_accounts ${col}`);
            } catch (e) {
                if (e.message.includes('duplicate column name')) {
                    console.log(`Skipping: Column already exists (${col})`);
                } else {
                    throw e;
                }
            }
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
