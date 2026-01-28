'use server';

import { turso as db } from '@/lib/turso';
import { revalidatePath } from 'next/cache';
import { SocialAccount, SocialPost } from '@/types';

export async function getSocialAccounts(): Promise<SocialAccount[]> {
    const { rows } = await db.execute('SELECT * FROM social_accounts ORDER BY connected_at DESC');
    return rows as unknown as SocialAccount[];
}

export async function getSocialPosts(): Promise<SocialPost[]> {
    const { rows } = await db.execute(`
        SELECT p.*, a.platform, a.handle, a.avatar_url 
        FROM social_posts p
        JOIN social_accounts a ON p.account_id = a.id
        ORDER BY p.scheduled_date ASC
    `);

    // Map joined fields to nested account object if needed, or just return flattened
    // For now returning as is, but we might need to map manualy if we want strict typing structure
    return rows.map((row: any) => ({
        ...row,
        account: {
            id: row.account_id,
            platform: row.platform,
            handle: row.handle,
            avatar_url: row.avatar_url
        }
    })) as SocialPost[];
}

// Simulated Connect for Phase 1
export async function connectSocialAccount(platform: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockData = {
        instagram: { handle: '@defcon_agency', avatar: 'https://ui-avatars.com/api/?name=DA&background=E1306C&color=fff' },
        linkedin: { handle: 'Defcon Corp', avatar: 'https://ui-avatars.com/api/?name=DC&background=0ca0ce&color=fff' },
        facebook: { handle: 'Defcon Official', avatar: 'https://ui-avatars.com/api/?name=DO&background=1877F2&color=fff' }
    };

    const data = mockData[platform as keyof typeof mockData];

    await db.execute({
        sql: 'INSERT INTO social_accounts (platform, handle, avatar_url) VALUES (?, ?, ?)',
        args: [platform, data.handle, data.avatar]
    });

    revalidatePath('/social');
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

export async function updateSocialPost(id: number, scheduledDate: string) {
    await db.execute({
        sql: 'UPDATE social_posts SET scheduled_date = ? WHERE id = ?',
        args: [scheduledDate, id]
    });
    revalidatePath('/social');
}
