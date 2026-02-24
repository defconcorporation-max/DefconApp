'use server';

import { turso as db } from '@/lib/turso';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';

export async function generateReviewLink(projectId: number) {
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
    const { rows } = await db.execute({
        sql: 'SELECT id FROM post_prod_projects WHERE review_token = ?',
        args: [token]
    });

    if (rows.length === 0) throw new Error('Invalid review token');
    const projectId = rows[0].id as number;

    const status = decision === 'Approved' ? 'Approved' : 'In Review';

    await db.execute({
        sql: "UPDATE post_prod_projects SET status = ? WHERE id = ?",
        args: [status, projectId]
    });

    // Save feedback items (split by newlines for individual items, or save as single block)
    if (feedback && feedback.trim()) {
        // Create the table if it doesn't exist yet (safe for first-time use)
        try {
            await db.execute(`
                CREATE TABLE IF NOT EXISTS client_feedback (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_id INTEGER NOT NULL,
                    feedback TEXT NOT NULL,
                    is_resolved BOOLEAN DEFAULT 0,
                    admin_comment TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
        } catch { } // Table likely already exists

        // Split feedback by newlines to create individual items
        const items = feedback.split('\n').filter(line => line.trim().length > 0);
        for (const item of items) {
            await db.execute({
                sql: 'INSERT INTO client_feedback (project_id, feedback) VALUES (?, ?)',
                args: [projectId, item.trim()]
            });
        }
    }

    revalidatePath(`/post-production/${projectId}`);
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

    // Get all feedback for this project
    const { rows: feedbackItems } = await db.execute({
        sql: 'SELECT * FROM client_feedback WHERE project_id = ? ORDER BY created_at DESC',
        args: [project.id]
    });

    const latestVersion = versions[0] as any;

    return { project, latestVersion, feedbackItems: feedbackItems as any[] };
}

// ── Admin-side feedback actions ──

export async function getProjectFeedback(projectId: number) {
    try {
        const { rows } = await db.execute({
            sql: 'SELECT * FROM client_feedback WHERE project_id = ? ORDER BY created_at DESC',
            args: [projectId]
        });
        return rows as any[];
    } catch {
        return [];
    }
}

export async function resolveFeedbackItem(feedbackId: number, adminComment?: string) {
    await db.execute({
        sql: 'UPDATE client_feedback SET is_resolved = 1, admin_comment = ? WHERE id = ?',
        args: [adminComment || null, feedbackId]
    });
    revalidatePath('/post-production');
}

export async function unresolveFeedbackItem(feedbackId: number) {
    await db.execute({
        sql: 'UPDATE client_feedback SET is_resolved = 0 WHERE id = ?',
        args: [feedbackId]
    });
    revalidatePath('/post-production');
}
