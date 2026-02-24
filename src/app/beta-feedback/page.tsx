import { getBetaFeedback, resolveBetaFeedback, deleteBetaFeedback } from '@/app/actions';
import { CheckCircle2, Trash2, ExternalLink, Calendar } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function BetaFeedbackPage() {
    const feedbackList = await getBetaFeedback();

    return (
        <main className="min-h-screen p-4 md:p-8 pt-20 md:pt-8 pb-20">
            <header className="mb-8 border-b border-[var(--border-subtle)] pb-6">
                <h1 className="text-2xl font-bold text-white mb-2">Beta Feedback</h1>
                <p className="text-[var(--text-tertiary)] text-sm">
                    Review feedback submitted by beta testers.
                </p>
            </header>

            <div className="space-y-4 max-w-4xl">
                {feedbackList.length === 0 && (
                    <div className="text-center py-12 border border-dashed border-[var(--border-subtle)] rounded-lg">
                        <p className="text-[var(--text-tertiary)]">No feedback submitted yet.</p>
                    </div>
                )}

                {feedbackList.map(feedback => (
                    <div
                        key={feedback.id}
                        className={`p-4 rounded-lg border flex flex-col md:flex-row gap-4 justify-between items-start transition-all ${feedback.is_resolved
                            ? 'bg-[var(--bg-surface)]/30 border-[var(--border-subtle)] opacity-60'
                            : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] md:hover:border-[var(--text-tertiary)]'
                            }`}
                    >
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${feedback.is_resolved
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                    }`}>
                                    {feedback.is_resolved ? 'Resolved' : 'Open'}
                                </span>
                                <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                                    <Calendar size={10} />
                                    {new Date(feedback.created_at).toLocaleString()}
                                </span>
                            </div>

                            <p className="text-white text-sm whitespace-pre-wrap">{feedback.content}</p>

                            <div className="flex items-center gap-2 pt-2">
                                <span className="text-xs text-[var(--text-tertiary)]">Origin Path:</span>
                                <code className="bg-[var(--bg-root)] px-1.5 py-0.5 rounded text-[10px] text-[var(--text-secondary)] border border-[var(--border-subtle)] font-mono">
                                    {feedback.page_url}
                                </code>
                                <Link href={feedback.page_url} target="_blank" className="text-[var(--text-tertiary)] hover:text-white transition-colors">
                                    <ExternalLink size={12} />
                                </Link>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border-subtle)]">
                            {!feedback.is_resolved && (
                                <form action={resolveBetaFeedback.bind(null, feedback.id)}>
                                    <button
                                        type="submit"
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded text-xs font-medium transition-colors w-full md:w-auto justify-center"
                                        title="Mark as Resolved"
                                    >
                                        <CheckCircle2 size={14} />
                                        <span>Resolve</span>
                                    </button>
                                </form>
                            )}

                            <form action={deleteBetaFeedback}>
                                <input type="hidden" name="id" value={feedback.id} />
                                <button
                                    type="submit"
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded text-xs font-medium transition-colors w-full md:w-auto justify-center"
                                    title="Delete Feedback"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </form>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}
