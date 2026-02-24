import { turso } from '@/lib/turso';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('--- Creating analytics & notifications schema on Vercel ---');

        await turso.execute(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                message TEXT NOT NULL,
                link TEXT,
                is_read BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('--- Creating settings table on Vercel ---');
        await turso.execute(`
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tax_tps_rate REAL DEFAULT 5.0,
                tax_tvq_rate REAL DEFAULT 9.975
            )
        `);

        // Seed settings if empty
        const { rows } = await turso.execute('SELECT count(*) as count FROM settings');
        if (rows[0].count === 0) {
            await turso.execute('INSERT INTO settings (id, tax_tps_rate, tax_tvq_rate) VALUES (1, 5.0, 9.975)');
        }

        return NextResponse.json({
            success: true,
            message: 'Notifications AND Settings tables created/verified. Settings page should no longer crash.'
        });
    } catch (error) {
        console.error('Migration failed:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
