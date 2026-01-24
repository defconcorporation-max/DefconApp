'use client';

import { updateProjectTask, deleteProjectTask } from '@/app/actions';
import { ProjectTask, TaskStage, TeamMember } from '@/types';
import { Fragment, useState, useTransition } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Calendar, User, CheckSquare, Trash2, X, List } from 'lucide-react';

interface TaskDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: ProjectTask;
    stages: TaskStage[];
    teamMembers: TeamMember[];
    projectId: number;
}

export default function TaskDetailModal({ isOpen, onClose, task, stages, teamMembers, projectId }: TaskDetailModalProps) {
    const [isPending, startTransition] = useTransition();

    // Local state for immediate feedback
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');

    const handleUpdate = (field: string, value: any) => {
        startTransition(async () => {
            await updateProjectTask(task.id, { [field]: value }, projectId);
        });
    };

    const handleDelete = () => {
        if (!confirm('Delete this task?')) return;
        startTransition(async () => {
            await deleteProjectTask(task.id, projectId);
            onClose();
        });
    };

    const getStageColorClass = (color: string) => {
        const colors: Record<string, string> = {
            gray: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
            blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
            violet: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
            emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            yellow: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
            red: 'bg-red-500/20 text-red-300 border-red-500/30',
        };
        return colors[color] || colors.gray;
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-[#0A0A0A] border border-[var(--border-subtle)] text-left align-middle shadow-xl transition-all">

                                {/* Header */}
                                <div className="flex justify-between items-start p-6 border-b border-[var(--border-subtle)]">
                                    <div className="flex-1 mr-4">
                                        <div className="flex items-center gap-2 mb-2 text-xs text-[var(--text-tertiary)] uppercase tracking-wider">
                                            <CheckSquare size={14} /> Project Task
                                        </div>
                                        <input
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            onBlur={() => handleUpdate('title', title)}
                                            className="w-full bg-transparent text-xl font-bold text-white outline-none placeholder:text-gray-600"
                                            placeholder="Task Title"
                                        />
                                    </div>
                                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex flex-col md:flex-row h-[500px]">

                                    {/* Main Content */}
                                    <div className="flex-1 p-6 border-r border-[var(--border-subtle)] overflow-y-auto custom-scrollbar">

                                        <div className="mb-6">
                                            <label className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] mb-2">
                                                <List size={14} /> Description
                                            </label>
                                            <textarea
                                                value={description || ''}
                                                onChange={(e) => setDescription(e.target.value)}
                                                onBlur={() => handleUpdate('description', description)}
                                                className="w-full h-64 bg-transparent resize-none outline-none text-sm text-[var(--text-secondary)] placeholder:text-gray-700 leading-relaxed"
                                                placeholder="Add a more detailed description..."
                                            />
                                        </div>

                                        <div className="pt-6 border-t border-[var(--border-subtle)]">
                                            <button
                                                onClick={handleDelete}
                                                className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors opacity-60 hover:opacity-100"
                                            >
                                                <Trash2 size={12} /> Delete Task
                                            </button>
                                        </div>
                                    </div>

                                    {/* Sidebar Properties */}
                                    <div className="w-full md:w-64 p-6 bg-[#111] space-y-6">

                                        {/* Status */}
                                        <div>
                                            <label className="text-xs text-[var(--text-tertiary)] font-bold uppercase tracking-wider mb-2 block">Status</label>
                                            <select
                                                value={task.stage_id || ''}
                                                onChange={(e) => handleUpdate('stage_id', Number(e.target.value))}
                                                className={`w-full text-xs py-2 px-3 rounded appearance-none border outline-none cursor-pointer ${getStageColorClass(task.stage_color || 'gray')}`}
                                            >
                                                {stages.map(stage => (
                                                    <option key={stage.id} value={stage.id} className="bg-[#121212] text-gray-300">
                                                        {stage.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Assignee */}
                                        <div>
                                            <label className="text-xs text-[var(--text-tertiary)] font-bold uppercase tracking-wider mb-2 block">Assignee</label>
                                            <div className="relative">
                                                <User size={14} className="absolute left-3 top-2.5 text-gray-500" />
                                                <select
                                                    value={task.assigned_to || ''}
                                                    onChange={(e) => handleUpdate('assigned_to', e.target.value === '' ? null : Number(e.target.value))}
                                                    className="w-full bg-[#1A1A1A] border border-[var(--border-subtle)] rounded-lg pl-9 pr-3 py-2 text-xs text-gray-300 focus:border-violet-500 outline-none appearance-none cursor-pointer hover:bg-[#222]"
                                                >
                                                    <option value="">Unassigned</option>
                                                    {teamMembers.map(tm => (
                                                        <option key={tm.id} value={tm.id}>{tm.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Due Date */}
                                        <div>
                                            <label className="text-xs text-[var(--text-tertiary)] font-bold uppercase tracking-wider mb-2 block">Due Date</label>
                                            <div className="relative">
                                                <Calendar size={14} className="absolute left-3 top-2.5 text-gray-500" />
                                                <input
                                                    type="date"
                                                    value={task.due_date || ''}
                                                    onChange={(e) => handleUpdate('due_date', e.target.value)}
                                                    className="w-full bg-[#1A1A1A] border border-[var(--border-subtle)] rounded-lg pl-9 pr-3 py-2 text-xs text-gray-300 focus:border-violet-500 outline-none hover:bg-[#222]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
