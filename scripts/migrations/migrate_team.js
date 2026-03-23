
const Database = require('better-sqlite3');
const db = new Database('agency.db');

db.prepare(`
    CREATE TABLE IF NOT EXISTS team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT,
        email TEXT,
        phone TEXT,
        hourly_rate REAL DEFAULT 0,
        color TEXT DEFAULT 'indigo',
        status TEXT DEFAULT 'Active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS team_availability (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        status TEXT NOT NULL,
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();

console.log('Team tables created successfully.');
