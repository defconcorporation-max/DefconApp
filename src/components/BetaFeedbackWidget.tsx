'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { addBetaFeedback } from '@/app/actions';
import { MessageSquarePlus, X, Send } from 'lucide-react';

export default function BetaFeedbackWidget() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('content', content);
        formData.append('pageUrl', pathname);

        await addBetaFeedback(formData);

        setIsSubmitting(false);
        setContent('');
        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
            setIsOpen(false);
        }, 2000);
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full mt-4 flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium text-[var(--text-tertiary)] hover:text-white hover:bg-[var(--bg-surface-hover)] transition-all group border border-dashed border-[var(--border-subtle)] hover:border-[var(--text-tertiary)]"
            >
                <MessageSquarePlus className="w-4 h-4" />
                <span>Beta Feedback</span>
            </button>
        );
    }

    return (
        <div className="mt-4 p-3 bg-[var(--bg-root)] border border-[var(--border-subtle)] rounded-lg animate-in slide-in-from-left duration-200">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                    <MessageSquarePlus size={12} className="text-violet-400" />
                    Feedback
                </span>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-[var(--text-tertiary)] hover:text-white transition-colors"
                >
                    <X size={12} />
                </button>
            </div>

            {showSuccess ? (
                <div className="py-4 text-center text-xs text-emerald-400 font-medium">
                    Thanks for your feedback! ✓
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-2">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Describe bug or suggestion..."
                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded p-2 text-xs text-white focus:border-[var(--text-secondary)] outline-none resize-none placeholder:text-[var(--text-tertiary)]"
                        rows={3}
                        autoFocus
                        disabled={isSubmitting}
                    />
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting || !content.trim()}
                            className="bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Sending...' : (
                                <>
                                    Send <Send size={10} />
                                </>
                            )}
                        </button>
                    </div>
                    <div className="text-[9px] text-[var(--text-tertiary)] truncate">
                        Page: {pathname}
                    </div>
                </form>
            )}
        </div>
    );
}
