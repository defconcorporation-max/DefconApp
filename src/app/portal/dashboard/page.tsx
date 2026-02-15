import { getClientPortalData, clientLogout } from '@/app/actions';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Folder, FileText, LayoutGrid } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ClientDashboard() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('client_session')?.value;

    if (!sessionCookie) redirect('/portal/login');

    const session = await decrypt(sessionCookie);
    if (!session || session.type !== 'client') redirect('/portal/login');

    const { client, projects } = await getClientPortalData(session.client.id);

    return (
        <main className="min-h-screen bg-[#050505] text-white">
            {/* HEADER */}
            <header className="border-b border-[var(--border-subtle)] bg-[#0A0A0A]">
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            {client.company_name?.charAt(0) || client.name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-tight">{client.company_name || client.name}</h1>
                            <p className="text-xs text-[var(--text-secondary)]">Client Portal</p>
                        </div>
                    </div>

                    <form action={clientLogout}>
                        <button className="text-sm font-medium text-[var(--text-secondary)] hover:text-white flex items-center gap-2 transition-colors">
                            <LogOut size={16} /> Sign Out
                        </button>
                    </form>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                    <Folder className="text-emerald-500" /> Your Projects
                </h2>

                {projects.length === 0 ? (
                    <div className="border border-dashed border-[var(--border-subtle)] rounded-2xl p-12 text-center text-[var(--text-tertiary)] bg-[#0A0A0A]">
                        <p>No active projects found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project: any) => (
                            <Link
                                href={`/portal/projects/${project.id}`}
                                key={project.id}
                                className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-6 hover:border-emerald-500/50 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${project.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
                                        }`}>
                                        {project.status}
                                    </div>
                                    <span className="text-xs text-[var(--text-tertiary)]">
                                        {new Date(project.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="font-bold text-xl mb-2 group-hover:text-emerald-400 transition-colors">{project.title}</h3>
                                <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-4">
                                    {project.description || 'No description provided.'}
                                </p>
                                <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-tertiary)] group-hover:text-white transition-colors">
                                    View Details →
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
