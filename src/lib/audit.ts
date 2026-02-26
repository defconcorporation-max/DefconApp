'use server';

import { createClient } from '@libsql/client';

const client = createClient({
    url: process.env.TURSO_DATABASE_URL as string,
    authToken: process.env.TURSO_AUTH_TOKEN as string,
});

export interface AuditLogData {
    companyId?: number;
    userId?: number;
    entityType: 'shoot' | 'project' | 'client' | 'team_member' | 'actor' | 'agency' | 'deliverable';
    entityId: number;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'LOGIN' | 'EXPORT';
    details?: string;
}

export async function logAudit(data: AuditLogData) {
    try {
        console.log(`[Audit] Logging ${data.action} on ${data.entityType} ${data.entityId}: ${data.details || ''}`);

        await client.execute({
            sql: `
                INSERT INTO audit_logs (company_id, user_id, entity_type, entity_id, action, details)
                VALUES (?, ?, ?, ?, ?, ?)
            `,
            args: [
                data.companyId || 1, // Defaulting to 1 for Multi-Company mode if not supplied
                data.userId || null,
                data.entityType,
                data.entityId,
                data.action,
                data.details || null
            ]
        });

        return true;
    } catch (error) {
        console.error('[Audit] Failed to log:', error);
        return false;
    }
}

// Helper to track field changes on update and generate detail string
export function generateChangeDetails(oldData: any, newData: any, ignoreFields: string[] = ['updated_at', 'id']): string {
    const changes: string[] = [];

    // Compare new keys against old
    Object.keys(newData).forEach(key => {
        if (!ignoreFields.includes(key)) {
            const oldVal = oldData[key];
            const newVal = newData[key];

            // Loose inequality to catch 1 vs '1', null vs undefined etc. where it matters
            if (oldVal !== newVal && JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                changes.push(`${key} changed from '${oldVal}' to '${newVal}'`);
            }
        }
    });

    return changes.join(' | ');
}
