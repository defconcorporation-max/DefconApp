const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
const fs = require('fs');

const envPath = fs.existsSync('.env.local') ? '.env.local' : '.env';
dotenv.config({ path: envPath });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error('Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env');
    process.exit(1);
}

const db = createClient({ url, authToken });

async function migrate() {
    console.log('Starting Post-Production Migration...');

    try {
        // 1. Templates Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS post_prod_templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                default_tasks TEXT NOT NULL -- JSON array of task titles
            )
        `);
        console.log('Created post_prod_templates table.');

        // Seed Templates
        const templates = [
            {
                name: 'Music Video',
                tasks: JSON.stringify(['Derush', 'Sync Audio', 'Multi-Cam Setup', 'Rough Cut', 'Client Review 1', 'Color Grading', 'VFX / Effects', 'Sound Design', 'Final Export'])
            },
            {
                name: 'Corporate Interview',
                tasks: JSON.stringify(['Derush', 'Select Best Takes', 'A-Cut (Dialogue)', 'B-Roll Insert', 'Lower Thirds & Titles', 'Color Correction', 'Audio Mixing', 'Client Review', 'Final Export'])
            },
            {
                name: 'Social Media Reel',
                tasks: JSON.stringify(['Select Highlights', 'Trend Music Sync', 'Dynamic Cuts', 'Captions / Subtitles', 'Sound Effects', 'Export 9:16'])
            }
        ];

        for (const t of templates) {
            // Check if exists
            const { rows } = await db.execute({
                sql: 'SELECT id FROM post_prod_templates WHERE name = ?',
                args: [t.name]
            });
            if (rows.length === 0) {
                await db.execute({
                    sql: 'INSERT INTO post_prod_templates (name, default_tasks) VALUES (?, ?)',
                    args: [t.name, t.tasks]
                });
                console.log(`Seeded template: ${t.name}`);
            }
        }

        // 2. Modify post_prod_items (Add template_id if missing)
        // Note: Generic "post_production_items" or "post_prod_items" might vary. 
        // Checking schema: The implementation plan said "ensure existence".
        // Let's create `post_prod_projects` to be safe/clean or use existing if user has one.
        // User has `PostProductionItem` type, likely corresponding table `post_production_items` or similar?
        // Let's look at `index.ts`, it says `PostProductionItem`.
        // I will assume `post_prod_items` for this new feature set to avoid conflicts with legacy if exists.

        await db.execute(`
            CREATE TABLE IF NOT EXISTS post_prod_projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shoot_id INTEGER,
                template_id INTEGER,
                status TEXT DEFAULT 'In Progress',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(shoot_id) REFERENCES shoots(id),
                FOREIGN KEY(template_id) REFERENCES post_prod_templates(id)
            )
        `);
        console.log('Created post_prod_projects table.');

        // 3. Tasks Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS post_prod_tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER,
                title TEXT NOT NULL,
                is_completed BOOLEAN DEFAULT 0,
                order_index INTEGER,
                FOREIGN KEY(project_id) REFERENCES post_prod_projects(id) ON DELETE CASCADE
            )
        `);
        console.log('Created post_prod_tasks table.');

        // 4. Versions Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS post_prod_versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER,
                version_number INTEGER,
                video_url TEXT,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(project_id) REFERENCES post_prod_projects(id) ON DELETE CASCADE
            )
        `);
        console.log('Created post_prod_versions table.');

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
