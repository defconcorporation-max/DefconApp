import { getClients, getPipelineStages } from '@/app/actions';
import Link from 'next/link';
import { ArrowRight, Users, ExternalLink } from 'lucide-react';
import { auth } from '@/auth';
import { getBadgeClasses } from '@/lib/colors';
import CreateClientButton from '@/components/CreateClientButton';
import PageLayout from '@/components/layout/PageLayout';

export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
    const [session, clients, stages] = await Promise.all([
        auth(),
        getClients(),
        getPipelineStages(),
    ]);
    const userRole = session?.user?.role;
    const isAdmin = userRole === 'Admin' || userRole === 'Team';

    return (
        <PageLayout
            breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Clients' }]}
            title="Clients"
            subtitle="Gérer vos relations clients et portfolios."
            actions={isAdmin ? <CreateClientButton /> : undefined}
            compact
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clients.map(client => (
                    <Link href={`/clients/${client.id}`} key={client.id} className="group">
                        <div className="pro-card p-6 h-full hover:border-indigo-500/30 transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-lg group-hover:scale-110 transition-transform duration-300">
                                    {client.company_name.charAt(0)}
                                </div>
                                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${getBadgeClasses(stages, client.status)}`}>
                                    {client.status || 'Active'}
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                                {client.company_name}
                                <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity translate-y-0.5" />
                            </h3>
                            <p className="text-sm text-[var(--text-tertiary)] mb-6">{client.name}</p>

                            <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                                <span className="text-[var(--text-tertiary)]">Plan: <span className="text-[var(--text-secondary)] font-medium">{client.plan}</span></span>
                                <span className="flex items-center gap-1 text-indigo-400 font-medium group-hover:gap-2 transition-all">
                                    View Details <ArrowRight size={12} />
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}

                {/* Empty State */}
                {clients.length === 0 && (
                    <div className="col-span-full py-20 text-center border border-dashed border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface)]/50 pro-card-tertiary">
                        <Users className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-white mb-2">Aucun client</h3>
                        <p className="text-[var(--text-tertiary)] text-sm mb-6">Créez votre premier client pour commencer.</p>
                        <Link href="/" className="px-4 py-2 pro-button-primary rounded text-sm">
                            Aller au dashboard
                        </Link>
                    </div>
                )}
            </div>
        </PageLayout>
    );
}
