'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

interface Props {
    defaultValue: number | string;
    labels: { id: number, name: string, color: string }[];
}

export default function ClientAgencySelect({ defaultValue, agencies }: { defaultValue: number | string, agencies: { id: number, name: string, color: string }[] }) {
    const [selectedValue, setSelectedValue] = useState<string | number>(defaultValue);

    return (
        <div className="space-y-2">
            <select
                name="agencyId"
                value={selectedValue}
                onChange={(e) => setSelectedValue(e.target.value)}
                className="w-full bg-black border border-[var(--border-subtle)] rounded px-2 py-1.5 text-xs text-white focus:border-violet-500 outline-none"
            >
                <option value="">No Agency</option>
                <optgroup label="Select Existing">
                    {agencies.map(agency => (
                        <option key={agency.id} value={agency.id}>{agency.name}</option>
                    ))}
                </optgroup>
                <option value="NEW">+ Create New Agency...</option>
            </select>

            {selectedValue === 'NEW' && (
                <div className="bg-white/5 p-3 rounded-lg border border-dashed border-white/10 animate-in slide-in-from-top-2">
                    <div className="text-xs font-bold text-violet-400 mb-2 flex items-center gap-1">
                        <Plus size={12} /> New Agency Details
                    </div>
                    <div className="space-y-2">
                        <input
                            name="newAgencyName"
                            placeholder="Agency Name (e.g. Publicis)"
                            className="w-full bg-black border border-[var(--border-subtle)] rounded px-2 py-1.5 text-xs text-white focus:border-violet-500 outline-none"
                            required
                            autoFocus
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-[var(--text-secondary)]">Color:</span>
                            <input
                                type="color"
                                name="newAgencyColor"
                                defaultValue="#8b5cf6"
                                className="bg-transparent h-6 w-8 cursor-pointer rounded"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
