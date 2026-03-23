'use server';

import { db } from './utils';
import { revalidatePath } from 'next/cache';

export async function getAgencies() {
    const { rows } = await db.execute('SELECT * FROM agencies ORDER BY name ASC');
    return rows as unknown as any[];
}

export async function createAgency(formData: FormData) {
    const name = formData.get('name') as string;
    const color = formData.get('color') as string || '#8b5cf6';
    if (!name) return;
    await db.execute({ sql: 'INSERT INTO agencies (name, color) VALUES (?, ?)', args: [name, color] });
    revalidatePath('/');
    revalidatePath('/settings');
}

export async function deleteAgency(formData: FormData) {
    const id = Number(formData.get('id'));
    if (!id) return;
    await db.execute({ sql: 'UPDATE clients SET agency_id = NULL WHERE agency_id = ?', args: [id] });
    await db.execute({ sql: 'DELETE FROM agencies WHERE id = ?', args: [id] });
    revalidatePath('/');
    revalidatePath('/settings');
}

export async function getAgencyStats() {
    const { rows } = await db.execute(`
        SELECT a.id, a.name, a.color,
        COALESCE(ct.count, 0) as client_count,
        COALESCE(rev.total, 0) as total_revenue
        FROM agencies a
        LEFT JOIN (SELECT agency_id, COUNT(*) as count FROM clients GROUP BY agency_id) ct ON a.id = ct.agency_id
        LEFT JOIN (
            SELECT c.agency_id, SUM(CASE WHEN pay.status = 'paid' THEN pay.amount ELSE 0 END) as total
            FROM clients c JOIN projects p ON c.id = p.client_id LEFT JOIN payments pay ON p.id = pay.project_id
            GROUP BY c.agency_id
        ) rev ON a.id = rev.agency_id
        ORDER BY total_revenue DESC
    `);
    return rows as unknown as any[];
}

export async function getAgencyById(id: number) {
    const { rows } = await db.execute({ sql: 'SELECT * FROM agencies WHERE id = ?', args: [id] });
    return rows[0] as unknown as any;
}

export async function getAgencyClients(agencyId: number) {
    const { rows } = await db.execute({
        sql: `SELECT c.*, COALESCE(p.total, 0) as total_projects,
              COALESCE(rev.paid, 0) as total_paid
              FROM clients c
              LEFT JOIN (SELECT client_id, COUNT(*) as total FROM projects GROUP BY client_id) p ON c.id = p.client_id
              LEFT JOIN (SELECT c2.id, SUM(CASE WHEN pay.status = 'paid' THEN pay.amount ELSE 0 END) as paid FROM clients c2 JOIN projects pr ON c2.id = pr.client_id LEFT JOIN payments pay ON pr.id = pay.project_id GROUP BY c2.id) rev ON c.id = rev.id
              WHERE c.agency_id = ? ORDER BY c.created_at DESC`,
        args: [agencyId]
    });
    return rows as unknown as any[];
}
