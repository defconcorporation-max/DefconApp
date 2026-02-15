'use client';

import { useState } from 'react';
import { ArrowUp, ArrowDown, X, Plus, Check } from 'lucide-react';

export interface ShotItem {
    id: string;
    title: string;
    description: string;
    type: string; // 'Wide', 'Close-up', 'Drone', etc.
    completed?: boolean;
}

export default function ShotListBuilder({ shots, setShots }: { shots: ShotItem[], setShots: (s: ShotItem[]) => void }) {

    const addShot = () => {
        const newShot: ShotItem = {
            id: Date.now().toString(),
            title: '',
            description: '',
            type: 'Wide',
            completed: false
        };
        setShots([...shots, newShot]);
    };

    const updateShot = (id: string, field: keyof ShotItem, value: string | boolean) => {
        setShots(shots.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const toggleCompleted = (id: string) => {
        setShots(shots.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
    };

    const removeShot = (id: string) => {
        setShots(shots.filter(s => s.id !== id));
    };

    const moveShot = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === shots.length - 1) return;

        const newShots = [...shots];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [newShots[index], newShots[swapIndex]] = [newShots[swapIndex], newShots[index]];
        setShots(newShots);
    };

    const completedCount = shots.filter(s => s.completed).length;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-[var(--text-secondary)]">
                    {completedCount}/{shots.length} shots completed
                </p>
                <button
                    onClick={addShot}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
                >
                    <Plus size={16} />
                    Add Shot
                </button>
            </div>

            <div className="bg-[var(--bg-root)]/50 rounded-lg p-2 min-h-[200px] space-y-2">
                {shots.map((item, index) => (
                    <div key={item.id} className={`bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded p-3 flex items-start gap-3 group relative hover:border-[var(--text-tertiary)] transition-colors ${item.completed ? 'opacity-60' : ''}`}>

                        {/* Checkmark */}
                        <button
                            onClick={() => toggleCompleted(item.id)}
                            className={`w-6 h-6 rounded border flex-shrink-0 flex items-center justify-center transition-colors mt-1 ${item.completed
                                ? 'bg-emerald-500 border-emerald-500 text-black'
                                : 'border-[var(--text-tertiary)] hover:border-white text-transparent'
                                }`}
                        >
                            <Check size={14} />
                        </button>

                        {/* Reorder */}
                        <div className="flex flex-col gap-1 mt-1">
                            <button
                                onClick={() => moveShot(index, 'up')}
                                disabled={index === 0}
                                className="p-0.5 text-[var(--text-tertiary)] hover:text-white disabled:opacity-20"
                            >
                                <ArrowUp size={14} />
                            </button>
                            <button
                                onClick={() => moveShot(index, 'down')}
                                disabled={index === shots.length - 1}
                                className="p-0.5 text-[var(--text-tertiary)] hover:text-white disabled:opacity-20"
                            >
                                <ArrowDown size={14} />
                            </button>
                        </div>

                        {/* Fields: Title / Description / Type */}
                        <div className="grid grid-cols-12 gap-3 flex-1">
                            <div className="col-span-3">
                                <label className="text-[10px] text-[var(--text-tertiary)] uppercase block mb-1">Title</label>
                                <input
                                    value={item.title}
                                    onChange={(e) => updateShot(item.id, 'title', e.target.value)}
                                    className={`w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-sm text-white focus:border-emerald-500 outline-none ${item.completed ? 'line-through' : ''}`}
                                    placeholder="Opening shot"
                                />
                            </div>
                            <div className="col-span-6">
                                <label className="text-[10px] text-[var(--text-tertiary)] uppercase block mb-1">Description</label>
                                <textarea
                                    value={item.description}
                                    onChange={(e) => updateShot(item.id, 'description', e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-sm text-white focus:border-emerald-500 outline-none resize-none min-h-[60px]"
                                    placeholder="Full description of the shot, script notes, directions..."
                                    rows={3}
                                />
                            </div>
                            <div className="col-span-3">
                                <label className="text-[10px] text-[var(--text-tertiary)] uppercase block mb-1">Type</label>
                                <select
                                    value={item.type}
                                    onChange={(e) => updateShot(item.id, 'type', e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-sm text-white focus:border-emerald-500 outline-none appearance-none"
                                >
                                    <option>Wide</option>
                                    <option>Medium</option>
                                    <option>Close-up</option>
                                    <option>Macro</option>
                                    <option>Drone</option>
                                    <option>POV</option>
                                    <option>Gimbal</option>
                                    <option>B-Roll</option>
                                    <option>Interview</option>
                                    <option>Talking Head</option>
                                    <option>Product</option>
                                    <option>Transition</option>
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={() => removeShot(item.id)}
                            className="text-[var(--text-tertiary)] hover:text-red-400 p-1 opacity-10 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}

                {shots.length === 0 && (
                    <div className="text-center py-10 text-[var(--text-tertiary)] border-2 border-dashed border-[var(--border-subtle)] rounded-lg">
                        <p>No shots planned yet.</p>
                        <button onClick={addShot} className="text-emerald-400 hover:underline mt-2">Add your first shot</button>
                    </div>
                )}
            </div>
        </div>
    );
}
