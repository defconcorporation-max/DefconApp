'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, MapPin, Sparkles, Loader2, Globe, Phone, Mail,
    Bookmark, BookmarkCheck, CheckCircle2, AlertTriangle, ExternalLink, Trash2, ArrowRight,
    Gavel, Target, TrendingUp, ChevronRight, X, Copy, MailPlus,
    LayoutDashboard, Instagram, Facebook, Linkedin, Briefcase,
    History, Calendar, Clock, Star
} from 'lucide-react';
import {
    searchLeadsAction, qualifyLeadAction, saveLeadToPipeline,
    getPipelineLeads, updateLeadStatusAction, deleteLeadAction,
    getLeadDetailsAction, updateLeadNotesAction, markLeadContactedAction, Lead,
    logReachAttemptAction, assignLeadAction, getPipelineStagesAction, getTeamMembersAction, sendSmsAction,
    PipelineStage, TeamMember
} from '@/app/lead-actions';
import toast from 'react-hot-toast';
import { GoogleMap, Circle, Marker, useJsApiLoader } from '@react-google-maps/api';

const darkMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#09090b" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#09090b" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#111" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] }
];

export default function LeadScraper() {
    const [view, setView] = useState<'discovery' | 'pipeline'>('discovery');
    const [query, setQuery] = useState('');
    const [sector, setSector] = useState('');
    const [radius, setRadius] = useState(1000);
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [pipelineLeads, setPipelineLeads] = useState<Lead[]>([]);
    const [selectedLead, setSelectedLead] = useState<any | null>(null);
    const [isQualifying, setIsQualifying] = useState<'rapid' | 'deep' | null>(null);
    const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
    const [tempNotes, setTempNotes] = useState('');
    const [pipelineColumns, setPipelineColumns] = useState<PipelineStage[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

    // Google Maps State
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
    });
    const [mapCenter, setMapCenter] = useState({ lat: 45.5017, lng: -73.5673 });
    const [mapInstance, setMapInstance] = useState<any>(null);

    const onMapLoad = (map: any) => setMapInstance(map);
    const handleMapDragEnd = () => {
        if (mapInstance) {
            const center = mapInstance.getCenter();
            setMapCenter({ lat: center.lat(), lng: center.lng() });
            setQuery("Map Location"); // Soft update the input
        }
    };

    // Batch Mode State
    const [selectedForBatch, setSelectedForBatch] = useState<Set<string>>(new Set());
    const [isBatchQualifying, setIsBatchQualifying] = useState(false);
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

    // Load pipeline leads, stages, and team members
    useEffect(() => {
        const loadPipeline = async () => {
            const [leads, stages, members] = await Promise.all([
                getPipelineLeads(),
                getPipelineStagesAction(),
                getTeamMembersAction()
            ]);
            setPipelineLeads(leads);
            // Fallback for hardcoded stages if none in DB during dev
            setPipelineColumns(stages.length ? stages : [
                { id: 1, label: 'New Leads', value: 'New', color: 'bg-indigo-500', order_index: 0 },
                { id: 2, label: 'Contacted', value: 'Contacted', color: 'bg-amber-500', order_index: 1 },
                { id: 3, label: 'Qualified', value: 'Qualified', color: 'bg-orange-500', order_index: 2 },
                { id: 4, label: 'Closed', value: 'Closed', color: 'bg-emerald-500', order_index: 3 }
            ]);
            setTeamMembers(members);
        };
        loadPipeline();
    }, []);

    const handleSelectLead = async (lead: any) => {
        setSelectedLead(lead);
        if (view === 'pipeline') {
            setTempNotes(lead.notes || '');
            setIsNotesModalOpen(true);
        }
        if (!lead.phone || !lead.website) {
            const res = await getLeadDetailsAction(lead.place_id);
            if (res.success && res.details) {
                const updated = { ...lead, ...res.details };
                setSelectedLead((prev: any) => prev?.place_id === lead.place_id ? updated : prev);
                setSearchResults((prev: any[]) => prev.map(b => b.place_id === lead.place_id ? { ...b, ...res.details } : b));
                if (view === 'pipeline') {
                    setPipelineLeads((prev: any) => prev.map((l: any) => l.place_id === lead.place_id ? { ...l, ...res.details } : l));
                }
            }
        }
    };

    const handleSaveNotes = async () => {
        if (!selectedLead?.id) return;
        try {
            await updateLeadNotesAction(selectedLead.id, tempNotes);
            setPipelineLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, notes: tempNotes } : l));
            toast.success("Notes saved");
        } catch (e) {
            toast.error("Failed to save notes");
        }
    };

    const handleMarkContacted = async () => {
        if (!selectedLead?.id) return;
        try {
            await markLeadContactedAction(selectedLead.id);
            const now = new Date().toISOString();
            setPipelineLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, last_contact_at: now } : l));
            setSelectedLead((prev: any) => ({ ...prev, last_contact_at: now }));
            toast.success("Contact logged");
        } catch (e) {
            toast.error("Failed to log contact");
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        // Allow search if we have a valid map center, even if query string is generic
        if (!query && !mapCenter) {
            toast.error("Please enter a location or query");
            return;
        }
        setIsSearching(true);
        setSelectedLead(null);
        setSelectedForBatch(new Set()); // Reset batch selection on new search
        try {
            const res = await searchLeadsAction(query || 'Map Location', sector || undefined, radius, mapCenter.lat, mapCenter.lng);
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

    const handleQualify = async (lead: any, mode: 'rapid' | 'deep' = 'deep') => {
        setIsQualifying(mode);
        try {
            const res = await qualifyLeadAction(lead, 'fr', mode);
            if (res.success && 'analysis' in res) {
                const updatedLead = {
                    ...lead,
                    ...res.updatedDetails, // Merge newly found phone/website
                    analysis: res.analysis,
                    scrapedData: res.scrapedData
                };
                setSelectedLead(updatedLead);
                setSearchResults(prev => prev.map(b => b.place_id === lead.place_id ? updatedLead : b));

                // Also update pipeline view if needed
                const freshPipeline = await getPipelineLeads();
                setPipelineLeads(freshPipeline);

                if (mode === 'deep') {
                    toast.success("Deep Analysis Complete");
                } else {
                    toast.success("Flash Audit Complete");
                }
            } else if (!res.success) {
                toast.error((res as any).error || "Qualification failed");
            }
        } finally {
            setIsQualifying(null);
        }
    };

    const toggleBatchSelection = (placeId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedForBatch(prev => {
            const newSet = new Set(prev);
            if (newSet.has(placeId)) {
                newSet.delete(placeId);
            } else {
                newSet.add(placeId);
            }
            return newSet;
        });
    };

    const handleBatchQualify = async (mode: 'rapid' | 'deep' = 'rapid') => {
        const leadsToQualify = searchResults.filter(l => selectedForBatch.has(l.place_id));
        if (leadsToQualify.length === 0) return;

        setIsBatchQualifying(true);
        setBatchProgress({ current: 0, total: leadsToQualify.length });

        for (let i = 0; i < leadsToQualify.length; i++) {
            const lead = leadsToQualify[i];
            try {
                const res = await qualifyLeadAction(lead, 'fr', mode);
                if (res.success && 'analysis' in res) {
                    const updatedLead = {
                        ...lead,
                        ...res.updatedDetails,
                        analysis: res.analysis,
                        scrapedData: res.scrapedData
                    };
                    setSearchResults(prev => prev.map(b => b.place_id === lead.place_id ? updatedLead : b));
                }
            } catch (error) {
                console.error(`Failed to qualify ${lead.name}`, error);
            }
            setBatchProgress(prev => ({ ...prev, current: i + 1 }));
        }

        setIsBatchQualifying(false);
        setSelectedForBatch(new Set());
        toast.success(`Batch ${mode} qualification complete`);
    };

    // Drag & Drop Handlers
    const handleDragStart = (e: React.DragEvent, lead: Lead) => {
        e.dataTransfer.setData('leadId', lead.id?.toString() || '');
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        const leadIdStr = e.dataTransfer.getData('leadId');
        if (!leadIdStr) return;

        const leadId = parseInt(leadIdStr);
        setPipelineLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));

        try {
            await updateLeadStatusAction(leadId, newStatus);
            toast.success(`Moved to ${newStatus.replace('_', ' ')}`);
        } catch (error) {
            toast.error("Failed to update status");
            const refreshed = await getPipelineLeads();
            setPipelineLeads(refreshed);
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

    const handleAssignLead = async (memberIdStr: string) => {
        if (!selectedLead?.id) return;
        const memberId = memberIdStr ? parseInt(memberIdStr) : null;
        try {
            await assignLeadAction(selectedLead.id, memberId);
            setPipelineLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, assigned_member_id: memberId } : l));
            setSelectedLead((prev: any) => ({ ...prev, assigned_member_id: memberId }));
            toast.success("Lead assigned");
        } catch (e) {
            toast.error("Failed to assign lead");
        }
    };

    const handleLogReachAttempt = async () => {
        if (!selectedLead?.id) return;
        try {
            await logReachAttemptAction(selectedLead.id);
            const now = new Date().toISOString();
            setPipelineLeads(prev => prev.map(l => l.id === selectedLead.id ? {
                ...l,
                reach_count: (l.reach_count || 0) + 1,
                last_reach_at: now
            } : l));
            setSelectedLead((prev: any) => ({
                ...prev,
                reach_count: (prev.reach_count || 0) + 1,
                last_reach_at: now
            }));
            toast.success("Reach attempt logged");
        } catch (e) {
            toast.error("Failed to log reach attempt");
        }
    };

    const handleCallContact = () => {
        if (!selectedLead?.phone) return;
        // Placeholder for Twilio Call
        toast.success(`Calling ${selectedLead.phone} (Simulation)...`);
    };

    const handleSmsContact = async () => {
        if (!selectedLead?.phone) return;
        const msg = window.prompt("Enter SMS message:");
        if (msg) {
            toast.loading("Sending SMS...");
            await sendSmsAction(selectedLead.phone, msg);
            toast.dismiss();
            toast.success("SMS Sent (Simulation)");
        }
    };

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
                    {/* Search & Results Panel - Hidden on mobile if a lead is selected */}
                    <div className={`lg:col-span-5 space-y-6 ${selectedLead ? 'hidden lg:block' : 'block'}`}>
                        <form onSubmit={handleSearch} className="pro-dashboard-card p-6 rounded-3xl border border-white/5 bg-[#09090b]/40 backdrop-blur-xl shadow-2xl">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={20} />
                                        <input
                                            type="text"
                                            placeholder="What? (e.g. Plumber, Lawyer, Bakery)"
                                            className="w-full bg-black/40 border border-white/10 p-4 pl-12 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-[var(--text-tertiary)]"
                                            value={sector}
                                            onChange={(e) => setSector(e.target.value)}
                                        />
                                    </div>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={20} />
                                        <input
                                            type="text"
                                            placeholder="Where? (e.g. Montreal, Downtown)"
                                            className="w-full bg-black/40 border border-white/10 p-4 pl-12 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-[var(--text-tertiary)]"
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                        />
                                    </div>
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

                        {/* Interactive Map Area */}
                        <div className="h-[250px] w-full rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl">
                            {isLoaded ? (
                                <GoogleMap
                                    mapContainerStyle={{ width: '100%', height: '100%' }}
                                    center={mapCenter}
                                    zoom={14}
                                    options={{ disableDefaultUI: true, zoomControl: true, styles: darkMapStyle }}
                                    onLoad={onMapLoad}
                                    onDragEnd={handleMapDragEnd}
                                >
                                    <Circle
                                        center={mapCenter}
                                        radius={radius}
                                        options={{
                                            fillColor: '#6366f1',
                                            fillOpacity: 0.15,
                                            strokeColor: '#6366f1',
                                            strokeOpacity: 0.8,
                                            strokeWeight: 2,
                                            clickable: false,
                                            editable: false,
                                            zIndex: 1
                                        }}
                                    />
                                    <Marker position={mapCenter} />
                                </GoogleMap>
                            ) : (
                                <div className="w-full h-full bg-black/40 flex flex-col items-center justify-center border border-white/5">
                                    <Loader2 className="animate-spin text-indigo-500 mb-2" size={24} />
                                    <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Loading Map...</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {searchResults.map((lead, idx) => (
                                <motion.div
                                    key={lead.place_id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => handleSelectLead(lead)}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${selectedLead?.place_id === lead.place_id ? 'bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/20' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                                >
                                    <div
                                        onClick={(e) => toggleBatchSelection(lead.place_id, e)}
                                        className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedForBatch.has(lead.place_id) ? 'bg-indigo-500 border-indigo-500' : 'border-white/20 hover:border-white/40'}`}
                                    >
                                        {selectedForBatch.has(lead.place_id) && <CheckCircle2 size={12} className="text-white" />}
                                    </div>
                                    <div className="flex-1 flex justify-between items-start overflow-hidden">
                                        <div className="flex-1 min-w-0 pr-2">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-white text-sm truncate">{lead.name}</h3>
                                                {lead.in_pipeline && (
                                                    <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 font-bold uppercase tracking-wider shrink-0">
                                                        Pipeline
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[var(--text-tertiary)] text-[10px] flex items-center gap-1 mt-1 truncate">
                                                <MapPin size={10} className="shrink-0" /> <span className="truncate">{lead.address}</span>
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            {lead.rating && (
                                                <span className="shrink-0 text-[10px] font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20 whitespace-nowrap">
                                                    ★ {lead.rating}
                                                </span>
                                            )}
                                            {lead.in_pipeline && lead.status && (
                                                <span className="text-[9px] text-white/40 italic capitalize">{lead.status.replace('_', ' ')}</span>
                                            )}
                                        </div>
                                    </div>
                                    {/* Indicator if already qualified */}
                                    {(lead.analysis || lead.in_pipeline) && (
                                        <div className="flex flex-col items-center gap-1 shrink-0">
                                            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                                            {lead.analysis?.qualification_score && (
                                                <span className="text-[9px] font-bold text-emerald-400">{lead.analysis.qualification_score}/10</span>
                                            )}
                                        </div>
                                    )}
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

                        {/* Batch Qualification Action Bar */}
                        <AnimatePresence>
                            {selectedForBatch.size > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="fixed bottom-6 left-6 lg:left-auto lg:w-[calc((100vw-4rem)*5/12)] z-50 p-4 rounded-2xl bg-[#09090b]/90 backdrop-blur-xl border border-indigo-500/30 shadow-2xl flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                            {selectedForBatch.size}
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm">Leads Selected</p>
                                            {isBatchQualifying && (
                                                <p className="text-indigo-400 text-xs">
                                                    Qualifying {batchProgress.current} / {batchProgress.total}...
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSelectedForBatch(new Set())}
                                            disabled={isBatchQualifying}
                                            className="p-2 hover:bg-white/10 rounded-xl text-white/50 transition-colors disabled:opacity-50"
                                        >
                                            <X size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleBatchQualify('rapid')}
                                            disabled={isBatchQualifying}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
                                        >
                                            {isBatchQualifying ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                            Flash Audit
                                        </button>
                                        <button
                                            onClick={() => handleBatchQualify('deep')}
                                            disabled={isBatchQualifying}
                                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20"
                                        >
                                            {isBatchQualifying ? <Loader2 className="animate-spin" size={16} /> : <Gavel size={16} />}
                                            Deep Dive
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Detailed Analysis Panel - Full width on mobile if selected */}
                    <div className={`lg:col-span-7 ${!selectedLead ? 'hidden lg:block' : 'block'}`}>
                        <AnimatePresence mode="wait">
                            {selectedLead ? (
                                <motion.div
                                    key={selectedLead.place_id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="pro-dashboard-card p-6 lg:p-8 rounded-[40px] border border-white/5 bg-[#09090b]/60 backdrop-blur-3xl shadow-2xl sticky top-24"
                                >
                                    {/* Mobile Back Button */}
                                    <div className="lg:hidden mb-6">
                                        <button
                                            onClick={() => setSelectedLead(null)}
                                            className="flex items-center gap-2 text-sm font-bold text-[var(--text-tertiary)] hover:text-white transition-colors"
                                        >
                                            <ChevronRight className="rotate-180" size={16} /> Back to Search Results
                                        </button>
                                    </div>
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

                                    {/* Responsive 2x2 grid on mobile, 4 columns on large screens */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                        <div className="p-4 rounded-3xl bg-white/5 border border-white/5">
                                            <span className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-widest block mb-1">Phone</span>
                                            <p className={`text-xs font-mono ${selectedLead.phone ? 'text-white' : 'text-white/20 italic'}`}>
                                                {selectedLead.phone || "Ready to Qualify"}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-3xl bg-white/5 border border-white/5">
                                            <span className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-widest block mb-1">Website</span>
                                            {selectedLead.website ? (
                                                <a href={selectedLead.website} target="_blank" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 truncate">
                                                    Visit <ExternalLink size={10} />
                                                </a>
                                            ) : <p className="text-xs text-white/20 italic">Ready to Qualify</p>}
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

                                    {(!selectedLead.analysis || selectedLead.analysis.mode === 'rapid') && (
                                        <div className="flex flex-col items-center justify-center p-12 bg-indigo-500/5 border border-dashed border-indigo-500/20 rounded-[32px] mb-8">
                                            <div className="bg-indigo-500/20 p-4 rounded-full mb-6">
                                                <Sparkles className="text-indigo-400" size={32} />
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2 text-center">
                                                {selectedLead.analysis?.mode === 'rapid' ? 'Deep Dive Available' : 'AI Qualification Required'}
                                            </h3>
                                            <p className="text-[var(--text-tertiary)] text-sm mb-8 text-center max-w-sm">
                                                {selectedLead.analysis?.mode === 'rapid'
                                                    ? 'You have a flash audit. Run a Deep Dive for full social analysis, competitors, and email drafts.'
                                                    : 'Our AI will scrape the website, analyze their digital presence, and identify high-value pain points.'}
                                            </p>
                                            <div className="flex gap-4 w-full max-w-lg">
                                                {(!selectedLead.analysis?.mode || selectedLead.analysis.mode !== 'rapid') && (
                                                    <button
                                                        onClick={() => handleQualify(selectedLead, 'rapid')}
                                                        disabled={!!isQualifying}
                                                        className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/40 disabled:opacity-50 flex items-center justify-center gap-3"
                                                    >
                                                        {isQualifying === 'rapid' ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                                                        Flash Audit
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleQualify(selectedLead, 'deep')}
                                                    disabled={!!isQualifying}
                                                    className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-purple-500/40 disabled:opacity-50 flex items-center justify-center gap-3"
                                                >
                                                    {isQualifying === 'deep' ? <Loader2 className="animate-spin" /> : <Gavel size={20} />}
                                                    Deep Dive
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {selectedLead.analysis && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                            {/* AI Analysis View */}
                                            <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Sparkles className="text-indigo-400" size={16} />
                                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Digital Audit</span>
                                                </div>

                                                {/* Brand Vibe Header */}
                                                <div className="mb-6 bg-white/5 p-4 rounded-2xl border border-white/5">
                                                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1">Brand Identity & Vibe</span>
                                                    <p className="text-base font-black text-white leading-tight">
                                                        {selectedLead.analysis.brandVibe || "Professional / Local"}
                                                    </p>
                                                </div>

                                                <p className="text-sm text-slate-200 leading-relaxed mb-6 font-medium">
                                                    {selectedLead.analysis.summary}
                                                </p>

                                                {/* Found Socials (Raw Links) */}
                                                {selectedLead.scrapedData?.socialProfiles && selectedLead.scrapedData.socialProfiles.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mb-6">
                                                        {selectedLead.scrapedData.socialProfiles.map((p: any, i: number) => (
                                                            <a
                                                                key={i}
                                                                href={p.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-white hover:bg-white/10 hover:border-indigo-500/30 transition-all font-bold group/link"
                                                            >
                                                                {p.platform?.toLowerCase().includes('instagram') && <Instagram size={12} className="text-pink-500" />}
                                                                {p.platform?.toLowerCase().includes('facebook') && <Facebook size={12} className="text-blue-500" />}
                                                                {p.platform?.toLowerCase().includes('linkedin') && <Linkedin size={12} className="text-sky-500" />}
                                                                {!p.platform?.toLowerCase().includes('instagram') && !p.platform?.toLowerCase().includes('facebook') && !p.platform?.toLowerCase().includes('linkedin') && <Globe size={12} className="text-slate-400" />}
                                                                {p.platform || "Direct Link"}
                                                                <ExternalLink size={10} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Social Media Audit Section */}
                                                {selectedLead.analysis?.social_json && selectedLead.analysis.social_json.length > 0 && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Globe className="text-purple-400" size={16} />
                                                                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Deep Content Audit</span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleQualify(selectedLead)}
                                                                disabled={!!isQualifying}
                                                                className="text-[9px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors border border-indigo-500/10 disabled:opacity-50"
                                                            >
                                                                {isQualifying ? "Re-Analyzing..." : "Refresh Deep Audit"}
                                                            </button>
                                                        </div>

                                                        {selectedLead.analysis.contentStrategy && (
                                                            <div className="p-5 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 mb-4 shadow-inner">
                                                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-1 flex items-center gap-2">
                                                                    <Sparkles size={10} /> Strategic Content Roadmap
                                                                </span>
                                                                <p className="text-xs text-indigo-100 font-bold leading-relaxed">
                                                                    {selectedLead.analysis.contentStrategy}
                                                                </p>
                                                            </div>
                                                        )}

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {selectedLead.analysis.social_json.map((insight: any, i: number) => {
                                                                const isIG = insight.platform?.toLowerCase().includes('instagram');
                                                                const isFB = insight.platform?.toLowerCase().includes('facebook');
                                                                const isLI = insight.platform?.toLowerCase().includes('linkedin');

                                                                return (
                                                                    <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/20 transition-all group/insight flex flex-col h-full">
                                                                        <div className="flex justify-between items-start mb-3">
                                                                            <div className="flex items-center gap-2">
                                                                                {isIG && <Instagram size={14} className="text-pink-500" />}
                                                                                {isFB && <Facebook size={14} className="text-blue-500" />}
                                                                                {isLI && <Linkedin size={14} className="text-sky-500" />}
                                                                                {!isIG && !isFB && !isLI && <ExternalLink size={14} className="text-gray-400" />}
                                                                                <span className="text-xs font-black text-white uppercase tracking-tighter">{insight.platform}</span>
                                                                            </div>
                                                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${insight.score >= 7 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                                                                                insight.score >= 4 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' :
                                                                                    'bg-red-500/10 text-red-400 border border-red-500/10'
                                                                                }`}>
                                                                                {insight.score}/10
                                                                            </span>
                                                                        </div>

                                                                        <div className="flex flex-wrap gap-1.5 mb-4">
                                                                            {insight.postingSchedule && (
                                                                                <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${insight.postingSchedule === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
                                                                                    insight.postingSchedule === 'Ghost' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                                                                                        'bg-white/10 text-slate-300 border border-white/5'
                                                                                    }`}>
                                                                                    {insight.postingSchedule}
                                                                                </span>
                                                                            )}
                                                                            {insight.contentStyle && (
                                                                                <span className="text-[9px] font-black px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 uppercase tracking-widest">
                                                                                    {insight.contentStyle} Style
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {/* Mix & Recency Metrics */}
                                                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                                                            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                                                                                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest block mb-0.5">Content Mix</span>
                                                                                <span className="text-[10px] font-bold text-indigo-300 truncate block">
                                                                                    {insight.contentMix || "Mixed"}
                                                                                </span>
                                                                            </div>
                                                                            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                                                                                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest block mb-0.5">Last Post</span>
                                                                                <span className="text-[10px] font-bold text-amber-400 truncate block">
                                                                                    {insight.lastPostRecency || "Recently"}
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        <p className="text-[11px] text-slate-300 leading-relaxed mb-4 italic font-medium line-clamp-4 overflow-hidden">
                                                                            "{insight.verdict}"
                                                                        </p>

                                                                        {insight.contentIdeas && insight.contentIdeas.length > 0 && (
                                                                            <div className="mt-auto pt-4 border-t border-white/5 space-y-2">
                                                                                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest block">Proposed Content Ideas</span>
                                                                                <div className="space-y-1.5">
                                                                                    {insight.contentIdeas.map((idea: string, idx: number) => (
                                                                                        <div key={idx} className="flex items-start gap-2 text-[10px] text-indigo-200/80 font-bold leading-tight">
                                                                                            <span className="text-indigo-500 flex-shrink-0">•</span> {idea}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5 text-[9px] font-black text-white/40 uppercase tracking-tighter">
                                                                            <span>{insight.followers || "N/A"} Followers</span>
                                                                            <span>{insight.postsCount || "N/A"} Posts</span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
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
                        const leads = pipelineLeads.filter(l => l.status === col.value);
                        return (
                            <div
                                key={col.id}
                                className="space-y-6 min-w-[300px]"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, col.value)}
                            >
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${col.color}`}></div>
                                        <h3 className="font-black text-white text-sm uppercase tracking-widest">{col.label}</h3>
                                    </div>
                                    <span className="bg-white/5 px-3 py-1 rounded-lg text-[10px] font-black text-[var(--text-tertiary)] border border-white/5">
                                        {leads.length}
                                    </span>
                                </div>

                                {/* Horizontal scrollable area on mobile for Kanban */}
                                <div className="space-y-4">
                                    {leads.map(lead => (
                                        <motion.div
                                            key={lead.id}
                                            layoutId={`lead-${lead.id}`}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e as any, lead)}
                                            onClick={() => handleSelectLead(lead)}
                                            className="pro-dashboard-card p-5 rounded-3xl border border-white/5 bg-[#09090b]/40 hover:border-indigo-500/30 transition-all group relative cursor-pointer active:cursor-grabbing"
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
                                                {lead.last_contact_at && (
                                                    <p className="text-amber-500/80 text-[9px] font-black uppercase tracking-tighter flex items-center gap-1.5 mt-2">
                                                        <History size={10} /> Contacted {new Date(lead.last_contact_at).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between gap-1 pt-4 border-t border-white/5">
                                                <select
                                                    value={lead.status}
                                                    onChange={(e) => updateLeadStatusAction(lead.id!, e.target.value)}
                                                    className="bg-transparent text-[9px] font-black text-[var(--text-tertiary)] uppercase border-none focus:ring-0 cursor-pointer hover:text-white transition-colors"
                                                >
                                                    {pipelineColumns.map(c => <option key={c.id} value={c.value} className="bg-[#111]">{c.label}</option>)}
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

            {/* PIPELINE LEAD DETAIL MODAL */}
            <AnimatePresence>
                {isNotesModalOpen && selectedLead && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsNotesModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-[#09090b] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                                {/* Header */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`w-2 h-2 rounded-full ${pipelineColumns.find(c => c.id === selectedLead.status)?.color || 'bg-gray-500'}`}></span>
                                            <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">{selectedLead.status}</span>
                                        </div>
                                        <h2 className="text-3xl font-black text-white leading-tight">{selectedLead.name}</h2>
                                        <p className="text-[var(--text-tertiary)] text-sm flex items-center gap-2 mt-2">
                                            <MapPin size={14} /> {selectedLead.address}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsNotesModalOpen(false)}
                                        className="p-3 hover:bg-white/5 rounded-2xl text-[var(--text-tertiary)] transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                {/* Assignment Dropdown */}
                                <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
                                    <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Assignee:</span>
                                    <select
                                        value={selectedLead.assigned_member_id || ""}
                                        onChange={(e) => handleAssignLead(e.target.value)}
                                        className="bg-transparent text-sm font-bold text-white border-none focus:ring-0 cursor-pointer"
                                    >
                                        <option value="" className="bg-[#111]">Unassigned</option>
                                        {teamMembers.map(m => (
                                            <option key={m.id} value={m.id} className="bg-[#111]">{m.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="pro-dashboard-card p-4 rounded-3xl border border-white/5 bg-white/5 flex flex-col justify-between">
                                        <div>
                                            <span className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-widest block mb-2">Phone</span>
                                            {selectedLead.phone ? (
                                                <div className="text-sm font-bold text-white flex items-center gap-2">
                                                    <Phone size={14} className="text-indigo-400" /> {selectedLead.phone}
                                                </div>
                                            ) : <p className="text-sm text-white/20 italic">No phone</p>}
                                        </div>
                                        {selectedLead.phone && (
                                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                                                <button onClick={handleCallContact} className="flex-1 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1.5">
                                                    <Phone size={12} /> Call
                                                </button>
                                                <button onClick={handleSmsContact} className="flex-1 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1.5">
                                                    <MailPlus size={12} /> SMS
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="pro-dashboard-card p-4 rounded-3xl border border-white/5 bg-white/5">
                                        <span className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-widest block mb-2">Website</span>
                                        {selectedLead.website ? (
                                            <a href={selectedLead.website} target="_blank" className="text-sm font-bold text-white flex items-center gap-2 hover:text-indigo-400 transition-colors">
                                                <Globe size={14} className="text-indigo-400" /> Visit Site <ExternalLink size={12} />
                                            </a>
                                        ) : <p className="text-sm text-white/20 italic">No website</p>}
                                    </div>
                                </div>

                                {/* CRM Actions */}
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                            <BookmarkCheck size={14} className="text-indigo-400" /> Notes & Activity
                                        </h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleLogReachAttempt}
                                                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                            >
                                                <AlertTriangle size={14} /> No Answer {selectedLead.reach_count ? `(${selectedLead.reach_count})` : ''}
                                            </button>
                                            <button
                                                onClick={handleMarkContacted}
                                                className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-600/20 text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                            >
                                                <Clock size={14} /> Mark Last Action
                                            </button>
                                        </div>
                                    </div>

                                    {selectedLead.last_contact_at && (
                                        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl flex items-center gap-3">
                                            <History size={16} className="text-amber-500" />
                                            <p className="text-[11px] font-bold text-amber-500">
                                                Last interaction: {new Date(selectedLead.last_contact_at).toLocaleString('fr-FR', {
                                                    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    )}

                                    <div className="relative">
                                        <textarea
                                            value={tempNotes}
                                            onChange={(e) => setTempNotes(e.target.value)}
                                            placeholder="Add details about your last call, client interest, follow-up date..."
                                            className="w-full bg-black/40 border border-white/10 rounded-3xl p-6 text-sm text-white min-h-[150px] focus:outline-none focus:border-indigo-500 transition-all custom-scrollbar placeholder:text-white/10"
                                        />
                                        <button
                                            onClick={handleSaveNotes}
                                            className="absolute bottom-4 right-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
                                        >
                                            Save Notes
                                        </button>
                                    </div>
                                </div>

                                {/* RE-QUALIFICATION / AUDIT SECTION */}
                                {(!selectedLead.analysis || selectedLead.analysis.mode === 'rapid') && (
                                    <div className="flex flex-col items-center justify-center p-8 bg-indigo-500/5 border border-dashed border-indigo-500/20 rounded-[32px]">
                                        <div className="bg-indigo-500/20 p-3 rounded-full mb-4">
                                            <Sparkles className="text-indigo-400" size={24} />
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2 text-center">
                                            {selectedLead.analysis?.mode === 'rapid' ? 'Deep Dive Available' : 'AI Qualification Required'}
                                        </h3>
                                        <p className="text-[var(--text-tertiary)] text-xs mb-6 text-center max-w-sm">
                                            {selectedLead.analysis?.mode === 'rapid'
                                                ? 'You have a flash audit. Run a Deep Dive for full social analysis and email drafts.'
                                                : 'Our AI will scrape the website and analyze their digital presence for high-value pain points.'}
                                        </p>
                                        <div className="flex gap-4 w-full">
                                            {(!selectedLead.analysis?.mode || selectedLead.analysis.mode !== 'rapid') && (
                                                <button
                                                    onClick={() => handleQualify(selectedLead, 'rapid')}
                                                    disabled={!!isQualifying}
                                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/40 disabled:opacity-50 flex items-center justify-center gap-3 text-[10px]"
                                                >
                                                    {isQualifying === 'rapid' ? <Loader2 className="animate-spin" /> : <Sparkles size={16} />}
                                                    Flash Audit
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleQualify(selectedLead, 'deep')}
                                                disabled={!!isQualifying}
                                                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-purple-500/40 disabled:opacity-50 flex items-center justify-center gap-3 text-[10px]"
                                            >
                                                {isQualifying === 'deep' ? <Loader2 className="animate-spin" /> : <Gavel size={16} />}
                                                Deep Dive
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* FULL AI ANALYSIS DETAILS */}
                                {selectedLead.analysis && (
                                    <div className="space-y-6">
                                        <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Sparkles className="text-indigo-400" size={16} />
                                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Digital Audit</span>
                                                </div>
                                                <span className="text-indigo-400 font-black text-sm">{selectedLead.analysis.qualification_score}/10</span>
                                            </div>

                                            <div className="mb-6 bg-white/5 p-4 rounded-2xl border border-white/5">
                                                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1">Brand Identity & Vibe</span>
                                                <p className="text-base font-black text-white leading-tight">
                                                    {selectedLead.analysis.brandVibe || "Professional / Local"}
                                                </p>
                                            </div>

                                            <p className="text-sm text-slate-200 leading-relaxed mb-6 font-medium">
                                                {selectedLead.analysis.summary}
                                            </p>

                                            {/* Found Socials */}
                                            {selectedLead.scrapedData?.socialProfiles && selectedLead.scrapedData.socialProfiles.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-6 text-white text-[10px]">
                                                    {selectedLead.scrapedData.socialProfiles.map((p: any, i: number) => (
                                                        <a
                                                            key={i}
                                                            href={p.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold"
                                                        >
                                                            {p.platform?.toLowerCase().includes('instagram') && <Instagram size={12} className="text-pink-500" />}
                                                            {p.platform?.toLowerCase().includes('facebook') && <Facebook size={12} className="text-blue-500" />}
                                                            {p.platform?.toLowerCase().includes('linkedin') && <Linkedin size={12} className="text-sky-500" />}
                                                            {p.platform || "Direct Link"}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Deep Social Audit */}
                                            {selectedLead.analysis.social_json && selectedLead.analysis.social_json.length > 0 && (
                                                <div className="space-y-4 pt-4 border-t border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <Globe className="text-purple-400" size={16} />
                                                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Deep Content Audit</span>
                                                    </div>

                                                    {selectedLead.analysis.contentStrategy && (
                                                        <div className="p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 mb-3 shadow-inner">
                                                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block mb-1 flex items-center gap-1.5">
                                                                <Star size={8} /> Strategic Content Roadmap
                                                            </span>
                                                            <p className="text-[11px] text-indigo-100 font-bold leading-relaxed">
                                                                {selectedLead.analysis.contentStrategy}
                                                            </p>
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-1 gap-3">
                                                        {selectedLead.analysis.social_json.map((insight: any, i: number) => (
                                                            <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs font-black text-white uppercase tracking-tighter">{insight.platform}</span>
                                                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${insight.score >= 7 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                                            {insight.score}/10
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <p className="text-[11px] text-slate-300 leading-relaxed italic mb-2">"{insight.verdict}"</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/5">
                                                <div className="space-y-3">
                                                    <span className="text-[9px] font-black text-red-400/80 uppercase flex items-center gap-1.5"><AlertTriangle size={12} /> Pain Points</span>
                                                    <ul className="space-y-1.5">
                                                        {selectedLead.analysis.pain_points?.map((p: string, i: number) => (
                                                            <li key={i} className="text-[11px] text-slate-400 flex items-start gap-2">
                                                                <span className="text-red-500/40 mt-1.5">•</span> {p}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div className="space-y-3">
                                                    <span className="text-[9px] font-black text-emerald-400/80 uppercase flex items-center gap-1.5"><CheckCircle2 size={12} /> AI Suggestions</span>
                                                    <ul className="space-y-1.5">
                                                        {selectedLead.analysis.suggestions?.map((s: string, i: number) => (
                                                            <li key={i} className="text-[11px] text-slate-400 flex items-start gap-2">
                                                                <span className="text-emerald-500/40 mt-1.5">✓</span> {s}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Outreach Email */}
                                        {selectedLead.analysis.email_draft && (
                                            <div className="pro-dashboard-card p-6 rounded-3xl bg-black/40 border border-white/5">
                                                <div className="flex justify-between items-center mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <MailPlus className="text-indigo-400" size={16} />
                                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Drafted Outreach</span>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(selectedLead.analysis.email_draft);
                                                            toast.success("Email copied");
                                                        }}
                                                        className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase flex items-center gap-1 transition-colors"
                                                    >
                                                        <Copy size={12} /> Copy
                                                    </button>
                                                </div>
                                                <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                                                    <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed italic">
                                                        {selectedLead.analysis.email_draft}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
