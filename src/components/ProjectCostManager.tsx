'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Pencil, Check, X, DollarSign, Loader2 } from 'lucide-react';
import { addProjectCost, updateProjectCost, deleteProjectCost } from '@/app/actions';
import toast from 'react-hot-toast';

interface CostItem {
    id: number;
    project_id: number;
    label: string;
    amount: number;
    created_at: string;
}

interface ProjectCostManagerProps {
    projectId: number;
    initialCosts: CostItem[];
}

export default function ProjectCostManager({ projectId, initialCosts }: ProjectCostManagerProps) {
    const [costs, setCosts] = useState<CostItem[]>(initialCosts);
    const [isAdding, setIsAdding] = useState(false);
    const [newLabel, setNewLabel] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editLabel, setEditLabel] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const totalCost = costs.reduce((sum, c) => sum + c.amount, 0);

    const handleAdd = async () => {
        if (!newLabel.trim()) return;
        setLoading(true);
        const formData = new FormData();
        formData.set('projectId', String(projectId));
        formData.set('label', newLabel.trim());
        formData.set('amount', String(Number(newAmount) || 0));

        try {
            await addProjectCost(formData);
            // Optimistic: add to list
            const optimistic: CostItem = {
                id: Date.now(),
                project_id: projectId,
                label: newLabel.trim(),
                amount: Number(newAmount) || 0,
                created_at: new Date().toISOString()
            };
            setCosts([...costs, optimistic]);
            setNewLabel('');
            setNewAmount('');
            setIsAdding(false);
            toast.success('Cost added');
        } catch {
            toast.error('Failed to add cost');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (costId: number) => {
        if (!editLabel.trim()) return;
        setLoading(true);
        const formData = new FormData();
        formData.set('costId', String(costId));
        formData.set('label', editLabel.trim());
        formData.set('amount', String(Number(editAmount) || 0));

        try {
            await updateProjectCost(formData);
            setCosts(costs.map(c =>
                c.id === costId ? { ...c, label: editLabel.trim(), amount: Number(editAmount) || 0 } : c
            ));
            setEditingId(null);
            toast.success('Cost updated');
        } catch {
            toast.error('Failed to update cost');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (costId: number) => {
        setLoading(true);
        const formData = new FormData();
        formData.set('costId', String(costId));

        try {
            await deleteProjectCost(formData);
            setCosts(costs.filter(c => c.id !== costId));
            toast.success('Cost removed');
        } catch {
            toast.error('Failed to remove cost');
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (cost: CostItem) => {
        setEditingId(cost.id);
        setEditLabel(cost.label);
        setEditAmount(String(cost.amount));
    };

    const presetLabels = ['Editor', 'Cameraman', 'Director', 'Sound', 'Seller', 'Actor', 'Location', 'Equipment', 'Travel', 'Other'];

    return (
        <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest flex items-center gap-1.5">
                    <DollarSign size={12} /> Cost Breakdown
                </h4>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        <Plus size={12} /> Add Cost
                    </button>
                )}
            </div>

            {/* Cost List */}
            <div className="space-y-1.5">
                {costs.length === 0 && !isAdding && (
                    <div className="text-xs text-[var(--text-tertiary)] text-center py-4 bg-white/[0.02] rounded-xl border border-dashed border-white/5">
                        No costs added yet. Click "Add Cost" to start tracking expenses.
                    </div>
                )}

                {costs.map((cost) => (
                    <div key={cost.id} className="group">
                        {editingId === cost.id ? (
                            /* Edit Mode */
                            <div className="flex items-center gap-2 bg-indigo-500/5 border border-indigo-500/20 p-2 rounded-lg animate-in fade-in duration-200">
                                <input
                                    type="text"
                                    value={editLabel}
                                    onChange={(e) => setEditLabel(e.target.value)}
                                    className="flex-1 bg-black/40 border border-white/10 px-2 py-1.5 rounded-md text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    autoFocus
                                />
                                <div className="relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)]">$</span>
                                    <input
                                        type="number"
                                        value={editAmount}
                                        onChange={(e) => setEditAmount(e.target.value)}
                                        className="w-24 bg-black/40 border border-white/10 pl-5 pr-2 py-1.5 rounded-md text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors tabular-nums text-right"
                                    />
                                </div>
                                <button
                                    onClick={() => handleUpdate(cost.id)}
                                    disabled={loading}
                                    className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors disabled:opacity-50"
                                >
                                    {loading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                </button>
                                <button
                                    onClick={() => setEditingId(null)}
                                    className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ) : (
                            /* Display Mode */
                            <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                                <span className="text-sm text-[var(--text-secondary)]">{cost.label}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-white tabular-nums font-mono">
                                        ${cost.amount.toLocaleString()}
                                    </span>
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => startEdit(cost)}
                                            className="p-1 hover:bg-white/10 rounded text-[var(--text-tertiary)] hover:text-white transition-colors"
                                            title="Edit"
                                        >
                                            <Pencil size={11} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cost.id)}
                                            className="p-1 hover:bg-red-500/10 rounded text-[var(--text-tertiary)] hover:text-red-400 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={11} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Add Form */}
            {isAdding && (
                <div className="mt-3 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl animate-in slide-in-from-top-2 duration-300 space-y-3">
                    {/* Quick presets */}
                    <div className="flex flex-wrap gap-1.5">
                        {presetLabels.filter(p => !costs.some(c => c.label === p)).map(preset => (
                            <button
                                key={preset}
                                onClick={() => setNewLabel(preset)}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all ${newLabel === preset
                                        ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                                        : 'bg-white/5 border-white/5 text-[var(--text-tertiary)] hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {preset}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            placeholder="Cost label (e.g. Editor)"
                            className="flex-1 bg-black/40 border border-white/10 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)]">$</span>
                            <input
                                type="number"
                                value={newAmount}
                                onChange={(e) => setNewAmount(e.target.value)}
                                placeholder="0"
                                className="w-28 bg-black/40 border border-white/10 pl-6 pr-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors tabular-nums text-right"
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => { setIsAdding(false); setNewLabel(''); setNewAmount(''); }}
                            className="px-3 py-1.5 text-xs text-[var(--text-tertiary)] hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={loading || !newLabel.trim()}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                            Add
                        </button>
                    </div>
                </div>
            )}

            {/* Total */}
            {costs.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex justify-between items-center">
                    <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Total Costs</span>
                    <span className="text-sm font-bold text-white tabular-nums font-mono">
                        ${totalCost.toLocaleString()}
                    </span>
                </div>
            )}
        </div>
    );
}
