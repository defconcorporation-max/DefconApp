const db = require('better-sqlite3')('agency.db');

console.log('Migrating shoots table...');

try {
    db.prepare('ALTER TABLE shoots ADD COLUMN start_time TEXT').run();
    db.prepare('ALTER TABLE shoots ADD COLUMN end_time TEXT').run();
    console.log('Added start_time and end_time columns to shoots table.');
} catch (error) {
    if (error.message.includes('duplicate column name')) {
        console.log('Columns already exist, skipping.');
    } else {
        console.error('Migration failed:', error);
    }
}
