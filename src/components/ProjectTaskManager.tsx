'use client';

import { addProjectTask, updateTaskStage, updateTaskAssignee, deleteProjectTask } from '@/app/actions';
import { ProjectTask, TaskStage, TeamMember } from '@/types';
import { Trash2, Plus, Calendar, CheckSquare, User, Briefcase, Filter, X } from 'lucide-react';
import { useState, useTransition } from 'react';
import TaskDetailModal from './TaskDetailModal';
import { toast } from 'react-hot-toast';

export default function ProjectTaskManager({
    projectId,
    tasks,
    stages,
    teamMembers
}: {
    projectId: number,
    tasks: ProjectTask[],
    stages: TaskStage[],
    teamMembers: TeamMember[]
}) {
    const [isPending, startTransition] = useTransition();

    // Filters
    const [filterAssignee, setFilterAssignee] = useState<number | 'all'>('all');
    const [filterStage, setFilterStage] = useState<number | 'all'>('all');

    // Detail Modal
    const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);

    const handleStageChange = (taskId: number, stageId: number) => {
        startTransition(async () => {
            try {
                await updateTaskStage(taskId, stageId, projectId);
            } catch (e) {
                toast.error('Failed to change stage');
            }
        });
    };

    const handleAssigneeChange = (taskId: number, assigneeId: string) => {
        const id = assigneeId === "" ? null : Number(assigneeId);
        startTransition(async () => {
            try {
                await updateTaskAssignee(taskId, id, projectId);
                toast.success('Assignee updated');
            } catch (e) {
                toast.error('Failed to update assignee');
            }
        });
    };

    const handleDelete = (taskId: number) => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        startTransition(async () => {
            try {
                await deleteProjectTask(taskId, projectId);
                toast.success('Task deleted');
            } catch (e) {
                toast.error('Failed to delete task');
            }
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

    // Filter Logic
    const filteredTasks = tasks.filter(task => {
        if (filterAssignee !== 'all' && task.assigned_to !== filterAssignee) return false;
        if (filterStage !== 'all' && task.stage_id !== filterStage) return false;
        return true;
    });

    return (
        <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[var(--border-subtle)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5">
                <h3 className="font-bold flex items-center gap-2 text-sm">
                    <CheckSquare size={16} className="text-violet-400" /> Deliverables
                    <span className="text-xs font-normal text-[var(--text-tertiary)] ml-2">({filteredTasks.length}/{tasks.length})</span>
                </h3>

                {/* Filters */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-black border border-[var(--border-subtle)] rounded-lg">
                        <User size={12} className="text-gray-500" />
                        <select
                            value={filterAssignee}
                            onChange={(e) => setFilterAssignee(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className="bg-transparent text-xs text-[var(--text-secondary)] outline-none cursor-pointer appearance-none pr-4"
                        >
                            <option value="all">All Assignees</option>
                            {teamMembers.map(tm => (
                                <option key={tm.id} value={tm.id}>{tm.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5 px-2 py-1 bg-black border border-[var(--border-subtle)] rounded-lg">
                        <Filter size={12} className="text-gray-500" />
                        <select
                            value={filterStage}
                            onChange={(e) => setFilterStage(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className="bg-transparent text-xs text-[var(--text-secondary)] outline-none cursor-pointer appearance-none pr-4"
                        >
                            <option value="all">All Stages</option>
                            {stages.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {(filterAssignee !== 'all' || filterStage !== 'all') && (
                        <button
                            onClick={() => { setFilterAssignee('all'); setFilterStage('all'); }}
                            className="text-xs text-[var(--text-tertiary)] hover:text-white transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div className="p-4 space-y-6">

                {/* Add Task Form */}
                <form action={async (formData) => {
                    try {
                        await addProjectTask(formData);
                        toast.success('Deliverable added');
                    } catch (e) {
                        toast.error('Failed to add deliverable');
                    }
                }} className="grid grid-cols-1 md:grid-cols-12 gap-2">
                    <input type="hidden" name="projectId" value={projectId} />

                    <div className="md:col-span-6 relative">
                        <input
                            name="title"
                            type="text"
                            placeholder="Add a deliverable..."
                            className="w-full bg-black border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm focus:border-violet-500 outline-none"
                            required
                        />
                    </div>

                    <div className="md:col-span-3 relative">
                        <div className="absolute left-2 top-2.5 text-gray-500 pointer-events-none">
                            <User size={14} />
                        </div>
                        <select
                            name="assigneeId"
                            className="w-full bg-black border border-[var(--border-subtle)] rounded-lg pl-8 pr-2 py-2 text-xs text-[var(--text-secondary)] focus:border-violet-500 outline-none appearance-none"
                        >
                            <option value="">Unassigned</option>
                            {teamMembers.map(tm => (
                                <option key={tm.id} value={tm.id}>{tm.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2 relative">
                        <div className="absolute left-2 top-2.5 text-gray-500 pointer-events-none">
                            <Calendar size={14} />
                        </div>
                        <input
                            name="dueDate"
                            type="date"
                            className="w-full bg-black border border-[var(--border-subtle)] rounded-lg pl-8 pr-2 py-2 text-xs text-[var(--text-secondary)] focus:border-violet-500 outline-none"
                        />
                    </div>

                    <button type="submit" className="md:col-span-1 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center rounded-lg transition-colors">
                        <Plus size={18} />
                    </button>
                </form>

                {/* Task List Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-2 text-[10px] uppercase font-bold text-[var(--text-tertiary)] tracking-wider">
                    <div className="col-span-5">Task</div>
                    <div className="col-span-3">Status</div>
                    <div className="col-span-3">Assignee</div>
                    <div className="col-span-1"></div>
                </div>

                {/* Task List */}
                <div className="space-y-1">
                    {filteredTasks.length === 0 && (
                        <div className="text-center py-8 text-xs text-[var(--text-tertiary)] italic">No deliverables found.</div>
                    )}

                    {filteredTasks.map(task => (
                        <div
                            key={task.id}
                            onClick={() => setSelectedTask(task)}
                            className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center group p-3 rounded hover:bg-white/5 transition-colors border border-transparent hover:border-[var(--border-subtle)] cursor-pointer"
                        >

                            {/* Title & Date */}
                            <div className="col-span-1 md:col-span-5 min-w-0">
                                <div className={`text-sm font-medium truncate ${task.is_completed ? 'line-through text-[var(--text-tertiary)]' : ''}`}>
                                    {task.title}
                                </div>
                                {(task.due_date || task.description) && (
                                    <div className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-2 mt-0.5">
                                        {task.due_date && <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(task.due_date).toLocaleDateString()}</span>}
                                        {task.description && <span className="flex items-center gap-1 truncate max-w-[150px]"><Briefcase size={10} /> {task.description}</span>}
                                    </div>
                                )}
                            </div>

                            {/* Status Selector - Stop Propagation to prevent modal opening */}
                            <div className="col-span-1 md:col-span-3" onClick={(e) => e.stopPropagation()}>
                                <select
                                    value={task.stage_id || ''}
                                    onChange={(e) => handleStageChange(task.id, Number(e.target.value))}
                                    className={`w-full text-xs py-1 px-2 rounded appearance-none border outline-none cursor-pointer ${getStageColorClass(task.stage_color || 'gray')}`}
                                >
                                    {stages.map(stage => (
                                        <option key={stage.id} value={stage.id} className="bg-[#121212] text-gray-300">
                                            {stage.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Assignee Selector - Stop Propagation */}
                            <div className="col-span-1 md:col-span-3" onClick={(e) => e.stopPropagation()}>
                                <div className="relative">
                                    <select
                                        value={task.assigned_to || ''}
                                        onChange={(e) => handleAssigneeChange(task.id, e.target.value)}
                                        className="w-full bg-transparent border border-[var(--border-subtle)] rounded py-1 pl-2 pr-6 text-xs text-[var(--text-secondary)] focus:border-emerald-500 outline-none appearance-none cursor-pointer hover:bg-white/5"
                                    >
                                        <option value="">Unassigned</option>
                                        {teamMembers.map(tm => (
                                            <option key={tm.id} value={tm.id}>{tm.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-2 top-1.5 pointer-events-none text-gray-500">
                                        <User size={10} />
                                    </div>
                                </div>
                            </div>

                            {/* Actions - Stop Propagation */}
                            <div className="col-span-1 flex justify-end" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={() => handleDelete(task.id)}
                                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-opacity p-1"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedTask && (
                <TaskDetailModal
                    isOpen={!!selectedTask}
                    onClose={() => setSelectedTask(null)}
                    task={selectedTask}
                    stages={stages}
                    teamMembers={teamMembers}
                    projectId={projectId}
                />
            )}
        </div>
    );
}
