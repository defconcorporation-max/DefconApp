'use client';

import React, { useState } from 'react';
import { MessageSquare, Send, User, Clock } from 'lucide-react';
import { addVideoCommentPortal } from '@/app/actions';
import toast from 'react-hot-toast';

interface Comment {
    id: number;
    content: string;
    created_at: string;
}

interface ClientDeliverableCommentsProps {
    videoId: number;
    clientId: number;
    initialComments: Comment[];
}

export default function ClientDeliverableComments({ videoId, clientId, initialComments }: ClientDeliverableCommentsProps) {
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        const formData = new FormData();
        formData.set('videoId', String(videoId));
        formData.set('content', newComment);
        formData.set('clientId', String(clientId));

        try {
            await addVideoCommentPortal(formData);
            const optimisticComment: Comment = {
                id: Math.random(),
                content: `[CLIENT]: ${newComment}`,
                created_at: new Date().toISOString()
            };
            setComments([optimisticComment, ...comments]);
            setNewComment('');
            toast.success('Feedback sent to the team');
        } catch (error) {
            toast.error('Failed to send feedback');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mt-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors"
            >
                <MessageSquare size={12} />
                {isOpen ? 'Close Feedback' : `Add Feedback (${comments.length})`}
            </button>

            {isOpen && (
                <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* List */}
                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {comments.length === 0 ? (
                            <p className="text-[10px] text-[var(--text-tertiary)] italic">No feedback yet for this version.</p>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="bg-white/5 p-3 rounded-lg border border-white/5">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                                            <User size={10} /> {comment.content.startsWith('[CLIENT]') ? 'You' : 'Production Team'}
                                        </div>
                                        <div className="flex items-center gap-1 text-[8px] text-[var(--text-tertiary)] uppercase font-mono">
                                            <Clock size={8} /> {new Date(comment.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                        {comment.content.replace('[CLIENT]: ', '').replace('[TEAM]: ', '')}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment or request an edit..."
                            className="flex-1 bg-black/40 border border-white/10 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={isSubmitting || !newComment.trim()}
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
                        >
                            <Send size={14} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
