'use client';

import { addPipelineStage, deletePipelineStage } from '@/app/actions';
import { PipelineStage } from '@/types';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { useTransition } from 'react';

export default function PipelineStagesManager({ stages }: { stages: PipelineStage[] }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = (id: number) => {
        if (!confirm('Are you sure you want to delete this client tag? It will be removed from all clients currently using it.')) return;
        startTransition(async () => {
            await deletePipelineStage(id);
        });
    };

    const colors = [
        { name: 'Gray', value: 'gray', bg: 'bg-gray-500' },
        { name: 'Blue', value: 'blue', bg: 'bg-blue-500' },
        { name: 'Violet', value: 'violet', bg: 'bg-violet-500' },
        { name: 'Emerald', value: 'emerald', bg: 'bg-emerald-500' },
        { name: 'Yellow', value: 'yellow', bg: 'bg-yellow-500' },
        { name: 'Orange', value: 'orange', bg: 'bg-orange-500' },
        { name: 'Red', value: 'red', bg: 'bg-red-500' },
    ];

    // Some default stages usually should not be deleted, but for tags we let users manage them freely.
    return (
        <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl overflow-hidden mb-8">
            <div className="p-4 border-b border-[var(--border-subtle)] bg-white/5">
                <h3 className="font-bold text-sm text-white">Client Tags & Kanban Stages</h3>
                <p className="text-xs text-[var(--text-tertiary)]">Customize the tags and pipeline stages used to organize your Clients.</p>
            </div>

            <div className="p-4">
                <div className="space-y-2 mb-6">
                    {stages.map(stage => (
                        <div key={stage.id} className="flex items-center gap-3 p-3 bg-white/5 rounded border border-[var(--border-subtle)]">
                            <GripVertical size={16} className="text-[var(--text-tertiary)] opacity-50" />
                            <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white ${stage.color || 'bg-gray-500'}`}>
                                {stage.label}
                            </div>
                            <span className="flex-1 text-sm text-[var(--text-secondary)] font-mono text-xs hidden md:block opacity-50">{stage.value}</span>

                            <button
                                onClick={() => handleDelete(stage.id)}
                                className="text-gray-600 hover:text-red-400 p-1 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>

                <form action={addPipelineStage} className="flex gap-4 items-center bg-[var(--bg-root)] p-3 rounded-lg border border-[var(--border-subtle)]">
                    <input
                        name="label"
                        placeholder="New Tag Name (e.g. Needs Follow-up)"
                        className="bg-transparent text-sm text-white placeholder:text-[var(--text-tertiary)] outline-none flex-1"
                        required
                    />
                    <div className="flex gap-1">
                        {colors.map(c => (
                            <label key={c.value} className="cursor-pointer relative" title={c.name}>
                                <input type="radio" name="color" value={c.bg} className="peer sr-only" defaultChecked={c.value === 'gray'} />
                                <div className={`w-4 h-4 rounded-full ${c.bg} opacity-40 hover:opacity-100 peer-checked:opacity-100 peer-checked:ring-2 ring-white/50 transition-all`}></div>
                            </label>
                        ))}
                    </div>
                    <button type="submit" disabled={isPending} className="bg-white text-black p-1.5 rounded hover:bg-gray-200 transition-colors disabled:opacity-50">
                        <Plus size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
}
