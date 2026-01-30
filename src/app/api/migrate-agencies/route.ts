import { turso } from '@/lib/turso';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('--- Starting Migration: Labels -> Agencies ---');

        // 1. Create agencies table
        await turso.execute(`
            CREATE TABLE IF NOT EXISTS agencies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                color TEXT NOT NULL
            )
        `);

        // 2. data migration: Copy project_labels to agencies
        // We do this blindly; if it runs twice, we might duplicate if we don't check. 
        // But assuming single run or empty target.
        // Better: Insert where not exists.
        await turso.execute(`
            INSERT INTO agencies (id, name, color)
            SELECT id, name, color FROM project_labels
            WHERE id NOT IN (SELECT id FROM agencies)
        `);

        // 3. Add agency_id to clients if it doesn't exist
        // SQLite doesn't support IF NOT EXISTS for ADD COLUMN easily in one statement without error if exists.
        // We catch error or check pragma. simpler to try/catch the alter.

        try {
            await turso.execute('ALTER TABLE clients ADD COLUMN agency_id INTEGER');
        } catch (e) {
            console.log('Column agency_id likely already exists or error:', e);
        }

        // 4. Migrate data: copy label_id to agency_id
        await turso.execute('UPDATE clients SET agency_id = label_id WHERE agency_id IS NULL AND label_id IS NOT NULL');

        return NextResponse.json({
            success: true,
            message: 'Migration Labels -> Agencies completed successfully.'
        });
    } catch (error) {
        console.error('Migration failed:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
