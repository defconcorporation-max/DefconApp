const Database = require('better-sqlite3');
const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

dotenv.config();

const localDb = new Database('agency.db');
const turso = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

// Explicit order to satisfy Foreign Key constraints
const TABLE_ORDER = [
    'settings',
    'team_members',
    'pipeline_stages',
    'task_stages',
    'clients',
    'services',
    'expenses',

    // Level 1 Dependencies
    'projects', // -> clients, pipeline_stages
    'team_availability', // -> team_members

    // Level 2 Dependencies
    'shoots', // -> projects
    'project_services', // -> projects, services
    'project_tasks', // -> projects, task_stages, team_members
    'commissions', // -> projects, team_members
    'payments', // -> projects

    // Level 3 Dependencies
    'shoot_videos', // -> shoots
    'post_production', // -> shoots

    // Level 4 Dependencies
    'shoot_video_notes', // -> shoot_videos

    // Others/Independent or unknown (add at end or beginning if safe)
    'social_links',
    'credentials',
    'content_ideas',
    'tasks' // Check if this is legacy or used
];

async function migrate() {
    console.log('🚀 Starting Ordered Migration to Turso...');

    // Get all schemas first
    const allTables = localDb.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    const tableMap = new Map(allTables.map(t => [t.name, t.sql]));

    // Check for missing tables in our list
    for (const t of allTables) {
        if (!TABLE_ORDER.includes(t.name)) {
            console.warn(`⚠️ Table ${t.name} is not in explicit order list. Appending to end.`);
            TABLE_ORDER.push(t.name);
        }
    }

    // Process in order
    for (const tableName of TABLE_ORDER) {
        const sql = tableMap.get(tableName);
        if (!sql) {
            console.warn(`⚠️ Table ${tableName} found in list but not in local DB.`);
            continue;
        }

        console.log(`\n📦 Migrating table: ${tableName}`);

        // Cleanup schema: Remove 'main.' references
        let createSql = sql.replace(/main\./g, '');
        // Also remove "CREATE TABLE" and replace with "CREATE TABLE IF NOT EXISTS" for safety? 
        // Or just Drop first.

        try {
            // We can't easily drop if other tables depend on it and FKs are on.
            // But we are building in dependency order (Parents first). 
            // So we should DROP in REVERSE order if we wanted to clear everything.
            // For now, let's assume we are appending or fixing. 
            // If table exists, we might error on Create.
            // Let's try to DROP but catch error.
            try { await turso.execute(`DROP TABLE IF EXISTS ${tableName}`); } catch (e) { }

            await turso.execute(createSql);
            console.log(`   ✅ Table created.`);
        } catch (e) {
            console.error(`   ❌ Failed to create table ${tableName}:`, e.message);
            // If create fails (e.g. exists and can't drop due to FK), we might still want to try inserting data?
            // But if schema is wrong, inserts will fail.
        }

        // Migrate Data
        const rows = localDb.prepare(`SELECT * FROM ${tableName}`).all();
        if (rows.length === 0) {
            console.log(`   ℹ️ No data to migrate.`);
            continue;
        }

        console.log(`   🔄 Migrating ${rows.length} rows...`);

        let successCount = 0;
        for (const row of rows) {
            const columns = Object.keys(row);
            const values = Object.values(row);
            const placeholders = columns.map(() => '?').join(', ');
            const insertSql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

            try {
                await turso.execute({ sql: insertSql, args: values });
                successCount++;
            } catch (e) {
                // Ignore unique constraint errors if data already exists
                if (e.message.includes('UNIQUE constraint failed')) {
                    // console.log('Skipping duplicate');
                } else {
                    console.error(`      Failed to insert row:`, e.message);
                }
            }
        }
        console.log(`   ✅ Migrated ${successCount}/${rows.length} rows.`);
    }

    console.log('\n✨ Migration complete!');
}

migrate().catch(console.error);
