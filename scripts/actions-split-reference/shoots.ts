'use server';

import { db, getAgencyFilter, logActivity } from './utils';
import { revalidatePath } from 'next/cache';
import { Shoot, ShootAssignment } from '@/types';

export async function getAllShoots() {
    const agencyId = await getAgencyFilter();
    let sql = `
        SELECT s.*, c.company_name as client_name, c.id as client_id,
        ag.name as agency_name, ag.color as agency_color,
        p.title as project_title, p.id as project_id,
        pp.status as post_prod_status, pp.id as post_prod_id
        FROM shoots s
        JOIN clients c ON s.client_id = c.id
        LEFT JOIN agencies ag ON COALESCE(s.agency_id, c.agency_id) = ag.id
        LEFT JOIN projects p ON s.project_id = p.id
        LEFT JOIN post_production pp ON s.id = pp.shoot_id
    `;
    const args: any[] = [];
    if (agencyId) { sql += ' WHERE c.agency_id = ?'; args.push(agencyId); }
    sql += ' ORDER BY s.shoot_date DESC';
    const { rows } = await db.execute({ sql, args });
    return rows as unknown as any[];
}

export async function addShoot(formData: FormData) {
    const clientId = Number(formData.get('clientId'));
    const title = formData.get('title') as string;
    const shootDate = formData.get('shootDate') as string;
    const startTime = formData.get('startTime') as string || null;
    const endTime = formData.get('endTime') as string || null;
    const projectId = formData.get('projectId') ? Number(formData.get('projectId')) : null;

    if (!clientId || !shootDate) return;

    await db.execute({
        sql: 'INSERT INTO shoots (client_id, title, shoot_date, start_time, end_time, project_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [clientId, title || 'Shoot', shootDate, startTime, endTime, projectId, 'Scheduled']
    });

    try { await logActivity('SHOOT_CREATED', `New shoot: ${title || 'Shoot'} on ${shootDate}`, clientId, 'client'); } catch (e) { console.error('Log error', e); }
    revalidatePath('/');
    revalidatePath('/shoots');
}

export async function updateShoot(formData: FormData) {
    const id = Number(formData.get('id'));
    const title = formData.get('title') as string;
    const shootDate = formData.get('shootDate') as string;
    const startTime = formData.get('startTime') as string || null;
    const endTime = formData.get('endTime') as string || null;
    const status = formData.get('status') as string;

    await db.execute({
        sql: 'UPDATE shoots SET title = ?, shoot_date = ?, start_time = ?, end_time = ?, status = ? WHERE id = ?',
        args: [title, shootDate, startTime, endTime, status, id]
    });
    revalidatePath('/');
    revalidatePath('/shoots');
    revalidatePath(`/shoots/${id}`);
}

export async function deleteShoot(id: number) {
    await db.execute({ sql: 'DELETE FROM shoots WHERE id = ?', args: [id] });
    revalidatePath('/');
    revalidatePath('/shoots');
}

export async function getShootAssignments(shootId: number): Promise<ShootAssignment[]> {
    const { rows } = await db.execute({
        sql: `SELECT sa.*, tm.name as member_name, tm.color as member_color
              FROM shoot_assignments sa
              JOIN team_members tm ON sa.member_id = tm.id
              WHERE sa.shoot_id = ?`,
        args: [shootId]
    });
    return rows as unknown as ShootAssignment[];
}

export async function getAllShootAssignments(): Promise<ShootAssignment[]> {
    const { rows } = await db.execute(`
        SELECT sa.*, tm.name as member_name, tm.color as member_color
        FROM shoot_assignments sa
        JOIN team_members tm ON sa.member_id = tm.id
    `);
    return rows as unknown as ShootAssignment[];
}

export async function assignMemberToShoot(shootId: number, memberId: number, role: string = '') {
    const existing = await db.execute({
        sql: 'SELECT id FROM shoot_assignments WHERE shoot_id = ? AND member_id = ?',
        args: [shootId, memberId]
    });
    if (existing.rows.length > 0) return;
    await db.execute({
        sql: 'INSERT INTO shoot_assignments (shoot_id, member_id, role) VALUES (?, ?, ?)',
        args: [shootId, memberId, role]
    });
    revalidatePath('/shoots');
    revalidatePath(`/shoots/${shootId}`);
}

export async function removeMemberFromShoot(shootId: number, memberId: number) {
    await db.execute({
        sql: 'DELETE FROM shoot_assignments WHERE shoot_id = ? AND member_id = ?',
        args: [shootId, memberId]
    });
    revalidatePath('/shoots');
    revalidatePath(`/shoots/${shootId}`);
}

export async function updateShootVideoTitle(id: number, title: string, clientId: number, shootId: number) {
    await db.execute({ sql: 'UPDATE shoot_videos SET title = ? WHERE id = ?', args: [title, id] });
    revalidatePath(`/shoots/${shootId}`);
}

export async function updateShootCreative(shootId: number, data: { concept?: string, mood?: string, shot_list?: string, moodboard_urls?: string }) {
    const fields = [];
    const args = [];
    if (data.concept !== undefined) { fields.push('concept = ?'); args.push(data.concept); }
    if (data.mood !== undefined) { fields.push('mood = ?'); args.push(data.mood); }
    if (data.shot_list !== undefined) { fields.push('shot_list = ?'); args.push(data.shot_list); }
    if (data.moodboard_urls !== undefined) { fields.push('moodboard_urls = ?'); args.push(data.moodboard_urls); }
    if (fields.length === 0) return;
    args.push(shootId);
    await db.execute({ sql: `UPDATE shoots SET ${fields.join(', ')} WHERE id = ?`, args: args as any[] });
    revalidatePath(`/shoots/${shootId}`);
}

export async function finishShoot(shootId: number) {
    try {
        await db.batch([
            { sql: 'UPDATE shoots SET status = ? WHERE id = ?', args: ['Completed', shootId] },
            { sql: 'INSERT INTO post_production (shoot_id, status) VALUES (?, ?)', args: [shootId, 'Derush'] }
        ], 'write');
        try { await logActivity('SHOOT_COMPLETED', `Shoot finished and moved to post-production`, shootId, 'shoot'); } catch (e) { console.error('Log error', e); }
        revalidatePath(`/shoots/${shootId}`);
        revalidatePath('/post-production');
        revalidatePath('/');
    } catch (error) {
        console.error('Error in finishShoot:', error);
        throw error;
    }
}

export async function revertShoot(shootId: number) {
    try {
        await db.batch([
            { sql: "UPDATE shoots SET status = 'Planned' WHERE id = ?", args: [shootId] },
            { sql: 'DELETE FROM post_prod_projects WHERE shoot_id = ?', args: [shootId] }
        ], 'write');
        revalidatePath(`/shoots/${shootId}`);
        revalidatePath('/post-production');
    } catch (error) {
        console.error('Error in revertShoot:', error);
        throw error;
    }
}

export async function updateShootClient(shootId: number, clientId: number) {
    if (!shootId || !clientId) return;
    await db.execute({ sql: 'UPDATE shoots SET client_id = ? WHERE id = ?', args: [clientId, shootId] });
    revalidatePath('/availability');
    revalidatePath('/shoots');
}

export async function approveShoot(id: number) {
    if (!id) return;
    await db.execute({ sql: "UPDATE shoots SET status = 'Confirmed' WHERE id = ?", args: [id] });
    revalidatePath('/availability');
}

export async function denyShoot(id: number) {
    if (!id) return;
    await db.execute({ sql: "DELETE FROM shoots WHERE id = ?", args: [id] });
    revalidatePath('/availability');
}

export async function toggleShootBlocking(shootId: number, isBlocking: boolean) {
    await db.execute({ sql: 'UPDATE shoots SET is_blocking = ? WHERE id = ?', args: [isBlocking ? 1 : 0, shootId] });
    revalidatePath('/availability');
}

export async function updateShootTime(id: number, start: string, end: string) {
    if (!id || !start || !end) return;
    const datePart = start.split(' ')[0];
    const startTimePart = start.split(' ')[1];
    const endTimePart = end.split(' ')[1];
    await db.execute({
        sql: 'UPDATE shoots SET shoot_date = ?, start_time = ?, end_time = ? WHERE id = ?',
        args: [datePart, startTimePart, endTimePart, id]
    });
    revalidatePath('/availability');
    revalidatePath(`/shoots/${id}`);
}
