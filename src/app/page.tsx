import { getClients, createClient, getAllShoots, getDashboardStats, getPipelineStages, getAllDashboardTasks, getAgencies, getActivities } from './actions';
import Link from 'next/link';
import DashboardCalendar from '@/components/DashboardCalendar';
import ClientKanban from '@/components/ClientKanban';
import TaskManager from '@/components/TaskManager';
import ClientAgencySelect from '@/components/ClientAgencySelect';
import ActivityFeed from '@/components/ActivityFeed';
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
    let agencies: any[] = [];
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

        [clients, allShoots, stats, stages, tasks, agencies, activities] = results;
    } catch (e: any) {
        console.warn('Dashboard Data Fetch Error:', e);
        error = e.message || 'Unknown database error';
        // Fallback Mock Data to prevent crash
        stats = { totalProjects: 0, totalShoots: 0, activeClients: 0, totalClients: 0, upcomingShoots: 0 };
    }

    return (
        <main className="min-h-screen p-4 md:p-8 pt-20 md:pt-8">
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6">
                    <strong>Warning:</strong> Connecting to database failed. ({error})
                </div>
            )}
            <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 pb-6 border-b border-[var(--border-subtle)]">
                <div>
                    <h1 className="text-xl font-medium tracking-tight text-white gap-2 flex items-center mb-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        Defcon Console
                    </h1>
                </div>
                {isAdmin && (
                    <form action={createClient} className="flex flex-wrap md:flex-nowrap gap-2 items-center bg-[var(--bg-surface)] p-2 rounded-xl border border-[var(--border-subtle)] w-full md:w-auto">
                        <div className="flex gap-2 w-full md:w-auto">
                            <input name="name" placeholder="Name" className="bg-transparent border-none text-sm px-3 py-2 md:py-1 focus:outline-none text-white w-full md:w-32 placeholder:text-[var(--text-tertiary)] bg-[var(--bg-root)] md:bg-transparent rounded-lg md:rounded-none border border-[var(--border-subtle)] md:border-none" required />
                            <input name="company" placeholder="Company" className="bg-transparent border-none text-sm px-3 py-2 md:py-1 focus:outline-none text-white w-full md:w-32 placeholder:text-[var(--text-tertiary)] bg-[var(--bg-root)] md:bg-transparent rounded-lg md:rounded-none border border-[var(--border-subtle)] md:border-none" />
                        </div>

                        <div className="hidden md:block w-px h-4 bg-[var(--border-subtle)]"></div>

                        <div className="flex gap-2 w-full md:w-auto items-center">
                            <div className="w-full md:w-32">
                                <ClientAgencySelect defaultValue="" agencies={agencies} />
                            </div>
                            <select name="plan" className="bg-[var(--bg-root)] md:bg-transparent border border-[var(--border-subtle)] md:border-none rounded-lg md:rounded-none text-xs px-3 py-2 md:py-0 text-[var(--text-secondary)] focus:outline-none w-full md:w-24 appearance-none">
                                <option value="Standard" className="bg-black">Standard</option>
                                <option value="Gold" className="bg-black">Gold</option>
                                <option value="Platinum" className="bg-black">Platinum</option>
                            </select>
                            <button className="pro-button-primary text-xs py-2 md:py-1.5 px-4 shadow-lg shadow-indigo-500/20 w-full md:w-auto whitespace-nowrap">
                                Create
                            </button>
                        </div>
                    </form>
                )}
            </header>

            {/* Stats Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="pro-dashboard-card group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" /></svg>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">Total Projects</p>
                    <div className="text-3xl font-bold text-white flex items-end gap-2">
                        {stats?.totalProjects || 0}
                    </div>
                </div>

                <div className="pro-dashboard-card group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" /></svg>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">Total Shoots</p>
                    <div className="text-3xl font-bold text-white flex items-end gap-2">
                        {stats?.totalShoots || 0}
                    </div>
                </div>

                <div className="pro-dashboard-card group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">Active Clients</p>
                    <div className="text-3xl font-bold text-white flex items-end gap-2">
                        {stats?.activeClients || 0} <span className="text-sm font-normal text-[var(--text-tertiary)]">/ {stats?.totalClients || 0}</span>
                    </div>
                </div>

                <div className="pro-dashboard-card group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg width="60" height="60" viewBox="0 24 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" /></svg>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">Upcoming Shoots</p>
                    <div className="text-3xl font-bold text-white flex items-end gap-2">
                        {stats?.upcomingShoots || 0}
                    </div>
                </div>
            </section>

            {/* Calendar Section */}
            <div className="overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
                <div className="min-w-[800px] md:min-w-0">
                    <DashboardCalendar shoots={allShoots} clients={clients} />
                </div>
            </div>

            <div className="overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
                <div className="min-w-[1000px] md:min-w-0">
                    <ClientKanban initialClients={clients} initialStages={stages} readOnly={!isAdmin} />
                </div>
            </div>



            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <TaskManager initialTasks={tasks} />
                </div>
                <div className="md:col-span-1">
                    <ActivityFeed activities={activities} />
                </div>
            </div>

        </main>
    );
}
