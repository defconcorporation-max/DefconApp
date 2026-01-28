'use server';

import { turso as db } from '@/lib/turso';
import { revalidatePath } from 'next/cache';
import { ShootAssignment, TeamMember } from '@/types';

// --- ASSIGNMENT ACTIONS ---

export async function assignMemberToShoot(formData: FormData) {
    const shootId = Number(formData.get('shootId'));
    const memberId = Number(formData.get('memberId'));
    // Optional role override
    const role = formData.get('role') as string;

    try {
        await db.execute({
            sql: 'INSERT INTO shoot_assignments (shoot_id, team_member_id, role) VALUES (?, ?, ?)',
            args: [shootId, memberId, role || null]
        });
        revalidatePath(`/shoots/${shootId}`);
        revalidatePath('/team'); // Update calendar
    } catch (e: any) {
        if (e.message.includes('UNIQUE constraint failed')) {
            // Already assigned, ignore or notify
            console.log('Member already assigned');
        } else {
            throw e;
        }
    }
}

export async function removeAssignment(formData: FormData) {
    const assignmentId = Number(formData.get('assignmentId'));
    const shootId = Number(formData.get('shootId')); // For revalidation

    await db.execute({
        sql: 'DELETE FROM shoot_assignments WHERE id = ?',
        args: [assignmentId]
    });

    if (shootId) revalidatePath(`/shoots/${shootId}`);
    revalidatePath('/team');
}

// --- DATA FETCHING ---

export async function getShootAssignments(shootId: number) {
    const { rows } = await db.execute({
        sql: `
            SELECT sa.*, tm.name as member_name, tm.color as member_avatar_color, tm.role as default_role
            FROM shoot_assignments sa
            JOIN team_members tm ON sa.team_member_id = tm.id
            WHERE sa.shoot_id = ?
        `,
        args: [shootId]
    });

    return rows.map((r: any) => ({
        ...r,
        role: r.role || r.default_role // Use override or default
    })) as ShootAssignment[];
}

export async function getTeamSchedule() {
    // Fetch all future assignments for the calendar
    // In a real app we'd filter by date range (month/year)
    const { rows } = await db.execute(`
        SELECT sa.*, s.title as shoot_title, s.shoot_date, tm.name as member_name, tm.color as member_avatar_color
        FROM shoot_assignments sa
        JOIN shoots s ON sa.shoot_id = s.id
        JOIN team_members tm ON sa.team_member_id = tm.id
        WHERE s.shoot_date >= date('now', '-1 month')
        ORDER BY s.shoot_date ASC
    `);

    return rows as unknown as ShootAssignment[];
}
