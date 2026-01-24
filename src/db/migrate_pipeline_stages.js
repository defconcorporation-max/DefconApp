const Database = require('better-sqlite3');
const db = new Database('agency.db');

// Create table
db.prepare(`
    CREATE TABLE IF NOT EXISTS pipeline_stages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        label TEXT NOT NULL,
        value TEXT UNIQUE NOT NULL,
        color TEXT DEFAULT 'bg-gray-500',
        order_index INTEGER NOT NULL
    )
`).run();

// Seed default stages if empty
const count = db.prepare('SELECT COUNT(*) as count FROM pipeline_stages').get().count;

if (count === 0) {
    const insert = db.prepare('INSERT INTO pipeline_stages (label, value, color, order_index) VALUES (?, ?, ?, ?)');
    const stages = [
        { label: 'Lead', value: 'Lead', color: 'bg-blue-500', order: 0 },
        { label: 'Outreach', value: 'Outreach', color: 'bg-yellow-500', order: 1 },
        { label: 'Negotiation', value: 'Negotiation', color: 'bg-orange-500', order: 2 },
        { label: 'Active', value: 'Active', color: 'bg-emerald-500', order: 3 },
        { label: 'Inactive', value: 'Inactive', color: 'bg-red-500', order: 4 },
    ];

    stages.forEach(stage => {
        insert.run(stage.label, stage.value, stage.color, stage.order);
    });
    console.log('Seeded default pipeline stages.');
} else {
    console.log('Pipeline stages already exist.');
}

// Verify
const rows = db.prepare('SELECT * FROM pipeline_stages ORDER BY order_index ASC').all();
console.log('Current Stages:', rows);
