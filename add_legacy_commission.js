const Database = require('better-sqlite3');
const db = new Database('defcon.db');

// Add a commission with NO project_id
const stmt = db.prepare(`
    INSERT INTO commissions (client_id, project_id, role_name, person_name, rate_type, rate_value, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const info = stmt.run(1, null, 'LegacyRole', 'LegacyUser', 'Fixed', 200, 'Pending');
console.log('Inserted Legacy Commission ID:', info.lastInsertRowid);
