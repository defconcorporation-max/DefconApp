const db = require('better-sqlite3')('agency.db');

console.log('Migrating shoots table for colors...');

try {
    db.prepare("ALTER TABLE shoots ADD COLUMN color TEXT DEFAULT 'indigo'").run();
    console.log('Added color column to shoots table.');
} catch (error) {
    if (error.message.includes('duplicate column name')) {
        console.log('Column color already exists, skipping.');
    } else {
        console.error('Migration failed:', error);
    }
}
