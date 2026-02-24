import { getProjectById, getProjectShoots, getTeamMembers, getClient, getProjectTasks, getTaskStages, getShootVideos, getAgencies } from '@/app/actions';
import { Project, Shoot, ProjectTask, TaskStage, Client } from '@/types';
import Link from 'next/link';
import { ArrowLeft, Calendar, Activity, Video } from 'lucide-react';
import ProjectTitleEditor from '@/components/ProjectTitleEditor';
import StatusSelector from '@/components/ProjectStatusSelect';
import ClientAgencySelect from '@/components/ClientAgencySelect';
import ShootManager from '@/components/ShootManager';
import EmptyState from '@/components/EmptyState';
import ProjectTaskManager from '@/components/ProjectTaskManager';
import { Layers } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const projectId = Number(id);
    const project = await getProjectById(projectId) as Project & { client_company: string };

    if (!project) {
        return (
            <main className="min-h-screen p-8 text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Project Not Found</h1>
                    <Link href="/" className="text-violet-400 hover:text-violet-300">Return to Dashboard</Link>
                </div>
            </main>
        );
    }

    const shoots = await getProjectShoots(projectId) as Shoot[];
    const client = await getClient(project.client_id) as Client;
    const tasks = await getProjectTasks(projectId) as ProjectTask[];
    const stages = await getTaskStages() as TaskStage[];
    const teamMembers = await getTeamMembers();

    const agencies = await getAgencies();

    // Fetch videos for ShootManager
    const videosMap: Record<number, any[]> = {};
    for (const shoot of shoots) {
        videosMap[shoot.id] = await getShootVideos(shoot.id);
    }

    // Calculate Completion for Overview
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.is_completed).length;
    const taskProgress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    return (
        <main className="min-h-screen p-8 bg-[var(--bg-root)] text-white pb-20">
            <header className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <Link href={`/clients/${project.client_id}`} className="text-[var(--text-tertiary)] hover:text-white transition-colors flex items-center gap-2 text-sm font-mono">
                        <ArrowLeft size={16} /> Back to Client
                    </Link>
                </div>
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-xs text-violet-400 font-bold uppercase tracking-wider mb-1">{project.client_company}</div>
                        <ProjectTitleEditor projectId={project.id} initialTitle={project.title} />
                        <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mt-2">
                            <span className="flex items-center gap-1"><Calendar size={14} /> Created: {new Date(project.created_at).toLocaleDateString()}</span>
                            {project.due_date && (
                                <span className="flex items-center gap-1 text-red-400 font-medium">
                                    Due: {new Date(project.due_date).toLocaleDateString()}
                                </span>
                            )}
                            {project.agency_name && (
                                <span
                                    className="px-2 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider"
                                    style={{
                                        backgroundColor: `${project.agency_color}20`,
                                        color: project.agency_color,
                                        borderColor: `${project.agency_color}30`
                                    }}
                                >
                                    {project.agency_name}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* UNIFIED DASHBOARD GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* --- LEFT COLUMN: Meta & Progress --- */}
                <div className="xl:col-span-1 space-y-6">
                    {/* Status & Meta */}
                    <div className="pro-dashboard-card p-6 rounded-2xl">
                        <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Activity size={16} className="text-violet-400" /> Project Status
                        </h3>
                        <div className="mb-4">
                            <StatusSelector projectId={project.id} currentStatus={project.status} />
                        </div>
                        <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2 text-sm text-[var(--text-secondary)]">
                            <div className="flex justify-between items-center">
                                <span>Agency:</span>
                                <span>{project.agency_name || 'Direct'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Deliverables Progress */}
                    <div className="pro-dashboard-card p-6 rounded-2xl">
                        <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Deliverables Progress</h3>
                        <div className="text-4xl font-bold mb-2 font-mono flex items-end gap-2">
                            {taskProgress}%
                            <span className="text-sm font-normal text-[var(--text-tertiary)] mb-1.5">completed</span>
                        </div>
                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${taskProgress}%` }}></div>
                        </div>
                        <div className="mt-4 text-xs text-[var(--text-tertiary)] flex justify-between">
                            <span>{completedTasks} done</span>
                            <span>{totalTasks - completedTasks} remaining</span>
                        </div>
                    </div>

                </div>

                {/* --- MIDDLE & RIGHT COLUMN: Shoots, Services, Tasks --- */}
                <div className="xl:col-span-2 space-y-6">

                    {/* Top Row: Production & Tasks */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Production Schedule */}
                        <div className="pro-dashboard-card p-6 rounded-2xl flex flex-col min-h-[400px]">
                            <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-6 flex items-center gap-2">
                                <Video size={16} className="text-indigo-400" /> Production Schedule
                            </h3>
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                <ShootManager clientId={project.client_id} shoots={shoots} videosMap={videosMap} projectId={project.id} />
                            </div>
                        </div>

                        {/* Task Manager */}
                        <div className="pro-dashboard-card p-6 rounded-2xl flex flex-col min-h-[400px]">
                            <ProjectTaskManager projectId={project.id} tasks={tasks} stages={stages} teamMembers={teamMembers} />
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
}
