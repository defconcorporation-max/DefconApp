
const Database = require('better-sqlite3');
const db = new Database('agency.db');

const payments = db.prepare("PRAGMA table_info(payments)").all();
console.log('Payments Table:', payments);
