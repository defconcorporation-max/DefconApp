'use server';

import { turso as db } from '@/lib/turso';
import { revalidatePath } from 'next/cache';
import { SocialAccount, SocialPost } from '@/types';

export async function getSocialAccounts(clientId?: number): Promise<SocialAccount[]> {
    let query = 'SELECT * FROM social_accounts';
    const args: any[] = [];

    if (clientId) {
        query += ' WHERE client_id = ?';
        args.push(clientId);
    }

    query += ' ORDER BY connected_at DESC';

    const { rows } = await db.execute({ sql: query, args });
    return rows as unknown as SocialAccount[];
}

export async function getSocialPosts(clientId?: number): Promise<SocialPost[]> {
    let query = `
        SELECT p.*, a.platform, a.handle, a.avatar_url, a.client_id
        FROM social_posts p
        JOIN social_accounts a ON p.account_id = a.id
    `;
    const args: any[] = [];

    if (clientId) {
        query += ' WHERE a.client_id = ?';
        args.push(clientId);
    }

    query += ' ORDER BY p.scheduled_date ASC';

    const { rows } = await db.execute({ sql: query, args });

    // Map joined fields to nested account object if needed, or just return flattened
    // For now returning as is, but we might need to map manualy if we want strict typing structure
    return rows.map((row: any) => ({
        ...row,
        account: {
            id: row.account_id,
            platform: row.platform,
            handle: row.handle,
            avatar_url: row.avatar_url,
            client_id: row.client_id
        }
    })) as SocialPost[];
}

// Simulated Connect for Phase 1
export async function connectSocialAccount(platform: string, clientId?: number) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockData = {
        instagram: { handle: '@defcon_agency', avatar: 'https://ui-avatars.com/api/?name=DA&background=E1306C&color=fff' },
        linkedin: { handle: 'Defcon Corp', avatar: 'https://ui-avatars.com/api/?name=DC&background=0ca0ce&color=fff' },
        facebook: { handle: 'Defcon Official', avatar: 'https://ui-avatars.com/api/?name=DO&background=1877F2&color=fff' }
    };

    const data = mockData[platform as keyof typeof mockData];
    // If client ID is provided, append it to handle to simulate different accounts
    const handle = clientId ? `${data.handle}_${clientId}` : data.handle;

    await db.execute({
        sql: 'INSERT INTO social_accounts (platform, handle, avatar_url, client_id) VALUES (?, ?, ?, ?)',
        args: [platform, handle, data.avatar, clientId || null]
    });

    revalidatePath('/social');
    if (clientId) revalidatePath(`/clients/${clientId}`);
}

export async function createSocialPost(formData: FormData) {
    const accountId = Number(formData.get('accountId'));
    const content = formData.get('content') as string;
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    const scheduledDate = `${date}T${time}:00`;

    await db.execute({
        sql: 'INSERT INTO social_posts (account_id, content, scheduled_date, status) VALUES (?, ?, ?, ?)',
        args: [accountId, content, scheduledDate, 'Scheduled']
    });

    revalidatePath('/social');
}

export async function deleteSocialPost(id: number) {
    await db.execute({
        sql: 'DELETE FROM social_posts WHERE id = ?',
        args: [id]
    });
    revalidatePath('/social');
}

export async function updateSocialPost(id: number, scheduledDate: string, content?: string) {
    if (content) {
        await db.execute({
            sql: 'UPDATE social_posts SET scheduled_date = ?, content = ? WHERE id = ?',
            args: [scheduledDate, content, id]
        });
    } else {
        await db.execute({
            sql: 'UPDATE social_posts SET scheduled_date = ? WHERE id = ?',
            args: [scheduledDate, id]
        });
    }
    revalidatePath('/social');
}
