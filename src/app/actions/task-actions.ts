'use server';

import { turso as db } from '@/lib/turso';
import { revalidatePath } from 'next/cache';

export async function getTasks() {
    try {
        await ensureSubtasksTable();
        
        // Fetch normal tasks with subtask counts
        const { rows: normalRows } = await db.execute(`
            SELECT t.*, 
                (SELECT COUNT(*) FROM task_subtasks WHERE task_id = CAST(t.id AS TEXT)) as subtask_count,
                (SELECT COUNT(*) FROM task_subtasks WHERE task_id = CAST(t.id AS TEXT) AND is_completed = 1) as completed_subtask_count
            FROM tasks t
            ORDER BY t.created_at DESC
        `);
        const manualTasks = normalRows as unknown as any[];

        // Fetch active post-prod projects to merge into Task Board
        const { rows: postProdRows } = await db.execute(`
            SELECT p.id, p.status, p.created_at, s.title as shoot_title,
                (SELECT title FROM post_prod_tasks WHERE project_id = p.id AND is_completed = 0 ORDER BY order_index ASC LIMIT 1) as next_task
            FROM post_prod_projects p
            JOIN shoots s ON p.shoot_id = s.id
            WHERE p.status != 'Completed'
        `);

        const virtualTasks = await Promise.all((postProdRows as unknown as any[]).map(async (p: any) => {
            const virtualId = `pp_${p.id}`;
            const { rows: counts } = await db.execute({
                sql: `SELECT 
                        COUNT(*) as count, 
                        SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed 
                      FROM task_subtasks WHERE task_id = ?`,
                args: [virtualId]
            });
            
            const stats = counts[0] as any;
            let mappedStatus = 'Todo';
            if (p.status === 'In Progress' || p.status === 'In Review') mappedStatus = 'In Progress';
            if (p.status === 'Approved' || p.status === 'Completed') mappedStatus = 'Done';
            
            const currentStage = p.next_task || p.status;

            return {
                id: virtualId,
                title: `[Auto-Sync] ${p.shoot_title}`,
                description: `Étape actuelle : ${currentStage}`,
                raw_status: currentStage, // Use precise stage for linking
                status: mappedStatus,
                created_at: p.created_at,
                is_readonly: true,
                href: `/post-production/${p.id}`,
                subtask_count: Number(stats.count) || 0,
                completed_subtask_count: Number(stats.completed) || 0
            };
        }));

        return [...manualTasks, ...virtualTasks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
        console.error('❌ Error fetching tasks:', error);
        return [];
    }
}

export async function createTask(formData: FormData) {
    try {
        await ensureSubtasksTable();
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const status = formData.get('status') as string || 'Todo';

        if (!title) throw new Error('Title is required');

        console.log('📝 Creating task:', { title, status });
        const res = await db.execute({
            sql: 'INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)',
            args: [title, description || null, status]
        });

        revalidatePath('/tasks');
        revalidatePath('/');
        return Number(res.lastInsertRowid);
    } catch (error: any) {
        console.error('❌ Error creating task:', error);
        throw new Error(`Failed to create task: ${error.message}`);
    }
}

export async function updateTaskStatus(id: number, status: string) {
    try {
        await ensureSubtasksTable();
        if (!id || !status) return;
        await db.execute({
            sql: 'UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            args: [status, id]
        });
        revalidatePath('/tasks');
        revalidatePath('/');
    } catch (error) {
        console.error('❌ Error updating task status:', error);
    }
}

export async function updateTaskDetails(id: number, title: string, description: string) {
    try {
        await ensureSubtasksTable();
        if (!id) return;
        await db.execute({
            sql: 'UPDATE tasks SET title = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            args: [title, description, id]
        });
        revalidatePath('/tasks');
        revalidatePath('/');
    } catch (error) {
        console.error('❌ Error updating task details:', error);
    }
}

export async function deleteTask(id: number) {
    try {
        await ensureSubtasksTable();
        if (!id) return;
        await db.execute({
            sql: 'DELETE FROM tasks WHERE id = ?',
            args: [id]
        });
        revalidatePath('/tasks');
        revalidatePath('/');
    } catch (error) {
        console.error('❌ Error deleting task:', error);
    }
}

// --- SUBTASKS ACTIONS ---

export async function getSubtasks(taskId: string | number) {
    try {
        const { rows } = await db.execute({
            sql: 'SELECT * FROM task_subtasks WHERE task_id = ? ORDER BY created_at ASC',
            args: [taskId.toString()]
        });
        return rows as unknown as any[];
    } catch (error) {
        console.error('❌ Error fetching subtasks:', error);
        return [];
    }
}

export async function createSubtask(taskId: string | number, title: string) {
    try {
        await ensureSubtasksTable();
        const res = await db.execute({
            sql: 'INSERT INTO task_subtasks (task_id, title, is_completed) VALUES (?, ?, 0)',
            args: [taskId.toString(), title]
        });
        revalidatePath('/tasks');
        return Number(res.lastInsertRowid);
    } catch (error) {
        console.error('❌ Error creating subtask:', error);
        return null;
    }
}

export async function toggleSubtask(id: number, is_completed: boolean) {
    try {
        await db.execute({
            sql: 'UPDATE task_subtasks SET is_completed = ? WHERE id = ?',
            args: [is_completed ? 1 : 0, id]
        });
        revalidatePath('/tasks');
    } catch (error) {
        console.error('❌ Error toggling subtask:', error);
    }
}

export async function deleteSubtask(id: number) {
    try {
        await db.execute({
            sql: 'DELETE FROM task_subtasks WHERE id = ?',
            args: [id]
        });
        revalidatePath('/tasks');
    } catch (error) {
        console.error('❌ Error deleting subtask:', error);
    }
}

// --- MIGRATION HELPER ---
async function ensureSubtasksTable() {
    try {
        // Migration: ensure task_subtasks table exists with TEXT task_id
        await db.execute(`
            CREATE TABLE IF NOT EXISTS task_subtasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT NOT NULL,
                title TEXT NOT NULL,
                is_completed INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
        try {
            await db.execute('ALTER TABLE tasks ADD COLUMN order_index INTEGER DEFAULT 0');
        } catch(e) {}
    } catch (error) {
        console.error('⚠️ Migration Error (non-critical):', error);
    }
}
