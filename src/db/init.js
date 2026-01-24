
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'agency.db');
const db = new Database(dbPath);

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');

try {
    db.exec(schema);
    console.log('Database initialized successfully.');
} catch (error) {
    console.error('Failed to initialize database:', error);
}
