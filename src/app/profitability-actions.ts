'use server';

import { createClient } from '@libsql/client';
import { revalidatePath } from 'next/cache';

const client = createClient({
    url: process.env.TURSO_DATABASE_URL as string,
    authToken: process.env.TURSO_AUTH_TOKEN as string,
});

export async function recalculateProjectProfitability(projectId: string) {
    try {
        console.log(`[Profitability] Recalculating for Project: ${projectId}`);
        // 1. Get all shoots for this project
        const shootsResult = await client.execute({
            sql: `SELECT internal_cost, external_cost, gear_cost, revenue FROM shoots WHERE project_id = ?`,
            args: [projectId]
        });

        let totalRevenue = 0;
        let totalCost = 0;

        for (const shoot of shootsResult.rows) {
            totalRevenue += (shoot.revenue as number) || 0;
            totalCost += ((shoot.internal_cost as number) || 0) + ((shoot.external_cost as number) || 0) + ((shoot.gear_cost as number) || 0);
        }

        const totalMargin = totalRevenue - totalCost;
        let marginPercentage = 0;
        if (totalRevenue > 0) {
            marginPercentage = (totalMargin / totalRevenue) * 100;
        }

        // 2. Update the project
        await client.execute({
            sql: `UPDATE projects 
                  SET total_revenue = ?, total_cost = ?, total_margin = ?, margin_percentage = ?
                  WHERE id = ?`,
            args: [totalRevenue, totalCost, totalMargin, marginPercentage, projectId]
        });

        console.log(`[Profitability] Project ${projectId} financials updated. Revenue: ${totalRevenue}, Cost: ${totalCost}, Margin: ${marginPercentage}%`);
        return true;
    } catch (error) {
        console.error('[Profitability] Error recalculating project profitability:', error);
        return false;
    }
}

export async function updateShootFinancials(
    shootId: string,
    data: {
        estimated_hours?: number;
        actual_hours?: number;
        internal_cost?: number;
        external_cost?: number;
        gear_cost?: number;
        revenue?: number;
    }
) {
    try {
        console.log(`[Profitability] Updating financials for shoot ${shootId}`);
        const fields: string[] = [];
        const args: any[] = [];

        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
                fields.push(`${key} = ?`);
                args.push(value);
            }
        });

        if (fields.length === 0) return { success: true }; // Nothing to update

        args.push(shootId);

        await client.execute({
            sql: `UPDATE shoots SET ${fields.join(', ')} WHERE id = ?`,
            args
        });

        // Get the project ID for this shoot to recalculate
        const shootRes = await client.execute({
            sql: `SELECT project_id FROM shoots WHERE id = ?`,
            args: [shootId]
        });

        const projectId = shootRes.rows[0]?.project_id;

        if (projectId) {
            await recalculateProjectProfitability(projectId as string);
        }

        revalidatePath(`/shoots/${shootId}`);
        if (projectId) {
            revalidatePath(`/projects/${projectId}`);
        }

        return { success: true };
    } catch (error) {
        console.error('[Profitability] Error updating shoot financials:', error);
        return { success: false, error: 'Failed to update shoot financials' };
    }
}
