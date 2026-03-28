'use server';

import { turso as db } from '@/lib/turso';
import { revalidatePath } from 'next/cache';

export async function getTasks() {
    await ensureSubtasksTable();
    
    // Fetch normal tasks with subtask counts
    const { rows } = await db.execute(`
        SELECT t.*, 
            (SELECT COUNT(*) FROM task_subtasks WHERE task_id = t.id) as subtask_count,
            (SELECT COUNT(*) FROM task_subtasks WHERE task_id = t.id AND is_completed = 1) as completed_subtask_count
        FROM tasks t
        ORDER BY t.created_at DESC
    `);
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
            href: `/post-production/${p.id}`,
            subtask_count: 0,
            completed_subtask_count: 0
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

export async function updateTaskDetails(id: number, title: string, description: string) {
    if (!id) return;
    await db.execute({
        sql: 'UPDATE tasks SET title = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        args: [title, description, id]
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

// --- SUBTASKS ACTIONS ---

export async function getSubtasks(taskId: number) {
    const { rows } = await db.execute({
        sql: 'SELECT * FROM task_subtasks WHERE task_id = ? ORDER BY created_at ASC',
        args: [taskId]
    });
    return rows as unknown as any[];
}

export async function createSubtask(taskId: number, title: string) {
    await db.execute({
        sql: 'INSERT INTO task_subtasks (task_id, title, is_completed) VALUES (?, ?, 0)',
        args: [taskId, title]
    });
    revalidatePath('/tasks');
}

export async function toggleSubtask(id: number, is_completed: boolean) {
    await db.execute({
        sql: 'UPDATE task_subtasks SET is_completed = ? WHERE id = ?',
        args: [is_completed ? 1 : 0, id]
    });
    revalidatePath('/tasks');
}

export async function deleteSubtask(id: number) {
    await db.execute({
        sql: 'DELETE FROM task_subtasks WHERE id = ?',
        args: [id]
    });
    revalidatePath('/tasks');
}

// --- MIGRATION HELPER ---
async function ensureSubtasksTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS task_subtasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            is_completed INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        )
    `);
    
    // Ensure tasks table has description and title if it was using content/is_completed columns before
    try {
        await db.execute('ALTER TABLE tasks ADD COLUMN title TEXT');
    } catch(e) {}
    try {
        await db.execute('ALTER TABLE tasks ADD COLUMN description TEXT');
    } catch(e) {}
    try {
        await db.execute('ALTER TABLE tasks ADD COLUMN status TEXT DEFAULT "Todo"');
    } catch(e) {}
}
