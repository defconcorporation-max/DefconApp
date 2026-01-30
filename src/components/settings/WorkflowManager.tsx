'use client';

import { useState } from 'react';
import { PostProdTemplate } from '@/types';
import { createPostProdTemplate, updatePostProdTemplate, deletePostProdTemplate } from '@/app/post-prod-actions';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Edit2, Save, X, GripVertical, Check } from 'lucide-react';

export default function WorkflowManager({ templates }: { templates: PostProdTemplate[] }) {
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Form State
    const [formName, setFormName] = useState('');
    const [formTasks, setFormTasks] = useState<string[]>([]);

    const startCreating = () => {
        setFormName('');
        setFormTasks(['']);
        setIsCreating(true);
        setEditingId(null);
    };

    const startEditing = (template: PostProdTemplate) => {
        setFormName(template.name);
        setFormTasks([...template.tasks]);
        setEditingId(template.id);
        setIsCreating(true);
    };

    const cancelForm = () => {
        setIsCreating(false);
        setEditingId(null);
        setFormName('');
        setFormTasks([]);
    };

    const handleTaskChange = (index: number, value: string) => {
        const newTasks = [...formTasks];
        newTasks[index] = value;
        setFormTasks(newTasks);
    };

    const addTask = () => {
        setFormTasks([...formTasks, '']);
    };

    const removeTask = (index: number) => {
        setFormTasks(formTasks.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanTasks = formTasks.filter(t => t.trim() !== '');

        if (editingId) {
            await updatePostProdTemplate(editingId, formName, cleanTasks);
        } else {
            await createPostProdTemplate(formName, cleanTasks);
        }
        cancelForm();
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this workflow?')) {
            await deletePostProdTemplate(id);
        }
    };

    return (
        <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold">Post-Production Workflows</h2>
                    <p className="text-sm text-[var(--text-secondary)]">Manage templates for your post-production process.</p>
                </div>
                {!isCreating && (
                    <Button onClick={startCreating} size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                        <Plus size={16} className="mr-2" />
                        Add Workflow
                    </Button>
                )}
            </div>

            {isCreating ? (
                <form onSubmit={handleSubmit} className="bg-[#111] p-6 rounded-lg border border-[var(--border-subtle)] space-y-6 animate-in fade-in slide-in-from-top-2">
                    <div>
                        <label className="block text-sm font-bold text-[var(--text-tertiary)] uppercase mb-2">Workflow Name</label>
                        <input
                            type="text"
                            required
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            className="w-full bg-black border border-[var(--border-subtle)] rounded p-2 text-white focus:border-indigo-500 outline-none"
                            placeholder="e.g., Wedding Film, Corporate Promo"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[var(--text-tertiary)] uppercase mb-2">Workflow Steps (Tasks)</label>
                        <div className="space-y-2">
                            {formTasks.map((task, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <span className="text-[var(--text-tertiary)] font-mono text-xs w-6">{index + 1}.</span>
                                    <input
                                        type="text"
                                        value={task}
                                        onChange={(e) => handleTaskChange(index, e.target.value)}
                                        className="flex-1 bg-black border border-[var(--border-subtle)] rounded p-2 text-white text-sm focus:border-indigo-500 outline-none"
                                        placeholder={`Step ${index + 1}`}
                                        autoFocus={index === formTasks.length - 1}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeTask(index)}
                                        className="p-2 text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={addTask} className="mt-2 text-indigo-400 hover:text-indigo-300">
                            <Plus size={14} className="mr-1" /> Add Step
                        </Button>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                        <Button type="button" variant="ghost" onClick={cancelForm}>Cancel</Button>
                        <Button type="submit" className="bg-green-600 hover:bg-green-500 text-white">
                            <Save size={16} className="mr-2" />
                            {editingId ? 'Update Workflow' : 'Save Workflow'}
                        </Button>
                    </div>
                </form>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
                        <div key={template.id} className="bg-[#111] border border-[var(--border-subtle)] rounded-lg p-4 group hover:border-indigo-500/50 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-lg">{template.name}</h3>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => startEditing(template)}
                                        className="p-1.5 text-[var(--text-tertiary)] hover:text-white hover:bg-white/10 rounded"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        className="p-1.5 text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 rounded"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                {template.tasks.slice(0, 3).map((task, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
                                        <span className="truncate">{task}</span>
                                    </div>
                                ))}
                                {template.tasks.length > 3 && (
                                    <p className="text-xs text-[var(--text-tertiary)] pl-3.5 mt-1">
                                        +{template.tasks.length - 3} more steps
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                    {templates.length === 0 && (
                        <div className="col-span-full py-12 text-center text-[var(--text-tertiary)] border border-dashed border-[var(--border-subtle)] rounded-lg">
                            <p>No workflows created yet.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
