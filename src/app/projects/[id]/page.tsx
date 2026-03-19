import { getProjectById, getProjectShoots, getTeamMembers, getClient, getProjectTasks, getTaskStages, getShootVideos, getAgencies, getProjectPostProdWorkflows, getProjectServices, getSettings, getProjectCosts } from '@/app/actions';
import { Project, Shoot, ProjectTask, TaskStage, Client } from '@/types';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import ProjectTitleEditor from '@/components/ProjectTitleEditor';
import ProjectDetailTabs from '@/components/project/ProjectDetailTabs';
import PageLayout from '@/components/layout/PageLayout';

export const dynamic = 'force-dynamic';

export default async function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const projectId = Number(id);
    const project = await getProjectById(projectId) as Project & { client_company: string; agency_name?: string; agency_color?: string };

    if (!project) {
        return (
            <PageLayout title="Projet introuvable" breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Projects', href: '/projects' }]}>
                <div className="text-center py-12">
                    <p className="text-[var(--text-tertiary)] mb-4">Ce projet n’existe pas ou a été supprimé.</p>
                    <Link href="/projects" className="text-violet-400 hover:text-violet-300">Retour aux projets</Link>
                </div>
            </PageLayout>
        );
    }

    const [shoots, client, tasks, stages, teamMembers, services, settings, projectCosts, agencies, postProdWorkflows] = await Promise.all([
        getProjectShoots(projectId),
        getClient(project.client_id),
        getProjectTasks(projectId),
        getTaskStages(),
        getTeamMembers(),
        getProjectServices(projectId),
        getSettings(),
        getProjectCosts(projectId),
        getAgencies(),
        getProjectPostProdWorkflows(projectId),
    ]);

    const videosMap: Record<number, any[]> = {};
    for (const shoot of shoots as Shoot[]) {
        videosMap[shoot.id] = await getShootVideos(shoot.id);
    }

    const clientData = client as Client;
    const tasksData = tasks as ProjectTask[];
    const stagesData = stages as TaskStage[];

    return (
        <PageLayout
            breadcrumbs={[
                { label: 'Dashboard', href: '/' },
                { label: 'Clients', href: '/clients' },
                { label: project.client_company || 'Client', href: `/clients/${project.client_id}` },
                { label: project.title, href: `/projects/${project.id}` },
            ]}
            title={project.title}
            subtitle={
                <span className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-tertiary)]">
                    <span className="flex items-center gap-1"><Calendar size={14} /> Créé le {new Date(project.created_at).toLocaleDateString()}</span>
                    {project.due_date && (
                        <span className="text-red-400 font-medium">Échéance : {new Date(project.due_date).toLocaleDateString()}</span>
                    )}
                    {project.agency_name && (
                        <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider"
                            style={{
                                backgroundColor: `${(project as any).agency_color || '#6366f1'}20`,
                                color: (project as any).agency_color || '#6366f1',
                                borderColor: `${(project as any).agency_color || '#6366f1'}30`,
                            }}
                        >
                            {project.agency_name}
                        </span>
                    )}
                </span>
            }
            actions={
                <Link href={`/clients/${project.client_id}`} className="text-sm text-[var(--text-tertiary)] hover:text-white shrink-0">
                    ← Retour au client
                </Link>
            }
        >
            <div className="flex items-center gap-4 mb-6">
                <ProjectTitleEditor projectId={project.id} initialTitle={project.title} />
            </div>
            <ProjectDetailTabs
                project={project as any}
                client={clientData}
                shoots={shoots as Shoot[]}
                tasks={tasksData}
                stages={stagesData}
                teamMembers={teamMembers}
                services={services}
                settings={settings}
                projectCosts={projectCosts}
                videosMap={videosMap}
                postProdWorkflows={postProdWorkflows as any[]}
            />
        </PageLayout>
    );
}
