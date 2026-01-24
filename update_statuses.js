const Database = require('better-sqlite3');
const db = new Database('agency.db');

// Set null or empty statuses to 'Lead'
const infoLead = db.prepare("UPDATE clients SET status = 'Lead' WHERE status IS NULL OR status = ''").run();
console.log(`Updated ${infoLead.changes} clients to 'Lead'`);

// Ensure 'Active' stays 'Active' (redundant but safe)
const infoActive = db.prepare("UPDATE clients SET status = 'Active' WHERE status = 'Active'").run();
console.log(`Verified ${infoActive.changes} clients as 'Active'`);

// Check final distribution
const distribution = db.prepare("SELECT status, COUNT(*) as count FROM clients GROUP BY status").all();
console.log('Status Distribution:', distribution);
