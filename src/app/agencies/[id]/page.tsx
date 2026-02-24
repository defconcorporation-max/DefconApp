import { getAgencyById, getAgencyClients, getPipelineStages } from '@/app/actions';
import { Client } from '@/types';
import Link from 'next/link';
import { ArrowLeft, Building, Users } from 'lucide-react';
import { getDotColor } from '@/lib/colors';

export const dynamic = 'force-dynamic';

export default async function AgencyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const agencyId = Number(id);

    const [agency, clients, stages] = await Promise.all([
        getAgencyById(agencyId),
        getAgencyClients(agencyId),
        getPipelineStages(),
    ]);

    if (!agency) return <div className="p-8 text-white">Agency not found</div>;

    const totalClients = clients.length;
    // Calculate basic project count stats
    const totalProjects = clients.reduce((acc, client) => acc + (client.project_count || 0), 0);

    return (
        <main className="min-h-screen p-4 md:p-8 pt-20 md:pt-8 bg-[var(--bg-root)] text-white">
            <header className="mb-8">
                <Link href="/agencies" className="text-[var(--text-tertiary)] hover:text-white transition-colors flex items-center gap-2 text-sm font-mono mb-6">
                    <ArrowLeft size={16} /> Back to Agencies
                </Link>

                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: `${agency.color}20`, border: `1px solid ${agency.color}40` }}>
                        <Building size={32} style={{ color: agency.color }} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">{agency.name}</h1>
                        <div className="flex gap-4 text-sm text-[var(--text-secondary)]">
                            <span className="flex items-center gap-1"><Users size={14} /> {totalClients} Clients</span>
                            <span className="flex items-center gap-1">● {totalProjects} Projects</span>
                        </div>
                    </div>
                </div>
            </header>

            <section>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                    Portfolio Clients
                </h2>

                {clients.length === 0 ? (
                    <div className="text-[var(--text-tertiary)] italic">No clients assigned to this agency yet.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {clients.map((client: any) => (
                            <Link key={client.id} href={`/clients/${client.id}`} className="group">
                                <article className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-5 hover:border-indigo-500/50 hover:bg-[#121212] transition-all relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>

                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <h3 className="font-bold text-lg text-white group-hover:text-indigo-300 transition-colors">{client.company_name || client.name}</h3>
                                        <span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                            {client.plan}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-4">
                                        <div className="flex items-center gap-1">
                                            <span className={`w-1.5 h-1.5 rounded-full ${getDotColor(stages, client.status)}`}></span>
                                            {client.status || 'Active'}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-between items-center">
                                        <span className="text-xs text-[var(--text-tertiary)]">
                                            {client.project_count} Active Projects
                                        </span>
                                        <span className="text-xs text-indigo-400 group-hover:translate-x-1 transition-transform">
                                            View Details →
                                        </span>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
