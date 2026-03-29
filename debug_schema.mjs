import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env' });
if (!process.env.TURSO_DATABASE_URL) {
    dotenv.config({ path: '.env.production' });
}

async function debug() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    console.log('--- DATABASE SCHEMA DEBUG ---');
    try {
        const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('Tables:', tables.rows.map(r => r.name).join(', '));

        for (const table of ['tasks', 'task_subtasks']) {
            console.log(`\nTable: ${table}`);
            const info = await client.execute(`PRAGMA table_info(${table})`);
            console.table(info.rows);
        }

        console.log('\n--- DATA CHECK (TASKS) ---');
        const tasks = await client.execute("SELECT * FROM tasks LIMIT 5");
        console.dir(tasks.rows, { depth: null });

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

debug();
