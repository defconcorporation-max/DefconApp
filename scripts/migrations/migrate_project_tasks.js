const Database = require('better-sqlite3');
const db = new Database('agency.db');

console.log('Running migration: create project_tasks table...');

try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS project_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            is_completed INTEGER DEFAULT 0,
            due_date TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
    `);
    console.log('Success: project_tasks table created.');
} catch (error) {
    console.error('Error creating table:', error);
}

db.close();
