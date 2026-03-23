import { getClientPortalData, clientLogout } from '@/app/actions';
import { getClientPortalFeedback } from '@/app/review-actions';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Folder, FileText, LayoutGrid, CheckCircle2, Circle, BarChart3, Camera, Clock, ArrowRight, MessageCircle, ChevronRight, CalendarDays } from 'lucide-react';
import { parseDateOnlyLocal } from '@/lib/date-local';

export const dynamic = 'force-dynamic';

export default async function ClientDashboard() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('client_session')?.value;

    if (!sessionCookie) redirect('/portal/login');

    const session = await decrypt(sessionCookie);
    if (!session || session.type !== 'client') redirect('/portal/login');

    const [{ client, projects, recentShoots }, feedbackList] = await Promise.all([
        getClientPortalData(session.client.id),
        getClientPortalFeedback(session.client.id)
    ]);

    // Compute KPIs
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p: any) => p.status !== 'Archived' && p.status !== 'Completed').length;
    const pendingFeedback = feedbackList.filter((f: any) => !f.is_resolved).length;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const upcomingShoots = (recentShoots || []).filter((s: any) => parseDateOnlyLocal(s.shoot_date) >= todayStart).length;

    return (
        <main className="min-h-screen bg-[#050505] text-white">
            {/* HEADER */}
            <header className="border-b border-[var(--border-subtle)] bg-[#0A0A0A] sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/20">
                            {client.company_name?.charAt(0) || client.name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-tight">{client.company_name || client.name}</h1>
                            <p className="text-xs text-[var(--text-secondary)]">Client Portal</p>
                        </div>
                    </div>

                    <form action={clientLogout}>
                        <button className="text-sm font-medium text-[var(--text-secondary)] hover:text-white flex items-center gap-2 transition-colors px-3 py-2 rounded-lg hover:bg-white/5">
                            <LogOut size={16} /> Sign Out
                        </button>
                    </form>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-10">
                {/* Welcome + KPIs */}
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">
                        Welcome back, <span className="text-emerald-400">{client.name?.split(' ')[0] || 'Client'}</span>
                    </h2>
                    <p className="text-[var(--text-secondary)] text-sm mb-6">Here&apos;s an overview of your projects and deliverables.</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-4 md:p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <Folder size={16} className="text-emerald-400" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold">{totalProjects}</div>
                            <div className="text-xs text-[var(--text-tertiary)]">{activeProjects} active</div>
                        </div>
                        <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-4 md:p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                                    <Camera size={16} className="text-violet-400" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold">{upcomingShoots}</div>
                            <div className="text-xs text-[var(--text-tertiary)]">Upcoming shoots</div>
                        </div>
                        <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-4 md:p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                    <MessageCircle size={16} className="text-orange-400" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold">{pendingFeedback}</div>
                            <div className="text-xs text-[var(--text-tertiary)]">Pending feedback</div>
                        </div>
                        <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-4 md:p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
                                    <BarChart3 size={16} className="text-sky-400" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold">{feedbackList.length}</div>
                            <div className="text-xs text-[var(--text-tertiary)]">Total requests</div>
                        </div>
                    </div>
                </div>

                {/* Projects Section */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-3">
                            <Folder className="text-emerald-500" size={20} /> Your Projects
                        </h2>
                    </div>

                    {projects.length === 0 ? (
                        <div className="border border-dashed border-[var(--border-subtle)] rounded-2xl p-12 text-center text-[var(--text-tertiary)] bg-[#0A0A0A]">
                            <p>No active projects found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {projects.map((project: any) => {
                                // Calculate progress
                                const shootCount = Number(project.shoot_count || 0);
                                const completedShoots = Number(project.completed_shoots || 0);
                                const progress = shootCount > 0 ? Math.round((completedShoots / shootCount) * 100) : 0;

                                const statusColors: Record<string, { bg: string; text: string; border: string }> = {
                                    'Completed': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
                                    'In Progress': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
                                    'Planning': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
                                };
                                const sc = statusColors[project.status] || statusColors['In Progress'];

                                return (
                                    <Link
                                        href={`/portal/projects/${project.id}`}
                                        key={project.id}
                                        className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-5 md:p-6 hover:border-emerald-500/50 transition-all group relative overflow-hidden"
                                    >
                                        {/* Progress stripe at top */}
                                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--border-subtle)]">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>

                                        <div className="flex justify-between items-start mb-3 mt-1">
                                            <div className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${sc.bg} ${sc.text} ${sc.border}`}>
                                                {project.status}
                                            </div>
                                            <span className="text-xs text-[var(--text-tertiary)]">
                                                {new Date(project.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <h3 className="font-bold text-lg mb-1.5 group-hover:text-emerald-400 transition-colors leading-tight">{project.title}</h3>

                                        {project.description && (
                                            <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-4">
                                                {project.description}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border-subtle)]">
                                            <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
                                                {shootCount > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <Camera size={12} /> {shootCount} shoots
                                                    </span>
                                                )}
                                                {project.due_date && (
                                                    <span className="flex items-center gap-1">
                                                        <CalendarDays size={12} /> {new Date(project.due_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                            <ChevronRight size={16} className="text-[var(--text-tertiary)] group-hover:text-emerald-400 transition-colors" />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Requested Feedback Section */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-3">
                            <FileText className="text-indigo-500" size={20} /> Requested Feedback
                        </h2>
                        {pendingFeedback > 0 && (
                            <span className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded-full font-medium">
                                {pendingFeedback} pending
                            </span>
                        )}
                    </div>

                    {feedbackList.length === 0 ? (
                        <div className="border border-dashed border-[var(--border-subtle)] rounded-2xl p-12 text-center text-[var(--text-tertiary)] bg-[#0A0A0A]">
                            <p>You haven&apos;t requested any feedback edits yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-w-4xl">
                            {feedbackList.map((f: any) => (
                                <div key={f.id} className={`bg-[#0A0A0A] border rounded-xl p-5 flex flex-col md:flex-row gap-4 items-start transition-colors ${f.is_resolved ? 'border-[var(--border-subtle)]' : 'border-orange-500/20 hover:border-orange-500/40'}`}>
                                    <div className="mt-0.5 flex-shrink-0">
                                        {f.is_resolved ? (
                                            <CheckCircle2 size={20} className="text-emerald-500" />
                                        ) : (
                                            <Clock size={20} className="text-orange-400 animate-pulse" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${f.is_resolved ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                }`}>
                                                {f.is_resolved ? 'Completed' : 'Pending'}
                                            </span>
                                            <span className="text-xs text-[var(--text-tertiary)]">
                                                {new Date(f.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="text-xs bg-white/5 px-2 py-0.5 rounded border border-white/5 truncate max-w-[200px]">
                                                {f.shoot_title || `Project #${f.project_id}`}
                                            </span>
                                        </div>
                                        <p className="text-sm text-white mb-3 break-words">{f.feedback}</p>

                                        {f.admin_comment && (
                                            <div className="bg-[#111] p-3 rounded-lg border border-emerald-500/10">
                                                <div className="text-[10px] text-emerald-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                                                    <CheckCircle2 size={10} /> Agency Reply
                                                </div>
                                                <p className="text-sm text-[var(--text-secondary)]">{f.admin_comment}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

