import { getClient, getProjects, getSocials, getIdeas, getCommissions, getPayments, getCredentials, getAgencies, getShoots, getShootVideos, getPipelineStages } from '@/app/actions';
export const dynamic = 'force-dynamic';
import { getSocialAccounts, getSocialPosts } from '@/app/social-actions';
import FolderButton from '@/components/FolderButton';
import { ClientSettingsButton } from '@/components/ClientSettingsModal';
import Link from 'next/link';
import ClientTabs from '@/components/ClientTabs';
import ClientAvatar from '@/components/ClientAvatar';
import ClientValue from '@/components/ClientValue';
import { auth } from '@/auth';



export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const clientId = Number(id);

    // Parallel fetch — all independent queries run at the same time
    const [client, socials, ideas, commissions, payments, credentials, projects, agencies, pipelineStages, socialAccounts, socialPosts, shoots, session] = await Promise.all([
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
        <main className="min-h-screen pb-20">
            {/* Header */}
            <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-root)] sticky top-0 z-50 mb-8">
                <div className="pro-container h-16 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="text-[var(--text-tertiary)] hover:text-white transition-colors font-mono text-sm">
                            ← BACK
                        </Link>
                        <div className="h-4 w-px bg-[var(--border-subtle)]"></div>
                        <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <ClientAvatar client={client} />

                            <div className="flex flex-col">
                                <h1 className="text-sm font-bold tracking-wide uppercase leading-tight">{client.company_name}</h1>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="pro-badge text-[10px] py-0.5">{client.plan}</span>
                                    {/* Client Value (Admin Only) */}
                                    <ClientValue client={client} isAdmin={isAdmin} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <FolderButton folderPath={client.folder_path} />
                        <div className="w-px h-4 bg-[var(--border-subtle)]"></div>
                        <ClientSettingsButton client={client} agencies={agencies} pipelineStages={pipelineStages} />
                    </div>
                </div>
            </header>

            <div className="pro-container">
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
                />
            </div>
        </main>
    )
}
