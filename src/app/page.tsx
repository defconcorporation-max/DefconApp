import { getClients, createClient, getAllShoots, getDashboardStats, getPipelineStages, getAllDashboardTasks, DashboardTask } from './actions';
import Link from 'next/link';
import DashboardCalendar from '@/components/DashboardCalendar';
import ClientKanban from '@/components/ClientKanban';
import TaskManager from '@/components/TaskManager';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let clients: any[] = [];
  let allShoots: any[] = [];
  let stats: any = null;
  let stages: any[] = [];
  let tasks: any[] = [];
  let error = null;

  try {
    const results = await Promise.all([
      getClients(),
      getAllShoots(),
      getDashboardStats(),
      getPipelineStages(),
      getAllDashboardTasks()
    ]);

    [clients, allShoots, stats, stages, tasks] = results;
  } catch (e: any) {
    console.warn('Dashboard Data Fetch Error:', e);
    error = e.message || 'Unknown database error';
    // Fallback Mock Data to prevent crash
    stats = { totalRevenue: 0, pendingRevenue: 0, activeClients: 0, totalClients: 0, upcomingShoots: 0 };
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
          <nav className="flex gap-4 text-xs font-medium text-[var(--text-tertiary)]">
            <Link href="/services" className="hover:text-white transition-colors">Services Catalog</Link>
            <Link href="/post-production" className="hover:text-white transition-colors">Post-Production</Link>
            <Link href="/finance" className="hover:text-white transition-colors">Finance</Link>
            <Link href="/team" className="hover:text-white transition-colors">Team</Link>
            <Link href="/settings" className="hover:text-white transition-colors">Settings</Link>
          </nav>
        </div>
        <form action={createClient} className="flex flex-wrap md:flex-nowrap gap-2 items-center bg-[var(--bg-surface)] p-2 rounded-xl border border-[var(--border-subtle)] w-full md:w-auto">
          <div className="flex gap-2 w-full md:w-auto">
            <input name="name" placeholder="Name" className="bg-transparent border-none text-sm px-3 py-2 md:py-1 focus:outline-none text-white w-full md:w-32 placeholder:text-[var(--text-tertiary)] bg-[var(--bg-root)] md:bg-transparent rounded-lg md:rounded-none border border-[var(--border-subtle)] md:border-none" required />
            <input name="company" placeholder="Company" className="bg-transparent border-none text-sm px-3 py-2 md:py-1 focus:outline-none text-white w-full md:w-32 placeholder:text-[var(--text-tertiary)] bg-[var(--bg-root)] md:bg-transparent rounded-lg md:rounded-none border border-[var(--border-subtle)] md:border-none" />
          </div>

          <div className="hidden md:block w-px h-4 bg-[var(--border-subtle)]"></div>

          <div className="flex gap-2 w-full md:w-auto">
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
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="pro-dashboard-card group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05 1.06 1.91 2.57 1.91 1.62 0 2.27-.67 2.27-1.59 0-.87-.72-1.42-2.32-1.87-2.37-.65-3.56-1.55-3.56-3.23 0-1.72 1.34-2.82 2.92-3.17V4.76h2.67v1.89c1.67.33 2.87 1.48 2.98 3.16h-2.02c-.13-.88-.87-1.59-2.22-1.59-1.21 0-2.06.56-2.06 1.46 0 .75.54 1.25 2.19 1.76 2.51.77 3.69 1.69 3.69 3.33.01 1.83-1.31 3.03-3.07 3.39z" /></svg>
          </div>
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">Cash Collected</p>
          <div className="text-3xl font-bold text-white flex items-end gap-2">
            ${stats?.totalRevenue?.toLocaleString() || 0}
            <span className="text-xs font-normal text-emerald-400 mb-1.5">+12%</span>
          </div>
        </div>

        <div className="pro-dashboard-card group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" /></svg>
          </div>
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">Unpaid Invoices</p>
          <div className="text-3xl font-bold text-white flex items-end gap-2">
            ${stats?.pendingRevenue?.toLocaleString() || 0}
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
          <ClientKanban initialClients={clients} initialStages={stages} />
        </div>
      </div>

      <div className="overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="min-w-[800px] md:min-w-0">
          <TaskManager initialTasks={tasks} />
        </div>
      </div>

    </main>
  );
}
