'use server';

import { turso } from '@/lib/turso';
import { revalidatePath } from 'next/cache';

// Notification types
export type NotificationType =
    | 'shoot_assigned'
    | 'payment_received'
    | 'task_overdue'
    | 'project_overdue'
    | 'booking_request'
    | 'shoot_upcoming'
    | 'status_change';

interface CreateNotificationParams {
    type: NotificationType;
    message: string;
    link?: string;
}

// --- Core Functions ---

export async function createNotification({ type, message, link }: CreateNotificationParams) {
    try {
        await turso.execute({
            sql: 'INSERT INTO notifications (type, message, link) VALUES (?, ?, ?)',
            args: [type, message, link || null]
        });
    } catch (e) {
        console.error('[Notifications] Failed to create notification:', e);
    }
}

export async function getNotifications(limit = 20) {
    const { rows } = await turso.execute({
        sql: 'SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?',
        args: [limit]
    });
    return rows as any[];
}

export async function markAllNotificationsRead() {
    await turso.execute('UPDATE notifications SET is_read = 1 WHERE is_read = 0');
    revalidatePath('/');
}

export async function deleteNotification(id: number) {
    await turso.execute({
        sql: 'DELETE FROM notifications WHERE id = ?',
        args: [id]
    });
    revalidatePath('/');
}

// --- Auto-Trigger Helpers ---

export async function notifyShootAssigned(shootTitle: string, memberName: string, shootId: number) {
    await createNotification({
        type: 'shoot_assigned',
        message: `${memberName} a été assigné au shoot "${shootTitle}"`,
        link: `/shoots/${shootId}`
    });
}

export async function notifyPaymentReceived(clientName: string, amount: number, projectId?: number) {
    await createNotification({
        type: 'payment_received',
        message: `Paiement de $${amount.toLocaleString()} reçu de ${clientName}`,
        link: projectId ? `/projects/${projectId}` : '/finance'
    });
}

export async function notifyTaskOverdue(taskTitle: string, projectTitle: string, projectId: number) {
    await createNotification({
        type: 'task_overdue',
        message: `Tâche en retard : "${taskTitle}" (${projectTitle})`,
        link: `/projects/${projectId}`
    });
}

export async function notifyStatusChange(entityType: string, entityName: string, newStatus: string, link: string) {
    await createNotification({
        type: 'status_change',
        message: `${entityType} "${entityName}" → ${newStatus}`,
        link
    });
}

export async function notifyShootUpcoming(shootTitle: string, shootDate: string, shootId: number) {
    await createNotification({
        type: 'shoot_upcoming',
        message: `Shoot demain : "${shootTitle}" (${shootDate})`,
        link: `/shoots/${shootId}`
    });
}

// --- Check for overdue tasks (can be called from a cron/API route) ---

export async function checkAndNotifyOverdue() {
    const today = new Date().toISOString().split('T')[0];

    // Find overdue tasks not already notified
    const { rows: overdueTasks } = await turso.execute({
        sql: `
            SELECT pt.id, pt.title, p.title as project_title, p.id as project_id
            FROM project_tasks pt
            JOIN projects p ON pt.project_id = p.id
            WHERE pt.is_completed = 0 
            AND pt.due_date < ?
            AND pt.id NOT IN (
                SELECT CAST(SUBSTR(link, INSTR(link, '/projects/') + 10) AS INTEGER)
                FROM notifications 
                WHERE type = 'task_overdue' 
                AND created_at > datetime('now', '-7 days')
            )
            LIMIT 10
        `,
        args: [today]
    });

    for (const task of overdueTasks as any[]) {
        await notifyTaskOverdue(task.title, task.project_title, task.project_id);
    }

    return { notified: overdueTasks.length };
}
