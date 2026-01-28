'use client';

import { useState } from 'react';
import { LayoutDashboard, Folder, Fingerprint, Lightbulb, User, Calendar, DollarSign, CreditCard } from 'lucide-react';
import { Client, Project, SocialLink, Commission, Idea, Payment, Credential } from '@/types';
import ProjectManager from '@/components/ProjectManager';
import SocialLinks from '@/components/SocialLinks';
import IdeaBox from '@/components/IdeaBox';
import PaymentTracker from '@/components/PaymentTracker';
import CredentialsBox from '@/components/CredentialsBox';

interface ClientTabsProps {
    client: Client;
    projects: Project[];
    socials: SocialLink[];
    ideas: Idea[];
    commissions: Commission[];
    payments: Payment[];
    credentials: Credential[];
}

export default function ClientTabs({
    client,
    projects,
    socials,
    ideas,
    commissions,
    payments,
    credentials
}: ClientTabsProps) {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
        { id: 'projects', label: 'Projects', icon: <Folder size={16} /> },
        { id: 'brand', label: 'Brand & Info', icon: <Fingerprint size={16} /> },
        { id: 'ideas', label: 'Ideas', icon: <Lightbulb size={16} /> },
    ];

    const totalRevenue = projects.reduce((sum, p) => sum + (p.total_value || 0), 0);

    return (
        <div>
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-8 bg-black/20 p-1 rounded-xl w-fit border border-[var(--border-subtle)]">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                            ${activeTab === tab.id
                                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                : 'text-[var(--text-tertiary)] hover:text-white hover:bg-white/5'}
                        `}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* --- OVERVIEW TAB --- */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-8">
                            {/* Properties Card */}
                            <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] p-6 rounded-2xl">
                                <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Client Properties</h3>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center p-3 rounded hover:bg-[var(--bg-surface)] text-sm group cursor-default transition-colors">
                                        <span className="text-[var(--text-secondary)]">Status</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            <span className="text-[var(--text-primary)] font-medium">{client.status}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded hover:bg-[var(--bg-surface)] text-sm group cursor-default transition-colors">
                                        <span className="text-[var(--text-secondary)]">Contact Person</span>
                                        <div className="flex items-center gap-2 text-[var(--text-primary)]">
                                            <User size={14} className="text-[var(--text-tertiary)]" />
                                            {client.name}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded hover:bg-[var(--bg-surface)] text-sm group cursor-default transition-colors">
                                        <span className="text-[var(--text-secondary)]">Client Since</span>
                                        <div className="flex items-center gap-2 text-[var(--text-primary)]">
                                            <Calendar size={14} className="text-[var(--text-tertiary)]" />
                                            {new Date(client.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded hover:bg-[var(--bg-surface)] text-sm group cursor-default transition-colors border-t border-[var(--border-subtle)] mt-2 pt-3">
                                        <span className="text-[var(--text-secondary)]">Total Revenue</span>
                                        <span className="text-emerald-400 font-bold font-mono text-lg">${totalRevenue.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Payment Tracker */}
                            <div>
                                <PaymentTracker clientId={client.id} payments={payments} />
                            </div>
                        </div>
                    </div>
                )}

                {/* --- PROJECTS TAB --- */}
                {activeTab === 'projects' && (
                    <ProjectManager clientId={client.id} projects={projects} />
                )}

                {/* --- BRAND & INFO TAB --- */}
                {activeTab === 'brand' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-bold mb-4 text-[var(--text-secondary)] text-sm uppercase tracking-wider">Social Presence</h3>
                            <SocialLinks clientId={client.id} socials={socials} />
                        </div>
                        <div>
                            <h3 className="font-bold mb-4 text-[var(--text-secondary)] text-sm uppercase tracking-wider">Credentials & Access</h3>
                            <CredentialsBox clientId={client.id} credentials={credentials} />
                        </div>
                    </div>
                )}

                {/* --- IDEAS TAB --- */}
                {activeTab === 'ideas' && (
                    <IdeaBox clientId={client.id} ideas={ideas} />
                )}

            </div>
        </div>
    );
}
