'use client';

import { useState } from 'react';
import { Sparkles, Loader2, ListChecks, ChevronDown, ChevronUp } from 'lucide-react';

interface FeedbackAiHelperProps {
    feedbackText: string;
    projectTitle?: string;
    clientName?: string;
}

interface Instruction {
    priority: 'haute' | 'moyenne' | 'basse';
    action: string;
}

interface AiResult {
    instructions: Instruction[];
    summary: string;
}

export default function FeedbackAiHelper({ feedbackText, projectTitle, clientName }: FeedbackAiHelperProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<AiResult | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const analyzeFeedback = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            const response = await fetch('/api/generate-postprod-notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    feedbackText,
                    projectTitle,
                    clientName,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate notes');
            }

            const data = await response.json();
            setResult(data);
            setIsExpanded(true);
        } catch (err) {
            console.error('Error analyzing feedback:', err);
            setError('Failed to analyze feedback. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
            {!result ? (
                <button
                    onClick={analyzeFeedback}
                    disabled={isGenerating}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold uppercase tracking-wider"
                >
                    {isGenerating ? (
                        <><Loader2 size={14} className="animate-spin" /> Analyzing Feedback...</>
                    ) : (
                        <><Sparkles size={14} /> Analyze with AI</>
                    )}
                </button>
            ) : (
                <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg overflow-hidden">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full flex items-center justify-between p-3 text-xs font-bold text-indigo-400 uppercase tracking-wider hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <ListChecks size={14} />
                            AI Editing Instructions
                        </div>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {isExpanded && (
                        <div className="p-3 pt-0 space-y-3 animate-in fade-in slide-in-from-top-1">
                            <p className="text-xs italic text-[var(--text-secondary)]">
                                "{result.summary}"
                            </p>
                            <div className="space-y-2">
                                {result.instructions.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 items-start text-xs border-l-2 border-indigo-500/30 pl-2 py-1">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold shrink-0 ${item.priority === 'haute' ? 'bg-red-500/20 text-red-400' :
                                                item.priority === 'moyenne' ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            {item.priority}
                                        </span>
                                        <span className="text-[var(--text-primary)]">{item.action}</span>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => setResult(null)}
                                className="text-[10px] text-[var(--text-tertiary)] hover:text-white underline uppercase tracking-widest transition-colors"
                            >
                                Clear Analysis
                            </button>
                        </div>
                    )}
                </div>
            )}
            {error && (
                <p className="mt-2 text-[10px] text-red-400 text-center">{error}</p>
            )}
        </div>
    );
}
