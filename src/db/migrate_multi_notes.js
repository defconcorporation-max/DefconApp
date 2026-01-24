const db = require('better-sqlite3')('agency.db');

console.log('Migrating: Creating shoot_video_notes table...');

db.prepare(`
    CREATE TABLE IF NOT EXISTS shoot_video_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (video_id) REFERENCES shoot_videos(id) ON DELETE CASCADE
    )
`).run();

console.log('Created shoot_video_notes table.');
