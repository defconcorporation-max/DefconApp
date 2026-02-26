import { turso as db } from '@/lib/turso';
import Link from 'next/link';
import { ArrowUpRight, Briefcase, DollarSign, Activity, Users, TrendingUp } from 'lucide-react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAuditLogs } from '@/app/actions';
import AuditLogViewer from '@/components/AuditLogViewer';

export const dynamic = 'force-dynamic';

export default async function CommandCenterPage() {
    const session = await auth();
    if (!session || (session.user?.role !== 'Admin' && session.user?.role !== 'Team')) {
        redirect('/');
    }

    // Fetch high-level stats
    const statsRes = await db.execute(`
        SELECT 
            SUM(total_revenue) as total_revenue,
            SUM(total_cost) as total_cost,
            SUM(total_margin) as total_margin
        FROM projects
    `);
    const globalStats = statsRes.rows[0];

    // Fetch active projects count
    const activeProjectsRes = await db.execute(`SELECT COUNT(*) as count FROM projects WHERE status != 'Completed'`);
    const activeProjectsCount = activeProjectsRes.rows[0]?.count || 0;

    // Fetch total clients count
    const clientsRes = await db.execute(`SELECT COUNT(*) as count FROM clients`);
    const clientsCount = clientsRes.rows[0]?.count || 0;

    // Fetch recent active projects
    const recentProjectsRes = await db.execute(`
        SELECT id, title, status, total_revenue, margin_percentage 
        FROM projects 
        WHERE status != 'Completed'
        ORDER BY updated_at DESC LIMIT 5
    `);
    const recentProjects = recentProjectsRes.rows as any[];

    // Fetch upcoming shoots
    const upcomingShootsRes = await db.execute(`
        SELECT s.id, s.title, s.shoot_date, c.name as client_name
        FROM shoots s
        LEFT JOIN clients c ON s.client_id = c.id
        WHERE s.shoot_date >= date('now')
        ORDER BY s.shoot_date ASC LIMIT 5
    `);
    const upcomingShoots = upcomingShootsRes.rows as any[];

    // Fetch recent audit logs
    const auditLogs = await getAuditLogs(10);

    const formatCurrency = (amount: number | null | undefined) => {
        if (!amount) return '$0';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Activity className="w-8 h-8 text-emerald-400" />
                        Command Center
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">High-level overview of global operations and financials.</p>
                </div>
            </div>

            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <DollarSign className="w-24 h-24" />
                    </div>
                    <div className="flex gap-3 items-center mb-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <h2 className="text-sm font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Total Revenue</h2>
                    </div>
                    <div className="text-3xl font-bold text-white mt-4">
                        {formatCurrency(globalStats?.total_revenue as number)}
                    </div>
                </div>

                <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp className="w-24 h-24" />
                    </div>
                    <div className="flex gap-3 items-center mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <h2 className="text-sm font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Gross Margin</h2>
                    </div>
                    <div className="text-3xl font-bold text-white mt-4">
                        {formatCurrency(globalStats?.total_margin as number)}
                    </div>
                    <div className="text-sm text-[var(--text-tertiary)] mt-1">
                        {globalStats?.total_revenue && (globalStats.total_revenue as number) > 0
                            ? Math.round(((globalStats.total_margin as number) / (globalStats.total_revenue as number)) * 100)
                            : 0}% overall
                    </div>
                </div>

                <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Briefcase className="w-24 h-24" />
                    </div>
                    <div className="flex gap-3 items-center mb-2">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                            <Briefcase className="w-5 h-5" />
                        </div>
                        <h2 className="text-sm font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Active Projects</h2>
                    </div>
                    <div className="text-3xl font-bold text-white mt-4">
                        {activeProjectsCount as number}
                    </div>
                </div>

                <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Users className="w-24 h-24" />
                    </div>
                    <div className="flex gap-3 items-center mb-2">
                        <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400">
                            <Users className="w-5 h-5" />
                        </div>
                        <h2 className="text-sm font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Total Clients</h2>
                    </div>
                    <div className="text-3xl font-bold text-white mt-4">
                        {clientsCount as number}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Active Projects */}
                <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-[var(--border-subtle)] flex justify-between items-center bg-black/20">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-[var(--text-tertiary)]" />
                            Active Projects Watchlist
                        </h3>
                        <Link href="/projects" className="text-xs text-[var(--text-tertiary)] hover:text-white transition-colors flex items-center gap-1">
                            View All <ArrowUpRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="flex-1 overflow-auto p-2">
                        {recentProjects.length === 0 ? (
                            <div className="p-8 text-center text-[var(--text-tertiary)]">No active projects to display.</div>
                        ) : (
                            <div className="space-y-1">
                                {recentProjects.map(p => (
                                    <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center justify-between p-3 hover:bg-[var(--bg-surface-hover)] rounded-lg transition-colors group">
                                        <div>
                                            <div className="font-medium text-[var(--text-secondary)] group-hover:text-white transition-colors">{p.title}</div>
                                            <div className="text-[10px] text-[var(--text-tertiary)] uppercase mt-0.5">{p.status}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium text-emerald-400">{formatCurrency(p.total_revenue)}</div>
                                            <div className="text-xs text-[var(--text-tertiary)]">{p.margin_percentage ? Math.round(p.margin_percentage) : 0}% margin</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Upcoming Shoots */}
                <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-[var(--border-subtle)] flex justify-between items-center bg-black/20">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <Activity className="w-4 h-4 text-[var(--text-tertiary)]" />
                            Upcoming Shoots
                        </h3>
                        <Link href="/shoots" className="text-xs text-[var(--text-tertiary)] hover:text-white transition-colors flex items-center gap-1">
                            Schedule <ArrowUpRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="flex-1 overflow-auto p-2">
                        {upcomingShoots.length === 0 ? (
                            <div className="p-8 text-center text-[var(--text-tertiary)]">No upcoming shoots scheduled.</div>
                        ) : (
                            <div className="space-y-1">
                                {upcomingShoots.map(s => (
                                    <Link key={s.id} href={`/shoots/${s.id}`} className="flex items-center justify-between p-3 hover:bg-[var(--bg-surface-hover)] rounded-lg transition-colors group">
                                        <div>
                                            <div className="font-medium text-[var(--text-secondary)] group-hover:text-white transition-colors">{s.title}</div>
                                            <div className="text-xs text-[var(--text-tertiary)] mt-0.5">{s.client_name || 'No Client'}</div>
                                        </div>
                                        <div className="text-sm tabular-nums text-[var(--text-secondary)] bg-white/5 px-2 py-1 rounded border border-white/10">
                                            {s.shoot_date}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Audit Log Section */}
            <div>
                <AuditLogViewer initialLogs={auditLogs} />
            </div>
        </div>
    );
}
