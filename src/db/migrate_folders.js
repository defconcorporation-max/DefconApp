
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'agency.db');
const db = new Database(dbPath);

try {
    db.prepare("ALTER TABLE clients ADD COLUMN folder_path TEXT").run();
    console.log("Migration successful: Added folder_path to clients table.");
} catch (error) {
    if (error.message.includes("duplicate column name")) {
        console.log("Migration skipped: Column folder_path already exists.");
    } else {
        console.error("Migration failed:", error);
    }
}
