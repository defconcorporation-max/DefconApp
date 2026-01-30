import { turso } from '@/lib/turso';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('--- Force Fixing Shoot Assignments Schema ---');

        // 1. Drop the problematic table to start fresh
        await turso.execute('DROP TABLE IF EXISTS shoot_assignments');

        // 2. Recreate it with the correct schema
        await turso.execute(`
            CREATE TABLE shoot_assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shoot_id INTEGER NOT NULL,
                member_id INTEGER NOT NULL,
                role TEXT,
                FOREIGN KEY(shoot_id) REFERENCES shoots(id) ON DELETE CASCADE,
                FOREIGN KEY(member_id) REFERENCES team_members(id) ON DELETE CASCADE
            )
        `);

        return NextResponse.json({
            success: true,
            message: 'Force fixed: shoot_assignments table dropped and recreated.'
        });
    } catch (error) {
        console.error('Migration failed:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
