const Database = require('better-sqlite3');
const db = new Database('agency.db');
console.log(db.prepare('SELECT * FROM task_stages ORDER BY position').all());
db.close();
