import { getPostProdGanttData } from '@/app/post-prod-actions';
import Link from 'next/link';
import { ArrowLeft, Calendar, Layout } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PostProdGanttPage() {
    const projects = await getPostProdGanttData();

    // Group by Month/Year of due date or shoot date
    const grouped = projects.reduce((acc: any, p: any) => {
        const dateStr = p.due_date || p.shoot_date || p.start_date;
        const date = new Date(dateStr);
        const key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!acc[key]) acc[key] = [];
        acc[key].push(p);
        return acc;
    }, {});

    return (
        <main className="min-h-screen p-8 bg-[var(--bg-root)] text-white">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <Link href="/post-production" className="text-[var(--text-tertiary)] hover:text-white transition-colors flex items-center gap-2 text-sm font-mono mb-4">
                        <ArrowLeft size={16} /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Layout className="text-indigo-400" />
                        Timeline View
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">Active edit workflows sorted by delivery dates.</p>
                </div>
            </header>

            <div className="space-y-12 max-w-5xl">
                {Object.keys(grouped).length === 0 ? (
                    <div className="text-center py-20 text-[var(--text-tertiary)] bg-[#0A0A0A] border border-dashed border-[var(--border-subtle)] rounded-xl">
                        <Calendar className="mx-auto mb-4 opacity-20" size={48} />
                        <h3 className="text-lg font-bold mb-2">No Active Projects</h3>
                        <p>When you start post-production workflows, they will appear here.</p>
                    </div>
                ) : (
                    Object.entries(grouped).map(([month, projs]: [string, any]) => (
                        <div key={month}>
                            <h2 className="text-lg font-bold text-[var(--text-secondary)] mb-4 border-b border-[var(--border-subtle)] pb-2 uppercase tracking-wide">
                                {month}
                            </h2>
                            <div className="space-y-3">
                                {projs.map((p: any) => (
                                    <Link key={p.id} href={`/post-production/${p.id}`} className="block group">
                                        <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-lg p-4 flex items-center gap-6 hover:border-indigo-500/50 hover:bg-[#111] transition-all relative overflow-hidden">

                                            {/* Status indicator line */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${p.status === 'In Progress' ? 'bg-indigo-500' :
                                                    p.status === 'In Review' ? 'bg-orange-500' :
                                                        'bg-emerald-500'
                                                }`} />

                                            <div className="w-1/4 pl-2">
                                                <div className="font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                                                    {p.shoot_title}
                                                </div>
                                                <div className="text-xs text-[var(--text-tertiary)] truncate">
                                                    {p.company_name || p.client_name || 'No Client'}
                                                </div>
                                            </div>

                                            <div className="w-1/6">
                                                <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded inline-block ${p.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                                        p.status === 'In Review' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    }`}>
                                                    {p.status}
                                                </div>
                                            </div>

                                            <div className="flex-1 grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <div className="text-[10px] uppercase text-[var(--text-tertiary)] font-medium mb-1 tracking-wider">Started</div>
                                                    <div className="text-[var(--text-secondary)] font-mono text-xs">
                                                        {new Date(p.start_date).toLocaleDateString()}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="text-[10px] uppercase text-[var(--text-tertiary)] font-medium mb-1 tracking-wider">Due Date</div>
                                                    <div className={`font-mono text-xs font-medium ${!p.due_date ? 'text-[var(--text-tertiary)]' : 'text-red-400'}`}>
                                                        {p.due_date ? new Date(p.due_date).toLocaleDateString() : 'Not set'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-[var(--text-tertiary)] group-hover:text-white transition-colors">
                                                →
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </main>
    );
}
