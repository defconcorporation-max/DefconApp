'use server';

import { turso as db } from '@/lib/turso';
import { revalidatePath } from 'next/cache';
import { Client, Shoot, ShootVideo, ShootVideoNote, PipelineStage, Task, SocialLink, ContentIdea, Project, Commission, TeamMember, Payment, Credential, ShootWithClient, BetaFeedback, ShootAssignment } from '@/types';

export async function getClients(): Promise<Client[]> {
    const { rows } = await db.execute('SELECT * FROM clients ORDER BY created_at DESC');
    return rows as unknown as Client[];
}

export async function createClient(formData: FormData) {
    const name = formData.get('name') as string;
    const company = formData.get('company') as string;
    const plan = formData.get('plan') as string;

    // Create Folder (Local Dev Only - skip on Vercel)
    const safeName = (company || name).replace(/[^a-z0-9]/gi, '_').trim();
    const folderName = `${safeName}`;
    let folderPath = '';

    // Folder creation removed for Vercel compatibility
    // Use cloud storage or manual folder management in production

    await db.execute({
        sql: 'INSERT INTO clients (name, company_name, plan, folder_path) VALUES (?, ?, ?, ?)',
        args: [name, company, plan, folderPath]
    });

    revalidatePath('/');
}

// --- SCHEMA MIGRATION HELPERS (Lazy Run) ---
async function ensureProjectFeatures() {
    // 1. Project Labels Table
    await db.execute(`
        CREATE TABLE IF NOT EXISTS project_labels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            color TEXT NOT NULL
        )
    `);

    // 2. Add columns to projects if not exist (SQLite doesn't support IF NOT EXISTS for columns easily, so we try/catch)
    try {
        await db.execute('ALTER TABLE projects ADD COLUMN due_date TEXT');
    } catch (e) { }
    try {
        await db.execute('ALTER TABLE projects ADD COLUMN label_id INTEGER');
    } catch (e) { }

    // 3. Add column to shoots
    try {
        await db.execute('ALTER TABLE shoots ADD COLUMN due_date TEXT');
    } catch (e) { }

    // 4. Shoot Assignments Table
    await db.execute(`
        CREATE TABLE IF NOT EXISTS shoot_assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shoot_id INTEGER NOT NULL,
            team_member_id INTEGER NOT NULL,
            role TEXT,
            assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shoot_id) REFERENCES shoots(id) ON DELETE CASCADE,
            FOREIGN KEY (team_member_id) REFERENCES team_members(id) ON DELETE CASCADE
        )
    `);

    // 5. Ensure Team Member Columns (color, hourly_rate)
    try {
        await db.execute('ALTER TABLE team_members ADD COLUMN color TEXT');
    } catch (e) { }
    try {
        await db.execute('ALTER TABLE team_members ADD COLUMN hourly_rate REAL');
    } catch (e) { }
}



export async function openClientFolder(folderPath: string) {
    if (!folderPath) return;
    // Open in Explorer (Server Side? This only works if running locally)
    // Cloud: process.cwd() is server. exec opens on server.
    // For local dev this works. For Vercel this does nothing/errors.
    // Keeping as is for local support.
    // Folder opening removed for Vercel compatibility
}

export async function getClient(id: number): Promise<Client | undefined> {
    const { rows } = await db.execute({
        sql: 'SELECT * FROM clients WHERE id = ?',
        args: [id]
    });
    return (rows[0] as unknown as Client) || undefined;
}



export async function deleteClient(formData: FormData) {
    const id = Number(formData.get('id'));
    await db.execute({
        sql: 'DELETE FROM clients WHERE id = ?',
        args: [id]
    });
    revalidatePath('/');
}

export async function getSocials(clientId: number): Promise<SocialLink[]> {
    const { rows } = await db.execute({
        sql: 'SELECT * FROM social_links WHERE client_id = ?',
        args: [clientId]
    });
    return rows as unknown as SocialLink[];
}

export async function addSocial(formData: FormData) {
    const clientId = Number(formData.get('clientId'));
    const platform = formData.get('platform') as string;
    const url = formData.get('url') as string;

    await db.execute({
        sql: 'INSERT INTO social_links (client_id, platform, url) VALUES (?, ?, ?)',
        args: [clientId, platform, url]
    });

    revalidatePath(`/clients/${clientId}`);
}

export async function deleteSocial(formData: FormData) {
    const id = Number(formData.get('id'));
    const clientId = Number(formData.get('clientId'));
    await db.execute({
        sql: 'DELETE FROM social_links WHERE id = ?',
        args: [id]
    });
    revalidatePath(`/clients/${clientId}`);
}

export async function getIdeas(clientId: number): Promise<ContentIdea[]> {
    const { rows } = await db.execute({
        sql: 'SELECT * FROM content_ideas WHERE client_id = ? ORDER BY created_at DESC',
        args: [clientId]
    });
    return rows as unknown as ContentIdea[];
}

export async function addIdea(formData: FormData) {
    const clientId = Number(formData.get('clientId'));
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    await db.execute({
        sql: 'INSERT INTO content_ideas (client_id, title, description) VALUES (?, ?, ?)',
        args: [clientId, title, description]
    });

    revalidatePath(`/clients/${clientId}`);
}

export async function updateIdeaStatus(id: number, status: string, clientId: number) {
    await db.execute({
        sql: 'UPDATE content_ideas SET status = ? WHERE id = ?',
        args: [status, id]
    });
    revalidatePath(`/clients/${clientId}`);
}

export async function getCommissions(ownerId: number, type: 'client' | 'project' = 'client'): Promise<Commission[]> {
    if (type === 'project') {
        const { rows } = await db.execute({
            sql: 'SELECT * FROM commissions WHERE project_id = ?',
            args: [ownerId]
        });
        return rows as unknown as Commission[];
    }
    const { rows } = await db.execute({
        sql: 'SELECT * FROM commissions WHERE client_id = ? AND project_id IS NULL',
        args: [ownerId]
    });
    return rows as unknown as Commission[];
}

export async function addCommission(formData: FormData) {
    const clientId = Number(formData.get('clientId'));
    const projectId = formData.get('projectId') ? Number(formData.get('projectId')) : null;
    const role = formData.get('role') as string;
    const person = formData.get('person') as string;
    const rateType = formData.get('rateType') as string;
    const rateValue = parseFloat(formData.get('rateValue') as string);

    await db.execute({
        sql: 'INSERT INTO commissions (client_id, project_id, role_name, person_name, rate_type, rate_value) VALUES (?, ?, ?, ?, ?, ?)',
        args: [clientId, projectId, role, person, rateType, rateValue]
    });

    if (projectId) {
        revalidatePath(`/projects/${projectId}`);
    } else {
        revalidatePath(`/clients/${clientId}`);
    }
}

export async function deleteCommission(formData: FormData) {
    const id = Number(formData.get('id'));
    const clientId = Number(formData.get('clientId'));
    const projectId = formData.get('projectId') ? Number(formData.get('projectId')) : null;

    await db.execute({
        sql: 'DELETE FROM commissions WHERE id = ?',
        args: [id]
    });

    if (projectId) {
        revalidatePath(`/projects/${projectId}`);
    } else {
        revalidatePath(`/clients/${clientId}`);
    }
}

export async function getAllCommissions() {
    const { rows } = await db.execute(`
        SELECT c.*, p.title as project_title, cl.company_name as client_name 
        FROM commissions c
        LEFT JOIN projects p ON c.project_id = p.id
        LEFT JOIN clients cl ON c.client_id = cl.id
        ORDER BY c.status DESC, c.id DESC
    `);
    return rows as unknown as (Commission & { project_title: string, client_name: string })[];
}

export async function payCommission(id: number) {
    const date = new Date().toISOString().split('T')[0];
    await db.execute({
        sql: "UPDATE commissions SET status = 'Paid', paid_date = ? WHERE id = ?",
        args: [date, id]
    });
    revalidatePath('/finance');
}

export async function revertCommissionPayment(id: number) {
    await db.execute({
        sql: "UPDATE commissions SET status = 'Pending', paid_date = NULL WHERE id = ?",
        args: [id]
    });
    revalidatePath('/finance');
}

export async function getShoots(clientId: number): Promise<Shoot[]> {
    const { rows } = await db.execute({
        sql: 'SELECT * FROM shoots WHERE client_id = ? ORDER BY shoot_date ASC',
        args: [clientId]
    });
    return rows as unknown as Shoot[];
}



export async function getAllShoots(): Promise<ShootWithClient[]> {
    await ensureProjectFeatures();
    const { rows } = await db.execute(`
        SELECT shoots.*, 
        clients.name as client_name, 
        clients.company_name as client_company, 
        projects.title as project_title,
        pp.status as post_prod_status,
        pp.id as post_prod_id
        FROM shoots 
        JOIN clients ON shoots.client_id = clients.id 
        LEFT JOIN projects ON shoots.project_id = projects.id
        LEFT JOIN post_prod_projects pp ON shoots.id = pp.shoot_id
        ORDER BY shoot_date ASC
    `);
    return rows as unknown as ShootWithClient[];
}

export async function addShoot(formData: FormData) {
    const clientId = Number(formData.get('clientId'));
    const title = formData.get('title') as string;
    const date = formData.get('date') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const color = formData.get('color') as string || 'indigo';
    const projectId = formData.get('projectId') ? Number(formData.get('projectId')) : null;
    const dueDate = formData.get('dueDate') as string;

    await ensureProjectFeatures();

    await db.execute({
        sql: 'INSERT INTO shoots (client_id, project_id, title, shoot_date, start_time, end_time, color, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [clientId, projectId, title, date, startTime, endTime, color, dueDate]
    });

    revalidatePath(`/clients/${clientId}`);
    if (projectId) {
        revalidatePath(`/projects/${projectId}`);
    }
    revalidatePath('/');
}

export async function updateShoot(formData: FormData) {
    const id = Number(formData.get('id'));
    const clientId = Number(formData.get('clientId'));
    const title = formData.get('title') as string;
    const date = formData.get('date') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const color = formData.get('color') as string || 'indigo';
    const projectId = formData.get('projectId') ? Number(formData.get('projectId')) : null;
    const dueDate = formData.get('dueDate') as string;

    await ensureProjectFeatures();

    await db.execute({
        sql: 'UPDATE shoots SET client_id = ?, project_id = ?, title = ?, shoot_date = ?, start_time = ?, end_time = ?, color = ?, due_date = ? WHERE id = ?',
        args: [clientId, projectId, title, date, startTime, endTime, color, dueDate, id]
    });

    revalidatePath(`/clients/${clientId}`);
    revalidatePath('/');
    revalidatePath(`/shoots/${id}`);
    if (projectId) revalidatePath(`/projects/${projectId}`);
}

export async function deleteShoot(formData: FormData) {
    const id = Number(formData.get('id'));
    await db.execute({
        sql: 'DELETE FROM shoots WHERE id = ?',
        args: [id]
    });
    revalidatePath('/');
}

export async function getAllShootAssignments() {
    await ensureProjectFeatures();
    try {
        const { rows } = await db.execute(`
            SELECT sa.*, sa.team_member_id as member_id, tm.name as member_name, tm.role as member_role, tm.color as member_avatar_color
            FROM shoot_assignments sa
            JOIN team_members tm ON sa.team_member_id = tm.id
        `);
        return rows as unknown as ShootAssignment[];
    } catch (e) {
        // Fallback if color column missing
        console.error("Failed to fetch assignments with color:", e);
        const { rows } = await db.execute(`
            SELECT sa.*, sa.team_member_id as member_id, tm.name as member_name, tm.role as member_role
            FROM shoot_assignments sa
            JOIN team_members tm ON sa.team_member_id = tm.id
        `);
        return rows.map((r: any) => ({ ...r, member_avatar_color: 'indigo' })) as unknown as ShootAssignment[];
    }
}

export async function getShootAssignments(shootId: number) {
    await ensureProjectFeatures();
    const { rows } = await db.execute({
        sql: `
        SELECT sa.*, sa.team_member_id as member_id, tm.name as member_name, tm.role as member_role, tm.email as member_email
        FROM shoot_assignments sa
        JOIN team_members tm ON sa.team_member_id = tm.id
        WHERE sa.shoot_id = ?
        `,
        args: [shootId]
    });
    return rows as unknown as any[];
}

export async function createShootAssignment(formData: FormData) {
    const shootId = Number(formData.get('shootId'));
    const memberId = Number(formData.get('memberId'));
    const role = formData.get('role') as string;

    await ensureProjectFeatures();
    // Check if already assigned
    const exists = await db.execute({
        sql: 'SELECT id FROM shoot_assignments WHERE shoot_id = ? AND team_member_id = ?',
        args: [shootId, memberId]
    });
    if (exists.rows.length > 0) return;

    await db.execute({
        sql: 'INSERT INTO shoot_assignments (shoot_id, team_member_id, role) VALUES (?, ?, ?)',
        args: [shootId, memberId, role]
    });
    revalidatePath(`/shoots/${shootId}`);
}

export async function deleteShootAssignment(formData: FormData) {
    const id = Number(formData.get('id')); // shoot_assignment id
    const shootId = Number(formData.get('shootId'));

    await db.execute({
        sql: 'DELETE FROM shoot_assignments WHERE id = ?',
        args: [id]
    });
    revalidatePath(`/shoots/${shootId}`);
}


export async function getShootById(id: number): Promise<ShootWithClient | undefined> {
    const { rows } = await db.execute({
        sql: `
        SELECT shoots.*, 
        clients.name as client_name, 
        clients.company_name as client_company, 
        projects.title as project_title,
        pp.status as post_prod_status,
        pp.id as post_prod_id
        FROM shoots 
        LEFT JOIN clients ON shoots.client_id = clients.id 
        LEFT JOIN projects ON shoots.project_id = projects.id
        LEFT JOIN post_prod_projects pp ON shoots.id = pp.shoot_id
        WHERE shoots.id = ?
        `,
        args: [id]
    });
    return (rows[0] as unknown as ShootWithClient & { post_prod_status?: string, post_prod_id?: number }) || undefined;
}

export async function getShootVideos(shootId: number): Promise<ShootVideo[]> {
    const { rows } = await db.execute({
        sql: 'SELECT * FROM shoot_videos WHERE shoot_id = ?',
        args: [shootId]
    });
    return rows as unknown as ShootVideo[];
}

export async function getShootVideoNotes(shootId: number): Promise<ShootVideoNote[]> {
    const { rows } = await db.execute({
        sql: `
        SELECT * FROM shoot_video_notes 
        WHERE video_id IN (SELECT id FROM shoot_videos WHERE shoot_id = ?)
        ORDER BY created_at ASC
        `,
        args: [shootId]
    });
    return rows as unknown as ShootVideoNote[];
}

export async function addShootVideoNote(formData: FormData) {
    const videoId = Number(formData.get('videoId'));
    const content = formData.get('content') as string;
    const shootId = formData.get('shootId') ? Number(formData.get('shootId')) : null;
    const clientId = formData.get('clientId') ? Number(formData.get('clientId')) : null;

    await db.execute({
        sql: 'INSERT INTO shoot_video_notes (video_id, content) VALUES (?, ?)',
        args: [videoId, content]
    });

    if (clientId) revalidatePath(`/clients/${clientId}`);
    if (shootId) revalidatePath(`/shoots/${shootId}`);
}

export async function deleteShootVideoNote(formData: FormData) {
    const id = Number(formData.get('id'));
    const shootId = formData.get('shootId') ? Number(formData.get('shootId')) : null;
    await db.execute({
        sql: 'DELETE FROM shoot_video_notes WHERE id = ?',
        args: [id]
    });
    if (shootId) revalidatePath(`/shoots/${shootId}`);
}

export async function addShootVideo(formData: FormData) {
    const shootId = Number(formData.get('shootId'));
    const clientId = Number(formData.get('clientId'));
    const title = formData.get('title') as string;

    await db.execute({
        sql: 'INSERT INTO shoot_videos (shoot_id, title) VALUES (?, ?)',
        args: [shootId, title]
    });

    revalidatePath(`/clients/${clientId}`);
    revalidatePath(`/shoots/${shootId}`);
}

export async function toggleShootVideo(id: number, currentStatus: number, clientId: number, shootId?: number) {
    const newStatus = currentStatus === 1 ? 0 : 1;
    await db.execute({
        sql: 'UPDATE shoot_videos SET completed = ? WHERE id = ?',
        args: [newStatus, id]
    });
    revalidatePath(`/clients/${clientId}`);
    if (shootId) revalidatePath(`/shoots/${shootId}`);
}

export async function updateShootVideoNotes(id: number, notes: string, clientId: number, shootId?: number) {
    await db.execute({
        sql: 'UPDATE shoot_videos SET notes = ? WHERE id = ?',
        args: [notes, id]
    });
    revalidatePath(`/clients/${clientId}`);
    if (shootId) revalidatePath(`/shoots/${shootId}`);
}

export async function deleteShootVideo(formData: FormData) {
    const id = Number(formData.get('id'));
    const shootId = formData.get('shootId') ? Number(formData.get('shootId')) : null;
    await db.execute({
        sql: 'DELETE FROM shoot_videos WHERE id = ?',
        args: [id]
    });
    revalidatePath('/');
    if (shootId) revalidatePath(`/shoots/${shootId}`);
}

export async function updateClientStatus(clientId: number, newStatus: string) {
    await db.execute({
        sql: 'UPDATE clients SET status = ? WHERE id = ?',
        args: [newStatus, clientId]
    });
    revalidatePath('/');
}

export async function getPayments(clientId: number) {
    const { rows } = await db.execute({
        sql: 'SELECT * FROM payments WHERE client_id = ? ORDER BY date DESC',
        args: [clientId]
    });
    return rows as unknown as Payment[];
}

export async function getCredentials(clientId: number) {
    const { rows } = await db.execute({
        sql: 'SELECT * FROM credentials WHERE client_id = ?',
        args: [clientId]
    });
    return rows as unknown as Credential[];
}

export async function addCredential(formData: FormData) {
    const clientId = Number(formData.get('clientId'));
    const service = formData.get('service') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    await db.execute({
        sql: 'INSERT INTO credentials (client_id, service_name, username, password) VALUES (?, ?, ?, ?)',
        args: [clientId, service, username, password]
    });
    revalidatePath(`/clients/${clientId}`);
}

// --- PROJECTS ACTIONS ---


export async function addPayment(formData: FormData) {
    const clientId = Number(formData.get('clientId'));
    const amount = Number(formData.get('amount'));
    const status = 'Paid';
    const date = (formData.get('date') as string) || new Date().toISOString().split('T')[0];
    const description = formData.get('description') as string;
    const projectId = Number(formData.get('projectId'));

    await db.execute({
        sql: 'INSERT INTO payments (client_id, amount, status, date, description, project_id) VALUES (?, ?, ?, ?, ?, ?)',
        args: [clientId, amount, status, date, description, projectId]
    });

    revalidatePath('/finance');
    revalidatePath(`/clients/${clientId}`);
}

export async function getDashboardStats() {
    // 1. Settings
    const settingsRes = await db.execute('SELECT * FROM settings WHERE id = 1');
    const settings = (settingsRes.rows[0] as unknown as { tax_tps_rate: number, tax_tvq_rate: number }) || { tax_tps_rate: 5, tax_tvq_rate: 9.975 };
    const taxMultiplier = 1 + ((settings.tax_tps_rate || 5) + (settings.tax_tvq_rate || 9.975)) / 100;

    // 2. Total Collected Revenue
    const totalCollectedRes = await db.execute(`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM payments
    `);
    const totalCollectedRevenue = (totalCollectedRes.rows[0] as unknown as { total: number });

    // 3. Total Project Value
    const totalProjectValueRes = await db.execute(`
        SELECT COALESCE(SUM(ps.rate * ps.quantity), 0) as total
        FROM project_services ps
        JOIN projects p ON ps.project_id = p.id
        WHERE p.status != 'Archived'
    `);
    const totalProjectValue = (totalProjectValueRes.rows[0] as unknown as { total: number });

    const totalProjectValueIncTax = (totalProjectValue?.total || 0) * taxMultiplier;
    const pendingRevenue = Math.max(0, totalProjectValueIncTax - totalCollectedRevenue.total);

    const activeClientsRes = await db.execute("SELECT COUNT(*) as count FROM clients WHERE status = 'Active'");
    const totalClientsRes = await db.execute("SELECT COUNT(*) as count FROM clients");
    const upcomingShootsRes = await db.execute("SELECT COUNT(*) as count FROM shoots WHERE shoot_date >= date('now')");

    const activeClients = activeClientsRes.rows[0] as unknown as { count: number };
    const totalClients = totalClientsRes.rows[0] as unknown as { count: number };
    const upcomingShoots = upcomingShootsRes.rows[0] as unknown as { count: number };

    return {
        totalRevenue: totalCollectedRevenue.total,
        pendingRevenue: pendingRevenue,
        activeClients: activeClients?.count || 0,
        totalClients: totalClients?.count || 0,
        upcomingShoots: upcomingShoots?.count || 0
    };
}

export async function getFinanceData() {
    // Fetch tax rates
    const settingsRes = await db.execute('SELECT * FROM settings WHERE id = 1');
    const settings = (settingsRes.rows[0] as unknown as { tax_tps_rate: number, tax_tvq_rate: number }) || { tax_tps_rate: 5, tax_tvq_rate: 9.975 };
    const taxMultiplier = 1 + ((settings.tax_tps_rate || 5) + (settings.tax_tvq_rate || 9.975)) / 100;

    // 1. Total Collected
    const totalCollectedRes = await db.execute(`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM payments
    `);
    const totalCollectedRevenue = (totalCollectedRes.rows[0] as unknown as { total: number });

    // 2. Total Project Value
    const totalProjectValueRes = await db.execute(`
        SELECT COALESCE(SUM(ps.rate * ps.quantity), 0) as total
        FROM project_services ps
        JOIN projects p ON ps.project_id = p.id
        WHERE p.status != 'Archived' 
    `);
    const totalProjectValue = (totalProjectValueRes.rows[0] as unknown as { total: number });

    // 3. Client Performance
    const clientsWithRevenueRes = await db.execute({
        sql: `
        SELECT c.id, c.name, c.company_name, c.status,
        (SELECT COUNT(*) FROM projects p WHERE p.client_id = c.id) as project_count,
        (SELECT COALESCE(SUM(ps.rate * ps.quantity), 0) * ?
         FROM project_services ps 
         JOIN projects p ON ps.project_id = p.id 
         WHERE p.client_id = c.id) as total_revenue
        FROM clients c
        ORDER BY total_revenue DESC
        `,
        args: [taxMultiplier]
    });
    const clientsWithRevenue = clientsWithRevenueRes.rows;

    // 4. Project List
    const projectsRawRes = await db.execute(`
        SELECT p.*, c.company_name as client_company,
        (SELECT COALESCE(SUM(rate * quantity), 0) FROM project_services ps WHERE ps.project_id = p.id) as total_value_pre_tax,
        (SELECT COALESCE(SUM(amount), 0) FROM payments pay WHERE pay.project_id = p.id) as paid_amount
        FROM projects p
        JOIN clients c ON p.client_id = c.id
        ORDER BY p.created_at DESC
    `);
    const projectsRaw = projectsRawRes.rows as any[];

    const projectsWithValue = projectsRaw.map(p => ({
        ...p,
        total_value: p.total_value_pre_tax * taxMultiplier
    }));

    // 5. Commission Expenses
    const paidCommissionsRes = await db.execute("SELECT * FROM commissions WHERE status = 'Paid'");
    const paidCommissions = paidCommissionsRes.rows as unknown as Commission[];

    let totalCommissionsPaid = 0;
    for (const comm of paidCommissions) {
        if (comm.rate_type === 'Fixed') {
            totalCommissionsPaid += comm.rate_value;
        } else {
            if (comm.project_id) {
                const projectTotalRes = await db.execute({
                    sql: "SELECT SUM(rate * quantity) as total FROM project_services WHERE project_id = ?",
                    args: [comm.project_id]
                });
                const projectTotal = projectTotalRes.rows[0] as unknown as { total: number };
                totalCommissionsPaid += (projectTotal?.total || 0) * (comm.rate_value / 100);
            }
        }
    }

    // 6. Business Expenses
    const expensesRes = await db.execute('SELECT * FROM expenses');
    const expenses = expensesRes.rows as any[];
    const totalExpensesPreTax = expenses.reduce((acc, curr) => acc + curr.amount_pre_tax, 0);
    const totalExpenseTps = expenses.reduce((acc, curr) => acc + curr.tps_amount, 0);
    const totalExpenseTvq = expenses.reduce((acc, curr) => acc + curr.tvq_amount, 0);

    const revenueWithTax = totalCollectedRevenue.total;
    const revenuePreTax = revenueWithTax / taxMultiplier;
    const globalProjectValuePreTax = totalProjectValue.total || 0;
    const globalProjectValueIncTax = globalProjectValuePreTax * taxMultiplier;
    const pendingRevenueIncTax = Math.max(0, globalProjectValueIncTax - revenueWithTax);

    const tpsCollected = revenuePreTax * (settings.tax_tps_rate / 100);
    const tvqCollected = revenuePreTax * (settings.tax_tvq_rate / 100);

    const tpsOwed = Math.max(0, tpsCollected - totalExpenseTps);
    const tvqOwed = Math.max(0, tvqCollected - totalExpenseTvq);

    const netProfit = revenuePreTax - totalCommissionsPaid - totalExpensesPreTax;

    // 7. Revenue Chart Data (Last 6 Months)
    const revenueChartRes = await db.execute(`
        SELECT strftime('%Y-%m', date) as month, SUM(amount) as total
        FROM payments
        GROUP BY month
        ORDER BY month ASC
        LIMIT 6
    `);
    const revenueChartData = revenueChartRes.rows.map((r: any) => ({
        date: r.month,
        amount: r.total
    }));

    return {
        stats: {
            totalRevenue: revenuePreTax,
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
            expenses: totalCommissionsPaid,
            businessExpenses: totalExpensesPreTax,
            netProfit: netProfit
        },
        revenueChart: revenueChartData,

        clients: clientsWithRevenue,
        projects: projectsWithValue,
        settings,
        expensesList: expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    };
}

// Pipeline Stages

export async function getPipelineStages(): Promise<PipelineStage[]> {
    const { rows } = await db.execute('SELECT * FROM pipeline_stages ORDER BY order_index ASC');
    return rows as unknown as PipelineStage[];
}

export async function savePipelineStage(stage: Partial<PipelineStage>) {
    const isNew = !stage.id || stage.id > 1000000000000;

    if (!isNew && stage.id) {
        await db.execute({
            sql: 'UPDATE pipeline_stages SET label = ?, value = ?, color = ? WHERE id = ?',
            args: [stage.label ?? null, stage.value ?? null, stage.color ?? null, stage.id]
        });
    } else {
        const resultRes = await db.execute('SELECT MAX(order_index) as maxOrder FROM pipeline_stages');
        const result = resultRes.rows[0] as unknown as { maxOrder: number };
        const nextOrder = (result?.maxOrder ?? -1) + 1;
        await db.execute({
            sql: 'INSERT INTO pipeline_stages (label, value, color, order_index) VALUES (?, ?, ?, ?)',
            args: [stage.label ?? null, stage.value ?? null, stage.color ?? 'gray', nextOrder]
        });
    }
    revalidatePath('/');
}

export async function reorderPipelineStages(stages: PipelineStage[]) {
    // Check for transaction support or batch
    const statements = stages.map((s, i) => ({
        sql: 'UPDATE pipeline_stages SET order_index = ? WHERE id = ?',
        args: [i, s.id]
    }));
    await db.batch(statements, 'write');
    revalidatePath('/');
}

export async function deletePipelineStage(id: number) {
    await db.execute({
        sql: 'DELETE FROM pipeline_stages WHERE id = ?',
        args: [id]
    });
    revalidatePath('/');
}

// --- TASKS ACTIONS ---

export async function getTasks(): Promise<Task[]> {
    const { rows } = await db.execute('SELECT * FROM tasks ORDER BY is_completed ASC, created_at DESC');
    return rows as unknown as Task[];
}

export async function addTask(formData: FormData) {
    const content = formData.get('content') as string;
    if (!content) return;
    await db.execute({
        sql: 'INSERT INTO tasks (content) VALUES (?)',
        args: [content]
    });
    revalidatePath('/');
}

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

export async function getAllDashboardTasks(): Promise<DashboardTask[]> {
    const personalTasksRes = await db.execute(`
        SELECT id, content as title, is_completed, 'Personal' as type, NULL as project_id, NULL as project_title, NULL as due_date, NULL as assignee_name
        FROM tasks
    `);
    const personalTasks = personalTasksRes.rows as any[];

    const projectTasksRes = await db.execute(`
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
    `);
    const projectTasks = projectTasksRes.rows as any[];

    const allTasks = [...personalTasks, ...projectTasks];

    return allTasks.sort((a, b) => {
        if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
        return b.id - a.id;
    });
}

export async function toggleTask(id: number, isCompleted: boolean) {
    await db.execute({
        sql: 'UPDATE tasks SET is_completed = ? WHERE id = ?',
        args: [isCompleted ? 1 : 0, id]
    });
    revalidatePath('/');
}

export async function deleteTask(id: number) {
    await db.execute({
        sql: 'DELETE FROM tasks WHERE id = ?',
        args: [id]
    });
    revalidatePath('/');
}

// --- PROJECTS ACTIONS ---
export async function getProjects(clientId: number): Promise<Project[]> {
    const { rows } = await db.execute({
        sql: `
        SELECT p.*, 
        pl.name as label_name,
        pl.color as label_color,
        (SELECT COUNT(*) FROM shoots s WHERE s.project_id = p.id) as shoot_count,
        (SELECT COUNT(*) FROM project_services ps WHERE ps.project_id = p.id) as service_count,
        (SELECT COALESCE(SUM(rate * quantity), 0) FROM project_services ps WHERE ps.project_id = p.id) as total_value
        FROM projects p 
        LEFT JOIN project_labels pl ON p.label_id = pl.id
        WHERE client_id = ? 
        ORDER BY created_at DESC
        `,
        args: [clientId]
    });
    return rows as unknown as Project[];
}







// --- PROJECT HELPERS ---



export async function updateShootVideoTitle(id: number, title: string, clientId: number, shootId: number) {
    await db.execute({
        sql: 'UPDATE shoot_videos SET title = ? WHERE id = ?',
        args: [title, id]
    });
    revalidatePath(`/shoots/${shootId}`);
}

export async function updateProjectTitle(formData: FormData) {
    const id = Number(formData.get('id'));
    const title = formData.get('title') as string;

    await db.execute({
        sql: 'UPDATE projects SET title = ? WHERE id = ?',
        args: [title, id]
    });
    revalidatePath(`/projects/${id}`);
}

export async function updateProjectDetails(formData: FormData) {
    const id = Number(formData.get('id'));
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const startDate = formData.get('startDate') as string;
    const status = formData.get('status') as string;
    const dueDate = formData.get('dueDate') as string;
    const labelId = formData.get('labelId') ? Number(formData.get('labelId')) : null;

    await ensureProjectFeatures();

    await db.execute({
        sql: 'UPDATE projects SET title = ?, description = ?, start_date = ?, status = ?, due_date = ?, label_id = ? WHERE id = ?',
        args: [title, description, startDate, status, dueDate, labelId, id]
    });
    revalidatePath(`/projects/${id}`);
}

// --- PROJECT HELPERS ---

// --- PROJECT HELPERS ---

export async function createProject(formData: FormData) {
    const clientId = Number(formData.get('clientId'));
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const status = formData.get('status') as string;
    const dueDate = formData.get('dueDate') as string;
    const labelId = formData.get('labelId') ? Number(formData.get('labelId')) : null;

    if (!clientId || !title) return;

    await ensureProjectFeatures();

    await db.execute({
        sql: 'INSERT INTO projects (client_id, title, description, start_date, status, due_date, label_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [clientId, title, description, date, status, dueDate, labelId]
    });
    revalidatePath(`/clients/${clientId}`);
}



export async function getProjectById(id: number) {
    const { rows } = await db.execute({
        sql: `
            SELECT p.*, c.company_name as client_company, pl.name as label_name, pl.color as label_color
            FROM projects p 
            JOIN clients c ON p.client_id = c.id 
            LEFT JOIN project_labels pl ON p.label_id = pl.id
            WHERE p.id = ?
        `,
        args: [id]
    });
    return rows[0] as unknown as any;
}

export async function getProjectShoots(projectId: number) {
    const { rows } = await db.execute({
        sql: `
        SELECT s.*, 
        (SELECT COUNT(*) FROM shoot_videos sv WHERE sv.shoot_id = s.id AND sv.completed = 1) as completed_videos_count,
        (SELECT COUNT(*) FROM shoot_videos sv WHERE sv.shoot_id = s.id) as total_videos_count,
        pp.status as post_prod_status
        FROM shoots s 
        LEFT JOIN post_prod_projects pp ON s.id = pp.shoot_id
        WHERE s.project_id = ? 
        ORDER BY s.shoot_date DESC
        `,
        args: [projectId]
    });
    return rows as unknown as any[];
}

export async function getProjectServices(projectId: number) {
    const { rows } = await db.execute({
        sql: 'SELECT * FROM project_services WHERE project_id = ?',
        args: [projectId]
    });
    return rows as unknown as any[];
}

export async function addProjectService(formData: FormData) {
    const projectId = Number(formData.get('projectId'));
    const name = formData.get('name') as string;
    const rate = Number(formData.get('rate'));
    const quantity = Number(formData.get('quantity')) || 1;
    const serviceId = formData.get('serviceId') ? Number(formData.get('serviceId')) : null;

    await db.execute({
        sql: 'INSERT INTO project_services (project_id, service_id, name, rate, quantity) VALUES (?, ?, ?, ?, ?)',
        args: [projectId, serviceId, name, rate, quantity]
    });
    revalidatePath(`/projects/${projectId}`);
}

export async function deleteProjectService(formData: FormData) {
    const id = Number(formData.get('id'));
    const projectId = Number(formData.get('projectId'));
    await db.execute({
        sql: 'DELETE FROM project_services WHERE id = ?',
        args: [id]
    });
    revalidatePath(`/projects/${projectId}`);
}

export async function updateProjectStatus(formData: FormData) {
    const id = Number(formData.get('id'));
    const status = formData.get('status') as string;
    await db.execute({
        sql: 'UPDATE projects SET status = ? WHERE id = ?',
        args: [status, id]
    });
    revalidatePath(`/projects/${id}`);
}

// --- SERVICES CATALOG ACTIONS ---
export async function getServices() {
    const { rows } = await db.execute('SELECT * FROM services ORDER BY name ASC');
    return rows as unknown as any[];
}

export async function createService(formData: FormData) {
    const name = formData.get('name') as string;
    const rate = Number(formData.get('rate'));
    const type = formData.get('type') as string;
    await db.execute({
        sql: 'INSERT INTO services (name, default_rate, rate_type) VALUES (?, ?, ?)',
        args: [name, rate, type]
    });
    revalidatePath('/services');
}

export async function deleteService(id: number) {
    await db.execute({
        sql: 'DELETE FROM services WHERE id = ?',
        args: [id]
    });
    revalidatePath('/services');
}

// --- POST-PRODUCTION ACTIONS ---
export async function finishShoot(shootId: number) {
    console.log('--- finishShoot called ---', shootId);
    try {
        await db.batch([
            { sql: 'UPDATE shoots SET status = ? WHERE id = ?', args: ['Completed', shootId] },
            { sql: 'INSERT INTO post_production (shoot_id, status) VALUES (?, ?)', args: [shootId, 'Derush'] }
        ], 'write');
        console.log('Batch transaction completed successfully');
        revalidatePath(`/shoots/${shootId}`);
        revalidatePath('/post-production');
    } catch (error) {
        console.error('Error in finishShoot:', error);
        throw error;
    }
}

export async function revertShoot(shootId: number) {
    console.log('--- revertShoot called ---', shootId);
    try {
        await db.batch([
            { sql: "UPDATE shoots SET status = 'Planned' WHERE id = ?", args: [shootId] },
            { sql: 'DELETE FROM post_prod_projects WHERE shoot_id = ?', args: [shootId] }
        ], 'write');
        console.log('Batch transaction completed successfully');
        revalidatePath(`/shoots/${shootId}`);
        revalidatePath('/post-production');
    } catch (error) {
        console.error('Error in revertShoot:', error);
        throw error;
    }
}

export async function getPostProdItems() {
    const { rows } = await db.execute(`
        SELECT pp.*, s.title as shoot_title, c.company_name as client_name 
        FROM post_production pp
        JOIN shoots s ON pp.shoot_id = s.id
        JOIN clients c ON s.client_id = c.id
        ORDER BY pp.updated_at DESC
    `);
    return rows as unknown as any[];
}

export async function updatePostProdStatus(id: number, status: string) {
    await db.execute({
        sql: 'UPDATE post_production SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        args: [status, id]
    });
    revalidatePath('/');
}

export async function getSettings() {
    const { rows } = await db.execute('SELECT * FROM settings WHERE id = 1');
    return (rows[0] as unknown as { id: number, tax_tps_rate: number, tax_tvq_rate: number });
}

export async function updateSettings(formData: FormData) {
    const tps = parseFloat(formData.get('tax_tps_rate') as string);
    const tvq = parseFloat(formData.get('tax_tvq_rate') as string);
    await db.execute({
        sql: 'UPDATE settings SET tax_tps_rate = ?, tax_tvq_rate = ? WHERE id = 1',
        args: [tps, tvq]
    });
    revalidatePath('/settings');
    revalidatePath('/projects');
    revalidatePath('/');
}

// --- TEAM MANAGEMENT ACTIONS ---

export async function getTeamMembers(): Promise<TeamMember[]> {
    const { rows } = await db.execute('SELECT * FROM team_members ORDER BY name ASC');
    return rows as unknown as TeamMember[];
}

export async function addTeamMember(formData: FormData) {
    const name = formData.get('name') as string;
    const role = formData.get('role') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const hourlyRate = Number(formData.get('hourly_rate')) || 0;
    const color = (formData.get('color') as string) || 'indigo';

    await db.execute({
        sql: 'INSERT INTO team_members (name, role, email, phone, hourly_rate, color) VALUES (?, ?, ?, ?, ?, ?)',
        args: [name, role, email, phone, hourlyRate, color]
    });
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

    await db.execute({
        sql: 'UPDATE team_members SET name = ?, role = ?, email = ?, phone = ?, hourly_rate = ?, color = ? WHERE id = ?',
        args: [name, role, email, phone, hourlyRate, color, id]
    });
    revalidatePath('/team');
    revalidatePath(`/team/${id}`);
}

export async function getTeamMember(id: number) {
    const { rows } = await db.execute({
        sql: 'SELECT * FROM team_members WHERE id = ?',
        args: [id]
    });
    return rows[0] as unknown as any;
}

export async function getMemberAvailability(memberId: number) {
    const { rows } = await db.execute({
        sql: 'SELECT * FROM team_availability WHERE member_id = ?',
        args: [memberId]
    });
    return rows as unknown as any[];
}

export async function setMemberAvailability(memberId: number, date: string, status: string, note: string = '') {
    const existingRes = await db.execute({
        sql: 'SELECT id FROM team_availability WHERE member_id = ? AND date = ?',
        args: [memberId, date]
    });
    const existing = existingRes.rows[0] as unknown as { id: number };

    if (existing) {
        await db.execute({
            sql: 'UPDATE team_availability SET status = ?, note = ? WHERE id = ?',
            args: [status, note, existing.id]
        });
    } else {
        await db.execute({
            sql: 'INSERT INTO team_availability (member_id, date, status, note) VALUES (?, ?, ?, ?)',
            args: [memberId, date, status, note]
        });
    }
    revalidatePath(`/team/${memberId}`);
}

export async function getMemberFinancials(memberId: number) {
    const memberRes = await db.execute({
        sql: 'SELECT name FROM team_members WHERE id = ?',
        args: [memberId]
    });
    const member = memberRes.rows[0] as unknown as { name: string };
    if (!member) return [];

    const { rows } = await db.execute({
        sql: `
        SELECT c.*, p.title as project_title, cl.company_name as client_name
        FROM commissions c
        LEFT JOIN projects p ON c.project_id = p.id
        LEFT JOIN clients cl ON c.client_id = cl.id
        WHERE LOWER(c.person_name) = LOWER(?)
        `,
        args: [member.name]
    });
    return rows as unknown as any[];
}

// --- GLOBAL SEARCH ACTION ---

export type SearchResult = {
    id: string;
    type: 'Page' | 'Client' | 'Project' | 'Shoot';
    label: string;
    subLabel?: string;
    url: string;
};



// --- PROJECT TASKS ---

export async function getProjectTasks(projectId: number): Promise<any[]> {
    const { rows } = await db.execute({
        sql: `
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
        `,
        args: [projectId]
    });
    return rows as unknown as any[];
}

export async function getTaskStages(): Promise<any[]> {
    const { rows } = await db.execute('SELECT * FROM task_stages ORDER BY position ASC, id ASC');
    return rows as unknown as any[];
}

export async function addProjectTask(formData: FormData) {
    const projectId = Number(formData.get('projectId'));
    const title = formData.get('title') as string;
    const dueDateRaw = formData.get('dueDate') as string;
    const dueDate = dueDateRaw ? dueDateRaw : null;
    const assigneeId = formData.get('assigneeId') ? Number(formData.get('assigneeId')) : null;

    if (!projectId || !title) return;

    // Get default stage
    const defaultStageRes = await db.execute('SELECT id FROM task_stages WHERE is_default = 1');
    const defaultStage = defaultStageRes.rows[0] as unknown as { id: number };
    const stageId = defaultStage?.id || 1;

    await db.execute({
        sql: 'INSERT INTO project_tasks (project_id, title, due_date, stage_id, assigned_to) VALUES (?, ?, ?, ?, ?)',
        args: [projectId, title, dueDate, stageId, assigneeId]
    });
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/');
}

export async function toggleProjectTask(id: number, projectId: number) {
    const taskRes = await db.execute({
        sql: 'SELECT is_completed FROM project_tasks WHERE id = ?',
        args: [id]
    });
    const task = taskRes.rows[0] as unknown as { is_completed: number };

    let targetStageId;
    if (task.is_completed) {
        // Move to To Do
        const defRes = await db.execute('SELECT id FROM task_stages WHERE is_default = 1');
        const def = defRes.rows[0] as unknown as { id: number };
        targetStageId = def?.id || 1;
    } else {
        // Move to Done
        const doneRes = await db.execute("SELECT id FROM task_stages WHERE name = 'Done'");
        const done = doneRes.rows[0] as unknown as { id: number };
        targetStageId = done?.id || 4;
    }

    await updateTaskStage(id, targetStageId, projectId);
}

export async function updateTaskStage(taskId: number, stageId: number, projectId: number) {
    const stageRes = await db.execute({
        sql: 'SELECT name FROM task_stages WHERE id = ?',
        args: [stageId]
    });
    const stage = stageRes.rows[0] as unknown as { name: string };
    const isCompleted = stage.name === 'Done' ? 1 : 0;

    await db.execute({
        sql: 'UPDATE project_tasks SET stage_id = ?, is_completed = ? WHERE id = ?',
        args: [stageId, isCompleted, taskId]
    });
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/');
}

export async function updateTaskAssignee(taskId: number, assigneeId: number | null, projectId: number) {
    await db.execute({
        sql: 'UPDATE project_tasks SET assigned_to = ? WHERE id = ?',
        args: [assigneeId, taskId]
    });
    revalidatePath(`/projects/${projectId}`);
}

export async function deleteProjectTask(taskId: number, projectId: number) {
    await db.execute({
        sql: 'DELETE FROM project_tasks WHERE id = ?',
        args: [taskId]
    });
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

    await db.execute({
        sql: 'INSERT INTO task_stages (name, color, position) VALUES (?, ?, ?)',
        args: [name, color, position]
    });
    revalidatePath('/settings');
    revalidatePath('/');
}

export async function deleteTaskStage(id: number) {
    const stageRes = await db.execute({
        sql: 'SELECT is_default FROM task_stages WHERE id = ?',
        args: [id]
    });
    const stage = stageRes.rows[0] as unknown as { is_default: number };
    if (stage.is_default) return;

    const defaultStageRes = await db.execute('SELECT id FROM task_stages WHERE is_default = 1');
    const defaultStage = defaultStageRes.rows[0] as unknown as { id: number };
    if (defaultStage) {
        await db.execute({
            sql: 'UPDATE project_tasks SET stage_id = ? WHERE stage_id = ?',
            args: [defaultStage.id, id]
        });
    }

    await db.execute({
        sql: 'DELETE FROM task_stages WHERE id = ?',
        args: [id]
    });
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
    await db.execute({
        sql: `UPDATE project_tasks SET ${fields.join(', ')} WHERE id = ?`,
        args: values
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/');
}

export async function addExpense(formData: FormData) {
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const category = formData.get('category') as string;
    const amountPreTax = parseFloat(formData.get('amountPreTax') as string);
    const tpsAmount = parseFloat(formData.get('tpsAmount') as string) || 0;
    const tvqAmount = parseFloat(formData.get('tvqAmount') as string) || 0;
    const totalAmount = amountPreTax + tpsAmount + tvqAmount;

    if (!description || !date || isNaN(amountPreTax)) return;

    await db.execute({
        sql: `
        INSERT INTO expenses (description, date, category, amount_pre_tax, tps_amount, tvq_amount, total_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        args: [description, date, category, amountPreTax, tpsAmount, tvqAmount, totalAmount]
    });

    revalidatePath('/finance');
}

export async function deleteExpense(id: number) {
    await db.execute({
        sql: 'DELETE FROM expenses WHERE id = ?',
        args: [id]
    });
    revalidatePath('/finance');
}

export async function getExpenses() {
    const { rows } = await db.execute('SELECT * FROM expenses ORDER BY date DESC');
    return rows as unknown as any[];
}

// --- BETA FEEDBACK ACTIONS ---

async function ensureBetaTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS beta_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT,
            page_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_resolved BOOLEAN DEFAULT 0
        )
    `);
}

export async function addBetaFeedback(formData: FormData) {
    await ensureBetaTable();
    const content = formData.get('content') as string;
    const pageUrl = formData.get('pageUrl') as string;

    await db.execute({
        sql: 'INSERT INTO beta_feedback (content, page_url) VALUES (?, ?)',
        args: [content, pageUrl]
    });
}

export async function getBetaFeedback(): Promise<BetaFeedback[]> {
    await ensureBetaTable();
    const { rows } = await db.execute('SELECT * FROM beta_feedback ORDER BY created_at DESC');
    return rows as unknown as BetaFeedback[];
}

export async function resolveBetaFeedback(id: number) {
    await db.execute({
        sql: 'UPDATE beta_feedback SET is_resolved = 1 WHERE id = ?',
        args: [id]
    });
    revalidatePath('/beta-feedback');
}

export async function deleteBetaFeedback(formData: FormData) {
    const id = Number(formData.get('id'));
    await db.execute({
        sql: 'DELETE FROM beta_feedback WHERE id = ?',
        args: [id]
    });
    revalidatePath('/beta-feedback');
}

// --- PROJECT LABELS ACTIONS ---
export async function getProjectLabels() {
    await ensureProjectFeatures();
    const { rows } = await db.execute('SELECT * FROM project_labels ORDER BY name ASC');
    return rows as unknown as { id: number, name: string, color: string }[];
}

export async function createProjectLabel(formData: FormData) {
    const name = formData.get('name') as string;
    const color = formData.get('color') as string;
    await db.execute({
        sql: 'INSERT INTO project_labels (name, color) VALUES (?, ?)',
        args: [name, color]
    });
    revalidatePath('/projects');
}

export async function deleteProjectLabel(formData: FormData) {
    const id = Number(formData.get('id'));
    await db.execute({
        sql: 'DELETE FROM project_labels WHERE id = ?',
        args: [id]
    });
    revalidatePath('/projects');
}

export async function updateClient(formData: FormData) {
    const id = Number(formData.get('id'));
    const name = formData.get('name') as string;
    const company = formData.get('company') as string;
    const plan = formData.get('plan') as string;

    await db.execute({
        sql: 'UPDATE clients SET name = ?, company_name = ?, plan = ? WHERE id = ?',
        args: [name, company, plan, id]
    });
    revalidatePath(`/clients/${id}`);
    revalidatePath('/');
}

export async function getTeamSchedule() {
    // Fetch all future assignments for the calendar
    const { rows } = await db.execute(`
        SELECT sa.*, s.title as shoot_title, s.shoot_date, tm.name as member_name, tm.color as member_avatar_color
        FROM shoot_assignments sa
        JOIN shoots s ON sa.shoot_id = s.id
        JOIN team_members tm ON sa.member_id = tm.id
        WHERE s.shoot_date >= date('now', '-1 month')
        ORDER BY s.shoot_date ASC
    `);

    return rows as unknown as ShootAssignment[];
}


