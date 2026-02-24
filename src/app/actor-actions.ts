'use server';

import { turso as db } from '@/lib/turso';
import { revalidatePath } from 'next/cache';

// ── Ensure table exists ──
async function ensureActorsTable() {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS actors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT,
                email TEXT,
                availability TEXT,
                potential_conflicts TEXT,
                remuneration_per_shoot REAL DEFAULT 0,
                instagram TEXT,
                facebook TEXT,
                tiktok TEXT,
                additional_info TEXT,
                location TEXT,
                portfolio_urls TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await db.execute(`
            CREATE TABLE IF NOT EXISTS actor_clients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                actor_id INTEGER NOT NULL,
                client_id INTEGER NOT NULL,
                FOREIGN KEY(actor_id) REFERENCES actors(id) ON DELETE CASCADE,
                FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
            )
        `);
    } catch { }
}

// ── CRUD ──

export async function getActors() {
    await ensureActorsTable();
    const { rows } = await db.execute('SELECT * FROM actors ORDER BY name ASC');
    return rows as any[];
}

export async function getActor(id: number) {
    await ensureActorsTable();
    const { rows } = await db.execute({ sql: 'SELECT * FROM actors WHERE id = ?', args: [id] });
    return rows[0] as any || null;
}

export async function createActor(formData: FormData) {
    await ensureActorsTable();
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string || '';
    const email = formData.get('email') as string || '';
    const availability = formData.get('availability') as string || '';
    const conflicts = formData.get('potential_conflicts') as string || '';
    const remuneration = Number(formData.get('remuneration_per_shoot') || 0);
    const instagram = formData.get('instagram') as string || '';
    const facebook = formData.get('facebook') as string || '';
    const tiktok = formData.get('tiktok') as string || '';
    const additionalInfo = formData.get('additional_info') as string || '';
    const location = formData.get('location') as string || '';
    const portfolioUrls = formData.get('portfolio_urls') as string || '';

    await db.execute({
        sql: `INSERT INTO actors (name, phone, email, availability, potential_conflicts, remuneration_per_shoot, instagram, facebook, tiktok, additional_info, location, portfolio_urls)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [name, phone, email, availability, conflicts, remuneration, instagram, facebook, tiktok, additionalInfo, location, portfolioUrls]
    });

    revalidatePath('/actors');
}

export async function updateActor(formData: FormData) {
    const id = Number(formData.get('id'));
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string || '';
    const email = formData.get('email') as string || '';
    const availability = formData.get('availability') as string || '';
    const conflicts = formData.get('potential_conflicts') as string || '';
    const remuneration = Number(formData.get('remuneration_per_shoot') || 0);
    const instagram = formData.get('instagram') as string || '';
    const facebook = formData.get('facebook') as string || '';
    const tiktok = formData.get('tiktok') as string || '';
    const additionalInfo = formData.get('additional_info') as string || '';
    const location = formData.get('location') as string || '';
    const portfolioUrls = formData.get('portfolio_urls') as string || '';

    await db.execute({
        sql: `UPDATE actors SET name=?, phone=?, email=?, availability=?, potential_conflicts=?, remuneration_per_shoot=?, instagram=?, facebook=?, tiktok=?, additional_info=?, location=?, portfolio_urls=? WHERE id=?`,
        args: [name, phone, email, availability, conflicts, remuneration, instagram, facebook, tiktok, additionalInfo, location, portfolioUrls, id]
    });

    revalidatePath('/actors');
    revalidatePath(`/actors/${id}`);
}

export async function deleteActor(id: number) {
    await db.execute({ sql: 'DELETE FROM actors WHERE id = ?', args: [id] });
    revalidatePath('/actors');
}

export async function updateActorProfilePicture(actorId: number, url: string) {
    await db.execute({
        sql: 'UPDATE actors SET profile_picture = ? WHERE id = ?',
        args: [url, actorId]
    });
    revalidatePath('/actors');
    revalidatePath(`/actors/${actorId}`);
    revalidatePath(`/actors/${actorId}/share`);
}

// ── Client associations ──

export async function getActorClients(actorId: number) {
    const { rows } = await db.execute({
        sql: `SELECT c.id, c.name, c.company_name FROM actor_clients ac
              JOIN clients c ON ac.client_id = c.id
              WHERE ac.actor_id = ?`,
        args: [actorId]
    });
    return rows as any[];
}

export async function addActorClient(actorId: number, clientId: number) {
    await db.execute({
        sql: 'INSERT INTO actor_clients (actor_id, client_id) VALUES (?, ?)',
        args: [actorId, clientId]
    });
    revalidatePath(`/actors/${actorId}`);
}

export async function removeActorClient(actorId: number, clientId: number) {
    await db.execute({
        sql: 'DELETE FROM actor_clients WHERE actor_id = ? AND client_id = ?',
        args: [actorId, clientId]
    });
    revalidatePath(`/actors/${actorId}`);
}

// ── Portfolio media ──

export async function getActorPortfolio(actorId: number) {
    try {
        const { rows } = await db.execute({
            sql: 'SELECT * FROM actor_portfolio WHERE actor_id = ? ORDER BY created_at DESC',
            args: [actorId]
        });
        return rows as any[];
    } catch {
        return [];
    }
}

export async function addPortfolioItem(actorId: number, url: string, fileType: string, fileName: string) {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS actor_portfolio (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                actor_id INTEGER NOT NULL,
                url TEXT NOT NULL,
                file_type TEXT NOT NULL,
                file_name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(actor_id) REFERENCES actors(id) ON DELETE CASCADE
            )
        `);
    } catch { }

    await db.execute({
        sql: 'INSERT INTO actor_portfolio (actor_id, url, file_type, file_name) VALUES (?, ?, ?, ?)',
        args: [actorId, url, fileType, fileName]
    });
    revalidatePath(`/actors/${actorId}`);
    revalidatePath(`/actors/${actorId}/share`);
}

export async function deletePortfolioItem(id: number) {
    const { rows } = await db.execute({ sql: 'SELECT actor_id FROM actor_portfolio WHERE id = ?', args: [id] });
    await db.execute({ sql: 'DELETE FROM actor_portfolio WHERE id = ?', args: [id] });
    if (rows[0]) {
        const actorId = rows[0].actor_id;
        revalidatePath(`/actors/${actorId}`);
        revalidatePath(`/actors/${actorId}/share`);
    }
}
