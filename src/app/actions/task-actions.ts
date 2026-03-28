'use server';

import { turso as db } from '@/lib/turso';
import { revalidatePath } from 'next/cache';

export async function getTasks() {
    const { rows } = await db.execute('SELECT * FROM tasks ORDER BY created_at DESC');
    return rows as unknown as any[];
}

export async function createTask(formData: FormData) {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const status = formData.get('status') as string || 'Todo';

    if (!title) throw new Error('Title is required');

    const res = await db.execute({
        sql: 'INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)',
        args: [title, description || null, status]
    });

    revalidatePath('/tasks');
    revalidatePath('/');
    return res.lastInsertRowid;
}

export async function updateTaskStatus(id: number, status: string) {
    if (!id || !status) return;
    await db.execute({
        sql: 'UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        args: [status, id]
    });
    revalidatePath('/tasks');
    revalidatePath('/');
}

export async function deleteTask(id: number) {
    if (!id) return;
    await db.execute({
        sql: 'DELETE FROM tasks WHERE id = ?',
        args: [id]
    });
    revalidatePath('/tasks');
    revalidatePath('/');
}
