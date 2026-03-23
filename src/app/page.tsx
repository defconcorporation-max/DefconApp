import { getClients, getAllShoots, getDashboardStats, getPipelineStages, getAllDashboardTasks, getAgencies, getActivities, getFinanceData } from './actions';
import Link from 'next/link';
import DashboardCalendar from '@/components/DashboardCalendar';
import ClientKanban from '@/components/ClientKanban';
import TaskManager from '@/components/TaskManager';
import ActivityFeed from '@/components/ActivityFeed';
import CollapsibleSection from '@/components/dashboard/CollapsibleSection';
import ThisWeekSummary from '@/components/dashboard/ThisWeekSummary';
import AIDailySummary from '@/components/dashboard/AIDailySummary';
import PageLayout from '@/components/layout/PageLayout';
import { auth } from '@/auth';
export const dynamic = 'force-dynamic';

export default async function Home() {
    const session = await auth();
    const userRole = session?.user?.role;
    const isAdmin = userRole === 'Admin' || userRole === 'Team';
    let clients: any[] = [];
    let allShoots: any[] = [];
    let stats: any = null;
    let stages: any[] = [];
    let tasks: any[] = [];
    let activities: any[] = [];
    let error = null;
    let financeData: any = null;

    try {
        const results = await Promise.all([
            getClients(),
            getAllShoots(),
            getDashboardStats(),
            getPipelineStages(),
            getAllDashboardTasks(),
            getAgencies(),
            getActivities(),
            getFinanceData(),
        ]);

        [clients, allShoots, stats, stages, tasks, , activities, financeData] = results;
        if (!Array.isArray(tasks)) tasks = [];
    } catch (e: any) {
        console.warn('Dashboard Data Fetch Error:', e);
        error = e.message || 'Unknown database error';
        stats = { totalProjects: 0, totalShoots: 0, activeClients: 0, totalClients: 0, upcomingShoots: 0 };
        financeData = null;
    }

    const kpis = [
        { label: 'Projects', value: stats?.totalProjects ?? 0 },
        { label: 'Shoots', value: stats?.totalShoots ?? 0 },
        { label: 'Clients', value: `${stats?.activeClients ?? 0} / ${stats?.totalClients ?? 0}` },
        { label: 'Upcoming', value: stats?.upcomingShoots ?? 0 },
        {
            label: 'Encaissements',
            value: `$${Number(financeData?.stats?.revenueWithTax || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
        },
    ];

    return (
        <PageLayout
            breadcrumbs={[{ label: 'Dashboard' }]}
            title="Dashboard"
            subtitle="Vue d’ensemble de l’activité"
            compact
        >
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
                    <strong>Warning:</strong> Connecting to database failed. ({error})
                </div>
            )}

            {/* KPI bar - compact */}
            <div className="pro-card-tertiary px-4 py-3 flex flex-wrap items-center gap-6 md:gap-8">
                {kpis.map((kpi) => (
                    <div key={kpi.label} className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white tabular-nums">{kpi.value}</span>
                        <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">{kpi.label}</span>
                    </div>
                ))}
                <Link href="/availability" className="ml-auto text-xs text-violet-400 hover:text-violet-300 font-medium">
                    Voir le planning →
                </Link>
            </div>

            {/* AI Executive Summary */}
            <AIDailySummary />

            {/* This Week Summary */}
            <ThisWeekSummary shoots={allShoots} tasks={tasks} />

            {financeData?.clients?.length > 0 && (
                <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-white/5">
                        <h3 className="section-label mb-0">Cash collected par client</h3>
                        <Link href="/finance" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                            Voir Finance →
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white/5 text-[var(--text-tertiary)] uppercase text-xs font-medium">
                                <tr>
                                    <th className="px-4 py-3">Client</th>
                                    <th className="px-4 py-3 text-center">Projets</th>
                                    <th className="px-4 py-3 text-right">Cash</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-subtle)]">
                                {financeData.clients.slice(0, 5).map((client: any) => (
                                    <tr key={client.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-white">{client.company_name}</div>
                                            <div className="text-xs text-[var(--text-tertiary)]">{client.name}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="bg-white/10 text-white px-2 py-0.5 rounded text-xs font-mono">
                                                {client.project_count}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                                            ${Number(client.total_paid || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <CollapsibleSection id="calendar" title="Calendrier" viewAllHref="/availability" viewAllLabel="Voir tout">
                <div className="overflow-x-hidden w-full pb-2">
                    <DashboardCalendar shoots={allShoots} clients={clients} />
                </div>
            </CollapsibleSection>

            <CollapsibleSection id="kanban" title="Pipeline clients" viewAllHref="/clients" viewAllLabel="Voir les clients">
                <div className="overflow-x-auto pb-2 -mx-1">
                    <div className="min-w-[280px]">
                        <ClientKanban initialClients={clients} initialStages={stages} readOnly={!isAdmin} />
                    </div>
                </div>
            </CollapsibleSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                <div className="md:col-span-2">
                    <CollapsibleSection id="tasks" title="Tâches" viewAllHref="/" viewAllLabel="Voir tout">
                        <TaskManager initialTasks={tasks} />
                    </CollapsibleSection>
                </div>
                <div className="md:col-span-1">
                    <CollapsibleSection id="activity" title="Activité récente">
                        <ActivityFeed activities={activities} />
                    </CollapsibleSection>
                </div>
            </div>
        </PageLayout>
    );
}
