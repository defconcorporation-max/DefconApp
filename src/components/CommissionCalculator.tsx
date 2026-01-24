
'use client';

import { addCommission, deleteCommission } from '@/app/actions';
import { Commission, TeamMember } from '@/types';
import { useState } from 'react';

export default function CommissionCalculator({
    clientId,
    projectId,
    commissions,
    projectTotal = 0,
    teamMembers
}: {
    clientId: number,
    projectId?: number,
    commissions: Commission[],
    projectTotal?: number,
    teamMembers?: TeamMember[]
}) {
    // If projectTotal is passed (Project Level), use it. otherwise fallback to manual input (Legacy Client Level).
    const isProjectLevel = !!projectId;
    const [manualAmount, setManualAmount] = useState<number>(1000);

    const baseAmount = isProjectLevel ? projectTotal : manualAmount;

    const calculateShare = (comm: Commission) => {
        if (comm.rate_type === 'Percentage') {
            return (baseAmount * (comm.rate_value / 100)).toFixed(2);
        }
        return comm.rate_value.toFixed(2);
    };

    return (
        <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4 neo-gradient-text">Commission Calculator</h3>

            <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <label className="block text-xs uppercase text-gray-400 mb-1">
                    {isProjectLevel ? 'Project Total (Billable Services)' : 'Project Base Amount ($)'}
                </label>
                {isProjectLevel ? (
                    <div className="text-2xl font-bold text-white flex items-center gap-1">
                        <span className="text-emerald-500">$</span>{baseAmount.toLocaleString()}
                    </div>
                ) : (
                    <input
                        type="number"
                        value={manualAmount}
                        onChange={(e) => setManualAmount(Number(e.target.value))}
                        className="bg-transparent text-2xl font-bold w-full focus:outline-none text-white"
                    />
                )}
            </div>

            <div className="space-y-3 mb-8">
                {commissions.map(comm => (
                    <div key={comm.id} className="flex justify-between items-center bg-black/30 p-3 rounded-lg border border-white/5">
                        <div>
                            <p className="font-medium text-white">{comm.person_name} <span className="text-xs text-gray-500">({comm.role_name})</span></p>
                            <p className="text-xs text-violet-400">
                                {comm.rate_type === 'Percentage' ? `${comm.rate_value}%` : `$${comm.rate_value} Flat`}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xl font-bold text-green-400">${calculateShare(comm)}</span>
                            <form action={deleteCommission}>
                                <input type="hidden" name="id" value={comm.id} />
                                <input type="hidden" name="clientId" value={clientId} />
                                <input type="hidden" name="projectId" value={projectId || ''} />
                                <button className="text-red-500 hover:text-red-400 opacity-50 hover:opacity-100">×</button>
                            </form>
                        </div>
                    </div>
                ))}
                {commissions.length === 0 && (
                    <p className="text-center text-gray-500 italic text-sm">No commissions set.</p>
                )}
            </div>

            <form action={addCommission} className="border-t border-white/10 pt-4">
                <h4 className="text-sm font-medium mb-3 text-gray-300">Add New Role</h4>
                <input type="hidden" name="clientId" value={clientId} />
                <input type="hidden" name="projectId" value={projectId || ''} />

                <div className="grid grid-cols-2 gap-2 mb-2">
                    <input name="role" placeholder="Role (e.g. Editor)" className="bg-black/40 border border-white/10 p-2 rounded text-sm text-gray-300 focus:outline-none focus:border-violet-500" required />

                    {teamMembers && teamMembers.length > 0 ? (
                        <select name="person" className="bg-black/40 border border-white/10 p-2 rounded text-sm text-gray-300 focus:outline-none focus:border-violet-500 appearance-none" required>
                            <option value="">Select Team Member</option>
                            {teamMembers.map(member => (
                                <option key={member.id} value={member.name}>{member.name}</option>
                            ))}
                        </select>
                    ) : (
                        <input name="person" placeholder="Name (e.g. Kad)" className="bg-black/40 border border-white/10 p-2 rounded text-sm text-gray-300 focus:outline-none focus:border-violet-500" required />
                    )}
                </div>
                <div className="flex gap-2 mb-2">
                    <select name="rateType" className="bg-black/40 border border-white/10 p-2 rounded text-sm text-gray-300 outline-none">
                        <option value="Percentage">Percentage (%)</option>
                        <option value="Fixed">Fixed ($)</option>
                    </select>
                    <input name="rateValue" type="number" step="0.1" placeholder="Value" className="bg-black/40 border border-white/10 p-2 rounded text-sm text-gray-300 flex-1 focus:outline-none focus:border-violet-500" required />
                </div>
                <button className="w-full bg-violet-600/50 hover:bg-violet-600 text-white py-2 rounded text-sm transition-colors">Add Rule</button>
            </form>
        </div>
    );
}
