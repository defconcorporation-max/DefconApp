import { getProject, getProjectShoots, getProjectServices, getServices, getCommissions, getSettings, getTeamMembers, getClient, getProjectTasks, getTaskStages, getShootVideos } from '@/app/actions';
import { Project, Shoot, Service, ProjectService, ProjectTask, TaskStage, Client } from '@/types';
import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';
import ProjectTitleEditor from '@/components/ProjectTitleEditor';
import ProjectTabs from '@/components/ProjectTabs';

export const dynamic = 'force-dynamic';

export default async function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const projectId = Number(id);
    const project = await getProject(projectId) as Project & { client_company: string };

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
    const projectServices = await getProjectServices(projectId) as ProjectService[];
    const catalogServices = await getServices() as Service[];
    const commissions = await getCommissions(projectId, 'project');
    const settingsRaw = await getSettings();
    const settings = settingsRaw || { id: 0, tax_tps_rate: 5, tax_tvq_rate: 9.975 };
    const teamMembers = await getTeamMembers();

    const client = await getClient(project.client_id) as Client;
    const tasks = await getProjectTasks(projectId) as ProjectTask[];
    const stages = await getTaskStages() as TaskStage[];

    // Fetch videos for ShootManager
    const videosMap: Record<number, any[]> = {};
    for (const shoot of shoots) {
        videosMap[shoot.id] = await getShootVideos(shoot.id);
    }

    // Calculate Total Value
    const servicesTotal = projectServices.reduce((acc, curr) => acc + (curr.rate * curr.quantity), 0);
    const totalValue = servicesTotal;

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
                        <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                            <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(project.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </header>

            <ProjectTabs
                project={project}
                client={client}
                shoots={shoots}
                projectServices={projectServices}
                catalogServices={catalogServices}
                commissions={commissions}
                settings={settings}
                teamMembers={teamMembers}
                tasks={tasks}
                stages={stages}
                videosMap={videosMap}
                totalValue={totalValue}
            />
        </main>
    );
}
