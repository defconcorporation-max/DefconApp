const Database = require('better-sqlite3');
const db = new Database('agency.db');

console.log('Running migration: Enhanced Task Management...');

try {
    // 1. Create task_stages table
    console.log('Creating task_stages table...');
    db.exec(`
        CREATE TABLE IF NOT EXISTS task_stages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            color TEXT DEFAULT 'gray',
            position INTEGER DEFAULT 0,
            is_default INTEGER DEFAULT 0
        );
    `);

    // 2. See Default Stages (only if empty)
    const count = db.prepare('SELECT COUNT(*) as c FROM task_stages').get().c;
    if (count === 0) {
        console.log('Seeding default stages...');
        const insert = db.prepare('INSERT INTO task_stages (name, color, position, is_default) VALUES (?, ?, ?, ?)');
        const stages = [
            ['To Do', 'gray', 0, 1],
            ['In Progress', 'blue', 1, 0],
            ['Review', 'violet', 2, 0],
            ['Done', 'emerald', 3, 0]
        ];
        stages.forEach(s => insert.run(...s));
    }

    // 3. Add columns to project_tasks
    // Check if columns exist first to avoid errors on re-run
    const columns = db.prepare("PRAGMA table_info(project_tasks)").all();
    const hasStage = columns.some(c => c.name === 'stage_id');
    const hasAssignee = columns.some(c => c.name === 'assigned_to');

    if (!hasStage) {
        console.log('Adding stage_id column...');
        db.exec('ALTER TABLE project_tasks ADD COLUMN stage_id INTEGER REFERENCES task_stages(id)');
    }

    if (!hasAssignee) {
        console.log('Adding assigned_to column...');
        db.exec('ALTER TABLE project_tasks ADD COLUMN assigned_to INTEGER REFERENCES team_members(id)');
    }

    // 4. Data Migration: Map is_completed to stages
    console.log('Migrating existing tasks to stages...');
    const toDoId = db.prepare("SELECT id FROM task_stages WHERE name = 'To Do'").get()?.id || 1;
    const doneId = db.prepare("SELECT id FROM task_stages WHERE name = 'Done'").get()?.id || 4;

    db.prepare(`UPDATE project_tasks SET stage_id = ? WHERE is_completed = 0 AND stage_id IS NULL`).run(toDoId);
    db.prepare(`UPDATE project_tasks SET stage_id = ? WHERE is_completed = 1 AND stage_id IS NULL`).run(doneId);

    console.log('Migration complete.');

} catch (error) {
    console.error('Error during migration:', error);
}

db.close();
