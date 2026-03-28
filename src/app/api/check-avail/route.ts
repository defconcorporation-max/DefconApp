import { NextResponse } from 'next/server';
import { turso as db } from '@/lib/turso';

export async function GET() {
    try {
        const slots = await db.execute('SELECT * FROM availability_slots');
        const shoots = await db.execute('SELECT * FROM shoots');
        const team = await db.execute('SELECT * FROM team_availability');
        return NextResponse.json({ slots: slots.rows, shoots: shoots.rows, team: team.rows });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
