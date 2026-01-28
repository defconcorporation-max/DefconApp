'use server';

import { turso as db } from '@/lib/turso';
import bcrypt from 'bcryptjs';
import { encrypt } from '@/lib/auth-utils';
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Client } from '@/types';

export async function clientLogin(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { rows } = await db.execute({
        sql: 'SELECT * FROM clients WHERE email = ?',
        args: [email]
    });

    const client = rows[0] as unknown as Client;

    if (!client) {
        return { error: 'Invalid credentials' };
    }

    if (!client.portal_enabled) {
        return { error: 'Portal access is not enabled for this account.' };
    }

    if (!client.password_hash) {
        return { error: 'Account setup incomplete. Please contact support.' };
    }

    const passwordsMatch = await bcrypt.compare(password, client.password_hash);
    if (!passwordsMatch) {
        return { error: 'Invalid credentials' };
    }

    // Create session specifically for CLIENT
    // We add a 'type: client' to distinguish from admin users
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 week
    const session = await encrypt({
        client: { id: client.id, email: client.email, name: client.name, company: client.company_name },
        type: 'client',
        expires
    });

    (await cookies()).set('client_session', session, { expires, httpOnly: true });

    return { success: true };
}

export async function clientLogout() {
    (await cookies()).delete('client_session');
    redirect('/portal/login');
}

export async function getClientPortalData(clientId: number) {
    // 1. Get Client Info
    const { rows: clientRows } = await db.execute({
        sql: 'SELECT * FROM clients WHERE id = ?',
        args: [clientId]
    });
    const client = clientRows[0] as unknown as Client;

    // 2. Get Projects
    const { rows: projects } = await db.execute({
        sql: 'SELECT * FROM projects WHERE client_id = ? ORDER BY created_at DESC',
        args: [clientId]
    });

    // 3. Get Invoices (Payments table for now, or expenses? Need to check Invoicing schema)
    // Based on previous tasks, we might not have a dedicated 'Invoices' table yet, 
    // but we have 'payments' or we generate invoices on fly from Projects used in Finance.
    // Let's assume we show Projects and let them see details there for now.

    return { client, projects };
}
