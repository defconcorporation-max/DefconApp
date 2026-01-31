'use import';
'use client';

import { useState } from 'react';
import { createAgency, deleteAgency } from '@/app/actions';
import { Plus, Trash2, Building, Users, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils'; // Assuming standard util

interface AgencyStat {
    id: number;
    name: string;
    color: string;
    client_count: number;
    total_revenue: number;
}

interface Props {
    agencies: { id: number; name: string; color: string }[];
    stats: AgencyStat[];
}

export default function AgencyList({ agencies, stats }: Props) {
    const [isCreating, setIsCreating] = useState(false);

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map(stat => (
                    <div key={stat.id} className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                        <Link href={`/agencies/${stat.id}`} className="block p-6 h-full">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Building size={64} style={{ color: stat.color }} />
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-3 h-8 rounded-full" style={{ backgroundColor: stat.color }}></div>
                                    <h3 className="text-xl font-bold text-white">{stat.name}</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-[var(--text-secondary)] uppercase font-mono mb-1">Clients</p>
                                        <p className="text-2xl font-bold text-white flex items-center gap-2">
                                            <Users size={16} className="text-[var(--text-tertiary)]" />
                                            {stat.client_count}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-secondary)] uppercase font-mono mb-1">Revenue</p>
                                        <p className="text-2xl font-bold text-green-400 flex items-center gap-2">
                                            {/* <DollarSign size={16} className="text-green-500/50" /> */}
                                            ${stat.total_revenue.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-20">
                            <form action={deleteAgency}>
                                <input type="hidden" name="id" value={stat.id} />
                                <button type="submit" className="p-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20" title="Delete Agency">
                                    <Trash2 size={14} />
                                </button>
                            </form>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create New Agency */}
            <div className="border-t border-[var(--border-subtle)] pt-8">
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="flex items-center gap-2 text-violet-400 hover:text-violet-300 font-medium transition-colors"
                >
                    <Plus size={18} />
                    Create New Agency
                </button>

                {isCreating && (
                    <form action={async (formData) => { await createAgency(formData); setIsCreating(false); }} className="mt-4 bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-6 max-w-md animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-[var(--text-secondary)] uppercase font-mono mb-1">Agency Name</label>
                                <input name="name" className="pro-input w-full" placeholder="e.g. Publicis" required autoFocus />
                            </div>
                            <div>
                                <label className="block text-xs text-[var(--text-secondary)] uppercase font-mono mb-1">Color Tag</label>
                                <div className="flex gap-4 items-center">
                                    <input type="color" name="color" defaultValue="#6366f1" className="bg-transparent h-10 w-20 cursor-pointer rounded" />
                                    <span className="text-xs text-[var(--text-tertiary)]">Pick a distinct color</span>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-white">Cancel</button>
                                <button type="submit" className="pro-button">Create Agency</button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
