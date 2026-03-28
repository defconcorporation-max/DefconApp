'use server';

import { turso as db } from '@/lib/turso';

export async function submitPublicShootRequest(formData: FormData) {
    const companyName = formData.get('companyName') as string;
    const email = formData.get('email') as string;
    const projectType = formData.get('projectType') as string;
    const date = formData.get('date') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const additionalInfo = formData.get('additionalInfo') as string;

    const contactName = formData.get('contactName') as string;
    const clientName = formData.get('clientName') as string;
    const phone = formData.get('phone') as string;
    const requestType = formData.get('requestType') as string || 'shoot';

    if (!companyName || !email || !date || !startTime || !endTime) {
        throw new Error('Missing required fields');
    }

    // 1. Ensure Placeholder Client
    let placeholderClientId = null;
    try {
        const { rows } = await db.execute("SELECT id FROM clients WHERE name = '_PENDING_REQUEST' LIMIT 1");
        if (rows.length > 0) {
            placeholderClientId = rows[0].id;
        } else {
            const res = await db.execute("INSERT INTO clients (name, company_name, status, plan) VALUES ('_PENDING_REQUEST', 'Pending Requests', 'Inactive', 'Standard')");
            placeholderClientId = Number(res.lastInsertRowid);
        }
    } catch(e) { console.error('Client fetching failed', e); }

    const combinedTitle = `${companyName} - ${requestType === 'shoot' ? projectType : (requestType === 'meeting_30' ? '30m Meeting' : '1h Meeting')}`;

    // 2. Insert directly into Shoots table so it shows on calendar
    await db.execute({
        sql: `INSERT INTO shoots 
              (title, shoot_date, start_time, end_time, status, shoot_type, contact_name, contact_email, contact_phone, is_blocking, client_id) 
              VALUES (?, ?, ?, ?, 'Pending', ?, ?, ?, ?, 0, ?)`,
        args: [
            combinedTitle, date, startTime, endTime, requestType, 
            contactName, email, phone || null, placeholderClientId
        ]
    });

    // 3. Trigger Webhook (GHL or anywhere else)
    const webhookUrl = process.env.GHL_WEBHOOK_URL;
    if (webhookUrl) {
        try {
            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyName, clientName, email, contactName, phone, 
                    projectType, date, startTime, endTime, requestType, additionalInfo
                })
            });
        } catch (e) {
            console.error('Webhook payload failed, GHL might not receive it', e);
        }
    }

    return { success: true };
}

export async function getPublicShootRequests() {
    const { rows } = await db.execute('SELECT * FROM public_shoot_requests ORDER BY created_at DESC');
    return rows;
}

export async function updatePublicShootRequestStatus(id: number, status: 'Approved' | 'Rejected') {
    await db.execute({
        sql: 'UPDATE public_shoot_requests SET status = ? WHERE id = ?',
        args: [status, id]
    });
    return { success: true };
}
