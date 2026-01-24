'use client';

import { useState } from 'react';
import { PostProductionItem } from '@/types';
import { updatePostProdStatus } from '@/app/actions';
import Link from 'next/link';

const COLUMNS = [
    { id: 'Derush', label: 'Derush', color: 'bg-orange-500' },
    { id: 'Editing', label: 'Editing', color: 'bg-indigo-500' },
    { id: 'Validation', label: 'Validation', color: 'bg-purple-500' },
    { id: 'Archived', label: 'Archived', color: 'bg-slate-500' },
];

export default function PostProdBoard({ initialItems }: { initialItems: PostProductionItem[] }) {
    const [items, setItems] = useState<PostProductionItem[]>(initialItems);
    const [draggedItemId, setDraggedItemId] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, id: number) => {
        setDraggedItemId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, status: string) => {
        e.preventDefault();
        if (draggedItemId === null) return;

        // Optimistic update
        setItems(items.map(item => item.id === draggedItemId ? { ...item, status: status as any, updated_at: new Date().toISOString() } : item));

        await updatePostProdStatus(draggedItemId, status);
        setDraggedItemId(null);
    };

    const getColumnItems = (status: string) => items.filter(i => i.status === status);

    return (
        <div className="flex gap-6 overflow-x-auto pb-8 h-[calc(100vh-140px)]">
            {COLUMNS.map(column => (
                <div
                    key={column.id}
                    className="min-w-[320px] bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl flex flex-col h-full"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, column.id)}
                >
                    <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between sticky top-0 bg-[#0A0A0A] z-10 rounded-t-xl">
                        <h3 className="font-medium text-white flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${column.color}`}></div>
                            {column.label}
                        </h3>
                        <span className="text-xs text-[var(--text-tertiary)] bg-white/5 px-2 py-0.5 rounded-full">
                            {getColumnItems(column.id).length}
                        </span>
                    </div>

                    <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                        {getColumnItems(column.id).map(item => (
                            <div
                                key={item.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, item.id)}
                                className="bg-[#121212] border border-[var(--border-subtle)] rounded-lg p-4 cursor-grab active:cursor-grabbing hover:border-gray-600 transition-colors shadow-sm"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">{item.client_name}</span>
                                    <span className="text-[10px] text-[var(--text-tertiary)] mono">
                                        {new Date(item.updated_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <h4 className="font-medium text-white mb-3 text-sm">{item.shoot_title}</h4>
                                <Link
                                    href={`/shoots/${item.shoot_id}`}
                                    className="text-xs text-violet-400 hover:text-violet-300 hover:underline inline-flex items-center gap-1"
                                >
                                    View Shoot →
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
