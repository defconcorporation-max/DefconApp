'use server';

import { turso as db } from '@/lib/turso';
import { revalidatePath } from 'next/cache';
import { PostProdProject, PostProdTask, PostProdTemplate, PostProdVersion } from '@/types';

// --- TEMPLATES ---

export async function getPostProdTemplates(): Promise<PostProdTemplate[]> {
    try {
        const { rows } = await db.execute('SELECT * FROM post_prod_templates');
        return rows.map((r: any) => ({
            ...r,
            tasks: JSON.parse(r.default_tasks || '[]')
        })) as PostProdTemplate[];
    } catch (e) {
        console.error("Failed to fetch post prod templates:", e);
        return [];
    }
}

export async function createPostProdTemplate(name: string, tasks: string[]) {
    await db.execute({
        sql: 'INSERT INTO post_prod_templates (name, default_tasks) VALUES (?, ?)',
        args: [name, JSON.stringify(tasks)]
    });
    revalidatePath('/settings');
}

export async function updatePostProdTemplate(id: number, name: string, tasks: string[]) {
    await db.execute({
        sql: 'UPDATE post_prod_templates SET name = ?, default_tasks = ? WHERE id = ?',
        args: [name, JSON.stringify(tasks), id]
    });
    revalidatePath('/settings');
}

export async function deletePostProdTemplate(id: number) {
    await db.execute({
        sql: 'DELETE FROM post_prod_templates WHERE id = ?',
        args: [id]
    });
    revalidatePath('/settings');
}

// --- WORKFLOW MANAGEMENT ---

export async function startPostProduction(shootId: number, templateId: number) {
    // 1. Get Template Tasks
    const templateRes = await db.execute({
        sql: 'SELECT default_tasks FROM post_prod_templates WHERE id = ?',
        args: [templateId]
    });

    if (templateRes.rows.length === 0) throw new Error('Template not found');
    const tasks = JSON.parse(templateRes.rows[0].default_tasks as string) as string[];

    // 2. Create Project
    const projectRes = await db.execute({
        sql: 'INSERT INTO post_prod_projects (shoot_id, template_id, status) VALUES (?, ?, ?) RETURNING id',
        args: [shootId, templateId, 'In Progress']
    });
    const projectId = Number(projectRes.rows[0].id);

    // 2.5 Update Shoot Status
    await db.execute({
        sql: "UPDATE shoots SET status = 'Completed' WHERE id = ?",
        args: [shootId]
    });

    // 3. Seed Tasks
    // Batch insert manually since LibSQL might not support multi-value INSERT cleanly in all drivers, 
    // but standard SQL does. Let's do a loop for safety or construct a large query.
    for (let i = 0; i < tasks.length; i++) {
        await db.execute({
            sql: 'INSERT INTO post_prod_tasks (project_id, title, is_completed, order_index) VALUES (?, ?, 0, ?)',
            args: [projectId, tasks[i], i]
        });
    }

    revalidatePath(`/shoots/${shootId}`);
    return projectId;
}

export async function getPostProdDashboard() {
    // Check agency role for data isolation
    const { auth } = await import('@/auth');
    const session = await auth();
    const userRole = session?.user?.role;
    const agencyId = session?.user?.agency_id;
    const isAgency = (userRole === 'AgencyAdmin' || userRole === 'AgencyTeam') && agencyId;

    let agencyFilter = '';
    const args: any[] = [];

    if (isAgency) {
        agencyFilter = ' AND s.agency_id = ?';
        args.push(agencyId);
    }

    // Fetch all active projects
    const { rows: projects } = await db.execute({
        sql: `
        SELECT p.*, s.title as shoot_title, t.name as template_name
        FROM post_prod_projects p
        JOIN shoots s ON p.shoot_id = s.id
        JOIN post_prod_templates t ON p.template_id = t.id
        WHERE p.status != 'Completed'${agencyFilter}
        ORDER BY p.created_at DESC
        `,
        args
    });

    // Calculate progress for each
    const dashboardData = await Promise.all(projects.map(async (p: any) => {
        const { rows: tasks } = await db.execute({
            sql: 'SELECT count(*) as total, sum(is_completed) as completed FROM post_prod_tasks WHERE project_id = ?',
            args: [p.id]
        });
        const stats = tasks[0] as any;
        const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

        return { ...p, progress };
    }));

    return dashboardData as PostProdProject[];
}

export async function getPostProdGanttData() {
    // Fetch all active projects with dates
    const { rows: projects } = await db.execute(`
        SELECT 
            p.id, p.status, p.created_at as start_date,
            s.title as shoot_title, s.due_date, s.shoot_date,
            c.name as client_name, c.company_name
        FROM post_prod_projects p
        JOIN shoots s ON p.shoot_id = s.id
        LEFT JOIN clients c ON s.client_id = c.id
        WHERE p.status != 'Completed'
        ORDER BY s.due_date ASC NULLS LAST, p.created_at DESC
    `);

    return projects;
}

export async function getPostProdProject(id: number) {
    // Project Details
    const { rows: projectRows } = await db.execute({
        sql: `
            SELECT p.*, s.title as shoot_title, t.name as template_name, c.company_name as client_name
            FROM post_prod_projects p
            JOIN shoots s ON p.shoot_id = s.id
            JOIN post_prod_templates t ON p.template_id = t.id
            LEFT JOIN clients c ON s.client_id = c.id
            WHERE p.id = ?
        `,
        args: [id]
    });
    if (projectRows.length === 0) return null;
    const project = projectRows[0] as unknown as PostProdProject;

    // Tasks
    const { rows: tasks } = await db.execute({
        sql: 'SELECT * FROM post_prod_tasks WHERE project_id = ? ORDER BY order_index ASC',
        args: [id]
    });

    // Versions
    const { rows: versions } = await db.execute({
        sql: 'SELECT * FROM post_prod_versions WHERE project_id = ? ORDER BY version_number DESC',
        args: [id]
    });

    return { project, tasks: tasks as unknown as PostProdTask[], versions: versions as unknown as PostProdVersion[] };
}

// --- TASK ACTIONS ---

export async function togglePostProdTask(taskId: number, currentState: boolean, projectId: number) {
    const newState = !currentState;
    await db.execute({
        sql: 'UPDATE post_prod_tasks SET is_completed = ? WHERE id = ?',
        args: [newState ? 1 : 0, taskId]
    });
    revalidatePath(`/post-production/${projectId}`);
}

// --- VERSION CONTROL ---

export async function uploadVersion(formData: FormData) {
    const projectId = Number(formData.get('projectId'));
    const url = formData.get('url') as string;
    const notes = formData.get('notes') as string;

    // Get next version number
    const { rows } = await db.execute({
        sql: 'SELECT MAX(version_number) as max_ver FROM post_prod_versions WHERE project_id = ?',
        args: [projectId]
    });
    const nextVer = ((rows[0] as any).max_ver || 0) + 1;

    await db.execute({
        sql: 'INSERT INTO post_prod_versions (project_id, version_number, video_url, notes) VALUES (?, ?, ?, ?)',
        args: [projectId, nextVer, url, notes]
    });

    revalidatePath(`/post-production/${projectId}`);
}

export async function completeProject(projectId: number) {
    await db.execute({
        sql: "UPDATE post_prod_projects SET status = 'Completed' WHERE id = ?",
        args: [projectId]
    });
    revalidatePath('/post-production');
}
