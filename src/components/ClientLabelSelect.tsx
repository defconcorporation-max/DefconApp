'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

interface Props {
    defaultValue: number | string;
    labels: { id: number, name: string, color: string }[];
}

export default function ClientLabelSelect({ defaultValue, labels }: Props) {
    const [selectedValue, setSelectedValue] = useState<string | number>(defaultValue);

    return (
        <div className="space-y-2">
            <select
                name="labelId"
                value={selectedValue}
                onChange={(e) => setSelectedValue(e.target.value)}
                className="w-full bg-black border border-[var(--border-subtle)] rounded px-2 py-1.5 text-xs text-white focus:border-violet-500 outline-none"
            >
                <option value="">No Label</option>
                <optgroup label="Select Existing">
                    {labels.map(label => (
                        <option key={label.id} value={label.id}>{label.name}</option>
                    ))}
                </optgroup>
                <option value="NEW">+ Create New Label...</option>
            </select>

            {selectedValue === 'NEW' && (
                <div className="bg-white/5 p-3 rounded-lg border border-dashed border-white/10 animate-in slide-in-from-top-2">
                    <div className="text-xs font-bold text-violet-400 mb-2 flex items-center gap-1">
                        <Plus size={12} /> New Label Details
                    </div>
                    <div className="space-y-2">
                        <input
                            name="newLabelName"
                            placeholder="Label Name (e.g. Urgent)"
                            className="w-full bg-black border border-[var(--border-subtle)] rounded px-2 py-1.5 text-xs text-white focus:border-violet-500 outline-none"
                            required
                            autoFocus
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-[var(--text-secondary)]">Color:</span>
                            <input
                                type="color"
                                name="newLabelColor"
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
