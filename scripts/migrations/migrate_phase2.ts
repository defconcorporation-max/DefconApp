import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = createClient({
    url: process.env.TURSO_DATABASE_URL as string,
    authToken: process.env.TURSO_AUTH_TOKEN as string,
});

async function migrate() {
    console.log("Starting Phase 2 Migration...");

    try {
        // 1. Companies Table (Multi-Company Mode support)
        await client.execute(`
            CREATE TABLE IF NOT EXISTS companies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                subscription_plan TEXT DEFAULT 'free',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Created companies table");

        // 2. Audit Logs
        await client.execute(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id INTEGER,
                user_id INTEGER,
                entity_type TEXT NOT NULL,
                entity_id INTEGER NOT NULL,
                action TEXT NOT NULL,
                details TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Created audit_logs table");

        // 3. Notifications
        await client.execute(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id INTEGER,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                message TEXT,
                type TEXT DEFAULT 'info',
                read INTEGER DEFAULT 0,
                link TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Created notifications table");

        // 4. Deliverables (Client Portal)
        await client.execute(`
            CREATE TABLE IF NOT EXISTS deliverables (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shoot_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                type TEXT,
                url TEXT,
                status TEXT DEFAULT 'pending',
                version INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Created deliverables table");

        // 5. Deliverable Comments
        await client.execute(`
            CREATE TABLE IF NOT EXISTS deliverable_comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                deliverable_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                timecode TEXT,
                resolved INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Created deliverable_comments table");

        // 6. Roles & Permissions (RBAC)
        await client.execute(`
            CREATE TABLE IF NOT EXISTS roles_permissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role_name TEXT NOT NULL UNIQUE,
                permissions JSON NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Created roles_permissions table");

        // 7. Alter existing tables to add Phase 2 columns if they don't exist

        const addColumn = async (table: string, columnDef: string) => {
            try {
                await client.execute(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
                console.log(`✅ Added ${columnDef} to ${table}`);
            } catch (e: any) {
                if (e.message.includes("duplicate column name")) {
                    console.log(`ℹ️ Column ${columnDef.split(' ')[0]} already exists in ${table}, skipping.`);
                } else {
                    console.error(`❌ Failed to add ${columnDef} to ${table}:`, e.message);
                }
            }
        };

        // Users: Multi-Company & Roles
        await addColumn("users", "company_id INTEGER DEFAULT 1");
        await addColumn("users", "role_id INTEGER");

        // Clients: Multi-Company
        await addColumn("clients", "company_id INTEGER DEFAULT 1");

        // Projects: Profitability & Multi-Company
        await addColumn("projects", "company_id INTEGER DEFAULT 1");
        await addColumn("projects", "total_revenue REAL DEFAULT 0");
        await addColumn("projects", "total_cost REAL DEFAULT 0");
        await addColumn("projects", "total_margin REAL DEFAULT 0");
        await addColumn("projects", "margin_percentage REAL DEFAULT 0");

        // Shoots: Profitability & Multi-Company
        await addColumn("shoots", "company_id INTEGER DEFAULT 1");
        await addColumn("shoots", "estimated_hours REAL DEFAULT 0");
        await addColumn("shoots", "actual_hours REAL DEFAULT 0");
        await addColumn("shoots", "internal_cost REAL DEFAULT 0");
        await addColumn("shoots", "external_cost REAL DEFAULT 0");
        await addColumn("shoots", "gear_cost REAL DEFAULT 0");
        await addColumn("shoots", "revenue REAL DEFAULT 0");

        // Team: Scheduling
        await addColumn("team", "max_hours_per_day REAL DEFAULT 8");
        await addColumn("team", "max_hours_per_week REAL DEFAULT 40");

        // Availability: Recurrence
        await addColumn("availability", "is_recurring INTEGER DEFAULT 0");
        await addColumn("availability", "recurrence_pattern TEXT");

        // Workflow Tasks: Dependencies Gantt
        await addColumn("workflow_tasks", "depends_on_id INTEGER");
        await addColumn("workflow_tasks", "est_duration_days INTEGER DEFAULT 1");
        await addColumn("workflow_tasks", "assigned_to INTEGER");

        // Provide a default company for existing data just in case
        try {
            const hasCompanies = await client.execute("SELECT count(*) as count FROM companies");
            if (hasCompanies.rows[0].count === 0) {
                await client.execute("INSERT INTO companies (id, name) VALUES (1, 'Default Company')");
                console.log("✅ Inserted default company");
            }
        } catch (e) { }

        console.log("🎉 Phase 2 Migration completed successfully!");

    } catch (error) {
        console.error("❌ Migration failed:", error);
    }
}

migrate();
