'use client';

import { createProject } from '@/app/actions';
import { Project } from '@/types';
import Link from 'next/link';
import { Building } from 'lucide-react';

export default function ProjectManager({ clientId, projects, agencies = [] }: { clientId: number, projects: any[], agencies?: { id: number, name: string, color: string }[] }) {
    return (
        <div className="glass-panel p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-6 relative">
                <h3 className="text-xl font-bold neo-gradient-text">Active Projects</h3>
                <Link href="/agencies" className="text-xs flex items-center gap-1 text-[var(--text-tertiary)] hover:text-white transition-colors">
                    <Building size={12} />
                    Manage Agencies
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {projects.map(project => (
                    <Link href={`/projects/${project.id}`} key={project.id}>
                        <div className="bg-black/30 border border-white/10 rounded-xl p-5 hover:bg-white/5 hover:border-violet-500/30 transition-all group cursor-pointer h-full flex flex-col justify-between relative">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex gap-2">
                                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${project.status === 'Completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                            project.status === 'Archived' ? 'bg-gray-500/10 border-gray-500/20 text-gray-400' :
                                                'bg-violet-500/10 border-violet-500/20 text-violet-400'
                                            }`}>
                                            {project.status || 'Active'}
                                        </span>
                                        {(project.agency_name || project.label_name) && (
                                            <span
                                                className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/10"
                                                style={{
                                                    backgroundColor: `${project.agency_color || project.label_color}20`,
                                                    color: project.agency_color || project.label_color,
                                                    borderColor: `${project.agency_color || project.label_color}30`
                                                }}
                                            >
                                                {project.agency_name || project.label_name}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-500">{new Date(project.created_at).toLocaleDateString()}</span>
                                </div>
                                <h4 className="font-bold text-lg text-white mb-1 group-hover:text-violet-400 transition-colors">
                                    {project.title}
                                </h4>
                                {project.due_date && (
                                    <p className="text-xs text-red-400 mt-1">Due: {new Date(project.due_date).toLocaleDateString()}</p>
                                )}
                            </div>
                            <div className="absolute top-5 right-5 text-right">
                                <span className="block text-2xl font-bold text-white">${(project.total_value || 0).toLocaleString()}</span>
                            </div>

                            <div className="mt-4 flex gap-4 text-xs text-gray-400 border-t border-white/5 pt-3">
                                <span>{project.shoot_count || 0} Shoots</span>
                                <span>{project.service_count || 0} Services</span>
                            </div>
                        </div>
                    </Link>
                ))}

                {projects.length === 0 && (
                    <div className="col-span-full py-8 text-center text-gray-500 border border-white/5 rounded-xl border-dashed">
                        No projects started yet.
                    </div>
                )}
            </div>

            <form action={createProject} className="border-t border-white/10 pt-6">
                <h4 className="text-sm font-medium mb-3 text-gray-300">Start New Project</h4>
                <input type="hidden" name="clientId" value={clientId} />
                <div className="flex flex-col md:flex-row gap-2 items-end">
                    <input name="title" placeholder="Project Title (e.g. Summer Campaign '26)" className="bg-black/40 border border-white/10 p-2 rounded text-sm flex-1 focus:outline-none focus:border-violet-500 text-white w-full" required />

                    <div className="flex gap-2 w-full md:w-auto">
                        <input type="date" name="dueDate" className="bg-black/40 border border-white/10 p-2 rounded text-sm text-gray-400 focus:text-white color-scheme-dark" />

                        <button className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors whitespace-nowrap">Create</button>
                    </div>
                </div>
            </form>
        </div>
    );
}
