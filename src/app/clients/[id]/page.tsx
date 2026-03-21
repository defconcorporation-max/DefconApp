import { getClient, getProjects, getSocials, getIdeas, getCommissions, getPayments, getCredentials, getAgencies, getShoots, getShootVideos, getPipelineStages, getTeamMembers } from '@/app/actions';
export const dynamic = 'force-dynamic';
import { getSocialAccounts, getSocialPosts } from '@/app/social-actions';
import FolderButton from '@/components/FolderButton';
import { ClientSettingsButton } from '@/components/ClientSettingsModal';
import Link from 'next/link';
import ClientTabs from '@/components/ClientTabs';
import ClientAvatar from '@/components/ClientAvatar';
import ClientValue from '@/components/ClientValue';
import { auth } from '@/auth';
import PageLayout from '@/components/layout/PageLayout';

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const clientId = Number(id);

    // Parallel fetch — all independent queries run at the same time
    const [client, socials, ideas, commissions, payments, credentials, projects, agencies, pipelineStages, socialAccounts, socialPosts, shoots, teamMembers, session] = await Promise.all([
        getClient(clientId),
        getSocials(clientId),
        getIdeas(clientId),
        getCommissions(clientId),
        getPayments(clientId),
        getCredentials(clientId),
        getProjects(clientId),
        getAgencies(),
        getPipelineStages(),
        getSocialAccounts(clientId),
        getSocialPosts(clientId),
        getShoots(clientId),
        getTeamMembers(),
        auth(),
    ]);

    const isAdmin = session?.user?.role === 'Admin';

    if (!client) return <div>Client not found</div>;

    // Fetch videos per shoot (depends on shoots result)
    const videosMap: Record<number, any[]> = {};
    const videoResults = await Promise.all(
        shoots.map((shoot: any) => getShootVideos(shoot.id))
    );
    shoots.forEach((shoot: any, i: number) => {
        videosMap[shoot.id] = videoResults[i];
    });

    return (
        <PageLayout
            breadcrumbs={[
                { label: 'Dashboard', href: '/' },
                { label: 'Clients', href: '/clients' },
                { label: client.company_name || 'Client' }
            ]}
            title={client.company_name}
            subtitle={
                <div className="flex items-center gap-3 mt-1">
                    <ClientAvatar client={client} />
                    <div className="flex items-center gap-2">
                        <span className="pro-badge text-[10px] py-0.5">{client.plan}</span>
                        <ClientValue client={client} isAdmin={isAdmin} />
                    </div>
                </div>
            }
            actions={
                <div className="flex items-center gap-3">
                    <FolderButton folderPath={client.folder_path} />
                    <div className="w-px h-4 bg-[var(--border-subtle)]"></div>
                    <ClientSettingsButton client={client} agencies={agencies} pipelineStages={pipelineStages} />
                </div>
            }
        >
            <div>
                <ClientTabs
                    client={client}
                    projects={projects}
                    agencies={agencies}
                    socials={socials}
                    ideas={ideas}
                    commissions={commissions}
                    payments={payments}
                    credentials={credentials}
                    socialAccounts={socialAccounts}
                    socialPosts={socialPosts}
                    shoots={shoots as any[]}
                    videosMap={videosMap}
                    teamMembers={teamMembers}
                />
            </div>
        </PageLayout>
    )
}
