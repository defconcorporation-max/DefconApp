'use server';

import { db, getAgencyFilter, logActivity } from './utils';
import { revalidatePath } from 'next/cache';
import { Client } from '@/types';
import { saveFile } from '@/lib/upload';

export async function getClients(): Promise<Client[]> {
    const agencyId = await getAgencyFilter();
    let sql = 'SELECT * FROM clients';
    const args: any[] = [];

    if (agencyId) {
        sql += ' WHERE agency_id = ?';
        args.push(agencyId);
    }

    sql += ' ORDER BY created_at DESC';

    const { rows } = await db.execute({ sql, args });
    return rows as unknown as Client[];
}

export async function createClient(formData: FormData) {
    const name = formData.get('name') as string;
    const company = formData.get('company') as string;
    const plan = formData.get('plan') as string;
    const status = formData.get('status') as string || 'Active';
    const location = formData.get('location') as string || null;
    const about = formData.get('about') as string || null;
    const website = formData.get('website') as string || null;
    const assigned_team_member_id = formData.get('assigned_team_member_id') ? Number(formData.get('assigned_team_member_id')) : null;

    const rawAgencyId = formData.get('agencyId');
    let finalAgencyId = null;

    if (rawAgencyId === 'NEW') {
        const newAgencyName = formData.get('newAgencyName') as string;
        const newAgencyColor = formData.get('newAgencyColor') as string;
        if (newAgencyName) {
            const agencyRes = await db.execute({
                sql: 'INSERT INTO agencies (name, color) VALUES (?, ?)',
                args: [newAgencyName, newAgencyColor || '#8b5cf6']
            });
            finalAgencyId = Number(agencyRes.lastInsertRowid);
        }
    } else {
        const parsedAgencyId = rawAgencyId ? Number(rawAgencyId) : null;
        finalAgencyId = Number.isFinite(parsedAgencyId) ? parsedAgencyId : null;
    }

    const safeName = (company || name).replace(/[^a-z0-9]/gi, '_').trim();
    let folderPath = '';

    await db.execute({
        sql: 'INSERT INTO clients (name, company_name, plan, status, folder_path, agency_id, location, about, website, assigned_team_member_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [name, company, plan, status, folderPath, finalAgencyId, location, about, website, assigned_team_member_id]
    });

    try {
        await logActivity('CLIENT_CREATED', `New client added: ${company || name}`, Number((await db.execute('SELECT last_insert_rowid() as id')).rows[0].id as unknown as number), 'client');
    } catch (e) { console.error('Log error', e); }

    revalidatePath('/');
}

export async function openClientFolder(folderPath: string) {
    if (!folderPath) return;
}

export async function getClient(id: number): Promise<Client | undefined> {
    const { rows } = await db.execute({
        sql: 'SELECT * FROM clients WHERE id = ?',
        args: [id]
    });
    return (rows[0] as unknown as Client) || undefined;
}

export async function deleteClient(id: number) {
    await db.execute({
        sql: 'DELETE FROM clients WHERE id = ?',
        args: [id]
    });
    try {
        await logActivity('CLIENT_DELETED', `Client deleted`, id, 'client');
    } catch (e) { console.error('Log error', e); }
    revalidatePath('/');
}

export async function updateClient(formData: FormData) {
    const id = Number(formData.get('id'));
    const name = formData.get('name') as string;
    const company = formData.get('company') as string;
    const plan = formData.get('plan') as string;
    const status = formData.get('status') as string || 'Active';
    const location = formData.get('location') as string || null;
    const about = formData.get('about') as string || null;
    const website = formData.get('website') as string || null;
    const assigned_team_member_id = formData.get('assigned_team_member_id') ? Number(formData.get('assigned_team_member_id')) : null;

    const rawAgencyId = formData.get('agencyId');
    let finalAgencyId = null;

    if (rawAgencyId === 'NEW') {
        const newAgencyName = formData.get('newAgencyName') as string;
        const newAgencyColor = formData.get('newAgencyColor') as string;
        if (newAgencyName) {
            const agencyRes = await db.execute({
                sql: 'INSERT INTO agencies (name, color) VALUES (?, ?)',
                args: [newAgencyName, newAgencyColor || '#8b5cf6']
            });
            finalAgencyId = Number(agencyRes.lastInsertRowid);
        }
    } else {
        const parsedAgencyId = rawAgencyId ? Number(rawAgencyId) : null;
        finalAgencyId = Number.isFinite(parsedAgencyId) ? parsedAgencyId : null;
    }

    await db.execute({
        sql: 'UPDATE clients SET name = ?, company_name = ?, plan = ?, status = ?, agency_id = ?, location = ?, about = ?, website = ?, assigned_team_member_id = ? WHERE id = ?',
        args: [name, company, plan, status, finalAgencyId, location, about, website, assigned_team_member_id, id]
    });
    revalidatePath(`/clients/${id}`);
    revalidatePath('/');
}

export async function updateClientValue(clientId: number, value: number) {
    await db.execute({
        sql: 'UPDATE clients SET client_value = ? WHERE id = ?',
        args: [value, clientId]
    });
    revalidatePath(`/clients/${clientId}`);
}

export async function updateClientAvatar(formData: FormData) {
    const clientId = Number(formData.get('clientId'));
    const file = formData.get('file') as File;
    if (!file || !clientId) return;

    try {
        const avatarUrl = await saveFile(file, 'avatars');
        await db.execute({
            sql: 'UPDATE clients SET avatar_url = ? WHERE id = ?',
            args: [avatarUrl, clientId]
        });
        revalidatePath(`/clients/${clientId}`);
        revalidatePath('/');
    } catch (e) {
        console.error("Avatar upload failed:", e);
    }
}

export async function getClientPortalData(clientId: number) {
    const clientRes = await db.execute({ sql: 'SELECT * FROM clients WHERE id = ?', args: [clientId] });
    const projectsRes = await db.execute({ sql: 'SELECT * FROM projects WHERE client_id = ? ORDER BY created_at DESC', args: [clientId] });
    const shootsRes = await db.execute({ sql: "SELECT * FROM shoots WHERE client_id = ? ORDER BY shoot_date DESC LIMIT 5", args: [clientId] });
    return { client: clientRes.rows[0], projects: projectsRes.rows, recentShoots: shootsRes.rows };
}

export async function getClientPortalProject(clientId: number, projectId: number) {
    const projectRes = await db.execute({ sql: "SELECT * FROM projects WHERE client_id = ? AND id = ?", args: [clientId, projectId] });
    if (projectRes.rows.length === 0) return null;
    const project = projectRes.rows[0];

    const shootsRes = await db.execute({ sql: "SELECT * FROM shoots WHERE project_id = ? ORDER BY shoot_date ASC", args: [projectId] });
    const shoots = await Promise.all(shootsRes.rows.map(async (shoot: any) => {
        const vidsRes = await db.execute({ sql: "SELECT * FROM shoot_videos WHERE shoot_id = ?", args: [shoot.id] });
        const videos = await Promise.all(vidsRes.rows.map(async (vid: any) => {
            const notesRes = await db.execute({ sql: "SELECT * FROM shoot_video_notes WHERE video_id = ? ORDER BY created_at DESC", args: [vid.id] });
            return { ...vid, comments: notesRes.rows };
        }));
        return { ...shoot, videos };
    }));

    return { project, shoots };
}

export async function addVideoCommentPortal(formData: FormData) {
    const videoId = Number(formData.get('videoId'));
    const content = formData.get('content') as string;
    const clientId = Number(formData.get('clientId'));
    if (!videoId || !content || !clientId) throw new Error("Missing fields");
    await db.execute({ sql: 'INSERT INTO shoot_video_notes (video_id, content) VALUES (?, ?)', args: [videoId, `[CLIENT]: ${content}`] });
    revalidatePath(`/portal/projects`);
}
