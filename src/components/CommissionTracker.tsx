'use client';

import { Commission } from "@/types";
import { payCommission, revertCommissionPayment } from "@/app/actions";
import { CheckCircle, Clock, Undo } from "lucide-react";
import { useState } from "react";

interface ExtendedCommission extends Commission {
    project_title?: string;
    client_name?: string;
}

export default function CommissionTracker({ commissions, projectValues }: {
    commissions: ExtendedCommission[],
    projectValues: Record<number, number>
}) {
    const [filter, setFilter] = useState<'All' | 'Pending' | 'Paid'>('Pending');

    // Calculate value helper
    const getCommissionValue = (comm: ExtendedCommission) => {
        if (comm.rate_type === 'Fixed') return comm.rate_value;
        if (comm.rate_type === 'Percentage' && comm.project_id) {
            const total = projectValues[comm.project_id] || 0;
            return total * (comm.rate_value / 100);
        }
        return 0;
    };

    const filtered = commissions.filter(c => {
        if (filter === 'All') return true;
        return c.status === filter;
    });

    const totalPending = commissions
        .filter(c => c.status === 'Pending')
        .reduce((sum, c) => sum + getCommissionValue(c), 0);

    const totalPaid = commissions
        .filter(c => c.status === 'Paid')
        .reduce((sum, c) => sum + getCommissionValue(c), 0);

    return (
        <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-2xl overflow-hidden mt-8">
            <div className="p-6 border-b border-[var(--border-subtle)] flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h3 className="font-bold flex items-center gap-2">Commission & Payroll Tracker</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Manage team payouts and track expenses.</p>
                </div>
                <div className="flex gap-4 text-sm">
                    <div className="bg-yellow-500/10 px-3 py-1 rounded-lg text-yellow-500 border border-yellow-500/20">
                        <span className="text-xs uppercase mr-2 opacity-70">Pending Payouts</span>
                        <span className="font-bold">${totalPending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="bg-emerald-500/10 px-3 py-1 rounded-lg text-emerald-400 border border-emerald-500/20">
                        <span className="text-xs uppercase mr-2 opacity-70">Paid Total</span>
                        <span className="font-bold">${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-white/5 border-b border-[var(--border-subtle)] flex gap-2">
                {['Pending', 'Paid', 'All'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f
                                ? 'bg-white text-black'
                                : 'bg-black/40 text-gray-400 hover:text-white'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="divide-y divide-[var(--border-subtle)] max-h-[500px] overflow-y-auto">
                {filtered.map(comm => {
                    const value = getCommissionValue(comm);
                    const isPaid = comm.status === 'Paid';

                    return (
                        <div key={comm.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className={`w-2 h-12 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                                <div>
                                    <div className="font-bold text-white text-sm">{comm.person_name}</div>
                                    <div className="text-xs text-[var(--text-secondary)]">
                                        {comm.role_name} • {comm.rate_type === 'Percentage' ? `${comm.rate_value}%` : `$${comm.rate_value}`}
                                    </div>
                                    <div className="text-[10px] text-[var(--text-tertiary)] mt-1">
                                        {comm.project_title ? `${comm.project_title}` : 'General / Legacy'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="font-mono font-bold text-white">
                                        ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div className={`text-[10px] uppercase font-bold tracking-wider ${isPaid ? 'text-emerald-500' : 'text-yellow-500'}`}>
                                        {comm.status}
                                    </div>
                                </div>

                                {isPaid ? (
                                    <form action={revertCommissionPayment.bind(null, comm.id)}>
                                        <button className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors" title="Revert to Pending">
                                            <Undo size={16} />
                                        </button>
                                    </form>
                                ) : (
                                    <form action={payCommission.bind(null, comm.id)}>
                                        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg transition-all text-xs font-bold border border-emerald-500/50">
                                            <CheckCircle size={14} /> Pay
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    );
                })}
                {filtered.length === 0 && (
                    <div className="p-12 text-center text-gray-500 text-sm italic">
                        No {filter.toLowerCase()} commissions found.
                    </div>
                )}
            </div>
        </div>
    );
}
