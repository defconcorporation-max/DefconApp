'use server';

import { turso as db } from '@/lib/turso';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function getUsers() {
    const { rows } = await db.execute(
        "SELECT id, email, name, role, agency_id, avatar_url, created_at FROM users ORDER BY created_at DESC"
    );
    return rows as any[];
}

export async function createUser(formData: FormData) {
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const role = formData.get('role') as string;
    const password = formData.get('password') as string;

    if (!email || !name || !role || !password) {
        throw new Error('All fields are required');
    }

    // Check for duplicate email
    const existing = await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [email] });
    if (existing.rows.length > 0) {
        throw new Error('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db.execute({
        sql: 'INSERT INTO users (email, name, role, password_hash) VALUES (?, ?, ?, ?)',
        args: [email, name, role, passwordHash]
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
