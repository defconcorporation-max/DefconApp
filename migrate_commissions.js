
const Database = require('better-sqlite3');
const db = new Database('agency.db');

try {
    db.prepare("ALTER TABLE commissions ADD COLUMN status TEXT DEFAULT 'Pending'").run();
    console.log('Added status column');
} catch (e) {
    console.log('Status column might already exist:', e.message);
}

try {
    db.prepare("ALTER TABLE commissions ADD COLUMN paid_date TEXT").run();
    console.log('Added paid_date column');
} catch (e) {
    console.log('Paid_date column might already exist:', e.message);
}

console.log('Migration completed');
