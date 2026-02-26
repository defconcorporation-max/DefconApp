import { getProjectById, getProjectShoots, getTeamMembers, getClient, getProjectTasks, getTaskStages, getShootVideos, getAgencies, getProjectPostProdWorkflows } from '@/app/actions';
import { Project, Shoot, ProjectTask, TaskStage, Client } from '@/types';
import Link from 'next/link';
import { ArrowLeft, Calendar, Activity, Video, DollarSign } from 'lucide-react';
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

    // Aggregate Post Production modules
    const postProdWorkflows = await getProjectPostProdWorkflows(projectId);

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

                    {/* Financials Overview */}
                    <div className="pro-dashboard-card p-6 rounded-2xl">
                        <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                            <DollarSign size={16} className="text-emerald-400" /> Financials
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Total Revenue</div>
                                <div className="text-2xl font-bold text-white">${project.total_revenue?.toLocaleString() || '0'}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Total Cost</div>
                                    <div className="text-lg font-medium text-[var(--text-secondary)]">${project.total_cost?.toLocaleString() || '0'}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Gross Margin</div>
                                    <div className={`text-lg font-medium ${(project.total_margin || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        ${project.total_margin?.toLocaleString() || '0'}
                                    </div>
                                </div>
                            </div>
                            <div className="pt-3 border-t border-[var(--border-subtle)] flex justify-between items-center">
                                <span className="text-xs text-[var(--text-tertiary)]">Margin %</span>
                                <span className={`text-sm font-bold ${(project.margin_percentage || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {project.margin_percentage ? Math.round(project.margin_percentage) : 0}%
                                </span>
                            </div>
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

                    {/* Bottom Row: Post Production Tracking */}
                    <div className="pro-dashboard-card p-6 rounded-2xl flex flex-col">
                        <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-6 flex items-center gap-2">
                            <Layers size={16} className="text-pink-400" /> Post-Production Status
                        </h3>
                        <div className="pr-2">
                            {postProdWorkflows.length === 0 ? (
                                <div className="text-sm text-[var(--text-tertiary)] text-center py-10 bg-[#0A0A0A] rounded-xl border border-[var(--border-subtle)]">
                                    No post-production workflows active for this project's shoots.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {postProdWorkflows.map(workflow => (
                                        <Link key={workflow.id} href={`/post-production/${workflow.id}`} className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-4 hover:border-violet-500/50 transition-colors group flex justify-between items-center">
                                            <div>
                                                <h4 className="font-bold text-white text-sm group-hover:text-violet-300 transition-colors">{workflow.shoot_title || 'Untitled Shoot'}</h4>
                                                <p className="text-xs text-[var(--text-tertiary)] mt-1">Template: {workflow.template_name}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${workflow.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                                    workflow.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-400' :
                                                        'bg-white/10 text-[var(--text-tertiary)]'
                                                    }`}>
                                                    {workflow.status}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 w-24 bg-gray-700 rounded-full overflow-hidden">
                                                        <div className="h-full bg-violet-500 transition-all duration-500" style={{ width: `${workflow.progress}%` }}></div>
                                                    </div>
                                                    <span className="text-xs text-[var(--text-tertiary)]">{workflow.progress}%</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
}
