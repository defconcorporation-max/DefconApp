'use client';

import { useState, useEffect } from 'react';
import { updateClientStatus, savePipelineStage, reorderPipelineStages, deletePipelineStage } from '@/app/actions';
import Link from 'next/link';
import { Client, PipelineStage } from '@/types';
import { GripVertical, Plus, Trash2, Edit2, Check, X, Settings2 } from 'lucide-react';

export default function ClientKanban({ initialClients, initialStages, readOnly = false }: { initialClients: Client[], initialStages: PipelineStage[], readOnly?: boolean }) {
    const [clients, setClients] = useState<Client[]>(initialClients);
    const [stages, setStages] = useState<PipelineStage[]>(initialStages);
    const [draggedClientId, setDraggedClientId] = useState<number | null>(null);

    // Sync with server updates
    useEffect(() => {
        setClients(initialClients);
    }, [initialClients]);

    useEffect(() => {
        setStages(initialStages);
    }, [initialStages]);
    const [isEditingPipeline, setIsEditingPipeline] = useState(false);
    const [editingStageId, setEditingStageId] = useState<number | null>(null);
    const [newStageName, setNewStageName] = useState('');

    // Drag and Drop for Clients
    const handleDragStart = (e: React.DragEvent, resultId: number) => {
        setDraggedClientId(resultId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        if (draggedClientId === null) return;

        const updatedClients = clients.map(client => {
            if (client.id === draggedClientId) {
                return { ...client, status: newStatus };
            }
            return client;
        });

        setClients(updatedClients); // Optimistic update
        await updateClientStatus(draggedClientId, newStatus);
        setDraggedClientId(null);
    };

    // Pipeline Editing
    const handleAddStage = async () => {
        const tempId = Date.now();
        const newStage: PipelineStage = {
            id: tempId, // Temp ID
            label: 'New Stage',
            value: `new_stage_${tempId}`,
            color: 'bg-gray-500',
            order_index: stages.length
        };

        // Optimistic
        setStages([...stages, newStage]);

        // Save
        await savePipelineStage({
            label: newStage.label,
            value: newStage.value,
            color: newStage.color
        });
    };

    const handleUpdateStage = async (stageId: number, newLabel: string, newColor: string, closeEdit: boolean) => {
        const updatedStages = stages.map(s => s.id === stageId ? { ...s, label: newLabel, color: newColor } : s);
        setStages(updatedStages);
        if (closeEdit) setEditingStageId(null);

        const stageToUpdate = stages.find(s => s.id === stageId);
        if (stageToUpdate) {
            await savePipelineStage({ ...stageToUpdate, label: newLabel, color: newColor });
        }
    };

    const handleDeleteStage = async (stageId: number) => {
        console.log('Deleting stage', stageId);
        // Removed confirm dialog to fix blocking issue
        setStages(stages.filter(s => s.id !== stageId));
        await deletePipelineStage(stageId);
    };

    // Drag and Drop for Stages (Reordering)
    const [draggedStageIndex, setDraggedStageIndex] = useState<number | null>(null);

    const handleStageDragStart = (e: React.DragEvent, index: number) => {
        setDraggedStageIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleStageDrop = async (e: React.DragEvent, dropIndex: number) => {
        if (draggedStageIndex === null || draggedStageIndex === dropIndex) return;

        const newStages = [...stages];
        const [movedStage] = newStages.splice(draggedStageIndex, 1);
        newStages.splice(dropIndex, 0, movedStage);

        // Reassign indexes
        const reorderedStages = newStages.map((s, index) => ({ ...s, order_index: index }));
        setStages(reorderedStages);
        setDraggedStageIndex(null);

        await reorderPipelineStages(reorderedStages);
    };

    const getColumnClients = (statusValue: string) => {
        return clients.filter(client => (client.status || 'Active') === statusValue || (statusValue === 'Active' && client.status === 'Standard'));
    };

    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="flex flex-col h-full bg-[var(--bg-root)]">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="w-6 h-6 flex items-center justify-center rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-white transition-colors"
                    >
                        {isCollapsed ? '↓' : '↑'}
                    </button>
                    <h2 className={`text-xl font-medium text-white flex items-center gap-2 ${isCollapsed ? 'text-[var(--text-secondary)]' : ''}`}>
                        {!isCollapsed && <span className="text-violet-400">●</span>}
                        Pipeline
                    </h2>
                </div>

                {!isCollapsed && !readOnly && (
                    <button
                        onClick={() => setIsEditingPipeline(!isEditingPipeline)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${isEditingPipeline ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white bg-white/5'}`}
                    >
                        <Settings2 size={16} />
                        {isEditingPipeline ? 'Done Editing' : 'Edit Pipeline'}
                    </button>
                )}
            </div>

            {!isCollapsed && (
                <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-340px)] animate-in fade-in slide-in-from-top-4 duration-300">
                    {stages.map((column, index) => (
                        <div
                            key={column.id}
                            className={`min-w-[300px] bg-[#0A0A0A] border rounded-xl flex flex-col h-full transition-colors ${isEditingPipeline ? 'border-dashed border-gray-600' : 'border-[var(--border-subtle)]'}`}
                            // Parent is NOT draggable
                            onDragOver={(e) => { e.preventDefault(); /* Allow drop */ }}
                            onDrop={(e) => isEditingPipeline ? handleStageDrop(e, index) : handleDrop(e, column.value)}
                        >
                            {/* Column Header */}
                            <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between sticky top-0 bg-[#0A0A0A] z-10 rounded-t-xl group/header">
                                {editingStageId === column.id ? (
                                    <div className="flex flex-col gap-2 w-full">
                                        <div className="flex items-center gap-2">
                                            <input
                                                autoFocus
                                                defaultValue={column.label}
                                                className="bg-black border border-gray-500 rounded px-2 py-1 text-sm text-white w-full focus:outline-none focus:border-violet-500"
                                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleUpdateStage(column.id, e.currentTarget.value, column.color, true);
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateStage(column.id, column.label, column.color, true)} // Check button saves and closes
                                                className="p-1 hover:text-white text-gray-400"
                                            >
                                                <Check size={16} />
                                            </button>
                                        </div>
                                        <div className="flex gap-1 flex-wrap">
                                            {['bg-slate-500', 'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-cyan-500', 'bg-blue-500', 'bg-violet-500', 'bg-fuchsia-500', 'bg-rose-500'].map(color => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    // Updates color but KEEPS edit mode open (closeEdit=false)
                                                    onClick={() => handleUpdateStage(column.id, column.label, color, false)}
                                                    className={`w-4 h-4 rounded-full ${color} ${column.color === color ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-100'} transition-all cursor-pointer z-50`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="font-medium text-white flex items-center gap-2 select-none">
                                            {isEditingPipeline && (
                                                <div
                                                    className="cursor-move p-1 text-gray-400 hover:text-white bg-white/5 rounded"
                                                    draggable={true}
                                                    onDragStart={(e) => handleStageDragStart(e, index)}
                                                    title="Drag to reorder"
                                                >
                                                    <GripVertical size={16} />
                                                </div>
                                            )}
                                            <div
                                                onClick={() => isEditingPipeline && setEditingStageId(column.id)}
                                                className={`w-2 h-2 rounded-full ${column.color} shadow-[0_0_8px_rgba(255,255,255,0.2)] ${isEditingPipeline ? 'cursor-pointer hover:ring-2 ring-white/50' : ''}`}
                                            ></div>
                                            {column.label}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            {!isEditingPipeline && (
                                                <span className="text-xs text-[var(--text-tertiary)] bg-white/5 px-2 py-0.5 rounded-full">
                                                    {getColumnClients(column.value).length}
                                                </span>
                                            )}
                                            {isEditingPipeline && (
                                                <div
                                                    className="flex gap-1 relative z-50 bg-[#0A0A0A]"
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingStageId(column.id);
                                                        }}
                                                        className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white cursor-pointer transition-colors"
                                                        title="Rename Stage"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteStage(column.id);
                                                        }}
                                                        className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 cursor-pointer transition-colors"
                                                        title="Delete Stage"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Column Content */}
                            <div className={`p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar ${isEditingPipeline ? 'opacity-50 pointer-events-none' : ''}`}>
                                {getColumnClients(column.value).map(client => (
                                    <div
                                        key={client.id}
                                        draggable={!isEditingPipeline && !readOnly}
                                        onDragStart={(e) => !readOnly && handleDragStart(e, client.id)}
                                        className={`group ${readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
                                    >
                                        <Link href={`/clients/${client.id}`} draggable={false}>
                                            <article className="bg-[#121212] border border-[var(--border-subtle)] rounded-lg p-4 hover:border-violet-500/50 hover:bg-[#181818] transition-all shadow-sm hover:shadow-md">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-medium text-white truncate pr-2 group-hover:text-violet-200 transition-colors">
                                                        {client.company_name || client.name}
                                                    </h4>
                                                    {client.avatar_url && (
                                                        <div className="w-6 h-6 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={client.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between mt-3">
                                                    <span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                                        {client.plan}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                                                        ID: {client.id}
                                                    </span>
                                                </div>
                                            </article>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {isEditingPipeline && (
                        <button
                            onClick={handleAddStage}
                            className="min-w-[50px] bg-white/5 border border-dashed border-gray-600 rounded-xl flex items-center justify-center hover:bg-white/10 hover:border-gray-400 transition-colors group"
                        >
                            <Plus className="text-gray-500 group-hover:text-white" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
