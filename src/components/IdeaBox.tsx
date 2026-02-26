
'use client';

import { addIdea, updateIdeaStatus } from '@/app/actions';
import { useState } from 'react';
import { Sparkles, Loader2, Plus, RefreshCw, X, FileText, Clapperboard } from 'lucide-react';

export default function IdeaBox({ clientId, ideas, clientName }: { clientId: number, ideas: any[], clientName?: string }) {
    const [expandedIds, setExpandedIds] = useState<number[]>([]);
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
    const [showCompetitorInput, setShowCompetitorInput] = useState(false);

    const activeIdeas = ideas.filter(i => i.status !== 'Archived');
    const archivedIdeas = ideas.filter(i => i.status === 'Archived');

    const toggleExpand = (id: number) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleStatusChange = async (id: number, newStatus: string) => {
        await updateIdeaStatus(id, newStatus, clientId);
    };

    const generateAiIdea = async (withScript = false) => {
        if (withScript) {
            setIsGeneratingScript(true);
        } else {
            setIsGenerating(true);
            setAiIdea(null);
        }
        try {
            const existingTitles = activeIdeas.map(i => i.title);
            const res = await fetch('/api/generate-idea', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientName: clientName || 'this client',
                    existingIdeas: existingTitles,
                    contentType,
                    tone: tone || undefined,
                    generateScript: withScript,
                }),
            });
            const data = await res.json();
            if (data.error) {
                console.error('AI error:', data.error);
                return;
            }
            if (withScript && aiIdea) {
                // Keep existing idea but add the script
                setAiIdea({ ...aiIdea, script: data.script });
            } else {
                setAiIdea(data);
            }
        } catch (error) {
            console.error('Failed to generate idea:', error);
        } finally {
            setIsGenerating(false);
            setIsGeneratingScript(false);
        }
    };

    const handleAddAiIdea = async () => {
        if (!aiIdea) return;
        setIsAdding(true);
        const formData = new FormData();
        formData.set('clientId', String(clientId));
        formData.set('title', aiIdea.title);
        const fullDescription = aiIdea.script
            ? `${aiIdea.description}\n\n---\n📝 SCRIPT:\n${aiIdea.script}`
            : aiIdea.description;
        formData.set('description', fullDescription);
        await addIdea(formData);
        setAiIdea(null);
        setIsAdding(false);
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
                    clientName: clientName || 'this client',
                }),
            });
            const data = await res.json();
            if (data.error) {
                console.error('AI error:', data.error);
                return;
            }
            setCompetitorResult(data);
        } catch (error) {
            console.error('Failed to analyze competitor:', error);
        } finally {
            setIsAnalyzingCompetitor(false);
        }
    };

    const addAngleAsIdea = async (angle: any) => {
        setIsAdding(true);
        const formData = new FormData();
        formData.set('clientId', String(clientId));
        formData.set('title', angle.title);
        formData.set('description', `ANGLE DE DIFFÉRENCIATION :\n${angle.why}\n\nFORMAT SUGGÉRÉ : ${angle.format}`);
        await addIdea(formData);
        setIsAdding(false);
        // Note: we don't clear competitorResult here so they can add multiple angles
    };

    return (
        <div className="glass-panel p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold neo-gradient-text">Idea Box</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowCompetitorInput(!showCompetitorInput)}
                        className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border transition-all ${showCompetitorInput ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-white/5 border-white/10 text-[var(--text-tertiary)] hover:text-white'}`}
                    >
                        Analyse Concurrent
                    </button>
                    <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-full">{activeIdeas.length} Active</span>
                </div>
            </div>

            {/* Competitor Analysis Section */}
            {showCompetitorInput && (
                <div className="mb-6 p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 mb-4">
                        <X
                            size={16}
                            className="text-[var(--text-tertiary)] hover:text-white cursor-pointer ml-auto order-last"
                            onClick={() => {
                                setShowCompetitorInput(false);
                                setCompetitorResult(null);
                            }}
                        />
                        <Sparkles size={16} className="text-indigo-400" />
                        <span className="text-sm font-bold text-white">Analyse de la Différenciation</span>
                    </div>

                    <div className="space-y-3">
                        <textarea
                            value={competitorDescription}
                            onChange={e => setCompetitorDescription(e.target.value)}
                            placeholder="Décris un concurrent, colle un lien, ou décris un contenu qui marche chez les autres..."
                            rows={3}
                            className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-[var(--text-tertiary)] resize-none"
                        />
                        <button
                            onClick={analyzeCompetitor}
                            disabled={isAnalyzingCompetitor || !competitorDescription}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold uppercase tracking-wider"
                        >
                            {isAnalyzingCompetitor ? (
                                <><Loader2 size={14} className="animate-spin" /> Analyse en cours...</>
                            ) : (
                                <><Sparkles size={14} /> Analyser & Différencier</>
                            )}
                        </button>
                    </div>

                    {competitorResult && (
                        <div className="mt-6 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                            <div className="p-3 bg-black/40 rounded-lg border border-indigo-500/20">
                                <p className="text-xs font-medium text-indigo-400 italic">"{competitorResult.keyInsight}"</p>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {competitorResult.angles.map((angle, idx) => (
                                    <div key={idx} className="p-3 bg-white/5 rounded-lg border border-white/5 hover:border-indigo-500/30 transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <h5 className="text-sm font-bold text-white">{angle.title}</h5>
                                            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20">
                                                {angle.format}
                                            </span>
                                        </div>
                                        <p className="text-xs text-[var(--text-secondary)] mb-3">{angle.why}</p>
                                        <button
                                            onClick={() => addAngleAsIdea(angle)}
                                            className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                                        >
                                            <Plus size={12} /> Ajouter au backlog
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* AI Generation Controls */}
            <div className="mb-6 p-4 rounded-xl border border-[var(--border-subtle)] bg-black/30">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={16} className="text-violet-400" />
                    <span className="text-sm font-bold text-white">Générateur IA</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    {/* Content Type */}
                    <div>
                        <label className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-bold mb-1 block">Type de contenu</label>
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                { value: 'ad', label: '📢 Ad', color: 'from-amber-600 to-orange-600' },
                                { value: 'organic-educational', label: '📚 Éducatif', color: 'from-blue-600 to-cyan-600' },
                                { value: 'organic-viral', label: '🔥 Viral', color: 'from-pink-600 to-rose-600' },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setContentType(opt.value)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${contentType === opt.value
                                        ? `bg-gradient-to-r ${opt.color} text-white shadow-lg`
                                        : 'bg-white/5 text-[var(--text-secondary)] hover:bg-white/10'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tone / Mood */}
                    <div>
                        <label className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-bold mb-1 block">Ton / Humeur</label>
                        <input
                            type="text"
                            value={tone}
                            onChange={e => setTone(e.target.value)}
                            placeholder="ex: Humoristique, Inspirant, Corporate..."
                            className="w-full bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-violet-500 transition-colors placeholder:text-[var(--text-tertiary)]"
                        />
                    </div>
                </div>

                <button
                    onClick={() => generateAiIdea(false)}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20 w-full justify-center"
                >
                    {isGenerating ? (
                        <><Loader2 size={16} className="animate-spin" /> Génération en cours...</>
                    ) : (
                        <><Sparkles size={16} /> Générer une idée</>
                    )}
                </button>
            </div>

            {/* AI Generated Idea Preview */}
            {aiIdea && (
                <div className="mb-6 p-4 rounded-xl border border-violet-500/30 bg-violet-500/5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={14} className="text-violet-400" />
                        <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">Suggestion IA</span>
                    </div>
                    <h4 className="text-white font-semibold text-lg mb-1">{aiIdea.title}</h4>
                    <p className="text-sm text-gray-400 mb-4">{aiIdea.description}</p>

                    {/* Script Display */}
                    {aiIdea.script && (
                        <div className="mb-4 p-3 rounded-lg bg-black/30 border border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                                <Clapperboard size={14} className="text-emerald-400" />
                                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Script</span>
                            </div>
                            <p className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">{aiIdea.script}</p>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={handleAddAiIdea}
                            disabled={isAdding}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
                        >
                            <Plus size={14} /> {isAdding ? 'Ajout...' : 'Ajouter à la liste'}
                        </button>
                        {!aiIdea.script && (
                            <button
                                onClick={() => generateAiIdea(true)}
                                disabled={isGeneratingScript}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
                            >
                                <FileText size={14} className={isGeneratingScript ? 'animate-pulse' : ''} />
                                {isGeneratingScript ? 'Écriture du script...' : '📝 Générer le script'}
                            </button>
                        )}
                        <button
                            onClick={() => generateAiIdea(false)}
                            disabled={isGenerating}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} /> Régénérer
                        </button>
                        <button
                            onClick={() => setAiIdea(null)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs transition-colors ml-auto"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Add Idea Form */}
            <form action={addIdea} className="mb-8">
                <input type="hidden" name="clientId" value={clientId} />
                <div className="flex flex-col gap-2">
                    <input name="title" placeholder="New Content Idea title..." className="bg-black/40 border border-white/10 p-3 rounded-lg focus:outline-none focus:border-violet-500 transition-colors w-full" required />
                    <textarea name="description" placeholder="Expand on the idea (optional)..." rows={2} className="bg-black/40 border border-white/10 p-3 rounded-lg focus:outline-none focus:border-violet-500 transition-colors w-full text-sm resize-none"></textarea>
                    <div className="flex justify-end">
                        <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded text-sm transition-colors">Add Idea</button>
                    </div>
                </div>
            </form>

            {/* Active Ideas List */}
            <div className="space-y-3 mb-8">
                {activeIdeas.map(idea => (
                    <div key={idea.id} className={`bg-black/20 border border-white/5 rounded-xl transition-all duration-300 ${expandedIds.includes(idea.id) ? 'p-4' : 'p-3'}`}>
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                className="mt-1.5 w-4 h-4 rounded border-white/20 bg-black/50 checked:bg-violet-500 cursor-pointer"
                                onChange={() => handleStatusChange(idea.id, 'Archived')}
                            />
                            <div className="flex-1 cursor-pointer" onClick={() => toggleExpand(idea.id)}>
                                <h4 className="font-medium text-gray-200">{idea.title}</h4>
                                {expandedIds.includes(idea.id) && idea.description && (
                                    <p className="mt-2 text-sm text-gray-400 whitespace-pre-wrap animate-in fade-in slide-in-from-top-1">{idea.description}</p>
                                )}
                            </div>
                            <button onClick={() => toggleExpand(idea.id)} className="text-gray-500 hover:text-white transition-colors">
                                {expandedIds.includes(idea.id) ? '−' : '+'}
                            </button>
                        </div>
                    </div>
                ))}
                {activeIdeas.length === 0 && <p className="text-center text-gray-600 text-sm py-4">No active ideas. Brainstorm something!</p>}
            </div>

            {/* Archived Section */}
            {archivedIdeas.length > 0 && (
                <details className="mt-6">
                    <summary className="cursor-pointer text-xs text-gray-500 uppercase tracking-widest hover:text-gray-300 transition-colors">Show Archived Ideas ({archivedIdeas.length})</summary>
                    <div className="mt-4 space-y-2 opacity-50">
                        {archivedIdeas.map(idea => (
                            <div key={idea.id} className="flex gap-2 items-center p-2 border-b border-white/5">
                                <span className="text-green-500">✓</span>
                                <span className="line-through text-gray-500 text-sm">{idea.title}</span>
                                <button onClick={() => handleStatusChange(idea.id, 'ToDo')} className="ml-auto text-xs text-gray-600 hover:text-white underline">Restore</button>
                            </div>
                        ))}
                    </div>
                </details>
            )}
        </div>
    );
}
