'use client';

import { addTaskStage, deleteTaskStage } from '@/app/actions';
import { TaskStage } from '@/types';
import { Trash2, Plus, GripVertical, Check } from 'lucide-react';
import { useTransition } from 'react';

export default function TaskStageManager({ stages }: { stages: TaskStage[] }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = (id: number) => {
        if (!confirm('Delete this stage? Tasks will be moved to default.')) return;
        startTransition(async () => {
            await deleteTaskStage(id);
        });
    };

    const colors = [
        { name: 'Gray', value: 'gray', bg: 'bg-gray-500' },
        { name: 'Blue', value: 'blue', bg: 'bg-blue-500' },
        { name: 'Violet', value: 'violet', bg: 'bg-violet-500' },
        { name: 'Emerald', value: 'emerald', bg: 'bg-emerald-500' },
        { name: 'Yellow', value: 'yellow', bg: 'bg-yellow-500' },
        { name: 'Red', value: 'red', bg: 'bg-red-500' },
    ];

    return (
        <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl overflow-hidden mb-8">
            <div className="p-4 border-b border-[var(--border-subtle)] bg-white/5">
                <h3 className="font-bold text-sm text-white">Task Stages</h3>
                <p className="text-xs text-[var(--text-tertiary)]">Customize workflow stages for project deliverables.</p>
            </div>

            <div className="p-4">
                <div className="space-y-2 mb-6">
                    {stages.map(stage => (
                        <div key={stage.id} className="flex items-center gap-3 p-3 bg-white/5 rounded border border-[var(--border-subtle)]">
                            <GripVertical size={16} className="text-[var(--text-tertiary)] cursor-grab" />
                            <div className={`w-3 h-3 rounded-full bg-${stage.color}-500 opacity-80`} />
                            <span className="flex-1 text-sm font-medium">{stage.name}</span>

                            {stage.is_default && <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-[var(--text-secondary)]">Default</span>}

                            {!stage.is_default && (
                                <button
                                    onClick={() => handleDelete(stage.id)}
                                    className="text-gray-600 hover:text-red-400 p-1 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <form action={addTaskStage} className="flex gap-4 items-center bg-[var(--bg-root)] p-3 rounded-lg border border-[var(--border-subtle)]">
                    <input
                        name="name"
                        placeholder="New Stage Name"
                        className="bg-transparent text-sm text-white placeholder:text-[var(--text-tertiary)] outline-none flex-1"
                        required
                    />
                    <div className="flex gap-1">
                        {colors.map(c => (
                            <label key={c.value} className="cursor-pointer relative">
                                <input type="radio" name="color" value={c.value} className="peer sr-only" defaultChecked={c.value === 'gray'} />
                                <div className={`w-4 h-4 rounded-full ${c.bg} opacity-40 hover:opacity-100 peer-checked:opacity-100 peer-checked:ring-2 ring-white/50 transition-all`}></div>
                            </label>
                        ))}
                    </div>
                    <button type="submit" className="bg-white text-black p-1.5 rounded hover:bg-gray-200 transition-colors">
                        <Plus size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
}
