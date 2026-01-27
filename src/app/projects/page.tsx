import Link from 'next/link';
import { turso as db } from '@/lib/turso';
import { Project, Client } from '@/types';
import { Folder, Clock, Hash, DollarSign } from 'lucide-react';

async function getAllProjectsFull() {
    'use server';
    // Join with clients to get names
    const { rows } = await db.execute(`
        SELECT p.*, c.company_name as client_name, c.name as client_contact,
        (SELECT COUNT(*) FROM shoots s WHERE s.project_id = p.id) as shoot_count,
        (SELECT COALESCE(SUM(rate * quantity), 0) FROM project_services ps WHERE ps.project_id = p.id) as total_value
        FROM projects p
        JOIN clients c ON p.client_id = c.id
        ORDER BY p.created_at DESC
    `);

    return rows as unknown as (Project & { client_name: string, client_contact: string, shoot_count: number, total_value: number })[];
}

export default async function ProjectsPage() {
    const projects = await getAllProjectsFull();

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

            {/* Stats/Filters Row ( Simplified for now ) */}
            <div className="mb-8 flex gap-4">
                <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] px-4 py-3 rounded-lg flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-md">
                        <Folder size={18} />
                    </div>
                    <div>
                        <div className="text-xl font-bold">{projects.length}</div>
                        <div className="text-xs text-[var(--text-secondary)] uppercase">Total Projects</div>
                    </div>
                </div>
                <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] px-4 py-3 rounded-lg flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-md">
                        <DollarSign size={18} />
                    </div>
                    <div>
                        <div className="text-xl font-bold">${projects.reduce((acc, p) => acc + (p.total_value || 0), 0).toLocaleString()}</div>
                        <div className="text-xs text-[var(--text-secondary)] uppercase">Total Value</div>
                    </div>
                </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map(project => (
                    <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-5 hover:border-[var(--text-secondary)] transition-colors group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-lg group-hover:text-indigo-400 transition-colors">{project.title}</h3>
                            <span className={`px-2 py-0.5 rounded textxs font-mono uppercase text-[10px] tracking-wider ${project.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-[var(--text-secondary)]'
                                }`}>
                                {project.status}
                            </span>
                        </div>

                        <div className="mb-4">
                            <div className="text-sm text-white font-medium">{project.client_name}</div>
                            <div className="text-xs text-[var(--text-secondary)]">{project.client_contact}</div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)] mt-auto">
                            <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
                                <span className="flex items-center gap-1.5">
                                    <Clock size={12} />
                                    {new Date(project.created_at).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Hash size={12} />
                                    {project.shoot_count} Shoots
                                </span>
                            </div>
                            <div className="font-mono text-sm font-bold text-[var(--text-secondary)]">
                                ${project.total_value.toLocaleString()}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </main>
    );
}
