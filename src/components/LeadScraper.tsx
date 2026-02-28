'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, MapPin, Sparkles, Loader2, Globe, Phone, Mail,
    Bookmark, BookmarkCheck, CheckCircle2, AlertTriangle,
    ExternalLink, Trash2, ArrowRight, Gavel, Target, TrendingUp,
    ChevronRight, X, Copy, MailPlus, LayoutDashboard,
    Instagram, Facebook, Linkedin
} from 'lucide-react';
import {
    searchLeadsAction, qualifyLeadAction, saveLeadToPipeline,
    getPipelineLeads, updateLeadStatusAction, deleteLeadAction,
    Lead
} from '@/app/lead-actions';
import toast from 'react-hot-toast';

export default function LeadScraper() {
    const [view, setView] = useState<'discovery' | 'pipeline'>('discovery');
    const [query, setQuery] = useState('');
    const [radius, setRadius] = useState(1000);
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [pipelineLeads, setPipelineLeads] = useState<Lead[]>([]);
    const [selectedLead, setSelectedLead] = useState<any | null>(null);
    const [isQualifying, setIsQualifying] = useState(false);

    // Load pipeline leads
    useEffect(() => {
        const loadPipeline = async () => {
            const leads = await getPipelineLeads();
            setPipelineLeads(leads);
        };
        loadPipeline();
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query) return;
        setIsSearching(true);
        setSelectedLead(null);
        try {
            const res = await searchLeadsAction(query, radius);
            if (res.success) {
                setSearchResults(res.businesses || []);
                toast.success(`Found ${res.businesses?.length} leads`);
            } else {
                toast.error(res.error || "Search failed");
            }
        } finally {
            setIsSearching(false);
        }
    };

    const handleQualify = async (lead: any) => {
        setIsQualifying(true);
        try {
            const res = await qualifyLeadAction(lead);
            if (res.success) {
                const updatedLead = { ...lead, analysis: res.analysis, scrapedData: res.scrapedData };
                setSelectedLead(updatedLead);
                setSearchResults(prev => prev.map(b => b.place_id === lead.place_id ? updatedLead : b));
                toast.success("AI Analysis Complete");
            } else {
                toast.error(res.error || "Qualification failed");
            }
        } finally {
            setIsQualifying(false);
        }
    };

    const handleSaveToPipeline = async (lead: any) => {
        try {
            const res = await saveLeadToPipeline(lead, lead.scrapedData, lead.analysis);
            if (res.success) {
                toast.success("Saved to Pipeline");
                const leads = await getPipelineLeads();
                setPipelineLeads(leads);
            } else {
                toast.error(res.error || "Failed to save");
            }
        } catch (e) {
            toast.error("Internal Server Error");
        }
    };

    const handleDeleteFromPipeline = async (id: number) => {
        try {
            await deleteLeadAction(id);
            setPipelineLeads(prev => prev.filter(l => l.id !== id));
            toast.success("Lead removed");
        } catch (e) {
            toast.error("Failed to delete");
        }
    };

    const pipelineColumns = [
        { id: 'New', color: 'bg-indigo-500' },
        { id: 'Contacted', color: 'bg-amber-500' },
        { id: 'In Progress', color: 'bg-orange-500' },
        { id: 'Closed', color: 'bg-emerald-500' }
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 pb-20">
            {/* Toggle View */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <Target className="text-indigo-500" size={40} />
                        Lead Command <span className="text-indigo-400">Center</span>
                    </h1>
                    <p className="text-[var(--text-tertiary)] font-bold uppercase tracking-widest text-[10px] mt-2">
                        Advanced Business Discovery & AI Qualification
                    </p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-xl">
                    <button
                        onClick={() => setView('discovery')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${view === 'discovery' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-[var(--text-tertiary)] hover:text-white'}`}
                    >
                        <Search size={16} /> Discovery
                    </button>
                    <button
                        onClick={() => setView('pipeline')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${view === 'pipeline' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-[var(--text-tertiary)] hover:text-white'}`}
                    >
                        <LayoutDashboard size={16} /> Pipeline
                    </button>
                </div>
            </div>

            {view === 'discovery' ? (
                /* DISCOVERY MODE */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Search & Results */}
                    <div className="lg:col-span-5 space-y-6">
                        <form onSubmit={handleSearch} className="pro-dashboard-card p-6 rounded-3xl border border-white/5 bg-[#09090b]/40 backdrop-blur-xl shadow-2xl">
                            <div className="space-y-4">
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="City or Area (e.g. Montreal, Quebec)"
                                        className="w-full bg-black/40 border border-white/10 p-4 pl-12 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-[var(--text-tertiary)]"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase">Search Radius</span>
                                            <span className="text-[10px] font-bold text-indigo-400 uppercase">{radius}m</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="500"
                                            max="5000"
                                            step="500"
                                            value={radius}
                                            onChange={(e) => setRadius(parseInt(e.target.value))}
                                            className="w-full accent-indigo-500 bg-white/5 rounded-lg h-2 cursor-pointer"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSearching}
                                        className="px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-indigo-500/20"
                                    >
                                        {isSearching ? <Loader2 className="animate-spin" size={24} /> : "Discovery"}
                                    </button>
                                </div>
                            </div>
                        </form>

                        <div className="space-y-3 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {searchResults.map((lead, idx) => (
                                <motion.div
                                    key={lead.place_id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => setSelectedLead(lead)}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${selectedLead?.place_id === lead.place_id ? 'bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/20' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-white text-sm truncate">{lead.name}</h3>
                                            <p className="text-[var(--text-tertiary)] text-[10px] flex items-center gap-1 mt-1 truncate">
                                                <MapPin size={10} /> {lead.address}
                                            </p>
                                        </div>
                                        {lead.rating && (
                                            <span className="text-[10px] font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">
                                                ★ {lead.rating}
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                            {searchResults.length === 0 && !isSearching && (
                                <div className="border border-dashed border-white/5 rounded-3xl p-12 text-center">
                                    <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                                        <Target className="text-[var(--text-tertiary)]" />
                                    </div>
                                    <h3 className="text-white font-bold opacity-40">Discovery Waiting</h3>
                                    <p className="text-[var(--text-tertiary)] text-xs mt-1">Search for an area to find new leads</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Detailed Analysis Panel */}
                    <div className="lg:col-span-7">
                        <AnimatePresence mode="wait">
                            {selectedLead ? (
                                <motion.div
                                    key={selectedLead.place_id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="pro-dashboard-card p-8 rounded-[40px] border border-white/5 bg-[#09090b]/60 backdrop-blur-3xl shadow-2xl sticky top-24"
                                >
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <h2 className="text-3xl font-black text-white">{selectedLead.name}</h2>
                                            <p className="text-[var(--text-tertiary)] flex items-center gap-2 mt-2">
                                                <MapPin size={14} /> {selectedLead.address}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleSaveToPipeline(selectedLead)}
                                                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl transition-all"
                                                title="Save to Pipeline"
                                            >
                                                <Bookmark size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                        <div className="p-4 rounded-3xl bg-white/5 border border-white/5">
                                            <span className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-widest block mb-1">Phone</span>
                                            <p className="text-xs text-white font-mono">{selectedLead.phone || "Hidden"}</p>
                                        </div>
                                        <div className="p-4 rounded-3xl bg-white/5 border border-white/5">
                                            <span className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-widest block mb-1">Website</span>
                                            {selectedLead.website ? (
                                                <a href={selectedLead.website} target="_blank" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 truncate">
                                                    Visit <ExternalLink size={10} />
                                                </a>
                                            ) : <p className="text-xs text-[var(--text-tertiary)]">N/A</p>}
                                        </div>
                                        <div className="p-4 rounded-3xl bg-white/5 border border-white/5">
                                            <span className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-widest block mb-1">Socials</span>
                                            <p className="text-xs text-white">{selectedLead.scrapedData?.socialProfiles?.length || 0} Found</p>
                                        </div>
                                        <div className="p-4 rounded-3xl bg-white/5 border border-white/5 text-center">
                                            <span className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-widest block mb-1">AI Rank</span>
                                            <p className={`text-sm font-black ${selectedLead.analysis ? 'text-indigo-400' : 'text-white/20'}`}>
                                                {selectedLead.analysis?.qualification_score || "--"}/10
                                            </p>
                                        </div>
                                    </div>

                                    {!selectedLead.analysis ? (
                                        <div className="flex flex-col items-center justify-center p-12 bg-indigo-500/5 border border-dashed border-indigo-500/20 rounded-[32px]">
                                            <div className="bg-indigo-500/20 p-4 rounded-full mb-6">
                                                <Sparkles className="text-indigo-400" size={32} />
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2 text-center">AI Qualification Required</h3>
                                            <p className="text-[var(--text-tertiary)] text-sm mb-8 text-center max-w-sm">
                                                Our AI will scrape the website, analyze their digital presence, and identify high-value pain points.
                                            </p>
                                            <button
                                                onClick={() => handleQualify(selectedLead)}
                                                disabled={isQualifying}
                                                className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/40 disabled:opacity-50 flex items-center gap-3"
                                            >
                                                {isQualifying ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                                                {isQualifying ? "Analyzing..." : "Qualify Lead"}
                                            </button>
                                        </div>
                                    ) : (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                            {/* AI Analysis View */}
                                            <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Sparkles className="text-indigo-400" size={16} />
                                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Digital Audit</span>
                                                </div>
                                                <p className="text-sm text-slate-200 leading-relaxed mb-6 font-medium">
                                                    {selectedLead.analysis.summary}
                                                </p>

                                                {/* Social Media Audit Section */}
                                                {selectedLead.analysis?.social_json && selectedLead.analysis.social_json.length > 0 && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2">
                                                            <Globe className="text-purple-400" size={16} />
                                                            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Platform Specific Audit</span>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {selectedLead.analysis.social_json.map((insight: any, i: number) => {
                                                                const isIG = insight.platform?.toLowerCase().includes('instagram');
                                                                const isFB = insight.platform?.toLowerCase().includes('facebook');
                                                                const isLI = insight.platform?.toLowerCase().includes('linkedin');

                                                                return (
                                                                    <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/20 transition-all group/insight">
                                                                        <div className="flex justify-between items-start mb-2">
                                                                            <div className="flex items-center gap-2">
                                                                                {isIG && <Instagram size={14} className="text-pink-500" />}
                                                                                {isFB && <Facebook size={14} className="text-blue-500" />}
                                                                                {isLI && <Linkedin size={14} className="text-sky-500" />}
                                                                                {!isIG && !isFB && !isLI && <ExternalLink size={14} className="text-gray-400" />}
                                                                                <span className="text-xs font-bold text-white">{insight.platform}</span>
                                                                            </div>
                                                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${insight.score >= 7 ? 'bg-emerald-500/10 text-emerald-400' :
                                                                                    insight.score >= 4 ? 'bg-amber-500/10 text-amber-400' :
                                                                                        'bg-red-500/10 text-red-400'
                                                                                }`}>
                                                                                {insight.score}/10
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-[11px] text-slate-400 line-clamp-2 italic mb-2 relative">
                                                                            "{insight.verdict}"
                                                                        </p>
                                                                        {insight.followers && (
                                                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                                                                                {insight.followers} Followers
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        {selectedLead.analysis.social_verdict && (
                                                            <p className="text-[11px] text-indigo-300 font-bold bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20">
                                                                <Sparkles size={12} className="inline mr-2" />
                                                                {selectedLead.analysis.social_verdict}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-3">
                                                        <span className="text-[9px] font-black text-red-400/80 uppercase flex items-center gap-1.5"><AlertTriangle size={12} /> Pain Points</span>
                                                        <ul className="space-y-1.5">
                                                            {selectedLead.analysis?.pain_points?.map((p: string, i: number) => (
                                                                <li key={i} className="text-[11px] text-slate-400 flex items-start gap-2">
                                                                    <span className="text-red-500/40 mt-1.5">•</span> {p}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <span className="text-[9px] font-black text-emerald-400/80 uppercase flex items-center gap-1.5"><CheckCircle2 size={12} /> AI Suggestions</span>
                                                        <ul className="space-y-1.5">
                                                            {selectedLead.analysis?.suggestions?.map((s: string, i: number) => (
                                                                <li key={i} className="text-[11px] text-slate-400 flex items-start gap-2">
                                                                    <span className="text-emerald-500/40 mt-1.5">✓</span> {s}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Cold Email Section */}
                                            <div className="relative group">
                                                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                                                <div className="relative pro-dashboard-card p-6 rounded-3xl bg-black/40 border border-white/5">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <MailPlus className="text-indigo-400" size={16} />
                                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Drafted Outreach</span>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                if (selectedLead.analysis?.email_draft) {
                                                                    navigator.clipboard.writeText(selectedLead.analysis.email_draft);
                                                                    toast.success("Copied to clipboard");
                                                                }
                                                            }}
                                                            className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase flex items-center gap-1 transition-colors"
                                                        >
                                                            <Copy size={12} /> Copy Email
                                                        </button>
                                                    </div>
                                                    <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                                                        <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed italic">
                                                            {selectedLead.analysis?.email_draft || "No draft generated"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            ) : (
                                <div className="h-full flex items-center justify-center p-20 border-2 border-dashed border-white/5 rounded-[40px] opacity-20">
                                    <div className="text-center">
                                        <TrendingUp size={48} className="mx-auto mb-4" />
                                        <p className="font-bold">Select a lead to perform deep analysis</p>
                                    </div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            ) : (
                /* PIPELINE MODE (KANBAN) */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-20 overflow-x-auto custom-scrollbar min-h-[70vh]">
                    {pipelineColumns.map(col => {
                        const leads = pipelineLeads.filter(l => l.status === col.id);
                        return (
                            <div key={col.id} className="space-y-6 min-w-[300px]">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${col.color}`}></div>
                                        <h3 className="font-black text-white text-sm uppercase tracking-widest">{col.id}</h3>
                                    </div>
                                    <span className="bg-white/5 px-3 py-1 rounded-lg text-[10px] font-black text-[var(--text-tertiary)] border border-white/5">
                                        {leads.length}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {leads.map(lead => (
                                        <motion.div
                                            key={lead.id}
                                            layoutId={`lead-${lead.id}`}
                                            className="pro-dashboard-card p-5 rounded-3xl border border-white/5 bg-[#09090b]/40 hover:border-indigo-500/30 transition-all group relative"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="font-bold text-white text-sm leading-tight group-hover:text-indigo-400 transition-colors">
                                                    {lead.name}
                                                </h4>
                                                {lead.analysis?.qualification_score && (
                                                    <span className="text-[10px] font-black text-indigo-400">
                                                        {lead.analysis.qualification_score}/10
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                <p className="text-[var(--text-tertiary)] text-[10px] flex items-center gap-1.5 truncate">
                                                    <MapPin size={10} /> {lead.address}
                                                </p>
                                                {lead.phone && (
                                                    <p className="text-[var(--text-tertiary)] text-[10px] flex items-center gap-1.5">
                                                        <Phone size={10} /> {lead.phone}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between gap-1 pt-4 border-t border-white/5">
                                                <select
                                                    value={lead.status}
                                                    onChange={(e) => updateLeadStatusAction(lead.id!, e.target.value)}
                                                    className="bg-transparent text-[9px] font-black text-[var(--text-tertiary)] uppercase border-none focus:ring-0 cursor-pointer hover:text-white transition-colors"
                                                >
                                                    {pipelineColumns.map(c => <option key={c.id} value={c.id} className="bg-[#111]">{c.id}</option>)}
                                                </select>

                                                <button
                                                    onClick={() => handleDeleteFromPipeline(lead.id!)}
                                                    className="p-1.5 text-white/10 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {leads.length === 0 && (
                                        <div className="p-12 border-2 border-dashed border-white/5 rounded-3xl text-center opacity-20">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#555]">Empty Column</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
