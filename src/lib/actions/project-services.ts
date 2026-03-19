'use server';

import { turso as db } from '@/lib/turso';
import { revalidatePath } from 'next/cache';

export async function getProjectServices(projectId: number) {
    try {
        const { rows } = await db.execute({
            sql: 'SELECT * FROM project_services WHERE project_id = ?',
            args: [projectId],
        });
        return rows as unknown as any[];
    } catch (e) {
        console.error('getProjectServices failed (table may not exist):', e);
        return [];
    }
}

export async function addProjectService(formData: FormData) {
    const projectId = Number(formData.get('projectId'));
    const name = formData.get('name') as string;
    const rate = Number(formData.get('rate'));
    const quantity = Number(formData.get('quantity')) || 1;
    const serviceId = formData.get('serviceId') ? Number(formData.get('serviceId')) : null;

    await db.execute({
        sql: 'INSERT INTO project_services (project_id, service_id, name, rate, quantity) VALUES (?, ?, ?, ?, ?)',
        args: [projectId, serviceId, name, rate, quantity],
    });
    revalidatePath(`/projects/${projectId}`);
}

export async function deleteProjectService(formData: FormData) {
    const id = Number(formData.get('id'));
    const projectId = Number(formData.get('projectId'));
    await db.execute({
        sql: 'DELETE FROM project_services WHERE id = ?',
        args: [id],
    });
    revalidatePath(`/projects/${projectId}`);
}

// --- Services catalog (référentiel facturation) ---

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
        args: [name, rate, type],
    });
    revalidatePath('/services');
}

export async function updateService(formData: FormData) {
    const id = Number(formData.get('id'));
    const name = formData.get('name') as string;
    const rate = Number(formData.get('rate'));
    const type = formData.get('type') as string;

    await db.execute({
        sql: 'UPDATE services SET name = ?, default_rate = ?, rate_type = ? WHERE id = ?',
        args: [name, rate, type, id],
    });
    revalidatePath('/services');
}

export async function deleteService(id: number) {
    await db.execute({
        sql: 'DELETE FROM services WHERE id = ?',
        args: [id],
    });
    revalidatePath('/services');
}
