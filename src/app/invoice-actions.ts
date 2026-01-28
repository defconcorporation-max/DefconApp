'use server';

import { turso as db } from '@/lib/turso';
import { revalidatePath } from 'next/cache';

export async function sendInvoiceEmail(projectId: number, email: string) {
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log(`📧 Sending Invoice #${projectId} to ${email}`);

    // Update status to 'Sent'
    await db.execute({
        sql: "UPDATE projects SET invoice_status = 'Sent', invoice_sent_at = CURRENT_TIMESTAMP WHERE id = ?",
        args: [projectId]
    });

    revalidatePath(`/projects/${projectId}/invoice`);
    return { success: true, message: `Invoice sent to ${email}` };
}

export async function updateInvoiceStatus(projectId: number, status: 'Draft' | 'Sent' | 'Paid' | 'Overdue') {
    await db.execute({
        sql: "UPDATE projects SET invoice_status = ? WHERE id = ?",
        args: [status, projectId]
    });

    revalidatePath(`/projects/${projectId}/invoice`);
    return { success: true };
}
