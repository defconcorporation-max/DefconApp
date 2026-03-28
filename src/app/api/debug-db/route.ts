import { NextResponse } from 'next/server';
import { turso as db } from '@/lib/turso';

export async function GET() {
    try {
        const slotsRes = await db.execute("SELECT * FROM availability_slots");
        const shootsRes = await db.execute("SELECT * FROM shoots WHERE start_time LIKE '%8:30%' OR end_time LIKE '%12:30%' OR start_time LIKE '%08:30%'");
        return NextResponse.json({
            slots: slotsRes.rows.filter((x: any) => String(x.start_time).includes('08:30') || String(x.start_time).includes('T08:30')),
            shoots: shootsRes.rows
        });
    } catch(e: any) {
        return NextResponse.json({ error: e.message });
    }
}
