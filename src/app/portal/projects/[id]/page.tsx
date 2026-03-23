import { getClientPortalProject, clientLogout } from '@/app/actions';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogOut, ArrowLeft, Folder, Video, Calendar, FileText, MessageSquare, CheckCircle2, Circle, Clock, CalendarDays } from 'lucide-react';
import ClientDeliverableComments from '@/components/portal/ClientDeliverableComments';
import ProductionTracker from '@/components/portal/ProductionTracker';
import { parseDateOnlyLocal } from '@/lib/date-local';

export const dynamic = 'force-dynamic';

export default async function ClientProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('client_session')?.value;

    if (!sessionCookie) redirect('/portal/login');

    const session = await decrypt(sessionCookie);
    if (!session || session.type !== 'client') redirect('/portal/login');

    const data = await getClientPortalProject(session.client.id, Number(id));

    if (!data) {
        return (
            <main className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
                <Link href="/portal/dashboard" className="text-emerald-500 hover:text-emerald-400">Return to Dashboard</Link>
            </main>
        );
    }

    const { project, shoots } = data;

    // Compute deliverables progress
    const allVideos = shoots.flatMap((s: any) => s.videos || []);
    const completedVideos = allVideos.filter((v: any) => v.completed);
    const totalVideos = allVideos.length;
    const progress = totalVideos > 0 ? Math.round((completedVideos.length / totalVideos) * 100) : 0;

    return (
        <main className="min-h-screen bg-[#050505] text-white">
            {/* HEADER */}
            <header className="border-b border-[var(--border-subtle)] bg-[#0A0A0A] sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-4">
                        <Link href="/portal/dashboard" className="text-[var(--text-tertiary)] hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/5">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="font-bold text-base md:text-lg leading-tight flex items-center gap-2">
                                <Folder size={16} className="text-emerald-500" />
                                {(project as any).title}
                            </h1>
                            <p className="text-xs text-[var(--text-secondary)]">Project Overview</p>
                        </div>
                    </div>

                    <form action={clientLogout}>
                        <button className="text-sm font-medium text-[var(--text-secondary)] hover:text-white flex items-center gap-2 transition-colors px-3 py-2 rounded-lg hover:bg-white/5">
                            <LogOut size={16} /> Sign Out
                        </button>
                    </form>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 space-y-12">
                {/* PROD TRACKER */}
                <div className="pro-card p-6 md:p-8">
                    <h3 className="section-label mb-8">Production Progress</h3>
                    <ProductionTracker projectStatus={project.status} shoots={shoots} />
                </div>

                {/* Project Info Card */}
                <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-5 md:p-6">
                    <div className="flex flex-wrap gap-3 items-center mb-4">
                        <div className={`px-3 py-1 rounded text-xs uppercase font-bold tracking-wider inline-block border ${(project as any).status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                            {(project as any).status}
                        </div>
                        {(project as any).due_date && (
                            <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                                <CalendarDays size={12} /> Due: {new Date((project as any).due_date).toLocaleDateString()}
                            </span>
                        )}
                        <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                            <Clock size={12} /> Created: {new Date((project as any).created_at).toLocaleDateString()}
                        </span>
                    </div>

                    {(project as any).description && (
                        <p className="text-[var(--text-secondary)] max-w-2xl mb-4">{(project as any).description}</p>
                    )}

                    {/* Deliverables Progress */}
                    {totalVideos > 0 && (
                        <div className="pt-4 border-t border-[var(--border-subtle)]">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-[var(--text-secondary)]">Deliverables Progress</span>
                                <span className="text-xs font-mono text-[var(--text-tertiary)]">{completedVideos.length}/{totalVideos} ({progress}%)</span>
                            </div>
                            <div className="w-full h-2 bg-[var(--border-subtle)] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Shoots Timeline */}
                <div>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <Video className="text-violet-500" size={20} /> Associated Shoots
                    </h2>

                    {shoots.length === 0 ? (
                        <div className="border border-dashed border-[var(--border-subtle)] rounded-2xl p-8 text-center text-[var(--text-tertiary)] bg-[#0A0A0A]">
                            <p>No shoots associated with this project yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[var(--border-subtle)] before:to-transparent">
                            {shoots.map((shoot: any, index: number) => (
                                <div key={shoot.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border bg-[#050505] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors ${shoot.status === 'Completed' ? 'border-emerald-500/50 text-emerald-400' : 'border-white/20 text-[var(--text-tertiary)] group-hover:text-emerald-400 group-hover:border-emerald-500/50'}`}>
                                        {shoot.status === 'Completed' ? <CheckCircle2 size={14} /> : <Calendar size={14} />}
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#0A0A0A] p-5 rounded-xl border border-[var(--border-subtle)] shadow hover:border-violet-500/30 transition-colors">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="font-bold text-white">{shoot.title}</div>
                                            <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${shoot.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/10 text-[var(--text-tertiary)]'}`}>
                                                {shoot.status || 'Planned'}
                                            </div>
                                        </div>
                                        <time className="text-xs text-[var(--text-tertiary)] mb-4 block flex items-center gap-1">
                                            <Calendar size={10} />
                                            {parseDateOnlyLocal(shoot.shoot_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </time>

                                        {shoot.videos && shoot.videos.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                                                <div className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] mb-2 flex items-center gap-1.5">
                                                    <FileText size={12} /> Deliverables ({shoot.videos.filter((v: any) => v.completed).length}/{shoot.videos.length})
                                                </div>
                                                <ul className="space-y-2">
                                                    {shoot.videos.map((vid: any) => (
                                                        <li key={vid.id} className="flex items-start gap-2 text-sm">
                                                            <div className={`mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full ${vid.completed ? 'bg-emerald-500' : 'bg-white/20'}`} />
                                                            <div className="flex-1 min-w-0">
                                                                <span className={vid.completed ? 'text-[var(--text-secondary)] line-through' : 'text-white'}>
                                                                    {vid.title}
                                                                </span>
                                                                <ClientDeliverableComments
                                                                    videoId={vid.id}
                                                                    clientId={session.client.id}
                                                                    initialComments={vid.comments || []}
                                                                />
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
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

