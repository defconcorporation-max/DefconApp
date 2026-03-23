const Database = require('better-sqlite3');
const db = new Database('agency.db');

console.log('Running migration: Create expenses table...');

try {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount_pre_tax REAL NOT NULL,
            tps_amount REAL DEFAULT 0,
            tvq_amount REAL DEFAULT 0,
            total_amount REAL NOT NULL,
            date TEXT NOT NULL,
            category TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();
    console.log('Expenses table created.');
} catch (error) {
    console.error('Migration failed:', error);
}

db.close();
