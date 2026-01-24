const db = require('better-sqlite3')('agency.db');

console.log('Starting migration: Projects, Services, and Post-Production...');

// 1. Create Projects Table
console.log('Creating projects table...');
db.prepare(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'Active', -- Active, Completed, Archived
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
  )
`).run();

// 2. Create Services Table (Global Catalog)
console.log('Creating services table...');
db.prepare(`
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    default_rate REAL,
    rate_type TEXT DEFAULT 'Fixed' -- Fixed, Hourly, Day
  )
`).run();

// 3. Create Project Services Table (Billable Items linked to a project)
console.log('Creating project_services table...');
db.prepare(`
  CREATE TABLE IF NOT EXISTS project_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    service_id INTEGER, -- Optional link to catalog
    name TEXT NOT NULL,
    rate REAL,
    quantity REAL DEFAULT 1,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY(service_id) REFERENCES services(id) ON DELETE SET NULL
  )
`).run();

// 4. Create Post-Production Table
console.log('Creating post_production table...');
db.prepare(`
  CREATE TABLE IF NOT EXISTS post_production (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shoot_id INTEGER NOT NULL,
    status TEXT DEFAULT 'Derush', -- Derush, Editing, Validation, Archived
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(shoot_id) REFERENCES shoots(id) ON DELETE CASCADE
  )
`).run();

// 5. Update Shoots Table to include project_id
// Check if column exists first
const columns = db.prepare("PRAGMA table_info(shoots)").all();
const hasProjectId = columns.some(c => c.name === 'project_id');

if (!hasProjectId) {
    console.log('Adding project_id to shoots table...');
    db.prepare('ALTER TABLE shoots ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE').run();

    // 6. Migrate existing shoots
    console.log('Migrating existing shoots to default projects...');

    // Get all clients
    const clients = db.prepare('SELECT id, name, company_name FROM clients').all();

    for (const client of clients) {
        // Create a default project for the client
        const projectName = `General - ${client.company_name || client.name}`;
        const info = db.prepare('INSERT INTO projects (client_id, title) VALUES (?, ?)').run(client.id, projectName);
        const projectId = info.lastInsertRowid;

        // Update all shoots for this client to belong to this project
        db.prepare('UPDATE shoots SET project_id = ? WHERE client_id = ?').run(projectId, client.id);
        console.log(`Migrated shoots for client ${client.id} to project ${projectId}`);
    }
}

console.log('Migration completed successfully.');
