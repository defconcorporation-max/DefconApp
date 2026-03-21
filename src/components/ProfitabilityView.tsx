'use client';

import { TrendingUp, TrendingDown, Minus, Info, BarChart3, Target } from 'lucide-react';

interface ProfitabilityViewProps {
    data: any[];
}

export default function ProfitabilityView({ data }: ProfitabilityViewProps) {
    const totalRevenue = data.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalCosts = data.reduce((acc, curr) => acc + curr.direct_costs, 0);
    const totalComms = data.reduce((acc, curr) => acc + curr.commissions, 0);
    const totalProfit = totalRevenue - totalCosts - totalComms;
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const getMarginColor = (margin: number) => {
        if (margin >= 50) return 'text-emerald-400';
        if (margin >= 30) return 'text-blue-400';
        if (margin >= 15) return 'text-amber-400';
        return 'text-red-400';
    };

    const getMarginBg = (margin: number) => {
        if (margin >= 50) return 'bg-emerald-500/10 border-emerald-500/20';
        if (margin >= 30) return 'bg-blue-500/10 border-blue-500/20';
        if (margin >= 15) return 'bg-amber-500/10 border-amber-500/20';
        return 'bg-red-500/10 border-red-500/20';
    };

    return (
        <div className="space-y-8">
            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] p-6 rounded-2xl relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:scale-110 transition-transform">
                            <BarChart3 size={24} />
                        </div>
                        <span className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Gross Profit</span>
                    </div>
                    <div className="text-3xl font-bold mb-1 font-mono text-white">${totalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <div className="text-xs text-[var(--text-secondary)]">Revenue - Direct Costs - Commissions</div>
                </div>

                <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] p-6 rounded-2xl relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-violet-500/10 rounded-xl text-violet-400 group-hover:scale-110 transition-transform">
                            <Target size={24} />
                        </div>
                        <span className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Average Margin</span>
                    </div>
                    <div className={`text-3xl font-bold mb-1 font-mono ${getMarginColor(avgMargin)}`}>{avgMargin.toFixed(1)}%</div>
                    <div className="text-xs text-[var(--text-secondary)]">Target: {">"}35.0%</div>
                </div>

                <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] p-6 rounded-2xl relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 group-hover:scale-110 transition-transform">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">ROI Efficiency</span>
                    </div>
                    <div className="text-3xl font-bold mb-1 font-mono text-white">{(totalRevenue / (totalCosts + totalComms || 1)).toFixed(2)}x</div>
                    <div className="text-xs text-[var(--text-secondary)]">Revenue / Total Costs</div>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-[var(--border-subtle)] bg-white/5 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-white">Project Profitability Analysis</h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">Real-time margin tracking per project (excluding monthly overhead).</p>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[var(--text-tertiary)] uppercase text-[10px] font-bold tracking-widest border-b border-[var(--border-subtle)] bg-black/40">
                            <tr>
                                <th className="px-6 py-4">Project / Client</th>
                                <th className="px-6 py-4 text-right">Revenue</th>
                                <th className="px-6 py-4 text-right">Direct Costs</th>
                                <th className="px-6 py-4 text-right">Commissions</th>
                                <th className="px-6 py-4 text-right">Gross Profit</th>
                                <th className="px-6 py-4 text-center">Margin %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                            {data.map((project) => (
                                <tr key={project.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="font-bold text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{project.title}</div>
                                        <div className="text-xs text-[var(--text-tertiary)]">{project.client_name}</div>
                                    </td>
                                    <td className="px-6 py-5 text-right font-mono text-white">
                                        ${project.revenue.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-5 text-right font-mono text-[var(--text-secondary)]">
                                        ${project.direct_costs.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-5 text-right font-mono text-[var(--text-secondary)]">
                                        ${project.commissions.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="px-6 py-5 text-right font-mono font-bold text-white">
                                        ${project.gross_profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${getMarginBg(project.margin_percentage)} ${getMarginColor(project.margin_percentage)}`}>
                                            {project.margin_percentage > 40 ? <TrendingUp size={12} /> : project.margin_percentage < 15 ? <TrendingDown size={12} /> : <Minus size={12} />}
                                            {project.margin_percentage.toFixed(1)}%
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {data.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="inline-flex p-4 bg-white/5 rounded-full text-[var(--text-tertiary)] mb-4">
                            <Info size={32} />
                        </div>
                        <h4 className="text-white font-medium">No profitability data found</h4>
                        <p className="text-sm text-[var(--text-tertiary)] mt-1">Start adding services and project costs to see analysis.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
