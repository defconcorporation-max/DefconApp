import Link from 'next/link';
import { turso as db } from '@/lib/turso';
import { Project } from '@/types';
import { Folder, DollarSign, AlertCircle } from 'lucide-react';
import ProjectList from '@/components/ProjectList';

async function getAllProjectsFull() {
    'use server';
    // Join with clients to get names and project_labels for badges
    const { rows } = await db.execute(`
        SELECT p.*, c.company_name as client_name, c.name as client_contact,
        pl.name as label_name, pl.color as label_color,
        (SELECT COUNT(*) FROM shoots s WHERE s.project_id = p.id) as shoot_count,
        (SELECT COALESCE(SUM(rate * quantity), 0) FROM project_services ps WHERE ps.project_id = p.id) as total_value
        FROM projects p
        JOIN clients c ON p.client_id = c.id
        LEFT JOIN project_labels pl ON c.label_id = pl.id
        ORDER BY p.created_at DESC
    `);
    return rows as unknown as (Project & {
        client_name: string,
        client_contact: string,
        shoot_count: number,
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
        <main className="min-h-screen p-8 bg-[var(--bg-root)] text-white">
            {/* Header */}
            <header className="mb-8 border-b border-[var(--border-subtle)] pb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight mb-2">Projects</h1>
                    <p className="text-[var(--text-secondary)] text-sm">Manage all active and completed projects.</p>
                </div>
                <Link href="/" className="text-sm font-mono text-[var(--text-tertiary)] hover:text-white transition-colors">
                    ← BACK TO DASHBOARD
                </Link>
            </header>

            {/* Stats Overview */}
            <div className="mb-8 flex flex-wrap gap-4">
                <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] px-4 py-3 rounded-lg flex items-center gap-3 min-w-[200px]">
                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-md">
                        <Folder size={18} />
                    </div>
                    <div>
                        <div className="text-xl font-bold">{projects.length}</div>
                        <div className="text-xs text-[var(--text-secondary)] uppercase">Total Projects</div>
                    </div>
                </div>

                <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] px-4 py-3 rounded-lg flex items-center gap-3 min-w-[200px]">
                    <div className="p-2 bg-red-500/10 text-red-400 rounded-md">
                        <AlertCircle size={18} />
                    </div>
                    <div>
                        <div className="text-xl font-bold">{overdueProjects.length}</div>
                        <div className="text-xs text-[var(--text-secondary)] uppercase">Overdue</div>
                    </div>
                </div>

                <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] px-4 py-3 rounded-lg flex items-center gap-3 min-w-[200px]">
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-md">
                        <DollarSign size={18} />
                    </div>
                    <div>
                        <div className="text-xl font-bold">${projects.reduce((acc, p) => acc + (p.total_value || 0), 0).toLocaleString()}</div>
                        <div className="text-xs text-[var(--text-secondary)] uppercase">Total Value</div>
                    </div>
                </div>
            </div>

            {/* Client-Side Sortable List */}
            <ProjectList projects={projects} />
        </main>
    );
}
