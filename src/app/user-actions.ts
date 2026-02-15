'use server';

import { turso as db } from '@/lib/turso';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

import { auth } from '@/auth';

export async function getUsers() {
    const session = await auth();
    const userRole = session?.user?.role;
    const agencyId = session?.user?.agency_id;

    let sql = `SELECT u.id, u.email, u.name, u.role, u.agency_id, u.avatar_url, u.created_at, a.name as agency_name 
         FROM users u 
         LEFT JOIN agencies a ON u.agency_id = a.id`;

    const args: any[] = [];

    if ((userRole === 'AgencyAdmin' || userRole === 'AgencyTeam') && agencyId) {
        sql += ' WHERE u.agency_id = ?';
        args.push(agencyId);
    }

    sql += ' ORDER BY u.created_at DESC';

    const { rows } = await db.execute({ sql, args });
    return rows as any[];
}

export async function getAgencies() {
    const { rows } = await db.execute("SELECT id, name FROM agencies ORDER BY name ASC");
    return rows as any[];
}

export async function createUser(formData: FormData) {
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const role = formData.get('role') as string;
    const password = formData.get('password') as string;
    const agencyId = formData.get('agencyId') ? parseInt(formData.get('agencyId') as string) : null;

    if (!email || !name || !role || !password) {
        throw new Error('All fields are required');
    }

    if ((role === 'AgencyAdmin' || role === 'AgencyTeam') && !agencyId) {
        throw new Error('Agency is required for Agency roles');
    }

    // Check for duplicate email
    const existing = await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [email] });
    if (existing.rows.length > 0) {
        throw new Error('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db.execute({
        sql: 'INSERT INTO users (email, name, role, password_hash, agency_id) VALUES (?, ?, ?, ?, ?)',
        args: [email, name, role, passwordHash, agencyId]
    });

    revalidatePath('/users');
}

export async function updateUserRole(formData: FormData) {
    const userId = parseInt(formData.get('userId') as string);
    const role = formData.get('role') as string;

    await db.execute({
        sql: 'UPDATE users SET role = ? WHERE id = ?',
        args: [role, userId]
    });

    revalidatePath('/users');
}

export async function updateUserAgency(formData: FormData) {
    const userId = parseInt(formData.get('userId') as string);
    const agencyIdRaw = formData.get('agencyId');
    const agencyId = agencyIdRaw ? parseInt(agencyIdRaw as string) : null;

    await db.execute({
        sql: 'UPDATE users SET agency_id = ? WHERE id = ?',
        args: [agencyId, userId]
    });

    revalidatePath('/users');
}

export async function deleteUser(formData: FormData) {
    const userId = parseInt(formData.get('userId') as string);

    // Prevent deleting yourself (id=1 is primary admin)
    if (userId === 1) {
        throw new Error('Cannot delete the primary admin account');
    }

    await db.execute({
        sql: 'DELETE FROM users WHERE id = ?',
        args: [userId]
    });

    revalidatePath('/users');
}

export async function resetUserPassword(formData: FormData) {
    const userId = parseInt(formData.get('userId') as string);
    const newPassword = formData.get('newPassword') as string;

    if (!newPassword || newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db.execute({
        sql: 'UPDATE users SET password_hash = ? WHERE id = ?',
        args: [passwordHash, userId]
    });

    revalidatePath('/users');
}
