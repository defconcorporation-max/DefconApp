import { getClient, getProjects, getSocials, getIdeas, getCommissions, getPayments, getCredentials, getProjectLabels } from '@/app/actions';
export const dynamic = 'force-dynamic';
import { getSocialAccounts, getSocialPosts } from '@/app/social-actions';
import FolderButton from '@/components/FolderButton';
import { ClientSettingsButton } from '@/components/ClientSettingsModal';
import Link from 'next/link';
import ClientTabs from '@/components/ClientTabs';



export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const clientId = Number(id);
    const client = await getClient(clientId);
    const socials = await getSocials(clientId); // Legacy simple links
    const ideas = await getIdeas(clientId);
    const commissions = await getCommissions(clientId);
    const payments = await getPayments(clientId);
    const credentials = await getCredentials(clientId);

    // Fetch Projects instead of raw shoots
    const projects = await getProjects(clientId);
    const projectLabels = await getProjectLabels();

    // Fetch New Social Media Data
    const socialAccounts = await getSocialAccounts(clientId);
    const socialPosts = await getSocialPosts(clientId);

    if (!client) return <div>Client not found</div>;

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
                            <h1 className="text-sm font-bold tracking-wide uppercase">{client.company_name}</h1>
                            <span className="pro-badge">{client.plan}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <FolderButton folderPath={client.folder_path} />
                        <div className="w-px h-4 bg-[var(--border-subtle)]"></div>
                        <ClientSettingsButton client={client} labels={projectLabels} />
                    </div>
                </div>
            </header>

            <div className="pro-container">
                <ClientTabs
                    client={client}
                    projects={projects}
                    projectLabels={projectLabels}
                    socials={socials}
                    ideas={ideas}
                    commissions={commissions}
                    payments={payments}
                    credentials={credentials}
                    socialAccounts={socialAccounts}
                    socialPosts={socialPosts}
                />
            </div>
        </main>
    )
}
