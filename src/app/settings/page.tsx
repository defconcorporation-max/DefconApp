import { getSettings, getTaskStages } from '@/app/actions';
import SettingsForm from '@/components/SettingsForm';
import TaskStageManager from '@/components/TaskStageManager';
import Link from 'next/link';

export default async function Page() {
    const settings = await getSettings();
    const stages = await getTaskStages();

    return (
        <div className="flex">
            {/* Simple Sidebar override/wrapper if needed or just content */}
            <div className="flex-1">
                <header className="p-4 border-b border-[var(--border-subtle)] flex items-center gap-4">
                    <Link href="/" className="text-[var(--text-tertiary)] hover:text-white transition-colors font-mono text-sm">
                        ← BACK TO DASHBOARD
                    </Link>
                </header>
                <div className="p-8 max-w-4xl mx-auto space-y-8">
                    <TaskStageManager stages={stages} />
                    <SettingsForm settings={settings || { tax_tps_rate: 5.0, tax_tvq_rate: 9.975 }} />
                </div>
            </div>
        </div>
    );
}
