'use server';

import { db } from './utils';
import { revalidatePath } from 'next/cache';
import { AvailabilitySlot, AvailabilityRequest } from '@/types';

export async function getAvailabilitySlots() {
    try {
        await db.execute(`CREATE TABLE IF NOT EXISTS availability_slots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            is_booked INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            coverage_type TEXT DEFAULT 'full'
        )`);
        const { rows } = await db.execute('SELECT * FROM availability_slots ORDER BY start_time ASC');
        return rows as unknown as AvailabilitySlot[];
    } catch (e) {
        console.error('Failed to get availability slots:', e);
        return [] as AvailabilitySlot[];
    }
}

export async function createAvailabilitySlot(start: string, end: string, coverageType: string = 'full') {
    try {
        try { await db.execute("ALTER TABLE availability_slots ADD COLUMN coverage_type TEXT DEFAULT 'full'"); } catch (e) { }
        await db.execute({
            sql: 'INSERT INTO availability_slots (start_time, end_time, is_booked, coverage_type) VALUES (?, ?, 0, ?)',
            args: [start, end, coverageType]
        });
        revalidatePath('/availability');
    } catch (e) { console.error('createAvailabilitySlot error:', e); }
}

export async function updateAvailabilitySlot(id: number, start: string, end: string, coverageType: string = 'full') {
    try {
        try { await db.execute("ALTER TABLE availability_slots ADD COLUMN coverage_type TEXT DEFAULT 'full'"); } catch (e) { }
        await db.execute({
            sql: 'UPDATE availability_slots SET start_time = ?, end_time = ?, coverage_type = ? WHERE id = ?',
            args: [start, end, coverageType, id]
        });
        revalidatePath('/availability');
    } catch (e) { console.error('updateAvailabilitySlot error:', e); }
}

export async function deleteAvailabilitySlot(id: number) {
    try {
        const slotRes = await db.execute({ sql: 'SELECT start_time, end_time FROM availability_slots WHERE id = ?', args: [id] });
        if (slotRes.rows.length > 0) {
            const slot = slotRes.rows[0] as any;
            await db.execute({
                sql: `DELETE FROM shoots WHERE shoot_date = ? AND start_time = ? AND end_time = ? AND status = 'Confirmed'`,
                args: [slot.start_time?.split(' ')[0], slot.start_time?.split(' ')[1], slot.end_time?.split(' ')[1]]
            });
        }
        await db.execute({ sql: 'DELETE FROM availability_slots WHERE id = ?', args: [id] });
        revalidatePath('/availability');
    } catch (e) { console.error('deleteAvailabilitySlot error:', e); }
}

export async function requestAvailabilitySlot(formData: FormData) {
    const slotId = Number(formData.get('slotId'));
    const agencyId = Number(formData.get('agencyId'));
    const notes = formData.get('notes') as string;
    const clientId = formData.get('clientId') ? Number(formData.get('clientId')) : null;
    if (!slotId || !agencyId) return;
    await db.execute({
        sql: 'INSERT INTO availability_requests (slot_id, agency_id, client_id, notes, status) VALUES (?, ?, ?, ?, ?)',
        args: [slotId, agencyId, clientId, notes || '', 'pending']
    });
    revalidatePath('/availability');
}

export async function getClientsForBooking(agencyId?: number) {
    if (agencyId) {
        const { rows } = await db.execute({ sql: 'SELECT id, name, company_name FROM clients WHERE agency_id = ? ORDER BY company_name ASC', args: [agencyId] });
        return rows as unknown as any[];
    }
    const { rows } = await db.execute('SELECT id, name, company_name FROM clients ORDER BY company_name ASC');
    return rows as unknown as any[];
}

export async function requestShoot(title: string, date: string, start: string, end: string, agencyId: number, clientId?: number | string) {
    try {
        let finalClientId: number | null = null;
        if (clientId && clientId !== '') {
            const parsedId = typeof clientId === 'string' ? parseInt(clientId, 10) : clientId;
            if (!isNaN(parsedId) && parsedId > 0) {
                const { rows: clients } = await db.execute({ sql: 'SELECT id FROM clients WHERE id = ?', args: [parsedId] });
                if (clients.length > 0) finalClientId = parsedId;
            }
        }

        if (!finalClientId) {
            const { rows: agencyClients } = await db.execute({ sql: 'SELECT id FROM clients WHERE agency_id = ?', args: [agencyId] });
            if (agencyClients.length > 0) {
                finalClientId = (agencyClients[0] as any).id as number;
            } else {
                const { rows: agencyInfo } = await db.execute({ sql: 'SELECT name FROM agencies WHERE id = ?', args: [agencyId] });
                const agencyName = (agencyInfo[0] as any)?.name || 'Agency';
                await db.execute({
                    sql: "INSERT INTO clients (name, company_name, plan, status, agency_id) VALUES (?, ?, 'Custom', 'Active', ?)",
                    args: [`${agencyName} Default`, agencyName, agencyId]
                });
                const idRes = await db.execute('SELECT last_insert_rowid() as id');
                finalClientId = Number(idRes.rows[0].id);
            }
        }

        const startTime = start.includes(' ') ? `${new Date(start).toTimeString().substring(0, 5)}` : start;
        const endTime = end.includes(' ') ? `${new Date(end).toTimeString().substring(0, 5)}` : end;

        await db.execute({
            sql: "INSERT INTO shoots (client_id, title, shoot_date, start_time, end_time, status, agency_id) VALUES (?, ?, ?, ?, ?, 'Pending', ?)",
            args: [finalClientId, title || 'Shoot', date, startTime, endTime, agencyId]
        });

        revalidatePath('/availability');
        return { success: true };
    } catch (e) {
        console.error('requestShoot error:', e);
        return { success: false, error: 'Failed to create shoot request' };
    }
}

export async function getAvailabilityRequests(agencyId?: number) {
    let sql = `
        SELECT ar.*, a.name as agency_name, a.color as agency_color,
        c.company_name as client_name,
        ast.start_time, ast.end_time
        FROM availability_requests ar
        LEFT JOIN agencies a ON ar.agency_id = a.id
        LEFT JOIN clients c ON ar.client_id = c.id
        LEFT JOIN availability_slots ast ON ar.slot_id = ast.id
    `;
    const args: any[] = [];
    if (agencyId) { sql += ' WHERE ar.agency_id = ?'; args.push(agencyId); }
    sql += ' ORDER BY ar.created_at DESC';
    const { rows } = await db.execute({ sql, args: args as any[] });
    return rows as unknown as AvailabilityRequest[];
}

export async function updateAvailabilityRequest(formData: FormData) {
    const id = Number(formData.get('id'));
    const status = formData.get('status') as string;
    const slotId = Number(formData.get('slotId'));
    if (!id || !status) return;

    await db.execute({ sql: 'UPDATE availability_requests SET status = ? WHERE id = ?', args: [status, id] });
    if (status === 'approved' && slotId) {
        await db.execute({ sql: 'UPDATE availability_slots SET is_booked = 1 WHERE id = ?', args: [slotId] });
    } else if (status === 'rejected' && slotId) {
        await db.execute({ sql: 'UPDATE availability_slots SET is_booked = 0 WHERE id = ?', args: [slotId] });
    }
    revalidatePath('/availability');
}

// --- AUTH ---

export async function signInAction(provider: string, clientId?: number) {
    const { signIn } = await import('@/auth');
    await signIn(provider, { redirectTo: clientId ? `/portal/projects?clientId=${clientId}` : '/' });
}

export async function clientLogout() {
    const { signOut } = await import('@/auth');
    await signOut({ redirectTo: '/portal/login' });
}
