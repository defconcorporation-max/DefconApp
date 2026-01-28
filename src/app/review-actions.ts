'use server';

import { turso as db } from '@/lib/turso';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';

export async function generateReviewLink(projectId: number) {
    // Check if token exists
    const { rows } = await db.execute({
        sql: 'SELECT review_token FROM post_prod_projects WHERE id = ?',
        args: [projectId]
    });

    let token = rows[0]?.review_token as string;

    if (!token) {
        token = randomBytes(32).toString('hex');
        await db.execute({
            sql: 'UPDATE post_prod_projects SET review_token = ? WHERE id = ?',
            args: [token, projectId]
        });
    }

    revalidatePath(`/post-production/${projectId}`);
    return token;
}

export async function submitClientReview(token: string, decision: 'Approved' | 'Changes Requested', feedback: string) {
    // Verify token
    const { rows } = await db.execute({
        sql: 'SELECT id FROM post_prod_projects WHERE review_token = ?',
        args: [token]
    });

    if (rows.length === 0) throw new Error('Invalid review token');
    const projectId = rows[0].id;

    // Update status
    const status = decision === 'Approved' ? 'Approved' : 'In Review';

    // We might want to store the specific feedback in a new table log later, 
    // but for now let's just update the status. Ideally we append to a notes field or tasks?
    // Let's create a new 'Feedback' task or just rely on the editor seeing the status change.
    // Simpler: Just update status.

    await db.execute({
        sql: "UPDATE post_prod_projects SET status = ? WHERE id = ?",
        args: [status, projectId]
    });

    // Ideally notify the editor (e.g. via email or in-app notification)
    console.log(`Project ${projectId} reviewed: ${decision}. Feedback: ${feedback}`);

    return { success: true };
}

export async function getReviewData(token: string) {
    const { rows: projects } = await db.execute({
        sql: `
            SELECT p.*, s.title as shoot_title 
            FROM post_prod_projects p
            JOIN shoots s ON p.shoot_id = s.id
            WHERE p.review_token = ?
        `,
        args: [token]
    });

    if (projects.length === 0) return null;
    const project = projects[0] as any;

    // Get latest version
    const { rows: versions } = await db.execute({
        sql: 'SELECT * FROM post_prod_versions WHERE project_id = ? ORDER BY version_number DESC LIMIT 1',
        args: [project.id]
    });

    const latestVersion = versions[0] as any;

    return { project, latestVersion };
}
