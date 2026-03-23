'use client';

import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

interface SummaryData {
    date: string;
    shootsToday: number;
    shootsWeek: number;
    taskOverdueCount: number;
    projectOverdueCount: number;
    sections: string[];
    aiSummary: string | null;
}

export default function AIDailySummary() {
    const [data, setData] = useState<SummaryData | null>(null);
    const [loading, setLoading] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/ai-summary');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (e) {
            console.error('Failed to fetch AI summary:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, []);

    if (!data && !loading) return null;

    return (
        <div className="bg-gradient-to-r from-violet-900/20 via-indigo-900/20 to-purple-900/20 border border-violet-500/20 rounded-2xl overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-600/30 flex items-center justify-center">
                        <Sparkles size={16} className="text-violet-400" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-bold text-white">Résumé exécutif</h3>
                        <p className="text-xs text-[var(--text-tertiary)]">
                            {data?.date ? new Date(data.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); fetchSummary(); }}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <RefreshCw size={14} className={`text-[var(--text-tertiary)] ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <span className="text-[var(--text-tertiary)] text-xs">{collapsed ? '▼' : '▲'}</span>
                </div>
            </button>

            {/* Content */}
            {!collapsed && (
                <div className="px-4 pb-4 space-y-3">
                    {loading && !data ? (
                        <div className="text-center py-6 text-[var(--text-tertiary)] text-sm">
                            <Sparkles size={20} className="animate-pulse mx-auto mb-2 text-violet-400" />
                            Analyse en cours...
                        </div>
                    ) : (
                        <>
                            {/* AI Summary (premium highlight) */}
                            {data?.aiSummary && (
                                <div className="bg-violet-600/10 border border-violet-500/20 rounded-xl p-3">
                                    <p className="text-sm text-violet-200 leading-relaxed">
                                        {data.aiSummary}
                                    </p>
                                </div>
                            )}

                            {/* Structured sections */}
                            <div className="space-y-1.5">
                                {data?.sections?.map((section, i) => (
                                    <p key={i} className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                        {section.replace(/\*\*/g, '')}
                                    </p>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
