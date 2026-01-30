import { getAllShoots, getTeamMembers, getAllShootAssignments } from '@/app/actions';
import Link from 'next/link';
import { Video, Calendar, ArrowRight, ExternalLink } from 'lucide-react';
import ShootAssignmentWidget from '@/components/ShootAssignmentWidget';

export const dynamic = 'force-dynamic';

export default async function ShootsPage() {
    const shoots = await getAllShoots();
    const teamMembers = await getTeamMembers();
    const allAssignments = await getAllShootAssignments();

    // Group by Month
    const shootsByMonth: Record<string, typeof shoots> = {};
    shoots.forEach(shoot => {
        const date = new Date(shoot.shoot_date);
        const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!shootsByMonth[monthKey]) shootsByMonth[monthKey] = [];
        shootsByMonth[monthKey].push(shoot);
    });

    return (
        <main className="min-h-screen p-4 md:p-8 pt-20 md:pt-8 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-[var(--border-subtle)] pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-2 flex items-center gap-2">
                        <Video className="w-6 h-6 text-violet-400" />
                        Shoots & Post-Production
                    </h1>
                    <p className="text-[var(--text-tertiary)] text-sm">Manage your production schedule and post-production workflows.</p>
                </div>
                <Link href="/" className="pro-button-primary flex items-center gap-2 text-sm shadow-lg shadow-violet-500/20">
                    <span className="text-lg leading-none">+</span> Schedule Shoot
                </Link>
            </header>

            {Object.keys(shootsByMonth).length === 0 && (
                <div className="py-20 text-center border border-dashed border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface)]/50">
                    <Video className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-white mb-2">No Shoots Scheduled</h3>
                    <p className="text-[var(--text-tertiary)] text-sm mb-6">Schedule your first shoot to get started.</p>
                    <Link href="/" className="px-4 py-2 bg-[var(--bg-surface-hover)] hover:bg-[var(--border-subtle)] rounded text-sm text-white transition-colors">
                        Go to Dashboard
                    </Link>
                </div>
            )}

            {Object.entries(shootsByMonth).map(([month, monthShoots]) => (
                <div key={month} className="mb-12">
                    <h2 className="text-lg font-bold text-white mb-6 border-l-4 border-violet-500 pl-4 uppercase tracking-wider sticky top-20 bg-[var(--bg-root)] py-2 z-10 backdrop-blur-md bg-opacity-80">
                        {month}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {monthShoots.map(shoot => {
                            const assignments = allAssignments.filter(a => a.shoot_id === shoot.id);

                            return (
                                <div key={shoot.id} className={`pro-card p-6 h-full transition-all duration-300 relative group ${shoot.post_prod_status ? 'border-orange-500/30 bg-orange-500/5' : 'hover:border-violet-500/30'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col items-center bg-white/5 px-3 py-1 rounded border border-white/5 min-w-[60px] group-hover:bg-violet-500/10 group-hover:border-violet-500/20 group-hover:text-violet-400 transition-colors">
                                            <span className="text-xs text-gray-500 uppercase group-hover:text-violet-400/70">{new Date(shoot.shoot_date).toLocaleString('default', { month: 'short' })}</span>
                                            <span className="text-xl font-bold">{new Date(shoot.shoot_date).getDate()}</span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            {/* Standard Status */}
                                            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${shoot.status === 'Completed'
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                }`}>
                                                {shoot.status}
                                            </div>
                                            {/* Post Prod Status Badge */}
                                            {shoot.post_prod_status && (
                                                <div className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border bg-orange-500/10 text-orange-400 border-orange-500/20 flex items-center gap-1">
                                                    <span className="w-1 h-1 rounded-full bg-orange-400 animate-pulse"></span>
                                                    PP: {shoot.post_prod_status}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Link href={`/shoots/${shoot.id}`} className="block">
                                        <h3 className="text-lg font-bold text-white mb-1 hover:text-violet-400 transition-colors flex items-center gap-2">
                                            {shoot.title}
                                            <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity translate-y-0.5" />
                                        </h3>
                                    </Link>
                                    <p className="text-sm text-[var(--text-tertiary)] mb-4 flex items-center gap-2">
                                        For: <Link href={`/clients/${shoot.client_id}`} className="text-[var(--text-secondary)] hover:text-white transition-colors">{shoot.client_name}</Link>
                                    </p>

                                    {/* Crew Widget */}
                                    <ShootAssignmentWidget
                                        shootId={shoot.id}
                                        assignments={assignments}
                                        teamMembers={teamMembers}
                                    />

                                    <div className="pt-4 mt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                                        <span className="text-[var(--text-tertiary)] flex items-center gap-1">
                                            <Calendar size={12} />
                                            {new Date(shoot.shoot_date).toLocaleDateString()}
                                        </span>
                                        <Link href={`/shoots/${shoot.id}`} className="flex items-center gap-1 text-violet-400 font-medium hover:gap-2 transition-all">
                                            View Details <ArrowRight size={12} />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
            {/* Empty State */}
            {shoots.length === 0 && (
                <div className="col-span-full py-20 text-center border border-dashed border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface)]/50">
                    <Video className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-white mb-2">No Shoots Scheduled</h3>
                    <p className="text-[var(--text-tertiary)] text-sm mb-6">Schedule your first shoot to get started.</p>
                    <Link href="/" className="px-4 py-2 bg-[var(--bg-surface-hover)] hover:bg-[var(--border-subtle)] rounded text-sm text-white transition-colors">
                        Go to Dashboard
                    </Link>
                </div>
            )}
        </main>
    );
}
