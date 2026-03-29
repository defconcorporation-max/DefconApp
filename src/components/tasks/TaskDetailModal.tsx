'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, CheckCircle2, Circle, Plus, Trash2, 
    Calendar, AlignLeft, CheckSquare, Clock,
    Loader2, ExternalLink
} from 'lucide-react';
import { 
    getSubtasks, createSubtask, toggleSubtask, 
    deleteSubtask, updateTaskDetails 
} from '@/app/actions/task-actions';
import { Task, Subtask } from '@/types';
import toast from 'react-hot-toast';

interface TaskDetailModalProps {
    task: Task;
    onClose: () => void;
    onUpdate?: () => void;
    is_readonly?: boolean;
}

export default function TaskDetailModal({ task, onClose, onUpdate, is_readonly = false }: TaskDetailModalProps) {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [subtasks, setSubtasks] = useState<Subtask[]>([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [isLoadingSubtasks, setIsLoadingSubtasks] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (is_readonly) {
            setIsLoadingSubtasks(false);
            return;
        }
        const loadSubtasks = async () => {
            try {
                const data = await getSubtasks(task.id);
                setSubtasks(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoadingSubtasks(false);
            }
        };
        loadSubtasks();
    }, [task.id, is_readonly]);

    const handleSaveDetails = async () => {
        if (is_readonly) return;
        setIsSaving(true);
        try {
            await updateTaskDetails(task.id, title, description);
            toast.success('Task updated');
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error('Failed to update task');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddSubtask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (is_readonly || !newSubtaskTitle.trim()) return;

        const tempId = Math.random();
        const optimisticSubtask: any = {
            id: tempId,
            task_id: task.id,
            title: newSubtaskTitle,
            is_completed: false,
            created_at: new Date().toISOString()
        };

        setSubtasks([...subtasks, optimisticSubtask]);
        setNewSubtaskTitle('');

        try {
            await createSubtask(task.id, newSubtaskTitle);
            const fresh = await getSubtasks(task.id);
            setSubtasks(fresh);
            if (onUpdate) onUpdate();
        } catch (error) {
            setSubtasks(subtasks.filter(s => s.id !== tempId));
            toast.error('Failed to add subtask');
        }
    };

    const handleToggleSubtask = async (subtask: Subtask) => {
        if (is_readonly) return;
        const newStatus = !subtask.is_completed;
        setSubtasks(subtasks.map(s => s.id === subtask.id ? { ...s, is_completed: newStatus } : s));
        
        try {
            await toggleSubtask(subtask.id, newStatus);
            if (onUpdate) onUpdate();
        } catch (error) {
            setSubtasks(subtasks.map(s => s.id === subtask.id ? { ...s, is_completed: !newStatus } : s));
            toast.error('Failed to update subtask');
        }
    };

    const handleDeleteSubtask = async (id: number) => {
        if (is_readonly) return;
        const original = [...subtasks];
        setSubtasks(subtasks.filter(s => s.id !== id));
        
        try {
            await deleteSubtask(id);
            if (onUpdate) onUpdate();
        } catch (error) {
            setSubtasks(original);
            toast.error('Failed to delete subtask');
        }
    };

    const progress = subtasks.length > 0 
        ? Math.round((subtasks.filter(s => s.is_completed).length / subtasks.length) * 100)
        : 0;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-[#09090b] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-6 md:p-8 border-b border-white/5 flex items-start justify-between bg-gradient-to-b from-white/5 to-transparent">
                        <div className="flex-1">
                            <input 
                                value={title}
                                readOnly={is_readonly}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleSaveDetails}
                                className={`bg-transparent border-none text-2xl font-black text-white focus:outline-none w-full placeholder:text-white/20 ${is_readonly ? 'cursor-default' : ''}`}
                                placeholder="Task Title"
                            />
                            <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                    <Clock size={12} /> {new Date(task.created_at).toLocaleDateString()}
                                </div>
                                <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    task.status === 'Done' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    task.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                    'bg-white/5 text-white/50 border border-white/10'
                                }`}>
                                    {task.status}
                                </div>
                                {is_readonly && (
                                    <div className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                        Auto-Sync (Read Only)
                                    </div>
                                )}
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                        {/* Description */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-white/90 font-bold text-sm uppercase tracking-wider">
                                <AlignLeft size={16} className="text-indigo-400" />
                                {is_readonly ? 'Détails de la Production' : 'Description'}
                            </div>
                            
                            {is_readonly ? (
                                <div className="p-6 bg-white/5 border border-white/5 rounded-[24px] space-y-4">
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Étape Actuelle</span>
                                        <a 
                                            href={(task as any).href}
                                            className="group flex items-center justify-between p-4 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-2xl transition-all"
                                        >
                                            <span className="font-black text-lg text-indigo-400 tracking-tight">
                                                {task.raw_status || task.description?.replace('Étape actuelle : ', '')}
                                            </span>
                                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400/60 group-hover:text-indigo-400 transition-colors uppercase tracking-widest">
                                                Voir le projet <ExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                            </div>
                                        </a>
                                    </div>
                                    
                                    <div className="text-sm text-white/40 leading-relaxed italic">
                                        Cette tâche est automatiquement synchronisée avec le flux de post-production. 
                                        Les modifications se font directement dans l'espace de travail du projet.
                                    </div>
                                </div>
                            ) : (
                                <textarea 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    onBlur={handleSaveDetails}
                                    rows={4}
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm text-white/70 focus:outline-none focus:border-indigo-500/30 transition-all placeholder:text-white/10 resize-none"
                                    placeholder="No description provided."
                                />
                            )}
                        </div>

                        {/* Subtasks */}
                        {!is_readonly && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-white/90 font-bold text-sm uppercase tracking-wider">
                                        <CheckSquare size={16} className="text-indigo-400" />
                                        Checklist
                                    </div>
                                    <div className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg">
                                        {progress}% Complete
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                    />
                                </div>

                                <div className="space-y-2 mt-4">
                                    {isLoadingSubtasks ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="animate-spin text-white/20" size={24} />
                                        </div>
                                    ) : (
                                        subtasks.map((st) => (
                                            <div key={st.id} className="flex items-center gap-3 group px-2 py-1.5 hover:bg-white/5 rounded-xl transition-colors">
                                                <button 
                                                    onClick={() => handleToggleSubtask(st)}
                                                    className={`transition-colors ${st.is_completed ? 'text-indigo-500' : 'text-white/20 hover:text-white/40'}`}
                                                >
                                                    {st.is_completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                                </button>
                                                <span className={`flex-1 text-sm transition-all ${st.is_completed ? 'text-white/30 line-through' : 'text-white/80'}`}>
                                                    {st.title}
                                                </span>
                                                <button 
                                                    onClick={() => handleDeleteSubtask(st.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 rounded-lg text-white/20 hover:text-red-400 transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))
                                    )}

                                    <form onSubmit={handleAddSubtask} className="flex items-center gap-3 mt-4 px-2">
                                        <Plus size={20} className="text-white/20" />
                                        <input 
                                            type="text"
                                            placeholder="Add a subtask..."
                                            value={newSubtaskTitle}
                                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                            className="flex-1 bg-transparent border-none text-sm text-white focus:outline-none placeholder:text-white/10"
                                        />
                                        {newSubtaskTitle.trim() && (
                                            <button 
                                                type="submit"
                                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase rounded-lg transition-all"
                                            >
                                                Add
                                            </button>
                                        )}
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
                        <div className="text-[10px] text-white/20 uppercase font-bold tracking-widest px-4">
                            ID: #{task.id}
                        </div>
                        {isSaving && (
                            <div className="flex items-center gap-2 text-[10px] text-indigo-400 font-bold uppercase animate-pulse pr-4">
                                <Loader2 size={12} className="animate-spin" /> Saving changes...
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
