import { getPostProdDashboard } from '@/app/post-prod-actions';
import { getAllClientFeedback, resolveFeedbackItem } from '@/app/review-actions';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { Film, MessageSquare, CheckCircle2, Circle, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PostProdDashboardPage() {
    const [projects, feedbackList] = await Promise.all([
        getPostProdDashboard(),
        getAllClientFeedback()
    ]);

    const pendingFeedback = feedbackList.filter((f: any) => !f.is_resolved);
    const resolvedFeedback = feedbackList.filter((f: any) => f.is_resolved);

    return (
        <main className="min-h-screen p-8 bg-[var(--bg-root)] text-white">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Post-Production</h1>
                    <p className="text-[var(--text-secondary)] mt-1">Manage edits, versions, delivery workflows, and client feedback.</p>
                </div>
            </header>

            {/* Client Feedback Review Section */}
            {pendingFeedback.length > 0 && (
                <section className="mb-12">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <MessageSquare className="text-orange-400" size={20} />
                        Pending Client Feedback ({pendingFeedback.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {pendingFeedback.map((f: any) => (
                            <Card key={f.id} className="p-4 bg-[#0A0A0A] border-orange-500/30 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 uppercase tracking-wide">
                                        Needs Review
                                    </div>
                                    <span className="text-xs text-[var(--text-tertiary)]">
                                        {new Date(f.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="mb-3">
                                    <Link href={`/post-production/${f.project_id}`} className="text-sm font-bold hover:text-indigo-400 transition-colors flex items-center gap-1 group">
                                        {f.shoot_title || `Project #${f.project_id}`}
                                        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Link>
                                    <div className="text-xs text-[var(--text-secondary)]">Client: {f.client_name}</div>
                                </div>
                                <div className="text-sm bg-[#111] p-3 rounded border border-[var(--border-subtle)] flex-1 break-words">
                                    "{f.feedback}"
                                </div>

                                {/* Quick Resolve Form */}
                                <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                                    <form action={async (formData) => {
                                        'use server';
                                        await resolveFeedbackItem(f.id, formData.get('admin_comment') as string);
                                    }} className="flex items-center gap-2">
                                        <input
                                            name="admin_comment"
                                            placeholder="Add reply (optional)..."
                                            className="text-xs bg-black/50 border border-[var(--border-subtle)] rounded px-2 py-1.5 flex-1 focus:outline-none focus:border-indigo-500 text-white placeholder-[var(--text-tertiary)]"
                                        />
                                        <button type="submit" className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded px-2 py-1.5 flex items-center justify-center transition-colors" title="Mark as Resolved">
                                            <CheckCircle2 size={16} />
                                        </button>
                                    </form>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Film className="text-indigo-400" size={20} />
                Active Projects
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((p) => (
                    <Card key={p.id} className="h-full flex flex-col p-5 border-[var(--border-subtle)] bg-[#0A0A0A] hover:border-indigo-500/50 transition-colors group relative">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-black rounded-lg border border-[var(--border-subtle)]">
                                <Film size={24} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                            </div>
                            <Badge variant="default" className="text-[10px] h-5">{p.status}</Badge>
                        </div>

                        {/* Title Link */}
                        <Link href={`/post-production/${p.id}`} className="block mb-1">
                            <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors">{p.shoot_title}</h3>
                        </Link>

                        <div className="mb-6">
                            <span className="text-xs text-[var(--text-secondary)]">{p.template_name}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                                <span>Progress</span>
                                <span className="text-white font-medium">{p.progress}%</span>
                            </div>
                            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-indigo-500 h-full transition-all duration-500"
                                    style={{ width: `${p.progress}%` }}
                                />
                            </div>
                        </div>

                        {/* Footer with Button */}
                        <div className="mt-auto pt-4 border-t border-[var(--border-subtle)]">
                            <Link
                                href={`/post-production/${p.id}`}
                                className="w-full block text-center py-2.5 rounded-lg bg-white/5 hover:bg-indigo-600 hover:text-white transition-all text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]"
                            >
                                View Project
                            </Link>
                        </div>
                    </Card>
                ))}

                {projects.length === 0 && (
                    <div className="col-span-full py-20 text-center text-[var(--text-tertiary)] bg-[#0A0A0A] border border-dashed border-[var(--border-subtle)] rounded-xl">
                        <Film className="mx-auto mb-4 opacity-20" size={48} />
                        <h3 className="text-lg font-bold mb-2">No Active Edits</h3>
                        <p>Start a workflow from a "Shoot" page to see it here.</p>
                    </div>
                )}
            </div>
        </main>
    );
}
