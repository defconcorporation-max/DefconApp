const { createClient } = require('@libsql/client');
require('dotenv').config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
    console.error('TURSO_DATABASE_URL is not defined');
    process.exit(1);
}

const db = createClient({
    url,
    authToken,
});

async function main() {
    console.log('Starting v2 Migration...');

    try {
        // 1. Users Table Updates (RBAC)
        console.log('Updating users table...');
        try {
            await db.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'Team'");
        } catch (e) { console.log('  - role column exists'); }
        try {
            await db.execute("ALTER TABLE users ADD COLUMN agency_id INTEGER");
        } catch (e) { console.log('  - agency_id column exists'); }
        try {
            await db.execute("ALTER TABLE users ADD COLUMN avatar_url TEXT");
        } catch (e) { console.log('  - avatar_url column exists'); }


        // 2. Clients Table Updates (Profile & Value)
        console.log('Updating clients table...');
        try {
            await db.execute("ALTER TABLE clients ADD COLUMN client_value REAL DEFAULT 0");
        } catch (e) { console.log('  - client_value column exists'); }
        try {
            await db.execute("ALTER TABLE clients ADD COLUMN avatar_url TEXT");
        } catch (e) { console.log('  - avatar_url column exists'); }
        // agency_id might already exist from previous migrations, but good to ensure
        try {
            await db.execute("ALTER TABLE clients ADD COLUMN agency_id INTEGER");
        } catch (e) { console.log('  - agency_id column exists'); }


        // 3. Shoots Table Updates (Creative)
        console.log('Updating shoots table...');
        try {
            await db.execute("ALTER TABLE shoots ADD COLUMN concept TEXT");
        } catch (e) { console.log('  - concept column exists'); }
        try {
            await db.execute("ALTER TABLE shoots ADD COLUMN mood TEXT");
        } catch (e) { console.log('  - mood column exists'); }
        try {
            await db.execute("ALTER TABLE shoots ADD COLUMN shot_list TEXT"); // JSON
        } catch (e) { console.log('  - shot_list column exists'); }
        try {
            await db.execute("ALTER TABLE shoots ADD COLUMN moodboard_urls TEXT"); // JSON
        } catch (e) { console.log('  - moodboard_urls column exists'); }


        // 4. Availability Module
        console.log('Creating availability tables...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS availability_slots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                start_time DATETIME NOT NULL,
                end_time DATETIME NOT NULL,
                is_booked BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS availability_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slot_id INTEGER NOT NULL,
                agency_id INTEGER NOT NULL,
                status TEXT DEFAULT 'Pending', -- Pending, Approved, Rejected
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (slot_id) REFERENCES availability_slots(id),
                FOREIGN KEY (agency_id) REFERENCES agencies(id)
            )
        `);

        console.log('v2 Migration Complete! 🚀');

    } catch (error) {
        console.error('Migration failed:', error);
    }
}

main();
