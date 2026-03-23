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
    console.log('Starting Team Assignment Migration...');
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS shoot_assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shoot_id INTEGER NOT NULL,
                team_member_id INTEGER NOT NULL,
                role TEXT, -- Optional override of member's default role
                assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(shoot_id) REFERENCES shoots(id) ON DELETE CASCADE,
                FOREIGN KEY(team_member_id) REFERENCES team_members(id) ON DELETE CASCADE,
                UNIQUE(shoot_id, team_member_id)
            )
        `);
        console.log('Created shoot_assignments table.');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
