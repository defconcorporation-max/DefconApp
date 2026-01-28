'use client';

import { useState } from 'react';
import { ArrowUpRight, DollarSign, Wallet, PieChart, Users, LayoutGrid, Receipt, CreditCard, Banknote } from 'lucide-react';
import ProjectFinancialList from '@/components/ProjectFinancialList';
import CommissionTracker from '@/components/CommissionTracker';
import ExpenseManager from '@/components/ExpenseManager';
import { Commission, Settings } from '@/types';

interface FinanceTabsProps {
    data: any;
    commissions: Commission[];
    settings: Settings;
    projectValues: Record<number, number>;
}

export default function FinanceTabs({ data, commissions, settings, projectValues }: FinanceTabsProps) {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <PieChart size={16} /> },
        { id: 'income', label: 'Income', icon: <DollarSign size={16} /> },
        { id: 'expenses', label: 'Expenses', icon: <Receipt size={16} /> },
        { id: 'commissions', label: 'Commissions', icon: <Users size={16} /> },
    ];

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

            {/* Content Area */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* Global Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Total Revenue */}
                            <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] p-6 rounded-2xl relative overflow-hidden group hover:border-violet-500/30 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
                                        <DollarSign size={24} />
                                    </div>
                                    <span className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Cash Collected</span>
                                </div>
                                <div className="text-3xl font-bold mb-1 font-mono">${data.stats.revenueWithTax.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Gross Collected (Inc. Tax)</div>
                            </div>

                            {/* Net Profit */}
                            <div className="bg-[#0A0A0A] border border-emerald-500/30 p-6 rounded-2xl relative overflow-hidden bg-gradient-to-br from-emerald-900/10 to-transparent">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                                        <Wallet size={24} />
                                    </div>
                                    <span className="text-xs uppercase tracking-wider text-emerald-400/80 font-bold">Net Profit</span>
                                </div>
                                <div className="text-3xl font-bold mb-1 font-mono text-emerald-400">${data.stats.netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                <div className="text-xs text-[var(--text-secondary)] text-emerald-400/60">Rev. - Comm. - Expenses</div>
                            </div>

                            {/* Pending Cash */}
                            <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] p-6 rounded-2xl relative overflow-hidden">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400">
                                        <ArrowUpRight size={24} />
                                    </div>
                                    <span className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Pending Cash</span>
                                </div>
                                <div className="text-3xl font-bold mb-1 font-mono text-orange-400">${data.stats.pendingRevenueWithTax.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Unpaid Invoices (Inc. Tax)</div>
                            </div>

                            {/* Taxes Owed */}
                            <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] p-6 rounded-2xl relative overflow-hidden">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-violet-500/10 rounded-xl text-violet-400">
                                        <Banknote size={24} />
                                    </div>
                                    <span className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Taxes Owed (Net)</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="text-xs text-[var(--text-secondary)]">TPS: <span className="text-white font-mono">${data.stats.taxesOwed.tps.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
                                        <div className="text-xs text-[var(--text-secondary)]">TVQ: <span className="text-white font-mono">${data.stats.taxesOwed.tvq.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
                                    </div>
                                    <div className="text-xl font-bold font-mono">${(data.stats.taxesOwed.tps + data.stats.taxesOwed.tvq).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                </div>
                            </div>
                        </div>

                        {/* Client Performance Table */}
                        <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-[var(--border-subtle)] flex justify-between items-center bg-white/5">
                                <h3 className="font-bold flex items-center gap-2 text-sm"><Users size={16} className="text-[var(--text-tertiary)]" /> Top Performing Clients</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-[var(--text-tertiary)] uppercase text-xs font-medium border-b border-[var(--border-subtle)]">
                                        <tr>
                                            <th className="px-6 py-4">Client</th>
                                            <th className="px-6 py-4 text-center">Projects</th>
                                            <th className="px-6 py-4 text-right">Total Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-subtle)]">
                                        {data.clients.slice(0, 5).map((client: any) => (
                                            <tr key={client.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-white mb-0.5">{client.company_name}</div>
                                                    <div className="text-xs text-[var(--text-secondary)]">{client.name}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="bg-white/10 text-white px-2 py-0.5 rounded text-xs">{client.project_count}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">
                                                    ${client.total_revenue.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* INCOME TAB */}
                {activeTab === 'income' && (
                    <div className="grid grid-cols-1 gap-8">
                        <ProjectFinancialList projects={data.projects} />
                    </div>
                )}

                {/* EXPENSES TAB */}
                {activeTab === 'expenses' && (
                    <div>
                        <ExpenseManager expenses={data.expensesList} settings={settings} />
                    </div>
                )}

                {/* COMMISSIONS TAB */}
                {activeTab === 'commissions' && (
                    <CommissionTracker commissions={commissions} projectValues={projectValues} />
                )}

            </div>
        </div>
    );
}
