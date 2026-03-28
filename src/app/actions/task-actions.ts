'use server';

import { turso as db } from '@/lib/turso';
import { revalidatePath } from 'next/cache';

export async function getTasks() {
    const { rows } = await db.execute('SELECT * FROM tasks ORDER BY created_at DESC');
    const normalTasks = rows as unknown as any[];

    // Fetch active post-prod projects to merge into Task Board
    const { rows: postProdRows } = await db.execute(`
        SELECT p.id, p.status, p.created_at, s.title as shoot_title
        FROM post_prod_projects p
        JOIN shoots s ON p.shoot_id = s.id
        WHERE p.status != 'Completed'
    `);

    const postProdTasks = postProdRows.map((p: any) => {
        let mappedStatus = 'Todo';
        if (p.status === 'In Progress' || p.status === 'In Review') mappedStatus = 'In Progress';
        if (p.status === 'Approved' || p.status === 'Completed') mappedStatus = 'Done';
        
        return {
            id: `pp_${p.id}`,
            title: `[Post-Prod] ${p.shoot_title}`,
            description: `Étape actuelle : ${p.status}`,
            status: mappedStatus,
            created_at: p.created_at,
            is_readonly: true,
            href: `/post-production/${p.id}`
        };
    });

    return [...normalTasks, ...postProdTasks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
