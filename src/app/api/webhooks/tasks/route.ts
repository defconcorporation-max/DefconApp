import { NextResponse } from 'next/server';
import { turso as db } from '@/lib/turso';

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        
        // Example GHL payload might contain task title, description, id, etc.
        // We will just log it for now as part of the preparation.
        console.log('Received GHL Task Webhook Payload:', payload);

        // Typical sync logic:
        // if (payload.ghl_task_id) {
        //    update or insert into tasks table
        // }

        return NextResponse.json({ success: true, message: 'Webhook received' });
    } catch (error: any) {
        console.error('Task Webhook Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to process webhook' },
            { status: 500 }
        );
    }
}
