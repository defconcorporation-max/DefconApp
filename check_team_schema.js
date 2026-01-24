const Database = require('better-sqlite3');
const db = new Database('agency.db');

console.log('--- team_members columns ---');
const columns = db.prepare("PRAGMA table_info(team_members)").all();
console.log(columns);

db.close();
