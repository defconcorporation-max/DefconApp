'use client';

import { useState } from 'react';
import { PostProdProject, PostProdTask, PostProdVersion } from '@/types';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, Circle, Clock, Upload, Play, FileText, Check, Film } from 'lucide-react';
import { togglePostProdTask, uploadVersion, completeProject } from '@/app/post-prod-actions';

interface Props {
    project: PostProdProject;
    tasks: PostProdTask[];
    versions: PostProdVersion[];
}

export default function PostProdWorkspace({ project, tasks, versions }: Props) {
    const [uploadMode, setUploadMode] = useState(false);

    // Optimistic UI for tasks could be added, but relying on server revalidate for simplicity in V1
    const completedCount = tasks.filter(t => t.is_completed).length;
    const progress = Math.round((completedCount / tasks.length) * 100);

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6 overflow-hidden">
            {/* LEFT: CHECKLIST */}
            <div className="w-full md:w-1/3 flex flex-col bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
                <div className="p-4 border-b border-[var(--border-subtle)] bg-[#111]">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="font-bold text-lg">Workflow</h2>
                        <span className="text-xs text-[var(--text-secondary)]">{completedCount}/{tasks.length}</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                        <div
                            className="bg-indigo-500 h-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {tasks.map((task) => (
                        <button
                            key={task.id}
                            onClick={() => togglePostProdTask(task.id, task.is_completed, project.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${task.is_completed
                                ? 'bg-indigo-500/10 text-indigo-200'
                                : 'hover:bg-white/5 text-[var(--text-secondary)]'
                                }`}
                        >
                            {task.is_completed
                                ? <CheckCircle2 size={20} className="text-indigo-400" />
                                : <Circle size={20} className="text-[var(--text-tertiary)]" />
                            }
                            <span className={task.is_completed ? 'line-through opacity-70' : ''}>
                                {task.title}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-[var(--border-subtle)] bg-[#111]">
                    <form action={completeProject.bind(null, project.id)}>
                        <Button
                            className="w-full bg-green-600 hover:bg-green-500 text-white"
                            disabled={progress < 100 || project.status === 'Completed'}
                        >
                            <Check size={18} className="mr-2" />
                            Mark Project Complete
                        </Button>
                    </form>
                </div>
            </div>

            {/* RIGHT: VERSIONS & PLAYER */}
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto">
                {/* LATEST VERSION PLAYER */}
                <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="font-bold text-xl">Latest Cut</h2>
                            <p className="text-sm text-[var(--text-secondary)]">
                                {versions.length > 0 ? `Version ${versions[0].version_number}` : 'No versions uploaded'}
                            </p>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => setUploadMode(!uploadMode)}>
                            <Upload size={16} className="mr-2" />
                            Upload New Version
                        </Button>
                    </div>

                    {uploadMode && (
                        <div className="bg-[#151515] p-4 rounded-lg border border-dashed border-[var(--border-subtle)] animate-in fade-in slide-in-from-top-2">
                            <form action={async (formData) => {
                                await uploadVersion(formData);
                                setUploadMode(false);
                            }} className="space-y-3">
                                <input type="hidden" name="projectId" value={project.id} />
                                <div>
                                    <label className="text-xs uppercase font-bold text-[var(--text-tertiary)]">Video URL (Frame.io / Vimeo)</label>
                                    <input name="url" type="url" required placeholder="https://..." className="w-full bg-black border border-[var(--border-subtle)] rounded p-2 text-white mt-1" />
                                </div>
                                <div>
                                    <label className="text-xs uppercase font-bold text-[var(--text-tertiary)]">Change Notes</label>
                                    <textarea name="notes" placeholder="Added VFX, fixed color..." className="w-full bg-black border border-[var(--border-subtle)] rounded p-2 text-white mt-1 h-20" />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setUploadMode(false)}>Cancel</Button>
                                    <Button type="submit" size="sm" className="bg-indigo-600 text-white">Save Version</Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {versions.length > 0 ? (
                        <div className="aspect-video bg-black rounded-lg flex items-center justify-center border border-[var(--border-subtle)] relative group cursor-pointer overflow-hidden">
                            {/* Placeholder for iframe or video tag using the URL */}
                            {versions[0].video_url.includes('youtube') || versions[0].video_url.includes('vimeo') ? (
                                <iframe src={versions[0].video_url} className="w-full h-full" allowFullScreen />
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    <Play size={48} className="text-white opacity-50 group-hover:opacity-100 transition-opacity" />
                                    <a href={versions[0].video_url} target="_blank" className="text-indigo-400 hover:underline">
                                        Open External Link
                                    </a>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="aspect-video bg-[#111] rounded-lg flex flex-col items-center justify-center text-[var(--text-tertiary)] border border-dashed border-[var(--border-subtle)]">
                            <Film size={48} className="mb-4 opacity-20" />
                            <p>Waiting for first cut...</p>
                        </div>
                    )}
                </div>

                {/* VERSION HISTORY */}
                <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-6">
                    <h3 className="font-bold text-sm uppercase text-[var(--text-tertiary)] mb-4">Version History</h3>
                    <div className="space-y-4">
                        {versions.map((ver) => (
                            <div key={ver.id} className="flex gap-4 p-4 bg-[#111] rounded-lg border border-[var(--border-subtle)]">
                                <div className="w-12 h-12 bg-black rounded flex items-center justify-center font-bold text-xl text-[var(--text-secondary)]">
                                    v{ver.version_number}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-white">Version {ver.version_number}</h4>
                                        <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                                            <Clock size={12} />
                                            {new Date(ver.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[var(--text-secondary)] mt-1">{ver.notes || 'No notes provided.'}</p>
                                    <a href={ver.video_url} target="_blank" className="text-xs text-indigo-400 hover:underline mt-2 inline-block">
                                        View Link
                                    </a>
                                </div>
                            </div>
                        ))}
                        {versions.length === 0 && <p className="text-sm text-[var(--text-tertiary)] italic">No history yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}


