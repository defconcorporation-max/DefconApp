import { getClients, getAllShoots, getDashboardStats, getPipelineStages, getAllDashboardTasks, getAgencies, getActivities } from './actions';
import Link from 'next/link';
import DashboardCalendar from '@/components/DashboardCalendar';
import ClientKanban from '@/components/ClientKanban';
import TaskManager from '@/components/TaskManager';
import ActivityFeed from '@/components/ActivityFeed';
import CollapsibleSection from '@/components/dashboard/CollapsibleSection';
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

    try {
        const results = await Promise.all([
            getClients(),
            getAllShoots(),
            getDashboardStats(),
            getPipelineStages(),
            getAllDashboardTasks(),
            getAgencies(),
            getActivities()
        ]);

        [clients, allShoots, stats, stages, tasks, , activities] = results;
        if (!Array.isArray(tasks)) tasks = [];
    } catch (e: any) {
        console.warn('Dashboard Data Fetch Error:', e);
        error = e.message || 'Unknown database error';
        stats = { totalProjects: 0, totalShoots: 0, activeClients: 0, totalClients: 0, upcomingShoots: 0 };
    }

    const kpis = [
        { label: 'Projects', value: stats?.totalProjects ?? 0 },
        { label: 'Shoots', value: stats?.totalShoots ?? 0 },
        { label: 'Clients', value: `${stats?.activeClients ?? 0} / ${stats?.totalClients ?? 0}` },
        { label: 'Upcoming', value: stats?.upcomingShoots ?? 0 },
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

            <CollapsibleSection id="calendar" title="Calendrier" viewAllHref="/availability" viewAllLabel="Voir tout">
                <div className="overflow-x-auto pb-2 -mx-1">
                    <div className="min-w-[320px]">
                        <DashboardCalendar shoots={allShoots} clients={clients} />
                    </div>
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
