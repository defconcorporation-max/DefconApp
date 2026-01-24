
'use client';

import { addPayment } from '@/app/actions';

export default function PaymentTracker({ clientId, payments }: { clientId: number, payments: any[] }) {
    return (
        <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4 neo-gradient-text">Payments & Finances</h3>

            <div className="space-y-2 mb-6 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {payments.map((p: any) => (
                    <div key={p.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                        <div>
                            <p className="font-bold text-white">${p.amount}</p>
                            <p className="text-xs text-gray-500">{p.description} • {p.date}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs border ${p.status === 'Paid' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                p.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                    'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                            {p.status}
                        </span>
                    </div>
                ))}
                {payments.length === 0 && <p className="text-gray-500 text-sm">No payment history.</p>}
            </div>

            <form action={addPayment} className="grid gap-2 text-sm">
                <input type="hidden" name="clientId" value={clientId} />
                <div className="grid grid-cols-2 gap-2">
                    <input name="amount" type="number" placeholder="Amount ($)" className="bg-black/40 border border-white/10 p-2 rounded focus:outline-none focus:border-violet-500" required />
                    <select name="status" className="bg-black/40 border border-white/10 p-2 rounded">
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <input name="date" type="date" className="bg-black/40 border border-white/10 p-2 rounded color-scheme-dark" required />
                    <input name="description" placeholder="For..." className="bg-black/40 border border-white/10 p-2 rounded focus:outline-none focus:border-violet-500" />
                </div>
                <button className="bg-white/10 hover:bg-white/20 py-2 rounded transition-colors font-medium">Add Payment Record</button>
            </form>
        </div>
    );
}
