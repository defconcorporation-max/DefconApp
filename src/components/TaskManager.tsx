'use client';

import { useState, useRef, useMemo } from 'react';
import { addTask, toggleTask, deleteTask, toggleProjectTask, DashboardTask } from '@/app/actions';
import { Check, Trash2, Plus, CheckCircle2, Circle, ChevronDown, ChevronUp, AlertCircle, Briefcase, User, Filter, X } from 'lucide-react';
import Link from 'next/link';

export default function TaskManager({ initialTasks }: { initialTasks: DashboardTask[] }) {
    const [tasks, setTasks] = useState<DashboardTask[]>(initialTasks);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    // Filters State
    const [filterType, setFilterType] = useState<string>('all');
    const [filterAssignee, setFilterAssignee] = useState<string>('all');

    // Derived Lists for Filters
    const uniqueAssignees = useMemo(() => {
        const names = new Set<string>();
        tasks.forEach(t => {
            if (t.assignee_name) names.add(t.assignee_name);
        });
        return Array.from(names).sort();
    }, [tasks]);

    // Optimistic Updates
    const handleAdd = async (formData: FormData) => {
        const title = formData.get('content') as string;
        if (!title.trim()) return;

        // Optimistic add (Personal Task)
        const tempId = Date.now();
        const newTask: DashboardTask = {
            id: tempId,
            title,
            is_completed: false,
            type: 'Personal'
        };

        setTasks([newTask, ...tasks]);
        formRef.current?.reset();

        await addTask(formData);
    };

    const handleToggle = async (task: DashboardTask) => {
        const newStatus = !task.is_completed;
        setTasks(tasks.map(t => t.id === task.id && t.type === task.type ? { ...t, is_completed: newStatus } : t));

        if (task.type === 'Personal') {
            await toggleTask(task.id, newStatus);
        } else if (task.type === 'Project' && task.project_id) {
            await toggleProjectTask(task.id, task.project_id);
        }
    };

    const handleDelete = async (task: DashboardTask) => {
        setTasks(tasks.filter(t => t.id !== task.id || t.type !== task.type));

        if (task.type === 'Personal') {
            await deleteTask(task.id);
        }
    };

    // Filter Logic
    const filteredTasks = tasks.filter(task => {
        // Filter by Type
        if (filterType === 'personal' && task.type !== 'Personal') return false;
        if (filterType === 'project' && task.type !== 'Project') return false;

        // Filter by Assignee
        if (filterAssignee !== 'all') {
            if (task.assignee_name !== filterAssignee) return false;
        }

        return true;
    });

    const activeTasks = filteredTasks.filter(t => !t.is_completed);
    const completedTasks = filteredTasks.filter(t => t.is_completed);

    return (
        <section className={`mb-12 transition-all duration-300 relative ${isCollapsed ? 'mb-8' : ''}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="w-6 h-6 flex items-center justify-center rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-white transition-colors flex-shrink-0"
                    >
                        {isCollapsed ? '↓' : '↑'}
                    </button>
                    <h2 className={`text-xl font-medium text-white flex items-center gap-2 ${isCollapsed ? 'text-[var(--text-secondary)]' : ''}`}>
                        {!isCollapsed && <span className="text-emerald-400">●</span>}
                        Tasks & Deliverables
                        <span className="text-sm font-normal text-[var(--text-tertiary)]">({activeTasks.length})</span>
                    </h2>
                </div>

                {/* Filters */}
                {!isCollapsed && (
                    <div className="flex items-center gap-2">
                        {/* Type Filter */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-lg">
                            <Filter size={12} className="text-gray-500" />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="bg-transparent text-xs text-gray-300 outline-none cursor-pointer appearance-none pr-4"
                            >
                                <option value="all">All Types</option>
                                <option value="personal">Personal</option>
                                <option value="project">Project</option>
                            </select>
                        </div>

                        {/* Assignee Filter */}
                        {uniqueAssignees.length > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-lg">
                                <User size={12} className="text-gray-500" />
                                <select
                                    value={filterAssignee}
                                    onChange={(e) => setFilterAssignee(e.target.value)}
                                    className="bg-transparent text-xs text-gray-300 outline-none cursor-pointer appearance-none pr-4"
                                >
                                    <option value="all">All Assignees</option>
                                    {uniqueAssignees.map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {(filterType !== 'all' || filterAssignee !== 'all') && (
                            <button
                                onClick={() => { setFilterType('all'); setFilterAssignee('all'); }}
                                className="text-xs text-[var(--text-tertiary)] hover:text-white transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {!isCollapsed && (
                <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    {/* Add Task Input (Personal Logic) */}
                    <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                        <form ref={formRef} action={handleAdd} className="flex gap-4">
                            <div className="relative flex-1">
                                <Plus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                                <input
                                    name="content"
                                    type="text"
                                    placeholder="Add a personal task..."
                                    className="w-full bg-[#121212] border border-[var(--border-subtle)] rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-gray-600"
                                    autoComplete="off"
                                />
                            </div>
                        </form>
                    </div>

                    {/* Task List */}
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {filteredTasks.length === 0 && (
                            <div className="p-8 text-center text-gray-600 text-sm">
                                {tasks.length === 0 ? "All caught up! No active tasks." : "No tasks match current filters."}
                            </div>
                        )}

                        <div className="divide-y divide-[var(--border-subtle)]">
                            {/* Active Tasks */}
                            {activeTasks.map(task => (
                                <div key={`${task.type}-${task.id}`} className="group flex items-center justify-between p-4 hover:bg-[var(--bg-surface)] transition-colors">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <button
                                            onClick={() => handleToggle(task)}
                                            className="text-gray-500 hover:text-emerald-500 transition-colors flex-shrink-0"
                                        >
                                            <Circle className="w-5 h-5" />
                                        </button>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm text-gray-200 truncate">{task.title}</span>
                                            {task.type === 'Project' && (
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded border border-violet-500/30 flex items-center gap-1">
                                                        <Briefcase size={8} /> {task.project_title}
                                                    </span>
                                                    {task.assignee_name && (
                                                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                            <User size={8} /> {task.assignee_name}
                                                        </span>
                                                    )}
                                                    {task.due_date && (
                                                        <span className="text-[10px] text-[var(--text-tertiary)]">
                                                            Due: {new Date(task.due_date).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {task.type === 'Personal' ? (
                                        <button
                                            onClick={() => handleDelete(task)}
                                            className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <Link href={`/projects/${task.project_id}`} className="opacity-0 group-hover:opacity-100 text-[10px] bg-white/10 px-2 py-1 rounded text-white hover:bg-white/20 transition-all">
                                            View Project
                                        </Link>
                                    )}
                                </div>
                            ))}

                            {/* Completed Tasks */}
                            {completedTasks.length > 0 && (
                                <>
                                    {activeTasks.length > 0 && (
                                        <div className="px-4 py-2 bg-[var(--bg-root)] text-[10px] uppercase font-bold text-gray-700 tracking-wider">
                                            Completed
                                        </div>
                                    )}
                                    {completedTasks.map(task => (
                                        <div key={`${task.type}-${task.id}`} className="group flex items-center justify-between p-4 bg-[var(--bg-root)]/50 hover:bg-[var(--bg-surface)] transition-colors">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <button
                                                    onClick={() => handleToggle(task)}
                                                    className="text-emerald-500 flex-shrink-0"
                                                >
                                                    <CheckCircle2 className="w-5 h-5" />
                                                </button>
                                                <span className="text-sm text-gray-500 line-through truncate">{task.title}</span>
                                            </div>
                                            {task.type === 'Personal' && (
                                                <button
                                                    onClick={() => handleDelete(task)}
                                                    className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
