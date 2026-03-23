'use server';

import { db, getAgencyFilter } from './utils';

// --- ANALYTICS (Admin Only) ---

export async function getShootVolumeData() {
    const agencyId = await getAgencyFilter();
    let sql = `
        SELECT strftime('%Y-%m', shoot_date) as month, COUNT(*) as count
        FROM shoots s
    `;
    const args: any[] = [];
    if (agencyId) {
        sql += ' JOIN clients c ON s.client_id = c.id WHERE c.agency_id = ?';
        args.push(agencyId);
    }
    sql += ' GROUP BY month ORDER BY month ASC LIMIT 12';
    const { rows } = await db.execute({ sql, args });
    return rows as unknown as { month: string; count: number }[];
}

export async function getProjectOriginData() {
    const agencyId = await getAgencyFilter();
    let sql = `
        SELECT COALESCE(a.name, 'Direct') as source, COUNT(p.id) as count
        FROM projects p JOIN clients c ON p.client_id = c.id
        LEFT JOIN agencies a ON c.agency_id = a.id
    `;
    const args: any[] = [];
    if (agencyId) { sql += ' WHERE c.agency_id = ?'; args.push(agencyId); }
    sql += ' GROUP BY source ORDER BY count DESC LIMIT 10';
    const { rows } = await db.execute({ sql, args });
    return rows as unknown as { source: string; count: number }[];
}

export async function getProjectCompletionData() {
    const agencyId = await getAgencyFilter();
    let sql = 'SELECT status, COUNT(*) as count FROM projects p';
    const args: any[] = [];
    if (agencyId) {
        sql += ' JOIN clients c ON p.client_id = c.id WHERE c.agency_id = ?';
        args.push(agencyId);
    }
    sql += ' GROUP BY status';
    const { rows } = await db.execute({ sql, args });
    return rows as unknown as { status: string; count: number }[];
}

export async function getMonthlyRevenueData() {
    const agencyId = await getAgencyFilter();
    let sql = `
        SELECT strftime('%Y-%m', pay.date) as month, SUM(pay.amount) as total
        FROM payments pay
        JOIN projects p ON pay.project_id = p.id
        JOIN clients c ON p.client_id = c.id
        WHERE pay.status = 'paid'
    `;
    const args: any[] = [];
    if (agencyId) { sql += ' AND c.agency_id = ?'; args.push(agencyId); }
    sql += ' GROUP BY month ORDER BY month ASC LIMIT 12';
    const { rows } = await db.execute({ sql, args });
    return rows as unknown as { month: string; total: number }[];
}

export async function getTopClientsData() {
    const agencyId = await getAgencyFilter();
    let sql = `
        SELECT c.id, c.company_name, c.name,
        COALESCE(SUM(CASE WHEN pay.status = 'paid' THEN pay.amount ELSE 0 END), 0) as total_revenue,
        COUNT(DISTINCT p.id) as project_count
        FROM clients c
        LEFT JOIN projects p ON c.id = p.client_id
        LEFT JOIN payments pay ON p.id = pay.project_id
    `;
    const args: any[] = [];
    if (agencyId) { sql += ' WHERE c.agency_id = ?'; args.push(agencyId); }
    sql += ' GROUP BY c.id ORDER BY total_revenue DESC LIMIT 10';
    const { rows } = await db.execute({ sql, args });
    return rows as unknown as any[];
}

export async function getTeamUtilizationData() {
    const { rows } = await db.execute(`
        SELECT tm.id, tm.name, tm.color,
        (SELECT COUNT(*) FROM shoot_assignments sa JOIN shoots s ON sa.shoot_id = s.id WHERE sa.member_id = tm.id AND s.shoot_date >= date('now', '-30 days')) as monthly_shoots,
        (SELECT COUNT(*) FROM project_tasks pt WHERE pt.assigned_to = tm.id AND pt.is_completed = 0) as open_tasks
        FROM team_members tm ORDER BY monthly_shoots DESC
    `);
    return rows as unknown as any[];
}

// --- POST PRODUCTION ---

export async function getPostProdItems() {
    const { rows } = await db.execute(`
        SELECT pp.*, s.title as shoot_title, s.shoot_date, c.company_name as client_name, p.title as project_title
        FROM post_production pp
        JOIN shoots s ON pp.shoot_id = s.id
        JOIN clients c ON s.client_id = c.id
        LEFT JOIN projects p ON s.project_id = p.id
        ORDER BY pp.created_at DESC
    `);
    return rows as unknown as any[];
}

export async function updatePostProdStatus(id: number, status: string) {
    const { revalidatePath } = await import('next/cache');
    await db.execute({ sql: 'UPDATE post_production SET status = ? WHERE id = ?', args: [status, id] });
    revalidatePath('/post-production');
}

// --- MISC ---

export async function getAuditLogs(limit: number = 20) {
    try {
        const { rows } = await db.execute({
            sql: `SELECT al.*, 
                  CASE WHEN al.entity_type = 'shoot' THEN (SELECT title FROM shoots WHERE id = al.entity_id)
                       WHEN al.entity_type = 'project' THEN (SELECT title FROM projects WHERE id = al.entity_id)
                       WHEN al.entity_type = 'client' THEN (SELECT company_name FROM clients WHERE id = al.entity_id)
                       ELSE NULL END as entity_name
                  FROM audit_logs al ORDER BY al.created_at DESC LIMIT ?`,
            args: [limit]
        });
        return rows as unknown as any[];
    } catch (e) { console.error('Audit logs failed:', e); return []; }
}

export async function submitPublicBooking(formData: FormData) {
    const { revalidatePath } = await import('next/cache');
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string || null;
    const company = formData.get('company') as string || null;
    const shootType = formData.get('shootType') as string;
    const date = formData.get('date') as string;
    const time = formData.get('time') as string || null;
    const budget = formData.get('budget') as string || null;
    const notes = formData.get('notes') as string || null;
    if (!name || !email || !shootType || !date) return;
    await db.execute({
        sql: 'INSERT INTO public_shoot_requests (name, email, phone, company, shoot_type, preferred_date, preferred_time, budget, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [name, email, phone, company, shootType, date, time, budget, notes]
    });
    try {
        await db.execute({
            sql: "INSERT INTO notifications (type, message, link) VALUES (?, ?, ?)",
            args: ['booking_request', `New booking request from ${name} (${company || email})`, '/settings']
        });
    } catch (e) { console.error('Notification creation failed:', e); }
    revalidatePath('/settings');
}

export async function getUnreadNotifications() {
    try {
        const { rows } = await db.execute(`
            SELECT * FROM notifications WHERE is_read = 0 ORDER BY created_at DESC LIMIT 50
        `);
        return rows as unknown as any[];
    } catch (e) {
        console.error('Failed to fetch notifications:', e);
        return [];
    }
}

export async function markNotificationAsRead(id: number) {
    const { revalidatePath } = await import('next/cache');
    try {
        await db.execute({ sql: 'UPDATE notifications SET is_read = 1 WHERE id = ?', args: [id] });
        revalidatePath('/');
    } catch (e) {
        console.error('Failed to mark notification as read:', e);
    }
}

// --- SOCIAL / CONTENT ---

export async function getSocialLinks(clientId: number) {
    const { rows } = await db.execute({ sql: 'SELECT * FROM social_links WHERE client_id = ? ORDER BY platform ASC', args: [clientId] });
    return rows as unknown as any[];
}

export async function addSocialLink(formData: FormData) {
    const { revalidatePath } = await import('next/cache');
    const clientId = Number(formData.get('clientId'));
    const platform = formData.get('platform') as string;
    const url = formData.get('url') as string;
    if (!clientId || !platform || !url) return;
    await db.execute({ sql: 'INSERT INTO social_links (client_id, platform, url) VALUES (?, ?, ?)', args: [clientId, platform, url] });
    revalidatePath(`/clients/${clientId}`);
}

export async function deleteSocialLink(id: number, clientId: number) {
    const { revalidatePath } = await import('next/cache');
    await db.execute({ sql: 'DELETE FROM social_links WHERE id = ?', args: [id] });
    revalidatePath(`/clients/${clientId}`);
}

export async function getContentIdeas(clientId: number) {
    const { rows } = await db.execute({ sql: 'SELECT * FROM content_ideas WHERE client_id = ? ORDER BY created_at DESC', args: [clientId] });
    return rows as unknown as any[];
}

export async function addContentIdea(formData: FormData) {
    const { revalidatePath } = await import('next/cache');
    const clientId = Number(formData.get('clientId'));
    const title = formData.get('title') as string;
    const description = formData.get('description') as string || null;
    if (!clientId || !title) return;
    await db.execute({ sql: 'INSERT INTO content_ideas (client_id, title, description) VALUES (?, ?, ?)', args: [clientId, title, description] });
    revalidatePath(`/clients/${clientId}`);
}

export async function deleteContentIdea(id: number, clientId: number) {
    const { revalidatePath } = await import('next/cache');
    await db.execute({ sql: 'DELETE FROM content_ideas WHERE id = ?', args: [id] });
    revalidatePath(`/clients/${clientId}`);
}

// --- CREDENTIALS ---

export async function getCredentials(clientId: number) {
    const { rows } = await db.execute({ sql: 'SELECT * FROM credentials WHERE client_id = ?', args: [clientId] });
    return rows as unknown as any[];
}

export async function addCredential(formData: FormData) {
    const { revalidatePath } = await import('next/cache');
    const clientId = Number(formData.get('clientId'));
    const platform = formData.get('platform') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    if (!clientId || !platform) return;
    await db.execute({ sql: 'INSERT INTO credentials (client_id, platform, username, password) VALUES (?, ?, ?, ?)', args: [clientId, platform, username, password] });
    revalidatePath(`/clients/${clientId}`);
}

export async function deleteCredential(id: number, clientId: number) {
    const { revalidatePath } = await import('next/cache');
    await db.execute({ sql: 'DELETE FROM credentials WHERE id = ?', args: [id] });
    revalidatePath(`/clients/${clientId}`);
}

// --- SHOOT VIDEOS / NOTES ---

export async function getShootVideos(shootId: number) {
    const { rows } = await db.execute({ sql: 'SELECT * FROM shoot_videos WHERE shoot_id = ? ORDER BY id ASC', args: [shootId] });
    return rows as unknown as any[];
}

export async function addShootVideo(formData: FormData) {
    const { revalidatePath } = await import('next/cache');
    const shootId = Number(formData.get('shootId'));
    const title = formData.get('title') as string || 'Video';
    const url = formData.get('url') as string || '';
    if (!shootId) return;
    await db.execute({ sql: 'INSERT INTO shoot_videos (shoot_id, title, url) VALUES (?, ?, ?)', args: [shootId, title, url] });
    revalidatePath(`/shoots/${shootId}`);
}

export async function deleteShootVideo(id: number, shootId: number) {
    const { revalidatePath } = await import('next/cache');
    await db.execute({ sql: 'DELETE FROM shoot_videos WHERE id = ?', args: [id] });
    revalidatePath(`/shoots/${shootId}`);
}

export async function getVideoNotes(videoId: number) {
    const { rows } = await db.execute({ sql: 'SELECT * FROM shoot_video_notes WHERE video_id = ? ORDER BY created_at DESC', args: [videoId] });
    return rows as unknown as any[];
}

export async function addVideoNote(formData: FormData) {
    const { revalidatePath } = await import('next/cache');
    const videoId = Number(formData.get('videoId'));
    const content = formData.get('content') as string;
    const shootId = Number(formData.get('shootId'));
    if (!videoId || !content) return;
    await db.execute({ sql: 'INSERT INTO shoot_video_notes (video_id, content) VALUES (?, ?)', args: [videoId, content] });
    revalidatePath(`/shoots/${shootId}`);
}

export async function deleteVideoNote(id: number, shootId: number) {
    const { revalidatePath } = await import('next/cache');
    await db.execute({ sql: 'DELETE FROM shoot_video_notes WHERE id = ?', args: [id] });
    revalidatePath(`/shoots/${shootId}`);
}

export type SearchResult = {
    id: number;
    type: 'Page' | 'Client' | 'Project' | 'Shoot';
    title: string;
    subtitle?: string;
    href: string;
};
