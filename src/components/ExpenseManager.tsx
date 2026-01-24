'use client';

import { addExpense, deleteExpense } from '@/app/actions';
import { Expense } from '@/types';
import { useState, useTransition, useMemo } from 'react';
import { Plus, Trash2, Calendar, FileText, DollarSign, Calculator } from 'lucide-react';

export default function ExpenseManager({ expenses, settings }: { expenses: Expense[], settings: any }) {
    const [isPending, startTransition] = useTransition();
    const [isAdding, setIsAdding] = useState(false);

    // Form Stats
    const [amountPreTax, setAmountPreTax] = useState('');
    const [tpsAmount, setTpsAmount] = useState('');
    const [tvqAmount, setTvqAmount] = useState('');

    const calculatedTotal = useMemo(() => {
        const pre = parseFloat(amountPreTax) || 0;
        const tps = parseFloat(tpsAmount) || 0;
        const tvq = parseFloat(tvqAmount) || 0;
        return pre + tps + tvq;
    }, [amountPreTax, tpsAmount, tvqAmount]);

    const handleAutoCalculate = () => {
        const pre = parseFloat(amountPreTax);
        if (isNaN(pre)) return;

        const tps = pre * ((settings?.tax_tps_rate || 5) / 100);
        const tvq = pre * ((settings?.tax_tvq_rate || 9.975) / 100);

        setTpsAmount(tps.toFixed(2));
        setTvqAmount(tvq.toFixed(2));
    };

    const handleDelete = (id: number) => {
        if (!confirm('Delete this expense?')) return;
        startTransition(async () => {
            await deleteExpense(id);
        });
    };

    return (
        <section className="mt-8 bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
            <div className="p-6 border-b border-[var(--border-subtle)] flex justify-between items-center">
                <div>
                    <h3 className="font-bold flex items-center gap-2 text-white">
                        <FileText size={18} className="text-red-400" /> Business Expenses
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Track deductible expenses to offset taxes.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <span className="block text-[10px] uppercase text-[var(--text-tertiary)] font-bold">Total Expenses</span>
                        <span className="font-mono text-lg font-bold text-white">
                            ${expenses.reduce((sum, e) => sum + e.total_amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors h-10"
                    >
                        <Plus size={14} /> New Expense
                    </button>
                </div>
            </div>

            {/* Add Expense Form */}
            {isAdding && (
                <div className="p-6 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] animate-in fade-in slide-in-from-top-4">
                    <form action={async (formData) => {
                        await addExpense(formData);
                        setIsAdding(false);
                        setAmountPreTax('');
                        setTpsAmount('');
                        setTvqAmount('');
                    }}
                        className="space-y-4"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase text-[var(--text-tertiary)] font-bold">Description</label>
                                <input name="description" className="w-full bg-[#0A0A0A] border border-[var(--border-subtle)] rounded px-3 py-2 text-sm text-white outline-none focus:border-red-500" placeholder="e.g. Office Supplies" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase text-[var(--text-tertiary)] font-bold">Date</label>
                                <input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-[#0A0A0A] border border-[var(--border-subtle)] rounded px-3 py-2 text-sm text-white outline-none focus:border-red-500" required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase text-[var(--text-tertiary)] font-bold">Amount (Pre-Tax)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                                    <input
                                        name="amountPreTax"
                                        type="number"
                                        step="0.01"
                                        value={amountPreTax}
                                        onChange={(e) => setAmountPreTax(e.target.value)}
                                        className="w-full bg-[#0A0A0A] border border-[var(--border-subtle)] rounded pl-6 pr-3 py-2 text-sm text-white outline-none focus:border-red-500"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <label className="text-[10px] uppercase text-[var(--text-tertiary)] font-bold">TPS</label>
                                    <button type="button" onClick={handleAutoCalculate} className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                        <Calculator size={10} /> Auto
                                    </button>
                                </div>
                                <input
                                    name="tpsAmount"
                                    type="number"
                                    step="0.01"
                                    value={tpsAmount}
                                    onChange={(e) => setTpsAmount(e.target.value)}
                                    className="w-full bg-[#0A0A0A] border border-[var(--border-subtle)] rounded px-3 py-2 text-sm text-white outline-none focus:border-red-500"
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase text-[var(--text-tertiary)] font-bold">TVQ</label>
                                <input
                                    name="tvqAmount"
                                    type="number"
                                    step="0.01"
                                    value={tvqAmount}
                                    onChange={(e) => setTvqAmount(e.target.value)}
                                    className="w-full bg-[#0A0A0A] border border-[var(--border-subtle)] rounded px-3 py-2 text-sm text-white outline-none focus:border-red-500"
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase text-[var(--text-tertiary)] font-bold">Total</label>
                                <div className="w-full bg-[#0A0A0A] border border-[var(--border-subtle)] rounded px-3 py-2 text-sm text-gray-400">
                                    ${calculatedTotal.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button type="submit" className="bg-white text-black px-4 py-2 rounded text-sm font-medium hover:bg-gray-200 transition-colors">
                                Save Expense
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Expenses List */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-[var(--text-tertiary)] uppercase text-xs font-medium">
                        <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Description</th>
                            <th className="px-6 py-4 text-right">Net</th>
                            <th className="px-6 py-4 text-right">Taxes (TPS/TVQ)</th>
                            <th className="px-6 py-4 text-right">Total</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                        {expenses.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-[var(--text-tertiary)] italic">
                                    No expenses recorded.
                                </td>
                            </tr>
                        ) : (
                            expenses.map(expense => (
                                <tr key={expense.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4 font-mono text-gray-400">{expense.date}</td>
                                    <td className="px-6 py-4 text-white font-medium">{expense.description}</td>
                                    <td className="px-6 py-4 text-right text-gray-300">${expense.amount_pre_tax.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right text-xs text-gray-500">
                                        TPS: ${expense.tps_amount.toFixed(2)} <br />
                                        TVQ: ${expense.tvq_amount.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-white">${expense.total_amount.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(expense.id)}
                                            className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
