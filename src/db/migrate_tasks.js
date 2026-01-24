const db = require('better-sqlite3')('agency.db');

console.log('Creating tasks table...');

db.prepare(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    is_completed INTEGER DEFAULT 0, -- 0 for false, 1 for true
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

console.log('Tasks table created successfully.');
