
'use client';

import { addPayment } from '@/app/actions';
import { useState } from 'react';
import { X } from 'lucide-react';

export default function PaymentModal({ project, clientId, balance, onClose }: { project: any, clientId: number, balance: number, onClose: () => void }) {
    const [amount, setAmount] = useState(balance.toFixed(2));

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#121212] border border-[var(--border-subtle)] rounded-xl w-full max-w-md p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold mb-1">Record Payment</h2>
                <p className="text-sm text-[var(--text-secondary)] mb-6">
                    For Project: <span className="text-white">{project.title}</span>
                </p>

                <form action={async (formData) => {
                    await addPayment(formData);
                    onClose();
                }} className="space-y-4">
                    <input type="hidden" name="clientId" value={clientId} />
                    <input type="hidden" name="projectId" value={project.id} />

                    <div className="space-y-1">
                        <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Date</label>
                        <input name="date" type="date" className="pro-input w-full" defaultValue={new Date().toISOString().split('T')[0]} required />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Amount ($)</label>
                        <div className="flex gap-2">
                            <input
                                name="amount"
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pro-input flex-1"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setAmount(balance.toFixed(2))}
                                className="px-3 py-2 bg-white/10 text-xs rounded hover:bg-white/20 transition-colors"
                            >
                                Max
                            </button>
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)] text-right">Balance: ${balance.toFixed(2)}</p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Description</label>
                        <input name="description" type="text" placeholder="e.g. Deposit, Final Invoice" className="pro-input w-full" />
                    </div>

                    <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-lg transition-colors mt-4">
                        Confirm Payment
                    </button>
                </form>
            </div>
        </div>
    );
}
