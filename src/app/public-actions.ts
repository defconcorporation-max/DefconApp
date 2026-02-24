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

    if (!companyName || !email || !projectType || !date || !startTime || !endTime) {
        throw new Error('Missing required fields');
    }

    // Minimum time logic is enforced on the client, but we can trust they sent valid strings
    await db.execute({
        sql: `INSERT INTO public_shoot_requests 
              (company_name, email, project_type, shoot_date, start_time, end_time, additional_info, status) 
              VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
        args: [companyName, email, projectType, date, startTime, endTime, additionalInfo || null]
    });

    // In a real app we'd trigger an email notification to the admin here

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
