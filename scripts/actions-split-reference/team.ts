'use server';

import { db } from './utils';
import { revalidatePath } from 'next/cache';
import { TeamMember } from '@/types';

export async function getTeamMembers(): Promise<TeamMember[]> {
    const { rows } = await db.execute('SELECT * FROM team_members ORDER BY name ASC');
    return rows as unknown as TeamMember[];
}

export async function addTeamMember(formData: FormData) {
    const name = formData.get('name') as string;
    const role = formData.get('role') as string || 'Team';
    const email = formData.get('email') as string || null;
    const phone = formData.get('phone') as string || null;
    const color = formData.get('color') as string || '#8b5cf6';
    const hourlyRate = formData.get('hourlyRate') ? Number(formData.get('hourlyRate')) : null;
    if (!name) return;
    await db.execute({
        sql: 'INSERT INTO team_members (name, role, email, phone, color, hourly_rate) VALUES (?, ?, ?, ?, ?, ?)',
        args: [name, role, email, phone, color, hourlyRate]
    });
    revalidatePath('/team');
}

export async function updateTeamMember(formData: FormData) {
    const id = Number(formData.get('id'));
    const name = formData.get('name') as string;
    const role = formData.get('role') as string;
    const email = formData.get('email') as string || null;
    const phone = formData.get('phone') as string || null;
    const color = formData.get('color') as string || '#8b5cf6';
    const hourlyRate = formData.get('hourlyRate') ? Number(formData.get('hourlyRate')) : null;
    await db.execute({
        sql: 'UPDATE team_members SET name = ?, role = ?, email = ?, phone = ?, color = ?, hourly_rate = ? WHERE id = ?',
        args: [name, role, email, phone, color, hourlyRate, id]
    });
    revalidatePath('/team');
    revalidatePath(`/team/${id}`);
}

export async function getTeamMember(id: number) {
    const { rows } = await db.execute({ sql: 'SELECT * FROM team_members WHERE id = ?', args: [id] });
    return rows[0] as unknown as TeamMember;
}

export async function getMemberAvailability(memberId: number) {
    const { rows } = await db.execute({
        sql: 'SELECT * FROM team_availability WHERE member_id = ? ORDER BY date ASC',
        args: [memberId]
    });
    return rows as unknown as any[];
}

export async function setMemberAvailability(memberId: number, date: string, status: string, note: string = '') {
    const existing = await db.execute({
        sql: 'SELECT id FROM team_availability WHERE member_id = ? AND date = ?',
        args: [memberId, date]
    });
    if (existing.rows.length > 0) {
        await db.execute({
            sql: 'UPDATE team_availability SET status = ?, note = ? WHERE member_id = ? AND date = ?',
            args: [status, note, memberId, date]
        });
    } else {
        await db.execute({
            sql: 'INSERT INTO team_availability (member_id, date, status, note) VALUES (?, ?, ?, ?)',
            args: [memberId, date, status, note]
        });
    }
    revalidatePath(`/team/${memberId}`);
}

export async function getMemberFinancials(memberId: number) {
    const { rows: assignments } = await db.execute({
        sql: `SELECT sa.*, s.title as shoot_title, s.shoot_date, s.revenue,
              c.company_name as client_name
              FROM shoot_assignments sa
              JOIN shoots s ON sa.shoot_id = s.id
              JOIN clients c ON s.client_id = c.id
              WHERE sa.member_id = ?
              ORDER BY s.shoot_date DESC`,
        args: [memberId]
    });
    return { assignments: assignments as unknown as any[] };
}

export async function getTeamSchedule() {
    const { rows } = await db.execute(`
        SELECT tm.id, tm.name, tm.role, tm.color,
        COALESCE((SELECT COUNT(*) FROM shoot_assignments sa WHERE sa.member_id = tm.id), 0) as total_shoots
        FROM team_members tm ORDER BY tm.name
    `);
    return rows as unknown as any[];
}
