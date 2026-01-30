
import { NextResponse } from 'next/server';
import { turso } from '@/lib/turso';

export async function GET() {
    try {
        await turso.execute("ALTER TABLE shoots ADD COLUMN post_prod_status TEXT");
        return NextResponse.json({ success: true, message: "Added post_prod_status column" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message });
    }
}
