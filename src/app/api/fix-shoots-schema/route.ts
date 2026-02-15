import { turso } from '@/lib/turso';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('--- Migrating shoots table: making client_id nullable ---');

        // Step 1: Create new table with client_id nullable + all added columns
        await turso.execute(`
            CREATE TABLE IF NOT EXISTS shoots_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER,
                project_id INTEGER,
                title TEXT DEFAULT '',
                shoot_date DATE,
                start_time TEXT,
                end_time TEXT,
                color TEXT DEFAULT 'indigo',
                due_date TEXT,
                status TEXT DEFAULT 'Planned',
                is_blocking BOOLEAN DEFAULT 0,
                agency_id INTEGER,
                FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE,
                FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
            )
        `);

        // Step 2: Copy all data from old table
        await turso.execute(`
            INSERT INTO shoots_new (id, client_id, project_id, title, shoot_date, start_time, end_time, color, due_date, status, is_blocking, agency_id)
            SELECT id, client_id, project_id, title, shoot_date, start_time, end_time, color, due_date, status, is_blocking, agency_id
            FROM shoots
        `);

        // Step 3: Drop old table
        await turso.execute('DROP TABLE shoots');

        // Step 4: Rename new table
        await turso.execute('ALTER TABLE shoots_new RENAME TO shoots');

        return NextResponse.json({
            success: true,
            message: 'shoots table migrated: client_id is now nullable. Booking requests will work.'
        });
    } catch (error) {
        console.error('Shoots migration failed:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
