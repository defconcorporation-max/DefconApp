import { turso } from '@/lib/turso';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Consolidated migration endpoint.
 * Runs all schema migrations idempotently (safe to call multiple times).
 * Replaces: /api/fix-shoots-schema, /api/fix-team-schema, /api/fix-team-schema-force, /api/migrate-agencies
 */
export async function GET() {
    const results: string[] = [];

    try {
        // ── Notifications ──
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
        results.push('✓ notifications table');

        // ── Settings ──
        await turso.execute(`
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tax_tps_rate REAL DEFAULT 5.0,
                tax_tvq_rate REAL DEFAULT 9.975
            )
        `);
        const { rows } = await turso.execute('SELECT count(*) as count FROM settings');
        if (rows[0].count === 0) {
            await turso.execute('INSERT INTO settings (id, tax_tps_rate, tax_tvq_rate) VALUES (1, 5.0, 9.975)');
            results.push('✓ settings table (seeded defaults)');
        } else {
            results.push('✓ settings table (already has data)');
        }

        // ── Team Members ──
        await turso.execute(`
            CREATE TABLE IF NOT EXISTS team_members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                role TEXT,
                email TEXT,
                phone TEXT,
                hourly_rate REAL DEFAULT 0,
                color TEXT DEFAULT 'indigo',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        results.push('✓ team_members table');

        // ── Shoot Assignments ──
        await turso.execute(`
            CREATE TABLE IF NOT EXISTS shoot_assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shoot_id INTEGER NOT NULL,
                member_id INTEGER NOT NULL,
                role TEXT,
                FOREIGN KEY(shoot_id) REFERENCES shoots(id) ON DELETE CASCADE,
                FOREIGN KEY(member_id) REFERENCES team_members(id) ON DELETE CASCADE
            )
        `);
        results.push('✓ shoot_assignments table');

        // ── Team Availability ──
        await turso.execute(`
            CREATE TABLE IF NOT EXISTS team_availability (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                member_id INTEGER NOT NULL,
                date DATE NOT NULL,
                status TEXT,
                note TEXT,
                FOREIGN KEY(member_id) REFERENCES team_members(id) ON DELETE CASCADE
            )
        `);
        results.push('✓ team_availability table');

        // ── Agencies ──
        await turso.execute(`
            CREATE TABLE IF NOT EXISTS agencies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                color TEXT NOT NULL
            )
        `);
        results.push('✓ agencies table');

        // ── Pipeline Stages ──
        await turso.execute(`
            CREATE TABLE IF NOT EXISTS pipeline_stages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                label TEXT NOT NULL,
                value TEXT NOT NULL,
                color TEXT DEFAULT 'bg-gray-500',
                order_index INTEGER DEFAULT 0
            )
        `);
        results.push('✓ pipeline_stages table');

        // ── Client Feedback (Post-Production Reviews) ──
        await turso.execute(`
            CREATE TABLE IF NOT EXISTS client_feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                feedback TEXT NOT NULL,
                is_resolved BOOLEAN DEFAULT 0,
                admin_comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(project_id) REFERENCES post_prod_projects(id) ON DELETE CASCADE
            )
        `);
        results.push('✓ client_feedback table');

        // ── Actors ──
        await turso.execute(`
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
        results.push('✓ actors table');

        // Add profile_picture column (safe)
        try {
            await turso.execute('ALTER TABLE actors ADD COLUMN profile_picture TEXT');
            results.push('✓ actors.profile_picture column added');
        } catch {
            results.push('· actors.profile_picture already exists');
        }

        // ── Actor-Client assignments ──
        await turso.execute(`
            CREATE TABLE IF NOT EXISTS actor_clients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                actor_id INTEGER NOT NULL,
                client_id INTEGER NOT NULL,
                FOREIGN KEY(actor_id) REFERENCES actors(id) ON DELETE CASCADE,
                FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
            )
        `);
        results.push('✓ actor_clients table');

        // ── Actor Portfolio (uploaded media) ──
        await turso.execute(`
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
        results.push('✓ actor_portfolio table');

        // ── Public Shoot Requests ──
        await turso.execute(`
            CREATE TABLE IF NOT EXISTS public_shoot_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_name TEXT NOT NULL,
                email TEXT NOT NULL,
                project_type TEXT NOT NULL,
                shoot_date TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                additional_info TEXT,
                status TEXT DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        results.push('✓ public_shoot_requests table');

        // ── Add agency_id to clients (safe) ──
        try {
            await turso.execute('ALTER TABLE clients ADD COLUMN agency_id INTEGER');
            results.push('✓ clients.agency_id column added');
        } catch {
            results.push('· clients.agency_id already exists');
        }

        return NextResponse.json({
            success: true,
            message: 'All migrations completed successfully.',
            results,
        });
    } catch (error) {
        console.error('Migration failed:', error);
        return NextResponse.json({ success: false, error: String(error), results }, { status: 500 });
    }
}
