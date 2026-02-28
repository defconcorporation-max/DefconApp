import { getSettings, getTaskStages, getPipelineStages } from '@/app/actions';
import { getPostProdTemplates } from '@/app/post-prod-actions';
import SettingsForm from '@/components/SettingsForm';
import TaskStageManager from '@/components/TaskStageManager';
import WorkflowManager from '@/components/settings/WorkflowManager';
import PipelineStagesManager from '@/components/settings/PipelineStagesManager';
import SalesPlaybookWrapper from '@/components/settings/SalesPlaybookWrapper';
import Link from 'next/link';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';


export const dynamic = 'force-dynamic';

export default async function Page() {
    const session = await auth();
    if (!session) redirect('/login');
    const role = session.user?.role;
    if (role !== 'Admin' && role !== 'Team') redirect('/');
    const [settings, stages, templates, pipelineStages] = await Promise.all([
        getSettings(),
        getTaskStages(),
        getPostProdTemplates(),
        getPipelineStages(),
    ]);

    return (
        <div className="flex">
            {/* Simple Sidebar override/wrapper if needed or just content */}
            <div className="flex-1">
                <header className="p-4 border-b border-[var(--border-subtle)] flex items-center gap-4">
                    <Link href="/" className="text-[var(--text-tertiary)] hover:text-white transition-colors font-mono text-sm">
                        ← BACK TO DASHBOARD
                    </Link>
                </header>
                <div className="p-4 md:p-8 pb-20 max-w-4xl mx-auto space-y-8">
                    {/* Navigation Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link href="/services" className="bg-[#0A0A0A] border border-[var(--border-subtle)] p-6 rounded-xl hover:border-violet-500/30 hover:bg-violet-500/5 transition-all group">
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-violet-400">Services Catalog</h3>
                            <p className="text-sm text-[var(--text-secondary)]">Manage your service offerings, rates, and types.</p>
                        </Link>
                        <Link href="/agencies" className="bg-[#0A0A0A] border border-[var(--border-subtle)] p-6 rounded-xl hover:border-violet-500/30 hover:bg-violet-500/5 transition-all group">
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-violet-400">Agencies</h3>
                            <p className="text-sm text-[var(--text-secondary)]">Manage client agencies and their color codes.</p>
                        </Link>
                        <SalesPlaybookWrapper />
                    </div>

                    <WorkflowManager templates={templates} />
                    <PipelineStagesManager stages={pipelineStages} />
                    <TaskStageManager stages={stages} />
                    <SettingsForm settings={settings || { tax_tps_rate: 5.0, tax_tvq_rate: 9.975 }} />
                </div>
            </div>
        </div>
    );
}
