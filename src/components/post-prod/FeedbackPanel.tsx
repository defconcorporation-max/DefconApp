'use client';

import { useState } from 'react';
import { resolveFeedbackItem, unresolveFeedbackItem } from '@/app/review-actions';
import { CheckCircle2, Circle, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import FeedbackAiHelper from '../FeedbackAiHelper';

interface FeedbackItem {
    id: number;
    project_id: number;
    feedback: string;
    is_resolved: number;
    admin_comment: string | null;
    created_at: string;
}

export default function FeedbackPanel({
    feedback: initialFeedback,
    projectId,
    shootTitle,
    clientName
}: {
    feedback: FeedbackItem[],
    projectId: number,
    shootTitle?: string,
    clientName?: string
}) {
    const [feedback, setFeedback] = useState<FeedbackItem[]>(initialFeedback);
    const [commentingId, setCommentingId] = useState<number | null>(null);
    const [commentText, setCommentText] = useState('');
    const [isExpanded, setIsExpanded] = useState(true);

    const resolvedCount = feedback.filter(f => f.is_resolved).length;
    const totalCount = feedback.length;

    if (totalCount === 0) {
        return (
            <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-6 mb-6">
                <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-2">
                    <MessageSquare size={16} className="text-indigo-400" />
                    Client Feedback
                </h3>
                <p className="text-sm text-[var(--text-tertiary)] italic">No feedback submitted yet.</p>
            </div>
        );
    }

    const handleResolve = async (id: number, comment?: string) => {
        setFeedback(prev => prev.map(f => f.id === id ? { ...f, is_resolved: 1, admin_comment: comment || f.admin_comment } : f));
        await resolveFeedbackItem(id, comment);
        toast.success('Feedback marked as resolved');
        setCommentingId(null);
        setCommentText('');
    };

    const handleUnresolve = async (id: number) => {
        setFeedback(prev => prev.map(f => f.id === id ? { ...f, is_resolved: 0 } : f));
        await unresolveFeedbackItem(id);
        toast.success('Feedback reopened');
    };

    return (
        <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl overflow-hidden mb-6">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <MessageSquare size={16} className="text-indigo-400" />
                    Client Feedback
                    <span className={`text-xs px-2 py-0.5 rounded-full ${resolvedCount === totalCount ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {resolvedCount}/{totalCount} resolved
                    </span>
                </h3>
                {isExpanded ? <ChevronUp size={16} className="text-[var(--text-tertiary)]" /> : <ChevronDown size={16} className="text-[var(--text-tertiary)]" />}
            </button>

            {isExpanded && (
                <div className="border-t border-[var(--border-subtle)] p-4 space-y-3">
                    {feedback.map(item => (
                        <div key={item.id} className={`flex gap-3 p-3 rounded-lg border transition-all ${item.is_resolved ? 'bg-green-500/5 border-green-500/10 opacity-60' : 'bg-white/5 border-[var(--border-subtle)]'}`}>
                            <button
                                onClick={() => item.is_resolved ? handleUnresolve(item.id) : handleResolve(item.id)}
                                className="flex-shrink-0 mt-0.5"
                                title={item.is_resolved ? 'Click to reopen' : 'Click to resolve'}
                            >
                                {item.is_resolved
                                    ? <CheckCircle2 size={18} className="text-green-500" />
                                    : <Circle size={18} className="text-[var(--text-tertiary)] hover:text-white transition-colors" />
                                }
                            </button>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm ${item.is_resolved ? 'line-through text-[var(--text-tertiary)]' : 'text-white'}`}>
                                    {item.feedback}
                                </p>
                                {item.admin_comment && (
                                    <p className="text-xs text-indigo-400 mt-1 italic">
                                        💬 {item.admin_comment}
                                    </p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </span>
                                    {!item.is_resolved && (
                                        <button
                                            onClick={() => setCommentingId(commentingId === item.id ? null : item.id)}
                                            className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
                                        >
                                            {commentingId === item.id ? 'Cancel' : 'Add comment & resolve'}
                                        </button>
                                    )}
                                </div>

                                {!item.is_resolved && (
                                    <FeedbackAiHelper
                                        feedbackText={item.feedback}
                                        projectTitle={shootTitle || 'Video Project'}
                                        clientName={clientName || 'Client'}
                                    />
                                )}

                                {commentingId === item.id && (
                                    <div className="mt-2 flex gap-2">
                                        <input
                                            value={commentText}
                                            onChange={e => setCommentText(e.target.value)}
                                            placeholder="Add a reply..."
                                            className="flex-1 bg-black border border-[var(--border-subtle)] rounded px-2 py-1 text-xs text-white outline-none focus:border-indigo-500"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleResolve(item.id, commentText)}
                                            className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded hover:bg-green-500/30 transition-colors"
                                        >
                                            Resolve
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
