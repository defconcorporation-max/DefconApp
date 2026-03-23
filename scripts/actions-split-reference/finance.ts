'use server';

import { db, getAgencyFilter } from './utils';
import { revalidatePath } from 'next/cache';
import { Commission, Payment, PipelineStage, BetaFeedback } from '@/types';
import { taxAmountsFromSubtotal, taxMultiplierFromRates } from '@/lib/finance/tax';

// --- DASHBOARD STATS ---

export async function getDashboardStats() {
    const agencyId = await getAgencyFilter();
    const today = new Date().toISOString().split('T')[0];

    let projectSql = 'SELECT COUNT(*) as ct FROM projects';
    let shootSql = 'SELECT COUNT(*) as ct FROM shoots';
    let upcomingSql = `SELECT COUNT(*) as ct FROM shoots WHERE shoot_date >= ?`;
    let clientSql = 'SELECT COUNT(*) as ct FROM clients';
    let activeClientSql = "SELECT COUNT(*) as ct FROM clients WHERE status = 'Active'";

    const pArgs: any[] = [];
    const sArgs: any[] = [];
    const uArgs: any[] = [today];
    const cArgs: any[] = [];
    const acArgs: any[] = [];

    if (agencyId) {
        projectSql = 'SELECT COUNT(*) as ct FROM projects p JOIN clients c ON p.client_id = c.id WHERE c.agency_id = ?';
        shootSql = 'SELECT COUNT(*) as ct FROM shoots s JOIN clients c ON s.client_id = c.id WHERE c.agency_id = ?';
        upcomingSql = `SELECT COUNT(*) as ct FROM shoots s JOIN clients c ON s.client_id = c.id WHERE s.shoot_date >= ? AND c.agency_id = ?`;
        clientSql = 'SELECT COUNT(*) as ct FROM clients WHERE agency_id = ?';
        activeClientSql = "SELECT COUNT(*) as ct FROM clients WHERE status = 'Active' AND agency_id = ?";
        pArgs.push(agencyId);
        sArgs.push(agencyId);
        uArgs.push(agencyId);
        cArgs.push(agencyId);
        acArgs.push(agencyId);
    }

    const [pr, sr, ur, cr, acr] = await Promise.all([
        db.execute({ sql: projectSql, args: pArgs }),
        db.execute({ sql: shootSql, args: sArgs }),
        db.execute({ sql: upcomingSql, args: uArgs }),
        db.execute({ sql: clientSql, args: cArgs }),
        db.execute({ sql: activeClientSql, args: acArgs }),
    ]);

    return {
        totalProjects: Number(pr.rows[0].ct || 0),
        totalShoots: Number(sr.rows[0].ct || 0),
        upcomingShoots: Number(ur.rows[0].ct || 0),
        totalClients: Number(cr.rows[0].ct || 0),
        activeClients: Number(acr.rows[0].ct || 0),
    };
}

// --- FINANCE DATA ---

export async function getFinanceData() {
    const agencyId = await getAgencyFilter();
    try {
        let settingsRows;
        try {
            const res = await db.execute('SELECT * FROM settings LIMIT 1');
            settingsRows = res.rows;
        } catch { settingsRows = []; }

        const settings = settingsRows[0] as any;
        const tpsRate = settings?.tps_rate ? Number(settings.tps_rate) : 5;
        const tvqRate = settings?.tvq_rate ? Number(settings.tvq_rate) : 9.975;
        const taxMultiplier = taxMultiplierFromRates(tpsRate, tvqRate);

        let sql = `
            SELECT c.id, c.name, c.company_name, c.status, COUNT(p.id) as project_count,
            COALESCE(SUM(CASE WHEN pay.status = 'paid' THEN pay.amount ELSE 0 END), 0) as total_paid,
            COALESCE(SUM(CASE WHEN pay.status = 'pending' OR pay.status IS NULL THEN pay.amount ELSE 0 END), 0) as total_pending
            FROM clients c LEFT JOIN projects p ON c.id = p.client_id
            LEFT JOIN payments pay ON p.id = pay.project_id
        `;
        const args: any[] = [];
        if (agencyId) { sql += ' WHERE c.agency_id = ?'; args.push(agencyId); }
        sql += ' GROUP BY c.id ORDER BY total_paid DESC';

        const { rows: clients } = await db.execute({ sql, args });

        let revenueWithTax = 0;
        let revenueNoTax = 0;
        let pendingRevenueWithTax = 0;

        for (const c of clients as any[]) {
            revenueWithTax += Number(c.total_paid || 0);
            pendingRevenueWithTax += Number(c.total_pending || 0);
        }
        revenueNoTax = revenueWithTax / taxMultiplier;
        const taxes = taxAmountsFromSubtotal(revenueNoTax, tpsRate, tvqRate);

        // Commissions
        let commSql = 'SELECT COALESCE(SUM(amount), 0) as total FROM commissions';
        const commArgs: any[] = [];
        if (agencyId) { commSql += ' WHERE client_id IN (SELECT id FROM clients WHERE agency_id = ?)'; commArgs.push(agencyId); }
        const { rows: commRes } = await db.execute({ sql: commSql, args: commArgs });
        const commissionsTotal = Number((commRes[0] as any)?.total || 0);

        // Business expenses
        let expSql = 'SELECT COALESCE(SUM(amount), 0) as total FROM expenses';
        const { rows: expRes } = await db.execute(expSql);
        const businessExpenses = Number((expRes[0] as any)?.total || 0);

        return {
            clients: clients as any[],
            stats: {
                revenueWithTax,
                revenueNoTax,
                pendingRevenueWithTax,
                taxesOwed: taxes,
                expenses: commissionsTotal,
                businessExpenses,
                netProfit: revenueNoTax - commissionsTotal - businessExpenses,
            },
        };
    } catch (error) {
        console.error('Finance data fetch failed:', error);
        return { clients: [], stats: null };
    }
}

// --- PAYMENTS ---

export async function addPayment(formData: FormData) {
    const projectId = Number(formData.get('projectId'));
    const amount = Number(formData.get('amount'));
    const date = formData.get('date') as string;
    const note = formData.get('note') as string;
    const status = formData.get('status') as string || 'pending';
    const method = formData.get('method') as string || null;
    if (!projectId || !amount) return;
    await db.execute({ sql: 'INSERT INTO payments (project_id, amount, date, note, status, method) VALUES (?, ?, ?, ?, ?, ?)', args: [projectId, amount, date || new Date().toISOString(), note || '', status, method] });
    revalidatePath(`/projects/${projectId}`);
}

export async function getPayments(projectId: number): Promise<Payment[]> {
    const { rows } = await db.execute({ sql: 'SELECT * FROM payments WHERE project_id = ? ORDER BY date DESC', args: [projectId] });
    return rows as unknown as Payment[];
}

export async function updatePaymentStatus(id: number, status: string, projectId: number) {
    await db.execute({ sql: 'UPDATE payments SET status = ? WHERE id = ?', args: [status, id] });
    revalidatePath(`/projects/${projectId}`);
}

export async function deletePayment(id: number, projectId: number) {
    await db.execute({ sql: 'DELETE FROM payments WHERE id = ?', args: [id] });
    revalidatePath(`/projects/${projectId}`);
}

// --- COMMISSIONS ---

export async function getCommissions(clientId: number): Promise<Commission[]> {
    const { rows } = await db.execute({ sql: 'SELECT * FROM commissions WHERE client_id = ? ORDER BY date DESC', args: [clientId] });
    return rows as unknown as Commission[];
}

export async function getCommissionsByProject(projectId: number): Promise<Commission[]> {
    const { rows } = await db.execute({ sql: 'SELECT * FROM commissions WHERE project_id = ? ORDER BY date DESC', args: [projectId] });
    return rows as unknown as Commission[];
}

export async function addCommission(formData: FormData) {
    const clientId = Number(formData.get('clientId'));
    const projectId = formData.get('projectId') ? Number(formData.get('projectId')) : null;
    const amount = Number(formData.get('amount'));
    const note = formData.get('note') as string;
    const recipientName = formData.get('recipient') as string || 'Agent';
    const date = formData.get('date') as string || new Date().toISOString();
    if (!clientId || !amount) return;
    await db.execute({ sql: 'INSERT INTO commissions (client_id, project_id, amount, note, recipient_name, date) VALUES (?, ?, ?, ?, ?, ?)', args: [clientId, projectId, amount, note || '', recipientName, date] });
    revalidatePath(`/clients/${clientId}`);
}

export async function deleteCommission(id: number, clientId: number) {
    await db.execute({ sql: 'DELETE FROM commissions WHERE id = ?', args: [id] });
    revalidatePath(`/clients/${clientId}`);
}

// --- EXPENSES ---

export async function addExpense(formData: FormData) {
    const description = formData.get('description') as string;
    const amount = Number(formData.get('amount'));
    const category = formData.get('category') as string || 'General';
    const date = formData.get('date') as string || new Date().toISOString().split('T')[0];
    const isRecurring = formData.get('isRecurring') === 'true';
    if (!description || !amount) return;
    await db.execute({
        sql: 'INSERT INTO expenses (description, amount, category, date, is_recurring) VALUES (?, ?, ?, ?, ?)',
        args: [description, amount, category, date, isRecurring ? 1 : 0]
    });
    revalidatePath('/finance');
}

export async function deleteExpense(id: number) {
    await db.execute({ sql: 'DELETE FROM expenses WHERE id = ?', args: [id] });
    revalidatePath('/finance');
}

export async function getExpenses() {
    const { rows } = await db.execute('SELECT * FROM expenses ORDER BY date DESC, created_at DESC');
    return rows as any[];
}

export async function syncProjectToExpenses(projectId: number) {
    try {
        const projRes = await db.execute({ sql: 'SELECT * FROM projects WHERE id = ?', args: [projectId] });
        if (!projRes.rows[0]) throw new Error('Project not found');
        const project = projRes.rows[0] as any;

        const costRes = await db.execute({ sql: 'SELECT * FROM project_costs WHERE project_id = ?', args: [projectId] });
        const commRes = await db.execute({ sql: 'SELECT * FROM commissions WHERE project_id = ?', args: [projectId] });

        for (const cost of costRes.rows) {
            const c = cost as any;
            const existing = await db.execute({
                sql: "SELECT id FROM expenses WHERE description LIKE ? AND amount = ?",
                args: [`[P${projectId}]%${c.label}%`, c.amount]
            });
            if (existing.rows.length === 0) {
                await db.execute({
                    sql: 'INSERT INTO expenses (description, amount, category, date) VALUES (?, ?, ?, ?)',
                    args: [`[P${projectId}] ${project.title} - ${c.label}`, c.amount, 'Project Cost', c.created_at || new Date().toISOString().split('T')[0]]
                });
            }
        }

        for (const comm of commRes.rows) {
            const cm = comm as any;
            const existing = await db.execute({
                sql: "SELECT id FROM expenses WHERE description LIKE ? AND amount = ?",
                args: [`[P${projectId}]%Commission%${cm.recipient_name || ''}%`, cm.amount]
            });
            if (existing.rows.length === 0) {
                await db.execute({
                    sql: 'INSERT INTO expenses (description, amount, category, date) VALUES (?, ?, ?, ?)',
                    args: [`[P${projectId}] ${project.title} - Commission (${cm.recipient_name || 'Agent'})`, cm.amount, 'Commission', cm.date || new Date().toISOString().split('T')[0]]
                });
            }
        }

        revalidatePath('/finance');
        return { success: true };
    } catch (error) {
        console.error('syncProjectToExpenses failed:', error);
        return { success: false, error: 'Sync failed' };
    }
}

// --- PROJECT SERVICES / INVOICING ---

export async function getProjectServices(projectId: number) {
    const { rows } = await db.execute({ sql: 'SELECT * FROM project_services WHERE project_id = ? ORDER BY id ASC', args: [projectId] });
    return rows as unknown as any[];
}

export async function addProjectService(formData: FormData) {
    const projectId = Number(formData.get('projectId'));
    const description = formData.get('description') as string;
    const rate = Number(formData.get('rate'));
    const quantity = Number(formData.get('quantity') || 1);
    if (!projectId || !description) return;
    await db.execute({
        sql: 'INSERT INTO project_services (project_id, description, rate, quantity) VALUES (?, ?, ?, ?)',
        args: [projectId, description, rate, quantity]
    });
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/invoice`);
}

export async function deleteProjectService(serviceId: number, projectId: number) {
    await db.execute({ sql: 'DELETE FROM project_services WHERE id = ?', args: [serviceId] });
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/invoice`);
}

export async function updateProjectService(serviceId: number, data: Partial<{ description: string; rate: number; quantity: number }>, projectId: number) {
    const fields: string[] = [];
    const args: any[] = [];
    if (data.description !== undefined) { fields.push('description = ?'); args.push(data.description); }
    if (data.rate !== undefined) { fields.push('rate = ?'); args.push(data.rate); }
    if (data.quantity !== undefined) { fields.push('quantity = ?'); args.push(data.quantity); }
    if (fields.length === 0) return;
    args.push(serviceId);
    await db.execute({ sql: `UPDATE project_services SET ${fields.join(', ')} WHERE id = ?`, args });
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/invoice`);
}

// --- PIPELINE STAGES ---

export async function getPipelineStages(): Promise<PipelineStage[]> {
    const { rows } = await db.execute('SELECT * FROM pipeline_stages ORDER BY order_index ASC');
    return rows as unknown as PipelineStage[];
}

export async function addPipelineStage(formData: FormData) {
    const name = formData.get('name') as string;
    const color = formData.get('color') as string;
    if (!name) return;
    const maxRes = await db.execute('SELECT MAX(order_index) as mx FROM pipeline_stages');
    const maxOrder = (maxRes.rows[0] as any).mx || 0;
    await db.execute({
        sql: 'INSERT INTO pipeline_stages (name, color, order_index) VALUES (?, ?, ?)',
        args: [name, color || '#a78bfa', maxOrder + 1]
    });
    revalidatePath('/');
    revalidatePath('/settings');
}

export async function deletePipelineStage(id: number) {
    await db.execute({ sql: 'DELETE FROM pipeline_stages WHERE id = ?', args: [id] });
    await db.execute({ sql: 'UPDATE clients SET pipeline_stage_id = NULL WHERE pipeline_stage_id = ?', args: [id] });
    revalidatePath('/');
    revalidatePath('/settings');
}

export async function updateClientPipelineStage(clientId: number, stageId: number | null) {
    await db.execute({ sql: 'UPDATE clients SET pipeline_stage_id = ? WHERE id = ?', args: [stageId, clientId] });
    revalidatePath('/');
}

// --- BETA FEEDBACK ---

async function ensureBetaTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS beta_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            content TEXT NOT NULL,
            status TEXT DEFAULT 'open',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

export async function addBetaFeedback(formData: FormData) {
    await ensureBetaTable();
    const type = formData.get('type') as string || 'bug';
    const content = formData.get('content') as string;
    if (!content) return;
    await db.execute({ sql: 'INSERT INTO beta_feedback (type, content) VALUES (?, ?)', args: [type, content] });
    revalidatePath('/settings');
}

export async function getBetaFeedback(): Promise<BetaFeedback[]> {
    await ensureBetaTable();
    const { rows } = await db.execute("SELECT * FROM beta_feedback ORDER BY CASE status WHEN 'open' THEN 0 ELSE 1 END, created_at DESC");
    return rows as unknown as BetaFeedback[];
}

export async function resolveBetaFeedback(id: number) {
    await db.execute({ sql: 'UPDATE beta_feedback SET status = ? WHERE id = ?', args: ['resolved', id] });
    revalidatePath('/settings');
}

export async function deleteBetaFeedback(formData: FormData) {
    const id = Number(formData.get('id'));
    if (!id) return;
    await db.execute({ sql: 'DELETE FROM beta_feedback WHERE id = ?', args: [id] });
    revalidatePath('/settings');
}

// --- SETTINGS ---

export async function getSettings() {
    try {
        const { rows } = await db.execute('SELECT * FROM settings LIMIT 1');
        return rows[0] as any;
    } catch (e) { return null; }
}

export async function updateSettings(formData: FormData) {
    const companyName = formData.get('companyName') as string;
    const tpsRate = Number(formData.get('tpsRate')) || 5;
    const tvqRate = Number(formData.get('tvqRate')) || 9.975;
    await db.execute({
        sql: 'UPDATE settings SET company_name = ?, tps_rate = ?, tvq_rate = ? WHERE id = 1',
        args: [companyName, tpsRate, tvqRate]
    });
    revalidatePath('/settings');
    revalidatePath('/');
}
