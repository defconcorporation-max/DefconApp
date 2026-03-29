'use client';

import { useState, useEffect } from 'react';
import { updateTaskStatus, deleteTask, createTask, getTasks } from '@/app/actions/task-actions';
import { Plus, GripVertical, CheckCircle2, Circle, MoreHorizontal, Trash, ExternalLink, CheckSquare } from 'lucide-react';
import TaskDetailModal from './TaskDetailModal';
import { Task } from '@/types';

export default function TasksBoard({ initialTasks }: { initialTasks: Task[] }) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    
    // Synchronize state with props when dashboard reloads
    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    const refreshTasks = async () => {
        try {
            const fresh = await getTasks();
            setTasks(fresh);
        } catch (error) {
            console.error(error);
        }
    };

    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [addingTo, setAddingTo] = useState<string | null>(null);

    const statuses = ['Todo', 'In Progress', 'Done'];

    const handleStatusChange = async (taskId: number | string, newStatus: string) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        if (typeof taskId === 'number') {
            await updateTaskStatus(taskId, newStatus);
        }
    };

    const handleDelete = async (e: React.MouseEvent, taskId: number | string) => {
        e.stopPropagation();
        setTasks(prev => prev.filter(t => t.id !== taskId));
        if (typeof taskId === 'number') {
            await deleteTask(taskId);
        }
    };

    const handleCreate = async (e: React.FormEvent, status: string) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) {
            setAddingTo(null);
            return;
        }

        const formData = new FormData();
        formData.append('title', newTaskTitle);
        formData.append('status', status);
        
        setAddingTo(null);
        setNewTaskTitle('');

        try {
            await createTask(formData);
            refreshTasks();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 p-4 md:p-8 h-full min-h-[calc(100vh-100px)] overflow-x-auto bg-[#0a0a0a]">
            {statuses.map(status => {
                const columnTasks = tasks.filter(t => t.status === status);
                
                return (
                    <div key={status} className="flex-1 min-w-[300px] flex flex-col bg-[#111] rounded-2xl border border-white/5 p-4 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-white/90 flex items-center gap-2">
                                {status === 'Done' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} className={status === 'Todo' ? 'text-gray-500' : 'text-blue-500'} />}
                                {status}
                            </h3>
                            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/50">{columnTasks.length}</span>
                        </div>

                        <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                            {columnTasks.map(task => (
                                <div 
                                    key={task.id} 
                                    onClick={() => setSelectedTask(task)}
                                    className={`bg-[#1a1a1a] border border-white/5 rounded-2xl p-4 shadow-sm transition-all group cursor-pointer hover:border-indigo-500/30 hover:bg-[#1e1e1e]`}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        {(task as any).is_readonly ? (
                                            <a 
                                                href={(task as any).href} 
                                                onClick={(e) => e.stopPropagation()}
                                                className="font-bold text-sm text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 group/link"
                                            >
                                                {task.title}
                                                <ExternalLink size={12} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                            </a>
                                        ) : (
                                            <div className="font-bold text-sm text-white/90 group-hover:text-white transition-colors">{task.title}</div>
                                        )}
                                        
                                        {!(task as any).is_readonly && (
                                            <button 
                                                onClick={(e) => handleDelete(e, task.id)} 
                                                className="text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash size={14} />
                                            </button>
                                        )}
                                    </div>
                                    
                                    {task.description && (
                                        <div className="mt-2">
                                            {task.raw_status ? (
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="text-[10px] text-white/30 uppercase font-black tracking-tighter">Étape actuelle :</span>
                                                    <a 
                                                        href={task.href}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 transition-all flex items-center gap-1 group/stage"
                                                    >
                                                        {task.raw_status}
                                                        <ExternalLink size={10} className="group-hover/stage:translate-x-0.5 transition-transform" />
                                                    </a>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-white/40 line-clamp-2 leading-relaxed italic">
                                                    {task.description}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="text-[10px] text-white/20 font-mono">
                                                {new Date(task.created_at).toLocaleDateString()}
                                            </div>
                                            {task.subtask_count !== undefined && task.subtask_count > 0 && (
                                                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${
                                                    task.completed_subtask_count === task.subtask_count 
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                                }`}>
                                                    <CheckSquare size={10} /> {task.completed_subtask_count}/{task.subtask_count}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {(task as any).is_readonly ? (
                                            <span className="text-[9px] bg-white/5 text-white/30 border border-white/5 px-2 py-0.5 rounded-lg uppercase tracking-wider font-bold">
                                                Auto-Sync
                                            </span>
                                        ) : (
                                            <select 
                                                onClick={(e) => e.stopPropagation()}
                                                value={task.status}
                                                onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                                className="text-[10px] bg-black/40 border border-white/5 rounded-lg px-2 py-1 outline-none focus:border-indigo-500/50 text-white/50 hover:text-white/80 transition-colors"
                                            >
                                                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {addingTo === status ? (
                                <form onSubmit={(e) => handleCreate(e, status)} className="mt-2" onClick={(e) => e.stopPropagation()}>
                                    <input 
                                        autoFocus
                                        type="text" 
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        onBlur={() => !newTaskTitle.trim() && setAddingTo(null)}
                                        placeholder="Tâche à faire..."
                                        className="w-full bg-[#1a1a1a] border border-indigo-500/50 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none placeholder:text-white/20"
                                    />
                                </form>
                            ) : (
                                <button 
                                    onClick={() => setAddingTo(status)}
                                    className="w-full py-3 mt-2 flex items-center justify-center gap-2 text-xs font-bold text-white/20 hover:text-white/80 hover:bg-white/5 rounded-2xl transition-all border border-dashed border-white/5 hover:border-white/10"
                                >
                                    <Plus size={16} /> Ajouter une tâche
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Task Detail Modal */}
            {selectedTask && (
                <TaskDetailModal 
                    task={selectedTask} 
                    is_readonly={selectedTask.is_readonly}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={refreshTasks}
                />
            )}
        </div>
    );
}
