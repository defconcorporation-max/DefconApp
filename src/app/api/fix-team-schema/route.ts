import { turso } from '@/lib/turso';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await turso.execute(`
            CREATE TABLE IF NOT EXISTS team_members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                role TEXT,
                email TEXT,
                phone TEXT,
                hourly_rate REAL DEFAULT 0,
                color TEXT DEFAULT 'indigo',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await turso.execute(`
            CREATE TABLE IF NOT EXISTS shoot_assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shoot_id INTEGER NOT NULL,
                member_id INTEGER NOT NULL,
                role TEXT,
                FOREIGN KEY(shoot_id) REFERENCES shoots(id) ON DELETE CASCADE,
                FOREIGN KEY(member_id) REFERENCES team_members(id) ON DELETE CASCADE
            );
        `);

        await turso.execute(`
            CREATE TABLE IF NOT EXISTS team_availability (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                member_id INTEGER NOT NULL,
                date DATE NOT NULL,
                status TEXT, 
                note TEXT,
                FOREIGN KEY(member_id) REFERENCES team_members(id) ON DELETE CASCADE
            );
        `);

        return NextResponse.json({ success: true, message: 'Team tables created successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
