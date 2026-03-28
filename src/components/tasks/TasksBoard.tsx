'use client';

import { useState } from 'react';
import { updateTaskStatus, deleteTask, createTask } from '@/app/actions/task-actions';
import { Plus, GripVertical, CheckCircle2, Circle, MoreHorizontal, Trash } from 'lucide-react';

interface Task {
    id: number;
    title: string;
    description: string;
    status: string;
    created_at: string;
}

export default function TasksBoard({ initialTasks }: { initialTasks: Task[] }) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [addingTo, setAddingTo] = useState<string | null>(null);

    const statuses = ['Todo', 'In Progress', 'Done'];

    const handleStatusChange = async (taskId: number, newStatus: string) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        await updateTaskStatus(taskId, newStatus);
    };

    const handleDelete = async (taskId: number) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        await deleteTask(taskId);
    };

    const handleCreate = async (e: React.FormEvent, status: string) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) {
            setAddingTo(null);
            return;
        }

        // Optimistic UI updates could be added here
        const formData = new FormData();
        formData.append('title', newTaskTitle);
        formData.append('status', status);
        
        setAddingTo(null);
        setNewTaskTitle('');

        try {
            await createTask(formData);
            // Refresh logic usually handled by revalidatePath via server actions if we had useRouter().refresh(), 
            // but Next.js forms or client refresh is fine. For simplicity, we trigger reload or let the user refresh.
            window.location.reload();
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

                        <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
                            {columnTasks.map(task => (
                                <div key={task.id} className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4 shadow-sm hover:border-white/10 transition-colors group">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="font-medium text-sm text-white/90">{task.title}</div>
                                        <button onClick={() => handleDelete(task.id)} className="text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash size={14} />
                                        </button>
                                    </div>
                                    {task.description && (
                                        <div className="text-xs text-white/50 mt-2 line-clamp-2">{task.description}</div>
                                    )}
                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="text-[10px] text-white/30 font-mono">{new Date(task.created_at).toLocaleDateString()}</div>
                                        <select 
                                            value={task.status}
                                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                            className="text-[10px] bg-black/40 border border-white/10 rounded px-2 py-1 outline-none focus:border-indigo-500/50 text-white/70"
                                        >
                                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                            ))}

                            {addingTo === status ? (
                                <form onSubmit={(e) => handleCreate(e, status)} className="mt-2">
                                    <input 
                                        autoFocus
                                        type="text" 
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        onBlur={() => setAddingTo(null)}
                                        placeholder="Task title..."
                                        className="w-full bg-[#1a1a1a] border border-indigo-500/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                                    />
                                </form>
                            ) : (
                                <button 
                                    onClick={() => setAddingTo(status)}
                                    className="w-full py-2.5 mt-2 flex items-center justify-center gap-2 text-xs font-medium text-white/40 hover:text-white/80 hover:bg-white/5 rounded-xl transition-colors border border-dashed border-white/10 hover:border-white/20"
                                >
                                    <Plus size={14} /> Add Task
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
