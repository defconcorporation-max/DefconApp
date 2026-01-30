'use client';

import { createProjectLabel, deleteProjectLabel } from '@/app/actions';
import { X, Plus, Tag } from 'lucide-react';
import { useState } from 'react';

interface Props {
    labels: { id: number, name: string, color: string }[];
}

export default function ProjectLabelManager({ labels }: Props) {
    const [isOpen, setIsOpen] = useState(false);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
            >
                <Tag size={12} /> Manage Labels
            </button>
        );
    }

    return (
        <div className="absolute top-12 left-0 z-50 bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-4 shadow-2xl w-64 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-bold text-white">Project Labels</h4>
                <button onClick={() => setIsOpen(false)}><X size={14} className="text-gray-500 hover:text-white" /></button>
            </div>

            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                {labels.map(label => (
                    <div key={label.id} className="flex justify-between items-center bg-white/5 p-2 rounded">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: label.color }}></div>
                            <span className="text-xs text-gray-300">{label.name}</span>
                        </div>
                        <form action={deleteProjectLabel}>
                            <input type="hidden" name="id" value={label.id} />
                            <button className="text-gray-500 hover:text-red-400 transition-colors">
                                <X size={12} />
                            </button>
                        </form>
                    </div>
                ))}
                {labels.length === 0 && <p className="text-xs text-gray-500 text-center py-2">No labels created.</p>}
            </div>

            <form action={createProjectLabel} className="flex flex-col gap-2 border-t border-white/10 pt-3">
                <input name="name" placeholder="Label Name" className="bg-black border border-white/20 p-1.5 rounded text-xs text-white focus:border-violet-500 outline-none" required />
                <div className="flex gap-2">
                    <input type="color" name="color" defaultValue="#6366f1" className="bg-transparent h-7 w-8 cursor-pointer rounded" />
                    <button className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded py-1 flex justify-center items-center gap-1 transition-colors">
                        <Plus size={12} /> Add
                    </button>
                </div>
            </form>
        </div>
    );
}
