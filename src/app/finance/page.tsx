
import { getFinanceData, getSettings, getAllCommissions } from '@/app/actions';
import Link from 'next/link';
import { ArrowUpRight, DollarSign, TrendingUp, Users, Calendar, Wallet, PieChart } from 'lucide-react';
import ProjectFinancialList from '@/components/ProjectFinancialList';
import CommissionTracker from '@/components/CommissionTracker';
import ExpenseManager from '@/components/ExpenseManager';
import { getCommissions } from '../actions';
import { Commission } from '@/types';

export const dynamic = 'force-dynamic';

export default async function FinancePage() {
    const data = await getFinanceData();
    const commissions = await getAllCommissions();
    const settings = await getSettings();

    // Map project values for CommissionTracker
    const projectValues: Record<number, number> = {};
    data.projects.forEach((p: any) => {
        projectValues[p.id] = p.total_value_pre_tax;
    });

    return (
        <main className="min-h-screen p-8 bg-[var(--bg-root)] text-white">
            <header className="mb-8 border-b border-[var(--border-subtle)] pb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight mb-2">Finance Overview</h1>
                    <p className="text-[var(--text-secondary)] text-sm">Track revenue, pending income, and client performance.</p>
                </div>
                <Link href="/" className="text-sm font-mono text-[var(--text-tertiary)] hover:text-white transition-colors">
                    ← BACK TO DASHBOARD
                </Link>
            </header>

            {/* Global Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {/* Total Revenue (Realized) */}
                <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] p-6 rounded-2xl relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                            <DollarSign size={24} />
                        </div>
                        <span className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Cash Collected</span>
                    </div>
                    <div className="text-3xl font-bold mb-1 font-mono">${data.stats.revenueWithTax.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    <div className="text-xs text-[var(--text-secondary)]">Gross Collected (Inc. Tax)</div>
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

                {/* Taxes Owed (Net) */}
                <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] p-6 rounded-2xl relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-violet-500/10 rounded-xl text-violet-400">
                            <PieChart size={24} />
                        </div>
                        <span className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Taxes Owed</span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--text-secondary)]">TPS (Net)</span>
                            <span className="font-mono">${data.stats.taxesOwed.tps.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--text-secondary)]">TVQ (Net)</span>
                            <span className="font-mono">${data.stats.taxesOwed.tvq.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>

                {/* Paid Expenses */}
                <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] p-6 rounded-2xl relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-500/10 rounded-xl text-red-400">
                            <Users size={24} />
                        </div>
                        <span className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Team Payouts</span>
                    </div>
                    <div className="text-3xl font-bold mb-1 font-mono text-white">${data.stats.expenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <div className="text-xs text-[var(--text-secondary)]">Commissions Paid</div>
                </div>
            </div>

            {/* Expense Manager */}
            <div className="mb-8">
                <ExpenseManager expenses={data.expensesList} settings={settings} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Client Performance Table */}
                <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-2xl overflow-hidden self-start">
                    <div className="p-6 border-b border-[var(--border-subtle)] flex justify-between items-center">
                        <h3 className="font-bold flex items-center gap-2"><Users size={18} className="text-[var(--text-tertiary)]" /> Client Performance</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white/5 text-[var(--text-tertiary)] uppercase text-xs font-medium">
                                <tr>
                                    <th className="px-6 py-4">Client</th>
                                    <th className="px-6 py-4 text-center">Projects</th>
                                    <th className="px-6 py-4 text-right">Total Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-subtle)]">
                                {data.clients.map((client: any) => (
                                    <tr key={client.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white mb-0.5">{client.company_name}</div>
                                            <div className="text-xs text-[var(--text-secondary)]">{client.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="pro-badge bg-white/10 text-white">{client.project_count}</span>
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

                {/* Interactive Project Financial List */}
                <div className="lg:col-span-1 self-start">
                    <ProjectFinancialList projects={data.projects} />
                </div>
            </div>

            {/* Commission Tracker Section */}
            <CommissionTracker commissions={commissions} projectValues={projectValues} />
        </main>
    );
}


