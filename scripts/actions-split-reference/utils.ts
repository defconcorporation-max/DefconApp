'use server';

import { turso as db } from '@/lib/turso';
import { auth } from '@/auth';

export { db };

export async function getAgencyFilter() {
    const session = await auth();
    const userRole = session?.user?.role;
    const agencyId = session?.user?.agency_id;

    if (userRole === 'AgencyAdmin' || userRole === 'AgencyTeam') {
        if (!agencyId) throw new Error('User has agency role but no agency ID');
        return agencyId;
    }
    return null;
}

export async function ensureActivityTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            description TEXT NOT NULL,
            entity_id INTEGER,
            entity_type TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            meta TEXT
        )
    `);
}

export async function logActivity(type: string, description: string, entityId?: number, entityType?: string, meta?: any) {
    try {
        await ensureActivityTable();
        await db.execute({
            sql: 'INSERT INTO activities (type, description, entity_id, entity_type, meta) VALUES (?, ?, ?, ?, ?)',
            args: [type, description, entityId || null, entityType || null, meta ? JSON.stringify(meta) : null]
        });
    } catch (e) {
        console.error('Failed to log activity:', e);
    }
}

export async function getActivities(limit = 20) {
    try {
        await ensureActivityTable();
        const { rows } = await db.execute({
            sql: 'SELECT * FROM activities ORDER BY created_at DESC LIMIT ?',
            args: [limit]
        });
        return rows as unknown as any[];
    } catch (e) {
        console.error('Failed to fetch activities:', e);
        return [];
    }
}
