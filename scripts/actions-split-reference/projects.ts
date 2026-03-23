'use server';

import { db, logActivity } from './utils';
import { revalidatePath } from 'next/cache';
import { Project } from '@/types';

export async function getProjects(clientId: number): Promise<Project[]> {
    const { rows } = await db.execute({
        sql: `SELECT p.*, ag.name as agency_name, ag.color as agency_color,
              (SELECT COUNT(*) FROM shoots s WHERE s.project_id = p.id) as shoot_count,
              (SELECT COUNT(*) FROM project_services ps WHERE ps.project_id = p.id) as service_count,
              (SELECT COALESCE(SUM(rate * quantity), 0) FROM project_services ps WHERE ps.project_id = p.id) as total_value
              FROM projects p JOIN clients c ON p.client_id = c.id
              LEFT JOIN agencies ag ON c.agency_id = ag.id
              WHERE p.client_id = ? ORDER BY p.created_at DESC`,
        args: [clientId]
    });
    return rows as unknown as Project[];
}

export async function createProject(formData: FormData) {
    const clientId = Number(formData.get('clientId'));
    const title = formData.get('title') as string;
    const status = formData.get('status') as string;
    const dueDate = formData.get('dueDate') as string;
    if (!clientId || !title) return;

    await db.execute({
        sql: 'INSERT INTO projects (client_id, title, status, due_date) VALUES (?, ?, ?, ?)',
        args: [clientId, title, status, dueDate]
    });

    try { await logActivity('PROJECT_CREATED', `New project: ${title}`, clientId, 'client'); } catch (e) { console.error('Log error', e); }
    revalidatePath(`/clients/${clientId}`);
}

export async function getProjectById(id: number) {
    const { rows } = await db.execute({
        sql: `SELECT p.*, c.company_name as client_company, ag.name as agency_name, ag.color as agency_color
              FROM projects p JOIN clients c ON p.client_id = c.id LEFT JOIN agencies ag ON c.agency_id = ag.id WHERE p.id = ?`,
        args: [id]
    });
    return rows[0] as unknown as any;
}

export async function getProjectShoots(projectId: number) {
    const { rows } = await db.execute({
        sql: `SELECT s.*, 
              (SELECT COUNT(*) FROM shoot_videos sv WHERE sv.shoot_id = s.id AND sv.completed = 1) as completed_videos_count,
              (SELECT COUNT(*) FROM shoot_videos sv WHERE sv.shoot_id = s.id) as total_videos_count,
              pp.status as post_prod_status, pp.id as post_prod_id
              FROM shoots s LEFT JOIN post_prod_projects pp ON s.id = pp.shoot_id
              WHERE s.project_id = ? ORDER BY s.shoot_date DESC`,
        args: [projectId]
    });
    return rows as unknown as any[];
}

export async function updateProjectStatus(formData: FormData) {
    const id = Number(formData.get('id'));
    const status = formData.get('status') as string;
    await db.execute({ sql: 'UPDATE projects SET status = ? WHERE id = ?', args: [status, id] });
    try { await logActivity('PROJECT_STATUS', `Project status updated to ${status}`, id, 'project'); } catch (e) { console.error('Log error', e); }
    revalidatePath(`/projects/${id}`);
}

export async function updateProjectTitle(formData: FormData) {
    const id = Number(formData.get('id'));
    const title = formData.get('title') as string;
    await db.execute({ sql: 'UPDATE projects SET title = ? WHERE id = ?', args: [title, id] });
    revalidatePath(`/projects/${id}`);
}

export async function updateProjectDetails(formData: FormData) {
    const projectId = Number(formData.get('projectId'));
    if (!projectId) return;

    const rawAgencyId = formData.get('agencyId');
    if (rawAgencyId !== null) {
        const { rows } = await db.execute({ sql: 'SELECT client_id FROM projects WHERE id = ?', args: [projectId] });
        if (rows.length > 0) {
            const clientId = rows[0].client_id;
            let finalAgencyId = null;
            if (rawAgencyId === 'NEW') {
                const newAgencyName = formData.get('newAgencyName') as string;
                const newAgencyColor = formData.get('newAgencyColor') as string;
                if (newAgencyName) {
                    const agencyRes = await db.execute({ sql: 'INSERT INTO agencies (name, color) VALUES (?, ?)', args: [newAgencyName, newAgencyColor || '#8b5cf6'] });
                    finalAgencyId = Number(agencyRes.lastInsertRowid);
                }
            } else {
                const parsed = Number(rawAgencyId);
                finalAgencyId = Number.isFinite(parsed) ? parsed : null;
            }
            await db.execute({ sql: 'UPDATE clients SET agency_id = ? WHERE id = ?', args: [finalAgencyId, clientId] });
        }
    }

    const fields: string[] = [];
    const args: any[] = [];
    if (formData.has('title')) { fields.push('title = ?'); args.push(formData.get('title')); }
    if (formData.has('dueDate')) { const date = formData.get('dueDate') as string; fields.push('due_date = ?'); args.push(date || null); }
    if (fields.length > 0) {
        args.push(projectId);
        await db.execute({ sql: `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, args });
    }
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/');
}

// --- PROJECT COSTS ---
async function recalculateProjectCosts(projectId: number) {
    const { rows } = await db.execute({ sql: 'SELECT COALESCE(SUM(amount), 0) as total FROM project_costs WHERE project_id = ?', args: [projectId] });
    const totalCost = Number(rows[0]?.total || 0);
    const projRes = await db.execute({ sql: 'SELECT total_revenue FROM projects WHERE id = ?', args: [projectId] });
    const totalRevenue = Number(projRes.rows[0]?.total_revenue || 0);
    const totalMargin = totalRevenue - totalCost;
    const marginPercentage = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;
    await db.execute({ sql: 'UPDATE projects SET total_cost = ?, total_margin = ?, margin_percentage = ? WHERE id = ?', args: [totalCost, totalMargin, marginPercentage, projectId] });
}

export async function getProjectCosts(projectId: number) {
    try {
        const { rows } = await db.execute({ sql: 'SELECT * FROM project_costs WHERE project_id = ? ORDER BY created_at ASC', args: [projectId] });
        return rows as unknown as { id: number; project_id: number; label: string; amount: number; created_at: string }[];
    } catch (e) { console.error('getProjectCosts failed:', e); return []; }
}

export async function addProjectCost(formData: FormData) {
    'use server';
    const projectId = Number(formData.get('projectId'));
    const label = formData.get('label') as string;
    const amount = Number(formData.get('amount'));
    if (!projectId || !label) throw new Error('Missing fields');
    await db.execute({ sql: 'INSERT INTO project_costs (project_id, label, amount) VALUES (?, ?, ?)', args: [projectId, label, amount || 0] });
    await recalculateProjectCosts(projectId);
    revalidatePath(`/projects/${projectId}`);
}

export async function updateProjectCost(formData: FormData) {
    'use server';
    const costId = Number(formData.get('costId'));
    const label = formData.get('label') as string;
    const amount = Number(formData.get('amount'));
    if (!costId || !label) throw new Error('Missing fields');
    const { rows } = await db.execute({ sql: 'SELECT project_id FROM project_costs WHERE id = ?', args: [costId] });
    const projectId = Number(rows[0]?.project_id);
    if (!projectId) throw new Error('Cost not found');
    await db.execute({ sql: 'UPDATE project_costs SET label = ?, amount = ? WHERE id = ?', args: [label, amount || 0, costId] });
    await recalculateProjectCosts(projectId);
    revalidatePath(`/projects/${projectId}`);
}

export async function deleteProjectCost(formData: FormData) {
    'use server';
    const costId = Number(formData.get('costId'));
    if (!costId) throw new Error('Missing costId');
    const { rows } = await db.execute({ sql: 'SELECT project_id FROM project_costs WHERE id = ?', args: [costId] });
    const projectId = Number(rows[0]?.project_id);
    if (!projectId) throw new Error('Cost not found');
    await db.execute({ sql: 'DELETE FROM project_costs WHERE id = ?', args: [costId] });
    await recalculateProjectCosts(projectId);
    revalidatePath(`/projects/${projectId}`);
}

export async function getProjectPostProdWorkflows(projectId: number) {
    try {
        const query = `SELECT p.*, s.title as shoot_title, t.name as template_name
            FROM post_prod_projects p JOIN shoots s ON p.shoot_id = s.id
            JOIN post_prod_templates t ON p.template_id = t.id
            WHERE s.project_id = ? ORDER BY p.created_at DESC`;
        const { rows: projects } = await db.execute({ sql: query, args: [projectId] });
        const workflows = await Promise.all(projects.map(async (p: any) => {
            const { rows: tasks } = await db.execute({ sql: 'SELECT count(*) as total, sum(is_completed) as completed FROM post_prod_tasks WHERE project_id = ?', args: [p.id] });
            const stats = tasks[0] as any;
            const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
            return { ...p, progress };
        }));
        return workflows;
    } catch (e) { console.error('getProjectPostProdWorkflows failed:', e); return []; }
}
