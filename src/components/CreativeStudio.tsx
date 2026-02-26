'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, Plus, RefreshCw, X, FileText, Clapperboard, Users, Zap, Search } from 'lucide-react';
import { Client } from '@/types';
import { addIdea } from '@/app/actions';
import toast from 'react-hot-toast';

interface CreativeStudioProps {
    clients: Client[];
}

export default function CreativeStudio({ clients }: CreativeStudioProps) {
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const [aiIdea, setAiIdea] = useState<{ title: string, description: string, script?: string } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);

    // AI prompt options
    const [contentType, setContentType] = useState('organic-viral');
    const [tone, setTone] = useState('');

    // Competitor analysis state
    const [competitorDescription, setCompetitorDescription] = useState('');
    const [isAnalyzingCompetitor, setIsAnalyzingCompetitor] = useState(false);
    const [competitorResult, setCompetitorResult] = useState<{ angles: any[], keyInsight: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'brainstorm' | 'competitor'>('brainstorm');

    const selectedClient = clients.find(c => c.id === selectedClientId);

    const generateAiIdea = async (withScript = false) => {
        setIsGenerating(!withScript);
        setIsGeneratingScript(withScript);
        if (!withScript) setAiIdea(null);

        try {
            const res = await fetch('/api/generate-idea', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientName: selectedClient?.name || 'a premium brand',
                    contentType,
                    tone: tone || undefined,
                    generateScript: withScript,
                }),
            });
            const data = await res.json();
            if (data.error) {
                toast.error(data.error);
                return;
            }
            if (withScript && aiIdea) {
                setAiIdea({ ...aiIdea, script: data.script });
            } else {
                setAiIdea(data);
            }
        } catch (error) {
            toast.error('Failed to generate idea');
        } finally {
            setIsGenerating(false);
            setIsGeneratingScript(false);
        }
    };

    const handleAddAiIdea = async () => {
        if (!aiIdea || !selectedClientId) {
            toast.error('Select a client first');
            return;
        }
        setIsAdding(true);
        const formData = new FormData();
        formData.set('clientId', String(selectedClientId));
        formData.set('title', aiIdea.title);
        const fullDescription = aiIdea.script
            ? `${aiIdea.description}\n\n---\n📝 SCRIPT:\n${aiIdea.script}`
            : aiIdea.description;
        formData.set('description', fullDescription);

        try {
            await addIdea(formData);
            toast.success(`Idea added to ${selectedClient?.company_name || selectedClient?.name}`);
            setAiIdea(null);
        } catch (e) {
            toast.error('Failed to add idea');
        } finally {
            setIsAdding(false);
        }
    };

    const analyzeCompetitor = async () => {
        if (!competitorDescription) return;
        setIsAnalyzingCompetitor(true);
        setCompetitorResult(null);
        try {
            const res = await fetch('/api/analyze-competitor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    competitorDescription,
                    clientName: selectedClient?.name || 'our brand',
                }),
            });
            const data = await res.json();
            if (data.error) {
                toast.error(data.error);
                return;
            }
            setCompetitorResult(data);
        } catch (error) {
            toast.error('Failed to analyze competitor');
        } finally {
            setIsAnalyzingCompetitor(false);
        }
    };

    const addAngleAsIdea = async (angle: any) => {
        if (!selectedClientId) {
            toast.error('Select a client first');
            return;
        }
        setIsAdding(true);
        const formData = new FormData();
        formData.set('clientId', String(selectedClientId));
        formData.set('title', angle.title);
        formData.set('description', `ANGLE DE DIFFÉRENCIATION :\n${angle.why}\n\nFORMAT SUGGÉRÉ : ${angle.format}`);

        try {
            await addIdea(formData);
            toast.success(`Angle added as idea for ${selectedClient?.company_name}`);
        } catch (e) {
            toast.error('Failed to add idea');
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Context Selector */}
            <div className="bg-[#09090b]/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                        <Users size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Focus Context</h2>
                        <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-widest font-bold">Select Client to Save Ideas</p>
                    </div>
                </div>
                <div className="flex-1 md:max-w-md">
                    <select
                        value={selectedClientId || ''}
                        onChange={(e) => setSelectedClientId(e.target.value ? Number(e.target.value) : null)}
                        className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                    >
                        <option value="">Generic Brainstorming (No Client Selected)</option>
                        {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.company_name || c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Lateral Tabs */}
                <div className="lg:col-span-3 space-y-2">
                    <button
                        onClick={() => setActiveTab('brainstorm')}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all border ${activeTab === 'brainstorm' ? 'bg-violet-500/10 border-violet-500/30 text-violet-400' : 'bg-transparent border-transparent text-[var(--text-tertiary)] hover:bg-white/5'}`}
                    >
                        <Zap size={18} /> Brainstorming
                    </button>
                    <button
                        onClick={() => setActiveTab('competitor')}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all border ${activeTab === 'competitor' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-transparent border-transparent text-[var(--text-tertiary)] hover:bg-white/5'}`}
                    >
                        <Search size={18} /> Competitor Deep-Dive
                    </button>
                </div>

                {/* Main Workshop Area */}
                <div className="lg:col-span-9">
                    {activeTab === 'brainstorm' ? (
                        <div className="pro-dashboard-card p-8 rounded-3xl space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Sparkles className="text-violet-400" />
                                <h3 className="text-2xl font-bold text-white">AI Suggestion Engine</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 block">Content Category</label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { value: 'ad', label: 'Paid Ads', color: 'from-amber-600 to-orange-600' },
                                            { value: 'organic-educational', label: 'Educational', color: 'from-blue-600 to-cyan-600' },
                                            { value: 'organic-viral', label: 'Viral Trends', color: 'from-pink-600 to-rose-600' },
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setContentType(opt.value)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${contentType === opt.value
                                                    ? `bg-gradient-to-r ${opt.color} text-white border-transparent shadow-lg`
                                                    : 'bg-white/5 border-white/5 text-[var(--text-secondary)] hover:bg-white/10'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 block">Vibe & Tone</label>
                                    <input
                                        type="text"
                                        value={tone}
                                        onChange={e => setTone(e.target.value)}
                                        placeholder="e.g. Cinematic, High-Energy, Minimalist..."
                                        className="w-full bg-black/40 border border-white/10 px-4 py-2 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => generateAiIdea(false)}
                                disabled={isGenerating}
                                className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-violet-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                                {isGenerating ? 'Consulting the Oracle...' : 'Generate New Concept'}
                            </button>

                            {aiIdea && (
                                <div className="mt-8 p-6 rounded-2xl border border-violet-500/30 bg-violet-500/5 animate-in zoom-in-95 duration-500">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h4 className="text-2xl font-bold text-white mb-2">{aiIdea.title}</h4>
                                            <p className="text-[var(--text-secondary)] leading-relaxed">{aiIdea.description}</p>
                                        </div>
                                        <button onClick={() => setAiIdea(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                            <X size={20} className="text-[var(--text-tertiary)]" />
                                        </button>
                                    </div>

                                    {aiIdea.script && (
                                        <div className="mb-6 p-4 rounded-xl bg-black/40 border border-white/5">
                                            <div className="flex items-center gap-2 mb-4 text-emerald-400">
                                                <Clapperboard size={16} />
                                                <span className="text-xs font-bold uppercase tracking-widest">Production Script</span>
                                            </div>
                                            <div className="text-sm text-gray-300 font-mono whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                {aiIdea.script}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
                                        {selectedClientId && (
                                            <button
                                                onClick={handleAddAiIdea}
                                                disabled={isAdding}
                                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                                            >
                                                <Plus size={18} /> {isAdding ? 'Saving...' : 'Add to Strategy'}
                                            </button>
                                        )}
                                        {!aiIdea.script && (
                                            <button
                                                onClick={() => generateAiIdea(true)}
                                                disabled={isGeneratingScript}
                                                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                                            >
                                                <FileText size={18} /> {isGeneratingScript ? 'Writing Script...' : 'Write Full Script'}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => generateAiIdea(false)}
                                            className="ml-auto flex items-center gap-2 px-4 py-2 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 rounded-xl text-sm font-bold transition-all"
                                        >
                                            <RefreshCw size={18} /> Regenerate
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="pro-dashboard-card p-8 rounded-3xl space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Search className="text-indigo-400" />
                                <h3 className="text-2xl font-bold text-white">Competitor Analysis</h3>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm text-[var(--text-secondary)]">Describe what your competitors are doing, or paste a video hook/description they use. AI will find the "white space" for your brand.</p>
                                <textarea
                                    value={competitorDescription}
                                    onChange={e => setCompetitorDescription(e.target.value)}
                                    placeholder="e.g. My competitor just posted a high-budget 3D product render for their new sneakers..."
                                    rows={4}
                                    className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                                />
                                <button
                                    onClick={analyzeCompetitor}
                                    disabled={isAnalyzingCompetitor || !competitorDescription}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {isAnalyzingCompetitor ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                    {isAnalyzingCompetitor ? 'Analyzing Market Gaps...' : 'Find Differentiation Angles'}
                                </button>
                            </div>

                            {competitorResult && (
                                <div className="space-y-6 pt-6 border-t border-white/5 animate-in fade-in duration-500">
                                    <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-300 italic text-sm">
                                        "{competitorResult.keyInsight}"
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {competitorResult.angles.map((angle, idx) => (
                                            <div key={idx} className="p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-indigo-500/40 transition-all flex flex-col">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h5 className="font-bold text-white leading-tight">{angle.title}</h5>
                                                    <span className="text-[10px] px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full font-bold uppercase">{angle.format}</span>
                                                </div>
                                                <p className="text-xs text-[var(--text-tertiary)] mb-4 flex-1 leading-relaxed">{angle.why}</p>
                                                {selectedClientId && (
                                                    <button
                                                        onClick={() => addAngleAsIdea(angle)}
                                                        className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 flex items-center gap-2 transition-colors pt-3 border-t border-white/5"
                                                    >
                                                        <Plus size={14} /> Save to Strategy
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
