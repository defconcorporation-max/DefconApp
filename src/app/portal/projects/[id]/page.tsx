import { getClientPortalProject, clientLogout } from '@/app/actions';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogOut, ArrowLeft, Folder, Video, Calendar, FileText, MessageSquare } from 'lucide-react';
import ClientDeliverableComments from '@/components/portal/ClientDeliverableComments';

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

    return (
        <main className="min-h-screen bg-[#050505] text-white">
            {/* HEADER */}
            <header className="border-b border-[var(--border-subtle)] bg-[#0A0A0A] sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/portal/dashboard" className="text-[var(--text-tertiary)] hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/5">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="font-bold text-lg leading-tight flex items-center gap-2">
                                <Folder size={16} className="text-emerald-500" />
                                {project.title}
                            </h1>
                            <p className="text-xs text-[var(--text-secondary)]">Project Overview</p>
                        </div>
                    </div>

                    <form action={clientLogout}>
                        <button className="text-sm font-medium text-[var(--text-secondary)] hover:text-white flex items-center gap-2 transition-colors">
                            <LogOut size={16} /> Sign Out
                        </button>
                    </form>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 space-y-12">
                {/* Meta */}
                <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                        <div className={`px-3 py-1 rounded text-xs uppercase font-bold tracking-wider inline-block mb-4 ${project.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            }`}>
                            {project.status}
                        </div>
                        {project.description && (
                            <p className="text-[var(--text-secondary)] max-w-2xl">{project.description}</p>
                        )}
                    </div>
                </div>

                {/* Shoots Timeline */}
                <div>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <Video className="text-violet-500" /> Associated Shoots
                    </h2>

                    {shoots.length === 0 ? (
                        <div className="border border-dashed border-[var(--border-subtle)] rounded-2xl p-8 text-center text-[var(--text-tertiary)] bg-[#0A0A0A]">
                            <p>No shoots associated with this project yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[var(--border-subtle)] before:to-transparent">
                            {shoots.map((shoot: any, index: number) => (
                                <div key={shoot.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full border border-white/20 bg-[#050505] text-[var(--text-tertiary)] group-hover:text-emerald-400 group-hover:border-emerald-500/50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors">
                                        <Calendar size={14} />
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#0A0A0A] p-5 rounded-xl border border-[var(--border-subtle)] shadow">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="font-bold text-white">{shoot.title}</div>
                                            <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${shoot.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/10 text-[var(--text-tertiary)]'}`}>
                                                {shoot.status || 'Planned'}
                                            </div>
                                        </div>
                                        <time className="text-xs text-[var(--text-tertiary)] mb-4 block">
                                            {new Date(shoot.shoot_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </time>

                                        {shoot.videos && shoot.videos.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                                                <div className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] mb-2 flex items-center gap-1.5">
                                                    <FileText size={12} /> Deliverables
                                                </div>
                                                <ul className="space-y-2">
                                                    {shoot.videos.map((vid: any) => (
                                                        <li key={vid.id} className="flex items-start gap-2 text-sm">
                                                            <div className={`mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full ${vid.completed ? 'bg-emerald-500' : 'bg-white/20'}`} />
                                                            <div className="flex-1">
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
        </main >
    );
}
