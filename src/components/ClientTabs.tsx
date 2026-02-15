'use client';

import { useState } from 'react';
import { LayoutDashboard, Folder, Fingerprint, Lightbulb, User, Calendar, DollarSign, CreditCard, Share2 } from 'lucide-react';
import { Client, Project, SocialLink, Commission, Idea, Payment, Credential, SocialAccount, SocialPost } from '@/types';
import ProjectManager from '@/components/ProjectManager';
import SocialLinks from '@/components/SocialLinks';
import IdeaBox from '@/components/IdeaBox';

import CredentialsBox from '@/components/CredentialsBox';
import SocialPlanner from '@/components/social/SocialPlanner';
import ConnectAccountBtn from '@/components/social/ConnectAccountBtn';

interface ClientTabsProps {
    client: Client;
    projects: Project[];
    socials: SocialLink[];
    ideas: Idea[];
    commissions: Commission[];
    payments: Payment[];
    credentials: Credential[];
    socialAccounts: SocialAccount[];
    socialPosts: SocialPost[];
    agencies: { id: number; name: string; color: string }[];
}

export default function ClientTabs({
    client,
    projects,
    socials,
    ideas,
    commissions,
    payments,
    credentials,
    socialAccounts,
    socialPosts,
    agencies
}: ClientTabsProps) {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
        { id: 'projects', label: 'Projects', icon: <Folder size={16} /> },
        { id: 'social', label: 'Social Media', icon: <Share2 size={16} /> },
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

                        </div>
                    </div>
                )}

                {/* --- PROJECTS TAB --- */}
                {activeTab === 'projects' && (
                    <ProjectManager clientId={client.id} projects={projects} agencies={agencies} />
                )}

                {/* --- SOCIAL MEDIA TAB (NEW) --- */}
                {activeTab === 'social' && (
                    <div className="space-y-8">
                        {/* Connected Accounts Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between bg-[#0A0A0A] border border-[var(--border-subtle)] p-4 rounded-xl gap-4">
                            <div className="flex items-center gap-4">
                                {socialAccounts.map(acc => (
                                    <div key={acc.id} className="relative w-10 h-10 rounded-full border border-[var(--border-subtle)] overflow-hidden" title={acc.handle}>
                                        <img src={acc.avatar_url} alt={acc.handle} className="w-full h-full object-cover" />
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-black"></div>
                                    </div>
                                ))}
                                {socialAccounts.length === 0 && <span className="text-sm text-[var(--text-tertiary)] italic">No accounts connected</span>}
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="text-xs text-[var(--text-tertiary)] uppercase font-bold mb-1">Add New</div>
                                <div className="flex flex-wrap gap-2">
                                    <ConnectAccountBtn platform="instagram" clientId={client.id} />
                                    <ConnectAccountBtn platform="linkedin" clientId={client.id} />
                                    <ConnectAccountBtn platform="tiktok" clientId={client.id} />
                                    <ConnectAccountBtn platform="youtube" clientId={client.id} />
                                </div>
                            </div>
                        </div>

                        {/* Unassigned Accounts Warnings (if any match handle/name or just generic list) */}
                        {/* Ideally we would list accounts with client_id = NULL here and offer to "Claim" them */}

                        {/* Social Planner */}
                        <SocialPlanner initialPosts={socialPosts} accounts={socialAccounts} clients={[client]} />
                    </div>
                )}

                {/* --- BRAND & INFO TAB --- */}
                {activeTab === 'brand' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-bold mb-4 text-[var(--text-secondary)] text-sm uppercase tracking-wider">Social Presence (Legacy Links)</h3>
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
