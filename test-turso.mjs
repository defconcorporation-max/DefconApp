import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({ url, authToken });

async function check() {
    console.log("--- Analytics Queries ---");
    try {
        const q1 = `
            SELECT 
                strftime('%Y-%m', shoot_date) as month,
                COUNT(id) as count
            FROM shoots
            WHERE shoot_date >= date('now', '-12 months')
            GROUP BY month
            ORDER BY month ASC
        `;
        await db.execute(q1);
        console.log("q1 success");
    } catch (e) { console.error("q1 error:", e.message) }

    try {
        const q2 = `
        SELECT 
            CASE WHEN c.agency_id IS NULL THEN 'Direct' ELSE a.name END as name,
            COUNT(p.id) as value
        FROM projects p
        JOIN clients c ON p.client_id = c.id
        LEFT JOIN agencies a ON c.agency_id = a.id
        GROUP BY 1
        ORDER BY value DESC
        `;
        await db.execute(q2);
        console.log("q2 success");
    } catch (e) { console.error("q2 error:", e.message) }

    try {
        const q3 = `
            SELECT 
                status as name,
                COUNT(id) as value
            FROM projects
            GROUP BY name
        `;
        await db.execute(q3);
        console.log("q3 success");
    } catch (e) { console.error("q3 error:", e.message) }
}

check();
