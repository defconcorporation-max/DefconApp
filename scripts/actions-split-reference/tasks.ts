'use server';

import { db, getAgencyFilter } from './utils';
import { revalidatePath } from 'next/cache';
import { Task } from '@/types';

export type DashboardTask = {
    id: number;
    title: string;
    is_completed: boolean;
    type: 'Personal' | 'Project';
    project_id?: number | null;
    project_title?: string;
    description?: string;
    due_date?: string;
    assignee_name?: string;
};

// --- SIMPLE TASKS ---

export async function getTasks(): Promise<Task[]> {
    const { rows } = await db.execute('SELECT * FROM tasks ORDER BY is_completed ASC, created_at DESC');
    return rows as unknown as Task[];
}

export async function addTask(formData: FormData) {
    const content = formData.get('content') as string;
    if (!content) return;
    await db.execute({ sql: 'INSERT INTO tasks (content) VALUES (?)', args: [content] });
    revalidatePath('/');
}

export async function toggleTask(id: number, isCompleted: boolean) {
    await db.execute({ sql: 'UPDATE tasks SET is_completed = ? WHERE id = ?', args: [isCompleted ? 1 : 0, id] });
    revalidatePath('/');
}

export async function deleteTask(id: number) {
    await db.execute({ sql: 'DELETE FROM tasks WHERE id = ?', args: [id] });
    revalidatePath('/');
}

export async function getAllDashboardTasks(): Promise<DashboardTask[]> {
    const agencyId = await getAgencyFilter();
    const personalTasksRes = await db.execute(`
        SELECT id, content as title, is_completed, 'Personal' as type, NULL as project_id, NULL as project_title, NULL as due_date, NULL as assignee_name FROM tasks
    `);
    const personalTasks = personalTasksRes.rows as any[];

    let projectSql = `
        SELECT pt.id, pt.title, pt.is_completed, 'Project' as type, pt.project_id, p.title as project_title, pt.due_date, tm.name as assignee_name
        FROM project_tasks pt JOIN projects p ON pt.project_id = p.id
        LEFT JOIN team_members tm ON pt.assigned_to = tm.id
        JOIN clients c ON p.client_id = c.id
        WHERE p.status != 'Archived'
    `;
    const projectArgs: any[] = [];
    if (agencyId) { projectSql += ' AND c.agency_id = ?'; projectArgs.push(agencyId); }
    const projectTasksRes = await db.execute({ sql: projectSql, args: projectArgs });
    const projectTasks = projectTasksRes.rows as any[];
    const allTasks = [...personalTasks, ...projectTasks];
    return allTasks.sort((a, b) => {
        if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
        return b.id - a.id;
    });
}

// --- PROJECT TASKS ---

export async function getProjectTasks(projectId: number): Promise<any[]> {
    const { rows } = await db.execute({
        sql: `SELECT pt.*, ts.name as stage_name, ts.color as stage_color, tm.name as assignee_name
              FROM project_tasks pt LEFT JOIN task_stages ts ON pt.stage_id = ts.id
              LEFT JOIN team_members tm ON pt.assigned_to = tm.id
              WHERE pt.project_id = ?
              ORDER BY CASE WHEN pt.is_completed = 1 THEN 1 ELSE 0 END ASC, ts.position ASC, pt.due_date ASC, pt.created_at DESC`,
        args: [projectId]
    });
    return rows as unknown as any[];
}

export async function getTaskStages(): Promise<any[]> {
    try {
        const { rows } = await db.execute('SELECT * FROM task_stages ORDER BY position ASC, id ASC');
        return rows as unknown as any[];
    } catch (e) { console.error("Failed to fetch task stages:", e); return []; }
}

export async function addProjectTask(formData: FormData) {
    const projectId = Number(formData.get('projectId'));
    const title = formData.get('title') as string;
    const dueDateRaw = formData.get('dueDate') as string;
    const dueDate = dueDateRaw ? dueDateRaw : null;
    const assigneeId = formData.get('assigneeId') ? Number(formData.get('assigneeId')) : null;
    if (!projectId || !title) return;
    const defaultStageRes = await db.execute('SELECT id FROM task_stages WHERE is_default = 1');
    const defaultStage = defaultStageRes.rows[0] as unknown as { id: number };
    const stageId = defaultStage?.id || 1;
    await db.execute({ sql: 'INSERT INTO project_tasks (project_id, title, due_date, stage_id, assigned_to) VALUES (?, ?, ?, ?, ?)', args: [projectId, title, dueDate, stageId, assigneeId] });
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/');
}

export async function toggleProjectTask(id: number, projectId: number) {
    const taskRes = await db.execute({ sql: 'SELECT is_completed FROM project_tasks WHERE id = ?', args: [id] });
    const task = taskRes.rows[0] as unknown as { is_completed: number };
    let targetStageId;
    if (task.is_completed) {
        const defRes = await db.execute('SELECT id FROM task_stages WHERE is_default = 1');
        const def = defRes.rows[0] as unknown as { id: number };
        targetStageId = def?.id || 1;
    } else {
        const doneRes = await db.execute("SELECT id FROM task_stages WHERE name = 'Done'");
        const done = doneRes.rows[0] as unknown as { id: number };
        targetStageId = done?.id || 4;
    }
    await updateTaskStage(id, targetStageId, projectId);
}

export async function updateTaskStage(taskId: number, stageId: number, projectId: number) {
    const stageRes = await db.execute({ sql: 'SELECT name FROM task_stages WHERE id = ?', args: [stageId] });
    const stage = stageRes.rows[0] as unknown as { name: string };
    const isCompleted = stage.name === 'Done' ? 1 : 0;
    await db.execute({ sql: 'UPDATE project_tasks SET stage_id = ?, is_completed = ? WHERE id = ?', args: [stageId, isCompleted, taskId] });
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/');
}

export async function updateTaskAssignee(taskId: number, assigneeId: number | null, projectId: number) {
    await db.execute({ sql: 'UPDATE project_tasks SET assigned_to = ? WHERE id = ?', args: [assigneeId, taskId] });
    revalidatePath(`/projects/${projectId}`);
}

export async function deleteProjectTask(taskId: number, projectId: number) {
    await db.execute({ sql: 'DELETE FROM project_tasks WHERE id = ?', args: [taskId] });
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/');
}

export async function addTaskStage(formData: FormData) {
    const name = formData.get('name') as string;
    const color = formData.get('color') as string;
    if (!name) return;
    const maxRes = await db.execute('SELECT MAX(position) as m FROM task_stages');
    const max = maxRes.rows[0] as unknown as { m: number };
    const position = (max.m || 0) + 1;
    await db.execute({ sql: 'INSERT INTO task_stages (name, color, position) VALUES (?, ?, ?)', args: [name, color, position] });
    revalidatePath('/settings');
    revalidatePath('/');
}

export async function deleteTaskStage(id: number) {
    const stageRes = await db.execute({ sql: 'SELECT is_default FROM task_stages WHERE id = ?', args: [id] });
    const stage = stageRes.rows[0] as unknown as { is_default: number };
    if (stage.is_default) return;
    const defaultStageRes = await db.execute('SELECT id FROM task_stages WHERE is_default = 1');
    const defaultStage = defaultStageRes.rows[0] as unknown as { id: number };
    if (defaultStage) {
        await db.execute({ sql: 'UPDATE project_tasks SET stage_id = ? WHERE stage_id = ?', args: [defaultStage.id, id] });
    }
    await db.execute({ sql: 'DELETE FROM task_stages WHERE id = ?', args: [id] });
    revalidatePath('/settings');
    revalidatePath('/');
}

export async function updateProjectTask(id: number, data: Partial<{ title: string; description: string; due_date: string; stage_id: number; assigned_to: number; }>, projectId: number) {
    const fields = [];
    const values = [];
    if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.due_date !== undefined) { fields.push('due_date = ?'); values.push(data.due_date); }
    if (data.stage_id !== undefined) { fields.push('stage_id = ?'); values.push(data.stage_id); }
    if (data.assigned_to !== undefined) { fields.push('assigned_to = ?'); values.push(data.assigned_to); }
    if (fields.length === 0) return;
    values.push(id);
    await db.execute({ sql: `UPDATE project_tasks SET ${fields.join(', ')} WHERE id = ?`, args: values });
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/');
}
