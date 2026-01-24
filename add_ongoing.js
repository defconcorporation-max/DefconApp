const Database = require('better-sqlite3');
const db = new Database('agency.db');

console.log('Adding "Ongoing" stage...');
try {
    // Check if exists
    const exists = db.prepare("SELECT id FROM task_stages WHERE name = 'Ongoing'").get();
    if (!exists) {
        // Get max position
        const max = db.prepare('SELECT MAX(position) as m FROM task_stages').get().m;

        db.prepare("INSERT INTO task_stages (name, color, position) VALUES ('Ongoing', 'yellow', ?)").run(max + 1);
        console.log('Stage "Ongoing" added.');
    } else {
        console.log('Stage "Ongoing" already exists.');
    }
} catch (e) {
    console.error(e);
}
db.close();
