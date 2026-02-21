'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Users, Briefcase, Video, X, Calendar as CalendarIcon, User, Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GlobalQuickCreateProps {
    isAdmin: boolean;
    agencies?: any[]; // For assigning client to agency
    clients?: any[];  // For assigning project to client
}

export default function GlobalQuickCreate({ isAdmin, agencies = [], clients = [] }: GlobalQuickCreateProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeModal, setActiveModal] = useState<'client' | 'project' | 'shoot' | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
                setActiveModal(null);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Form states
    const [clientName, setClientName] = useState('');
    const [clientCompany, setClientCompany] = useState('');
    const [clientAgencyId, setClientAgencyId] = useState('');

    const [projectTitle, setProjectTitle] = useState('');
    const [projectClientId, setProjectClientId] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('name', clientName);
            formData.append('company', clientCompany);
            formData.append('plan', 'Standard');
            if (clientAgencyId) formData.append('agencyId', clientAgencyId);

            // Dynamically import the server action to avoid passing it as prop if possible, 
            // but Next.js client components can only call passed server actions or import them directly.
            const { createClient } = await import('@/app/actions');
            await createClient(formData);

            setActiveModal(null);
            setClientName('');
            setClientCompany('');
            setClientAgencyId('');
            router.refresh(); // Refresh current page to show new data
        } catch (error) {
            console.error(error);
            alert('Failed to create client');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', projectTitle);
            formData.append('clientId', projectClientId);
            formData.append('status', 'Concept');
            formData.append('pipelineStage', 'planning');

            const { createProject } = await import('@/app/actions');
            await createProject(formData);

            setActiveModal(null);
            setProjectTitle('');
            setProjectClientId('');
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Failed to create project');
        } finally {
            setIsSubmitting(false);
        }
    };

    const navigateToAvailability = () => {
        setIsOpen(false);
        router.push('/availability');
    };

    return (
        <>
            {/* Global FAB */}
            <div className="fixed bottom-6 right-6 z-50 xl:bottom-8 xl:right-8" ref={menuRef}>
                <div className={`absolute bottom-full right-0 mb-4 transition-all duration-200 origin-bottom-right ${isOpen ? 'scale-100 opacity-100 visible' : 'scale-95 opacity-0 invisible'}`}>
                    <div className="bg-[#111] border border-[var(--border-subtle)] rounded-xl shadow-2xl p-2 w-56 flex flex-col gap-1">
                        <div className="px-3 py-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                            Quick Create
                        </div>

                        {(isAdmin || !isAdmin) && ( // Agency can also request shoot
                            <button
                                onClick={navigateToAvailability}
                                className="flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors text-left"
                            >
                                <CalendarIcon className="w-4 h-4" />
                                <div>
                                    <div className="font-medium">Request Booking</div>
                                    <div className="text-[10px] opacity-60">Schedule studio time</div>
                                </div>
                            </button>
                        )}

                        {isAdmin && (
                            <>
                                <button
                                    onClick={() => { setIsOpen(false); setActiveModal('project'); }}
                                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors text-left"
                                >
                                    <Briefcase className="w-4 h-4" />
                                    <div>
                                        <div className="font-medium">New Project</div>
                                        <div className="text-[10px] opacity-60">Start a new campaign</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => { setIsOpen(false); setActiveModal('client'); }}
                                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors text-left"
                                >
                                    <User className="w-4 h-4" />
                                    <div>
                                        <div className="font-medium">New Client</div>
                                        <div className="text-[10px] opacity-60">Add a new brand</div>
                                    </div>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 ${isOpen ? 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-white rotate-45' : 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white'}`}
                >
                    <Plus className="w-6 h-6" />
                </button>
            </div>

            {/* Modals Background Overlay */}
            {activeModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">

                    {/* CLIENT MODAL */}
                    {activeModal === 'client' && (
                        <div className="bg-[#0f0f0f] border border-[var(--border-subtle)] rounded-xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-surface)]">
                                <h3 className="font-semibold text-white flex items-center gap-2">
                                    <User size={16} className="text-amber-400" />
                                    Create Client
                                </h3>
                                <button onClick={() => setActiveModal(null)} className="text-[var(--text-tertiary)] hover:text-white transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                            <form onSubmit={handleCreateClient} className="p-5 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Client Name</label>
                                    <input
                                        type="text"
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        placeholder="e.g. John Doe"
                                        className="w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Company Name</label>
                                    <input
                                        type="text"
                                        value={clientCompany}
                                        onChange={(e) => setClientCompany(e.target.value)}
                                        placeholder="e.g. Acme Corp"
                                        className="w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                                    />
                                </div>
                                {isAdmin && agencies.length > 0 && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Assign to Agency</label>
                                        <select
                                            value={clientAgencyId}
                                            onChange={(e) => setClientAgencyId(e.target.value)}
                                            className="w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all appearance-none"
                                        >
                                            <option value="">Direct Client (No Agency)</option>
                                            {agencies.map(a => (
                                                <option key={a.id} value={a.id}>{a.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="pt-2 flex justify-end gap-3">
                                    <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-white transition-colors">Cancel</button>
                                    <button type="submit" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50">
                                        {isSubmitting ? 'Saving...' : 'Create Client'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* PROJECT MODAL */}
                    {activeModal === 'project' && (
                        <div className="bg-[#0f0f0f] border border-[var(--border-subtle)] rounded-xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-surface)]">
                                <h3 className="font-semibold text-white flex items-center gap-2">
                                    <Briefcase size={16} className="text-emerald-400" />
                                    Start New Project
                                </h3>
                                <button onClick={() => setActiveModal(null)} className="text-[var(--text-tertiary)] hover:text-white transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                            <form onSubmit={handleCreateProject} className="p-5 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Project Title</label>
                                    <input
                                        type="text"
                                        value={projectTitle}
                                        onChange={(e) => setProjectTitle(e.target.value)}
                                        placeholder="e.g. Summer Campaign"
                                        className="w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Client</label>
                                    <select
                                        value={projectClientId}
                                        onChange={(e) => setProjectClientId(e.target.value)}
                                        className="w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none"
                                        required
                                    >
                                        <option value="" disabled>Select a client</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.company_name || c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="pt-2 flex justify-end gap-3">
                                    <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-white transition-colors">Cancel</button>
                                    <button type="submit" disabled={isSubmitting || !projectClientId} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50">
                                        {isSubmitting ? 'Saving...' : 'Create Project'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                </div>
            )}
        </>
    );
}
