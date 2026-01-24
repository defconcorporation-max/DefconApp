'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { Client, Shoot, ShootVideo, ShootVideoNote, PipelineStage, Task, SocialLink, ContentIdea, Project, Commission, TeamMember } from '@/types';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

export async function getClients(): Promise<Client[]> {
    return db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all() as Client[];
}

export async function createClient(formData: FormData) {
    const name = formData.get('name') as string;
    const company = formData.get('company') as string;
    const plan = formData.get('plan') as string;

    // Create Folder
    const safeName = (company || name).replace(/[^a-z0-9]/gi, '_').trim();
    const folderName = `${safeName}`;
    const folderPath = path.join(process.cwd(), 'Clients', folderName);

    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    db.prepare('INSERT INTO clients (name, company_name, plan, folder_path) VALUES (?, ?, ?, ?)')
        .run(name, company, plan, folderPath);

    revalidatePath('/');
}

export async function openClientFolder(folderPath: string) {
    if (!folderPath) return;
    // Open in Explorer
    exec(`start "" "${folderPath}"`);
}

export async function getClient(id: number): Promise<Client | undefined> {
    return db.prepare('SELECT * FROM clients WHERE id = ?').get(id) as Client | undefined;
}

export async function updateClient(formData: FormData) {
    const id = Number(formData.get('id'));
    const name = formData.get('name') as string;
    const company = formData.get('company') as string;
    const plan = formData.get('plan') as string;

    db.prepare('UPDATE clients SET name = ?, company_name = ?, plan = ? WHERE id = ?')
        .run(name, company, plan, id);

    revalidatePath(`/clients/${id}`);
    revalidatePath('/');
}

export async function deleteClient(formData: FormData) {
    const id = Number(formData.get('id'));

    // Optional: Check or clean up relations (Shoots, Projects) or rely on foreign keys
    // For now, simple delete. SQLite foreign keys might prevent if ON DELETE RESTRICT
    // Assuming cascade or manual cleanup not strictly required for MVP unless error.

    db.prepare('DELETE FROM clients WHERE id = ?').run(id);
    revalidatePath('/');
}

export async function getSocials(clientId: number): Promise<SocialLink[]> {
    return db.prepare('SELECT * FROM social_links WHERE client_id = ?').all(clientId) as SocialLink[];
}

export async function addSocial(formData: FormData) {
    const clientId = formData.get('clientId');
    const platform = formData.get('platform') as string;
    const url = formData.get('url') as string;

    db.prepare('INSERT INTO social_links (client_id, platform, url) VALUES (?, ?, ?)')
        .run(clientId, platform, url);

    revalidatePath(`/clients/${clientId}`);
}

export async function deleteSocial(formData: FormData) {
    const id = formData.get('id');
    const clientId = formData.get('clientId');
    db.prepare('DELETE FROM social_links WHERE id = ?').run(id);
    revalidatePath(`/clients/${clientId}`);
}

export async function getIdeas(clientId: number): Promise<ContentIdea[]> {
    return db.prepare('SELECT * FROM content_ideas WHERE client_id = ? ORDER BY created_at DESC').all(clientId) as ContentIdea[];
}

export async function addIdea(formData: FormData) {
    const clientId = formData.get('clientId');
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    db.prepare('INSERT INTO content_ideas (client_id, title, description) VALUES (?, ?, ?)')
        .run(clientId, title, description);

    revalidatePath(`/clients/${clientId}`);
}

export async function updateIdeaStatus(id: number, status: string, clientId: number) {
    db.prepare('UPDATE content_ideas SET status = ? WHERE id = ?').run(status, id);
    revalidatePath(`/clients/${clientId}`);
}



export async function getCommissions(ownerId: number, type: 'client' | 'project' = 'client'): Promise<Commission[]> {
    if (type === 'project') {
        return db.prepare('SELECT * FROM commissions WHERE project_id = ?').all(ownerId) as Commission[];
    }
    return db.prepare('SELECT * FROM commissions WHERE client_id = ? AND project_id IS NULL').all(ownerId) as Commission[];
}

export async function addCommission(formData: FormData) {
    const clientId = Number(formData.get('clientId'));
    const projectId = formData.get('projectId') ? Number(formData.get('projectId')) : null;
    const role = formData.get('role') as string;
    const person = formData.get('person') as string;
    const rateType = formData.get('rateType') as string;
    const rateValue = parseFloat(formData.get('rateValue') as string);

    // If projectId is present, we still store clientId for reference, or maybe we don't strictly need it if we join via projects, but safer to keep.
    // Actually, let's just insert what we have.

    db.prepare('INSERT INTO commissions (client_id, project_id, role_name, person_name, rate_type, rate_value) VALUES (?, ?, ?, ?, ?, ?)')
        .run(clientId, projectId, role, person, rateType, rateValue);

    if (projectId) {
        revalidatePath(`/projects/${projectId}`);
    } else {
        revalidatePath(`/clients/${clientId}`);
    }
}

export async function deleteCommission(formData: FormData) {
    const id = formData.get('id');
    const clientId = formData.get('clientId'); // Needed for path revalidation
    const projectId = formData.get('projectId');

    db.prepare('DELETE FROM commissions WHERE id = ?').run(id);


    if (projectId) {
        revalidatePath(`/projects/${projectId}`);
    } else {
        revalidatePath(`/clients/${clientId}`);
    }
}

export async function getAllCommissions() {
    // Join with Projects/Clients to get context
    return db.prepare(`
        SELECT c.*, p.title as project_title, cl.company_name as client_name 
        FROM commissions c
        LEFT JOIN projects p ON c.project_id = p.id
        LEFT JOIN clients cl ON c.client_id = cl.id
        ORDER BY c.status DESC, c.id DESC
    `).all() as (Commission & { project_title: string, client_name: string })[];
}

export async function payCommission(id: number) {
    const date = new Date().toISOString().split('T')[0];
    db.prepare("UPDATE commissions SET status = 'Paid', paid_date = ? WHERE id = ?").run(date, id);
    revalidatePath('/finance');
}

export async function revertCommissionPayment(id: number) {
    db.prepare("UPDATE commissions SET status = 'Pending', paid_date = NULL WHERE id = ?").run(id);
    revalidatePath('/finance');
}




export async function getShoots(clientId: number): Promise<Shoot[]> {
    return db.prepare('SELECT * FROM shoots WHERE client_id = ? ORDER BY shoot_date ASC').all(clientId) as Shoot[];
}

export interface ShootWithClient extends Shoot {
    client_name: string;
    client_company?: string;
    project_title?: string;
}

export async function getAllShoots(): Promise<ShootWithClient[]> {
    return db.prepare(`
        SELECT shoots.*, clients.name as client_name, clients.company_name as client_company, projects.title as project_title
        FROM shoots 
        JOIN clients ON shoots.client_id = clients.id 
        LEFT JOIN projects ON shoots.project_id = projects.id
        ORDER BY shoot_date ASC
    `).all() as ShootWithClient[];
}

export async function addShoot(formData: FormData) {
    const clientId = formData.get('clientId');
    const title = formData.get('title') as string;
    const date = formData.get('date') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const color = formData.get('color') as string || 'indigo';
    const projectId = formData.get('projectId') ? Number(formData.get('projectId')) : null;

    db.prepare('INSERT INTO shoots (client_id, project_id, title, shoot_date, start_time, end_time, color) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(clientId, projectId, title, date, startTime, endTime, color);

    revalidatePath(`/clients/${clientId}`);
    if (projectId) {
        revalidatePath(`/projects/${projectId}`);
    }
    revalidatePath('/'); // Revalidate dashboard
}

export async function updateShoot(formData: FormData) {
    const id = formData.get('id');
    const clientId = formData.get('clientId');
    const title = formData.get('title') as string;
    const date = formData.get('date') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const color = formData.get('color') as string || 'indigo';
    const projectId = formData.get('projectId') ? Number(formData.get('projectId')) : null;

    db.prepare('UPDATE shoots SET client_id = ?, project_id = ?, title = ?, shoot_date = ?, start_time = ?, end_time = ?, color = ? WHERE id = ?')
        .run(clientId, projectId, title, date, startTime, endTime, color, id);

    revalidatePath(`/clients/${clientId}`);
    revalidatePath('/'); // Revalidate dashboard
    revalidatePath(`/shoots/${id}`); // Revalidate self
    if (projectId) revalidatePath(`/projects/${projectId}`);
}

export async function deleteShoot(formData: FormData) {
    const id = formData.get('id');
    const clientId = formData.get('clientId'); // Needed for path revalidation if we were on that page, but broadly useful

    db.prepare('DELETE FROM shoots WHERE id = ?').run(id);
    revalidatePath('/');
}

export async function getShootById(id: number): Promise<ShootWithClient | undefined> {
    return db.prepare(`
        SELECT shoots.*, clients.name as client_name, clients.company_name as client_company, projects.title as project_title
        FROM shoots 
        LEFT JOIN clients ON shoots.client_id = clients.id 
        LEFT JOIN projects ON shoots.project_id = projects.id
        WHERE shoots.id = ?
    `).get(id) as ShootWithClient | undefined;
}

export async function getShootVideos(shootId: number): Promise<ShootVideo[]> {
    return db.prepare('SELECT * FROM shoot_videos WHERE shoot_id = ?').all(shootId) as ShootVideo[];
}



export async function getShootVideoNotes(shootId: number): Promise<ShootVideoNote[]> {
    // Join not strictly needed if we don't filter by shoot, but we need to know which videos belong to this shoot
    // Actually, easier to select notes where video_id in (select id from shoot_videos where shoot_id = ?)
    return db.prepare(`
        SELECT * FROM shoot_video_notes 
        WHERE video_id IN (SELECT id FROM shoot_videos WHERE shoot_id = ?)
        ORDER BY created_at ASC
    `).all(shootId) as ShootVideoNote[];
}

export async function addShootVideoNote(formData: FormData) {
    const videoId = formData.get('videoId');
    const content = formData.get('content');
    const shootId = formData.get('shootId'); // For revalidation
    const clientId = formData.get('clientId');

    db.prepare('INSERT INTO shoot_video_notes (video_id, content) VALUES (?, ?)').run(videoId, content);

    if (clientId) revalidatePath(`/clients/${clientId}`);
    if (shootId) revalidatePath(`/shoots/${shootId}`);
}

export async function deleteShootVideoNote(formData: FormData) {
    const id = formData.get('id');
    const shootId = formData.get('shootId');
    db.prepare('DELETE FROM shoot_video_notes WHERE id = ?').run(id);
    if (shootId) revalidatePath(`/shoots/${shootId}`);
}

export async function addShootVideo(formData: FormData) {
    const shootId = formData.get('shootId');
    const clientId = formData.get('clientId');
    const title = formData.get('title') as string;

    db.prepare('INSERT INTO shoot_videos (shoot_id, title) VALUES (?, ?)')
        .run(shootId, title);

    revalidatePath(`/clients/${clientId}`);
    revalidatePath(`/shoots/${shootId}`);
}

export async function toggleShootVideo(id: number, currentStatus: number, clientId: number, shootId?: number) {
    const newStatus = currentStatus === 1 ? 0 : 1;
    db.prepare('UPDATE shoot_videos SET completed = ? WHERE id = ?').run(newStatus, id);
    revalidatePath(`/clients/${clientId}`);
    if (shootId) revalidatePath(`/shoots/${shootId}`);
}

export async function updateShootVideoNotes(id: number, notes: string, clientId: number, shootId?: number) {
    db.prepare('UPDATE shoot_videos SET notes = ? WHERE id = ?').run(notes, id);
    revalidatePath(`/clients/${clientId}`);
    if (shootId) revalidatePath(`/shoots/${shootId}`);
}

export async function deleteShootVideo(formData: FormData) {
    const id = formData.get('id');
    const shootId = formData.get('shootId'); // Ensure we pass this from UI
    db.prepare('DELETE FROM shoot_videos WHERE id = ?').run(id);
    revalidatePath('/');
    if (shootId) revalidatePath(`/shoots/${shootId}`);
}

export async function updateClientStatus(clientId: number, newStatus: string) {
    db.prepare('UPDATE clients SET status = ? WHERE id = ?').run(newStatus, clientId);
    revalidatePath('/');
}

export async function getPayments(clientId: number) {
    return db.prepare('SELECT * FROM payments WHERE client_id = ? ORDER BY date DESC').all(clientId);
}



export async function getCredentials(clientId: number) {
    return db.prepare('SELECT * FROM credentials WHERE client_id = ?').all(clientId);
}

export async function addCredential(formData: FormData) {
    const clientId = formData.get('clientId');
    const service = formData.get('service');
    const username = formData.get('username');
    const password = formData.get('password');

    db.prepare('INSERT INTO credentials (client_id, service_name, username, password) VALUES (?, ?, ?, ?)')
        .run(clientId, service, username, password);
    revalidatePath(`/clients/${clientId}`);
}

export async function addPayment(formData: FormData) {
    const clientId = Number(formData.get('clientId'));
    const amount = formData.get('amount');
    const status = 'Paid';
    const date = formData.get('date') || new Date().toISOString().split('T')[0];
    const description = formData.get('description');
    const projectId = Number(formData.get('projectId'));

    db.prepare('INSERT INTO payments (client_id, amount, status, date, description, project_id) VALUES (?, ?, ?, ?, ?, ?)')
        .run(clientId, amount, status, date, description, projectId);

    revalidatePath('/finance');
    revalidatePath(`/clients/${clientId}`);
    // Revalidate project page too? No, finance is main.
}

export async function getDashboardStats() {
    // Fetch tax rates to calculate consistent values if needed
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as { tax_tps_rate: number, tax_tvq_rate: number };
    const taxMultiplier = 1 + ((settings?.tax_tps_rate || 5) + (settings?.tax_tvq_rate || 9.975)) / 100;

    // 1. Total Revenue = Total CASH Collected (from Payments)
    // This aligns with Finance Page "Collected Revenue"
    const totalCollectedRevenue = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM payments
    `).get() as { total: number };

    // 2. Total Booked Value (Gross, Tax Inc) of ALL active/completed projects
    // Used to calculate what is left to be paid (Pending Income)
    const totalProjectValue = db.prepare(`
        SELECT COALESCE(SUM(ps.rate * ps.quantity), 0) as total
        FROM project_services ps
        JOIN projects p ON ps.project_id = p.id
        WHERE p.status != 'Archived'
    `).get() as { total: number };

    // Calculate Project Value including tax to compare with payments (which include tax)
    const totalProjectValueIncTax = (totalProjectValue?.total || 0) * taxMultiplier;

    // 3. Pending Income = Total Booking Value - Total Collected
    // This represents all outstanding invoices/work
    const pendingRevenue = Math.max(0, totalProjectValueIncTax - totalCollectedRevenue.total);

    const activeClients = db.prepare("SELECT COUNT(*) as count FROM clients WHERE status = 'Active'").get() as { count: number };
    const totalClients = db.prepare("SELECT COUNT(*) as count FROM clients").get() as { count: number };
    const upcomingShoots = db.prepare("SELECT COUNT(*) as count FROM shoots WHERE shoot_date >= date('now')").get() as { count: number };

    return {
        totalRevenue: totalCollectedRevenue.total, // Now showing accurate Cash Collected
        pendingRevenue: pendingRevenue,            // Now showing accurate Outstanding Balance
        activeClients: activeClients?.count || 0,
        totalClients: totalClients?.count || 0,
        upcomingShoots: upcomingShoots?.count || 0
    };
}

export async function getFinanceData() {
    // Fetch tax rates
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as { tax_tps_rate: number, tax_tvq_rate: number };
    const taxMultiplier = 1 + ((settings?.tax_tps_rate || 5) + (settings?.tax_tvq_rate || 9.975)) / 100;

    // 1. Global Stats - CASH BASIS REVENUE (Total Collected)
    const totalCollectedRevenue = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM payments
    `).get() as { total: number };

    // 2. Global Stats - TOTAL PROJECT VALUE (Gross)
    // Used to calculate Pending Income (Receivables)
    const totalProjectValue = db.prepare(`
        SELECT COALESCE(SUM(ps.rate * ps.quantity), 0) as total
        FROM project_services ps
        JOIN projects p ON ps.project_id = p.id
        WHERE p.status != 'Archived' 
    `).get() as { total: number };
    // Not filtering by status 'Completed' because we want total value of all active work too.

    // 3. Client Performance (Gross Revenue - based on Project Value for ranking?)
    // But existing query uses project value. I'll leave Client Performance as "Booked Revenue" for now unless asked.
    const clientsWithRevenue = db.prepare(`
        SELECT c.id, c.name, c.company_name, c.status,
        (SELECT COUNT(*) FROM projects p WHERE p.client_id = c.id) as project_count,
        (SELECT COALESCE(SUM(ps.rate * ps.quantity), 0) * ?
         FROM project_services ps 
         JOIN projects p ON ps.project_id = p.id 
         WHERE p.client_id = c.id) as total_revenue
        FROM clients c
        ORDER BY total_revenue DESC
    `).all(taxMultiplier);

    // 4. Project List (Completed/Active with Value & Payments)
    const projectsRaw = db.prepare(`
        SELECT p.*, c.company_name as client_company,
        (SELECT COALESCE(SUM(rate * quantity), 0) FROM project_services ps WHERE ps.project_id = p.id) as total_value_pre_tax,
        (SELECT COALESCE(SUM(amount), 0) FROM payments pay WHERE pay.project_id = p.id) as paid_amount
        FROM projects p
        JOIN clients c ON p.client_id = c.id
        ORDER BY p.created_at DESC
    `).all() as any[];

    const projectsWithValue = projectsRaw.map(p => ({
        ...p,
        total_value: p.total_value_pre_tax * taxMultiplier
    }));

    // 5. Commission Expenses (Paid)
    const paidCommissions = db.prepare("SELECT * FROM commissions WHERE status = 'Paid'").all() as Commission[];

    let totalCommissionsPaid = 0;
    for (const comm of paidCommissions) {
        if (comm.rate_type === 'Fixed') {
            totalCommissionsPaid += comm.rate_value;
        } else {
            if (comm.project_id) {
                const projectTotal = db.prepare("SELECT SUM(rate * quantity) as total FROM project_services WHERE project_id = ?").get(comm.project_id) as { total: number };
                totalCommissionsPaid += (projectTotal?.total || 0) * (comm.rate_value / 100);
            }
        }
    }

    // 6. Business Expenses (Deductibles)
    const expenses = db.prepare('SELECT * FROM expenses').all() as any[];
    const totalExpensesPreTax = expenses.reduce((acc, curr) => acc + curr.amount_pre_tax, 0);
    const totalExpenseTps = expenses.reduce((acc, curr) => acc + curr.tps_amount, 0);
    const totalExpenseTvq = expenses.reduce((acc, curr) => acc + curr.tvq_amount, 0);


    // Revenue calculations
    const revenueWithTax = totalCollectedRevenue.total; // This IS what we collected in bank
    const revenuePreTax = revenueWithTax / taxMultiplier;

    // Pending Income = Total Booked Value (Inc Tax) - Total Collected
    const globalProjectValuePreTax = totalProjectValue.total || 0;
    const globalProjectValueIncTax = globalProjectValuePreTax * taxMultiplier;

    // If we collected more than total value (e.g. overpayment/deposits?), clamp to 0? No, let it show.
    const pendingRevenueIncTax = Math.max(0, globalProjectValueIncTax - revenueWithTax);


    // Tax Est. (Based on Collected Revenue)
    const tpsCollected = revenuePreTax * (settings.tax_tps_rate / 100);
    const tvqCollected = revenuePreTax * (settings.tax_tvq_rate / 100);

    // Net Taxes Owed (Collected - Paid on Expenses)
    const tpsOwed = Math.max(0, tpsCollected - totalExpenseTps);
    const tvqOwed = Math.max(0, tvqCollected - totalExpenseTvq);

    // Net Profit = (Collected Revenue Pre Tax) - (Commissions Paid) - (Expenses Pre Tax)
    const netProfit = revenuePreTax - totalCommissionsPaid - totalExpensesPreTax;

    return {
        stats: {
            totalRevenue: revenuePreTax, // Display uses this as base
            revenueWithTax: revenueWithTax,
            pendingRevenueWithTax: pendingRevenueIncTax,
            taxes: {
                tps: tpsCollected,
                tvq: tvqCollected
            },
            taxesOwed: {
                tps: tpsOwed,
                tvq: tvqOwed
            },
            expenses: totalCommissionsPaid, // Team Payouts
            businessExpenses: totalExpensesPreTax, // Deductible Expenses
            netProfit: netProfit
        },
        clients: clientsWithRevenue,
        projects: projectsWithValue,
        settings,
        expensesList: expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    };
}

// Pipeline Stages

export async function getPipelineStages(): Promise<PipelineStage[]> {
    return db.prepare('SELECT * FROM pipeline_stages ORDER BY order_index ASC').all() as PipelineStage[];
}

export async function savePipelineStage(stage: Partial<PipelineStage>) {
    // If ID is a large number (timestamp), it's a new stage from client -> INSERT
    const isNew = !stage.id || stage.id > 1000000000000;

    if (!isNew && stage.id) {
        db.prepare('UPDATE pipeline_stages SET label = ?, value = ?, color = ? WHERE id = ?')
            .run(stage.label, stage.value, stage.color, stage.id);
    } else {
        const result = db.prepare('SELECT MAX(order_index) as maxOrder FROM pipeline_stages').get() as { maxOrder: number };
        const nextOrder = (result?.maxOrder ?? -1) + 1;
        db.prepare('INSERT INTO pipeline_stages (label, value, color, order_index) VALUES (?, ?, ?, ?)')
            .run(stage.label, stage.value, stage.color, nextOrder);
    }
    revalidatePath('/');
}

export async function reorderPipelineStages(stages: PipelineStage[]) {
    const update = db.prepare('UPDATE pipeline_stages SET order_index = ? WHERE id = ?');
    const transaction = db.transaction((stages: PipelineStage[]) => {
        for (let i = 0; i < stages.length; i++) {
            update.run(i, stages[i].id);
        }
    });
    transaction(stages);
    revalidatePath('/');
}

export async function deletePipelineStage(id: number) {
    // Optional: Check if clients exist in this stage and block or move them?
    // For now, let's just delete the stage. Clients with this status will be orphan or fallback to Lead.
    db.prepare('DELETE FROM pipeline_stages WHERE id = ?').run(id);
    revalidatePath('/');
}

// --- TASKS ACTIONS ---

export async function getTasks(): Promise<Task[]> {
    return db.prepare('SELECT * FROM tasks ORDER BY is_completed ASC, created_at DESC').all() as Task[];
}

export async function addTask(formData: FormData) {
    const content = formData.get('content') as string;
    if (!content) return;

    db.prepare('INSERT INTO tasks (content) VALUES (?)').run(content);
    revalidatePath('/');
}

export type DashboardTask = {
    id: number;
    title: string;
    is_completed: boolean;
    type: 'Personal' | 'Project';
    project_id?: number | null;
    project_title?: string;
    description?: string; // for compatibility with Task component if needed
    due_date?: string;
    assignee_name?: string;
};

export async function getAllDashboardTasks(): Promise<DashboardTask[]> {
    // 1. Personal Tasks
    const personalTasks = db.prepare(`
        SELECT id, content as title, is_completed, 'Personal' as type, NULL as project_id, NULL as project_title, NULL as due_date, NULL as assignee_name
        FROM tasks
    `).all() as any[];

    // 2. Project Tasks
    const projectTasks = db.prepare(`
        SELECT 
            pt.id, 
            pt.title, 
            pt.is_completed, 
            'Project' as type, 
            pt.project_id, 
            p.title as project_title, 
            pt.due_date,
            tm.name as assignee_name
        FROM project_tasks pt
        JOIN projects p ON pt.project_id = p.id
        LEFT JOIN team_members tm ON pt.assigned_to = tm.id
        WHERE p.status != 'Archived'
    `).all() as any[];

    const allTasks = [...personalTasks, ...projectTasks];

    // Sort: Pending first, then by Due Date (if exists) or ID
    return allTasks.sort((a, b) => {
        if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
        // If both pending
        return b.id - a.id; // Newest first
    });
}

export async function toggleTask(id: number, isCompleted: boolean) {
    db.prepare('UPDATE tasks SET is_completed = ? WHERE id = ?')
        .run(isCompleted ? 1 : 0, id);
    revalidatePath('/');
}

export async function deleteTask(id: number) {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    revalidatePath('/');
}

// --- PROJECTS ACTIONS ---
export async function getProjects(clientId: number): Promise<Project[]> {
    return db.prepare(`
        SELECT p.*, 
        (SELECT COUNT(*) FROM shoots s WHERE s.project_id = p.id) as shoot_count,
        (SELECT COUNT(*) FROM project_services ps WHERE ps.project_id = p.id) as service_count,
        (SELECT COALESCE(SUM(rate * quantity), 0) FROM project_services ps WHERE ps.project_id = p.id) as total_value
        FROM projects p 
        WHERE client_id = ? 
        ORDER BY created_at DESC
    `).all(clientId) as Project[];
}

export async function createProject(formData: FormData) {
    const clientId = Number(formData.get('clientId'));
    const title = formData.get('title') as string;
    const status = 'Active';
    db.prepare('INSERT INTO projects (client_id, title, status) VALUES (?, ?, ?)').run(clientId, title, status);
    revalidatePath(`/clients/${clientId}`);
}

export async function updateProject(formData: FormData) {
    const id = Number(formData.get('id'));
    const title = formData.get('title') as string;

    db.prepare('UPDATE projects SET title = ? WHERE id = ?').run(title, id);

    // We need to fetch the project to know the clientId for revalidation, or we can just revalidate specific paths
    const project = db.prepare('SELECT client_id FROM projects WHERE id = ?').get(id) as { client_id: number };

    revalidatePath(`/projects/${id}`);
    if (project) {
        revalidatePath(`/clients/${project.client_id}`);
    }
}

export async function getProjectById(id: number) {
    return db.prepare('SELECT p.*, c.company_name as client_company FROM projects p JOIN clients c ON p.client_id = c.id WHERE p.id = ?').get(id);
}

export async function getProjectShoots(projectId: number) {
    return db.prepare(`
        SELECT s.*, 
        (SELECT COUNT(*) FROM shoot_videos sv WHERE sv.shoot_id = s.id AND sv.completed = 1) as completed_videos_count,
        (SELECT COUNT(*) FROM shoot_videos sv WHERE sv.shoot_id = s.id) as total_videos_count,
        pp.status as post_prod_status
        FROM shoots s 
        LEFT JOIN post_production pp ON s.id = pp.shoot_id
        WHERE s.project_id = ? 
        ORDER BY s.shoot_date DESC
    `).all(projectId);
}

export async function getProjectServices(projectId: number) {
    return db.prepare('SELECT * FROM project_services WHERE project_id = ?').all(projectId);
}

export async function addProjectService(formData: FormData) {
    const projectId = Number(formData.get('projectId'));
    const name = formData.get('name') as string;
    const rate = Number(formData.get('rate'));
    const quantity = Number(formData.get('quantity')) || 1;
    // serviceId is optional, if selected from catalog
    const serviceId = formData.get('serviceId') ? Number(formData.get('serviceId')) : null;

    db.prepare('INSERT INTO project_services (project_id, service_id, name, rate, quantity) VALUES (?, ?, ?, ?, ?)').run(projectId, serviceId, name, rate, quantity);
    revalidatePath(`/projects/${projectId}`);
}

export async function deleteProjectService(formData: FormData) {
    const id = Number(formData.get('id'));
    const projectId = Number(formData.get('projectId'));
    db.prepare('DELETE FROM project_services WHERE id = ?').run(id);
    revalidatePath(`/projects/${projectId}`);
}

export async function updateProjectStatus(formData: FormData) {
    const id = Number(formData.get('id'));
    const status = formData.get('status') as string;
    db.prepare('UPDATE projects SET status = ? WHERE id = ?').run(status, id);
    revalidatePath(`/projects/${id}`);
}


// --- SERVICES CATALOG ACTIONS ---
export async function getServices() {
    return db.prepare('SELECT * FROM services ORDER BY name ASC').all();
}

export async function createService(formData: FormData) {
    const name = formData.get('name') as string;
    const rate = Number(formData.get('rate'));
    const type = formData.get('type') as string;
    db.prepare('INSERT INTO services (name, default_rate, rate_type) VALUES (?, ?, ?)').run(name, rate, type);
    revalidatePath('/services');
}

export async function deleteService(id: number) {
    db.prepare('DELETE FROM services WHERE id = ?').run(id);
    revalidatePath('/services');
}

// --- POST-PRODUCTION ACTIONS ---
export async function finishShoot(shootId: number) {
    console.log('--- finishShoot called ---');
    console.log('Shoot ID:', shootId);
    try {
        const tx = db.transaction(() => {
            console.log('Running transaction...');
            const updateResult = db.prepare('UPDATE shoots SET status = ? WHERE id = ?').run('Completed', shootId);
            console.log('Update Result:', updateResult);
            const insertResult = db.prepare('INSERT INTO post_production (shoot_id, status) VALUES (?, ?)').run(shootId, 'Derush');
            console.log('Insert Result:', insertResult);
        });
        tx();
        console.log('Transaction completed successfully');
        revalidatePath(`/shoots/${shootId}`);
        revalidatePath('/post-production');
    } catch (error) {
        console.error('Error in finishShoot:', error);
        throw error;
    }
}

export async function revertShoot(shootId: number) {
    console.log('--- revertShoot called ---');
    console.log('Shoot ID:', shootId);
    try {
        const tx = db.transaction(() => {
            console.log('Running transaction...');
            // Set status back to NULL (which defaults to 'Scheduled' in UI)
            const updateResult = db.prepare('UPDATE shoots SET status = NULL WHERE id = ?').run(shootId);
            console.log('Update Result:', updateResult);
            // Remove from post-production
            const deleteResult = db.prepare('DELETE FROM post_production WHERE shoot_id = ?').run(shootId);
            console.log('Delete Result:', deleteResult);
        });
        tx();
        console.log('Transaction completed successfully');
        revalidatePath(`/shoots/${shootId}`);
        revalidatePath('/post-production');
    } catch (error) {
        console.error('Error in revertShoot:', error);
        throw error;
    }
}

export async function getPostProdItems() {
    return db.prepare(`
        SELECT pp.*, s.title as shoot_title, c.company_name as client_name 
        FROM post_production pp
        JOIN shoots s ON pp.shoot_id = s.id
        JOIN clients c ON s.client_id = c.id
        ORDER BY pp.updated_at DESC
    `).all();
}

export async function updatePostProdStatus(id: number, status: string) {
    db.prepare('UPDATE post_production SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
    revalidatePath('/');
}

export async function getSettings() {
    return db.prepare('SELECT * FROM settings WHERE id = 1').get() as { id: number, tax_tps_rate: number, tax_tvq_rate: number };
}

export async function updateSettings(formData: FormData) {
    const tps = parseFloat(formData.get('tax_tps_rate') as string);
    const tvq = parseFloat(formData.get('tax_tvq_rate') as string);
    db.prepare('UPDATE settings SET tax_tps_rate = ?, tax_tvq_rate = ? WHERE id = 1').run(tps, tvq);
    revalidatePath('/settings');
    revalidatePath('/projects');
    revalidatePath('/');
}

// --- TEAM MANAGEMENT ACTIONS ---

export async function getTeamMembers(): Promise<TeamMember[]> {
    return db.prepare('SELECT * FROM team_members ORDER BY name ASC').all() as TeamMember[];
}

export async function addTeamMember(formData: FormData) {
    const name = formData.get('name') as string;
    const role = formData.get('role') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const hourlyRate = Number(formData.get('hourly_rate')) || 0;
    const color = formData.get('color') as string || 'indigo';

    db.prepare('INSERT INTO team_members (name, role, email, phone, hourly_rate, color) VALUES (?, ?, ?, ?, ?, ?)')
        .run(name, role, email, phone, hourlyRate, color);
    revalidatePath('/team');
}

export async function updateTeamMember(formData: FormData) {
    const id = Number(formData.get('id'));
    const name = formData.get('name') as string;
    const role = formData.get('role') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const hourlyRate = Number(formData.get('hourly_rate')) || 0;
    const color = formData.get('color') as string;

    db.prepare('UPDATE team_members SET name = ?, role = ?, email = ?, phone = ?, hourly_rate = ?, color = ? WHERE id = ?')
        .run(name, role, email, phone, hourlyRate, color, id);
    revalidatePath('/team');
    revalidatePath(`/team/${id}`);
}

export async function getTeamMember(id: number) {
    return db.prepare('SELECT * FROM team_members WHERE id = ?').get(id);
}

export async function getMemberAvailability(memberId: number) {
    return db.prepare('SELECT * FROM team_availability WHERE member_id = ?').all(memberId);
}

export async function setMemberAvailability(memberId: number, date: string, status: string, note: string = '') {
    const existing = db.prepare('SELECT id FROM team_availability WHERE member_id = ? AND date = ?').get(memberId, date) as { id: number };

    if (existing) {
        db.prepare('UPDATE team_availability SET status = ?, note = ? WHERE id = ?').run(status, note, existing.id);
    } else {
        db.prepare('INSERT INTO team_availability (member_id, date, status, note) VALUES (?, ?, ?, ?)').run(memberId, date, status, note);
    }
    revalidatePath(`/team/${memberId}`);
}

export async function getMemberFinancials(memberId: number) {
    const member = db.prepare('SELECT name FROM team_members WHERE id = ?').get(memberId) as { name: string };
    if (!member) return [];

    return db.prepare(`
        SELECT c.*, p.title as project_title, cl.company_name as client_name
        FROM commissions c
        LEFT JOIN projects p ON c.project_id = p.id
        LEFT JOIN clients cl ON c.client_id = cl.id
        WHERE LOWER(c.person_name) = LOWER(?)
    `).all(member.name);
}

// --- GLOBAL SEARCH ACTION ---

export type SearchResult = {
    id: string;
    type: 'Page' | 'Client' | 'Project' | 'Shoot';
    label: string;
    subLabel?: string;
    url: string;
};

export async function getGlobalSearchData(): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    // 1. Static Pages
    const pages: SearchResult[] = [
        { id: 'page-dashboard', type: 'Page', label: 'Dashboard', url: '/' },
        { id: 'page-finance', type: 'Page', label: 'Finance', url: '/finance' },
        { id: 'page-team', type: 'Page', label: 'Team', url: '/team' },
        { id: 'page-settings', type: 'Page', label: 'Settings', url: '/settings' },
        { id: 'page-services', type: 'Page', label: 'Services Catalog', url: '/services' },
        { id: 'page-post', type: 'Page', label: 'Post-Production', url: '/post-production' },
    ];
    results.push(...pages);

    // 2. Clients
    const clients = db.prepare("SELECT id, name, company_name FROM clients ORDER BY created_at DESC LIMIT 50").all() as any[];
    clients.forEach(c => {
        results.push({
            id: `client-${c.id}`,
            type: 'Client',
            label: c.company_name || c.name,
            subLabel: c.company_name ? c.name : undefined,
            url: `/clients/${c.id}`
        });
    });

    // 3. Projects
    const projects = db.prepare("SELECT id, title, status FROM projects ORDER BY created_at DESC LIMIT 50").all() as any[];
    projects.forEach(p => {
        results.push({
            id: `project-${p.id}`,
            type: 'Project',
            label: p.title,
            subLabel: p.status,
            url: `/projects/${p.id}`
        });
    });

    // 4. Shoots
    const shoots = db.prepare(`
        SELECT s.id, s.title, s.shoot_date, c.company_name 
        FROM shoots s
        LEFT JOIN clients c ON s.client_id = c.id
        ORDER BY s.shoot_date DESC LIMIT 50
    `).all() as any[];

    shoots.forEach(s => {
        results.push({
            id: `shoot-${s.id}`,
            type: 'Shoot',
            label: s.title,
            subLabel: `${s.shoot_date} • ${s.company_name || 'No Client'}`,
            url: `/shoots/${s.id}`
        });
    });

    return results;
}

// --- PROJECT TASKS ---

export async function getProjectTasks(projectId: number): Promise<any[]> {
    return db.prepare(`
        SELECT 
            pt.*, 
            ts.name as stage_name, 
            ts.color as stage_color,
            tm.name as assignee_name
        FROM project_tasks pt
        LEFT JOIN task_stages ts ON pt.stage_id = ts.id
        LEFT JOIN team_members tm ON pt.assigned_to = tm.id
        WHERE pt.project_id = ? 
        ORDER BY 
            CASE WHEN pt.is_completed = 1 THEN 1 ELSE 0 END ASC, -- Completed last
            ts.position ASC, -- Sort by stage order
            pt.due_date ASC, 
            pt.created_at DESC
    `).all(projectId);
}

export async function getTaskStages(): Promise<any[]> {
    return db.prepare('SELECT * FROM task_stages ORDER BY position ASC, id ASC').all();
}

export async function addProjectTask(formData: FormData) {
    const projectId = Number(formData.get('projectId'));
    const title = formData.get('title') as string;
    const dueDateRaw = formData.get('dueDate') as string;
    const dueDate = dueDateRaw ? dueDateRaw : null;
    const assigneeId = formData.get('assigneeId') ? Number(formData.get('assigneeId')) : null;

    if (!projectId || !title) return;

    // Get default stage
    const defaultStage = db.prepare('SELECT id FROM task_stages WHERE is_default = 1').get() as { id: number };
    const stageId = defaultStage?.id || 1;

    db.prepare('INSERT INTO project_tasks (project_id, title, due_date, stage_id, assigned_to) VALUES (?, ?, ?, ?, ?)').run(projectId, title, dueDate, stageId, assigneeId);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/');
}

export async function toggleProjectTask(id: number, projectId: number) {
    // Logic: If completed, move to default. If not, move to Done.
    const task = db.prepare('SELECT is_completed FROM project_tasks WHERE id = ?').get(id) as { is_completed: number };

    let targetStageId;
    if (task.is_completed) {
        // Move to To Do
        const def = db.prepare('SELECT id FROM task_stages WHERE is_default = 1').get() as { id: number };
        targetStageId = def?.id || 1;
    } else {
        // Move to Done
        // We assume the last stage or one named 'Done' is the target.
        const done = db.prepare("SELECT id FROM task_stages WHERE name = 'Done'").get() as { id: number };
        targetStageId = done?.id || 4; // fallback
    }

    await updateTaskStage(id, targetStageId, projectId);
}

export async function updateTaskStage(taskId: number, stageId: number, projectId: number) {
    // Check if stage is "Done" type (simple logic: last stage or name 'Done')
    // We update is_completed based on stage for compatibility
    const stage = db.prepare('SELECT name FROM task_stages WHERE id = ?').get(stageId) as { name: string };
    const isCompleted = stage.name === 'Done' ? 1 : 0; // Simplified logic, can be refined

    db.prepare('UPDATE project_tasks SET stage_id = ?, is_completed = ? WHERE id = ?').run(stageId, isCompleted, taskId);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/');
}

export async function updateTaskAssignee(taskId: number, assigneeId: number | null, projectId: number) {
    db.prepare('UPDATE project_tasks SET assigned_to = ? WHERE id = ?').run(assigneeId, taskId);
    revalidatePath(`/projects/${projectId}`);
}

export async function deleteProjectTask(taskId: number, projectId: number) {
    db.prepare('DELETE FROM project_tasks WHERE id = ?').run(taskId);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/');
}

export async function addTaskStage(formData: FormData) {
    const name = formData.get('name') as string;
    const color = formData.get('color') as string;

    if (!name) return;

    // Get max position
    const max = db.prepare('SELECT MAX(position) as m FROM task_stages').get() as { m: number };
    const position = (max.m || 0) + 1;

    db.prepare('INSERT INTO task_stages (name, color, position) VALUES (?, ?, ?)').run(name, color, position);
    revalidatePath('/settings');
    revalidatePath('/');
}

export async function deleteTaskStage(id: number) {
    const stage = db.prepare('SELECT is_default FROM task_stages WHERE id = ?').get(id) as { is_default: number };
    if (stage.is_default) return;

    // Reassign tasks to default 'To Do'
    const defaultStage = db.prepare('SELECT id FROM task_stages WHERE is_default = 1').get() as { id: number };
    if (defaultStage) {
        db.prepare('UPDATE project_tasks SET stage_id = ? WHERE stage_id = ?').run(defaultStage.id, id);
    }

    db.prepare('DELETE FROM task_stages WHERE id = ?').run(id);
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
    db.prepare(`UPDATE project_tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/');
}

// --- EXPENSES ACTIONS ---

export async function addExpense(formData: FormData) {
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const category = formData.get('category') as string;
    const amountPreTax = parseFloat(formData.get('amountPreTax') as string);
    const tpsAmount = parseFloat(formData.get('tpsAmount') as string) || 0;
    const tvqAmount = parseFloat(formData.get('tvqAmount') as string) || 0;
    const totalAmount = amountPreTax + tpsAmount + tvqAmount;

    if (!description || !date || isNaN(amountPreTax)) return;

    db.prepare(`
        INSERT INTO expenses (description, date, category, amount_pre_tax, tps_amount, tvq_amount, total_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(description, date, category, amountPreTax, tpsAmount, tvqAmount, totalAmount);

    revalidatePath('/finance');
}

export async function deleteExpense(id: number) {
    db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
    revalidatePath('/finance');
}

export async function getExpenses() {
    return db.prepare('SELECT * FROM expenses ORDER BY date DESC').all();
}
