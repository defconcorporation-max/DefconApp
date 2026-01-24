import { getClient, getSocials, getIdeas, getCommissions, getShoots, getShootVideos, getPayments, getCredentials, getProjects } from '@/app/actions';
import SocialLinks from '@/components/SocialLinks';
import IdeaBox from '@/components/IdeaBox';
import CommissionCalculator from '@/components/CommissionCalculator';
import ProjectManager from '@/components/ProjectManager';
import PaymentTracker from '@/components/PaymentTracker';
import CredentialsBox from '@/components/CredentialsBox';
import FolderButton from '@/components/FolderButton';
import { ClientSettingsButton } from '@/components/ClientSettingsModal';
import Link from 'next/link';
import { Project } from '@/types';

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const clientId = Number(id);
    const client = await getClient(clientId);
    const socials = await getSocials(clientId);
    const ideas = await getIdeas(clientId);
    const commissions = await getCommissions(clientId);
    const payments = await getPayments(clientId);
    const credentials = await getCredentials(clientId);

    // Fetch Projects instead of raw shoots
    const projects = await getProjects(clientId);

    if (!client) return <div>Client not found</div>;

    return (
        <main className="min-h-screen pb-20">
            {/* Header */}
            <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-root)] sticky top-0 z-50">
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
                        <ClientSettingsButton client={client} />
                    </div>
                </div>
            </header>

            <div className="pro-container pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Sidebar (3Cols) */}
                <div className="lg:col-span-3 space-y-8">
                    {/* Client Meta */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-mono uppercase text-[var(--text-tertiary)] ml-1">Properties</h3>
                        <div className="space-y-0.5">
                            <div className="flex justify-between items-center p-2 rounded hover:bg-[var(--bg-surface)] text-sm group cursor-default">
                                <span className="text-[var(--text-secondary)]">Status</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    <span className="text-[var(--text-primary)]">{client.status}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-2 rounded hover:bg-[var(--bg-surface)] text-sm group cursor-default">
                                <span className="text-[var(--text-secondary)]">Total Revenue</span>
                                <span className="text-white font-bold">${projects.reduce((sum, p) => sum + (p.total_value || 0), 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 rounded hover:bg-[var(--bg-surface)] text-sm group cursor-default">
                                <span className="text-[var(--text-secondary)]">Contact</span>
                                <span className="text-[var(--text-primary)]">{client.name}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 rounded hover:bg-[var(--bg-surface)] text-sm group cursor-default">
                                <span className="text-[var(--text-secondary)]">Joined</span>
                                <span className="text-[var(--text-primary)] font-mono text-xs">{new Date(client.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-[var(--border-subtle)]"></div>

                    <SocialLinks clientId={client.id} socials={socials} />

                    <div className="h-px bg-[var(--border-subtle)]"></div>

                    <CredentialsBox clientId={client.id} credentials={credentials} />

                    <div className="h-px bg-[var(--border-subtle)]"></div>

                    <PaymentTracker clientId={client.id} payments={payments} />


                </div>

                {/* Main Content (9Cols) */}
                <div className="lg:col-span-9 space-y-8">
                    {/* Project Manager Replaces Shoot Manager */}
                    <ProjectManager clientId={client.id} projects={projects} />

                    {/* Idea Box */}
                    <IdeaBox clientId={client.id} ideas={ideas} />
                </div>
            </div>
        </main>
    )
}
