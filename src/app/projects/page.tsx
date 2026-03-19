import Link from 'next/link';
import { turso as db } from '@/lib/turso';
import { Project } from '@/types';
import { Folder, DollarSign, AlertCircle } from 'lucide-react';
import ProjectList from '@/components/ProjectList';
import PageLayout from '@/components/layout/PageLayout';
import { auth } from '@/auth';

async function getAllProjectsFull() {
    'use server';

    // Check Agency Role
    const session = await auth();
    const userRole = session?.user?.role;
    const agencyId = session?.user?.agency_id;

    let agencyFilter = '';
    const args: any[] = [];

    if ((userRole === 'AgencyAdmin' || userRole === 'AgencyTeam') && agencyId) {
        agencyFilter = ' WHERE c.agency_id = ?';
        args.push(agencyId);
    }

    // Join with clients to get names and project_labels for badges
    const { rows } = await db.execute({
        sql: `
        SELECT p.*, c.company_name as client_name, c.name as client_contact,
        pl.name as label_name, pl.color as label_color,
        (SELECT COUNT(*) FROM shoots s WHERE s.project_id = p.id) as shoot_count,
        (SELECT COUNT(*) FROM shoots s WHERE s.project_id = p.id AND s.status = 'Scheduled') as shoots_scheduled,
        (SELECT COUNT(*) FROM shoots s LEFT JOIN post_prod_projects ppp ON s.id = ppp.shoot_id WHERE s.project_id = p.id AND s.status = 'Completed' AND (ppp.status IS NULL OR (ppp.status != 'Completed' AND ppp.status != 'Approved'))) as shoots_in_post_prod,
        (SELECT COUNT(*) FROM shoots s LEFT JOIN post_prod_projects ppp ON s.id = ppp.shoot_id WHERE s.project_id = p.id AND s.status = 'Completed' AND (ppp.status = 'Completed' OR ppp.status = 'Approved')) as shoots_done,
        (SELECT COALESCE(SUM(rate * quantity), 0) FROM project_services ps WHERE ps.project_id = p.id) as total_value
        FROM projects p
        JOIN clients c ON p.client_id = c.id
        LEFT JOIN project_labels pl ON c.label_id = pl.id
        ${agencyFilter}
        ORDER BY p.created_at DESC
        `,
        args
    });

    return rows as unknown as (Project & {
        client_name: string,
        client_contact: string,
        shoot_count: number,
        shoots_scheduled: number,
        shoots_in_post_prod: number,
        shoots_done: number,
        total_value: number,
        label_name?: string,
        label_color?: string
    })[];
}

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
    const projects = await getAllProjectsFull();

    // Calculate Overdue Projects
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day for fair comparison

    const overdueProjects = projects.filter(p => {
        if (!p.due_date) return false;
        if (p.status === 'Completed' || p.status === 'Archived') return false;

        const dueDate = new Date(p.due_date);
        // Compare: if due date is strictly before today (yesterday or earlier)
        // Adjust logic if "due today" counts as overdue or not. Usually strict < today means overdue.
        // Let's use strict comparison for "Overdue" (past the deadline).
        return dueDate < today;
    });

    return (
        <PageLayout
            breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Projects' }]}
            title="Projects"
            subtitle="Tous les projets actifs et terminés."
            actions={<Link href="/" className="text-sm text-[var(--text-tertiary)] hover:text-white">← Dashboard</Link>}
        >
            {/* Stats Overview */}
            <div className="pro-card-tertiary px-4 py-3 flex flex-wrap items-center gap-6 md:gap-8 mb-6">
                <div className="flex items-baseline gap-2">
                    <Folder className="w-4 h-4 text-indigo-400" />
                    <span className="text-xl font-bold text-white tabular-nums">{projects.length}</span>
                    <span className="text-xs text-[var(--text-tertiary)] uppercase">Projets</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-xl font-bold text-white tabular-nums">{overdueProjects.length}</span>
                    <span className="text-xs text-[var(--text-tertiary)] uppercase">En retard</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span className="text-xl font-bold text-white tabular-nums">${projects.reduce((acc, p) => acc + (p.total_value || 0), 0).toLocaleString()}</span>
                    <span className="text-xs text-[var(--text-tertiary)] uppercase">Valeur totale</span>
                </div>
            </div>

            <ProjectList projects={projects} />
        </PageLayout>
    );
}
