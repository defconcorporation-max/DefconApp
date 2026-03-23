const Database = require('better-sqlite3');
const db = new Database('agency.db');

console.log('Running migration: Add description to project_tasks...');

try {
    const columns = db.prepare("PRAGMA table_info(project_tasks)").all();
    const hasDescription = columns.some(c => c.name === 'description');

    if (!hasDescription) {
        console.log('Adding description column...');
        db.prepare("ALTER TABLE project_tasks ADD COLUMN description TEXT").run();
        console.log('Column added.');
    } else {
        console.log('Column already exists.');
    }
} catch (error) {
    console.error('Migration failed:', error);
}

db.close();
