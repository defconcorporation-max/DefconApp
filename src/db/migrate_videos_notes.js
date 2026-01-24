const db = require('better-sqlite3')('agency.db');

console.log('Migrating shoot_videos table for notes...');

try {
    db.prepare("ALTER TABLE shoot_videos ADD COLUMN notes TEXT DEFAULT ''").run();
    console.log('Added notes column to shoot_videos table.');
} catch (error) {
    if (error.message.includes('duplicate column name')) {
        console.log('Column notes already exists, skipping.');
    } else {
        console.error('Migration failed:', error);
    }
}
